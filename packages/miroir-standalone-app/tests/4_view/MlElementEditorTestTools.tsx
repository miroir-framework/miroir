import { act, render, screen, waitFor } from "@testing-library/react";
import { Formik, FormikProps } from "formik";
import { expect, ExpectStatic } from "vitest";

import {
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  LocalCacheInterface,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type EntityInstance,
} from "miroir-core";

import {
  reportMultistepCountryCreate,
  reportMultistepLaunchPad,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { deployment_Library_DO_NO_USE } from "miroir-test-app_deployment-library";
import { Container } from "react-dom";
import { MlEditorPropsRoot } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditorInterface";
import {
  buildComponentTestWrapper,
  extractValuesFromRenderedElements as extractValuesFromRenderedElementsInRoot,
  MlElementEditorProps_Test,
  type ExtractValuesExpect,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

import {
  entityQueryVersion,
  entityReport,
} from "miroir-test-app_deployment-miroir";

// Browser-safe tools moved to src/ (#286), re-exported for the importers of this file.
export {
  buildComponentTestWrapper,
  createRecordingFunction,
  formikFieldName,
  formValuesToJSON,
  getMlElementEditorForTest,
  testSectionName,
  testThemeParams,
  type BuildComponentTestWrapperOptions,
  type ComponentTestWrapper,
  type ExtractValuesExpect,
  type MlElementEditorProps_Test,
  type RecordingFunction,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

// ################################################################################################
/**
 * The pre-#286 call shape of `extractValuesFromRenderedElements`, for the importers of this file.
 * The src function searches only its root and the portal element. This one keeps searching the
 * whole page, as before: its root is `container`, or `document` when no container is given, and
 * `document.body` stands for the portal element, since portals mount there under vitest.
 */
export function extractValuesFromRenderedElements(
  expect: ExtractValuesExpect,
  filter: Parameters<typeof extractValuesFromRenderedElementsInRoot>[1] = undefined,
  container?: Container,
  label: string = "",
  step?: string,
  detectOptions: boolean = false,
): Record<string, any> {
  return extractValuesFromRenderedElementsInRoot(
    expect,
    filter,
    container ?? document,
    label,
    step,
    detectOptions,
    document.body,
  );
}

// vitest test names keep the former render mode segment, so that they stay comparable with
// baseline-MlElementEditor.txt (#286).
const mlElementEditorTestModeLabel = "mlElementEditor";


// ################################################################################################
// Helper function to wait for progressive rendering to complete
export const waitForProgressiveRendering = async () => {
  // Progressive reveal is disabled under VITE_TEST_MODE (see useViewportReveal).
  if (process.env.VITE_TEST_MODE === "true" || process.env.VITEST) {
    return;
  }

  await waitFor(
    () => {
      const loadingMessages = screen.queryAllByText(/Loading .+\.\.\./);
      if (loadingMessages.length > 0) {
        throw new Error(`Still loading: ${loadingMessages.length} loading messages found`);
      }
    },
    { timeout: 15000, interval: 150 }
  );

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
};

// Helper function to wait after user interactions that might trigger progressive rendering
export const waitAfterUserInteraction = async () => {
  // Wait a bit longer after user interactions as they might trigger new progressive rendering
  await waitForProgressiveRendering();
  // Extra wait for form updates
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
  });
};

// export type MlEditorTestCaseRenderer<PropType> = {
//   // renderAsMlElementEditor?: React.FC<MlElementEditorProps_Test>;
//   renderAsMlElementEditor?: React.FC<PropType>;
// };

export interface ReactComponentTestSuitePrep<PropType extends Record<string, any>> {
  editor: React.FC<any>;
  performanceTests?: boolean;
  /** Opt-in: real handleCompositeActionTemplate writes the wrapper localCache (issue #274). */
  wireLocalCacheCompositeAction?: boolean;
  getMlEditorTests: (
    mlElementEditor: React.FC<PropType>
  ) => ReactComponentTestSuites<PropType>;
}

export const LIBRARY_TEST_COUNTRY_ENTITY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
export const LIBRARY_TEST_TRACER_COUNTRY_UUID = "63c96487-713f-4d5b-a424-bf7e8f70e147";
const libraryApplicationDeploymentMapForTests: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

let mlEditorTestLocalCache: LocalCacheInterface | undefined;
let mlEditorTestApplicationDeploymentMap: ApplicationDeploymentMap =
  libraryApplicationDeploymentMapForTests;

function libraryCountryFromDomainState(uuid: string): EntityInstance | undefined {
  if (!mlEditorTestLocalCache) {
    return undefined;
  }
  const domainState = mlEditorTestLocalCache.getDomainState();
  const deploymentUuid =
    mlEditorTestApplicationDeploymentMap[selfApplicationLibrary.uuid];
  return domainState?.[deploymentUuid]?.data?.[LIBRARY_TEST_COUNTRY_ENTITY_UUID]?.[uuid] as
    | EntityInstance
    | undefined;
}

export function getLibraryCountryFromMlEditorTestCache(
  uuid: string = LIBRARY_TEST_TRACER_COUNTRY_UUID,
): EntityInstance | undefined {
  return libraryCountryFromDomainState(uuid);
}

export function upsertLibraryCountryInMlEditorTestCache(instance: EntityInstance): void {
  if (!mlEditorTestLocalCache) {
    throw new Error("upsertLibraryCountryInMlEditorTestCache: localCache is not initialized");
  }
  const result = mlEditorTestLocalCache.handleLocalCacheAction(
    {
      actionType: "createInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "data",
        parentUuid: LIBRARY_TEST_COUNTRY_ENTITY_UUID,
        objects: [instance],
      },
    } as any,
    mlEditorTestApplicationDeploymentMap,
  );
  if (result.status !== "ok") {
    throw new Error(
      `upsertLibraryCountryInMlEditorTestCache failed: ${JSON.stringify(result)}`,
    );
  }
}

export function deleteLibraryCountryFromMlEditorTestCache(
  uuid: string = LIBRARY_TEST_TRACER_COUNTRY_UUID,
): void {
  if (!mlEditorTestLocalCache) {
    return;
  }
  const existing = libraryCountryFromDomainState(uuid);
  if (!existing) {
    return;
  }
  mlEditorTestLocalCache.handleLocalCacheAction(
    {
      actionType: "deleteInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "data",
        parentUuid: LIBRARY_TEST_COUNTRY_ENTITY_UUID,
        objects: [existing],
      },
    } as any,
    mlEditorTestApplicationDeploymentMap,
  );
}

function upsertInstanceInMlEditorTestCache(
  application: string,
  applicationSection: ApplicationSection,
  instance: EntityInstance,
): void {
  if (!mlEditorTestLocalCache) {
    throw new Error("upsertInstanceInMlEditorTestCache: localCache is not initialized");
  }
  const deploymentUuid = mlEditorTestApplicationDeploymentMap[application];
  const domainState = mlEditorTestLocalCache.getDomainState();
  const existing =
    domainState?.[deploymentUuid]?.[applicationSection]?.[instance.parentUuid]?.[instance.uuid];
  const result = mlEditorTestLocalCache.handleLocalCacheAction(
    {
      actionType: existing ? "updateInstance" : "createInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application,
        applicationSection,
        parentUuid: instance.parentUuid,
        objects: [instance],
      },
    } as any,
    mlEditorTestApplicationDeploymentMap,
  );
  if (result.status !== "ok") {
    throw new Error(
      `upsertInstanceInMlEditorTestCache failed: ${JSON.stringify(result)}`,
    );
  }
}

export function upsertLibraryReportInMlEditorTestCache(report: EntityInstance): void {
  upsertInstanceInMlEditorTestCache(
    selfApplicationLibrary.uuid,
    "model",
    {
      ...report,
      parentUuid: report.parentUuid ?? entityReport.uuid,
    } as EntityInstance,
  );
}

export function upsertLibraryStoredQueryInMlEditorTestCache(query: EntityInstance): void {
  upsertInstanceInMlEditorTestCache(
    selfApplicationLibrary.uuid,
    "model",
    {
      ...query,
      parentUuid: query.parentUuid ?? entityQueryVersion.uuid,
    } as EntityInstance,
  );
}

export function restoreLibraryMultistepTracerReportInMlEditorTestCache(): void {
  if (!mlEditorTestLocalCache) {
    return;
  }
  upsertLibraryReportInMlEditorTestCache(reportMultistepCountryCreate as EntityInstance);
  upsertLibraryReportInMlEditorTestCache(reportMultistepLaunchPad as EntityInstance);
}

export interface ReactComponentTestCase<PropType extends Record<string, any>> {
  props?: PropType | ((props: PropType) => PropType);
  mlElementEditorProps?:
    | PropType
    | ((props: PropType) => PropType);
    // | MlElementEditorProps_Test
    // | ((props: PropType) => MlElementEditorProps_Test);
  // renderComponent?: MlEditorTestCaseRenderer<PropType>;
  renderComponent?: React.FC<PropType>;
  tests: ((expect: ExpectStatic, container: Container) => Promise<void>);
}

export type ReactComponentTest<PropType extends Record<string, any>> = Record<string, ReactComponentTestCase<PropType>>;

export interface ReactComponentTestSuite<PropType extends Record<string, any>> {
  // suiteRenderComponent?: MlEditorTestCaseRenderer<PropType>;
  suiteRenderComponent?: React.FC<PropType>;
  suiteProps?: PropType;
  tests: ReactComponentTest<PropType>;
};
export type ReactComponentTestSuites<T extends Record<string, any>> = Record<string, ReactComponentTestSuite<T>>;

// ################################################################################################
// ################################################################################################
// LOCAL EDITOR DEPRECATED
// ################################################################################################
// ################################################################################################
export interface LocalEditorPropsRoot {
  label?: string;
  name: string;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: string[];
  initialFormState: any;
}

export interface LocalLiteralEditorProps extends LocalEditorPropsRoot {
}

export function getLocalEditor<
  MlEditorProps extends MlEditorPropsRoot,
  LocalEditorProps extends LocalEditorPropsRoot
>(pageLabel: string, Compo: React.FC<MlEditorProps>): React.FC<LocalEditorProps> {
  console.log("getLocalEditor", "pageLabel", pageLabel);
  const result: React.FC<LocalEditorProps> = (props: LocalEditorProps) => {
    const initialFormState: any = { [props.name]: props.initialFormState };
    // const [formState, setFormState] = useState<any>(initialFormState); // TODO: UNIFY!!!
    // const handleChange = useCallback(
    //   (e: React.ChangeEvent<HTMLInputElement>) => {
    //     console.log(
    //       "handleChange event value ###########################################",
    //       JSON.stringify(e, null, 2)
    //     );
    //     const newFormState: any = alterObjectAtPath(
    //       formState,
    //       props.rootLessListKeyArray,
    //       e.target.value
    //     );
    //     // console.log(
    //     //   "handleChange newFormState ###########################################",
    //     //   JSON.stringify(newFormState, null, 2)
    //     // );
    //     setFormState(newFormState);
    //     // setFormState(e.target.value);
    //     // console.log(
    //     //   "handleChange formik values after ###########################################",
    //     //   formState
    //     // );
    //   },
    //   [props, setFormState]
    // );

    const onSubmit = (values: any) => {
      console.log("MlElementEditorTestTools onSubmit formik values ###########################################", values);
      // const newFormState: any = alterObjectAtPath(formState, props.rootLessListKeyArray, values);
      // setFormState(newFormState);
      // setFormState(values);
      // handleChange({target: { value: values}});
    };

    return (
      <Formik
        enableReinitialize={true}
        initialValues={initialFormState}
        onSubmit={onSubmit}
        // handleChange={handleChange}
      >
        {(formik:FormikProps<any>) => (
          <>
            <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
              <Compo
                {...({
                  ...props,
                  // formState,
                  // onChange: handleChange,
                  formik,
                  // formik: {
                  //   ...formik,
                  //   getFieldProps: (rootLessListKey: string[]) => ({
                  //     name: "testField",
                  //     value: formState,
                  //     rootLessListKey,
                  //     onChange: formik.handleChange,
                  //   }),
                  // },
                } as any)}
              />
            </form>
          </>
        )}
      </Formik>
    );
  };
  return result;
}

// ################################################################################################
export function getWrapperLoadingLocalCache(
  isPerformanceTest: boolean = false,
  applicationDeploymentMapParam: ApplicationDeploymentMap,
  options?: { wireLocalCacheCompositeAction?: boolean },
): React.FC<any> {
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  const { Wrapper, localCache, applicationDeploymentMap } = buildComponentTestWrapper({
    isPerformanceTest,
    applicationDeploymentMap: applicationDeploymentMapParam,
    wireLocalCacheCompositeAction: options?.wireLocalCacheCompositeAction,
  });

  if (options?.wireLocalCacheCompositeAction) {
    mlEditorTestLocalCache = localCache;
    mlEditorTestApplicationDeploymentMap = applicationDeploymentMap;
  }
  return Wrapper;
};

// ##############################################################################################
export async function runMlEditorTest(
  testCase: ReactComponentTestCase<any>,
  testSuite: ReactComponentTestSuite<any>,
  testName: string,
) {
  console.log(
    "runMlEditorTest start",
    "testName",
    testName,
  );
  const ComponentToRender: React.FC<any> | undefined =
      testCase.renderComponent ?? testSuite.suiteRenderComponent
  if (!ComponentToRender) {
    throw new Error(
      `Test case ${testName} does not have a renderAsMlElementEditor or renderAsComponent function, skipping test: ${testName}`
    );
  }
  console.log("runMlEditorTest", "found ComponentToRender"
    // , ComponentToRender
  );
  const testCaseSpecificProps = testCase.mlElementEditorProps;
  const props: MlElementEditorProps_Test | undefined =
    testCaseSpecificProps == undefined
      ? typeof testCase.props === "function"
        ? (testCase.props(testSuite.suiteProps as any) as any)
        : testCase.props ?? (testSuite.suiteProps as any)
      : typeof testCaseSpecificProps === "function"
      ? testCaseSpecificProps(
          typeof testCase.props == "function" || !testCase.props
            ? testSuite.suiteProps
            : testCase.props ?? (testSuite.suiteProps as any)
        ) // TODO: testCase.props can be a function, which will fail.
      : testCaseSpecificProps;
  // console.log(
  //   "runMlEditorTest",
  //   "testName",
  //   testName,
  //   "testCaseSpecificProps",
  //   testCaseSpecificProps,
  //   "testCase.props",
  //   testCase.props,
  //   "testSuite.suiteProps",
  //   testSuite.suiteProps,
  //   "props",
  //   props
  // );

  if (props) {
    // const container: Container<any, HTMLElement, HTMLElement> = render(<ComponentToRender {...props} />);
    const {container} = render(<ComponentToRender {...props} />);
    
    // Wait for progressive rendering to complete before running tests
    await waitForProgressiveRendering();
    
    return await testCase.tests(expect, container);
  } else {
    console.warn(`Test case ${testName} does not have props defined, skipping test: ${testName}`);
  }
  console.log(
    "runMlEditorTest end",
    "testName",
    testName,
  );
}

// ################################################################################################
export function getMlEditorTestSuites<
  MlEditorProps extends MlEditorPropsRoot,
  // LocalEditorProps extends LocalEditorPropsRoot,
>(
  pageLabel: string,
  reactComponentUnderTest: React.FC<MlEditorProps>,
  getMlEditorTests: (
    mlElementEditor: React.FC<MlEditorProps>
  ) => ReactComponentTestSuites<MlEditorProps>,
  performanceTests: boolean = false,
  applicationDeploymentMap: ApplicationDeploymentMap,
  options?: { wireLocalCacheCompositeAction?: boolean },
): ReactComponentTestSuites<MlEditorProps> {
  const WrapperForMlElementEditor: React.FC<any> = getWrapperLoadingLocalCache(
    performanceTests,
    applicationDeploymentMap,
    options,
  );

  const MlElementEditorForTest: React.FC<MlEditorProps> = reactComponentUnderTest;
    // getMlElementEditorForTest(pageLabel);

  // const mlEditorTest: ReactComponentTestSuites<LocalEditorProps> = getMlEditorTests(
  const mlEditorTest: ReactComponentTestSuites<MlEditorProps> = getMlEditorTests(
    (props: MlEditorProps) => (
      <WrapperForMlElementEditor>
        <MlElementEditorForTest {...props} />
      </WrapperForMlElementEditor>
    )
  );
  return mlEditorTest;
}

// ################################################################################################
export function prepareAndRunTestSuites(
  pageLabel: string,
  mlElementEditorTests: Record<
  string,
  ReactComponentTestSuitePrep<any>
>,
  applicationDeploymentMap: ApplicationDeploymentMap,
) {
  Object.entries(mlElementEditorTests).forEach(([editorName, testSuite]) => {
      // const suites: ReactComponentTestSuites<LocalEditorPropsRoot> = getMlEditorTestSuites(
      const suites: ReactComponentTestSuites<MlElementEditorProps_Test> = getMlEditorTestSuites(
        pageLabel,
        testSuite.editor, //getMlElementEditorForTest(pageLabel)
        testSuite.getMlEditorTests,
        testSuite.performanceTests,
        applicationDeploymentMap,
        { wireLocalCacheCompositeAction: testSuite.wireLocalCacheCompositeAction },
      );
      const mode = mlElementEditorTestModeLabel;
      console.log(`Running tests for ${editorName} with Test suites: ${JSON.stringify(Object.keys(suites), null, 2)}`);
      Object.entries(suites[editorName].tests).forEach(([testName, testCase]) => {
        console.log(`Running test: ${editorName} - ${mode} - ${testName}`);
        it(`${editorName} - ${mode} - ${testName}`, async () => {
          console.log(`Running test: ${editorName} - ${mode} - ${testName}`);
          await runMlEditorTest(testCase, suites[editorName], testName);
          console.log(`Completed test: ${editorName} - ${mode} - ${testName}`);
        });
        console.log(`Completed test: ${editorName} - ${mode} - ${testName}`);
      });
    });
}
