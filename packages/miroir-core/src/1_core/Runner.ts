import {
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion
} from "miroir-test-app_deployment-library";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";


import type {
  CompositeAction,
  CompositeRunTestAssertion,
  Deployment,
  MetaModel,
  MiroirConfigClient,
  Runner,
  StoreUnitConfiguration,
  TestCompositeActionParams,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  createDeploymentCompositeAction,
  resetAndinitializeDeploymentCompositeAction,
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment,
} from "./Deployment";
import { defaultMiroirMetaModel } from "./Model";

export function testBuildPlusRuntimeCompositeActionSuiteForRunner(
  pageLabel: string,
  runner: Runner,
  testApplicationUuid: string,
  testApplicationDeploymentUuid: string,
  testApplicationName: string,
  testParams: Record<string, any>,
  preTestCompositeActions: CompositeAction[],
  testCompositeActionAssertions: CompositeRunTestAssertion[],
  //
  internalMiroirConfig: MiroirConfigClient,
  adminDeployment: Deployment,
  testDeploymentStorageConfiguration: StoreUnitConfiguration,
  // testApplicationModelEnvironment: MiroirModelEnvironment,
  initialModel: MetaModel,
  preRunnerCompositeActions?: CompositeAction[],
  testCompositeActionLabel?: string,
// ): Record<string, TestCompositeActionParams> {
): TestCompositeActionParams {
  if (runner.definition.runnerType !== "customRunner") {
    throw new Error(
      "Runner_CreateEntity.integ.test: testRunnerActions only supports customRunner type",
    );
  }
  // const testActions: Record<string, TestCompositeActionParams> = {
  const testActions: TestCompositeActionParams = {
    testActionType: "testBuildPlusRuntimeCompositeActionSuite",
    testActionLabel: pageLabel,
    application: testApplicationUuid,
    testParams: {},
    // testParams, // TODO: have it working with testParams up here, make testParams optional
    testCompositeAction: {
      testType: "testBuildPlusRuntimeCompositeActionSuite",
      testLabel: pageLabel,
      beforeAll: createDeploymentCompositeAction(
        testApplicationName,
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration,
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        testApplicationUuid,
        testApplicationDeploymentUuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: {
            uuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
            parentName: "SelfApplication",
            parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
            name: testApplicationName,
            defaultLabel: `The ${testApplicationName} selfApplication.`,
            description: `The model and data of the ${testApplicationName} selfApplication.`,
            homePageUrl: `/report/${testApplicationUuid}/${testApplicationDeploymentUuid}/data/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8/xxxxx`,
          },
          // deployment: selfApplicationDeploymentLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        [], // applicationEntitiesDefinitionAndInstances
        initialModel,
        [
          // entityPublisher.uuid
        ],
      ),
      afterEach: testUtils_resetApplicationDeployment(testApplicationUuid),
      afterAll: testUtils_deleteApplicationDeployment(
        internalMiroirConfig,
        testApplicationUuid,
        testApplicationDeploymentUuid,
      ),
      testCompositeActions: {
        [testCompositeActionLabel ?? "Add Entity Author and Commit"]: {
          testType: "testBuildPlusRuntimeCompositeAction",
          testLabel: testCompositeActionLabel ?? "Add Entity Author and Commit",
          testParams,
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: testCompositeActionLabel ?? "AddAuthorEntityAndCommit",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                ...((preRunnerCompositeActions ?? []) as any[]),
                runner.definition.actionTemplate as any,
                {
                  actionType: "commit",
                  actionLabel: "commitLibraryLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                ...preTestCompositeActions,
              ],
            },
          },
          testCompositeActionAssertions,
        },
      },
    },
  };
  return testActions;
}
