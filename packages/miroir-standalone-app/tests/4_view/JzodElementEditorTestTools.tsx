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
import { JzodEditorPropsRoot } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditorInterface";
import {
  buildComponentTestWrapper,
  JzodElementEditorProps_Test,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

import {
  entityQueryVersion,
  entityReport,
} from "miroir-test-app_deployment-miroir";

// Browser-safe tools moved to src/ (#286), re-exported for the importers of this file.
export {
  buildComponentTestWrapper,
  createRecordingFunction,
  extractValuesFromRenderedElements,
  formikFieldName,
  formValuesToJSON,
  getJzodElementEditorForTest,
  testSectionName,
  testThemeParams,
  type BuildComponentTestWrapperOptions,
  type ComponentTestWrapper,
  type ExtractValuesExpect,
  type JzodElementEditorProps_Test,
  type RecordingFunction,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestTools";

// vitest test names keep the former render mode segment, so that they stay comparable with
// baseline-JzodElementEditor.txt (#286).
const jzodElementEditorTestModeLabel = "jzodElementEditor";


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

// export type JzodEditorTestCaseRenderer<PropType> = {
//   // renderAsJzodElementEditor?: React.FC<JzodElementEditorProps_Test>;
//   renderAsJzodElementEditor?: React.FC<PropType>;
// };

export interface ReactComponentTestSuitePrep<PropType extends Record<string, any>> {
  editor: React.FC<any>;
  performanceTests?: boolean;
  /** Opt-in: real handleCompositeActionTemplate writes the wrapper localCache (issue #274). */
  wireLocalCacheCompositeAction?: boolean;
  getJzodEditorTests: (
    jzodElementEditor: React.FC<PropType>
  ) => ReactComponentTestSuites<PropType>;
}

export const LIBRARY_TEST_COUNTRY_ENTITY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
export const LIBRARY_TEST_TRACER_COUNTRY_UUID = "63c96487-713f-4d5b-a424-bf7e8f70e147";
const libraryApplicationDeploymentMapForTests: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

let jzodEditorTestLocalCache: LocalCacheInterface | undefined;
let jzodEditorTestApplicationDeploymentMap: ApplicationDeploymentMap =
  libraryApplicationDeploymentMapForTests;

function libraryCountryFromDomainState(uuid: string): EntityInstance | undefined {
  if (!jzodEditorTestLocalCache) {
    return undefined;
  }
  const domainState = jzodEditorTestLocalCache.getDomainState();
  const deploymentUuid =
    jzodEditorTestApplicationDeploymentMap[selfApplicationLibrary.uuid];
  return domainState?.[deploymentUuid]?.data?.[LIBRARY_TEST_COUNTRY_ENTITY_UUID]?.[uuid] as
    | EntityInstance
    | undefined;
}

export function getJzodEditorTestLocalCache(): LocalCacheInterface | undefined {
  return jzodEditorTestLocalCache;
}

export function getLibraryCountryFromJzodEditorTestCache(
  uuid: string = LIBRARY_TEST_TRACER_COUNTRY_UUID,
): EntityInstance | undefined {
  return libraryCountryFromDomainState(uuid);
}

export function upsertLibraryCountryInJzodEditorTestCache(instance: EntityInstance): void {
  if (!jzodEditorTestLocalCache) {
    throw new Error("upsertLibraryCountryInJzodEditorTestCache: localCache is not initialized");
  }
  const result = jzodEditorTestLocalCache.handleLocalCacheAction(
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
    jzodEditorTestApplicationDeploymentMap,
  );
  if (result.status !== "ok") {
    throw new Error(
      `upsertLibraryCountryInJzodEditorTestCache failed: ${JSON.stringify(result)}`,
    );
  }
}

export function deleteLibraryCountryFromJzodEditorTestCache(
  uuid: string = LIBRARY_TEST_TRACER_COUNTRY_UUID,
): void {
  if (!jzodEditorTestLocalCache) {
    return;
  }
  const existing = libraryCountryFromDomainState(uuid);
  if (!existing) {
    return;
  }
  jzodEditorTestLocalCache.handleLocalCacheAction(
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
    jzodEditorTestApplicationDeploymentMap,
  );
}

function upsertInstanceInJzodEditorTestCache(
  application: string,
  applicationSection: ApplicationSection,
  instance: EntityInstance,
): void {
  if (!jzodEditorTestLocalCache) {
    throw new Error("upsertInstanceInJzodEditorTestCache: localCache is not initialized");
  }
  const deploymentUuid = jzodEditorTestApplicationDeploymentMap[application];
  const domainState = jzodEditorTestLocalCache.getDomainState();
  const existing =
    domainState?.[deploymentUuid]?.[applicationSection]?.[instance.parentUuid]?.[instance.uuid];
  const result = jzodEditorTestLocalCache.handleLocalCacheAction(
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
    jzodEditorTestApplicationDeploymentMap,
  );
  if (result.status !== "ok") {
    throw new Error(
      `upsertInstanceInJzodEditorTestCache failed: ${JSON.stringify(result)}`,
    );
  }
}

export function upsertLibraryReportInJzodEditorTestCache(report: EntityInstance): void {
  upsertInstanceInJzodEditorTestCache(
    selfApplicationLibrary.uuid,
    "model",
    {
      ...report,
      parentUuid: report.parentUuid ?? entityReport.uuid,
    } as EntityInstance,
  );
}

export function upsertLibraryStoredQueryInJzodEditorTestCache(query: EntityInstance): void {
  upsertInstanceInJzodEditorTestCache(
    selfApplicationLibrary.uuid,
    "model",
    {
      ...query,
      parentUuid: query.parentUuid ?? entityQueryVersion.uuid,
    } as EntityInstance,
  );
}

export function restoreLibraryMultistepTracerReportInJzodEditorTestCache(): void {
  if (!jzodEditorTestLocalCache) {
    return;
  }
  upsertLibraryReportInJzodEditorTestCache(reportMultistepCountryCreate as EntityInstance);
  upsertLibraryReportInJzodEditorTestCache(reportMultistepLaunchPad as EntityInstance);
}

export interface ReactComponentTestCase<PropType extends Record<string, any>> {
  props?: PropType | ((props: PropType) => PropType);
  jzodElementEditorProps?:
    | PropType
    | ((props: PropType) => PropType);
    // | JzodElementEditorProps_Test
    // | ((props: PropType) => JzodElementEditorProps_Test);
  // renderComponent?: JzodEditorTestCaseRenderer<PropType>;
  renderComponent?: React.FC<PropType>;
  tests: ((expect: ExpectStatic, container: Container) => Promise<void>);
}

export type ReactComponentTest<PropType extends Record<string, any>> = Record<string, ReactComponentTestCase<PropType>>;

export interface ReactComponentTestSuite<PropType extends Record<string, any>> {
  // suiteRenderComponent?: JzodEditorTestCaseRenderer<PropType>;
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
  JzodEditorProps extends JzodEditorPropsRoot,
  LocalEditorProps extends LocalEditorPropsRoot
>(pageLabel: string, Compo: React.FC<JzodEditorProps>): React.FC<LocalEditorProps> {
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
      console.log("JzodElementEditorTestTools onSubmit formik values ###########################################", values);
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
    jzodEditorTestLocalCache = localCache;
    jzodEditorTestApplicationDeploymentMap = applicationDeploymentMap;
  }
  return Wrapper;
};

// ##############################################################################################
export async function runJzodEditorTest(
  testCase: ReactComponentTestCase<any>,
  testSuite: ReactComponentTestSuite<any>,
  testName: string,
) {
  console.log(
    "runJzodEditorTest start",
    "testName",
    testName,
  );
  const ComponentToRender: React.FC<any> | undefined =
      testCase.renderComponent ?? testSuite.suiteRenderComponent
  if (!ComponentToRender) {
    throw new Error(
      `Test case ${testName} does not have a renderAsJzodElementEditor or renderAsComponent function, skipping test: ${testName}`
    );
  }
  console.log("runJzodEditorTest", "found ComponentToRender"
    // , ComponentToRender
  );
  const testCaseSpecificProps = testCase.jzodElementEditorProps;
  const props: JzodElementEditorProps_Test | undefined =
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
  //   "runJzodEditorTest",
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
    "runJzodEditorTest end",
    "testName",
    testName,
  );
}

// ################################################################################################
export function getJzodEditorTestSuites<
  JzodEditorProps extends JzodEditorPropsRoot,
  // LocalEditorProps extends LocalEditorPropsRoot,
>(
  pageLabel: string,
  reactComponentUnderTest: React.FC<JzodEditorProps>,
  getJzodEditorTests: (
    jzodElementEditor: React.FC<JzodEditorProps>
  ) => ReactComponentTestSuites<JzodEditorProps>,
  performanceTests: boolean = false,
  applicationDeploymentMap: ApplicationDeploymentMap,
  options?: { wireLocalCacheCompositeAction?: boolean },
): ReactComponentTestSuites<JzodEditorProps> {
  const WrapperForJzodElementEditor: React.FC<any> = getWrapperLoadingLocalCache(
    performanceTests,
    applicationDeploymentMap,
    options,
  );

  const JzodElementEditorForTest: React.FC<JzodEditorProps> = reactComponentUnderTest;
    // getJzodElementEditorForTest(pageLabel);

  // const jzodEditorTest: ReactComponentTestSuites<LocalEditorProps> = getJzodEditorTests(
  const jzodEditorTest: ReactComponentTestSuites<JzodEditorProps> = getJzodEditorTests(
    (props: JzodEditorProps) => (
      <WrapperForJzodElementEditor>
        <JzodElementEditorForTest {...props} />
      </WrapperForJzodElementEditor>
    )
  );
  return jzodEditorTest;
}

// ################################################################################################
export function prepareAndRunTestSuites(
  pageLabel: string,
  jzodElementEditorTests: Record<
  string,
  ReactComponentTestSuitePrep<any>
>,
  applicationDeploymentMap: ApplicationDeploymentMap,
) {
  Object.entries(jzodElementEditorTests).forEach(([editorName, testSuite]) => {
      // const suites: ReactComponentTestSuites<LocalEditorPropsRoot> = getJzodEditorTestSuites(
      const suites: ReactComponentTestSuites<JzodElementEditorProps_Test> = getJzodEditorTestSuites(
        pageLabel,
        testSuite.editor, //getJzodElementEditorForTest(pageLabel)
        testSuite.getJzodEditorTests,
        testSuite.performanceTests,
        applicationDeploymentMap,
        { wireLocalCacheCompositeAction: testSuite.wireLocalCacheCompositeAction },
      );
      const mode = jzodElementEditorTestModeLabel;
      console.log(`Running tests for ${editorName} with Test suites: ${JSON.stringify(Object.keys(suites), null, 2)}`);
      Object.entries(suites[editorName].tests).forEach(([testName, testCase]) => {
        console.log(`Running test: ${editorName} - ${mode} - ${testName}`);
        it(`${editorName} - ${mode} - ${testName}`, async () => {
          console.log(`Running test: ${editorName} - ${mode} - ${testName}`);
          await runJzodEditorTest(testCase, suites[editorName], testName);
          console.log(`Completed test: ${editorName} - ${mode} - ${testName}`);
        });
        console.log(`Completed test: ${editorName} - ${mode} - ${testName}`);
      });
    });
}
