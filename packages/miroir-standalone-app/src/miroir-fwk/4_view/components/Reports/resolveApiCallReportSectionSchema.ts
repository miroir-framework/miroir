import {
  getExternalService,
  type EndpointDefinitionLike,
  type MlElement,
} from "miroir-core";

const EXTERNAL_SERVICE_EXTRACTOR_TYPES = new Set([
  "extractorTemplateForExternalService",
  "extractorForExternalService",
  // #272 aliases
  "extractorTemplateFromAction",
  "extractorFromAction",
]);

export type ApiCallReportSectionBinding = {
  fetchedDataReference: string;
  endpointUuid: string;
  operationId: string;
};

export type ResolveApiCallReportSectionSchemaInput = {
  section: ApiCallReportSectionBinding;
  extractorTemplates?: Record<string, unknown>;
  extractors?: Record<string, unknown>;
  endpointsByUuid?: Record<string, unknown> | null;
  endpointsFallback?: Array<{ uuid: string }> | null;
};

export type ResolveApiCallReportSectionSchemaResult =
  | { ok: true; schema: MlElement }
  | { ok: false; error: string };

function asExtractorRecord(
  value: unknown,
): { extractorOrCombinerType?: string; endpointUuid?: string; actionType?: string } | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as {
    extractorOrCombinerType?: string;
    endpointUuid?: string;
    actionType?: string;
  };
}

/**
 * Bind an apiCallReportSection to the report's inline extractor and Endpoint operation schema.
 * Does not read stored Query instances or deploymentUuidToReportsEntitiesMapping.
 */
export function resolveApiCallReportSectionSchema(
  input: ResolveApiCallReportSectionSchemaInput,
): ResolveApiCallReportSectionSchemaResult {
  const { section } = input;
  const extractor =
    asExtractorRecord(input.extractorTemplates?.[section.fetchedDataReference]) ??
    asExtractorRecord(input.extractors?.[section.fetchedDataReference]);

  if (!extractor) {
    return {
      ok: false,
      error: `Could not resolve apiCallReportSection extractor for fetchedDataReference "${section.fetchedDataReference}".`,
    };
  }

  if (
    !extractor.extractorOrCombinerType ||
    !EXTERNAL_SERVICE_EXTRACTOR_TYPES.has(extractor.extractorOrCombinerType)
  ) {
    return {
      ok: false,
      error:
        `fetchedDataReference "${section.fetchedDataReference}" is not an external-service extractor ` +
        `(expected extractorTemplateForExternalService / extractorForExternalService; found ${extractor.extractorOrCombinerType ?? "none"}).`,
    };
  }

  if (
    extractor.endpointUuid !== section.endpointUuid ||
    extractor.actionType !== section.operationId
  ) {
    return {
      ok: false,
      error:
        `apiCallReportSection binding mismatch: section endpointUuid "${section.endpointUuid}" operationId "${section.operationId}"` +
        ` vs extractor endpointUuid "${extractor.endpointUuid}" actionType "${extractor.actionType}".`,
    };
  }

  const endpoint =
    input.endpointsByUuid?.[section.endpointUuid] ??
    input.endpointsFallback?.find((candidate) => candidate.uuid === section.endpointUuid);

  if (!endpoint || typeof endpoint !== "object") {
    return {
      ok: false,
      error: `Could not resolve Endpoint ${section.endpointUuid} for apiCallReportSection.`,
    };
  }

  const operation = getExternalService(endpoint as EndpointDefinitionLike)?.operations?.find(
    (candidate) => candidate.operationId === section.operationId,
  );
  if (!operation) {
    return {
      ok: false,
      error: `Could not resolve Endpoint operation "${section.operationId}" on endpoint ${section.endpointUuid}.`,
    };
  }

  const schema = operation.responseSchema as MlElement | undefined;
  if (!schema) {
    return {
      ok: false,
      error:
        `Could not resolve Endpoint operation responseSchema for endpoint ${section.endpointUuid} operation ${section.operationId}.`,
    };
  }

  return { ok: true, schema };
}
