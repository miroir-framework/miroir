# Safe application evolution epic: grilling round 1

Settled in your message of 2026-11-07:

- Evolution traces come back (option C), as one sub-issue of a new epic on the whole topic, after #225, #239, #230 and #589.
- #225 joins the epic. Its open ACs are: the application stays selected inside report `c2b89408-…` (already OK), a freeze on an unversioned app shows a clear error, unversioned apps are greyed out in the freeze Runner, and the Runner is reachable from the Runners page.
- #239 joins the epic. It must be checked and, if it still reproduces, fixed with a clean review before anything else goes on. I am checking it now; questions that depend on the result wait for round 2.
- #230 then gives a full snapshot on every freeze. #589 comes after #230, with tests where needed.
- The epic needs an analysis of versioning with and without a Git repository holding the model.
- End goal: an application evolves safely, with model restore points and data migration scripts for test and validation environments (production later). Two workflows are supported: strict versioning (major / minor / patch, tags, packages) and continuous delivery (feature switches, one-shot rollback).
- Process capabilities or application parameters select the versioning features. Features not in use cost almost nothing.
- Git is today the only sound way for several designers to change the same application at once. Without Git, the last writer wins.
- A data migration script is probably an Action sequence.

---

## Epic structure

❓ **Q1** - **Epic and its sub-issues.** I would create "EPIC: safe application evolution (restore points, versioning workflows, migrations)" and add it to Project 2. Which existing issues become sub-issues?
(a) only the ones you named: #225, #239, #230, #589, plus new ones for the ways-of-working analysis and the trace revival;
(b) the same, plus #9 (rescoped to "migrations between two model states") and #215 (paired data migrations), with #15 closed as superseded by #217;
(c) the same as (b), and #191 / #192 (attribute update impacts, move attributes between entities) as later consumers of migrations.

➡️ (b). #9 and #215 describe exactly the migration end goal; #191 / #192 are model-editing features that will use migrations, not part of building them. #15 runs against #217 (the live Entity is authoritative).

❓ **Q2** - **When is the ways-of-working analysis written?** Your order puts the trace revival last, but the analysis decides which parameters exist (for example whether "versioned-external" stays a mode). Options:
(a) write it first, as a document only, before #225;
(b) write it after #589, just before the traces;
(c) start it now in parallel with #225 / #239 / #230, finish it before the traces.

➡️ (c). #225, #239 and #230 do not depend on it, and the trace design does. Starting early gives the experimental period something to test against.

## #225 open ACs

❓ **Q3** - **Which apps are greyed out in the freeze Runner?** The AC says `versioningEnabled: false`. Since #234 the field is `versioningMode` (`unversioned`, `versioned-internal`, `versioned-external`), with `versioningEnabled` as the legacy flag. Options:
(a) grey out everything except `versioned-internal` (`isApplicationVersioningCapable`);
(b) grey out only `unversioned`, and let `versioned-external` freeze too.

➡️ (a), with the reason in the tooltip ("not versioned" or "history is kept in Git"). Q7 may later change what `versioned-external` means; the greying follows the same helper, so it changes in one place.

❓ **Q4** - **Default application in the Runner.** The form starts on the hard-coded `31f3a03a-…` today. When opened from the Runners page, should it default to the application selected in the sidebar (as the Versioning report does), or to no selection?

➡️ The sidebar application when it is versioned-internal, otherwise empty, so a click on Freeze never targets an app you did not choose.

❓ **Q5** - **How the error shows.** For a freeze refused because the app is unversioned (reachable only by bypassing the greyed list, e.g. through MCP or a stale form): an inline error in the Runner result area with the `Action2Error` reason, or the global snackbar?

➡️ Inline in the Runner, like other Runner action errors, and the MiroirTest checks the text.

## Versioning profiles

❓ **Q6** - **Where the choice lives.** You named process capabilities or application parameters. I see two levels:
- application level (SelfApplication row, like `versioningMode` today): which mechanisms this application uses (snapshots, traces, Git, feature switches);
- process level (process capability, like `git`): whether this process loads the code at all, which is what keeps the footprint negligible.
Options: (a) both levels, application params can only enable what the process capability allows; (b) application level only; (c) process level only.

➡️ (a). It matches how `git` works today (capability + per-deployment repository) and lets a lightweight build drop the code entirely.

❓ **Q7** - **Freeze when the model is in Git.** You said Git likely means no freezes. Then a "version" in a Git-backed app is a Git tag, and a "snapshot" is the `*_model/` folder read at that tag. Is that the intent, so that the `modelVersion` section is unused in Git-backed apps and snapshot diffs read two Git revisions?

➡️ Yes. One history, not two. The snapshot-diff code then takes two model states as input, whatever their source (two frozen versions or two Git revisions).

❓ **Q8** - **Where traces live when the model is in Git.** Traces must follow branches and survive merges. Options:
(a) trace files committed next to the model (e.g. `*_modelEvolution/`), one file per Miroir commit, so Git carries them across branches and a merge keeps both sides;
(b) traces in a store outside Git, keyed by Git commit id;
(c) traces in the commit message or Git notes.

➡️ (a). It works offline, survives clone and merge, and ordering comes from Git ancestry. (b) loses traces on clone; (c) is fragile with rebase and squash.

❓ **Q9** - **Where traces live without Git.** Today they sit in the live `model` section. Options: (a) the `modelVersion` section, attached to the frozen version they lead to; (b) their own section; (c) keep `model`.

➡️ (a). The log between two frozen versions belongs to the later version, which is the WP2 drawing.

❓ **Q10** - **Shape of a data migration script.** You guessed an Action sequence. Options:
(a) a `CompositeActionSequence` (instance Actions and transformers) stored as an instance of a new `Migration` Entity, generated as a draft from traces or snapshot diffs, then edited by the designer;
(b) generated on the fly at apply time, never stored;
(c) SQL / DDL scripts per backend.

➡️ (a). It runs on every store backend, a designer can review and edit it, and it can be tested as a MiroirTest. DDL generation (your "potentially even model evolution scripts") can come later as a second output of the same trace.

❓ **Q11** - **What a restore point restores.** Options:
(a) the model only; data is migrated back by an inverse migration when one exists, otherwise restore is refused for data-carrying apps;
(b) model and data together, through a store-level backup;
(c) model only, data left as is.

➡️ (a) for strict workflows, plus (b) as the one-shot rollback of the continuous-delivery workflow, delegated to the store (filesystem copy, SQL dump) rather than built into Miroir.

❓ **Q12** - **Measuring "negligible footprint".** Options: (a) move snapshots, traces and migrations into their own lazily loaded package (like `@miroir-framework/git`), and check the bundle-size history; (b) keep them in core behind flags and measure runtime cost only.

➡️ (a). The bundle-size history from #473 / #647 can then show the cost, and the switch is binary.

❓ **Q13** - **How to run the experimental period.** Options:
(a) a matrix of versioning profiles (Git or not, snapshots on or off, traces on or off, feature switches on or off) run on the Library example with one scripted evolution scenario (add attribute, rename, split entity), plus a findings log in the epic folder;
(b) free exploration, findings written up at the end.

➡️ (a). The scenario also becomes the epic's regression test, and the log records which combinations work.

❓ **Q14** - **Concurrent designers without Git.** Is "last writer wins, coordinate by hand" an accepted, documented limitation for this epic, with Git as the answer for concurrent work?

➡️ Yes, out of scope for this epic. A Miroir-level merge or locking mechanism would be its own epic.

---

## #239 check (result)

#239 no longer reproduces on `_integration` (4717606). `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningModes.filesystem-seed` passes all 4 tests, including the #239 assertion, which is active. On disk (`.miroir/test-filesystem/`, which replaced `tests/tmp/`), the EntityVersion and SelfApplicationVersion folders exist only under `modelVersion/`. No commit names #239. The fix is probably `PersistenceStoreController.ts:539-547` (#232/#234: `bootFromPersistedState` drops version-history entities from the model list, so `data` never creates them) together with `ModelInitializer.ts:181-187` (#577: a versioned-internal app's SelfApplicationVersion goes to `modelVersion`). The test still carries a stale "FAILS BY DESIGN" comment.

❓ **Q15** - **Closing #239.** Options: (a) close it now with a comment giving this evidence, and drop the stale comment in the #225 PR; (b) a separate small PR that drops the comment and says `Closes #239`.

➡️ (b), so the issue closes through the usual review path you asked for, and the PR is a one-line change.
