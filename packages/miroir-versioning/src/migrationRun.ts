/**
 * #9 part C: the run of a Migration on a following deployment (analysis D8). It runs where the stores are,
 * under a lock per deployment: the checks, the copy of the Migration into the deployment's `DeploymentState`
 * row, then the steps in order (expand, the jump of the model to the `to` version, fill, contract), each
 * recorded in `run.stepsDone` once it has run, so that a stopped run resumes at the first step not recorded.
 * At the end, the deployment is at `to` and the Migration is in `applied`.
 */
import {
  Action2Error,
  ACTION_OK,
  type Action2ReturnType,
  type ActionImplementationContext,
  type ActionImplementationHandler,
  type ApplicationDeploymentMap,
  type CompositeActionSequence,
  type DeploymentStateRow,
  deploymentRoleOf,
  type DomainControllerActionHost,
  markMigrationRun,
  type MiroirModelEnvironment,
} from "@miroir-framework/core";

import {
  bringModelToVersion,
  modelEnvironmentOf,
  reloadModel,
  storedDeploymentState,
  writeDeploymentState,
} from "./applicationVersionInstall.js";
import { refusal, storedDeploymentRow } from "./deploymentRole.js";
import { withApplicationLock } from "./evolutionTraceRecords.js";
import type { MigrationRow, MigrationStep } from "./migrationGeneration.js";
import { checkedOutVersion, checkoutVersion, isGitVersioned, migrationAtItsTag } from "./migrationGit.js";
import { liveModelState, type ModelState } from "./modelStates.js";

/** #9: Model Endpoint action that runs a Migration on a following deployment. */
export const RUN_MIGRATION_ACTION_TYPE = "runMigration" as const;

/** Payload of `runMigration`: the uuid of a Migration in the application's `modelVersion` section. */
export type RunMigrationActionPayload = { application: string; migration: string };

/** The `stepsDone` entry of the jump, which is no step of the Migration. */
export const JUMP_STEP = "jump";

/** The reasons a run is refused, by name. */
export const MIGRATION_RUN_REFUSALS = {
  deploymentAuthors: "deploymentAuthors",
  migrationNotFound: "migrationNotFound",
  migrationNotAtFrom: "migrationNotAtFrom",
  migrationRunInProgress: "migrationRunInProgress",
  migrationUnsupportedChange: "migrationUnsupportedChange",
  migrationStepFailed: "migrationStepFailed",
} as const;

type RunState = { migration: MigrationRow; stepsDone: string[]; startedAt: string };

/** The steps of a Migration in the order a run takes them, the jump between expand and fill. */
function runOrder(migration: MigrationRow): (MigrationStep | typeof JUMP_STEP)[] {
  return [...migration.expand, JUMP_STEP, ...migration.fill, ...migration.contract];
}

/** Whether the Migration lets the `from` version run on its data: every change and every step say so. */
function recomputedBackwardCompatible(migration: MigrationRow): boolean {
  return [...migration.changes, ...migration.expand, ...migration.fill, ...migration.contract].every((item) => item.backwardCompatible);
}

/** `action` and the actions of its sequence, marked as a migration run's (D6). */
function markedStep(action: CompositeActionSequence): CompositeActionSequence {
  const sequence = (action.payload?.actionSequence ?? []) as object[];
  return markMigrationRun({
    ...action,
    payload: { ...action.payload, actionSequence: sequence.map((inner) => markMigrationRun(inner)) },
  } as CompositeActionSequence);
}

/** Runs one step of a Migration on the application's deployment; an error names the step. */
async function runStep(
  host: DomainControllerActionHost,
  step: MigrationStep,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Action2Error | undefined> {
  const result = await host.handleCompositeAction(markedStep(step.action), applicationDeploymentMap, modelEnvironment, {});
  return result instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", `runMigration: step "${step.name}" failed`, undefined, result, {
        reason: MIGRATION_RUN_REFUSALS.migrationStepFailed,
        step: step.uuid,
      })
    : undefined;
}

/**
 * The run to do: a new one from the stored Migration, or the one in progress (resume). The Migration of a
 * `versioned-git` application is the one the commit of its `to` tag holds (D8).
 */
async function runToDo(
  host: DomainControllerActionHost,
  payload: RunMigrationActionPayload,
  state: DeploymentStateRow | undefined,
  live: ModelState,
  git: boolean,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<RunState | Action2Error> {
  const inProgress = state?.run as RunState | undefined;
  if (inProgress) {
    return inProgress.migration.uuid === payload.migration
      ? inProgress
      : refusal(
          `runMigration: Migration ${inProgress.migration.uuid} is running on this deployment; run it again to resume it before any other`,
          MIGRATION_RUN_REFUSALS.migrationRunInProgress,
          { migration: inProgress.migration.uuid },
        );
  }
  const stored = git
    ? await migrationAtItsTag(host, payload.application, payload.migration, applicationDeploymentMap)
    : (live.migrations.find((row) => row.uuid === payload.migration) as MigrationRow | undefined);
  if (stored instanceof Action2Error) {
    return stored;
  }
  if (!stored || stored.application !== payload.application) {
    return refusal(
      git
        ? `runMigration: no tag of the repository of ${payload.application} holds Migration ${payload.migration} with that tag as its to`
        : `runMigration: ${payload.application} has no Migration ${payload.migration}`,
      MIGRATION_RUN_REFUSALS.migrationNotFound,
    );
  }
  if (state?.version !== stored.from) {
    return refusal(
      `runMigration: the deployment is at ${state?.version ?? "no known version"}, the Migration starts at ${stored.from}`,
      MIGRATION_RUN_REFUSALS.migrationNotAtFrom,
      { version: state?.version, from: stored.from },
    );
  }
  const unsupported = stored.changes.filter((change) => !change.supported);
  if (unsupported.length > 0) {
    return refusal(
      `runMigration: the Migration holds changes a run cannot make (${unsupported.map((change) => `${change.kind} ${change.entityName ?? change.entity}`).join(", ")}); write them by hand outside Miroir`,
      MIGRATION_RUN_REFUSALS.migrationUnsupportedChange,
      { changes: unsupported },
    );
  }
  // the copy the run uses until it ends, whatever the modelVersion section holds meanwhile (epic D2)
  return {
    migration: { ...structuredClone(stored), backwardCompatible: recomputedBackwardCompatible(stored) },
    stepsDone: [],
    startedAt: new Date().toISOString(),
  };
}

/**
 * The jump of the model to the version `to`: the rewrite to the frozen version (`versioned-internal`), or the
 * checkout of the tag (`versioned-git`), then a reload of the model; a failure names the jump as its step.
 */
async function jump(
  host: DomainControllerActionHost,
  application: string,
  to: string,
  git: boolean,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment | undefined,
): Promise<Action2Error | undefined> {
  const jumped = git
    ? await checkoutVersion(host, application, to, applicationDeploymentMap)
    : await bringModelToVersion(host, application, applicationDeploymentMap, to, modelEnvironment, "runMigration");
  const reloaded = jumped instanceof Action2Error ? jumped : await reloadModel(host, application, applicationDeploymentMap, modelEnvironment);
  return reloaded instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", `runMigration: the jump to ${to} failed`, undefined, reloaded, {
        reason: MIGRATION_RUN_REFUSALS.migrationStepFailed,
        step: JUMP_STEP,
      })
    : undefined;
}

function stateOf(state: DeploymentStateRow | undefined, deploymentUuid: string, application: string) {
  return {
    deployment: deploymentUuid,
    application,
    ...(state?.version !== undefined ? { version: state.version } : {}),
    ...(state?.gitCommit !== undefined ? { gitCommit: state.gitCommit } : {}),
    applied: state?.applied ?? [],
  };
}

async function runMigration(
  host: DomainControllerActionHost,
  payload: RunMigrationActionPayload,
  context: ActionImplementationContext,
  deploymentUuid: string,
): Promise<Action2ReturnType> {
  const { application } = payload;
  const { applicationDeploymentMap } = context;
  const deploymentRow = await storedDeploymentRow(host, deploymentUuid, applicationDeploymentMap);
  if (deploymentRow instanceof Action2Error) {
    return deploymentRow;
  }
  if (deploymentRoleOf(deploymentRow) !== "following") {
    return refusal(
      `runMigration: deployment ${deploymentUuid} of ${application} is an authoring deployment; a Migration runs on a following deployment`,
      MIGRATION_RUN_REFUSALS.deploymentAuthors,
      { deployment: deploymentUuid },
    );
  }
  const state = await storedDeploymentState(host, deploymentUuid, applicationDeploymentMap);
  if (state instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `runMigration: could not read the state of deployment ${deploymentUuid}`, [], state);
  }
  const live = await liveModelState(host, application, applicationDeploymentMap);
  if (live instanceof Action2Error) {
    return live;
  }
  const git = isGitVersioned(live, application);
  const run = await runToDo(host, payload, state, live, git, applicationDeploymentMap);
  if (run instanceof Action2Error) {
    return run;
  }
  const base = stateOf(state, deploymentUuid, application);
  // a copy each time: the written row may be frozen by the local cache
  const record = (stepsDone: readonly string[]) =>
    writeDeploymentState(host, { ...base, run: { ...structuredClone(run), stepsDone: [...stepsDone] } }, applicationDeploymentMap);
  const started = await record(run.stepsDone);
  if (started) {
    return started;
  }

  const stepsDone = [...run.stepsDone];
  for (const step of runOrder(run.migration)) {
    const name = step === JUMP_STEP ? JUMP_STEP : step.uuid;
    if (stepsDone.includes(name)) {
      continue;
    }
    if (step === JUMP_STEP) {
      const failed = await jump(host, application, run.migration.to, git, applicationDeploymentMap, context.modelEnvironment);
      if (failed) {
        return failed;
      }
    } else {
      const failed = await runStep(host, step, applicationDeploymentMap, modelEnvironmentOf(host, application, applicationDeploymentMap, context.modelEnvironment));
      if (failed) {
        return failed;
      }
    }
    stepsDone.push(name);
    const recorded = await record(stepsDone);
    if (recorded) {
      return recorded;
    }
  }

  // the commit of a `versioned-git` deployment is its checkout of `to`, still there when the run ends
  const gitCommit = git ? await checkedOutVersion(host, application, run.migration.to, applicationDeploymentMap, "runMigration") : undefined;
  if (gitCommit instanceof Action2Error) {
    return gitCommit;
  }
  const ended = await writeDeploymentState(
    host,
    {
      ...base,
      ...(gitCommit ? { gitCommit } : {}),
      version: run.migration.to,
      applied: [
        ...base.applied,
        { migration: run.migration.uuid, from: run.migration.from, to: run.migration.to, finishedAt: new Date().toISOString() },
      ],
    },
    applicationDeploymentMap,
  );
  return ended ?? ACTION_OK;
}

/**
 * `runMigration`: refused on an authoring deployment, when the deployment is not at the Migration's `from`
 * version, when the Migration holds an unsupported change, and while another Migration runs on the
 * deployment. Two runs on one deployment never interleave.
 */
export const handleAction_runMigration: ActionImplementationHandler = (host, action, context): Promise<Action2ReturnType> => {
  const payload = action.payload as RunMigrationActionPayload;
  const deploymentUuid = context.applicationDeploymentMap[payload.application];
  if (!deploymentUuid) {
    return Promise.resolve(new Action2Error("FailedToHandleAction", `runMigration: no deployment of ${payload.application}`));
  }
  return withApplicationLock(`deployment:${deploymentUuid}`, () => runMigration(host, payload, context, deploymentUuid));
};
