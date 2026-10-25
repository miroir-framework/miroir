# #562 Run a Report through MCP: analysis

## Problem

An agent working through MCP cannot check a Report it wrote. No tool runs a Report, so in the #550 pilot:

- the MCP agent's Report used `runStoredQueries` and read the stored Query's `overdueLoans` in its own
  `runtimeTransformers`, which the app never allows (run `20261025T054540Z-overdue-loans-miroir-mcp-0`);
- the files agent's Report showed all 60 loans, the parameter never reaching its query.

Both agents guessed how a Report gets its data. The #550 acceptance rebuilt the Report's query itself
(`report_loan_sets` in `scripts/agent_bench/acceptance/adapter_miroir.py`), which hid the difference with the app.

## How the app builds a Report's data

- `useStoredQueriesResults` (`ReportHooks.ts`) runs only the first stored Query found, as a template query with
  the page parameters and `queryParams: {}`.
- `ReportViewWithEditor` runs the Report's own query: a template query when the definition has
  `extractorTemplates`, else a plain one (with `extractors: {}` when it has none), with the page parameters.
- It merges `{...reportSectionsData, ...storedQueryData, ...reportDataForForm}`: the Report's own entries win.
- A stored Query's results never reach the Report's `runtimeTransformers`; `reportParameters` and
  `RunStoredQuery.args` are not read anywhere.
- Runtime transformers read `{...pageParams, ...queryParams}` through `getFromParameters`.

## Design

A `runReportAction` on the DomainEndpoint (MCP tool `Miroir_runReportAction`), payload
`{ application, report, parameters? }`:

- `ReportData.ts` (layer 2) states how the app builds the parts and merges them, as pure functions.
- `RunReportAction.ts` (layer 3) reads the Report and the Queries from the application's model, resolves each
  part's templates as `useQueryTemplateResults` does, runs it with `handleBoxedExtractorOrQueryAction`, and
  merges the results.
- A part that fails makes the action fail with `FailedToRunReport`, naming the part and the failure.

The DomainEndpoint is the home because its actions join `domainAction` automatically and become MCP tools.
