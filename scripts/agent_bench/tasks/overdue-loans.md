# Overdue loans

The Library lends Books to Users. A loan is a LendingHistoryItem: it has a `user`, a `book`, a `startDate` and, once the Book is back, an `endDate`.

Add a way to see the overdue loans: the loans with no `endDate` whose `startDate` is before a cutoff date. The cutoff date is a parameter, so the result can be checked for any date.

Deliver:

1. The overdue loans for a cutoff date.
2. A view that shows the overdue loans grouped by User, with the Book and the start date of each loan.
3. A test of 1, which you run and which passes.

Work until all three are done. Do not change the existing Library data.

<!-- contract: miroir-mcp -->
## Contract

- A Query of the Library application named `OverdueLoans`, with the query parameter `startedBefore` (an ISO date such as `2026-07-02`). Its result has an entry `overdueLoans`: the overdue LendingHistoryItem instances.
- A Report of the Library application named `OverdueLoansPerUser` that shows them per User.
- A MiroirTest of the Library application that runs `OverdueLoans` and checks its result.
- Run your MiroirTest with `runMiroirTestAction` (`application`, `miroirTest`): it runs on a throwaway copy of the Library and returns each leaf's result, with the expected and actual values of its assertions.

<!-- contract: miroir-files -->
## Contract

- A Query of the Library application named `OverdueLoans`, with the query parameter `startedBefore` (an ISO date such as `2026-07-02`). Its result has an entry `overdueLoans`: the overdue LendingHistoryItem instances.
- A Report of the Library application named `OverdueLoansPerUser` that shows them per User.
- A MiroirTest of the Library application that runs `OverdueLoans` and checks its result.
- Nothing in your folder runs a Query or a MiroirTest: `./check` validates the files. Make the test's expected values follow from the Library data you read.

<!-- contract: conventional -->
## Contract

- `GET /api/loans/overdue?startedBefore=2026-07-02` answers 200 with a JSON array of the overdue loans, each with its `uuid`.
- The page `/loans/overdue` shows them per User.
- A Vitest test that checks the result of the route.
