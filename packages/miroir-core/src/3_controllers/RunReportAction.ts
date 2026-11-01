import { entityQueryVersion, entityReport } from "miroir-app-miroir";
import type {
  ApplicationSection,
  BoxedQueryWithExtractorCombinerTransformer,
  ExtractorOrCombiner,
  RunBoxedQueryAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2Error, Domain2ElementFailed } from "../0_interfaces/2_domain/DomainElement";
import type {
  ActionImplementationContext,
  ActionImplementationHandler,
  DomainControllerActionHost,
} from "../0_interfaces/3_controllers/DomainControllerActionHost";
import { defaultMiroirModelEnvironment, devDataEntityUuids, getApplicationSection } from "../1_core/Model";
import { innermostFailureMessage } from "../2_domain/AsyncQuerySelectors";
import { mergeReportData, reportDataParts, type ReportDataPart } from "../2_domain/ReportData";
import { resolveQueryTemplateWithExtractorCombinerTransformer } from "../2_domain/Templates";

/** Payload of the runReportAction action (#562), as its implementation reads it. */
export type RunReportAction = {
  actionType: "runReportAction";
  actionLabel?: string;
  endpoint: string;
  payload: {
    application: string;
    report: string;
    parameters?: Record<string, any>;
  };
};

/**
 * The message of a failed query. A failed runtime transformer's own message already names it and its innermost
 * failure (#559); the server's persistence store hands it back as an Action2Error whose message is that failure
 * serialized.
 */
function failureMessage(failure: any): string {
  if (typeof failure?.failureMessage == "string") {
    return failure.failureMessage;
  }
  if (typeof failure?.innerError?.failureMessage == "string") {
    return failure.innerError.failureMessage;
  }
  if (typeof failure?.errorMessage == "string") {
    try {
      const serialized = JSON.parse(failure.errorMessage);
      if (typeof serialized?.failureMessage == "string") {
        return serialized.failureMessage;
      }
    } catch {
      // not a serialized failure
    }
    return failure.errorMessage;
  }
  return innermostFailureMessage(failure);
}

/** A Domain2ElementFailed, or one the server sent back serialized. */
const isFailure = (value: unknown): boolean =>
  value instanceof Domain2ElementFailed || (!!value && typeof value == "object" && "queryFailure" in value);

type QueryOutcome = { ok: true; value: Record<string, any> } | { ok: false; message: string };

async function runQuery(
  host: DomainControllerActionHost,
  query: BoxedQueryWithExtractorCombinerTransformer,
  applicationSection: ApplicationSection,
  context: ActionImplementationContext,
): Promise<QueryOutcome> {
  const action: RunBoxedQueryAction = {
    actionType: "runBoxedQueryAction",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: { application: query.application, applicationSection, query },
  };
  const result = await host.handleBoxedExtractorOrQueryAction(
    action,
    context.applicationDeploymentMap,
    context.modelEnvironment,
    context.principal,
  );
  if (result instanceof Action2Error || result.status != "ok") {
    return { ok: false, message: failureMessage(result) };
  }
  const value = result.returnedDomainElement;
  if (isFailure(value)) {
    return { ok: false, message: failureMessage(value) };
  }
  // asyncRunQuery keeps a failed combiner under its entry
  const failedEntry = Object.entries(value ?? {}).find(([, entry]) => isFailure(entry));
  if (failedEntry) {
    return { ok: false, message: `${failedEntry[0]} failed: ${failureMessage(failedEntry[1])}` };
  }
  return { ok: true, value: value ?? {} };
}

/** Resolves a part's template, as useQueryTemplateResults does, then runs it. */
async function runPart(
  host: DomainControllerActionHost,
  part: ReportDataPart,
  context: ActionImplementationContext,
  modelEnvironment: MiroirModelEnvironment,
): Promise<QueryOutcome> {
  let query: BoxedQueryWithExtractorCombinerTransformer;
  try {
    query =
      part.query.queryType == "boxedQueryTemplateWithExtractorCombinerTransformer"
        ? resolveQueryTemplateWithExtractorCombinerTransformer(part.query, modelEnvironment)
        : part.query;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  return runQuery(host, query, partSection(query), context);
}

/**
 * #647: the section whose store runs a part's query. The server runs a query on one store, so a
 * query that reads only devData Entities (the history Reports) runs on `devData`; any other on `data`.
 */
export function partSection(query: BoxedQueryWithExtractorCombinerTransformer): ApplicationSection {
  const entityUuids = [...Object.values(query.extractors ?? {}), ...Object.values(query.combiners ?? {})]
    .map((extractorOrCombiner) => (extractorOrCombiner as { parentUuid?: unknown }).parentUuid)
    .filter((parentUuid): parentUuid is string => typeof parentUuid == "string");
  return entityUuids.length > 0 && entityUuids.every((uuid) => devDataEntityUuids.has(uuid)) ? "devData" : "data";
}

/** A query reading the Report or the Queries, under the entry `result`. */
const definitionsQuery = (
  application: string,
  extractor: ExtractorOrCombiner,
): BoxedQueryWithExtractorCombinerTransformer => ({
  queryType: "boxedQueryWithExtractorCombinerTransformer",
  application,
  pageParams: {},
  queryParams: {},
  contextResults: {},
  extractors: { result: extractor },
});

const failedToRunReport = (action: RunReportAction, message: string) =>
  new Action2Error("FailedToRunReport", message, [], undefined, { domainAction: action });

/**
 * #562: runs a Report's queries as its page runs them (see ReportData.ts) and returns the Report's data,
 * so that an agent can check a Report it wrote without opening the app.
 */
export const handleAction_runReportAction: ActionImplementationHandler = async (
  host,
  action: RunReportAction,
  context,
) => {
  const { application, report: reportUuid, parameters } = action.payload;
  const modelEnvironment = context.modelEnvironment ?? defaultMiroirModelEnvironment;
  const reportSection = getApplicationSection(application, entityReport.uuid);
  const reportRead = await runQuery(
    host,
    definitionsQuery(application, {
      extractorOrCombinerType: "extractorByPrimaryKey",
      applicationSection: reportSection,
      parentName: entityReport.name,
      parentUuid: entityReport.uuid,
      instanceUuid: reportUuid,
    }),
    reportSection,
    context,
  );
  const report = reportRead.ok ? reportRead.value.result : undefined;
  if (!report?.definition) {
    return failedToRunReport(
      action,
      `no Report ${reportUuid} in the model of application ${application}` +
        (reportRead.ok ? "" : `: ${reportRead.message}`),
    );
  }
  const querySection = getApplicationSection(application, entityQueryVersion.uuid);
  const queriesRead = await runQuery(
    host,
    definitionsQuery(application, {
      extractorOrCombinerType: "extractorInstancesByEntity",
      applicationSection: querySection,
      parentName: entityQueryVersion.name,
      parentUuid: entityQueryVersion.uuid,
    }),
    querySection,
    context,
  );
  if (!queriesRead.ok) {
    return failedToRunReport(action, `could not read the Queries of application ${application}: ${queriesRead.message}`);
  }
  const queries = Array.isArray(queriesRead.value.result) ? queriesRead.value.result : [];
  const pageParams = {
    application,
    deploymentUuid: context.applicationDeploymentMap[application],
    applicationSection: "data",
    reportUuid,
    ...(parameters ?? {}),
  };

  let parts: ReportDataPart[];
  try {
    parts = reportDataParts(report, queries, application, pageParams);
  } catch (error) {
    return failedToRunReport(
      action,
      `Report ${report.name ?? reportUuid}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const results: Record<string, any>[] = [];
  for (const part of parts) {
    const outcome = await runPart(host, part, context, modelEnvironment);
    if (!outcome.ok) {
      return failedToRunReport(action, `${part.label} failed: ${outcome.message}`);
    }
    results.push(outcome.value);
  }
  return { status: "ok", returnedDomainElement: mergeReportData(results) };
};
