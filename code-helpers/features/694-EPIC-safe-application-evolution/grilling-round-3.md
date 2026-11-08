# Safe application evolution epic: grilling round 3

Settled in round 2 (answers of 2026-11-07): Q16, Q18, Q19, Q21, Q23 to Q27 as recommended. Q20 is (b): a frozen snapshot and the traces must agree, and the model changes only through the supported interface. During troubleshooting the model may be corrected outside Miroir, or the traces and snapshot corrected from inside Miroir. Inverse migrations are not a goal of the traces. Rollback goes to an explicitly frozen snapshot.

## Answers to your questions

**Q17, performance.** A before-image would not have meant a full snapshot after each action. It is a copy of only the element the action changed, for example the one Entity row for an `alterEntityAttribute`, or the one Report for a Report update. That is a few kilobytes and one extra file written per action. The model as a whole is never copied between freezes.

Your two answers remove the need for it anyway. Rollback goes to a frozen snapshot, so no inverse is needed. And Q20 (b) guarantees that the previous snapshot plus the traces replayed in order rebuild the model at any point. Migration generation can then rebuild the model before each action, in memory, when it needs the old attribute type or name. That replay happens only when someone prepares a migration, never during editing. Q28 asks you to confirm dropping the before-image.

**Q22, deployment or SelfApplication.** Each holds a different part. A Deployment row already points at exactly one SelfApplication (`selfApplication` in the Admin `Deployment` schema), and one application has several deployments: dev, test, perhaps prod.
- The application owns the versions. Frozen versions, traces and Migration instances live in its `modelVersion` and are shared by all its deployments.
- The deployment owns "where my data is". The record of the model state and the applied migrations is per deployment, in Admin data, keyed by the Deployment uuid. It reaches the application through `Deployment.selfApplication`.

So the record is tied to the deployment, and through it to the application, without duplicating the application uuid. A test and a dev deployment of Library can sit at different versions.

---

❓ **Q28** - **Content of a trace record.** Following the above: the resolved Action only, with no before-image. The previous model state is rebuilt by replay when it is needed.

➡️ Yes.

❓ **Q29** - **Where the agreement between snapshot and traces is checked (Q20 b).** Candidates:
- Without Git, at freeze: the previous frozen snapshot plus the traces since then must equal the live model, or the freeze is refused and the differences are shown.
- With Git, at commit from the Git page (#681): the model at HEAD plus the trace records being committed must equal the working model, or the commit is refused for that application's files.
- In both modes, at migration generation: the same check between the two model states, refused on mismatch.
Edits made outside Miroir (IDE, command-line `git`) cannot be blocked. The last check catches them.

➡️ All three.

❓ **Q30** - **Repair from inside Miroir.** Trace records, frozen versions and Migrations are ordinary instances in `modelVersion`, so the generic instance editors can already change them. Is that enough for the experimental period, or do you also want a "re-baseline" action? It would freeze the live model as a new snapshot, close the open traces, and record a re-baseline marker. Migration generation would then refuse to cross that marker without a migration written by hand.

➡️ Generic editors plus the re-baseline action. Without the action, a model corrected outside Miroir has no clean way back to a state where snapshot and traces agree.

❓ **Q31** - **Rolling back an application that holds data.** Inverse migrations are out, so restoring the model to snapshot Vk while a deployment's data is at Vn needs another way. Options:
(a) allowed when every migration applied between Vk and Vn is backward-compatible (the Q23 check), since the data then still fits Vk. Otherwise refused, with the deployment's state record naming the blocking migration;
(b) always allowed for the model, and the operator restores the data from a store backup taken before the migration (filesystem copy, `pg_dump`), outside Miroir;
(c) the migration runner takes that backup itself before each run.

➡️ (a), with (b) as the documented fallback when (a) refuses. (c) is a later sub-issue if the experiments show it is needed.

❓ **Q32** - **Rollback with Git.** With Git, a frozen snapshot is a Git tag (Q7), so rolling back the model means checking out the tag on the Git page. The checks of Q29 and the rule of Q31 still apply to the data. Is there anything else Miroir must do on rollback in Git mode?

➡️ No. Checkout already rereads the model in the stores (#681). The only addition is Q31's check before the checkout of an older tag, for deployments whose data was migrated.

---

If these five are settled, the frontier is empty. Next step: I write the consolidated decisions into the epic body, create the epic and sub-issues 1 to 5 of Q26, and add them to Project 2.
