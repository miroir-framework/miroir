import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";


import type {
  ApplicationModelBranch,
  ApplicationVersion,
  CompositeActionTemplate,
  CompositeRunTestAssertion,
  CoreTransformerForBuildPlusRuntime,
  Deployment,
  MetaModel,
  MiroirConfigClient,
  Runner,
  StoreUnitConfiguration,
  TestCompositeActionParams
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  createDeploymentCompositeAction,
  resetAndinitializeDeploymentCompositeAction,
  testUtils_resetApplicationDeployment
} from "./Deployment";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

// ################################################################################################
export function testBuildPlusRuntimeCompositeActionSuiteForRunner(
  pageLabel: string,
  runner: Runner,
  testApplicationUuid: string,
  testApplicationDeploymentUuid: string,
  testApplicationName: string,
  testParams: Record<string, any>,
  // preTestCompositeActions: ActionTemplate[],
  preTestCompositeActions: CompositeActionTemplate[],
  testCompositeActionAssertions: CompositeRunTestAssertion[],
  //
  internalMiroirConfig: MiroirConfigClient,
  adminDeployment: Deployment,
  testDeploymentStorageConfiguration: StoreUnitConfiguration,
  initialModel: MetaModel | CoreTransformerForBuildPlusRuntime,
  // preRunnerCompositeActions?: ActionTemplate[],
  preRunnerCompositeActions?: CompositeActionTemplate[],
  testCompositeActionLabel?: string,
  skipCreateDeployment?: boolean,
  skipDropDeployment?: boolean,
): TestCompositeActionParams {
  // if (runner.definition.runnerType !== "customRunner") {
  //   throw new Error(
  //     "Runner_CreateEntity.integ.test: testRunnerActions only supports customRunner type",
  //   );
  // }
  const actionTemplateWithoutTemplates: CompositeActionTemplate =
    runner.definition.runnerType === "customRunner"
      ? {
          ...runner.definition.compositeActionSequence,
          payload: { ...runner.definition.compositeActionSequence.payload },
        }
      : {
            transformerType: "getFromParameters",
            interpolation: "build",
            referencePath: [runner.name],
        } as any // TODO: fix type!!
      ;

  if (runner.definition.runnerType === "customRunner") {
    delete (actionTemplateWithoutTemplates as any).payload.templates;
  }

  console.log(
    "testBuildPlusRuntimeCompositeActionSuiteForRunner called with",
    "pageLabel",
    pageLabel,
    "actionTemplateWithoutTemplates",
    JSON.stringify(actionTemplateWithoutTemplates, null, 2),
  );
  const testActions: TestCompositeActionParams = {
    testActionType: "testBuildPlusRuntimeCompositeActionSuite",
    testActionLabel: pageLabel,
    application: testApplicationUuid,
    testParams,
    testCompositeAction: {
      testType: "testBuildPlusRuntimeCompositeActionSuite",
      testLabel: pageLabel,
      beforeAll: skipCreateDeployment
        ? undefined
        : createDeploymentCompositeAction(
            testApplicationName,
            testApplicationDeploymentUuid,
            testApplicationUuid,
            adminDeployment,
            testDeploymentStorageConfiguration,
            {
              // Real-server: Admin is already open on the shared miroir-server.
              skipOpenAdminStore: internalMiroirConfig.client.emulateServer === false,
            },
          ),
      beforeEach: skipCreateDeployment
        ? undefined
        : resetAndinitializeDeploymentCompositeAction(
            testApplicationUuid,
            testApplicationDeploymentUuid,
            {
              dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
              metaModel: defaultMiroirMetaModel,
              selfApplication: {
                uuid: testApplicationUuid,
                parentName: "SelfApplication",
                parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
                name: testApplicationName,
                defaultLabel: `The ${testApplicationName} selfApplication.`,
                description: `The model and data of the ${testApplicationName} selfApplication.`,
                homePageUrl: `/report/${testApplicationUuid}/${testApplicationDeploymentUuid}/data/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8/xxxxx`,
              },
              applicationModelBranch: {
                uuid: "00000000-0000-0000-0000-000000000001",
                parentName: "ApplicationModelBranch",
                parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
                conceptLevel: "Model",
                name: "master",
                defaultLabel: "Master branch of the application model.",
                description: "The master branch of the application model.",
                selfApplication: testApplicationUuid,
              } as ApplicationModelBranch,
              applicationVersion: {
                uuid: "00000000-0000-0000-0000-000000000001",
                parentName: "ApplicationVersion",
                parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
              } as ApplicationVersion,
              // applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
              // applicationVersion: selfApplicationVersionLibraryInitialVersion,
            },
            [], // applicationEntitiesDefinitionAndInstances
            initialModel,
            // [
            //   // entityPublisher.uuid
            // ],
          ),
      afterEach: testUtils_resetApplicationDeployment(testApplicationUuid),
      afterAll: undefined,
      // afterAll: skipDropDeployment
      //   ? undefined
      //   : testUtils_deleteApplicationDeployment(
      //       internalMiroirConfig,
      //       testApplicationUuid,
      //       testApplicationDeploymentUuid,
      //     ),
      testCompositeActions: {
        [testCompositeActionLabel ?? "no_testCompositeActionLabel_given"]: {
          testType: "testBuildPlusRuntimeCompositeAction",
          testLabel: testCompositeActionLabel ?? "no_testCompositeActionLabel_given",
          testParams,
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: testCompositeActionLabel ?? "no_testCompositeActionLabel_given",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              ...(runner.definition.runnerType === "customRunner" &&
              runner.definition.compositeActionSequence.payload.templates
                ? {
                    templates: runner.definition.compositeActionSequence.payload.templates,
                  }
                : {}),
              actionSequence: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                ...(skipCreateDeployment
                  ? []
                  : [
                      {
                        actionType: "rollback",
                        actionLabel: "refreshTestApplicationLocalCache",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        payload: {
                          application: testApplicationUuid,
                        },
                      },
                    ]),
                ...(preRunnerCompositeActions ?? []),
                actionTemplateWithoutTemplates as any, // TODO: fix type!!
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
