# #330 — Coverage of the #284 UI tests by Report MiroirTests

> One row per case of the two #284 UI tests (listed by [`list_wizard_cases.py`](list_wizard_cases.py), not by eye). The last column names the `reportTest` leaf, or the kept test, that covers the case. `python3 list_wizard_cases.py --check` fails while a row has no entry. Slice 7 deletes a file only when all its rows are covered (plan, D19 / T12).

## Findings from the inventory (Slice 0)

- **`multistepBranch.284` does not test the wizard.** Its cases use a branching Report defined inline in the test (`BRANCH_REPORT_UUID = 4f7dab24-…`, no asset anywhere) and the Library `reportMultistepCountryCreate` Report (`d2b2fbbd-…`). A Report MiroirTest can only mount a Report stored in a deployment, so covering these rows means adding the branching Report as a model asset first. Default for Slice 7: **keep `multistepBranch.284`** (it tests the multistep host engine, not the wizard) and delete only `wizardWalk.284`; the rows below say "kept" unless A prefers the branching Report as an asset.
- **`document-upload-fills-text` needs a file upload.** The component-test steps have no file-input step; covering it needs a new step kind (file name, type, inline content) or keeping the case elsewhere. Decided in Slice 7.
- **`launcher-connect-external-service` starts on another Report** (the home Report's launcher button, then navigation). With the real route (D5), a leaf can mount the home Report, click the button and check the wizard mounted, without the `navigate` mock the TS test uses.

## Cases

| File | Case | What it proves | Covered by |
|---|---|---|---|
| `wizardWalk.284.integ.test.tsx` L392 | `launcher-connect-external-service` | The home launcher button navigates to the wizard Report of the Miroir application | |
| `wizardWalk.284.integ.test.tsx` L410 | `wizard-report-mounts-multistep-host` | The wizard mounts the multistep host on its first step (Application) | |
| `wizardWalk.284.integ.test.tsx` L419 | `picker-lists-fixture-application-only` | The application picker lists the target application and not Miroir or Admin | |
| `wizardWalk.284.integ.test.tsx` L462 | `document-invalid-stays-with-parser-message` | An invalid OpenAPI document keeps the step, with the parser message | |
| `wizardWalk.284.integ.test.tsx` L478 | `document-valid-lists-convertible-hides-oneof` | A valid document lists convertible operations and hides `oneOf`-only ones | |
| `wizardWalk.284.integ.test.tsx` L493 | `document-upload-fills-text` | Uploading a file fills the document text | |
| `wizardWalk.284.integ.test.tsx` L516 | `cleared-url-does-not-override-pasted-document` | After a refused URL, clearing it lets a pasted document through | |
| `wizardWalk.284.integ.test.tsx` L535 | `document-private-url-refused` | A private or loopback document URL is refused | |
| `wizardWalk.284.integ.test.tsx` L549 | `public-path-skips-secrets` | A public service goes from Authentication to Operations without secret steps | |
| `wizardWalk.284.integ.test.tsx` L568 | `secrets-absent-from-bag-and-formik-dump` | A custom token never appears in the step bag or the form values | |
| `wizardWalk.284.integ.test.tsx` L635 | `finish-public-creates-endpoint-and-report` | Finish on a public service creates the Endpoint and its Report, and no Entity | |
| `multistepBranch.284.integ.test.tsx` L404 | `false-branch-skips-secret-finish` | The false branch skips the secret step and Finish succeeds (branch fixture Report) | |
| `multistepBranch.284.integ.test.tsx` L428 | `back-from-review-to-choice` | Back from review returns to the choice step on the visited path (branch fixture Report) | |
| `multistepBranch.284.integ.test.tsx` L449 | `onNext-error-stays-with-inner-message` | An `onNext` error keeps the step and shows the inner message (branch fixture Report) | |
| `multistepBranch.284.integ.test.tsx` L481 | `bare-section-back-is-index-minus-one` | Back on a Report without branches goes to the previous index (`reportMultistepCountryCreate`) | |
| `multistepBranch.284.integ.test.tsx` L518 | `dynamic-schema-gates-next` | A step schema built from the bag blocks Next until its required field is set (branch fixture Report) | |
| `multistepBranch.284.integ.test.tsx` L538 | `cancel-dialog-text-and-secret-bag-redaction` | The cancel dialog text, and the secret redacted from the bag (branch fixture Report) | |
