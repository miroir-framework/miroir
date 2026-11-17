# Which actions can a Migration run, compared with what a trace records? {#trace-vs-migration}

> **Describes #9 before #745.** Since #745, a Migration has no jump: its model steps replay the traced model Actions, in one ordered list with the data steps, and a migration run checks the model against the frozen `from` and `to` versions. See [`docs/reference/versioning.md`](../../../../docs/reference/versioning.md#migrations-and-deployment-roles).

A run changes the model only at the **jump**, with the actions a trace records. Its steps exist for **data**, which traces never record. The runner enforces this split only in `versioned-git`, and the rule is written nowhere: that gap is #741.

- Traces record four Entity actions and instance writes on the `model` section, nothing on `data`.[](source:trace-vocab)
- Generation uses the records only to check that they give the `to` model; the Migration it writes lists changes and empty data steps.[](source:gen-check)
- Without Git, the jump rewrites the model to the `to` snapshot with `createEntity`, `alterEntityAttribute` and instance writes, the trace vocabulary.[](source:apply-model)
- Steps accept any action; only `versioned-git` refuses model writes in them.[](source:run-checks)

@answer scope="Code on _integration at 70730b2, after #739, #740 and #742 merged. Authoring and following deployments of one application."
@meta locale=en
@source trace-vocab title="What a trace records" path=packages/miroir-core/src/1_core/versioning/evolutionTraceRecording.ts lines=72:190
@source gen-check title="Generation: replay check, then draft from the two snapshots" path=packages/miroir-versioning/src/migrationGeneration.ts lines=536:573
@source gen-steps title="Draft changes and empty steps" path=packages/miroir-versioning/src/migrationGeneration.ts lines=196:246
@source apply-model title="The jump without Git: applyModelState" path=packages/miroir-versioning/src/applicationVersionInstall.ts lines=159:258
@source run-checks title="The checks a run makes before its first step" path=packages/miroir-versioning/src/migrationRun.ts lines=160:210
@source run-jump title="The jump: checkout or model rewrite" path=packages/miroir-versioning/src/migrationRun.ts lines=218:240
@source c5-test title="Test C5: a nested createEntity in a step is stored" path=packages/miroir-standalone-app/tests/3_controllers/versioning/migrationRun.integ.test.ts lines=551:560
@source composite-type title="CompositeAction type: what a step may hold" path=packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts lines=5254:5330

## How do traces, generation and a run connect? {#pipeline}

@workflow id=trace-to-run title="From a designer's edit to a following deployment"
| lane author | Authoring deployment |
| lane gen | Generation |
| lane run | Run on a following deployment |
| authoring | Model edits | external | author |
| records | Trace records | database | author |
| snapshots | Version snapshots | database | author |
| generate | generateMigration | backend | gen |
| migration | Migration row | database | gen |
| run | runMigration | backend | run |
| jump | Jump to target model | security | run |
| steps | Data steps | backend | run |
| state | DeploymentState | database | run |
| authoring > records | traced | |
| records > snapshots | freeze or tag | |
| snapshots > generate | diff, replay check | emphasis |
| generate > migration | draft | |
| migration > run | copied | |
| run > jump | model | emphasis |
| run > steps | data | |
| steps > state | recorded | |

@steps id=pipeline-steps
| s1 | Model edits | Each model change made through a commit or a direct write becomes a trace record, if traces are on. | trace-to-run | authoring |
| s2 | Version snapshots | A freeze (internal) fixes the model and adds a version marker to the records. A tag (Git) fixes the commit, whose records end there. | trace-to-run | snapshots |
| s3 | generateMigration | Replays the records from `from` and refuses if they do not give `to`. The changes come from the diff of the two snapshots. | trace-to-run | generate |
| s4 | Migration row | Holds the changes (classified), empty fill steps per added attribute, empty contract steps per removed Entity or attribute. | trace-to-run | migration |
| s5 | Jump | Brings the model to the `to` snapshot: `applyModelState` or a checkout of the tag. The records are not replayed here. | trace-to-run | jump |
| s6 | Steps | Run the designer's data actions on the following deployment, one at a time, each recorded in DeploymentState. | trace-to-run | steps |

The records never travel to the following deployment. They only vouch for the draft. The model a run installs is the snapshot, written with the same action types the records hold.[](source:run-jump)

## Which actions appear where today? {#vocabulary}

| Action | Trace record | Jump | Step today, internal | Step today, Git |
| --- | --- | --- | --- | --- |
| `createEntity`, `alterEntityAttribute` | Recorded | Used | Allowed {bad:Gap} | Refused |
| `renameEntity` | Recorded | Not used: change unsupported, run refused | Allowed {bad:Gap} | Refused |
| `dropEntity` | Recorded | Not used: storage kept for contract | Allowed | Refused |
| `create`/`update`/`deleteInstance` on `model` | Recorded | Used | Allowed {bad:Gap} | Refused |
| `create`/`update`/`deleteInstance` on `data` | Not recorded | Not used | Allowed {good:Purpose of steps} | Allowed |
| Queries and templates in the sequence | Not recorded | Not used | Allowed | Allowed |
| `transactionalInstanceAction` | Recorded as its plain write | Not used | Refused | Refused |
| `resetModel`, `initModel` | Rebaseline marker | Not used | Allowed {bad:Gap} | Allowed {bad:Gap} |
| Undo, redo, store, bundle, report, test run, external service | Not recorded | Not used | Allowed | Allowed |
| Git actions | Not recorded | Checkout of the tag | Not in the step type, not checked | Not in the step type, not checked |

The four rows marked as gaps let a step change the model outside the jump. Before the jump, the jump overwrites the change. After the jump, the deployment's state says `to` while its model differs from `to`. Test C5 even asserts that a nested `createEntity` in a contract step is stored.[](source:c5-test)

## Which actions make sense in a step, then? {#step-vocabulary}

Your intuition holds for the model: every model write of a run belongs to the jump, and the jump already uses only trace actions. A step needs other actions because data is what traces leave out.

| Kind of action | In a step | Why |
| --- | --- | --- |
| Instance writes on `data` (create, update, delete) | Yes {good:Core} | Fill new attributes, move values, clean up rows. Same action types as traced, on a section traces skip. |
| Queries and transformer templates | Yes | Compute the new values from the rows a step reads. |
| `compositeRunTestAssertion`, `compositeFail` | Yes | Stop a run whose data is not as the step expects. |
| Storage drops for removed Entities and attributes | Contract only, once #733 exists | Drop storage, not model rows: the jump already removed the rows. |
| Any model write: Entity actions, writes on `model` or `modelVersion` | No {bad:Diverges from to} | The jump owns the model. |
| `resetModel`, `initModel`, freeze, generate, nested `runMigration` | No | They rewrite or version the model. |
| Git actions, undo, redo, store, bundle, external services | No | Outside what a data step does. |
| `transactionalInstanceAction` | No, or unwrap it | Its write waits for a commit no step makes. |

@callout level=open-question title="Open point for the designer"
Should a fill step ever need an attribute the `to` model removed? Narrowing N3 says no: such a step goes to #215.

## What would #741 then cover? {#issue-741}

@steps id=issue-741-steps
| a | One rule in both modes | A step holds only data writes outside `model` and `modelVersion`, reads, and assertions. The runner checks this list before the first step, as it does today for Git. |
| b | Contract drops | The empty contract steps wait for the storage-drop action of #733. |
| c | Outside a run | A following `versioned-git` deployment refuses Git actions that change its model, so only the jump checks a tag out. |
| d | Test C5 | It is inverted: a nested `createEntity` in a step is refused, in both modes. |

- [ ] Agree that steps are data-only and the jump owns every model write.
- [ ] Decide whether a `transactionalInstanceAction` in a step is refused or unwrapped.
- [ ] Rewrite #741 with points a to d, or split point a into its own issue.
