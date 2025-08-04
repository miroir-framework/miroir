import { ThemeProvider } from "@emotion/react";
import { createTheme, StyledEngineProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { Formik, FormikProps } from "formik";
import { Profiler, useCallback, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { expect, ExpectStatic, vi } from "vitest";

import {
  Action2ReturnType,
  adminConfigurationDeploymentMiroir,
  ConfigurationService,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  entityCountry,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionCountry,
  entityDefinitionPublisher,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityPublisher,
  entityReport,
  entitySelfApplicationVersion,
  JzodElement,
  LocalCacheInterface,
  menuDefaultLibrary,
  MetaModel,
  MiroirContext,
  PersistenceStoreControllerManager,
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookInstance,
  reportBookList,
  reportCountryList,
  reportPublisherList,
  selfApplicationDeploymentLibrary
} from "miroir-core";
import { LocalCache, PersistenceReduxSaga } from "miroir-localcache-redux";

import { rootLessListKeyMapDEFUNCT } from "miroir-core";
import { Container } from "react-dom";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { JzodEditorPropsRoot } from "../../src/miroir-fwk/4_view/components/JzodElementEditorInterface";
import { MiroirContextReactProvider, useMiroirContextService } from "../../src/miroir-fwk/4_view/MiroirContextReactProvider";
import { useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { emptyObject } from "../../src/miroir-fwk/4_view/routes/Tools";
import { libraryApplicationInstances } from "../../src/miroir-fwk/4_view/uploadBooksAndReports";
import { ResolvedJzodSchemaReturnType } from "miroir-core";
import { measuredJzodTypeCheck } from "../../src/miroir-fwk/4_view/tools/hookPerformanceMeasure";
import { jzodTypeCheck } from "miroir-core";

export type TestMode = 'jzodElementEditor' | 'component';
export type TestModeStar = 'jzodElementEditor' | 'component' | '*';

export const allTestModes: TestMode[] = ['jzodElementEditor', 'component'];

export interface JzodElementEditorTestSuite<LocalEditorProps extends Record<string, any>> {
  editor: React.FC<any>;
  performanceTests?: boolean;
  getJzodEditorTests: (
    LocalEditor: React.FC<LocalEditorProps>,
    jzodElementEditor: React.FC<JzodElementEditorProps_Test>
  ) => JzodEditorTestSuites<LocalEditorProps>;
}

export type ModesType = TestModeStar | TestMode[];


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

// Helper function to wait for progressive rendering to complete
export const waitForProgressiveRendering = async () => {
  // Wait for loading messages to disappear with more attempts
  await waitFor(
    () => {
      // Check for any "Loading..." messages in the DOM using multiple approaches
      // 1. Screen query for the regex pattern 
      const loadingMessages = screen.queryAllByText(/Loading .+\.\.\./);
      
      // 2. Direct DOM search for any element containing "Loading" text
      const loadingTexts = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && /Loading\s+\w+\s*\.\.\./i.test(el.textContent.trim())
      );
      
      const totalLoading = loadingMessages.length + loadingTexts.length;
      if (totalLoading > 0) {
        console.log(`Still waiting for ${totalLoading} loading elements to finish:`, 
          loadingTexts.map(el => el.textContent?.trim()));
        throw new Error(`Still loading: ${totalLoading} loading messages found`);
      }
    },
    { timeout: 15000, interval: 150 } // 15 second timeout, check every 150ms
  );
  
  // Additional delay to ensure rendering is complete after loading stops
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
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
    console.log("getJzodElementEditorForTest", "rawJzodSchema", rawJzodSchema);
    JzodElementEditorForTestRenderCount++;
    const context = useMiroirContextService();

    const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] = useState<{ [k: string]: boolean }>({});
    
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
            console.log(
              "getJzodElementEditorForTest render formik, values",
              formik.values,
              "effectiveRawJzodSchema",
              JSON.stringify(effectiveRawJzodSchema, null, 2)
            );

            let typeError: JSX.Element | undefined = undefined;
            const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
              let result: ResolvedJzodSchemaReturnType | undefined = undefined;
              try {
                result =
                  context.miroirFundamentalJzodSchema &&
                  effectiveRawJzodSchema &&
                  formik.values &&
                  currentModel
                    // ? measuredJzodTypeCheck(
                    ? jzodTypeCheck(
                        effectiveRawJzodSchema,
                        formik.values,
                        [], // currentValuePath
                        [], // currentTypePath
                        context.miroirFundamentalJzodSchema,
                        currentModel,
                        currentMiroirModel,
                        {}
                      )
                    : undefined;
              } catch (e) {
                console.error(
                  "ReportSectionEntityInstance useMemo error",
                  // JSON.stringify(e, Object.getOwnPropertyNames(e)),
                  e,
                  "context",
                  context
                );
                result = {
                  status: "error",
                  valuePath: [],
                  typePath: [],
                  error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
                };
              }
              return result;
            }, [formik.values, effectiveRawJzodSchema, context, currentModel]);
                      // console.log(
                      //   "ReportSectionEntityInstance jzodTypeCheck done for render", ReportSectionEntityInstanceCount ,"resolvedJzodSchema",
                      //   resolvedJzodSchema,
                      // );
          if (!resolvedJzodSchema || resolvedJzodSchema.status != "ok") {
            console.error(
              "ReportSectionEntityInstance could not resolve jzod schema",
              // props,
              // context,
              resolvedJzodSchema
            );

            // return <>ReportSectionEntityInstance: could not resolve jzod schema: {JSON.stringify(resolvedJzodSchema)}</>;
            // typeError = <>ReportSectionEntityInstance: could not resolve jzod schema: {JSON.stringify(resolvedJzodSchema, null, 2)}</>;
            // Calculate the maximum line width for fixed sizing
            // const jsonString = JSON.stringify(resolvedJzodSchema, null, 2);
            // const lines = jsonString.split("\n");
            // const maxLineLength = Math.max(...lines.map((line) => line.length));
            // const fixedWidth = Math.min(Math.max(maxLineLength * 0.6, 1200), 1800); // 0.6px per character, min 400px, max 1200px

            typeError = (<pre>type error: {JSON.stringify(resolvedJzodSchema)}</pre>);
          }

            return (
              <>
                <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                  {resolvedJzodSchema != undefined  && resolvedJzodSchema.status === "ok"? (
                    <>
                      <JzodElementEditor
                        name={name}
                        listKey={"ROOT"}
                        rootLessListKey={""}
                        rootLessListKeyArray={[]}
                        labelElement={labelElement}
                        currentDeploymentUuid={context.deploymentUuid}
                        currentApplicationSection={"data"}
                        // rawJzodSchema={effectiveRawJzodSchema}
                        foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                        setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                        resolvedElementJzodSchema={resolvedJzodSchema.resolvedSchema}
                        typeCheckKeyMap={resolvedJzodSchema.keyMap}
                        // localRootLessListKeyMap={localRootLessListKeyMap}
                        foreignKeyObjects={emptyObject}
                        indentLevel={0}
                      />
                      <button type="submit" role="form" name={pageLabel} form={"form." + pageLabel}>
                        submit form.{pageLabel}
                      </button>
                    </>
                  ) : (
                    <div>
                      could not display editor because schema could not be resolved!
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
    payload: {
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
    }
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
    payload: {
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
    }
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
    payload: {
      objects: libraryApplicationInstances,
    }
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
    "getWrapperForLocalJzodElementEditor FINISHED PREPARING LOCAL CACHE",
    "resultForLoadingMiroirMetaModel",
    resultForLoadingMiroirMetaModel,
    "resultForLoadingLibraryApplicationModel",
    resultForLoadingLibraryApplicationModel,
    "resultForLoadingLibraryApplicationInstances",
    resultForLoadingLibraryApplicationInstances,
    "localCache.getInnerStore().getState()",
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
    // console.log("############################################## getWrapperForLocalJzodElementEditor returned", "props", props);
    // console.log
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
  console.log(
    "runJzodEditorTest start",
    "testName",
    testName,
    "renderAs",
    renderAs,
  );
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
  console.log("runJzodEditorTest", "found ComponentToRender"
    // , ComponentToRender
  );
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
    
    // Wait for progressive rendering to complete before running tests
    await waitForProgressiveRendering();
    
    const tests =
      typeof testCase.tests === "function"
        ? testCase.tests
        : (renderAs == "jzodElementEditor"
            ? testCase.tests.testAsJzodElementEditor
            : testCase.tests.testAsComponent) ?? ((expect: ExpectStatic) => {});
            
    return await tests(expect, container);
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
  const values: Record<string, any> = {};
  
  // Pre-compile regex patterns to avoid recreating them
  const labelRegex = label ? new RegExp(`^${label}\\.`) : null;
  const removeLabelPrefix = (str: string) => labelRegex ? str.replace(labelRegex, "") : str;
  
  // Use container if provided, otherwise fall back to document
  // const searchRoot = container || document;
  const searchRoot = document; // otherwise comboboxes options are not found
  
  // Single DOM query to get all relevant elements at once
  const allInputs = Array.from(searchRoot.querySelectorAll("input[name], input[id]")).filter(
    (el) =>
      !(el.id && el.id.startsWith("displayAsStructuredElementSwitch")) &&
      !(
        (el as any).name &&
        (el as any).name.startsWith("meta") &&
        (el as any).name.endsWith("-NAME")
      )
  );
  // checkboxes are inputs! redundant?
  const allCheckboxes = Array.from(searchRoot.querySelectorAll('input[type="checkbox"]'))
    .filter((el) => !(el.id && el.id.startsWith("displayAsStructuredElementSwitch")));
  const allTestIdElements = searchRoot.querySelectorAll('[data-testid="miroirInput"]');
  const allComboboxes = Array.from(searchRoot.querySelectorAll('[role="combobox"]'));
    // .filter((el) => !(el.id && el.id.startsWith("displayAsStructuredElementSwitch")));
  const allOptions = searchRoot.querySelectorAll('[role="option"]');
  
  console.log("extractValuesFromRenderedElements",
    "label", label,
    "step", step,
    "allInputs.length", allInputs.length,
    // "allInputs", allInputs.map((el) => ({
    //   id: el.id,
    //   name: (el as any).name,
    //   type: (el as HTMLInputElement).type,
    //   value: (el as HTMLInputElement).value,
    //   defaultValue: (el as HTMLInputElement).defaultValue,
    // })),
  );
  console.log("extractValuesFromRenderedElements",
    "label", label,
    "step", step,
    "allInputs.length", allInputs.length,
    "allTestIdElements.length", allTestIdElements.length,
    "allCheckboxes.length", allCheckboxes.length,
    "allComboboxes.length", allComboboxes.length,
    "allOptions.length", allOptions.length,
  );
  console.log("extractValuesFromRenderedElements",
    "label", label,
    "step", step,
    "allCheckboxes.length", allCheckboxes.length,
    // 'allCheckboxes', allCheckboxes.map((el) => ({
    //   id: el.id,
    //   name: (el as any).name,
    //   checked: (el as HTMLInputElement).checked,
    // })),
  );

  console.log("extractValuesFromRenderedElements",
    "label", label,
    "step", step,
    "allComboboxes.length", allComboboxes.length,
    // 'allComboboxes', allComboboxes.map((el) => ({
    //   id: el.id,
    //   name: (el as any).name,
    //   value: (el as HTMLInputElement).value,
    //   defaultValue: (el as HTMLInputElement).defaultValue,
    // })),
  );

  console.log("extractValuesFromRenderedElements",
    "label", label,
    "step", step,
    "allOptions.length", allOptions.length,
    // 'allOptions', Array.from(allOptions).map((el) => ({
    //   id: el.id,
    //   textContent: (el as HTMLOptionElement).textContent,
    //   ariaLabel: el.getAttribute("aria-label"),
    // })),
  );
  // Process miroirInput elements first (these are the main form inputs)
  allTestIdElements.forEach((element: Element) => {
    const input = element.querySelector('input') as HTMLInputElement;
    if (!input) return;
    
    const name = removeLabelPrefix(input.id || input.name);
    if (!name) return;
    
    let value: any = input.value;
    if (value === "" && input.defaultValue !== undefined) {
      value = input.defaultValue;
    }
    if (input.type === "number") {
      if (!isNaN(Number(value)) && value !== "") {
        value = Number(value);
      } else {
        expect(false, "number textBox content is not a number for " + name).toBeTruthy();
      }
    }
    values[name] = value;
  });

  // Process all other input elements that might not have miroirInput testId
  allInputs.forEach((input: Element) => {
    const htmlInput = input as HTMLInputElement;
    if (!htmlInput.name && !htmlInput.id) return;
    
    const name = removeLabelPrefix(htmlInput.id || htmlInput.name);
    if (!name || values[name] !== undefined) return; // Skip if already processed
    
    // Skip if this input was already processed by miroirInput logic
    const parentWithTestId = htmlInput.closest('[data-testid="miroirInput"]');
    if (parentWithTestId) return;
    
    let value: any = htmlInput.value;
    if (value === "" && htmlInput.defaultValue !== undefined) {
      value = htmlInput.defaultValue;
    }
    if (htmlInput.type === "number") {
      if (!isNaN(Number(value)) && value !== "") {
        value = Number(value);
      } else {
        expect(false, "number input content is not a number for " + name).toBeTruthy();
      }
    }
    if (htmlInput.type === "checkbox") {
      value = htmlInput.checked;
    }
    values[name] = value;
  });

  // Process checkboxes specifically (in case they weren't caught above)
  allCheckboxes.forEach((element: Element) => {
    const input = element as HTMLInputElement;
    if (!input.name && !input.id) return;
    if (label && !input.name.startsWith(label) && !input.id.startsWith(label)) return;
    
    const name = removeLabelPrefix(input.name || input.id);
    if (name && values[name] === undefined) {
      values[name] = input.checked;
    }
  });

  // Process comboboxes
  allComboboxes.forEach((element: Element) => {
    const htmlElement = element as HTMLElement;
    if (label && !htmlElement.id.startsWith(label)) return;
    
    const input = htmlElement.nextElementSibling as HTMLInputElement;
    if (input && input.name) {
      const name = removeLabelPrefix(input.name);
      if (name && values[name] === undefined) {
        values[name] = input.value;
      }
    }
  });

  // Process options
  allOptions.forEach((element: Element) => {
    const htmlElement = element as HTMLElement;
    const ariaLabel: string | null = htmlElement.getAttribute("aria-label");
    if (!label || !ariaLabel || !ariaLabel.startsWith(label)) return;
    
    const optionValue = (htmlElement as HTMLOptionElement).textContent;
    const targetName = label + ".options";
    if (optionValue) {
      // console.log(
      //   "extractValuesFromRenderedElements",
      //   "label", label,
      //   "step", step,
      //   "optionValue", optionValue,
      //   "ariaLabel", ariaLabel,
      //   "values[label]", values[label],
      // );
      if (values[targetName] === undefined) {
      // if (!values[label]) {
        values[targetName] = [];
      }
      values[targetName].push(optionValue);
    }
  });

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


