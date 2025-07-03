import { expect, ExpectStatic, vi } from "vitest";
import { ThemeProvider } from "@emotion/react";
import { createTheme, StyledEngineProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import { act, fireEvent, render, RenderResult, screen } from "@testing-library/react";
import { Formik, FormikProps } from "formik";
import { Profiler, useCallback, useMemo } from "react";
import { Provider } from "react-redux";

import {
  adminConfigurationDeploymentMiroir,
  ConfigurationService,
  DomainControllerInterface,
  JzodArray,
  JzodElement,
  JzodEnum,
  JzodPlainAttribute,
  JzodSchema,
  jzodTypeCheck,
  LocalCacheInterface,
  MiroirContext,
  miroirFundamentalJzodSchema,
  PersistenceStoreControllerManager,
  ResolvedJzodSchemaReturnType
} from "miroir-core";
import { LocalCache, PersistenceReduxSaga } from "miroir-localcache-redux";

import {
  Action2ReturnType,
  book1,
  defaultMiroirMetaModel,
  entityAuthor,
  entityBook,
  entityCountry,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionCountry,
  entityDefinitionEntityDefinition,
  entityDefinitionPublisher,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityPublisher,
  entityReport,
  entitySelfApplicationVersion,
  JzodAttributePlainDateWithValidations,
  JzodAttributePlainNumberWithValidations,
  JzodAttributePlainStringWithValidations,
  JzodObject,
  JzodRecord,
  JzodTuple,
  JzodUnion,
  menuDefaultLibrary,
  MetaModel,
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookInstance,
  reportBookList,
  reportCountryList,
  reportPublisherList,
  selfApplicationDeploymentLibrary
} from "miroir-core";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { JzodEditorPropsRoot } from "../../src/miroir-fwk/4_view/components/JzodElementEditorInterface";
import { MiroirContextReactProvider, useMiroirContextService } from "../../src/miroir-fwk/4_view/MiroirContextReactProvider";
import { useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { emptyObject } from "../../src/miroir-fwk/4_view/routes/Tools";
import { libraryApplicationInstances } from "../../src/miroir-fwk/4_view/uploadBooksAndReports";
import { TestMode } from "./JzodElementEditor.test";
import { Container } from "react-dom";
import { rootLessListKeyMap } from "miroir-core";

export const testThemeParams = {
  palette: {
    primary: {
      main: blue[500],
    },
  },
  spacing: 2,
  components: {
    toolbar: {
      paddingRight: 24, // keep right padding when drawer closed
    },
    MuiContainer: { // no effect?
      defaultProps: {
        disableGutters: true,
      },
    },
    MuiToolbar: { // no effect
      defaultProps: {
        disableGutters: true,
      },
    },
    MuiGridContainer: { // no effect?
      defaultProps: {
        disableGutters: true,
      },
    },
    // toolbarIcon: {
    //   display: 'flex',
    //   alignItems: 'center',
    //   justifyContent: 'flex-end',
    //   padding: '0 8px',
    //   ...theme.mixins.toolbar,
    // },
    // appBar: {
    //   zIndex: theme.zIndex.drawer + 1,
    //   transition: theme.transitions.create(['width', 'margin'], {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }),
    // },
    // appBarShift: {
    //   marginLeft: SidebarWidth,
    //   width: `calc(100% - ${SidebarWidth}px)`,
    //   transition: theme.transitions.create(['width', 'margin'], {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.enteringScreen,
    //   }),
    // },
    // menuButton: {
    //   marginRight: 36,
    // },
    // menuButtonHidden: {
    //   display: 'none',
    // },
    // title: {
    //   flexGrow: 1,
    // },
    // drawerPaper: {
    //   position: 'relative',
    //   whiteSpace: 'nowrap',
    //   width: SidebarWidth,
    //   transition: theme.transitions.create('width', {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.enteringScreen,
    //   }),
    // },
    // drawerPaperClose: {
    //   overflowX: 'hidden',
    //   transition: theme.transitions.create('width', {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }),
    //   width: theme.spacing(7),
    //   [theme.breakpoints.up('sm')]: {
    //     width: theme.spacing(9),
    //   },
    // },
    // appBarSpacer: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      height: '100vh',
      overflow: 'auto',
    },
    MuiList: {
      defaultProps:{
        style: {border: `0`,}
        // style: {border: `10px dashed ${blue[500]}`,}
      }
    },
    MuiDialog: {
      defaultProps:{
        // style: {maxWidth: "100vw",display:"inline-flex"}
        // style: {maxWidth: "100vw"}
        style: {display:"inline-flex", justifyContent:'center', alignItems:"center"}
      }
    },
    MuiDialogTitle: {
      defaultProps:{
        style: {display:"flex"}
      }
    },
    //   defaultProps:{
    //     style: {maxHeight:"90vh",maxWidth:"90vw",display:"inline-flex"}
    //     // style: {display:"inline-flex"}
    //   }
    // }
  }
};

export interface JzodElementEditorProps_Test {
  // forceTestingMode?: boolean;
  name: string;
  label?: string;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: string[];
  initialFormState: any;
  rawJzodSchema: JzodElement | undefined;
  // isPerformanceTest?: boolean;
}


export type JzodEditorTestCaseRenderer<LocalComponentProps> = {
  renderAsComponent?: React.FC<LocalComponentProps>;
  renderAsJzodElementEditor?: React.FC<JzodElementEditorProps_Test>;
};

export interface JzodEditorTestCase<PropType extends Record<string, any>> {
  props?: PropType | ((props: PropType) => PropType);
  componentProps?: PropType | ((props: PropType) => PropType);
  jzodElementEditorProps?:
    | JzodElementEditorProps_Test
    | ((props: PropType) => JzodElementEditorProps_Test);
  renderComponent?: JzodEditorTestCaseRenderer<PropType>;
  tests:
    | ((expect: ExpectStatic, container: Container) => Promise<void>)
    | {
        testAsComponent?: (expect: any, container: Container) => Promise<void>;
        testAsJzodElementEditor?: (expect: any, container: Container) => Promise<void>;
      };
}

export type JzodEditorTest<PropType extends Record<string, any>> = Record<string, JzodEditorTestCase<PropType>>;

export interface JzodEditorTestSuite<T extends Record<string, any>> {
  suiteRenderComponent?: JzodEditorTestCaseRenderer<T>;
  suiteProps?: T;
  tests: JzodEditorTest<T>;
};
export type JzodEditorTestSuites<T extends Record<string, any>> = Record<string, JzodEditorTestSuite<T>>;



// ################################################################################################
const handleAction = vi.fn();
// ################################################################################################

// ################################################################################################
// ################################################################################################
// LOCAL EDITOR
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
// ################################################################################################
// ################################################################################################
// JZOD ELEMENT EDITOR
// ################################################################################################
let JzodElementEditorForTestRenderCount: number = 0;

export const getJzodElementEditorForTest: (pageLabel: string) => React.FC<JzodElementEditorProps_Test> =
  (pageLabel: string) =>
  ({
    name,
    label,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    // indentLevel?: number;
    initialFormState,
    rawJzodSchema,
  }) => {
    // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();
    JzodElementEditorForTestRenderCount++;
    const context = useMiroirContextService();

    context.setDeploymentUuid

    const currentModel: MetaModel = useCurrentModel(selfApplicationDeploymentLibrary.uuid);

    const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
    // console.log("currentMiroirModel", currentMiroirModel);

    const effectiveRawJzodSchema: JzodElement | undefined = useMemo(() => {
      // console.log("getJzodElementEditorForTest", "rawJzodSchema", rawJzodSchema);
      return rawJzodSchema != undefined
        ? { type: "object", definition: { [rootLessListKey]: rawJzodSchema } }
        : undefined;
    }, [rawJzodSchema]);

    const onSubmit = useCallback(
      async (
        actionCreateSchemaParamValues: any /* actually follows formJzodSchema */,
        formikFunctions: { setSubmitting: any; setErrors: any }
      ) => {
        try {
          //  Send values somehow
          console.log(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ JzodElementEditorTestTools onSubmit formik values",
            actionCreateSchemaParamValues,
            "newApplicationName",
            actionCreateSchemaParamValues.newApplicationName,
            "newDeploymentUuid",
            actionCreateSchemaParamValues.newDeploymentUuid,
            "newSelfApplicationUuid",
            actionCreateSchemaParamValues.newSelfApplicationUuid,
            "newAdminAppApplicationUuid",
            actionCreateSchemaParamValues.newAdminAppApplicationUuid
          );
        } catch (e) {
          console.error("onSubmit error", e);
        }
      },
      // [setformHelperState]
      []
    );


    const labelElement = useMemo(() => {
      // return label ? <label htmlFor={rootLessListKey}>{label}</label> : undefined;
      return label ? <span id={rootLessListKey}>{label}</span> : undefined;
    }, [label]);
    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={{ [name]: initialFormState }}
          onSubmit={onSubmit}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {(formik: FormikProps<any>) => {
            // console.log("getJzodElementEditorForTest render formik, values", formik.values);
            const localRootLessListKeyMap:
              | Record<string, { resolvedElementJzodSchema: JzodElement }>
              | undefined = useMemo(() => {
              const result =
                context.miroirFundamentalJzodSchema != undefined &&
                effectiveRawJzodSchema &&
                formik.values &&
                currentModel
                  ? rootLessListKeyMap(
                      "",
                      effectiveRawJzodSchema,
                      currentModel,
                      currentMiroirModel,
                      context.miroirFundamentalJzodSchema,
                      formik.values
                    )
                  : undefined;
              console.log(
                "getJzodElementEditorForTest @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ new rootLessListKeyMap value,",
                "rootLessListKey",
                rootLessListKey,
                "for formik value",
                formik.values,
                "rootLessListKeyMap",
                JSON.stringify(result, null, 2),
                "effectiveRawJzodSchema",
                JSON.stringify(effectiveRawJzodSchema, null, 2),
              );
              return result;
            }, [
              effectiveRawJzodSchema,
              // initialFormState,
              formik.values,
              currentModel,
              currentMiroirModel,
              context.miroirFundamentalJzodSchema,
            ]);
            // console.log(
            //   "getJzodElementEditorForTest",
            //   "rootLessListKeyMap",
            //   localRootLessListKeyMap
            // );
            const resolvedJzodSchema: JzodElement | undefined = useMemo(() => {
              const result: JzodElement | undefined = localRootLessListKeyMap
                ? // ? localRootLessListKeyMap[rootLessListKey].resolvedElementJzodSchema
                  localRootLessListKeyMap[""].resolvedElementJzodSchema
                : undefined;
              return result;
            }, [effectiveRawJzodSchema, localRootLessListKeyMap, formik.values, context.miroirFundamentalJzodSchema]);
            return (
              <>
                <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                  {resolvedJzodSchema != undefined ? (
                    <>
                      <JzodElementEditor
                        name={name}
                        listKey={"ROOT"}
                        rootLessListKey={""}
                        rootLessListKeyArray={[]}
                        labelElement={labelElement}
                        currentDeploymentUuid={context.deploymentUuid}
                        currentApplicationSection={"data"}
                        rawJzodSchema={effectiveRawJzodSchema}
                        resolvedElementJzodSchema={resolvedJzodSchema}
                        localRootLessListKeyMap={localRootLessListKeyMap}
                        foreignKeyObjects={emptyObject}
                        indentLevel={0}
                      />
                      <button type="submit" role="form" name={pageLabel} form={"form." + pageLabel}>
                        submit form.{pageLabel}
                      </button>
                    </>
                  ) : (
                    <div>
                      could not display editor because schema could not be resolved:{" "}
                      {JSON.stringify(resolvedJzodSchema)}
                    </div>
                  )}
                </form>
              </>
            );
          }}
        </Formik>
      </div>
    );
  };

  // ################################################################################################
export function getWrapperForLocalJzodElementEditor(
  isPerformanceTest: boolean = false,
): React.FC<any> {
  // const miroirContext: MiroirContext = new MiroirContext(currentMiroirConfig);
  const miroirContext: MiroirContext = new MiroirContext(undefined as any);
  const theme = createTheme(testThemeParams);
  
  ConfigurationService.registerTestImplementation({ expect: expect as any });

  const persistenceSaga:PersistenceReduxSaga  = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister
    ),
    // remotePersistenceStoreRestClient: persistenceClientAndRestClient,
    remotePersistenceStoreRestClient: undefined as any,
  });

  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);

  console.log("getWrapperForLocalJzodElementEditor", "defaultMiroirMetaModel.entities", JSON.stringify(defaultMiroirMetaModel.entities));
    // const resultForLoadingLibraryAppInstances: Action2ReturnType = localCache.handleLocalCacheAction({
  const resultForLoadingMiroirMetaModel: Action2ReturnType = localCache.handleLocalCacheAction({
    actionType: "loadNewInstancesInLocalCache",
    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    // deploymentUuid: applicationDeploymentAdmin.uuid,
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    objects: [
      {
        parentName: entityEntity.name,
        parentUuid: entityEntity.uuid,
        applicationSection: "model",
        instances: defaultMiroirMetaModel.entities
      },
      {
        parentName: entityEntityDefinition.name,
        parentUuid: entityEntityDefinition.uuid,
        applicationSection: "model",
        instances: defaultMiroirMetaModel.entityDefinitions
      },
      {
        parentName: entityJzodSchema.name,
        parentUuid: entityJzodSchema.uuid,
        applicationSection: "data",
        instances: defaultMiroirMetaModel.jzodSchemas
      },
      {
        parentName: entityMenu.name,
        parentUuid: entityMenu.uuid,
        applicationSection: "data",
        instances: defaultMiroirMetaModel.menus
      },
      {
        parentName: entitySelfApplicationVersion.name,
        parentUuid: entitySelfApplicationVersion.uuid,
        applicationSection: "data",
        instances: defaultMiroirMetaModel.applicationVersions
      },
      {
        parentName: entityReport.name,
        parentUuid: entityReport.uuid,
        applicationSection: "data",
        instances: defaultMiroirMetaModel.reports
      },
      // {
      //   parentName: applicationVersionCrossEntityDefinitionSchema.name,
      //   parentUuid: ApplicationVersionCrossEntityDefinitionSchema.uuid,
      //   applicationSection: "model",
      //   instances: defaultMiroirMetaModel.applicationVersionCrossEntityDefinition
      // },
    ],
  });
  if (resultForLoadingMiroirMetaModel.status !== "ok") {
    throw new Error(
      `Error loading Miroir Meta Model: ${JSON.stringify(resultForLoadingMiroirMetaModel, null, 2)}`
    );
  }

  localCache.handleLocalCacheAction( // needed so that "loading" instances become "current"
    {
      actionType: "rollback",
      // actionType: "commit",
      deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    }
  );
  const resultForLoadingLibraryApplicationModel: Action2ReturnType = localCache.handleLocalCacheAction({
    actionType: "loadNewInstancesInLocalCache",
    deploymentUuid: selfApplicationDeploymentLibrary.uuid,
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    objects: [
      {
        parentName: entityEntity.name,
        parentUuid: entityEntity.uuid,
        applicationSection: "model",
        instances: [
          entityAuthor,
          entityBook,
          entityCountry,
          entityPublisher
        ]
      },
      {
        parentName: entityEntityDefinition.name,
        parentUuid: entityEntityDefinition.uuid,
        applicationSection: "model",
        instances: [
          entityDefinitionBook,
          entityDefinitionAuthor,
          entityDefinitionCountry,
          entityDefinitionPublisher,
        ]
      },
      {
        parentName: entityMenu.name,
        parentUuid: entityMenu.uuid,
        applicationSection: "model",
        instances: [menuDefaultLibrary]
      },
      // {
      //   parentName: entitySelfApplicationVersion.name,
      //   parentUuid: entitySelfApplicationVersion.uuid,
      //   applicationSection: "model",
      //   instances: defaultMiroirMetaModel.applicationVersions
      // },
      {
        parentName: entityReport.name,
        parentUuid: entityReport.uuid,
        applicationSection: "model",
        instances: [
            reportAuthorList,
            reportAuthorDetails,
            reportBookList,
            reportBookDetails,
            reportBookInstance,
            reportCountryList,
            reportPublisherList,
        ],
      },
      // {
      //   parentName: applicationVersionCrossEntityDefinitionSchema.name,
      //   parentUuid: ApplicationVersionCrossEntityDefinitionSchema.uuid,
      //   applicationSection: "model",
      //   instances: defaultMiroirMetaModel.applicationVersionCrossEntityDefinition
      // },
      ...libraryApplicationInstances
    ],
  });
  if (resultForLoadingLibraryApplicationModel.status !== "ok") {
    throw new Error(
      `Error loading Library Application Model: ${JSON.stringify(resultForLoadingLibraryApplicationModel, null, 2)}`
    );
  }
  localCache.handleLocalCacheAction( // needed so that "loading" instances become "current"
    {
      actionType: "rollback",
      // actionType: "commit",
      deploymentUuid: selfApplicationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    }
  );

  const resultForLoadingLibraryApplicationInstances: Action2ReturnType = localCache.handleLocalCacheAction({
    actionType: "loadNewInstancesInLocalCache",
    deploymentUuid: selfApplicationDeploymentLibrary.uuid,
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    objects: libraryApplicationInstances,
  });

  if (resultForLoadingLibraryApplicationInstances.status !== "ok") {
    throw new Error(
      `Error loading Library Application Instances: ${JSON.stringify(resultForLoadingLibraryApplicationInstances, null, 2)}`
    );
  }
  localCache.handleLocalCacheAction( // needed so that "loading" instances become "current"
    {
      actionType: "rollback",
      // actionType: "commit",
      deploymentUuid: selfApplicationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    }
  );

  console.log(
    "getWrapperForLocalJzodElementEditor",
    "resultForLoadingMiroirMetaModel",
    resultForLoadingMiroirMetaModel,
    "resultForLoadingLibraryApplicationModel",
    resultForLoadingLibraryApplicationModel,
    "resultForLoadingLibraryApplicationInstances",
    resultForLoadingLibraryApplicationInstances,
    localCache.getInnerStore().getState()
  );  
  // localCache.setInstancesForEntityUuidIndex(
  //   adminConfigurationDeploymentMiroir.uuid,
  //   "MetaModel",
  //   {
  //     [adminConfigurationDeploymentMiroir.uuid]: adminConfigurationDeploymentMiroir,
  //   }
  // );

  // ###############################################
  return (props: { children?: React.ReactNode }) => {
    const domainController: DomainControllerInterface = {
      handleAction,
      // add other methods if needed
    } as any;

    const renderCount = { current: 0 };
    const totalRenderTime = { current: 0 };
    
    const onRender = useCallback((
      id: string,
      phase: "mount" | "update" | "nested-update",
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      renderCount.current++;
      totalRenderTime.current += actualDuration;
      console.log(
      `Render #${renderCount.current} - ${id} [${phase}] took ${actualDuration.toFixed(2)}ms`,
      `(Total: ${totalRenderTime.current.toFixed(2)}ms)`
      );
    }, []);

    return isPerformanceTest?(
      <Profiler id="App" onRender={onRender}>
        <ThemeProvider theme={theme}>
          <StyledEngineProvider injectFirst>
            <Provider store={localCache.getInnerStore()}>
              <MiroirContextReactProvider
                miroirContext={miroirContext}
                domainController={domainController}
                testingDeploymentUuid={selfApplicationDeploymentLibrary.uuid}
              >
                {props.children}
              </MiroirContextReactProvider>
            </Provider>
          </StyledEngineProvider>
        </ThemeProvider>
      </Profiler>
    ):(
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <Provider store={localCache.getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainController}
              testingDeploymentUuid={selfApplicationDeploymentLibrary.uuid}
            >
              {props.children}
            </MiroirContextReactProvider>
          </Provider>
        </StyledEngineProvider>
      </ThemeProvider>
    );
  };
};
  
// ##############################################################################################
export async function runJzodEditorTest(
  testCase: JzodEditorTestCase<any>,
  testSuite: JzodEditorTestSuite<any>,
  testName: string,
  // renderAs: "component" | "jzodElementEditor" = "jzodElementEditor"
  renderAs: TestMode
) {
  const ComponentToRender: React.FC<any> | undefined =
    renderAs == "jzodElementEditor"
      ? testCase.renderComponent?.renderAsJzodElementEditor ??
        testSuite.suiteRenderComponent?.renderAsJzodElementEditor
      : testCase.renderComponent?.renderAsComponent ??
        testSuite.suiteRenderComponent?.renderAsComponent;
  if (!ComponentToRender) {
    throw new Error(
      `Test case ${testName} does not have a renderAsJzodElementEditor or renderAsComponent function, skipping test: ${testName}`
    );
  }
  const testCaseSpecificProps =
    renderAs == "jzodElementEditor" ? testCase.jzodElementEditorProps : testCase.componentProps;
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
  //   "renderAs",
  //   renderAs,
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
    const tests =
      typeof testCase.tests === "function"
        ? testCase.tests
        : (renderAs == "jzodElementEditor"
            ? testCase.tests.testAsJzodElementEditor
            : testCase.tests.testAsComponent) ?? ((expect: ExpectStatic) => {});
    return tests(expect, container);
  } else {
    console.warn(`Test case ${testName} does not have props defined, skipping test: ${testName}`);
  }
}

// ################################################################################################
export function getJzodEditorTestSuites<
  JzodEditorProps extends JzodEditorPropsRoot,
  LocalEditorProps extends LocalEditorPropsRoot,
>(
  pageLabel: string,
  JzodLiteralEditor: React.FC<JzodEditorProps>,
  getJzodEditorTests: (
    LocalEditor: React.FC<LocalEditorProps>,
    jzodElementEditor: React.FC<JzodElementEditorProps_Test>
  ) => JzodEditorTestSuites<LocalEditorProps>,
  performanceTests: boolean = false,
): JzodEditorTestSuites<LocalEditorProps> {
  // const WrapperForJzodElementEditorPerformanceTest: React.FC<any> = getWrapperForLocalJzodElementEditor(true);
  const WrapperForJzodElementEditor: React.FC<any> = getWrapperForLocalJzodElementEditor(performanceTests);

  const LocalEditor: React.FC<LocalEditorProps> = getLocalEditor<JzodEditorProps, LocalEditorProps>(
    pageLabel,
    JzodLiteralEditor
  );

  const JzodElementEditorForTest: React.FC<JzodElementEditorProps_Test> =
    getJzodElementEditorForTest(pageLabel);

  const jzodEditorTest: JzodEditorTestSuites<LocalEditorProps> = getJzodEditorTests(
    LocalEditor,
    (props: JzodElementEditorProps_Test) => (
      <WrapperForJzodElementEditor>
        <JzodElementEditorForTest {...props} />
      </WrapperForJzodElementEditor>
    )
  );
  return jzodEditorTest;
}

// ################################################################################################
export function extractValuesFromRenderedElements(
  expect: ExpectStatic,
  container?: Container,
  label: string = "",
  step?: string,
): Record<string, any> {
  console.log("########### extractValuesFromRenderedElements for label", label, "step", step);
  let textBoxes: HTMLElement[] = [];
  try {
    textBoxes = screen
      .getAllByTestId("miroirInput")
      .map((i: HTMLElement) => i.querySelector("input") as HTMLInputElement);

  } catch (e) {
    // No textbox found, leave inputs as empty array
  }
  const textBoxesInfo = textBoxes.map((i) => {
    const name = (i as HTMLInputElement).id.replace(new RegExp(`^${label}\\.`), "") || (i as HTMLInputElement).name.replace(new RegExp(`^${label}\\.`), "");
    return {
      name,
      value: (i as HTMLInputElement).value,
      defaultValue: (i as HTMLInputElement).defaultValue,
      type: (i as HTMLInputElement).type,
    };
  });
  console.log("textBoxes", textBoxesInfo);

  // #############################################################
  let checkboxes: HTMLElement[] = [];
  try {
    checkboxes = screen.getAllByRole("checkbox")
    .filter((c: any) => c.name.startsWith(label));
  } catch (e) {
    // No checkbox found, leave checkboxes as empty array
  }
  const checkboxesInfo = checkboxes.map((c) => {
    return {
      name: (c as HTMLInputElement).name.replace(new RegExp(`^${label}\\.`), ""),
      value: (c as HTMLInputElement).value,
      checked: (c as HTMLInputElement).checked,
    };
  });
  console.log("checkboxes", checkboxesInfo);

  // #############################################################
  let comboboxes: HTMLElement[] = [];
  try {
    comboboxes = screen.getAllByRole("combobox").filter((c: any) => c.id.startsWith(label));
  } catch (e) {
    // No combobox found, leave comboboxes as empty array
  }
  const comboBoxInfo = comboboxes.map((c) => {
    const input = (c as HTMLElement).nextElementSibling as HTMLInputElement;
    return {
      name: (input as HTMLInputElement).name.replace(new RegExp(`^${label}\\.`), ""),
      value: input?.value,
      selectedIndex: (c as HTMLSelectElement).tabIndex,
      options: Array.from((c as HTMLSelectElement).options || []).map((o) => o.value),
    };
  });
  console.log("comboboxes", comboBoxInfo);

  // #############################################################
  let options: HTMLElement[] = [];
  try {
    options = screen
      .getAllByRole<HTMLLIElement>("option")
      .filter((o: any) => o.getAttribute("aria-label").startsWith(label));
    options = screen.getAllByRole<HTMLElement>("option");
  } catch (e) {
    // No option found, leave options as empty array
  }
  const optionsInfo = options.map((o) => {
    return {
      value: (o as HTMLOptionElement).textContent,
      // name: (o as HTMLOptionElement).textContent,
      name: o.getAttribute("aria-label"),
      selected: o.getAttribute("aria-selected"),
    };
  });
  console.log("options", optionsInfo);

  // #############################################################
  const values: Record<string, any> = {};
  textBoxesInfo.forEach((c) => {
    let value: any = c.value;
    if (c.value === "" && c.defaultValue !== undefined) {
      value = c.defaultValue;
    }
    if (c.type === "number") {
      if (!isNaN(Number(value)) && value !== "") {
        value = Number(value);
      } else {
        expect(false, "number textBox content is not a number for " + c.name).toBeTruthy();
      }
    }
    values[c.name] = value;
  });
  // Handle boolean checkboxes
  checkboxesInfo.forEach((c) => {
    values[c.name] = c.checked;
  });
  // Handle comboboxes (select elements)
  comboBoxInfo.forEach((c) => {
    values[c.name] = c.value;
  });
  // Optionally, you could add optionsInfo to the return value if needed
  // values["_options"] = optionsInfo;
  optionsInfo.forEach((o) => {
    // values[o.name as any] = o.value;
    if (values[label] === undefined) {
      values[label] = [];
    }
    values[label].push(o.value);
  });
  console.log("extractValuesFromRenderedElements values", values);
  return values;
}

// ################################################################################################
export function formValuesToJSON(input: Record<string, any>): any {
  let result: any = undefined;
  const indexes: [(string | number)[], any][] = Object.entries(input).map(([key, value]) => {
    const index = key.split(".");
    return [index.map((i) => (isNaN(parseInt(i, 10)) ? i : parseInt(i, 10))), value];
  });

  // Determine if the root should be an array or object
  if (
    indexes.length > 0 &&
    typeof indexes[0][0][0] === "number"
  ) {
    result = [];
  } else {
    result = {};
  }

  for (const [indexArray, value] of indexes) {
    let current = result;
    for (let i = 0; i < indexArray.length; i++) {
      const key = indexArray[i];
      const isLast = i === indexArray.length - 1;
      if (isLast) {
        // Special case: convert "e" to BigInt if necessary
        // if (key === "e") {
        //   current[key] = value !== undefined && value !== null && value !== "" ? BigInt(value) : value;
        // } else {
          current[key] = value;
        // }
      } else {
        const nextKey = indexArray[i + 1];
        if (typeof nextKey === "number") {
          if (!Array.isArray(current[key])) {
            current[key] = [];
          }
        } else {
          if (typeof current[key] !== "object" || current[key] === null || Array.isArray(current[key])) {
            current[key] = {};
          }
        }
        current = current[key];
      }
    }
  }
  return result;
}


