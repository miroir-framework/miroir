import { describe, expect, it } from "vitest";

import { Action2Error, Domain2ElementFailed } from "../../../../src/0_interfaces/2_domain/DomainElement";
import type { DomainControllerActionHost } from "../../../../src/0_interfaces/3_controllers/DomainControllerActionHost";
import { asyncApplyExtractorTransformerInMemory, asyncRunQuery } from "../../../../src/2_domain/AsyncQuerySelectors";
import { mergeReportData, reportDataParts } from "../../../../src/2_domain/ReportData";
import { handleAction_runReportAction } from "../../../../src/3_controllers/RunReportAction";

// #562: runReportAction runs a Report's queries as its page does and returns the Report's data.
const APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ENTITY_REPORT = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const ENTITY_QUERY = "e4320b9e-ab45-4abe-85d8-359604b3c62f";
const ENTITY_LOAN = "e81078f3-2de7-4301-bd79-d3a156aec149";
const ENTITY_USER = "ca794e28-b2dc-45b3-8137-00151557eea8";

const runtime = (transformer: Record<string, any>) => ({ interpolation: "runtime", ...transformer });
const fromContext = (referenceName: string) => runtime({ transformerType: "getFromContext", referenceName });
const loansExtractor = {
  extractorOrCombinerType: "extractorInstancesByEntity",
  applicationSection: "data",
  parentName: "LendingHistoryItem",
  parentUuid: ENTITY_LOAN,
};
/** The open loans of `loans` started before the parameter startedBefore. */
const overdueLoans = (loans: Record<string, any>) =>
  runtime({
    transformerType: "filterList",
    referenceToOuterObject: "loan",
    applyTo: loans,
    predicate: runtime({
      transformerType: "boolExpr",
      operator: "&&",
      left: runtime({
        transformerType: "boolExpr",
        operator: "isNull",
        left: runtime({ transformerType: "getFromContext", referencePath: ["loan", "endDate"], safe: true }),
      }),
      right: runtime({
        transformerType: "boolExpr",
        operator: "<",
        left: runtime({ transformerType: "getFromContext", referencePath: ["loan", "startDate"] }),
        right: runtime({ transformerType: "getFromParameters", referenceName: "startedBefore" }),
      }),
    }),
  });

const loans = [
  { uuid: "loan-1", parentUuid: ENTITY_LOAN, user: "user-1", startDate: "2026-06-01", endDate: null },
  { uuid: "loan-2", parentUuid: ENTITY_LOAN, user: "user-1", startDate: "2026-06-01", endDate: "2026-06-10" },
  { uuid: "loan-3", parentUuid: ENTITY_LOAN, user: "user-2", startDate: "2026-08-01", endDate: null },
];
const users = [{ uuid: "user-1", parentUuid: ENTITY_USER, name: "Ada" }, { uuid: "user-2", parentUuid: ENTITY_USER, name: "Bob" }];

const storedOverdueLoans = {
  uuid: "5c1d7a2e-3b4f-4e6a-9d81-0a7f2c9e4b13",
  parentUuid: ENTITY_QUERY,
  name: "OverdueLoans",
  definition: {
    extractorTemplates: { loans: loansExtractor },
    runtimeTransformers: { overdueLoans: overdueLoans(fromContext("loans")) },
  },
};
/** The #550 reference Report: its own query reads the parameter. */
const referenceReport = {
  uuid: "eb4f9e2d-bf0e-4ba9-85a4-82ccaebd2804",
  parentUuid: ENTITY_REPORT,
  name: "OverdueLoansPerUser",
  definition: {
    extractorTemplates: { loans: loansExtractor },
    runtimeTransformers: { overdueLoans: overdueLoans(fromContext("loans")) },
    section: { type: "objectListReportSection", definition: { parentUuid: ENTITY_LOAN, fetchedDataReference: "overdueLoans" } },
  },
};
/** As the #550 pilot's MCP agent wrote it: its own transformers read the stored Query's result. */
const reportReadingStoredQuery = {
  uuid: "7e3b9f40-1c2a-4d85-b6a7-5d0e8c1f2a94",
  parentUuid: ENTITY_REPORT,
  name: "OverdueLoansPerUser",
  definition: {
    reportParameters: { startedBefore: "2026-07-02" },
    extractorTemplates: {
      users: { extractorOrCombinerType: "extractorInstancesByEntity", parentName: "User", parentUuid: ENTITY_USER },
    },
    runStoredQueries: [{ label: "OverdueLoans", storedQuery: storedOverdueLoans.uuid }],
    runtimeTransformers: {
      overdueLoansPerUser: runtime({
        transformerType: "mapList",
        referenceToOuterObject: "user",
        applyTo: fromContext("users"),
        elementTransformer: runtime({
          transformerType: "createObject",
          definition: {
            user: runtime({ transformerType: "getFromContext", referencePath: ["user", "name"] }),
            loans: fromContext("overdueLoans"),
          },
        }),
      }),
    },
    section: { type: "jsonReportSection", definition: { fetchedDataReference: "overdueLoansPerUser" } },
  },
};
/** Shows the stored Query's result next to its own entries, which do not read it. */
const reportShowingStoredQuery = {
  uuid: "0d2c6a8e-5b1f-4c3a-9e7d-2f4b6c8a0e1d",
  parentUuid: ENTITY_REPORT,
  name: "OverdueLoansAndUsers",
  definition: {
    extractorTemplates: {
      users: { extractorOrCombinerType: "extractorInstancesByEntity", parentName: "User", parentUuid: ENTITY_USER },
    },
    runStoredQueries: [{ label: "OverdueLoans", storedQuery: storedOverdueLoans.uuid }],
    section: { type: "jsonReportSection", definition: { fetchedDataReference: "overdueLoans" } },
  },
};

/** A stored Query with combinerTemplates only, which the app runs as a template. */
const storedGreeting = {
  uuid: "9b3e1d5f-7a2c-4e8b-b6d4-1f3a5c7e9b2d",
  parentUuid: ENTITY_QUERY,
  name: "Greeting",
  definition: { combinerTemplates: { greeting: { extractorOrCombinerType: "literal", definition: "hello" } } },
};
const reportShowingGreeting = {
  uuid: "4c6e8a0b-2d4f-4a6c-8e0b-3d5f7a9c1e3b",
  parentUuid: ENTITY_REPORT,
  name: "Greeting",
  definition: {
    runStoredQueries: [{ label: "Greeting", storedQuery: storedGreeting.uuid }],
    section: { type: "jsonReportSection", definition: { fetchedDataReference: "greeting" } },
  },
};
/** Its combiner refers to an entry that does not exist. */
const reportWithFailingCombiner = {
  uuid: "6e8a0c2d-4f6b-4c8e-a0c2-5f7b9d1e3a5c",
  parentUuid: ENTITY_REPORT,
  name: "FailingCombiner",
  definition: {
    extractors: {},
    combiners: {
      missing: { extractorOrCombinerType: "extractorOrCombinerContextReference", extractorOrCombinerContextReference: "nothing" },
    },
    section: { type: "jsonReportSection", definition: { fetchedDataReference: "missing" } },
  },
};

const store: Record<string, Record<string, any>[]> = {
  [ENTITY_LOAN]: loans,
  [ENTITY_USER]: users,
  [ENTITY_REPORT]: [
    referenceReport,
    reportReadingStoredQuery,
    reportShowingStoredQuery,
    reportShowingGreeting,
    reportWithFailingCombiner,
  ],
  [ENTITY_QUERY]: [storedOverdueLoans, storedGreeting],
};

/** A host that answers extractors from `store` and runs the query's combiners and transformers for real. */
const host = {
  async handleBoxedExtractorOrQueryAction(action: any) {
    const query = action.payload.query;
    const contextResults = Object.fromEntries(
      Object.entries(query.extractors ?? {}).map(([name, extractor]: [string, any]) => {
        const instances = store[extractor.parentUuid] ?? [];
        if (extractor.extractorOrCombinerType == "extractorByPrimaryKey") {
          const instance = instances.find((candidate) => candidate.uuid == extractor.instanceUuid);
          return [name, instance ?? new Domain2ElementFailed({ queryFailure: "InstanceNotFound", failureMessage: "no instance" })];
        }
        return [name, instances];
      }),
    );
    if (Object.values(contextResults).some((result) => result instanceof Domain2ElementFailed)) {
      return { status: "ok", returnedDomainElement: { ...contextResults } };
    }
    const result = await asyncRunQuery(
      {
        extractorRunnerMap: { applyExtractorTransformer: asyncApplyExtractorTransformerInMemory } as any,
        extractor: { ...query, extractors: {}, contextResults },
      },
      { [APPLICATION]: DEPLOYMENT } as any,
      {} as any,
    );
    return { status: "ok", returnedDomainElement: result };
  },
} as unknown as DomainControllerActionHost;

const runReport = (report: string, parameters?: Record<string, any>) =>
  handleAction_runReportAction(
    host,
    {
      actionType: "runReportAction",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: { application: APPLICATION, report, ...(parameters ? { parameters } : {}) },
    },
    { applicationDeploymentMap: { [APPLICATION]: DEPLOYMENT } } as any,
  );

describe("#562 runReportAction", () => {
  it("runs the Report's own query with the parameters", async () => {
    const result: any = await runReport(referenceReport.uuid, { startedBefore: "2026-07-02" });
    expect(result.status).toBe("ok");
    expect(result.returnedDomainElement.overdueLoans.map((loan: any) => loan.uuid)).toEqual(["loan-1"]);
  });

  it("merges the stored Query's entries with the Report's own", async () => {
    const result: any = await runReport(reportShowingStoredQuery.uuid, { startedBefore: "2026-09-01" });
    expect(result.status).toBe("ok");
    expect(result.returnedDomainElement.overdueLoans.map((loan: any) => loan.uuid)).toEqual(["loan-1", "loan-3"]);
    expect(result.returnedDomainElement.users).toEqual(users);
  });

  it("fails when the Report's transformers read the stored Query's result", async () => {
    const result = await runReport(reportReadingStoredQuery.uuid, { startedBefore: "2026-07-02" });
    expect(result).toBeInstanceOf(Action2Error);
    const error = result as Action2Error;
    expect(error.errorType).toBe("FailedToRunReport");
    expect(error.errorMessage).toContain("Report OverdueLoansPerUser query failed: runtime transformer overdueLoansPerUser failed");
    expect(error.errorMessage).toContain("overdueLoans");
  });

  it("runs a stored Query that has combinerTemplates only", async () => {
    const result: any = await runReport(reportShowingGreeting.uuid);
    expect(result.status).toBe("ok");
    expect(result.returnedDomainElement.greeting).toBe("hello");
  });

  it("fails when a combiner fails", async () => {
    const result = await runReport(reportWithFailingCombiner.uuid);
    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toContain("Report FailingCombiner query failed: missing failed");
  });

  it("fails for a Report that is not in the model", async () => {
    const result = await runReport("00000000-0000-4000-8000-000000000000");
    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorType).toBe("FailedToRunReport");
  });
});

describe("#562 reportDataParts", () => {
  const pageParams = { startedBefore: "2026-07-02" };

  it("runs the first stored Query, then the Report's own query", () => {
    const parts = reportDataParts(reportReadingStoredQuery, [storedOverdueLoans], APPLICATION, pageParams);
    expect(parts.map((part) => part.label)).toEqual(["stored Query OverdueLoans", "Report OverdueLoansPerUser query"]);
    expect(parts.every((part) => part.query.queryType == "boxedQueryTemplateWithExtractorCombinerTransformer")).toBe(true);
    expect(parts[0].query.pageParams).toEqual(pageParams);
    expect(parts[0].query.queryParams).toEqual({});
  });

  it("runs the first listed Query in the model's order, as the app does", () => {
    const report = {
      name: "Both",
      definition: {
        runStoredQueries: [
          { label: "Greeting", storedQuery: storedGreeting.uuid },
          { label: "OverdueLoans", storedQuery: storedOverdueLoans.uuid },
        ],
      },
    };
    const [stored] = reportDataParts(report, [storedOverdueLoans, storedGreeting], APPLICATION, pageParams);
    expect(stored.label).toBe("stored Query OverdueLoans");
  });

  it("gives a Report with no query of its own an empty one", () => {
    const [part] = reportDataParts({ name: "Empty", definition: {} }, [], APPLICATION, pageParams);
    expect(part.query).toMatchObject({ queryType: "boxedQueryWithExtractorCombinerTransformer", extractors: {} });
  });

  it("throws when the stored Query is not in the model", () => {
    expect(() => reportDataParts(reportReadingStoredQuery, [], APPLICATION, pageParams)).toThrow(
      `no stored Query of runStoredQueries found (${storedOverdueLoans.uuid})`,
    );
  });

  it("lets the Report's own query win over its stored Query", () => {
    expect(mergeReportData([{ a: 1, b: 1 }, { b: 2 }])).toEqual({ a: 1, b: 2 });
  });
});
