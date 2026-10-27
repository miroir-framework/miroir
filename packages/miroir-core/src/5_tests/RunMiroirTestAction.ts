import { v4 as uuidv4 } from "uuid";
import { adminSelfApplication, entityDeployment } from "miroir-app-admin";
import {
  defaultMiroirMetaModel,
  entityEndpointVersion,
  entityEntity,
  entityMenu,
  entityMiroirTest,
  entityMlSchema,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityTheme,
} from "miroir-app-miroir";

import type { Uuid } from "../0_interfaces/1_core/EntityVersion";
import type {
  ApplicationSection,
  Deployment,
  Entity,
  EntityInstance,
  ExtractorOrCombiner,
  MetaModelPartial,
  MiroirTestForRunner,
  MiroirTestSuite,
  RunBoxedQueryAction,
  Runner,
  SelfApplication,
  StoreUnitConfiguration,
  TestAssertionResult,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";
import type {
  ActionImplementationContext,
  ActionImplementationHandler,
  DomainControllerActionHost,
} from "../0_interfaces/3_controllers/DomainControllerActionHost";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import type { MiroirTestAnyLeaf } from "../0_interfaces/5-tests/miroirTestTypes";
import type { ApplicationDeploymentMap, ApplicationEntitiesAndInstances } from "../1_core/Deployment";
import { createDeploymentCompositeAction } from "../1_core/Deployment";
import { defaultMetaModelEnvironment, defaultMiroirModelEnvironment, getApplicationSection } from "../1_core/Model";
import { remapLibraryAppModelForRunTarget } from "../1_core/model/cloneApplication/remapApplicationModelAtPaths";
import { createThrowingExpect } from "../1_core/testing/test-expect";
import { ConfigurationService } from "../3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { resetIntegTestbed } from "./LibraryPlayfield.js";
import { runMiroirTests, type MiroirTestExecutionEnvironment } from "./MiroirTestTools.js";
import { createInProcessVitestStub } from "./runMiroirTestSuiteInProcess.js";
import { runTeardownTestApplicationStores } from "./testApplicationStoreTeardown.js";
import { testbedStorageConfiguration } from "./testbedStorageConfiguration.js";
import { buildRunnerTestSessionParamBank, type TestbedUuids } from "./TestbedUuids.js";

/** Payload of the runMiroirTestAction action (#575), as its implementation reads it. */
export type RunMiroirTestAction = {
  actionType: "runMiroirTestAction";
  actionLabel?: string;
  endpoint: string;
  payload: {
    application: string;
    miroirTest: string;
    leaves?: string[];
  };
};

export type MiroirTestLeafAssertionOutcome = {
  name: string;
  result: TestAssertionResult["assertionResult"];
  expected?: unknown;
  actual?: unknown;
};

export type MiroirTestLeafOutcome = {
  path: string[];
  type: MiroirTestAnyLeaf["miroirTestType"];
  result: "ok" | "error" | "skipped" | "unsupported";
  assertions: MiroirTestLeafAssertionOutcome[];
  message?: string;
};

type LeafToRun = { path: string[]; leaf: MiroirTestAnyLeaf };

type LeafKind = "unit" | "testbed" | "unsupported";

const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

const UNSUPPORTED_MESSAGES: Partial<Record<MiroirTestAnyLeaf["miroirTestType"], string>> = {
  reportTest: "reportTest leaves need the app's component sandbox: run them from the app's Miroir Tests page",
  reactComponentTest: "reactComponentTest leaves need a DOM: run them from the app's Miroir Tests page",
  transformerTest:
    "a transformerTest leaf without unitTestExpectedValue runs on a store: run it with the test CLI",
};

function leafKind(leaf: MiroirTestAnyLeaf): LeafKind {
  switch (leaf.miroirTestType) {
    case "actionTest":
    case "runnerTest":
      return "testbed";
    case "functionCallTest":
    case "queryTest":
      return "unit";
    case "transformerTest":
      return leaf.unitTestExpectedValue !== undefined ? "unit" : "unsupported";
    default:
      return "unsupported";
  }
}

function collectLeaves(node: MiroirTestSuite | MiroirTestAnyLeaf, path: string[]): LeafToRun[] {
  const nodePath = [...path, node.miroirTestLabel];
  if (node.miroirTestType !== "miroirTestSuite") {
    return [{ path: nodePath, leaf: node }];
  }
  return (node.miroirTests as (MiroirTestSuite | MiroirTestAnyLeaf)[]).flatMap((child) =>
    collectLeaves(child, nodePath),
  );
}

function deepReplaceStrings<T>(value: T, replacements: Record<string, string>): T {
  if (typeof value === "string") {
    return (replacements[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => deepReplaceStrings(entry, replacements)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, deepReplaceStrings(entry, replacements)]),
    ) as T;
  }
  return value;
}

const failedToRunMiroirTest = (action: RunMiroirTestAction, message: string) =>
  new Action2Error("FailedToRunMiroirTest", message, [], undefined, { domainAction: action });

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error instanceof Action2Error) {
    return error.errorMessage ?? error.errorType;
  }
  return typeof error == "string" ? error : JSON.stringify(error);
}

/** Runs one query of extractors, all on the store, and returns its entries. */
async function readFromStore(
  host: DomainControllerActionHost,
  application: Uuid,
  applicationSection: ApplicationSection,
  extractors: Record<string, ExtractorOrCombiner>,
  context: ActionImplementationContext,
): Promise<Record<string, any>> {
  const action: RunBoxedQueryAction = {
    actionType: "runBoxedQueryAction",
    endpoint: QUERY_ENDPOINT,
    payload: {
      application,
      applicationSection,
      queryExecutionStrategy: "storage",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application,
        pageParams: {},
        queryParams: {},
        contextResults: {},
        extractors,
      },
    },
  };
  const result = await host.handleBoxedExtractorOrQueryAction(
    action,
    context.applicationDeploymentMap,
    context.modelEnvironment,
    context.principal,
  );
  if (result instanceof Action2Error || result.status != "ok") {
    throw new Error(`could not read ${Object.keys(extractors).join(", ")}: ${errorMessage(result)}`);
  }
  const value = result.returnedDomainElement ?? {};
  const failed = Object.entries(value).find(([, entry]) => !!entry && typeof entry == "object" && "queryFailure" in entry);
  if (failed) {
    throw new Error(`could not read ${failed[0]}: ${JSON.stringify(failed[1])}`);
  }
  return value;
}

const instancesOf = (value: unknown): EntityInstance[] =>
  Array.isArray(value) ? value : value && typeof value == "object" ? (Object.values(value) as EntityInstance[]) : [];

/** The model elements the testbed is initialized with, by MetaModel key. */
const MODEL_ENTITIES: Record<string, { uuid: Uuid; name: string }> = {
  entities: entityEntity,
  endpoints: entityEndpointVersion,
  menus: entityMenu,
  reports: entityReport,
  storedQueries: entityQueryVersion,
  mlSchemas: entityMlSchema,
  runners: entityRunner,
  themes: entityTheme,
  applications: entitySelfApplication,
  applicationVersions: entitySelfApplicationVersion,
  applicationModelBranches: entitySelfApplicationModelBranch,
};

/** Reads the application's model elements, section by section, from its store. */
async function readLiveModel(
  host: DomainControllerActionHost,
  application: Uuid,
  context: ActionImplementationContext,
): Promise<Record<string, EntityInstance[]>> {
  const bySection: Partial<Record<ApplicationSection, Record<string, ExtractorOrCombiner>>> = {};
  for (const [key, entity] of Object.entries(MODEL_ENTITIES)) {
    const section = getApplicationSection(application, entity.uuid);
    (bySection[section] ??= {})[key] = {
      extractorOrCombinerType: "extractorInstancesByEntity",
      applicationSection: section,
      parentName: entity.name,
      parentUuid: entity.uuid,
    };
  }
  const model: Record<string, EntityInstance[]> = {};
  for (const [section, extractors] of Object.entries(bySection)) {
    const read = await readFromStore(host, application, section as ApplicationSection, extractors!, context);
    for (const key of Object.keys(extractors!)) {
      model[key] = instancesOf(read[key]);
    }
  }
  return model;
}

/** Reads the instances of every Entity of the application from its store. */
async function readLiveData(
  host: DomainControllerActionHost,
  application: Uuid,
  entities: Entity[],
  context: ActionImplementationContext,
): Promise<ApplicationEntitiesAndInstances> {
  const bySection: Partial<Record<ApplicationSection, Record<string, ExtractorOrCombiner>>> = {};
  for (const entity of entities) {
    const section = getApplicationSection(application, entity.uuid);
    (bySection[section] ??= {})[entity.uuid] = {
      extractorOrCombinerType: "extractorInstancesByEntity",
      applicationSection: section,
      parentName: entity.name,
      parentUuid: entity.uuid,
    };
  }
  const instances: Record<string, EntityInstance[]> = {};
  for (const [section, extractors] of Object.entries(bySection)) {
    const read = await readFromStore(host, application, section as ApplicationSection, extractors!, context);
    for (const entityUuid of Object.keys(extractors!)) {
      instances[entityUuid] = instancesOf(read[entityUuid]);
    }
  }
  return entities.map((entity) => ({ entity, instances: instances[entity.uuid] ?? [] }));
}

/** The live Deployment row's store configuration, from Admin data. */
async function readLiveStoreConfiguration(
  host: DomainControllerActionHost,
  deploymentUuid: Uuid,
  context: ActionImplementationContext,
): Promise<StoreUnitConfiguration | undefined> {
  const read = await readFromStore(
    host,
    adminSelfApplication.uuid,
    "data",
    {
      deployment: {
        extractorOrCombinerType: "extractorByPrimaryKey",
        applicationSection: "data",
        parentName: entityDeployment.name,
        parentUuid: entityDeployment.uuid,
        instanceUuid: deploymentUuid,
      },
    },
    context,
  );
  return (read.deployment as Deployment | undefined)?.configuration as StoreUnitConfiguration | undefined;
}

type Testbed = {
  runTarget: TestbedUuids;
  storeConfiguration: StoreUnitConfiguration;
  applicationDeploymentMap: ApplicationDeploymentMap;
  testbedModel: MetaModelPartial;
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
  testbedInitApplicationParameters: InitApplicationParameters;
};

/** A copy of the live application under fresh uuids, not created yet (#575 D1-D4). */
async function prepareTestbed(
  host: DomainControllerActionHost,
  application: Uuid,
  context: ActionImplementationContext,
): Promise<Testbed> {
  const liveDeploymentUuid = context.applicationDeploymentMap[application];
  if (!liveDeploymentUuid) {
    throw new Error(`application ${application} has no deployment`);
  }
  const liveStoreConfiguration = await readLiveStoreConfiguration(host, liveDeploymentUuid, context);
  if (!liveStoreConfiguration) {
    throw new Error(`no Deployment row with a configuration for deployment ${liveDeploymentUuid} in Admin data`);
  }
  const live = await readLiveModel(host, application, context);
  const selfApplication = live.applications.find((row) => row.uuid == application) as SelfApplication | undefined;
  if (!selfApplication) {
    throw new Error(`no SelfApplication ${application} in the model of application ${application}`);
  }
  const runTarget: TestbedUuids = {
    applicationUuid: uuidv4(),
    applicationName: selfApplication.name,
    deploymentUuid: uuidv4(),
  };
  const toTestbed = { [application]: runTarget.applicationUuid, [liveDeploymentUuid]: runTarget.deploymentUuid };
  const testbedModel = remapLibraryAppModelForRunTarget(
    {
      applicationUuid: application,
      applicationName: selfApplication.name,
      entities: live.entities as Entity[],
      endpoints: live.endpoints as any,
      menus: live.menus as any,
      reports: live.reports as any,
      storedQueries: live.storedQueries as any,
      mlSchemas: live.mlSchemas as any,
      runners: live.runners as any,
      themes: live.themes as any,
      applications: live.applications as any,
      applicationVersions: live.applicationVersions as any,
    } as MetaModelPartial,
    application,
    liveDeploymentUuid,
    runTarget,
  );
  const liveData = await readLiveData(host, application, live.entities as Entity[], context);
  const testbedSelfApplication = deepReplaceStrings(selfApplication, toTestbed);
  const testbedBranch = deepReplaceStrings(
    live.applicationModelBranches.find((row) => (row as any).selfApplication == application),
    toTestbed,
  );
  const testbedVersion = deepReplaceStrings(
    live.applicationVersions.find((row) => (row as any).selfApplication == application),
    toTestbed,
  );
  const { [application]: _live, ...otherApplications } = context.applicationDeploymentMap;
  return {
    runTarget,
    storeConfiguration: testbedStorageConfiguration(liveStoreConfiguration, runTarget.deploymentUuid),
    // D4: no entry for the live application, so a missed reference fails instead of writing live data
    applicationDeploymentMap: { ...otherApplications, [runTarget.applicationUuid]: runTarget.deploymentUuid },
    testbedModel,
    testbedEntitiesAndInstances: deepReplaceStrings(liveData, toTestbed),
    testbedInitApplicationParameters: {
      dataStoreType: "app",
      metaModel: defaultMiroirMetaModel,
      selfApplication: testbedSelfApplication,
      applicationModelBranch: testbedBranch as any,
      applicationVersion: testbedVersion as any,
    } as InitApplicationParameters,
  };
}

const MCP_TOOL_RUNNER_MESSAGE =
  "a runnerTest leaf of an mcpToolRunner calls the MCP server itself: call the tool directly instead";

/**
 * A runnerTest leaf runs on the testbed the action created and reseeds: it neither creates nor drops a
 * deployment of its own, so its initialModel is never read.
 */
function runnerLeafOnTestbed(leaf: MiroirTestForRunner, testbedModel: MetaModelPartial): MiroirTestForRunner {
  return {
    ...leaf,
    skipCreateDeployment: true,
    skipDropDeployment: true,
    initialModel: leaf.initialModel ?? (testbedModel as any),
  };
}

function trackedAssertions(suiteResult: TestSuiteResult, leafLabel: string): MiroirTestLeafAssertionOutcome[] {
  const found: MiroirTestLeafAssertionOutcome[] = [];
  for (const test of Object.values(suiteResult.testsResults ?? {})) {
    for (const assertion of Object.values(test.testAssertionsResults ?? {})) {
      // the leaf's own summary, recorded under its label
      if (assertion.assertionName == leafLabel) {
        continue;
      }
      found.push({
        name: assertion.assertionName,
        result: assertion.assertionResult,
        ...(assertion.assertionExpectedValue !== undefined ? { expected: assertion.assertionExpectedValue } : {}),
        ...(assertion.assertionActualValue !== undefined ? { actual: assertion.assertionActualValue } : {}),
      });
    }
  }
  for (const nested of Object.values(suiteResult.testsSuiteResults ?? {})) {
    found.push(...trackedAssertions(nested, leafLabel));
  }
  return found;
}

async function runLeaf(
  host: DomainControllerActionHost,
  { path, leaf }: LeafToRun,
  executionEnvironment: MiroirTestExecutionEnvironment | undefined,
): Promise<MiroirTestLeafOutcome> {
  const tracker = host.getMiroirActivityTracker();
  tracker.resetResults();
  const assertionPath = MiroirActivityTracker.stringArrayToTestAssertionPath(path.slice(0, -1));
  assertionPath.push({ test: leaf.miroirTestLabel }, { testAssertion: leaf.miroirTestLabel });
  let message: string | undefined;
  try {
    await runMiroirTests._runMiroirTestWithTracking(
      createInProcessVitestStub(createThrowingExpect(leaf.miroirTestLabel) as any),
      path,
      undefined,
      leaf,
      defaultMetaModelEnvironment,
      tracker,
      undefined,
      true,
      runMiroirTests,
      executionEnvironment
        ? { executionMode: "integration", executionEnvironment }
        : { executionMode: "unit" },
      assertionPath,
      false,
    );
  } catch (error) {
    message = errorMessage(error);
  }
  const assertions = trackedAssertions(tracker.getTestAssertionsResults([]), leaf.miroirTestLabel);
  const failed = message !== undefined || assertions.some((assertion) => assertion.result == "error");
  return {
    path,
    type: leaf.miroirTestType,
    result: failed ? "error" : "ok",
    assertions,
    ...(message !== undefined ? { message } : {}),
  };
}

async function runMiroirTest(
  host: DomainControllerActionHost,
  action: RunMiroirTestAction,
  context: ActionImplementationContext,
) {
  const { application, miroirTest: miroirTestUuid, leaves: selectedLeaves } = action.payload;
  const testSection = getApplicationSection(application, entityMiroirTest.uuid);
  let miroirTest: { name?: string; definition?: MiroirTestSuite | MiroirTestAnyLeaf } | undefined;
  try {
    const read = await readFromStore(
      host,
      application,
      testSection,
      {
        miroirTest: {
          extractorOrCombinerType: "extractorByPrimaryKey",
          applicationSection: testSection,
          parentName: entityMiroirTest.name,
          parentUuid: entityMiroirTest.uuid,
          instanceUuid: miroirTestUuid,
        },
      },
      context,
    );
    miroirTest = read.miroirTest;
  } catch (error) {
    return failedToRunMiroirTest(action, `no MiroirTest ${miroirTestUuid} in application ${application}: ${errorMessage(error)}`);
  }
  if (!miroirTest?.definition) {
    return failedToRunMiroirTest(action, `no MiroirTest ${miroirTestUuid} in application ${application}`);
  }

  const allLeaves = collectLeaves(miroirTest.definition, []);
  const selected = new Set(selectedLeaves ?? []);
  const unknown = [...selected].filter((label) => !allLeaves.some(({ leaf }) => leaf.miroirTestLabel == label));
  if (unknown.length > 0) {
    return failedToRunMiroirTest(
      action,
      `MiroirTest ${miroirTest.name ?? miroirTestUuid} has no leaf ${unknown.map((label) => `"${label}"`).join(", ")}`,
    );
  }
  const outcomes: MiroirTestLeafOutcome[] = allLeaves.map(({ path, leaf }) => ({
    path,
    type: leaf.miroirTestType,
    result: "skipped",
    assertions: [],
  }));
  const toRun = allLeaves
    .map((entry, index) => ({ ...entry, index, kind: leafKind(entry.leaf) }))
    .filter(({ leaf }) => (selected.size == 0 || selected.has(leaf.miroirTestLabel)) && !leaf.skip);
  for (const { index, kind, leaf } of toRun) {
    if (kind == "unsupported") {
      outcomes[index] = { ...outcomes[index], result: "unsupported", message: UNSUPPORTED_MESSAGES[leaf.miroirTestType] };
    }
  }

  // D5: the server registers no test implementation, and compositeRunTestAssertion needs one
  if (!ConfigurationService.configurationService.testImplementation) {
    ConfigurationService.configurationService.registerTestImplementation({
      expect: createThrowingExpect("runMiroirTestAction") as any,
    });
  }

  for (const entry of toRun.filter(({ kind }) => kind == "unit")) {
    outcomes[entry.index] = await runLeaf(host, entry, undefined);
  }

  const testbedLeaves = toRun.filter(({ kind }) => kind == "testbed");
  if (testbedLeaves.length == 0) {
    return { status: "ok" as const, returnedDomainElement: { miroirTest: miroirTest.name, leaves: outcomes } };
  }

  let testbed: Testbed;
  try {
    testbed = await prepareTestbed(host, application, context);
  } catch (error) {
    return failedToRunMiroirTest(action, `could not prepare the testbed: ${errorMessage(error)}`);
  }
  const { runTarget, applicationDeploymentMap } = testbed;
  const runnerUuidIndex: Record<string, Runner> = Object.fromEntries(
    ((testbed.testbedModel.runners ?? []) as Runner[]).map((runner) => [runner.uuid, runner]),
  );
  const runnableLeaves = testbedLeaves.filter(({ index, leaf }) => {
    if (leaf.miroirTestType != "runnerTest" || runnerUuidIndex[leaf.runnerRef]?.definition.runnerType != "mcpToolRunner") {
      return true;
    }
    outcomes[index] = { ...outcomes[index], result: "unsupported", message: MCP_TOOL_RUNNER_MESSAGE };
    return false;
  });
  if (runnableLeaves.length == 0) {
    return { status: "ok" as const, returnedDomainElement: { miroirTest: miroirTest.name, leaves: outcomes } };
  }
  const domainController = host.asDomainControllerInterface();
  const created = await host.handleCompositeAction(
    createDeploymentCompositeAction(
      `${runTarget.applicationName} testbed`,
      runTarget.deploymentUuid,
      runTarget.applicationUuid,
      { uuid: "", selfApplication: adminSelfApplication.uuid } as Deployment, // unused: skipOpenAdminStore
      testbed.storeConfiguration,
      { skipOpenAdminStore: true },
    ),
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  let teardownFailure: string | undefined;
  try {
    if (created instanceof Action2Error || created.status != "ok") {
      return failedToRunMiroirTest(action, `could not create the testbed: ${errorMessage(created)}`);
    }
    const toTestbed = { [application]: runTarget.applicationUuid, [context.applicationDeploymentMap[application]]: runTarget.deploymentUuid };
    const testParams = buildRunnerTestSessionParamBank(
      deepReplaceStrings((miroirTest.definition as { testParams?: Record<string, unknown> }).testParams, toTestbed),
      runTarget,
      {},
    );
    const compositeActionTestContext = {
      domainController,
      applicationDeploymentMap,
      // read only when a leaf creates its own deployment, which a leaf run here never does
      internalMiroirConfig: undefined as any,
      pageLabel: "runMiroirTestAction",
      adminDeployment: undefined as any,
      testDeploymentStorageConfiguration: testbed.storeConfiguration,
      runTarget,
      testParams,
      runtimeContext: {},
    };
    const executionEnvironment = {
      domainController,
      applicationDeploymentMap,
      testApplicationUuid: runTarget.applicationUuid,
      persistenceStoreControllerManager: undefined as any,
      compositeActionTestContext,
      runnerTestContext: { ...compositeActionTestContext, runnerUuidIndex },
    } satisfies MiroirTestExecutionEnvironment;
    for (const entry of runnableLeaves) {
      try {
        await resetIntegTestbed({
          domainController,
          applicationDeploymentMap,
          libraryDeploymentUuid: runTarget.deploymentUuid,
          librarySelfApplicationUuid: runTarget.applicationUuid,
          deploymentsToReset: [{ uuid: runTarget.deploymentUuid, selfApplication: runTarget.applicationUuid } as Deployment],
          testbedEntitiesAndInstances: testbed.testbedEntitiesAndInstances,
          testbedInitApplicationParameters: testbed.testbedInitApplicationParameters,
          testbedModel: testbed.testbedModel,
        });
      } catch (error) {
        outcomes[entry.index] = {
          ...outcomes[entry.index],
          result: "error",
          message: `could not reset the testbed: ${errorMessage(error)}`,
        };
        continue;
      }
      // D4: the leaf addresses the testbed, never the live application
      const leaf = deepReplaceStrings(entry.leaf, toTestbed);
      outcomes[entry.index] = await runLeaf(
        host,
        {
          path: entry.path,
          leaf: leaf.miroirTestType == "runnerTest" ? runnerLeafOnTestbed(leaf, testbed.testbedModel) : leaf,
        },
        executionEnvironment,
      );
    }
  } finally {
    try {
      await runTeardownTestApplicationStores({
        domainController,
        applicationDeploymentMap,
        modelEnvironment: defaultMiroirModelEnvironment,
        deploymentUuid: runTarget.deploymentUuid,
        applicationUuid: runTarget.applicationUuid,
        storeConfig: testbed.storeConfiguration,
      });
    } catch (error) {
      teardownFailure = errorMessage(error);
    }
  }
  if (teardownFailure !== undefined) {
    return failedToRunMiroirTest(
      action,
      `could not drop the testbed ${runTarget.deploymentUuid}: ${teardownFailure} (leaves: ${JSON.stringify(outcomes)})`,
    );
  }
  return {
    status: "ok" as const,
    returnedDomainElement: { miroirTest: miroirTest.name, testbed: runTarget, leaves: outcomes },
  };
}

// one run at a time: the leaves share the DomainController's activity tracker
let previousRun: Promise<unknown> = Promise.resolve();

/**
 * #575: runs a MiroirTest of an application on a throwaway copy of it, and returns each leaf's result
 * with its assertions, so that an agent can run a test it wrote without touching the live data.
 */
export const handleAction_runMiroirTestAction: ActionImplementationHandler = (host, action, context) => {
  const run = previousRun.then(() => runMiroirTest(host, action as RunMiroirTestAction, context));
  previousRun = run.catch(() => undefined);
  return run;
};
