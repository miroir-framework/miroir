# Lending limit

The Library lends Books to Users. A loan is a LendingHistoryItem: it has a `user`, a `book`, a `startDate` and, once the Book is back, an `endDate`. A User holds a Book while its loan has no `endDate`.

A User may hold at most 8 Books at a time. Lending a Book to a User who already holds 8 must be refused, and must create no loan. Lending to a User who holds fewer works as it does today.

Deliver:

1. The rule, enforced where Books are lent.
2. A test of one refused and one accepted loan, which you run and which passes.

Work until both are done. Do not change the existing Library data, except through your own test if it needs to.

<!-- contract: miroir-mcp -->
## Contract

- The rule is enforced by the action `lendDocument` of the Library Endpoint `Lending`, with its current parameters. A refused loan makes the action return an error and creates no LendingHistoryItem.
- The test is a MiroirTest of the Library application.
- The MCP tools cannot run a MiroirTest: call `Library_lendDocument` to check the results your test expects.

<!-- contract: miroir-files -->
## Contract

- The rule is enforced by the action `lendDocument` of the Library Endpoint `Lending`, with its current parameters. A refused loan makes the action return an error and creates no LendingHistoryItem.
- The test is a MiroirTest of the Library application.
- Nothing in your folder runs an action or a MiroirTest: `./check` validates the files. Make the test's expected values follow from the Library data you read.

<!-- contract: conventional -->
## Contract

- The rule is enforced by the existing route `POST /api/loans` (JSON body `{ "user": <uuid>, "book": <uuid>, "startDate": <ISO date> }`). It answers 201 with the new loan, or 409 with no loan created when the User already holds 8 Books.
- The test is a Vitest test.
