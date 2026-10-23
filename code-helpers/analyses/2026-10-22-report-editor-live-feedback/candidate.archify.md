# Why does the Report editor no longer update the rendered report live? {#report-editor-live-feedback}

Since #82 (2026-08-31), the inline Report editor writes into a **nested Formik** inside `ReportSectionEntityInstance`, while the rendered sections read the **report Formik**. The display only catches up after a save.

- #82 added the nested Formik to show virtual attributes without writing them into the Report form, not for performance.[](source:plan82)
- The `Report` entity has no virtual attributes, so for the Report editor the nested Formik only isolates the edits.[](source:nested-formik)
- That isolation also confines each keystroke to one editor. Removing it everywhere brings the June per-keystroke cost back to every instance page.[](source:tvoe-typecheck)
- A bypass scoped to the Report editor, plus narrower typecheck dependencies, restores live feedback with the smallest blast radius.

@answer scope="miroir-standalone-app at 958657e97 compared with 11d616014 (June sandbox) · found by code reading and git history · not reproduced in a running app · no timings measured"
@meta locale=en repo_url=https://github.com/miroir-framework/miroir repo_revision=958657e977fbf176cb7ee1e3c78231e4b318bb65

@source nested-formik title="ReportSectionEntityInstance: multistep branch and nested Formik" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx lines=640:685
@source nested-formik-code title="The nested Formik" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx lines=659:684
@source displayed-instance title="displayedInstance: instance plus virtual attributes" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx lines=251:269
@source submit-nested title="submitNestedFormValues: strip, then Report submit" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx lines=273:289
@source query-run title="Query test run built from the outer instance" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx lines=384:430
@source inline-editor title="InlineReportEditor edits the Report as an instance" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/InlineReportEditor.tsx lines=83:92
@source rvwe-values title="Report Formik initial values hold the Report under its name" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx lines=268:301
@source rvwe-formik title="Report Formik, inline editor and sections" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx lines=479:592
@source rvwe-query title="Report query built from props.reportDefinition" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx lines=112:154
@source rsvwe-read title="Sections read formik.values[reportName]" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx lines=173:186
@source tvoe-typecheck title="TypedValueObjectEditor typecheck memo keyed on formik.values" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx lines=321:361
@source report-display title="ReportDisplay picks the Report" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportDisplay.tsx lines=75:117
@source root-mapping title="RootComponent maps reports from the local cache" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx lines=328:345
@source localcache title="Local cache applies transactional instance actions" path=packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts lines=1044:1046
@source plan82 title="#82 plan, slice 6: why the nested Formik exists" path=code-helpers/features/82-FEATURE-virtual-attributes-on-entity/tdd-implementation-plan.md lines=495:495
@source analysis274 title="#274 analysis 3.5: nested Formik misaligned" path=code-helpers/features/274-FEATURE-multistep-reports/analysis.md lines=209:220
@source plan330 title="#330 plan: BookDetails had not saved since #82" path=code-helpers/features/330-FEATURE-report-level-miroir-tests/tdd-implementation-plan.md lines=308:311
@source internals-doc title="Report display internals (June design)" path=docs/internals/report-display.md lines=49:62
@source bag-keys title="Step bag key for an object-instance section" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx lines=257:259
@source bag-capture title="Report Formik feeds the step bag (validate and render)" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx lines=483:512
@source bag-finish title="Finish runs the composite action with the step bag" path=packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx lines=183:188
@source d5 title="#274 decision D5: the step bag" path=code-helpers/features/274-FEATURE-multistep-reports/analysis.md lines=75:95
@source plan274 title="#274 plan, slice 4: one write path" path=code-helpers/features/274-FEATURE-multistep-reports/tdd-implementation-plan.md lines=472:472
@source commit82 title="Commit 65ac0fed6 (#82 virtual attributes)" url=https://github.com/miroir-framework/miroir/commit/65ac0fed61b0af469a00f6a324d00e48be06bda5
@source commit330 title="Commit 74d0bd787 (#330 slice 3)" url=https://github.com/miroir-framework/miroir/commit/74d0bd787afa086f3727fa5010799241581d63aa
@source commit274 title="Commit 35723143e (#274 slice 4)" url=https://github.com/miroir-framework/miroir/commit/35723143e9b19f52221505e02397cfe8062b51c5

## Which Formik does the Report editor write to? {#formiks}

@architecture id=report-page-tree title="Report page in edit mode: two Formiks since #82"
| author | Author | external |
| cache | Local cache | database | source:localcache |
| root | RootComponent | frontend | source:root-mapping |
| display | ReportDisplay | frontend | source:report-display |
| rvwe | ReportViewWithEditor | frontend | source:rvwe-values |
| reportFormik | Report Formik | database | source:rvwe-formik |
| sections | Rendered sections | frontend | source:rsvwe-read |
| inline | InlineReportEditor | frontend | source:inline-editor |
| nested | Nested Formik | database | source:nested-formik |
| fields | Report editor fields | frontend | source:tvoe-typecheck |
| cache > root | model |
| root > display | Report |
| display > rvwe | reportDefinition |
| rvwe > reportFormik | initialValues |
| reportFormik > sections | values[reportName] |
| reportFormik > inline | the Report |
| inline > nested | seeds once |
| author > fields | types |
| fields > nested | every keystroke | emphasis |
| nested > cache | save only | dashed |

@steps id=formik-steps
| s1 | ReportViewWithEditor | Puts the displayed Report into the Report Formik under its name. | report-page-tree | rvwe |
| s2 | Rendered sections | Read the section tree from that key on every render. | report-page-tree | sections |
| s3 | InlineReportEditor | Passes the same key to ReportSectionEntityInstance as the instance to edit. | report-page-tree | inline |
| s4 | Nested Formik | Copies the Report once; with no virtual attributes the copy is identical. | report-page-tree | nested |
| s5 | Report editor fields | Write every keystroke into the copy, which the sections never read. | report-page-tree | fields |

The June design had one Formik per report page, and every editor in a section consumed it.[](source:internals-doc) The multistep branch still works that way; every other Report takes the nested branch.[](source:nested-formik)

@code source=nested-formik-code language=tsx

## What happens between a keystroke and the display? {#keystroke}

@sequence id=keystroke-june title="June 2026: one Formik, instant display"
| actor author | Author | external |
| actor fields | Report editor fields | frontend |
| actor reportFormik | Report Formik | database |
| actor sections | Rendered sections | frontend |
| author | fields | types a section label |
| fields | reportFormik | setFieldValue(reportName) |
| reportFormik | sections | re-render with the edit | emphasis |
| reportFormik | fields | re-render and typecheck | return |

@sequence id=keystroke-today title="Today: the display waits for a save"
| actor author | Author | external |
| actor fields | Report editor fields | frontend |
| actor nested | Nested Formik | database |
| actor cache | Local cache | database |
| actor reportFormik | Report Formik | database |
| actor sections | Rendered sections | frontend |
| phase | Typing |
| author | fields | types a section label |
| fields | nested | setFieldValue(reportName) |
| nested | fields | re-render and typecheck | return |
| phase | Save |
| author | fields | clicks save |
| nested | cache | updateInstance via Report submit |
| cache | reportFormik | new Report, reinitialise |
| reportFormik | sections | re-render with the edit | emphasis |
| reportFormik | nested | new instance, reinitialise | return |

The save goes through `submitNestedFormValues`, which strips virtual attributes and calls the Report form's submit.[](source:submit-nested) The local cache applies the update at once, so the display changes after the save, before any store commit.[](source:localcache)

## When did it change? {#history}

| Date | Commit | Change | Live feedback |
| --- | --- | --- | --- |
| 2025-10-28 | `8c1e2f97f` (#112) | Formik moved up to ReportViewWithEditor; per-section Formik removed | Live {good:Live} |
| 2026-06-07 | `11d616014` (#116) | Sandbox release, the reference state | Live {good:Live} |
| 2026-08-31 | `65ac0fed6` (#82) | Nested Formik with an empty `onSubmit`, to show virtual attributes | Lost; saves also broken {bad:Regression} |
| 2026-09-13 | `35723143e` (#274) | Multistep Reports skip the nested Formik | Multistep sections only |
| 2026-09-27 | `74d0bd787` (#330) | Nested submit routed to the Report submit | Saves fixed; still not live {caution:Partial} |

Issue #274 named the isolation ("Edits do not land in the parent Report Formik") but kept it for other Reports.[](source:analysis274) #330 listed "no nested Formik for this branch" as an alternative and chose to reroute the submit.[](source:plan330) Neither looked at the Report editor's live display.

## Why do multistep Reports skip the nested Formik? {#multistep}

They skip it for a functional reason: the wizard must read instance edits before any save, just as the rendered sections must read Report edits.

@steps id=multistep-steps
| bag-key | Step bag keys | The host keeps one key per object-instance section, its section path joined with `_`. |
| bag-read | Report Formik | The host copies those keys out of the report Formik on every change and every render. |
| bag-use | Next and Finish | Next feeds the bag to the next step's query; Finish passes it to the composite action. |
| bag-gap | Nested Formik | Edits kept in a nested copy would never reach the bag, so Finish would save the seeded value. |

The host reads the bag key from the section path[](source:bag-keys) and fills the bag from the report Formik.[](source:bag-capture) Finish then runs the action with that bag.[](source:bag-finish) Decision D5 limits the bag to input values and instance values.[](source:d5) Slice 4 chose "one write path": the instance editor writes the report Formik directly.[](source:plan274)

@callout level=note title="What the bypass does not cover"
The check reads the type of the Report that contains the section. For the inline Report editor that is `reportReportDetails`, so the editor always takes the nested branch, even on a multistep Report.
Keeping the nested Formik elsewhere was a scope choice ("so we do not change current instance pages"), not a technical need.[](source:analysis274)

## What else depends on the nested Formik? {#blast-radius}

| Caller | Edits | Effect today |
| --- | --- | --- |
| InlineReportEditor | The displayed Report | Sections, lists, markdown and tests do not follow edits until save |
| Instance section, e.g. Book details | One entity instance | Virtual citation shown; title interpolation and outline stay on the saved value |
| Query details | A Query definition | Test results no longer re-run while the query is edited {bad:Lost}[](source:query-run) |
| List add or edit dialog | Draft injected into the Report Formik | Edits isolated in the nested Formik; save works |

Tests that pin the nested Formik:

- `multistep.274.phase0.unit.test.ts` checks by regex that `<Formik … onSubmit={submitNestedFormValues}` exists.
- `virtualAttributes.integ.test.tsx` checks that Book details shows the virtual citation.
- The `report.bookDetails` MiroirTest saves an edited title and refuses an invalid one.
- No test checks that a Report edit shows in the rendered sections before save.

## Why not simply revert #82's Formik? {#performance}

In a shared Formik, every section re-renders on each keystroke, and every `TypedValueObjectEditor` re-runs `mlsTypeCheck`, because its memo depends on the whole `formik.values`.[](source:tvoe-typecheck) With the editor open, that includes a full typecheck of the Report value. Nobody has measured this cost, in June or now.

| Option | Live Report editor | Live Query test run | Typing cost on instance pages | Blast radius |
| --- | --- | --- | --- | --- |
| A. Remove the nested Formik | Yes {good:Restored} | Yes | June cost on every page {bad:Higher} | Widest; breaks 2 tests; virtual attributes need a new display path |
| B1. Bypass for the Report editor only | Yes {good:Restored} | No | Unchanged {good:Same} | Smallest; like the multistep bypass |
| B2. Nest only when virtual attributes are overlaid | Yes {good:Restored} | Yes | June cost for all entities but Book {caution:Higher} | Medium |
| C. Keep nesting, mirror into the Report Formik | Yes | Yes | Both Formiks re-render | Two sources of truth; reinitialise ping-pong {bad:Risky} |
| D. Drop `formik.values` from the typecheck memo | n/a | n/a | One typecheck per keystroke instead of one per editor {good:Lower} | Low; the typecheck reads only its own value |

Recommended: B1 with D, then decide whether the Query page needs B2.

## What was never live, even in June? {#never-live}

- Query edits: the report query is built from `props.reportDefinition`, so extractor changes need a save.[](source:rvwe-query)
- Markdown content: the section copies its content into local state at mount.
- Code-editor fields: their text stays local until it parses as JSON.
- Unsaved edits: any deep change of report data reinitialises the Report Formik and drops them.

## Which component does what? {#glossary}

@facts id=glossary-facts
| ReportViewWithEditor (RVWE) | Builds the report query and creates the report Formik |
| ReportSectionViewWithEditor (RSVWE) | Renders one section from the report Formik; recurses into grids, lists and accordions |
| ReportSectionEntityInstance (RSEI) | Shows one entity instance; mounts the nested Formik since #82 |
| TypedValueObjectEditor (TVOE) | Schema-driven editor of the nearest Formik; runs `mlsTypeCheck` and owns the save button |
| InlineReportEditor | Report editor shown above the sections when edit mode is on |
| Report Formik | One form state per report page: section data, query results, and the Report under its name |
| Nested Formik | One-key copy of an instance, used for every Report except multistep ones |
| Step bag | What a multistep user entered; Next and Finish pass it to queries and actions |
| Save | `updateInstance` applied to the local cache at once |
| Commit | Persists the open transaction to the store |

## Before writing the fix {#checklist}

- [ ] Add a failing test: edit a section label in the Report editor and expect the rendered label to change before save.
- [ ] Measure per-keystroke commit time on BookList, BookDetails, a diagram Report and ReportDetails, before and after.
- [ ] Keep `submitRequiresValidType` on the bypassed editor so an invalid Report is not saved.
- [ ] Keep the multistep tests and `report.bookDetails` green.
- [ ] Decide whether the Query details page gets the same fix now.
- [ ] Update `docs/internals/report-display.md`, which still says one Formik per report.
