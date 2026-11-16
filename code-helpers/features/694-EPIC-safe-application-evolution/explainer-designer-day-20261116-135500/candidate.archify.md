# How does a model change reach a following deployment, with and without Git? {#designer-day}

The designer changes the model on the **authoring deployment** and fixes versions. A **following deployment** never replays those edits: a **Migration** moves it. Its **jump** takes the target model from the version itself: a frozen snapshot without Git, the tag's checkout with Git.

- The jump is the model half of a run. Steps before and after it change data.[](source:epic-d2)
- Without Git, the jump rewrites the model to the frozen `to` version with `createEntity`, `alterEntityAttribute` and instance writes on `model`.[](source:apply-model)
- With Git, the jump checks the tag out and reloads the model: the files carry the model, so no model action runs.[](source:run-jump)
- The epic chose this over replaying the traced model actions, because a replayed `createEntity` empties existing storage on three stores.[](source:epic-d2)

@answer scope="Library example of epic #694, section 5, against the code on _integration after #9 (#739, #740, #742). Rollback (#709) and the clone installer (#710) are not built yet."
@meta locale=en
@source epic-day title="Epic #694, section 5: a designer's day in each setting" path=code-helpers/features/694-EPIC-safe-application-evolution/analysis.md lines=107:149
@source epic-d2 title="Epic #694, D2-d: expand, jump, fill, contract" path=code-helpers/features/694-EPIC-safe-application-evolution/analysis.md lines=200:234
@source epic-d7 title="Epic #694, D7: data outside the Git work tree" path=code-helpers/features/694-EPIC-safe-application-evolution/analysis.md lines=289:294
@source apply-model title="The jump without Git: applyModelState" path=packages/miroir-versioning/src/applicationVersionInstall.ts lines=159:258
@source bring-model title="bringModelToVersion: read the frozen version, then rewrite" path=packages/miroir-versioning/src/applicationVersionInstall.ts lines=381:446
@source run-jump title="The jump of a run" path=packages/miroir-versioning/src/migrationRun.ts lines=216:239
@source git-checkout title="The jump with Git: checkout of refs/tags/to" path=packages/miroir-versioning/src/migrationGit.ts lines=113:130
@source gen-check title="Generation: replay check, then draft from the two snapshots" path=packages/miroir-versioning/src/migrationGeneration.ts lines=536:573

## Without Git: what happens on each deployment? {#internal-day}

@workflow id=internal-flow title="versioned-internal: Book gains isbn"
| lane iauthor | Authoring deployment |
| lane ifollow | Following deployment |
| ifreeze1 | Freeze 1.0.0 | backend | iauthor |
| iedit | Add Book.isbn | external | iauthor |
| ifreeze2 | Freeze 1.1.0 | backend | iauthor |
| igen | Generate migration | backend | iauthor |
| iinstall | Install 1.0.0 | database | ifollow |
| iexpand | Expand steps | backend | ifollow |
| ijump | Jump to 1.1.0 | security | ifollow |
| ifill | Fill isbn | backend | ifollow |
| istate | State at 1.1.0 | database | ifollow |
| ifreeze1 > iedit | | |
| iedit > ifreeze2 | trace record | |
| ifreeze2 > igen | | |
| igen > iinstall | shared modelVersion | dashed |
| iinstall > iexpand | runMigration | |
| iexpand > ijump | | |
| ijump > ifill | | emphasis |
| ifill > istate | | |

@steps id=internal-steps
| i1 | Freeze 1.0.0 | Snapshots every model element into `modelVersion` and adds a version marker to the trace records. | internal-flow | ifreeze1 |
| i2 | Add Book.isbn | The commit updates the Book Entity row and writes one trace record. | internal-flow | iedit |
| i3 | Generate migration | Replays the records on 1.0.0 and checks they give 1.1.0. The draft lists the change and an empty fill step. | internal-flow | igen |
| i4 | Install 1.0.0 | The following deployment is created at a version: the model is rewritten to the frozen 1.0.0. | internal-flow | iinstall |
| i5 | Jump to 1.1.0 | Rewrites the model to the frozen 1.1.0: `alterEntityAttribute` adds the isbn column, then the Book row is updated. | internal-flow | ijump |
| i6 | Fill isbn | The designer's data step computes isbn for existing books. | internal-flow | ifill |

The two deployments share only the `modelVersion` storage: versions, records and Migrations.[](source:epic-day)

## With Git: what changes? {#git-day}

@workflow id=git-flow title="versioned-git: Book gains isbn"
| lane gauthor | Authoring clone |
| lane gfollow | Following clone |
| gtag1 | Commit, tag 1.0.0 | backend | gauthor |
| gedit | Add Book.isbn, commit | external | gauthor |
| ggen | Generate, commit it | backend | gauthor |
| gtag2 | Tag 1.1.0 | backend | gauthor |
| gat | Clone at 1.0.0 | database | gfollow |
| gread | Read Migration at 1.1.0 | backend | gfollow |
| gjump | Jump: checkout 1.1.0 | security | gfollow |
| gfill | Fill isbn | backend | gfollow |
| gstate | State at 1.1.0 | database | gfollow |
| gtag1 > gedit | | |
| gedit > ggen | trace file | |
| ggen > gtag2 | | |
| gtag2 > gat | fetch | dashed |
| gat > gread | runMigration | |
| gread > gjump | after expand | |
| gjump > gfill | | emphasis |
| gfill > gstate | | |

@steps id=git-steps
| g1 | Generate, commit it | Reads tag 1.0.0 and HEAD, writes the Migration file; it is committed before the tag, so version 1.1.0 holds its own Migration. | git-flow | ggen |
| g2 | Read Migration at 1.1.0 | The runner reads it from the tag's commit without a checkout and copies it into the state record. | git-flow | gread |
| g3 | Jump: checkout 1.1.0 | Checks out `refs/tags/1.1.0` and reloads; the model files change on disk, no model action runs. | git-flow | gjump |
| g4 | Fill isbn | Writes data, which sits in a folder Git ignores, so the checkout never touches it. | git-flow | gfill |

Section 5.2 puts the data outside the clone (D7); #9 uses a gitignored folder inside it until the installer of #710 exists.[](source:epic-d7)

## What exactly is the jump? {#jump}

The epic defines it in D2-d, not in its vocabulary: the jump **brings the model to the target version**, between the expand and the fill steps.[](source:epic-d2)

| | Without Git | With Git |
| --- | --- | --- |
| Source of the target model | Frozen `*Version` rows of `to` | Files at the tag `to` |
| What runs | `applyModelState`: model actions and instance writes, marked as the run's | `gitAction_checkout`, then a reload |
| Model actions issued | `createEntity` for an added Entity, `alterEntityAttribute` for an added attribute, create, update and delete of model rows | None |
| Storage of removed elements | Kept, for a contract step | Kept |
| Storage of added elements | Created by the model actions {good:Yes} | Not created; works for filesystem data, not tested on SQL {caution:Gap} |
| Epic plan | Restore action (D6, #709) plus add-only reconciliation | Checkout plus Q31 check plus reconciliation |
| In #9 | Restore built underneath, reconciliation set aside (N5) | Checkout and reload only |

The same jump installs a new following deployment at its first version.[](source:bring-model)

## So should a run allow model actions? {#model-actions}

Yes: model actions are how the model migrates, and without Git a run does issue them. The jump derives them from the frozen `to` version, so the model ends exactly at `to`. The question is only whether a hand-written step may issue more of them.

| Where a model action could come from | Effect on the following model | Status |
| --- | --- | --- |
| The jump, derived from the `to` snapshot | Model equals `to` {good:Exact} | Built (#9) |
| An expand step, before the jump | Overwritten by the jump | Allowed today without Git |
| A fill or contract step, after the jump | Model differs from `to`, while the state says `to` {bad:Diverges} | Allowed today without Git |
| Replaying the traced actions instead of a jump (D2-a) | Model reaches `to`; a replayed `createEntity` empties its storage on SQL, IndexedDB and MongoDB | Rejected by the epic |
| Any step, with Git | Blocks the next checkout, since it edits tracked files | Refused |

@callout level=open-question title="The choice for #741"
Keep D2-d: the jump owns every model write, steps change data, and a run refuses model actions in steps in both settings. Or let steps hold model actions without Git, and accept that a run can end with a model other than `to`.

## What did #9 implement differently from section 5? {#deviations}

| Section 5 says | #9 does | Why |
| --- | --- | --- |
| The draft comes from the trace records (D12) | Changes come from the diff of the two versions; records are replayed only to vouch for it | Same result when the replay check passes |
| The jump reconciles storage add-only | Storage changes only through the jump's model actions | Set aside by you (N5) |
| Git data lives outside the work tree (D7) | A gitignored folder inside the clone | The installer is #710 |
| Roll back by restoring 1.0.0 | Not built | #709 |
| A following deployment refuses model commits | Refused for instance and model actions; Git actions and CRUD routes still pass | #741, #743 |

- [ ] Add the jump to the epic's vocabulary.
- [ ] Decide whether steps may hold model actions without Git.
- [ ] Decide whether the Git jump must create storage for SQL data.
