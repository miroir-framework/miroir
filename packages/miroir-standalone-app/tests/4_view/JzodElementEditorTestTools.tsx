import { ThemeProvider } from "@emotion/react";
import { createTheme, StyledEngineProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Formik, FormikProps } from "formik";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { expect, ExpectStatic, vi } from "vitest";

import {
  adminConfigurationDeploymentMiroir,
  alterObjectAtPath,
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
  JzodUnion,
  menuDefaultLibrary,
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookInstance,
  reportBookList,
  reportCountryList,
  reportPublisherList,
  resolvePathOnObject,
} from "miroir-core";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { JzodEditorPropsRoot } from "../../src/miroir-fwk/4_view/components/JzodElementEditorInterface";
import { MiroirContextReactProvider, useMiroirContextService } from "../../src/miroir-fwk/4_view/MiroirContextReactProvider";
import { useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { emptyObject } from "../../src/miroir-fwk/4_view/routes/Tools";
import { libraryApplicationInstances } from "../../src/miroir-fwk/4_view/uploadBooksAndReports";
import { TestMode } from "./JzodElementEditor.test";
import { selfApplicationDeploymentLibrary } from "miroir-core";
import { MetaModel } from "miroir-core";
import { applicationDeploymentAdmin } from "miroir-core/src/ApplicationDeploymentAdmin";

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
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  // indentLevel?: number;
  initialFormState: any;
  rawJzodSchema: JzodElement | undefined;
  // formik: any;
  // resolvedElementJzodSchema: JzodElement | undefined;
  // unresolvedJzodSchema?: JzodElement | undefined;
  // paramMiroirFundamentalJzodSchema?: JzodSchema; //used only for testing, trouble with using MiroirContextReactProvider
  // unionInformation?:
  //   | {
  //       jzodSchema: JzodUnion;
  //       discriminator: string;
  //       discriminatorValues: string[];
  //       // subDiscriminator?: string,
  //       // subDiscriminatorValues?: string[],
  //       setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>;
  //     }
  //   | undefined;
  // foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  // currentDeploymentUuid?: Uuid;
  // currentApplicationSection?: ApplicationSection;
  // handleChange: (e: ChangeEvent<any>) => Promise<void>;
  // setFormState: React.Dispatch<
  //   React.SetStateAction<{
  //     [k: string]: any;
  //   }>
  // >;
  // parentObjectSetItemsOrder?: React.Dispatch<React.SetStateAction<any[]>>;
  // parentObjectItemsOrder?: any[];
}


export type JzodEditorTestCaseRenderer<LocalComponentProps> = {
  renderAsComponent?: React.FC<LocalComponentProps>;
  renderAsJzodElementEditor?: React.FC<JzodElementEditorProps_Test>;
};

export interface JzodEditorTestCase<PropType extends Record<string, any>> {
  props?:PropType | ((props:PropType) => PropType),
  componentProps?:PropType | ((props:PropType) => PropType),
  jzodElementEditorProps?:JzodElementEditorProps_Test | ((props:PropType) => JzodElementEditorProps_Test),
  renderComponent?: JzodEditorTestCaseRenderer<PropType>;
  tests:
    | ((expect: ExpectStatic) => Promise<void>)
    | { testAsComponent?: (expect: any) => Promise<void>; testAsJzodElementEditor?: (expect: any) => Promise<void> };
}

export type JzodEditorTest<PropType extends Record<string, any>> = Record<string, JzodEditorTestCase<PropType>>;

export interface JzodEditorTestSuite<T extends Record<string, any>> {
  suiteRenderComponent?: JzodEditorTestCaseRenderer<T>;
  suiteProps?: T;
  tests: JzodEditorTest<T>;
};
export type JzodEditorTestSuites<T extends Record<string, any>> = Record<string, JzodEditorTestSuite<T>>;


// ################################################################################################
// ################################################################################################
// LOCAL EDITOR
// ################################################################################################
// ################################################################################################
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
    //       props.rootLesslistKeyArray,
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
      // const newFormState: any = alterObjectAtPath(formState, props.rootLesslistKeyArray, values);
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
                  //   getFieldProps: (rootLesslistKey: string[]) => ({
                  //     name: "fieldName",
                  //     value: formState,
                  //     rootLesslistKey,
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
    rootLesslistKey,
    rootLesslistKeyArray,
    // indentLevel?: number;
    initialFormState,
    rawJzodSchema,
  }) => {
    // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();
    JzodElementEditorForTestRenderCount++;
    const context = useMiroirContextService();

    context.setDeploymentUuid
    // ###############################################################################################
    // useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any), [context]);
    // setting context.miroirFundamentalJzodSchema in-line during the test for immediate access, with gatekeeper test to avoid infinite refresh loop
    // if (!context.miroirFundamentalJzodSchema) {
    //   context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any);
    // }
    // ###############################################################################################


    const currentModel: MetaModel = useCurrentModel(selfApplicationDeploymentLibrary.uuid);
      // context.applicationSection == "data"
        // ? context.deploymentUuid
        // : adminConfigurationDeploymentMiroir.uuid
    // );

    const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
    console.log("currentMiroirModel", currentMiroirModel);

    const onSubmit = useCallback(
      async (
        actionCreateSchemaParamValues: any /* actually follows formJzodSchema */,
        formikFunctions: { setSubmitting: any; setErrors: any }
      ) => {
        try {
          //  Send values somehow
          // setformHelperState(actionCreateSchemaParamValues);

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

    const [formState, setFormState] = useState<any>({ [name]: initialFormState });
    const currentValue = resolvePathOnObject(formState, rootLesslistKeyArray);
    const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
      let result: ResolvedJzodSchemaReturnType | undefined = undefined;
      try {
        result =
          // miroirFundamentalJzodSchema && rawJzodSchema && formState && currentModel
          miroirFundamentalJzodSchema && rawJzodSchema && formState && currentMiroirModel
            ? jzodTypeCheck(
                rawJzodSchema,
                // formState,
                currentValue,
                [], // currentValuePath
                [], // currentTypePath
                miroirFundamentalJzodSchema as JzodSchema,
                currentModel,
                // currentMiroirModel,
                currentMiroirModel,
                {}
              )
            : undefined;
      } catch (e) {
        console.error(
          "getJzodElementEditorForTest useMemo error",
          // JSON.stringify(e, Object.getOwnPropertyNames(e)),
          e,
          // "props",
          // props,
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
    }, [rawJzodSchema, currentValue, context]);

    // console.log(
    //   "JzodElementEditor useMemo",
    //   "formState",
    //   JSON.stringify(formState, null, 2),
    //   "props.rawJzodSchema",
    //   JSON.stringify(props.rawJzodSchema, null, 2),
    //   "resolvedJzodSchema",
    //   JSON.stringify(resolvedJzodSchema, null, 2)
    // );
    // const resolvedJzodSchema: ResolvedJzodSchemaReturnType = {
    //   status: "ok",
    //   valuePath: [],
    //   typePath: [],
    //   element: rawSchema,
    // }

    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={formState}
          onSubmit={onSubmit}
          validateOnChange={false}
          validateOnBlur={false}
          handleChange={(e: ChangeEvent<any>) => {
            console.log(
              "onChange formik values ###########################################",
              e.target.value
            );
            const newFormState: any = alterObjectAtPath(
              formState,
              rootLesslistKeyArray,
              e.target.value
            );
            // console.log(
            //   "handleChange newFormState ###########################################",
            //   JSON.stringify(newFormState, null, 2)
            // );
            setFormState(newFormState);
            // setFormState(e.target.value);
          }}
        >
          {(formik: FormikProps<any>) => (
            <>
              <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                {resolvedJzodSchema != undefined && resolvedJzodSchema.status == "ok" ? (
                  <>
                    <JzodElementEditor
                      name={name}
                      listKey={listKey}
                      rootLesslistKey={rootLesslistKey}
                      rootLesslistKeyArray={rootLesslistKeyArray}
                      paramMiroirFundamentalJzodSchema={miroirFundamentalJzodSchema as JzodSchema}
                      label={label}
                      currentDeploymentUuid={context.deploymentUuid}
                      currentApplicationSection={"data"}
                      rawJzodSchema={rawJzodSchema}
                      resolvedElementJzodSchema={resolvedJzodSchema.element}
                      foreignKeyObjects={emptyObject}
                      handleChange={formik.handleChange as any}
                      formik={formik}
                      // setFormState={setFormState}
                      setFormState={formik.handleChange}
                      // formState={formState}
                    />
                    <button type="submit" name={pageLabel} form={"form." + pageLabel}>
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
          )}
        </Formik>
      </div>
    );
  };

  // ################################################################################################
export function getWrapperForLocalJzodElementEditor(): React.FC<any> {
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
  const handleAction = vi.fn();

  // ###############################################
  return (props: { children?: React.ReactNode }) => {
    const domainController: DomainControllerInterface = {
      handleAction,
      // add other methods if needed
    } as any;

    return (
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
    render(<ComponentToRender {...props} />);
    const tests =
      typeof testCase.tests === "function"
        ? testCase.tests
        : (renderAs == "jzodElementEditor"
            ? testCase.tests.testAsJzodElementEditor
            : testCase.tests.testAsComponent) ?? ((expect: ExpectStatic) => {});
    return tests(expect);
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
  ) => JzodEditorTestSuites<LocalEditorProps>
): JzodEditorTestSuites<LocalEditorProps> {
  const WrapperForJzodElementEditor: React.FC<any> = getWrapperForLocalJzodElementEditor();

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
// LITERAL
// ################################################################################################
export interface LocalEditorPropsRoot {
  label?: string;
  name: string;
  listKey: string;
  rootLesslistKey: string;
  rootLesslistKeyArray: string[];
  initialFormState: any;
}

export interface LocalLiteralEditorProps extends LocalEditorPropsRoot {
}

export type JzodLiteralEditorTest = JzodEditorTest<LocalLiteralEditorProps>;
export type JzodLiteralEditorTestSuites = JzodEditorTestSuites<LocalLiteralEditorProps>;

// ################################################################################################
export function getJzodLiteralEditorTests(
  LocalEditor: React.FC<LocalLiteralEditorProps>,
  jzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodLiteralEditorTestSuites {
  return {
    "JzodLiteralEditor": {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor: jzodElementEditor
      },
      suiteProps: {
        name: "fieldName",
        listKey: "root.fieldName",
        rootLesslistKey: "fieldName",
        rootLesslistKeyArray: ["fieldName"],
        initialFormState: "test-value",
        label: "Test Label",
      } as LocalLiteralEditorProps,
      tests: {
        "renders input with label when label prop is provided": {
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: {
            testAsComponent: async (expect) => {
              expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
              // expect(screen.getByRole("textbox")).toHaveAttribute("name", "fieldName"); // TODO: this is implementation detail, should be removed
            },
            testAsJzodElementEditor: async (expect) => {
              expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
            },
          },
        },
        "renders input without label when label prop is not provided": {
          props: {
            name: "fieldName",
            listKey: "root.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            initialFormState: "test-value",
            // label: "Test Label", // no label
          },
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: async (expect) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "setting new value": {
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
            tests: async (expect) => {
              expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
              const input = screen.getByDisplayValue("test-value");
              await act(() => {
                fireEvent.change(input, { target: { value: "new value" } });
              });
              expect(screen.getByDisplayValue(/new value/)).toBeInTheDocument();
            }
        },
      }
    }
  };
};


// ################################################################################################
// ENUM
// ################################################################################################
export interface LocalEnumEditorProps extends LocalEditorPropsRoot {
  rawJzodSchema: JzodEnum | undefined;
}

export type JzodEnumEditorTest = JzodEditorTest<LocalEnumEditorProps>;
export type JzodEnumEditorTestSuites = JzodEditorTestSuites<LocalEnumEditorProps>;

export function getJzodEnumEditorTests(
  LocalEditor: React.FC<LocalEnumEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEnumEditorTestSuites {
  const enumValues = ["value1", "value2", "value3"];
  return {
    JzodEnumEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      suiteProps: {
        label: "Test Label",
        name: "fieldName",
        listKey: "ROOT.fieldName",
        rootLesslistKey: "fieldName",
        rootLesslistKeyArray: ["fieldName"],
        rawJzodSchema: {
          type: "enum",
          definition: enumValues,
        },
        initialFormState: "value2",
      },
      tests: {
        "renders input with label when label prop is provided": {
          tests: async (expect: ExpectStatic) => {
            expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders input without label when label prop is not provided": {
          props: {
            // label: "Test Label", // no label
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "enum",
              definition: enumValues,
            },
            initialFormState: "value2",
          },
          tests: async (expect) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            // expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "renders select with correct value": {
          tests: async (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            expect(combobox).toContainHTML("value2");
            // expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders all enum options": {
          tests: async (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            await act(() => {
              fireEvent.mouseDown(combobox);
            });
            enumValues.forEach((val) => {
              expect(screen.getByRole("option", { name: val })).toBeInTheDocument();
            });
          },
        },
        "form state is changed when selection changes": {
          tests: async (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            await act(() => {
              fireEvent.mouseDown(combobox);
            });
            await act(() => {
              fireEvent.click(screen.getByRole("option", { name: "value3" }));
            });
            // expect(screen.getByLabelText(/Test LabelSSSSSSSSSSSSSSSSSSSSSSSS/)).toBeInTheDocument();
            expect(combobox).toContainHTML("value3");
          },
        },
      },
    },
  };
};

// ################################################################################################
// ARRAY
// ################################################################################################
export interface LocalArrayEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodArray | undefined;
}

export type JzodArrayEditorTest = JzodEditorTest<LocalArrayEditorProps>;
export type JzodArrayEditorTestSuites = JzodEditorTestSuites<LocalArrayEditorProps>;

export function getJzodArrayEditorTests(
  LocalEditor: React.FC<LocalArrayEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodArrayEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodArrayEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      suiteProps: {
        label: "Test Label",
        name: "fieldName",
        listKey: "ROOT.fieldName",
        rootLesslistKey: "fieldName",
        rootLesslistKeyArray: ["fieldName"],
        rawJzodSchema: {
          type: "array",
          definition: { type: "string" },
        },
        initialFormState: arrayValues,
      },
      tests: {
        "renders input with label when label prop is provided": {
          tests: async (expect: ExpectStatic) => {
            expect(screen.getByText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders all array values, in the right order": {
          tests: async (expect: ExpectStatic) => {
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("fieldName.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(values).toEqual(arrayValues);
          },
        },
        "form state is changed when selection changes": {
          tests: async (expect: ExpectStatic) => {
            const cell = screen.getAllByRole("textbox").filter((input: HTMLElement) =>
              (input as HTMLInputElement).name.startsWith("fieldName.")
            )[1] as HTMLInputElement;
            await act(() => {
              fireEvent.change(cell, { target: { value: "new value" } });
            });
            expect(cell).toContainHTML("new value");
          },
        },
        "changing order of array items when button ROOT.fieldName.2.up is clicked": {
          tests: async (expect) => {
            const upButtons = screen.getAllByRole("ROOT.fieldName.button.up");
            await act(() => {
              fireEvent.click(upButtons[2]); // Click the up button for the third item
            });
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("fieldName.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(values).toEqual(["value1", "value3", "value2"]);
          },
        },
      },
    },
  };
};

// ################################################################################################
// SIMPLE TYPES
// ################################################################################################
export type JzodSimpleTypes =
  | JzodPlainAttribute
  | JzodAttributePlainDateWithValidations
  | JzodAttributePlainNumberWithValidations
  | JzodAttributePlainStringWithValidations;
export interface LocalSimpleTypeEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodSimpleTypes | undefined;
}

export type JzodSimpleTypeEditorTest = JzodEditorTest<LocalSimpleTypeEditorProps>;
export type JzodSimpleTypeEditorTestSuites = JzodEditorTestSuites<LocalSimpleTypeEditorProps>;

export function getJzodSimpleTypeEditorTests(
  LocalEditor: React.FC<LocalSimpleTypeEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodSimpleTypeEditorTestSuites {
  // const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodSimpleTypeEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "string renders input with proper value": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "string",
              // definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: "placeholder text",
          },

          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
          },
        },
        "number renders input with proper value": { // TODO: test for nullable / optional scenario
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "number",
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
          },
        },
        "uuid renders input with proper value": { // TODO: test for nullable / optional scenario
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "uuid",
            },
            initialFormState: "123e4567-e89b-12d3-a456-426614174000",
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("123e4567-e89b-12d3-a456-426614174000");
          },
        },
        "uuid allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "uuid",
            },
            initialFormState: "123e4567-e89b-12d3-a456-426614174000",
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("123e4567-e89b-12d3-a456-426614174000");
            await act(() => {
              fireEvent.change(input, { target: { value: "new-uuid-value" } });
            });
            expect(input).toHaveValue("new-uuid-value");
          },
        }
      },
    },
  };
};
// ################################################################################################
// OBJECT
// ################################################################################################
export interface LocalObjectEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodObject | undefined;
}

export type JzodObjectEditorTest = JzodEditorTest<LocalObjectEditorProps>;
export type JzodObjectEditorTestSuites = JzodEditorTestSuites<LocalObjectEditorProps>;

export function getJzodObjectEditorTests(
  LocalEditor: React.FC<LocalObjectEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodObjectEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodObjectEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "object renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "object",
              definition: {a:{ type: "string" }, b:{ type: "number" }},
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic) => {
            const inputs = screen.getAllByRole("textbox");
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const name = (input as HTMLInputElement).name.replace(/^fieldName\./, "");
              values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            });
            expect(values).toEqual({ a: "test string", b: "42" });
          },
        },
        "object can be updated through displayed input fields": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "object",
              definition: {a:{ type: "string" }, b:{ type: "number" }},
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic) => {
            const inputs = screen.getAllByRole("textbox");
            const inputA = inputs.find(
              (input: HTMLElement) => (input as HTMLInputElement).name === "fieldName.a"
            ) as HTMLInputElement;
            const inputB = inputs.find(
              (input: HTMLElement) => (input as HTMLInputElement).name === "fieldName.b"
            ) as HTMLInputElement;
            expect(inputA).toHaveValue("test string");
            expect(inputB).toHaveValue(42);

            await act(() => {
              fireEvent.change(inputA, { target: { value: "new string value" } });
              fireEvent.change(inputB, { target: { value: 100 } });
            });

            expect(inputA).toHaveValue("new string value");
            expect(inputB).toHaveValue(100);
          },
        }
      },
    },
  };
};

// ################################################################################################
// UNION
// ################################################################################################
export interface LocalUnionEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodUnion | undefined;
}

export type JzodUnionEditorTest = JzodEditorTest<LocalUnionEditorProps>;
export type JzodUnionEditorTestSuites = JzodEditorTestSuites<LocalUnionEditorProps>;

export function getJzodUnionEditorTests(
  LocalEditor: React.FC<LocalUnionEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodUnionEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodUnionEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        // "union between simple types renders input with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "fieldName",
        //     listKey: "ROOT.fieldName",
        //     rootLesslistKey: "fieldName",
        //     rootLesslistKeyArray: ["fieldName"],
        //     rawJzodSchema: {
        //       type: "union",
        //       definition: [{ type: "string" }, { type: "number" }],
        //     },
        //     initialFormState: 42,
        //   },

        //   tests: async (expect: ExpectStatic) => {
        //     const input = screen.getByRole("textbox");
        //     expect(input).toBeInTheDocument();
        //     expect(input).toHaveValue(42);
        //   },
        // },
        // "union between simple type and object for value of simple type renders input with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "fieldName",
        //     listKey: "ROOT.fieldName",
        //     rootLesslistKey: "fieldName",
        //     rootLesslistKeyArray: ["fieldName"],
        //     rawJzodSchema: {
        //       type: "union",
        //       definition: [
        //         { type: "string" },
        //         { type: "number" },
        //         { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
        //       ],
        //     },
        //     initialFormState: 42,
        //   },

        //   tests: async (expect: ExpectStatic) => {
        //     const input = screen.getByRole("textbox");
        //     expect(input).toBeInTheDocument();
        //     expect(input).toHaveValue(42);
        //   },
        // },
        // "union between simple type and object for value object renders input with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "fieldName",
        //     listKey: "ROOT.fieldName",
        //     rootLesslistKey: "fieldName",
        //     rootLesslistKeyArray: ["fieldName"],
        //     rawJzodSchema: {
        //       type: "union",
        //       definition: [
        //         { type: "string" },
        //         { type: "number" },
        //         { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
        //       ],
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },

        //   tests: async (expect: ExpectStatic) => {
        //     const inputs = screen.getAllByRole("textbox");
        //     const values: Record<string, any> = {};
        //     inputs.forEach((input: HTMLElement) => {
        //       const name = (input as HTMLInputElement).name.replace(/^fieldName\./, "");
        //       values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
        //     });
        //     expect(values).toEqual({ a: "test string", b: "42" });
        //   },
        // },
        "union between 2 object types with a discriminator for value object renders input following the proper value type": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: {
              type: "union",
              discriminator: "testObjectType",
              definition: [
                { type: "object", definition: { testObjectType: { type: "literal", definition: "type1" }, a: { type: "string" } } },
                { type: "object", definition: { testObjectType: { type: "literal", definition: "type2" }, b: { type: "number" } } },
              ],
            },
            initialFormState: {
              testObjectType: "type1",
              a: "test string",
            },
          },
          tests: async (expect: ExpectStatic) => {
            // expect(screen.getByText(/Test Label/)).toBeInTheDocument();
            const inputs = screen.getAllByRole("textbox");
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const name = (input as HTMLInputElement).name.replace(/^fieldName\./, "");
              values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            });
            expect(values).toEqual({ testObjectType: "type1", a: "test string" });
          },
        }
        // "renders all array values, in the right order": {
        //   tests: async (expect: ExpectStatic) => {
        //     const cells = screen
        //       .getAllByRole("textbox")
        //       .filter((input: HTMLElement) =>
        //         (input as HTMLInputElement).name.startsWith("fieldName.")
        //       );
        //     const values = cells.map((cell) => (cell as HTMLInputElement).value);
        //     expect(values).toEqual(arrayValues);
        //   },
        // },
        // "form state is changed when selection changes": {
        //   tests: async (expect: ExpectStatic) => {
        //     const cell = screen
        //       .getAllByRole("textbox")
        //       .filter((input: HTMLElement) =>
        //         (input as HTMLInputElement).name.startsWith("fieldName.")
        //       )[1] as HTMLInputElement;
        //     await act(() => {
        //       fireEvent.change(cell, { target: { value: "new value" } });
        //     });
        //     expect(cell).toContainHTML("new value");
        //   },
        // },
        // "changing order of array items when button ROOT.fieldName.2.up is clicked": {
        //   tests: async (expect) => {
        //     const upButtons = screen.getAllByRole("ROOT.fieldName.button.up");
        //     await act(() => {
        //       fireEvent.click(upButtons[2]); // Click the up button for the third item
        //     });
        //     const cells = screen
        //       .getAllByRole("textbox")
        //       .filter((input: HTMLElement) =>
        //         (input as HTMLInputElement).name.startsWith("fieldName.")
        //       );
        //     const values = cells.map((cell) => (cell as HTMLInputElement).value);
        //     expect(values).toEqual(["value1", "value3", "value2"]);
        //   },
        // },
      },
    },
  };
};

// ################################################################################################
// BOOK
// ################################################################################################
export interface LocalBookEditorProps extends LocalEditorPropsRoot{
  // rawJzodSchema: EntityDefinition | undefined;
  rawJzodSchema: JzodObject | undefined;
}

export type JzodBookEditorTest = JzodEditorTest<LocalBookEditorProps>;
export type JzodBookEditorTestSuites = JzodEditorTestSuites<LocalBookEditorProps>;

export function getJzodBookEditorTests(
  LocalEditor: React.FC<LocalBookEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodBookEditorTestSuites {
  return {
    JzodBookEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: entityDefinitionBook.jzodSchema,
            // rawJzodSchema: {
            //   type: "object",
            //   definition: {a:{ type: "string" }, b:{ type: "number" }},
            // },
            initialFormState: book1
            // initialFormState: {
            //   a: "test string",
            //   b: 42,
            // },
          },
          tests: async (expect: ExpectStatic) => {
            // Pretty-print the entire rendered DOM
            // console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            
            const inputs = Array.from(document.querySelectorAll('input'));
            console.log("=== INPUTS ===", inputs.map((input: HTMLElement) => ({
              name: (input as HTMLInputElement).name,
              value: (input as HTMLInputElement).value,
            })));
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const index = (input as HTMLInputElement).name.replace(/^fieldName\./, "");
              values[index] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            });
            expect(values).toEqual(book1);
          },
        },
        // "object can be updated through displayed input fields": {
        //   props: {
        //     label: "Test Label",
        //     name: "fieldName",
        //     listKey: "ROOT.fieldName",
        //     rootLesslistKey: "fieldName",
        //     rootLesslistKeyArray: ["fieldName"],
        //     rawJzodSchema: {
        //       type: "object",
        //       definition: {a:{ type: "string" }, b:{ type: "number" }},
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },
        //   tests: async (expect: ExpectStatic) => {
        //     const inputs = screen.getAllByRole("textbox");
        //     const inputA = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "fieldName.a"
        //     ) as HTMLInputElement;
        //     const inputB = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "fieldName.b"
        //     ) as HTMLInputElement;
        //     expect(inputA).toHaveValue("test string");
        //     expect(inputB).toHaveValue(42);

        //     await act(() => {
        //       fireEvent.change(inputA, { target: { value: "new string value" } });
        //       fireEvent.change(inputB, { target: { value: 100 } });
        //     });

        //     expect(inputA).toHaveValue("new string value");
        //     expect(inputB).toHaveValue(100);
        //   },
        // }
      },
    },
  };
};
// ################################################################################################
// ENTITY DEFINITION
// ################################################################################################
export interface LocalEntityDefinitionEditorProps extends LocalEditorPropsRoot{
  // rawJzodSchema: EntityDefinition | undefined;
  rawJzodSchema: JzodObject | undefined;
}

export type JzodEntityDefinitionEditorTest = JzodEditorTest<LocalEntityDefinitionEditorProps>;
export type JzodEntityDefinitionEditorTestSuites = JzodEditorTestSuites<LocalEntityDefinitionEditorProps>;

export function getJzodEntityDefinitionEditorTests(
  LocalEditor: React.FC<LocalEntityDefinitionEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEntityDefinitionEditorTestSuites {
  return {
    JzodEntityDefinitionEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "entity definition for Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "fieldName",
            listKey: "ROOT.fieldName",
            rootLesslistKey: "fieldName",
            rootLesslistKeyArray: ["fieldName"],
            rawJzodSchema: (entityDefinitionEntityDefinition as EntityDefinition).jzodSchema,
            // rawJzodSchema: {
            //   type: "object",
            //   definition: {a:{ type: "string" }, b:{ type: "number" }},
            // },
            initialFormState: entityDefinitionBook
            // initialFormState: {
            //   a: "test string",
            //   b: 42,
            // },
          },
          tests: async (expect: ExpectStatic) => {
            const inputs = screen.getAllByRole("textbox");
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const name = (input as HTMLInputElement).name.replace(/^fieldName\./, "");
              values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            });
            // expect(values).toEqual({ a: "test string", b: "42" });
            expect(values).toEqual(entityDefinitionBook);
          },
        },
        // "object can be updated through displayed input fields": {
        //   props: {
        //     label: "Test Label",
        //     name: "fieldName",
        //     listKey: "ROOT.fieldName",
        //     rootLesslistKey: "fieldName",
        //     rootLesslistKeyArray: ["fieldName"],
        //     rawJzodSchema: {
        //       type: "object",
        //       definition: {a:{ type: "string" }, b:{ type: "number" }},
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },
        //   tests: async (expect: ExpectStatic) => {
        //     const inputs = screen.getAllByRole("textbox");
        //     const inputA = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "fieldName.a"
        //     ) as HTMLInputElement;
        //     const inputB = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "fieldName.b"
        //     ) as HTMLInputElement;
        //     expect(inputA).toHaveValue("test string");
        //     expect(inputB).toHaveValue(42);

        //     await act(() => {
        //       fireEvent.change(inputA, { target: { value: "new string value" } });
        //       fireEvent.change(inputB, { target: { value: 100 } });
        //     });

        //     expect(inputA).toHaveValue("new string value");
        //     expect(inputB).toHaveValue(100);
        //   },
        // }
      },
    },
  };
};

