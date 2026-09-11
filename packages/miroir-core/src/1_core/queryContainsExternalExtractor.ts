/**
 * #267 D5 — domain predicate: does this boxed query (resolved or template)
 * contain an external-service extractor? Used by the async report-load path
 * to route the whole query via POST /query.
 */

const EXTERNAL_EXTRACTOR_TYPES = new Set([
  "extractorForExternalService",
  "extractorTemplateForExternalService",
]);

function extractorsFromQuery(query: unknown): Record<string, unknown> | undefined {
  if (!query || typeof query !== "object") {
    return undefined;
  }
  const record = query as {
    extractors?: Record<string, unknown>;
    extractorTemplates?: Record<string, unknown>;
  };
  if (record.extractors && typeof record.extractors === "object") {
    return record.extractors;
  }
  if (record.extractorTemplates && typeof record.extractorTemplates === "object") {
    return record.extractorTemplates;
  }
  return undefined;
}

export function queryContainsExternalExtractor(query: unknown): boolean {
  const extractors = extractorsFromQuery(query);
  if (!extractors) {
    return false;
  }
  return Object.values(extractors).some((extractor) => {
    if (!extractor || typeof extractor !== "object") {
      return false;
    }
    const extractorType = (extractor as { extractorOrCombinerType?: unknown })
      .extractorOrCombinerType;
    return typeof extractorType === "string" && EXTERNAL_EXTRACTOR_TYPES.has(extractorType);
  });
}
