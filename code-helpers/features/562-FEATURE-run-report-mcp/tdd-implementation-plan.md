# #562 Run a Report through MCP: TDD plan

1. `reportDataParts` and `mergeReportData` (`tests/3_controllers/issues/562-run-report/`): first stored Query then
   the Report's own query, page parameters and empty query parameters, an empty query for a Report with none,
   a missing stored Query throws, the Report's own entries win.
2. `handleAction_runReportAction` on a host answering extractors from fixtures and running transformers for real:
   the #550 reference Report returns the overdue loans for `startedBefore`; a Report showing its stored Query
   merges both; the pilot's Report fails naming `overdueLoansPerUser` and `overdueLoans`; an unknown Report fails.
3. Inventory (`ActionImplementations.unit.test.ts`) and action palette (`fn.blockModel`) list the new action.
4. Live, through MCP on a fresh `bench-agent` store: the reference Report gives 21 loans for 2026-07-02, the pilot's
   MCP Report fails with "runtime transformer overdueLoansPerUser failed at 0: no referenceName overdueLoans in
   context". Done 2026-10-25.
5. Follow-up on #550: the acceptance uses `Miroir_runReportAction` instead of rebuilding the Report's query.
