/**
 * #9 part C, #745: the migration run of a Migration on a following deployment. It runs where the stores are,
 * under a lock per deployment: the checks, the copy of the Migration into the deployment's `DeploymentState`
 * row, then the steps in the order of the Migration's one list (#745 D1). A `model` step executes one model
 * Action the designer ran (or, in `versioned-git`, the checkout of the `to` tag), then reloads the model; a
 * `data` step executes its composite action sequence.
 *
 * Strict (#745 D5): each step is recorded as started (`run.stepStarted`) before it executes and as done
 * (`run.stepsDone`) after. A migration run stopped between two steps continues at the first step not
 * started; a step recorded as started and not done is in doubt, and stops every later `runMigration`
 * (`migrationStepInDoubt`) until the operator settles it with `settleMigrationStep`. A Migration already
 * applied is refused (`migrationAlreadyApplied`). At the end, the deployment is at `to` and the Migration
 * is in `applied`.
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

import { modelEnvironmentOf, reloadModel, storedDeploymentState, writeDeploymentState } from "./applicationVersionInstall.js";
import { refusal, storedDeploymentRow } from "./deploymentRole.js";
import { withApplicationLock } from "./evolutionTraceRecords.js";
import { migrationBackwardCompatible, type MigrationRow } from "./migrationGeneration.js";
import { checkedOutVersion, checkoutVersion, isGitVersioned, migrationAtItsTag } from "./migrationGit.js";
import {
  GIT_CHECKOUT_ACTION_TYPE,
  INSTANCE_WRITE_ACTION_TYPES,
  MODEL_ENDPOINT_UUID,
  MODEL_STEP_ACTION_TYPES,
  differencesText,
  modelStateDifferences,
  stepsReplayDifferences,
  type MigrationModelStepAction,
  type MigrationStep,
} from "./migrationSteps.js";
import { frozenCollectionsOf, frozenStateOf, liveModelState, type ModelState } from "./modelStates.js";

/** #9: Model Endpoint action that runs a Migration on a following deployment. */
export const RUN_MIGRATION_ACTION_TYPE = "runMigration" as const;

/** #745: Model Endpoint action that settles the step a stopped migration run left in doubt. */
export const SETTLE_MIGRATION_STEP_ACTION_TYPE = "settleMigrationStep" as const;

/** Payload of `runMigration`: the uuid of a Migration in the application's `modelVersion` section. */
export type RunMigrationActionPayload = { application: string; migration: string };

/**
 * Payload of `settleMigrationStep`: the step in doubt, and what the operator found: `done` (its writes all
 * landed, or were completed by hand), or `notRun` (none of them landed, or they were undone by hand).
 */
export type SettleMigrationStepActionPayload = { application: string; step: string; outcome: "done" | "notRun" };

/** The reasons a migration run, or the settlement of a step, is refused, by name. */
export const MIGRATION_RUN_REFUSALS = {
  deploymentAuthors: "deploymentAuthors",
  migrationAlreadyApplied: "migrationAlreadyApplied",
  migrationModelMismatch: "migrationModelMismatch",
  migrationNotFound: "migrationNotFound",
  migrationNotAtFrom: "migrationNotAtFrom",
  migrationReferenceMissing: "migrationReferenceMissing",
  migrationRunInProgress: "migrationRunInProgress",
  migrationStepFailed: "migrationStepFailed",
  migrationStepInDoubt: "migrationStepInDoubt",
  migrationStepNotInDoubt: "migrationStepNotInDoubt",
  migrationStepsInvalid: "migrationStepsInvalid",
  migrationStepWritesModel: "migrationStepWritesModel",
  migrationUnsupportedChange: "migrationUnsupportedChange",
  versionNotCheckedOut: "versionNotCheckedOut",
} as const;

/** The model actions that wait in the transaction unless they say `transactional: false`. */
const TRANSACTIONAL_MODEL_ACTIONS: ReadonlySet<string> = new Set(["createEntity", "dropEntity", "renameEntity", "alterEntityAttribute"]);

type StepAction = { actionType?: string; endpoint?: string; payload?: Record<string, unknown> };

/** The actions of a step, those of nested sequences included. */
function stepActions(action: StepAction): StepAction[] {
  const sequence = (action.payload?.actionSequence ?? []) as StepAction[];
  return [action, ...sequence.flatMap((inner) => stepActions(inner))];
}

/** Whether an action of a step writes the application's model or `modelVersion` section. */
function writesModel(action: StepAction): boolean {
  return (
    (action.endpoint === MODEL_ENDPOINT_UUID && TRANSACTIONAL_MODEL_ACTIONS.has(action.actionType ?? "")) ||
    action.payload?.applicationSection === "model" ||
    action.payload?.applicationSection === "modelVersion"
  );
}

type RunState = { migration: MigrationRow; stepsDone: string[]; stepStarted?: string; startedAt: string };

/** A step named for a person: its name and its uuid. */
function stepLabel(step: Pick<MigrationStep, "name" | "uuid"> | undefined, uuid: string): string {
  return step ? `"${step.name}" (${step.uuid})` : uuid;
}

/**
 * Why the steps of a Migration cannot be run, or `undefined`: a row in the shape of #9 (`expand`, `fill`,
 * `contract`), a step that is not a model or data step, two steps with one uuid, a transactional instance
 * action, a model step holding no model Action. In `versioned-git`, the one model step is the checkout of
 * `to` (exactly one), and no data step writes the model.
 */
function stepsRefusal(migration: MigrationRow, git: boolean): Action2Error | undefined {
  const row = migration as unknown as Record<string, unknown>;
  if (!Array.isArray(row.steps) || ["expand", "fill", "contract"].some((phase) => phase in row)) {
    return refusal(
      `runMigration: Migration ${migration.uuid} has no list of steps, or is in the shape of #9 (expand, fill, contract); generate it again, or write its steps by hand`,
      MIGRATION_RUN_REFUSALS.migrationStepsInvalid,
      { migration: migration.uuid },
    );
  }
  const steps = migration.steps;
  const malformed = steps.find(
    (step) =>
      !step ||
      typeof step.uuid !== "string" ||
      typeof step.name !== "string" ||
      (step.kind !== "model" && step.kind !== "data") ||
      !step.action ||
      typeof step.action !== "object",
  );
  if (malformed !== undefined) {
    return refusal(
      `runMigration: a step of Migration ${migration.uuid} has no uuid, name, kind ("model" or "data") or action: ${JSON.stringify(malformed)}`,
      MIGRATION_RUN_REFUSALS.migrationStepsInvalid,
    );
  }
  const uuids = steps.map((step) => step.uuid);
  if (uuids.some((uuid, index) => uuids.indexOf(uuid) !== index)) {
    return refusal(
      "runMigration: the steps of a Migration need distinct uuids, for a migration run to record them",
      MIGRATION_RUN_REFUSALS.migrationStepsInvalid,
    );
  }
  // a transactional instance action waits in the local cache until a commit no step does: its writes would
  // be recorded as done, then dropped by the reload after a model step
  if (steps.some((step) => stepActions(step.action as StepAction).some((action) => action.actionType === "transactionalInstanceAction"))) {
    return refusal(
      "runMigration: a step holds a transactionalInstanceAction, whose writes wait for a commit no step makes; use createInstance, updateInstance or deleteInstance",
      MIGRATION_RUN_REFUSALS.migrationStepsInvalid,
    );
  }
  const modelSteps = steps.filter((step) => step.kind === "model");
  if (git) {
    // the model of a versioned-git deployment is its checkout: any other model write blocks the checkout
    const writing = [
      ...modelSteps.filter((step) => (step.action as MigrationModelStepAction).actionType !== GIT_CHECKOUT_ACTION_TYPE),
      ...steps.filter((step) => step.kind === "data" && stepActions(step.action as StepAction).some(writesModel)),
    ];
    if (writing.length > 0) {
      return refusal(
        `runMigration: in versioned-git the model comes from the tag; steps ${writing.map((step) => step.name).join(", ")} write the model`,
        MIGRATION_RUN_REFUSALS.migrationStepWritesModel,
        { steps: writing.map((step) => step.uuid) },
      );
    }
    // the one checkout, of `to`: without it the migration run would end on a model it did not check out
    const checkouts = modelSteps.map((step) => (step.action as MigrationModelStepAction).payload?.version);
    if (checkouts.length !== 1 || checkouts[0] !== migration.to) {
      return refusal(
        `runMigration: in versioned-git a Migration has one model step, the checkout of its to (${migration.to}); Migration ${migration.uuid} checks out ${checkouts.length === 0 ? "nothing" : checkouts.map(String).join(", ")}`,
        MIGRATION_RUN_REFUSALS.migrationStepsInvalid,
        { migration: migration.uuid },
      );
    }
    return undefined;
  }
  const notModel = modelSteps.find((step) => {
    const action = step.action as MigrationModelStepAction;
    return !(
      MODEL_STEP_ACTION_TYPES.has(action.actionType) ||
      (INSTANCE_WRITE_ACTION_TYPES.has(action.actionType) && (action.payload?.applicationSection ?? "model") === "model")
    );
  });
  if (notModel) {
    return refusal(
      `runMigration: model step ${stepLabel(notModel, notModel.uuid)} holds ${String((notModel.action as StepAction).actionType)}, which is no model Action nor a write of a model row`,
      MIGRATION_RUN_REFUSALS.migrationStepsInvalid,
      { step: notModel.uuid },
    );
  }
  return undefined;
}

/**
 * `action` and the actions of its sequences, nested ones included, marked as a migration run's. A model
 * action runs outside the transaction (`transactional: false`): a step's writes are stored before the step
 * is recorded, and the reload after a model step would drop pending ones.
 */
function markedStep<T extends StepAction>(action: T): T {
  const payload = action.payload ?? {};
  const sequence = payload.actionSequence as StepAction[] | undefined;
  return markMigrationRun({
    ...action,
    payload: {
      ...payload,
      ...(sequence ? { actionSequence: sequence.map((inner) => markedStep(inner)) } : {}),
      ...(action.endpoint === MODEL_ENDPOINT_UUID && TRANSACTIONAL_MODEL_ACTIONS.has(action.actionType ?? "") ? { transactional: false } : {}),
    },
  } as T);
}

/**
 * Executes one step on the application's deployment. A model step executes its model Action (or its
 * instance write of a model row, or the Git checkout), then reloads the model; a data step executes its
 * composite action sequence. An error names the step.
 */
async function executeStep(
  host: DomainControllerActionHost,
  application: string,
  step: MigrationStep,
  git: boolean,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2Error | undefined> {
  // the model environment is read again for each step: the model steps change it
  const modelEnvironment: MiroirModelEnvironment = modelEnvironmentOf(host, application, applicationDeploymentMap, undefined);
  let result: Action2ReturnType | string | undefined;
  if (step.kind === "data") {
    result = await host.handleCompositeAction(markedStep(step.action as StepAction) as CompositeActionSequence, applicationDeploymentMap, modelEnvironment, {});
  } else {
    const action = step.action as MigrationModelStepAction;
    if (git) {
      result = await checkoutVersion(host, application, String(action.payload.version), applicationDeploymentMap);
    } else if (MODEL_STEP_ACTION_TYPES.has(action.actionType)) {
      result = await host.handleModelAction(
        markMigrationRun({ ...action, payload: { ...action.payload, application, transactional: false } }) as any,
        applicationDeploymentMap,
        modelEnvironment,
      );
    } else {
      result = await host.handleInstanceAction(
        markMigrationRun({ ...action, payload: { ...action.payload, application } }) as any,
        applicationDeploymentMap,
      );
    }
    if (!(result instanceof Action2Error)) {
      result = await reloadModel(host, application, applicationDeploymentMap, undefined);
    }
  }
  return result instanceof Action2Error
    ? new Action2Error("FailedToHandleAction", `runMigration: step ${stepLabel(step, step.uuid)} failed`, undefined, result, {
        reason: MIGRATION_RUN_REFUSALS.migrationStepFailed,
        step: step.uuid,
        stepName: step.name,
      })
    : undefined;
}

/**
 * #745 D6: the reference of the version named `name`: its frozen model state, read from the `modelVersion`
 * rows the deployment reads. Refused (`migrationReferenceMissing`) when no version row has that name, when
 * several have it, or when its Cross rows name version rows that are missing.
 */
function referenceState(live: ModelState, application: string, name: string): ModelState | Action2Error {
  const named = live.applicationVersions.filter(
    (row) => row.name === name && ((row as { selfApplication?: string }).selfApplication ?? application) === application,
  );
  const missing = (why: string) =>
    refusal(
      `runMigration: no reference for version ${name} of ${application}: ${why}; a migration run checks the model against the frozen versions it goes from and to`,
      MIGRATION_RUN_REFUSALS.migrationReferenceMissing,
      { version: name },
    );
  if (named.length !== 1) {
    return missing(named.length === 0 ? "the modelVersion section holds no Application Version of that name" : "several Application Versions have that name");
  }
  const incomplete = frozenCollectionsOf(live, named[0].uuid).filter(({ missingVersionRows }) => missingVersionRows.length > 0);
  if (incomplete.length > 0) {
    return missing(`its Cross rows name rows it does not hold (${incomplete.map(({ collection }) => collection).join(", ")})`);
  }
  return frozenStateOf(live, named[0].uuid);
}

/** #745 D6: the refusal of a model that differs from a reference, the differences listed, or `undefined`. */
function mismatchRefusal(
  differences: ReturnType<typeof modelStateDifferences> | Action2Error,
  what: string,
  context: Record<string, unknown>,
): Action2Error | undefined {
  if (differences instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `runMigration: ${what}: could not replay the steps`, [], differences, {
      reason: MIGRATION_RUN_REFUSALS.migrationModelMismatch,
      ...context,
    });
  }
  return differences
    ? refusal(`runMigration: ${what}: ${differencesText(differences)}`, MIGRATION_RUN_REFUSALS.migrationModelMismatch, {
        ...context,
        differences,
      })
    : undefined;
}

/**
 * #745 D6, before step 1 of a new migration run: the live model must be the `from` version, and the model
 * steps, replayed in memory on it, must give the `to` version.
 */
function referenceRefusal(live: ModelState, migration: MigrationRow): Action2Error | undefined {
  const fromReference = referenceState(live, migration.application, migration.from);
  if (fromReference instanceof Action2Error) {
    return fromReference;
  }
  const toReference = referenceState(live, migration.application, migration.to);
  if (toReference instanceof Action2Error) {
    return toReference;
  }
  return (
    mismatchRefusal(
      modelStateDifferences(migration.application, live, fromReference),
      `the model of the deployment is not version ${migration.from}, the Migration's from`,
      { version: migration.from, check: "from" },
    ) ??
    mismatchRefusal(
      stepsReplayDifferences(migration.application, live, toReference, migration.steps),
      `the steps of Migration ${migration.uuid}, replayed on version ${migration.from}, do not give version ${migration.to}`,
      { version: migration.to, check: "steps" },
    )
  );
}

/**
 * The migration run to do: a new one from the stored Migration, or the one in progress (continued). The
 * Migration of a `versioned-git` application is the one the commit of its `to` tag holds (#9 D8).
 */
async function runToDo(
  host: DomainControllerActionHost,
  payload: RunMigrationActionPayload,
  state: DeploymentStateRow | undefined,
  live: ModelState,
  git: boolean,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<RunState | Action2Error> {
  // an applied Migration is refused first, whatever migration run is in progress
  if ((state?.applied ?? []).some((applied) => applied.migration === payload.migration)) {
    return refusal(
      `runMigration: Migration ${payload.migration} is already applied on this deployment`,
      MIGRATION_RUN_REFUSALS.migrationAlreadyApplied,
      { migration: payload.migration },
    );
  }
  const inProgress = state?.run as RunState | undefined;
  if (inProgress) {
    if (inProgress.migration.uuid !== payload.migration) {
      return refusal(
        `runMigration: Migration ${inProgress.migration.uuid} is running on this deployment; run it again to continue it before any other`,
        MIGRATION_RUN_REFUSALS.migrationRunInProgress,
        { migration: inProgress.migration.uuid },
      );
    }
    const invalid = stepsRefusal(inProgress.migration, git);
    if (invalid) {
      return invalid;
    }
    if (inProgress.stepStarted !== undefined) {
      const step = inProgress.migration.steps.find((candidate) => candidate.uuid === inProgress.stepStarted);
      return refusal(
        `runMigration: step ${stepLabel(step, inProgress.stepStarted)} of Migration ${inProgress.migration.uuid} started and was not recorded as done: some of its writes may have landed. Check the deployment, then settle the step with settleMigrationStep (outcome "done" or "notRun")`,
        MIGRATION_RUN_REFUSALS.migrationStepInDoubt,
        { migration: inProgress.migration.uuid, step: inProgress.stepStarted, stepName: step?.name },
      );
    }
    return inProgress;
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
  const unsupported = (stored.changes ?? []).filter((change) => !change.supported);
  if (unsupported.length > 0) {
    return refusal(
      `runMigration: the Migration holds changes no model Action applies to the stores (${unsupported.map((change) => `${change.kind} ${change.entityName ?? change.entity}${change.attribute ? `.${change.attribute}` : ""}`).join(", ")}); write them by hand outside Miroir`,
      MIGRATION_RUN_REFUSALS.migrationUnsupportedChange,
      { changes: unsupported },
    );
  }
  const invalid = stepsRefusal(stored, git);
  if (invalid) {
    return invalid;
  }
  if (git) {
    // the clone must still be at the version the state says, whatever was checked out since
    const atFrom = await checkedOutVersion(host, payload.application, stored.from, applicationDeploymentMap, "runMigration");
    if (atFrom instanceof Action2Error) {
      return atFrom;
    }
  } else {
    // #745 D6: the model against the frozen versions, before anything is written
    const mismatch = referenceRefusal(live, stored);
    if (mismatch) {
      return mismatch;
    }
  }
  // the copy the migration run uses until it ends, whatever the modelVersion section holds meanwhile (epic D2)
  return {
    migration: { ...structuredClone(stored), backwardCompatible: migrationBackwardCompatible(stored.changes ?? [], stored.steps) },
    stepsDone: [],
    startedAt: new Date().toISOString(),
  };
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

/** The refusal of a migration run, or of a settlement, on a deployment that is not following. */
async function authoringRefusal(
  host: DomainControllerActionHost,
  actionType: string,
  application: string,
  deploymentUuid: string,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<Action2Error | undefined> {
  const deploymentRow = await storedDeploymentRow(host, deploymentUuid, applicationDeploymentMap);
  if (deploymentRow instanceof Action2Error) {
    return deploymentRow;
  }
  return deploymentRoleOf(deploymentRow) === "following"
    ? undefined
    : refusal(
        `${actionType}: deployment ${deploymentUuid} of ${application} is an authoring deployment; a Migration runs on a following deployment`,
        MIGRATION_RUN_REFUSALS.deploymentAuthors,
        { deployment: deploymentUuid },
      );
}

async function runMigration(
  host: DomainControllerActionHost,
  payload: RunMigrationActionPayload,
  context: ActionImplementationContext,
  deploymentUuid: string,
): Promise<Action2ReturnType> {
  const { application } = payload;
  const { applicationDeploymentMap } = context;
  const authoring = await authoringRefusal(host, RUN_MIGRATION_ACTION_TYPE, application, deploymentUuid, applicationDeploymentMap);
  if (authoring) {
    return authoring;
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
  // every write of the migration run's state goes through here; a copy each time, the written row may be
  // frozen by the local cache
  const recordMigrationRun = (stepsDone: readonly string[], stepStarted?: string) =>
    writeDeploymentState(
      host,
      {
        ...base,
        run: {
          migration: structuredClone(run.migration),
          stepsDone: [...stepsDone],
          ...(stepStarted !== undefined ? { stepStarted } : {}),
          startedAt: run.startedAt,
        },
      },
      applicationDeploymentMap,
    );
  const stepsDone = [...run.stepsDone];
  const started = await recordMigrationRun(stepsDone);
  if (started) {
    return started;
  }
  // a model Action reads the current model from this process's local cache: it starts from the stores
  const loaded = await reloadModel(host, application, applicationDeploymentMap, undefined);
  if (loaded instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `runMigration: could not load the model of ${application}`, [], loaded);
  }

  for (const step of run.migration.steps) {
    if (stepsDone.includes(step.uuid)) {
      continue;
    }
    const recordedStart = await recordMigrationRun(stepsDone, step.uuid);
    if (recordedStart) {
      return recordedStart;
    }
    // a failure leaves the step recorded as started: in doubt until settled
    const failed = await executeStep(host, application, step, git, applicationDeploymentMap);
    if (failed) {
      return failed;
    }
    stepsDone.push(step.uuid);
    const recordedDone = await recordMigrationRun(stepsDone);
    if (recordedDone) {
      return recordedDone;
    }
  }

  // the commit of a `versioned-git` deployment is its checkout of `to`, still there when the migration run ends
  const gitCommit = git ? await checkedOutVersion(host, application, run.migration.to, applicationDeploymentMap, "runMigration") : undefined;
  if (gitCommit instanceof Action2Error) {
    return gitCommit;
  }
  if (!git) {
    // #745 D6: the model the steps left must be the `to` version; else the migration run stays recorded
    const ended = await liveModelState(host, application, applicationDeploymentMap);
    if (ended instanceof Action2Error) {
      return ended;
    }
    const toReference = referenceState(ended, application, run.migration.to);
    if (toReference instanceof Action2Error) {
      return toReference;
    }
    const mismatch = mismatchRefusal(
      modelStateDifferences(application, ended, toReference),
      `after the last step of Migration ${run.migration.uuid}, the model of the deployment is not version ${run.migration.to}; the migration run stays recorded and the version is unchanged`,
      { version: run.migration.to, check: "to" },
    );
    if (mismatch) {
      return mismatch;
    }
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
 * `runMigration`: refused on an authoring deployment, for a Migration already applied, when the deployment
 * is not at the Migration's `from` version, when the Migration holds an unsupported change, while another
 * Migration runs on the deployment, and while a step is in doubt. Two migration runs on one deployment never
 * interleave.
 */
export const handleAction_runMigration: ActionImplementationHandler = (host, action, context): Promise<Action2ReturnType> => {
  const payload = action.payload as RunMigrationActionPayload;
  const deploymentUuid = context.applicationDeploymentMap[payload.application];
  if (!deploymentUuid) {
    return Promise.resolve(new Action2Error("FailedToHandleAction", `runMigration: no deployment of ${payload.application}`));
  }
  return withApplicationLock(`deployment:${deploymentUuid}`, () => runMigration(host, payload, context, deploymentUuid));
};

async function settleMigrationStep(
  host: DomainControllerActionHost,
  payload: SettleMigrationStepActionPayload,
  context: ActionImplementationContext,
  deploymentUuid: string,
): Promise<Action2ReturnType> {
  const { application, step, outcome } = payload;
  const { applicationDeploymentMap } = context;
  if (outcome !== "done" && outcome !== "notRun") {
    return new Action2Error("FailedToHandleAction", `settleMigrationStep: outcome is "done" or "notRun", not ${JSON.stringify(outcome)}`);
  }
  const authoring = await authoringRefusal(host, SETTLE_MIGRATION_STEP_ACTION_TYPE, application, deploymentUuid, applicationDeploymentMap);
  if (authoring) {
    return authoring;
  }
  const state = await storedDeploymentState(host, deploymentUuid, applicationDeploymentMap);
  if (state instanceof Action2Error) {
    return new Action2Error("FailedToHandleAction", `settleMigrationStep: could not read the state of deployment ${deploymentUuid}`, [], state);
  }
  const run = state?.run as RunState | undefined;
  if (!run || run.stepStarted !== step) {
    return refusal(
      run?.stepStarted
        ? `settleMigrationStep: step ${step} is not in doubt; the step in doubt is ${run.stepStarted}`
        : `settleMigrationStep: step ${step} is not in doubt: no step of a migration run on deployment ${deploymentUuid} is`,
      MIGRATION_RUN_REFUSALS.migrationStepNotInDoubt,
      { step, stepInDoubt: run?.stepStarted },
    );
  }
  const written = await writeDeploymentState(
    host,
    {
      ...stateOf(state, deploymentUuid, application),
      run: {
        migration: run.migration,
        stepsDone: outcome === "done" ? [...run.stepsDone, step] : [...run.stepsDone],
        startedAt: run.startedAt,
      },
    },
    applicationDeploymentMap,
  );
  return written ?? ACTION_OK;
}

/**
 * `settleMigrationStep`: the operator's answer for the step a stopped migration run left in doubt. `done`
 * records it as done, and the next `runMigration` continues after it; `notRun` clears it, and the next
 * `runMigration` executes it again. Refused on an authoring deployment, and for a step that is not in
 * doubt (`migrationStepNotInDoubt`). Runs under the lock of the deployment's migration runs.
 */
export const handleAction_settleMigrationStep: ActionImplementationHandler = (host, action, context): Promise<Action2ReturnType> => {
  const payload = action.payload as SettleMigrationStepActionPayload;
  const deploymentUuid = context.applicationDeploymentMap[payload.application];
  if (!deploymentUuid) {
    return Promise.resolve(new Action2Error("FailedToHandleAction", `settleMigrationStep: no deployment of ${payload.application}`));
  }
  return withApplicationLock(`deployment:${deploymentUuid}`, () => settleMigrationStep(host, payload, context, deploymentUuid));
};
