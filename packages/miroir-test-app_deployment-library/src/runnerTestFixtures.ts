import type {
  CoreTransformerForBuildPlusRuntime,
  Deployment,
  MiroirConfigClient,
  MiroirTestDefinition,
  MiroirTestForRunner,
  MiroirTestSuite,
  Runner,
  StoreUnitConfiguration,
} from "miroir-core";
import type { CompositeAction, CompositeRunTestAssertion } from "miroir-core";
import { defaultLibraryAppModel } from "./Library.js";
import book1 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" assert { type: "json" };
import user1 from "../assets/library_data/ca794e28-b2dc-45b3-8137-00151557eea8/04c371ed-702d-4dd9-a06d-8a04eda5d24f.json" assert { type: "json" };
import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json" assert { type: "json" };
import entityLendingHistoryItem from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e81078f3-2de7-4301-bd79-d3a156aec149.json" assert { type: "json" };
import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" assert { type: "json" };
import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" assert { type: "json" };
import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" assert { type: "json" };
import miroirTest_runner_library from "../assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c.json" assert { type: "json" };

export type LibraryTestIdentifiers = {
  testApplicationUuid: string;
  testApplicationDeploymentUuid: string;
  testApplicationName: string;
  installTestApplicationUuid: string;
  installTestApplicationDeploymentUuid: string;
  installTestApplicationName: string;
};

export const libraryTestIdentifiers: LibraryTestIdentifiers = {
  testApplicationUuid: selfApplicationLibrary.uuid,
  testApplicationDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  testApplicationName: selfApplicationLibrary.name,
  installTestApplicationUuid: selfApplicationLibrary.uuid,
  installTestApplicationDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  installTestApplicationName: selfApplicationLibrary.name,
};

export type RunnerTestEnvironmentSeed = {
  testParams: Record<string, unknown>;
};

export const RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "defaultLibraryAppModel",
};

const LEND_START_DATE = new Date("2024-01-01").toISOString();

export const RUNNER_TEST_PAYLOAD_USER_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "user1Uuid",
};

export const RUNNER_TEST_PAYLOAD_BOOK_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "book1Uuid",
};

export const RUNNER_TEST_PAYLOAD_LEND_START_DATE_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "lendStartDate",
};

export const RUNNER_TEST_PAYLOAD_LEND_END_DATE_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "lendEndDate",
};

export const RUNNER_TEST_APPLICATION_UUID_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "testApplicationUuid",
};

export const RUNNER_TEST_DEPLOYMENT_UUID_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "testApplicationDeploymentUuid",
};

export const RUNNER_TEST_LENDING_HISTORY_ENTITY_UUID_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "lendingHistoryItemEntityUuid",
};

export const RUNNER_TEST_LENDING_HISTORY_ENTITY_NAME_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "lendingHistoryItemEntityName",
};

export type RunnerTestFixtureDefaults = {
  runner: Runner;
  testParams: Record<string, unknown>;
  preTestCompositeActions: CompositeAction[];
  testCompositeActionAssertions: CompositeRunTestAssertion[];
  initialModel: CoreTransformerForBuildPlusRuntime;
  testCompositeActionLabel?: string;
  preRunnerCompositeActions?: CompositeAction[];
  skipCreateDeployment?: boolean;
  skipDropDeployment?: boolean;
};

export type ResolvedRunnerTestBuildContext = {
  pageLabel: string;
  runner: Runner;
  testApplicationUuid: string;
  testApplicationDeploymentUuid: string;
  testApplicationName: string;
  testParams: Record<string, unknown>;
  preTestCompositeActions: CompositeAction[];
  testCompositeActionAssertions: CompositeRunTestAssertion[];
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
  initialModel: CoreTransformerForBuildPlusRuntime;
  preRunnerCompositeActions?: CompositeAction[];
  testCompositeActionLabel?: string;
  skipCreateDeployment?: boolean;
  skipDropDeployment?: boolean;
};

const RUNNER_REF_MAP: Record<string, Runner> = {
  lendDocument: lendDocument as unknown as Runner,
  returnDocument: returnDocument as unknown as Runner,
};

/** Legacy fixtureRef aliases → `miroirTestLabel` in `miroirTest_runner_library`. */
export const RUNNER_LIBRARY_FIXTURE_REF_ALIASES: Record<string, string> = {
  libraryLendBookDefaults: "Lend Book Test Composite Action",
  libraryReturnBookDefaults: "Return Book Test Composite Action",
};

export const RUNNER_TEST_ENVIRONMENT_REFS: RunnerTestEnvironmentSeed = {
  testParams: {
    defaultLibraryAppModel,
    user1Uuid: user1.uuid,
    book1Uuid: book1.uuid,
    lendStartDate: LEND_START_DATE,
    lendEndDate: LEND_START_DATE,
    testApplicationUuid: libraryTestIdentifiers.testApplicationUuid,
    testApplicationDeploymentUuid: libraryTestIdentifiers.testApplicationDeploymentUuid,
    lendingHistoryItemEntityUuid: entityLendingHistoryItem.uuid,
    lendingHistoryItemEntityName: entityLendingHistoryItem.name,
  },
};

export const RUNNER_TEST_DEPLOYMENT_REFS: Record<string, LibraryTestIdentifiers> = {
  libraryTestIdentifiers,
};

export function resolveRunnerRef(runnerRef: string): Runner {
  const runner = RUNNER_REF_MAP[runnerRef];
  if (!runner) {
    throw new Error(`Unknown runnerRef: ${runnerRef}`);
  }
  return runner;
}

export function findRunnerLibraryLeafByMiroirTestLabel(miroirTestLabel: string): MiroirTestForRunner {
  const suite = (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
  const leaf = suite.miroirTests.find(
    (test) => (test as MiroirTestForRunner).miroirTestLabel === miroirTestLabel,
  ) as MiroirTestForRunner | undefined;
  if (!leaf) {
    throw new Error(`Unknown runner_library miroirTestLabel: ${miroirTestLabel}`);
  }
  return leaf;
}

export function runnerTestLeafToFixtureDefaults(leaf: MiroirTestForRunner): RunnerTestFixtureDefaults {
  if (leaf.initialModel === undefined) {
    throw new Error(
      `runnerTest leaf "${leaf.miroirTestLabel}" requires inline initialModel or resolvable fixtureRef`,
    );
  }
  return {
    runner: resolveRunnerRef(leaf.runnerRef),
    testParams: leaf.testParams ?? {},
    preTestCompositeActions: leaf.preTestCompositeActions ?? [],
    testCompositeActionAssertions: leaf.testCompositeActionAssertions ?? [],
    initialModel: leaf.initialModel,
    preRunnerCompositeActions: leaf.preRunnerCompositeActions,
    testCompositeActionLabel: leaf.testCompositeActionLabel,
    skipCreateDeployment: leaf.skipCreateDeployment,
    skipDropDeployment: leaf.skipDropDeployment,
  };
}

export function resolveRunnerTestFixture(fixtureRef: string | undefined): RunnerTestFixtureDefaults {
  if (!fixtureRef) {
    throw new Error("runnerTest requires fixtureRef");
  }
  const miroirTestLabel = RUNNER_LIBRARY_FIXTURE_REF_ALIASES[fixtureRef];
  if (!miroirTestLabel) {
    throw new Error(`Unknown fixtureRef: ${fixtureRef}`);
  }
  return runnerTestLeafToFixtureDefaults(findRunnerLibraryLeafByMiroirTestLabel(miroirTestLabel));
}

export function resolveRunnerTestDeploymentRef(
  deploymentRef: string | undefined,
): LibraryTestIdentifiers {
  const key = deploymentRef ?? "libraryTestIdentifiers";
  const identifiers = RUNNER_TEST_DEPLOYMENT_REFS[key];
  if (!identifiers) {
    throw new Error(`Unknown deploymentRef: ${key}`);
  }
  return identifiers;
}

export function listRunnerTestFixtureRefs(): string[] {
  return Object.keys(RUNNER_LIBRARY_FIXTURE_REF_ALIASES);
}
