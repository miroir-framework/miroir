// #562: the queries the app runs to display a Report, and how it merges their results.

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/** One query of a Report's data: the Report's own query, or its stored Query. */
export interface ReportDataPart {
  label: string;
  query: BoxedQueryWithExtractorCombinerTransformer | BoxedQueryTemplateWithExtractorCombinerTransformer;
}

/**
 * The boxed query of a Report or Query definition, with `pageParams` as its page parameters and no query
 * parameters. As `ReportViewWithEditor` builds a Report's query: a template query when the definition has
 * extractorTemplates, else a plain query (with no extractors when the definition has none). As
 * `useStoredQueriesResults` builds a stored Query's (`asTemplate`): always a template query, which runs the
 * definition's extractorTemplates, combinerTemplates and runtimeTransformers only.
 */
export function boxedQueryOfDefinition(
  definition: Record<string, any>,
  application: string,
  pageParams: Record<string, any>,
  asTemplate = false,
): ReportDataPart["query"] {
  const common = { application, pageParams: { ...pageParams }, queryParams: {}, contextResults: {} };
  if (asTemplate || definition.extractorTemplates) {
    return {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      ...common,
      extractorTemplates: definition.extractorTemplates,
      combinerTemplates: definition.combinerTemplates,
      runtimeTransformers: definition.runtimeTransformers,
    };
  }
  return {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    ...common,
    extractors: definition.extractors ?? {},
    combiners: definition.combiners,
    runtimeTransformers: definition.runtimeTransformers,
  };
}

/**
 * The queries a Report's data comes from, as the Report's page runs them: the first of `queries` (the model's
 * order) that `runStoredQueries` lists (the app runs only that one), then the Report's own query. Each runs on
 * its own, so the stored Query's results never reach the Report's runtimeTransformers.
 * Throws when `runStoredQueries` lists Queries and none is among `queries`.
 */
export function reportDataParts(
  report: { name?: string; definition: Record<string, any> },
  queries: readonly { uuid: string; name?: string; definition: Record<string, any> }[],
  application: string,
  pageParams: Record<string, any>,
): ReportDataPart[] {
  const ownQuery: ReportDataPart = {
    label: report.name ? `Report ${report.name} query` : "Report query",
    query: boxedQueryOfDefinition(report.definition, application, pageParams),
  };
  const listed: string[] = (report.definition.runStoredQueries ?? [])
    .map((runStoredQuery: { storedQuery?: string | null }) => runStoredQuery.storedQuery)
    .filter((uuid: string | null | undefined) => !!uuid);
  if (listed.length == 0) {
    return [ownQuery];
  }
  const storedQuery = queries.find((candidate) => listed.includes(candidate.uuid));
  if (!storedQuery) {
    throw new Error(`no stored Query of runStoredQueries found (${listed.join(", ")})`);
  }
  return [
    {
      label: `stored Query ${storedQuery.name ?? storedQuery.uuid}`,
      query: boxedQueryOfDefinition(storedQuery.definition, application, pageParams, true),
    },
    ownQuery,
  ];
}

/** The Report's data: the entries of each part's result merged in order, so the Report's own query wins. */
export function mergeReportData(results: readonly Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...results);
}
