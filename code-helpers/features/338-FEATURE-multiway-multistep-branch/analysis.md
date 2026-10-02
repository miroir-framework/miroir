# Issue #338 — Multi-way branch in multistep Reports

Issue: https://github.com/miroir-framework/miroir/issues/338 · Related: #284 (the wizard, `../284-FEATURE-openapi-connection-wizard/`), #330 (Report MiroirTests, `../330-FEATURE-report-level-miroir-tests/`).

## Problem

On the ConnectExternalServiceWizard Report (`dbd94bfe-…`), a user who requires authentication and keeps the default scheme `customToken` gets the "Client credentials secrets" step after "Scheme", and must press Next through it to reach "Custom token".

A multistep step envelope's `branch` is binary (`test`, `whenTrue`, `whenFalse`) and the scheme has three values, so the wizard chains two branches (`scheme` → `secretsAuthCode` | `secretsClient`, then `secretsClient` → `operations` | `secretsCustom`). Every scheme other than `authorizationCode` lands on `secretsClient` first. No ordering of two binary branches avoids a detour for one of the three schemes.

## Current state

- Envelope schema: Report Entity `3f2baa83-…` (`miroir_model/16dbfe28-…/3f2baa83-….json`) and its EntityVersion `952d2c65-…` (`miroir_modelVersion/54b9c72f-…`), both define `branch: { test, whenTrue, whenFalse }`. Generated into `miroirFundamentalType.ts` by `npm run devBuild -w miroir-core`.
- Host: `MultistepReportHost.tsx` `handleNext` evaluates `branch.test` on the step bag and picks `whenTrue` / `whenFalse` by truthiness; an unknown target shows `Unknown branch target stepId: …` and stays on the step. Back pops visited steps, so jumps need nothing extra.
- Tests: `multistepBranch.284.integ.test.tsx` (host branching on a fixture Report), MiroirTest `report.connectExternalServiceWizard` (`6446d8b1-…`) leaf "a custom token reaches neither the step bag nor the page", which asserts the detour today (step label names #338).
- Docs: `docs/reference/api/reports.md` § multistep.

## Decisions

| # | Decision | Choice | Rejected |
|---|---|---|---|
| D1 | Shape of the multi-way branch | Keyed cases on the existing `branch`: `cases` (record value → stepId) plus optional `default` stepId. The test returns a value; its string form selects the case. | A test returning the next stepId directly: puts stepIds inside transformers, harder to read and to check. A separate `switch` envelope key: two ways to say "next step". |
| D2 | Binary form | Kept unchanged; `whenTrue` / `whenFalse` become optional so a `cases` branch need not carry them. When `cases` is present it wins. | A union of two branch shapes: the ML editor handles discriminator-less object unions poorly, and the host already validates targets at run time. |
| D3 | No matching case and no `default` | Stay on the step with `No branch case for value: <value>` (same behaviour as an unknown target). | Falling through to the next index: hides a modelling error. |
| D4 | Wizard | `scheme` step branches with `cases` on `scheme.scheme` straight to `secretsAuthCode` / `secretsClient` / `secretsCustom`, `default` `secretsCustom` (the scheme's initial value). `secretsClient` then always goes to `operations`. | — |
| D5 | #330 leaf | The leaf goes Scheme → Custom token directly; the Client credentials step is no longer expected. | — |

## Out of scope

Branch editing affordances in the Report editor beyond what the schema gives for free.
