import type {
  CompositeAction,
  CompositeRunTestAssertion,
  CoreTransformerForBuildPlusRuntime,
  Deployment,
  MiroirConfigClient,
  Runner,
  StoreUnitConfiguration,
} from "miroir-core";
import { defaultLibraryAppModel } from "./Library.js";
import book1 from "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" assert { type: "json" };
import user1 from "../assets/library_data/ca794e28-b2dc-45b3-8137-00151557eea8/04c371ed-702d-4dd9-a06d-8a04eda5d24f.json" assert { type: "json" };
import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json" assert { type: "json" };
import entityLendingHistoryItem from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e81078f3-2de7-4301-bd79-d3a156aec149.json" assert { type: "json" };
import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" assert { type: "json" };
import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" assert { type: "json" };
import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" assert { type: "json" };

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

// export const RUNNER_TEST_INITIAL_MODEL_FROM_PARAMETERS: CoreTransformerForBuildPlusRuntime = {
//   transformerType: "getFromParameters",
//   interpolation: "build",
//   referenceName: "defaultLibraryAppModel",
// };

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

export const RUNNER_TEST_ENVIRONMENT_REFS: RunnerTestEnvironmentSeed = {
    testParams: {
      defaultLibraryAppModel,
      user1Uuid: user1.uuid,
      book1Uuid: book1.uuid,
    },
};

export const RUNNER_TEST_DEPLOYMENT_REFS: Record<string, LibraryTestIdentifiers> = {
  libraryTestIdentifiers,
};

const fetchLendingHistoryPreTest: CompositeAction = {
  actionType: "compositeRunBoxedQueryAction",
  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  actionLabel: "fetchLendingHistory",
  nameGivenToResult: "LendingHistoryList",
  payload: {
    actionType: "runBoxedQueryAction",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: {
      application: libraryTestIdentifiers.testApplicationUuid,
      applicationSection: "data",
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: libraryTestIdentifiers.testApplicationUuid,
        pageParams: {
          currentDeploymentUuid: libraryTestIdentifiers.testApplicationDeploymentUuid,
        },
        extractors: {
          items: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            applicationSection: "data",
            parentName: entityLendingHistoryItem.name,
            parentUuid: entityLendingHistoryItem.uuid,
            orderBy: {
              attributeName: "name",
              direction: "ASC",
            },
          },
        },
      },
    },
  },
};

const lendBookPreRunner: CompositeAction = {
  actionType: "lendDocument",
  endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
  actionLabel: "preLendBookForReturn",
  payload: {
    user: user1.uuid,
    book: book1.uuid,
    startDate: new Date("2024-01-01").toISOString(),
  },
} as any; // lendDocument is a library action, not included in CompositeAction type

const checkNumberOfLendingHistoryItemsAssertion: CompositeRunTestAssertion = {
  actionType: "compositeRunTestAssertion",
  actionLabel: "checkNumberOfLendingHistoryItems",
  nameGivenToResult: "checkNumberOfLendingHistoryItems",
  testAssertion: {
    testType: "testAssertion",
    testLabel: "checkNumberOfLendingHistoryItems",
    definition: {
      resultAccessPath: ["0"],
      resultTransformer: {
        transformerType: "aggregate",
        interpolation: "runtime",
        applyTo: {
          transformerType: "getFromContext",
          interpolation: "runtime",
          referencePath: ["LendingHistoryList", "items"],
        },
      },
      expectedValue: { aggregate: 1 },
    },
  },
};

export const RUNNER_TEST_FIXTURE_REFS: Record<string, RunnerTestFixtureDefaults> = {
  libraryLendBookDefaults: {
    runner: lendDocument as unknown as Runner,
    testCompositeActionLabel: "Lend Book Test Composite Action",
    testParams: {
      [lendDocument.name]: {
        actionType: "lendDocument",
        endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        payload: {
          user: user1.uuid,
          book: book1.uuid,
          startDate: new Date("2024-01-01").toISOString(),
        },
      },
    },
    preTestCompositeActions: [fetchLendingHistoryPreTest],
    testCompositeActionAssertions: [checkNumberOfLendingHistoryItemsAssertion],
    initialModel: {
      transformerType: "getFromParameters",
      interpolation: "build",
      referenceName: "defaultLibraryAppModel",
    },
    preRunnerCompositeActions: [],
  },
  libraryReturnBookDefaults: {
    runner: returnDocument as unknown as Runner,
    testCompositeActionLabel: "Return Book Test Composite Action",
    testParams: {
      [returnDocument.name]: {
        actionType: "returnDocument",
        endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        payload: {
          user: user1.uuid,
          book: book1.uuid,
          startDate: new Date("2024-01-01").toISOString(),
          endDate: new Date("2024-01-01").toISOString(),
        },
      },
    },
    preTestCompositeActions: [fetchLendingHistoryPreTest],
    testCompositeActionAssertions: [checkNumberOfLendingHistoryItemsAssertion],
    initialModel: {
      transformerType: "getFromParameters",
      interpolation: "build",
      referenceName: "defaultLibraryAppModel",
    },
    preRunnerCompositeActions: [lendBookPreRunner],
  },
};

export function resolveRunnerRef(runnerRef: string): Runner {
  const runner = RUNNER_REF_MAP[runnerRef];
  if (!runner) {
    throw new Error(`Unknown runnerRef: ${runnerRef}`);
  }
  return runner;
}


export function resolveRunnerTestFixture(fixtureRef: string | undefined): RunnerTestFixtureDefaults {
  if (!fixtureRef) {
    throw new Error("runnerTest requires fixtureRef");
  }
  const fixture = RUNNER_TEST_FIXTURE_REFS[fixtureRef];
  if (!fixture) {
    throw new Error(`Unknown fixtureRef: ${fixtureRef}`);
  }
  return fixture;
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
  return Object.keys(RUNNER_TEST_FIXTURE_REFS);
}
