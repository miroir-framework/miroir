import { ThemeProvider } from "@emotion/react";
import { createTheme, StyledEngineProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import { Formik, FormikProps } from "formik";
import { Profiler, useCallback, useMemo } from "react";
import { MemoryRouter } from "react-router-dom";

import {
  Action2Error,
  Action2ReturnType,
  ConfigurationService,
  DomainController,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  MlElement,
  jzodTypeCheck,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  ResolvedJzodSchemaReturnType,
  type ApplicationDeploymentMap,
  type EntityInstance,
} from "miroir-core";
import {
  LocalCache,
  LocalCacheProvider,
  MiroirContextReactProvider,
  PersistenceReduxSaga,
  useMiroirContextService,
} from "miroir-react";
import {
  deployment_Library_DO_NO_USE,
  entityAuthor,
  entityBook,
  entityCountry,
  entityPublisher,
  libraryApplicationInstances,
  menuDefaultLibrary,
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookList,
  reportCountryList,
  reportMultistepCountryCreate,
  reportMultistepLaunchPad,
  reportPublisherList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  defaultMiroirMetaModel,
  entityEntity,
  entityEntityVersion,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import { packageName } from "../../../constants.js";
import { ReportPageContextProvider } from "../../4_view/components/Reports/ReportPageContext.js";
import { DocumentOutlineContextProvider } from "../../4_view/components/ValueObjectEditor/InstanceEditorOutlineContext.js";
import { JzodElementEditor } from "../../4_view/components/ValueObjectEditor/JzodElementEditor.js";
import { cleanLevel } from "../../4_view/constants.js";
import { useCurrentModel, useCurrentModelEnvironment } from "../../4_view/ReduxHooks.js";
import { emptyObject } from "../../4_view/tools/emptyObject.js";

// ################################################################################################
// Browser-safe component test tools (#286). No vitest, no @testing-library/react, no process.env,
// no registerTestImplementation: this module can be loaded by the running app.
// The vitest-only helpers stay in tests/4_view/JzodElementEditorTestTools.tsx, which re-exports this module.
// ################################################################################################
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "componentTestTools");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export const testSectionName = "TESTSECTION";
export const formikFieldName = (rootLessListKey: string) => `${testSectionName}.${rootLessListKey}`;
// ################################################################################################
// ################################################################################################
// ################################################################################################
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

// ################################################################################################
export interface JzodElementEditorProps_Test {
  // forceTestingMode?: boolean;
  name: string;
  label?: string;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: string[];
  initialFormState: any;
  rawJzodSchema: MlElement | undefined;
  // isPerformanceTest?: boolean;
}

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

// ################################################################################################
/**
 * The part of vitest's `expect` that `extractValuesFromRenderedElements` uses, so that callers can
 * pass vitest's `expect` or any other `expect` with the same call shape.
 */
export type ExtractValuesExpect = (actual: any, message?: string) => { toBeTruthy: () => unknown };

// ################################################################################################
// ################################################################################################
// ################################################################################################
// JZOD ELEMENT EDITOR
// ################################################################################################
let JzodElementEditorForTestRenderCount: number = 0;

export const getJzodElementEditorForTest: (pageLabel: string) => React.FC<JzodElementEditorProps_Test> =
  (pageLabel: string) =>
  (
    props: JzodElementEditorProps_Test
) => {
  const {
    name,
    label,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    // indentLevel?: number;
    initialFormState,
    rawJzodSchema,
  } = props;
    // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();
    log.debug("getJzodElementEditorForTest", "rawJzodSchema", rawJzodSchema);
    JzodElementEditorForTestRenderCount++;
    const context = useMiroirContextService();
    context.setDeploymentUuid

    const currentModel: MetaModel = useCurrentModel(
      deployment_Library_DO_NO_USE.uuid,
      applicationDeploymentMap
    );

    // const currentMiroirModel = useCurrentModel(selfApplicationMiroir.uuid, defaultSelfApplicationDeploymentMap);
    const currentMiroirModelEnvironment = useCurrentModelEnvironment(
      selfApplicationMiroir.uuid,
      defaultSelfApplicationDeploymentMap
    );
    // log.debug("currentMiroirModel", currentMiroirModel);

    const effectiveRawJzodSchema: MlElement | undefined = useMemo(() => {
      // log.debug("getJzodElementEditorForTest", "rawJzodSchema", rawJzodSchema);
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
          log.debug(
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
          log.error("onSubmit error", e);
        }
      },
      // [setformHelperState]
      []
    );

    const formikInitialValues = useMemo(() => {
      return { [testSectionName]: { [name]: initialFormState }};
    }, [name, initialFormState]);
    log.debug(
      "getJzodElementEditorForTest",
      "formikInitialValues",
      JSON.stringify(formikInitialValues, null, 2)
    );
    const labelElement = useMemo(() => {
      // return label ? <label htmlFor={rootLessListKey}>{label}</label> : undefined;
      return label ? <span id={rootLessListKey}>{label}</span> : undefined;
    }, [label]);
    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={{ [testSectionName]: { [name]: initialFormState }}}
          onSubmit={onSubmit}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {(formik: FormikProps<any>) => {
            log.debug(
              "getJzodElementEditorForTest render formik, values",
              JSON.stringify(formik.values),
              "effectiveRawJzodSchema",
              JSON.stringify(effectiveRawJzodSchema, null, 2)
            );

            let typeError: JSX.Element | undefined = undefined;
            const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
              let result: ResolvedJzodSchemaReturnType | undefined = undefined;
              try {
                result =
                  currentMiroirModelEnvironment.miroirFundamentalJzodSchema &&
                  effectiveRawJzodSchema &&
                  formik.values &&
                  currentModel
                    ? jzodTypeCheck(
                        effectiveRawJzodSchema,
                        formik.values[testSectionName],
                        [], // currentValuePath
                        [], // currentTypePath
                        currentMiroirModelEnvironment,
                        {}
                      )
                    : undefined;
              } catch (e) {
                log.error(
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
                      // log.debug(
                      //   "ReportSectionEntityInstance jzodTypeCheck done for render", ReportSectionEntityInstanceCount ,"resolvedJzodSchema",
                      //   resolvedJzodSchema,
                      // );
          if (!resolvedJzodSchema || resolvedJzodSchema.status != "ok") {
            log.error(
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
                        valueObjectEditMode="update"
                        currentDeploymentUuid={context.deploymentUuid}
                        currentApplication={context.application}
                        applicationDeploymentMap={applicationDeploymentMap}
                        listKey={"ROOT"}
                        rootLessListKey={""}
                        rootLessListKeyArray={[]}
                        reportSectionPathAsString="TESTSECTION"
                        labelElement={labelElement}
                        currentApplicationSection={"data"}
                        typeCheckKeyMap={resolvedJzodSchema.keyMap}
                        foreignKeyObjects={emptyObject}
                        insideAny={false}
                        anyRootLessListKey=""
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
/**
 * Stand-in for `vi.fn()`: records the arguments of each call and returns `undefined`.
 */
export interface RecordingFunction {
  (...args: any[]): undefined;
  calls: any[][];
}

export function createRecordingFunction(): RecordingFunction {
  const calls: any[][] = [];
  const recordingFunction = ((...args: any[]) => {
    calls.push(args);
    return undefined;
  }) as RecordingFunction;
  recordingFunction.calls = calls;
  return recordingFunction;
}

// ################################################################################################
export interface BuildComponentTestWrapperOptions {
  isPerformanceTest?: boolean;
  applicationDeploymentMap: ApplicationDeploymentMap;
  /** Opt-in: real handleCompositeActionTemplate writes the wrapper localCache (issue #274). */
  wireLocalCacheCompositeAction?: boolean;
}

export interface ComponentTestWrapper {
  Wrapper: React.FC<any>;
  localCache: LocalCacheInterface;
  miroirEventService: MiroirEventService;
  applicationDeploymentMap: ApplicationDeploymentMap;
}

// ################################################################################################
/**
 * Builds the providers of a component test over its own `LocalCache`, loaded with the Miroir
 * meta-model and the Library fixtures. Does not register any test implementation.
 */
export function buildComponentTestWrapper(
  options: BuildComponentTestWrapperOptions,
): ComponentTestWrapper {
  const isPerformanceTest: boolean = options.isPerformanceTest ?? false;
  const applicationDeploymentMap: ApplicationDeploymentMap = options.wireLocalCacheCompositeAction
    ? {
        ...options.applicationDeploymentMap,
        [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
      }
    : options.applicationDeploymentMap;
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const miroirContext: MiroirContext = new MiroirContext(
    miroirActivityTracker,
    miroirEventService,
    undefined as any,
  );
  miroirContext.extendMiroirConfigWithExtraDeploymentConfiguration = () =>
    ({
      miroirConfigType: "client",
      client: {
        emulateServer: true,
        rootApiUrl: "http://localhost:3080",
      },
    }) as ReturnType<MiroirContext["extendMiroirConfigWithExtraDeploymentConfiguration"]>;
  const theme = createTheme(testThemeParams);
  const handleAction = createRecordingFunction();

  const persistenceSaga:PersistenceReduxSaga  = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister
    ),
    remotePersistenceStoreRestClient: undefined as any,
  });

  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);

  log.debug("buildComponentTestWrapper", "defaultMiroirMetaModel.entities", JSON.stringify(defaultMiroirMetaModel.entities));
  const resultForLoadingMiroirMetaModel: Action2ReturnType = localCache.handleLocalCacheAction({
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: selfApplicationMiroir.uuid,
      objects: [
        {
          parentName: entityEntity.name,
          parentUuid: entityEntity.uuid,
          applicationSection: "model",
          instances: defaultMiroirMetaModel.entities
        },
        {
          parentName: entityEntityVersion.name,
          parentUuid: entityEntityVersion.uuid,
          applicationSection: "model",
          instances: defaultMiroirMetaModel.entityVersions
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
      ],
    }
  }, applicationDeploymentMap);
  if (resultForLoadingMiroirMetaModel.status !== "ok") {
    throw new Error(
      `Error loading Miroir Meta Model: ${JSON.stringify(resultForLoadingMiroirMetaModel, null, 2)}`
    );
  }

  localCache.handleLocalCacheAction(
    // needed so that "loading" instances become "current"
    {
      actionType: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationMiroir.uuid,
      },
    },
    applicationDeploymentMap,
  );
  const resultForLoadingLibraryApplicationModel: Action2ReturnType = localCache.handleLocalCacheAction({
    actionType: "loadNewInstancesInLocalCache",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: selfApplicationLibrary.uuid,
      objects: [
        {
          parentName: entityEntity.name,
          parentUuid: entityEntity.uuid,
          applicationSection: "model",
          instances: [
            entityAuthor as EntityInstance,
            entityBook as EntityInstance,
            entityCountry as EntityInstance,
            entityPublisher as EntityInstance
          ]
        },
        {
          parentName: entityMenu.name,
          parentUuid: entityMenu.uuid,
          applicationSection: "model",
          instances: [menuDefaultLibrary]
        },
        {
          parentName: entityReport.name,
          parentUuid: entityReport.uuid,
          applicationSection: "model",
          instances: [
              reportAuthorList as EntityInstance,
              reportAuthorDetails as EntityInstance,
              reportBookList as EntityInstance,
              reportBookDetails as EntityInstance,
              reportCountryList as EntityInstance,
              reportPublisherList as EntityInstance,
              reportMultistepCountryCreate as EntityInstance,
              reportMultistepLaunchPad as EntityInstance,
          ],
        },
        ...libraryApplicationInstances
      ],
    }
  }, applicationDeploymentMap);
  if (resultForLoadingLibraryApplicationModel.status !== "ok") {
    throw new Error(
      `Error loading Library Application Model: ${JSON.stringify(resultForLoadingLibraryApplicationModel, null, 2)}`
    );
  }
  localCache.handleLocalCacheAction(
    // needed so that "loading" instances become "current"
    {
      actionType: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationLibrary.uuid,
      },
    }, applicationDeploymentMap
  );

  // Library model load already includes `libraryApplicationInstances`. A second
  // data-only load + rollback would drop Library *model* (reports/entities) from
  // `current` when a real Library deployment uuid is in the map (rollback replaces
  // that deployment's current with whatever is in `loading`).
  let resultForLoadingLibraryApplicationInstances: Action2ReturnType = {
    status: "ok",
  } as Action2ReturnType;
  if (!options.wireLocalCacheCompositeAction) {
    resultForLoadingLibraryApplicationInstances = localCache.handleLocalCacheAction({
      actionType: "loadNewInstancesInLocalCache",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationLibrary.uuid,
        objects: libraryApplicationInstances,
      }
    }, applicationDeploymentMap);

    if (resultForLoadingLibraryApplicationInstances.status !== "ok") {
      throw new Error(
        `Error loading Library Application Instances: ${JSON.stringify(resultForLoadingLibraryApplicationInstances, null, 2)}`
      );
    }
    localCache.handleLocalCacheAction(
      // needed so that "loading" instances become "current"
      {
        actionType: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: selfApplicationLibrary.uuid,
        },
      }, applicationDeploymentMap
    );
  }

  log.debug(
    "buildComponentTestWrapper FINISHED PREPARING LOCAL CACHE",
    "resultForLoadingMiroirMetaModel",
    resultForLoadingMiroirMetaModel,
    "resultForLoadingLibraryApplicationModel",
    resultForLoadingLibraryApplicationModel,
    "resultForLoadingLibraryApplicationInstances",
    resultForLoadingLibraryApplicationInstances,
    "localCache.getInnerStore().getState()",
    localCache.getInnerStore().getState()
  );

  const handleToggleOutline = () => {};
  const handleNavigateToPath = (path: string[]) => {};

  if (options.wireLocalCacheCompositeAction) {
    persistenceSaga.run(localCache as any);
  }

  const wiredDomainController: DomainControllerInterface | undefined =
    options.wireLocalCacheCompositeAction
      ? (() => {
          const realDc = new DomainController(
            "local",
            miroirContext,
            localCache,
            persistenceSaga,
          );
          (realDc as any).callUtil.callPersistenceAction = async (callContext: any) =>
            callContext ?? {};
          const originalHandleAction = realDc.handleAction.bind(realDc);
          realDc.handleAction = (async (
            domainAction: any,
            map: ApplicationDeploymentMap,
            currentModelEnvironment?: any,
            endpointApplicationMap?: any,
            actionParamValues?: any,
            principal?: any,
          ) => {
            if (domainAction?.actionType === "createInstance") {
              const objects = domainAction.payload?.objects ?? [];
              const domainState = localCache.getDomainState();
              const deploymentUuid = map[domainAction.payload?.application];
              const section = domainAction.payload?.applicationSection;
              const parentUuid = domainAction.payload?.parentUuid;
              for (const instance of objects) {
                const entityUuid = instance?.parentUuid ?? parentUuid;
                const existing =
                  domainState?.[deploymentUuid]?.[section]?.[entityUuid]?.[instance?.uuid];
                if (existing) {
                  return new Action2Error(
                    "FailedToHandleAction",
                    "createInstance colliding uuid already present",
                    [instance.uuid],
                  );
                }
              }
            }
            return originalHandleAction(
              domainAction,
              map,
              currentModelEnvironment,
              endpointApplicationMap,
              actionParamValues,
              principal,
            );
          }) as typeof realDc.handleAction;
          return realDc;
        })()
      : undefined;

  // ###############################################
  const Wrapper: React.FC<any> = (props: { children?: React.ReactNode }) => {
    const domainController: DomainControllerInterface = wiredDomainController ?? ({
      handleAction,
      // add other methods if needed
    } as any);

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
      log.info(
      `Render #${renderCount.current} - ${id} [${phase}] took ${actualDuration.toFixed(2)}ms`,
      `(Total: ${totalRenderTime.current.toFixed(2)}ms)`
      );
    }, []);

    return isPerformanceTest ? (
      <Profiler id="App" onRender={onRender}>
        <ThemeProvider theme={theme}>
          <StyledEngineProvider injectFirst>
            <LocalCacheProvider store={localCache.getInnerStore()}>
              <MiroirContextReactProvider
                miroirContext={miroirContext}
                domainController={domainController}
                testingApplication={
                  options.wireLocalCacheCompositeAction
                    ? selfApplicationLibrary.uuid
                    : undefined
                }
                testingDeploymentUuid={deployment_Library_DO_NO_USE.uuid}
              >
                <DocumentOutlineContextProvider
                  isOutlineOpen={true}
                  onToggleOutline={handleToggleOutline}
                  onNavigateToPath={handleNavigateToPath}
                >
                  <ReportPageContextProvider>
                    {options.wireLocalCacheCompositeAction ? (
                      <MemoryRouter>{props.children}</MemoryRouter>
                    ) : (
                      props.children
                    )}
                  </ReportPageContextProvider>
                </DocumentOutlineContextProvider>
              </MiroirContextReactProvider>
            </LocalCacheProvider>
          </StyledEngineProvider>
        </ThemeProvider>
      </Profiler>
    ) : (
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <LocalCacheProvider store={localCache.getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainController}
              testingApplication={
                options.wireLocalCacheCompositeAction
                  ? selfApplicationLibrary.uuid
                  : undefined
              }
              testingDeploymentUuid={deployment_Library_DO_NO_USE.uuid}
            >
              <DocumentOutlineContextProvider
                isOutlineOpen={true}
                onToggleOutline={handleToggleOutline}
                onNavigateToPath={handleNavigateToPath}
              >
                <ReportPageContextProvider>
                  {options.wireLocalCacheCompositeAction ? (
                    <MemoryRouter>{props.children}</MemoryRouter>
                  ) : (
                    props.children
                  )}
                </ReportPageContextProvider>
              </DocumentOutlineContextProvider>
            </MiroirContextReactProvider>
          </LocalCacheProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    );
  };
  return { Wrapper, localCache, miroirEventService, applicationDeploymentMap };
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * Reads the values of the form fields rendered under `root`, and of the option lists rendered in
 * `portalElement` (the target of the components' portals), keyed by field name without the
 * `label` prefix (#286: it searches only these two elements, not the whole document, so that in
 * the app it does not read the app's own fields).
 */
export function extractValuesFromRenderedElements(
  expect: ExtractValuesExpect,
  filter: ("select" | "input" | "option" |"cell" | "checkbox" | "combobox")[] | undefined = undefined,
  root: ParentNode,
  label: string = "",
  step?: string,
  detectOptions: boolean = false,
  portalElement?: ParentNode,
): Record<string, any> {
  const values: Record<string, any> = {};

  // The elements searched: root and the portal element, a root inside another one being dropped
  // so that no element is found twice.
  const searchRoots: ParentNode[] = [root, portalElement].filter(
    (candidate): candidate is ParentNode => !!candidate,
  );
  const distinctSearchRoots = searchRoots.filter(
    (candidate, index) =>
      !searchRoots.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          (other as Node).contains?.(candidate as Node) &&
          (otherIndex < index || !(candidate as Node).contains?.(other as Node)),
      ),
  );
  const queryAll = (selector: string): Element[] =>
    distinctSearchRoots.flatMap((searchRoot) => Array.from(searchRoot.querySelectorAll(selector)));
  const query = (selector: string): Element | null => queryAll(selector)[0] ?? null;

  // #292 (analysis §5.5): while the option list of a `ThemedSelectWithPortal` is open, its combobox
  // input shows the filter text, not the selected value. The committed value is then read from the
  // select's state tracker. A closed combobox is read from its input, as before.
  const comboboxCommittedValue = (input: HTMLInputElement): string | undefined => {
    if (input.getAttribute("role") !== "combobox" || !input.name) {
      return undefined;
    }
    // The name is compared as an attribute value, not put in the selector: a field name may contain
    // characters (`"`, `\`) that some DOM selector parsers reject even when escaped.
    const stateTrackerTestId = `themed-select-state-${input.name}`;
    const stateTracker = queryAll('[data-testid^="themed-select-state-"]').find(
      (element) => element.getAttribute("data-testid") === stateTrackerTestId,
    );
    if (stateTracker?.getAttribute("data-test-is-open") !== "true") {
      return undefined;
    }
    return stateTracker.getAttribute("data-test-selected-value") ?? "";
  };
  /** The value of a form input: the committed value of an open combobox, else its value or default value. */
  const inputValue = (input: HTMLInputElement): string => {
    const committedValue = comboboxCommittedValue(input);
    if (committedValue !== undefined) {
      return committedValue;
    }
    return input.value === "" && input.defaultValue !== undefined ? input.defaultValue : input.value;
  };

  // Pre-compile regex patterns to avoid recreating them
  const labelRegex = label ? new RegExp(`^${label}\\.`) : null;
  const removeLabelPrefix = (str: string) => (labelRegex ? str.replace(labelRegex, "") : str);

  // Helper function to check for combobox options
  const checkForComboboxOptions = (
    combobox: Element,
    fieldName: string,
    values: Record<string, any>
  ) => {
    log.debug(
      `checkForComboboxOptions: checking for options for field ${fieldName}, detectOptions: ${detectOptions}`
    );

    // Only check for options if explicitly requested
    if (!detectOptions) {
      log.debug(`checkForComboboxOptions: option detection disabled for this call`);
      return;
    }

    log.debug(
      `checkForComboboxOptions: combobox element:`,
      combobox?.outerHTML?.substring(0, 200)
    );
    log.debug(`checkForComboboxOptions: aria-expanded:`, combobox.getAttribute("aria-expanded"));

    // Look for dropdown options in various possible locations, including the search roots for
    // portaled content
    const searchAreas = [
      combobox.parentElement,
      combobox.closest('[role="combobox"]')?.parentElement,
      combobox.parentElement?.parentElement, // One level higher
      query('[role="listbox"]'), // Global dropdown
      ...distinctSearchRoots, // root and portal element, for portaled content
    ].filter(Boolean) as ParentNode[];

    log.debug(`checkForComboboxOptions: searching ${searchAreas.length} areas`);

    // Special logging of the search roots when aria-expanded is true
    const isDropdownOpen = combobox.getAttribute("aria-expanded") === "true";
    if (isDropdownOpen) {
      log.debug(
        `checkForComboboxOptions: DROPDOWN IS OPEN - search roots HTML:`,
        distinctSearchRoots.map((searchRoot) => (searchRoot as Element).outerHTML)
      );
    }

    for (const [index, area] of searchAreas.entries()) {
      if (!area) continue;

      const areaDescription = `area ${index + 1}`;
      log.debug(
        `checkForComboboxOptions: checking ${areaDescription}:`,
        (area as Element)?.outerHTML?.substring(0, 300)
      );

      // Look for listbox and options
      const listbox = area.querySelector('[role="listbox"]');
      log.debug(
        `checkForComboboxOptions: listbox found in ${areaDescription}:`,
        listbox ? listbox.outerHTML?.substring(0, 200) : "none"
      );

      // Also look for CSS-based dropdown content that might not have proper ARIA roles
      const dropdownCandidates = area.querySelectorAll(
        '[class*="option"], [class*="dropdown"], [class*="menu"], [class*="list"], div[tabindex], [data-dropdown-option]'
      );
      log.debug(
        `checkForComboboxOptions: dropdown candidate elements in ${areaDescription}: ${dropdownCandidates.length}`
      );

      if (listbox) {
        const optionElements = listbox.querySelectorAll('[role="option"]');
        log.debug(`checkForComboboxOptions: found ${optionElements.length} option elements`);

        const options = Array.from(optionElements)
          .map((option) => {
            const text = (option as HTMLElement).textContent?.trim();
            log.debug(`checkForComboboxOptions: option element text:`, text);
            return text;
          })
          .filter((text) => text);

        if (options.length > 0) {
          log.debug(
            `extractValuesFromRenderedElements: found options for ${fieldName}:`,
            options
          );
          values[`${fieldName}.options`] = options;
          return;
        }
      }

      // Check for data-dropdown-option elements (custom dropdown implementation)
      const dataDropdownOptions = area.querySelectorAll('[data-dropdown-option="true"]');
      log.debug(
        `checkForComboboxOptions: data-dropdown-option elements in ${areaDescription}: ${dataDropdownOptions.length}`
      );

      if (dataDropdownOptions.length > 0) {
        const options = Array.from(dataDropdownOptions)
          .map((option) => {
            const text = (option as HTMLElement).textContent?.trim();
            log.debug(`checkForComboboxOptions: data-dropdown-option text:`, text);
            return text;
          })
          .filter((text) => text);

        if (options.length > 0) {
          log.debug(
            `extractValuesFromRenderedElements: found data-dropdown-option options for ${fieldName}:`,
            options
          );
          values[`${fieldName}.options`] = options;
          return;
        }
      }

      // Also check for any visible option elements in the area
      const allOptions = area.querySelectorAll('[role="option"], [data-dropdown-option="true"]');
      log.debug(`checkForComboboxOptions: total option elements in area: ${allOptions.length}`);

      const visibleOptions = Array.from(allOptions)
        .filter((option) => {
          const style = window.getComputedStyle(option);
          const isVisible = style.display !== "none" && style.visibility !== "hidden";
          log.debug(`checkForComboboxOptions: option visibility check:`, {
            text: option.textContent?.trim(),
            display: style.display,
            visibility: style.visibility,
            isVisible,
          });
          return isVisible;
        })
        .map((option) => (option as HTMLElement).textContent?.trim())
        .filter((text) => text);

      if (visibleOptions.length > 0) {
        log.debug(
          `extractValuesFromRenderedElements: found visible options for ${fieldName}:`,
          visibleOptions
        );
        values[`${fieldName}.options`] = visibleOptions;
        return;
      }
    }

    log.debug(`checkForComboboxOptions: no options found for ${fieldName}`);
  };

  // root and the portal element: comboboxes options are portaled out of root

  // Single DOM query to get all relevant elements at once
  const allInputs =
    !filter || filter.includes("input")
      // ? Array.from(queryAll("input[name]:not([role='combobox']), input[id]:not([role='combobox'])")).filter(
      ? Array.from(queryAll("input[name], input[id]")).filter(
          (el) =>
            !(el.id && el.id.startsWith("displayAsStructuredElementSwitch")) &&
            !(el.getAttribute("data-union-type-selector") === "true") &&
            !(
              (el as any).name &&
              // (el as any).name.startsWith("meta") &&
              (el as any).name.endsWith("-NAME")
            )
        )
      : [];
  // checkboxes are inputs! redundant?
  const allCheckboxes = Array.from(queryAll('input[type="checkbox"]')).filter(
    (el) => !(el.id && el.id.startsWith("displayAsStructuredElementSwitch"))
  );
  const allTestIdElements = queryAll('[data-testid="miroirInput"]');
  const allComboboxes =
    !filter || filter.includes("combobox")
      ? Array.from(queryAll('[role="combobox"]'))
      : [];
  // .filter((el) => !(el.id && el.id.startsWith("displayAsStructuredElementSwitch")));
  const allOptions =
    !filter || filter.includes("option") ? queryAll('[role="option"]') : [];
  const allSelectOptions =
    !filter || filter.includes("option") ? queryAll("option") : []; // Standard HTML option elements
  const allSelects =
    !filter || filter.includes("select")
      ? Array.from(queryAll("select[name], select[id]")).filter(
          (el) => !(el.id && el.id.startsWith("displayAsStructuredElementSwitch"))
        )
      : [];
  const allGridCells =
    !filter || filter.includes("cell")
      ? Array.from(queryAll('[role="presentation"]')).filter(
          (el) => el.id && el.id.startsWith("cell-")
        )
      : [];

  // log.debug(
  //   "extractValuesFromRenderedElements",
  //   "label",
  //   label,
  //   "step",
  //   step,
  //   "allInputs.length",
  //   allInputs.length,
  //   "allInputs",
  //   allInputs.map((el) => ({
  //     id: el.id,
  //     name: (el as any).name,
  //     type: (el as HTMLInputElement).type,
  //     value: (el as HTMLInputElement).value,
  //     defaultValue: (el as HTMLInputElement).defaultValue,
  //   }))
  // );
  // log.debug(
  //   "extractValuesFromRenderedElements",
  //   "label",
  //   label,
  //   "step",
  //   step,
  //   "allInputs.length",
  //   allInputs.length,
  //   "allTestIdElements.length",
  //   allTestIdElements.length,
  //   "allCheckboxes.length",
  //   allCheckboxes.length,
  //   "allComboboxes.length",
  //   allComboboxes.length,
  //   "allOptions.length",
  //   allOptions.length,
  //   "allPresentation.length",
  //   allGridCells.length,
  //   "allSelectOptions.length",
  //   allSelectOptions.length,
  //   "allSelects.length",
  //   allSelects.length
  // );

  // log.debug(
  //   "extractValuesFromRenderedElements",
  //   "label",
  //   label,
  //   "step",
  //   step,
  //   "allGridCells",
  //   Array.from(allGridCells).map((el) => ({
  //     // id: (el as any)['col-id'] ,
  //     id: el.getAttribute("col-id"),
  //     className: el.className,
  //     textContent: el.textContent,
  //   }))
  // );
  // log.debug("extractValuesFromRenderedElements",
  //   "label", label,
  //   "step", step,
  //   "allCheckboxes.length", allCheckboxes.length,
  //   // 'allCheckboxes', allCheckboxes.map((el) => ({
  //   //   id: el.id,
  //   //   name: (el as any).name,
  //   //   checked: (el as HTMLInputElement).checked,
  //   // })),
  // );

  // log.debug("extractValuesFromRenderedElements",
  //   "label", label,
  //   "step", step,
  //   "allComboboxes.length", allComboboxes.length,
  //   // 'allComboboxes', allComboboxes.map((el) => ({
  //   //   id: el.id,
  //   //   name: (el as any).name,
  //   //   value: (el as HTMLInputElement).value,
  //   //   defaultValue: (el as HTMLInputElement).defaultValue,
  //   // })),
  // );

  // log.debug("extractValuesFromRenderedElements",
  //   "label", label,
  //   "step", step,
  //   "allOptions.length", allOptions.length,
  //   // 'allOptions', Array.from(allOptions).map((el) => ({
  //   //   id: el.id,
  //   //   textContent: (el as HTMLOptionElement).textContent,
  //   //   ariaLabel: el.getAttribute("aria-label"),
  //   // })),
  // );
  // Process miroirInput elements first (these are the main form inputs)
  allTestIdElements.forEach((element: Element) => {
    // Check if the element itself is an input
    if (element.tagName === "INPUT") {
      const input = element as HTMLInputElement;
      const elementName = input.name || input.id;
      const name = removeLabelPrefix(elementName);

      // log.debug("extractValuesFromRenderedElements: processing TestId miroirInput (self)", {
      //   elementName,
      //   name,
      //   inputId: input.id,
      //   inputName: input.name,
      //   labelRegex: labelRegex?.source,
      //   value: input.value,
      //   label,
      // });

      if (!name) {
        log.debug("extractValuesFromRenderedElements: no name after label removal", elementName);
        return;
      }

      let value: any = inputValue(input);
      if (input.type === "number") {
        if (!isNaN(Number(value)) && value !== "") {
          value = Number(value);
        } else {
          expect(false, "number textBox content is not a number for " + name).toBeTruthy();
        }
      }
      values[name] = value;
      log.debug("extractValuesFromRenderedElements TestId miroirInput: set value", name, "=", value);
      return;
    }

    // Otherwise, look for input child elements
    const input = element.querySelector("input") as HTMLInputElement;
    if (!input) {
      // log.debug("extractValuesFromRenderedElements: miroirInput element has no input child!", element);
      log.debug(
        "extractValuesFromRenderedElements: miroirInput element has no input child!",
        (element as any).value,
        element.outerHTML
      );
      // return (element as any).value;
      // const elementName = input?.id || input.name;
      const name = removeLabelPrefix(element.id);
      values[name] = (element as any).value;
      return;
    }

    // log.debug(
    //   "extractValuesFromRenderedElements: miroirInput element input child:",
    //   input.outerHTML
    // );
    const elementName = input.id || input.name;
    const name = removeLabelPrefix(elementName);

    // log.debug("extractValuesFromRenderedElements: processing miroirInput (child)", {
    //   elementName,
    //   name,
    //   inputId: input.id,
    //   inputName: input.name,
    //   labelRegex: labelRegex?.source,
    //   value: input.value,
    //   label,
    // });

    if (!name) {
      log.debug("extractValuesFromRenderedElements: no name after label removal", elementName);
      return;
    }

    let value: any = inputValue(input);
    if (input.type === "number") {
      if (!isNaN(Number(value)) && value !== "") {
        value = Number(value);
      } else {
        expect(false, "number textBox content is not a number for " + name).toBeTruthy();
      }
    }
    values[name] = value;
    log.debug("extractValuesFromRenderedElements: set value", name, "=", value);
  });

  // Process HTML select elements (foreign key dropdowns)
  const allSelectElements: any[] = Array.from(
    queryAll('select[data-testid="miroirInput"]')
  );
  // log.debug(
  //   `extractValuesFromRenderedElements: found ${allSelectElements.length} select elements`
  // );
  for (const selectElement of allSelectElements) {
    const fieldName = selectElement.getAttribute("name") || selectElement.getAttribute("id") || "";
    if (fieldName && fieldName.match(labelRegex)) {
      const name = removeLabelPrefix(fieldName);

      // Look for the corresponding ThemedSelectWithPortal state tracker
      const stateTrackerSelector = `[data-testid="themed-select-state-${
        selectElement.getAttribute("name") || "unnamed"
      }"]`;
      const stateTracker = query(stateTrackerSelector);

      let selectedValue = "";
      if (stateTracker) {
        selectedValue = stateTracker.getAttribute("data-test-selected-value") || "";
        log.debug(
          `extractValuesFromRenderedElements: found state tracker for ${fieldName} with value: "${selectedValue}"`
        );
      } else {
        // Fallback: try to get value directly from the select element
        selectedValue =
          (selectElement as HTMLSelectElement).value || selectElement.getAttribute("value") || "";
        log.debug(
          `extractValuesFromRenderedElements: no state tracker found for ${fieldName}, select HTML value: "${selectedValue}"`
        );
      }

      if (!selectedValue) {
        // Check if any div options have selection styling or active class
        const divOptions = Array.from(selectElement.querySelectorAll("div[data-value]"));
        log.debug(
          `extractValuesFromRenderedElements: select ${fieldName} has ${divOptions.length} div options`
        );

        const activeOption: any = divOptions.find(
          (div: any) =>
            div.classList.contains("selected") ||
            div.classList.contains("active") ||
            div.getAttribute("aria-selected") === "true"
        ) as any;
        if (activeOption) {
          selectedValue = activeOption.getAttribute("data-value") || "";
          log.debug(
            `extractValuesFromRenderedElements: found active option for ${fieldName}: ${selectedValue}`
          );
        } else {
          // Log all options for debugging
          log.debug(
            `extractValuesFromRenderedElements: select ${fieldName} options:`,
            divOptions.map((div: any) => ({
              value: div.getAttribute("data-value"),
              text: div.textContent,
              classes: div.className,
            }))
          );
        }
      }

      // log.debug(
      //   `extractValuesFromRenderedElements: processing select element ${fieldName} -> ${name} = ${selectedValue}`
      // );
      if (selectedValue) {
        values[name] = selectedValue;
        log.debug(
          `extractValuesFromRenderedElements: set select value ${name} = ${selectedValue}`
        );
      }
    }
  }

  // Process all other input elements that might not have miroirInput testId
  allInputs.forEach((input: Element) => {
    const htmlInput = input as HTMLInputElement;
    if (!htmlInput.name && !htmlInput.id) return;

    const name = removeLabelPrefix(htmlInput.name || htmlInput.id);

    // log.debug("extractValuesFromRenderedElements: processing input", {
    //   elementName: htmlInput.id || htmlInput.name,
    //   name,
    //   inputId: htmlInput.id,
    //   // inputName: htmlInput.name,
    //   // labelRegex: labelRegex?.source,
    //   value: htmlInput.value,
    //   label,
    // });
    if (!name || values[name] !== undefined) return; // Skip if already processed

    // Skip if this input was already processed by miroirInput logic
    const parentWithTestId = htmlInput.closest('[data-testid="miroirInput"]'); 
    if (parentWithTestId) {
      log.debug("extractValuesFromRenderedElements: skipping input already processed via miroirInput", name);
      return
    };

    let value: any = inputValue(htmlInput);
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
    log.debug("extractValuesFromRenderedElements: setting input value", name, "=", value);
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

  // Process comboboxes. TODO: WAY TOO COMPLEX FOR THE GOAL THAT IS SOUGHT!
  allComboboxes.forEach((element: Element) => {
    const htmlElement = element as HTMLInputElement;

    log.debug("extractValuesFromRenderedElements: examining combobox", {
      tagName: htmlElement.tagName,
      name: htmlElement.name,
      id: htmlElement.id,
      value: htmlElement.value,
      outerHTML: htmlElement.outerHTML,
      label,
    });

    // Check if combobox element itself is an input (most common case)
    if (htmlElement.tagName === "INPUT" && (htmlElement.name || htmlElement.id)) {
      const elementName = htmlElement.name || htmlElement.id;

      // // Special handling for array context comboboxes that don't have full path names
      // if (
      //   htmlElement.name &&
      //   label &&
      //   htmlElement.name.indexOf(".") === -1 &&
      //   !elementName.startsWith(label) &&
      //   container
      // ) {
      //   // This is a bare field name like "objectType" or "type" - need to find its array context

      //   // For "type" fields, we need special handling to find the correct parent schema element
      //   if (htmlElement.name === "type") {
      //     // Find the nearest schema definition context by looking for nearby label elements
      //     let currentElement: Element | null = htmlElement.parentElement;
      //     let contextPath = "";

      //     // Walk up the DOM tree to find schema definition context
      //     while (currentElement && !contextPath) {
      //       // Look for labels that indicate which schema field this type belongs to
      //       const labelElements = currentElement.querySelectorAll('[id$=".label"]') as any;
      //       for (const labelEl of labelElements) {
      //         const labelId = labelEl.id;
      //         if (labelId.includes(".definition.") && labelId.endsWith(".type.label")) {
      //           // Extract the field path from something like "testField.mlSchema.definition.conceptLevel.type.label"
      //           const fieldPath = labelId.replace(".type.label", "");
      //           contextPath = removeLabelPrefix(fieldPath);
      //           log.debug(
      //             `extractValuesFromRenderedElements: found type field context for type combobox: ${contextPath}`
      //           );
      //           break;
      //         }
      //       }
      //       currentElement = currentElement.parentElement;

      //       // Stop searching if we've gone too far up
      //       if (currentElement && currentElement.id && !currentElement.id.includes("testField")) {
      //         break;
      //       }
      //     }

      //     if (contextPath) {
      //       const name = `${contextPath}.type`;
      //       let value = htmlElement.value;
      //       if (value === "" && htmlElement.defaultValue !== undefined) {
      //         value = htmlElement.defaultValue;
      //       }

      //       values[name] = value;
      //       log.debug(
      //         "extractValuesFromRenderedElements: processed type combobox with context",
      //         name,
      //         "=",
      //         value
      //       );

      //       // Check for options in dropdown
      //       checkForComboboxOptions(htmlElement, name, values);
      //       return;
      //     }
      //   }

      //   // Get all comboboxes with the same name to determine which index this one represents
      //   const allSameNameComboboxes = Array.from(
      //     container.querySelectorAll(`input[role="combobox"][name="${htmlElement.name}"]`)
      //   );
      //   const currentComboboxIndex = allSameNameComboboxes.indexOf(htmlElement);

      //   log.debug(
      //     `extractValuesFromRenderedElements: found ${allSameNameComboboxes.length} comboboxes with name "${htmlElement.name}", current is index ${currentComboboxIndex}`
      //   );

      //   // Find all array inputs to determine the mapping
      //   const allArrayInputs = Array.from(container.querySelectorAll("input[id]")).filter(
      //     (input) => {
      //       const inputId = input.getAttribute("id") || "";
      //       return inputId.match(new RegExp(`^${label}\\.(\\d+)\\.`));
      //     }
      //   );

      //   // Group inputs by array index
      //   const indexedInputGroups = allArrayInputs.reduce((groups, input) => {
      //     const inputId = input.getAttribute("id") || "";
      //     const match = inputId.match(new RegExp(`^${label}\\.(\\d+)\\.`));
      //     if (match) {
      //       const index = parseInt(match[1]);
      //       if (!groups[index]) groups[index] = [];
      //       groups[index].push(input);
      //     }
      //     return groups;
      //   }, {} as Record<number, Element[]>);

      //   // Sort array indices to ensure consistent ordering
      //   const sortedIndices = Object.keys(indexedInputGroups)
      //     .map((k) => parseInt(k))
      //     .sort((a, b) => a - b);

      //   log.debug("extractValuesFromRenderedElements: array indices found:", sortedIndices);

      //   // Map this combobox to the correct array index based on its position
      //   if (currentComboboxIndex < sortedIndices.length) {
      //     const arrayIndex = sortedIndices[currentComboboxIndex];
      //     const fieldName = `${arrayIndex}.${htmlElement.name}`;
      //     // const name = removeLabelPrefix(`testField.${fieldName}`);
      //     const name = removeLabelPrefix(`testField.${fieldName}`);
      //     log.debug(
      //       `extractValuesFromRenderedElements: mapped combobox ${currentComboboxIndex} to array index ${arrayIndex}, field name: ${name}`
      //     );

      //     let value = htmlElement.value;
      //     if (value === "" && htmlElement.defaultValue !== undefined) {
      //       value = htmlElement.defaultValue;
      //     }

      //     values[name] = value;
      //     log.debug(
      //       "extractValuesFromRenderedElements: processed combobox (array context)",
      //       name,
      //       "=",
      //       value
      //     );

      //     // Check for options in dropdown
      //     checkForComboboxOptions(htmlElement, name, values);
      //     return;
      //   }
      // }

      if (label && !elementName.startsWith(label)) {
        log.debug("extractValuesFromRenderedElements: combobox name/id does not match label", {
          elementName,
          label,
        });
        return
      };

      const name = removeLabelPrefix(elementName);
      if (name && values[name] === undefined) {
        const value = inputValue(htmlElement);
        values[name] = value;
        log.debug(
          "extractValuesFromRenderedElements: processed combobox (self)",
          name,
          "=",
          value
        );

        // Check for options in dropdown
        checkForComboboxOptions(htmlElement, name, values);
        return;
      } else {
        log.debug(
          "extractValuesFromRenderedElements: combobox name already has value, skipping",
          name
        );
      }
    }

    // // Handle comboboxes without name/id by looking at DOM context
    // if (htmlElement.tagName === "INPUT") {
    //   log.debug(
    //     "extractValuesFromRenderedElements: combobox has value but no name/id, checking context"
    //   );

    //   // Look for nearby label elements that might indicate the field name
    //   // Search in parent and sibling elements for label with .label suffix
    //   let currentElement: Element | null = htmlElement;
    //   let labelElement: Element | null = null;

    //   // Search up the DOM tree for related label elements
    //   while (currentElement && !labelElement) {
    //     // Look for label elements in current container
    //     labelElement = currentElement.querySelector('[id$=".label"]');
    //     if (!labelElement) {
    //       // Look for label elements in parent containers
    //       const parentContainer = currentElement.parentElement;
    //       if (parentContainer) {
    //         labelElement = parentContainer.querySelector('[id$=".label"]');
    //       }
    //     }
    //     currentElement = currentElement.parentElement;

    //     // Stop searching if we've gone too far up
    //     if (currentElement && currentElement.id && !currentElement.id.includes("testField")) {
    //       break;
    //     }
    //   }

    //   if (labelElement) {
    //     const labelId = labelElement.id;
    //     log.debug("extractValuesFromRenderedElements: found label element", labelId);

    //     // Extract the field path from the label id (e.g., "testField.0.objectType.label" -> "0.objectType")
    //     if (labelId.endsWith(".label")) {
    //       const fieldPath = labelId.slice(0, -6); // Remove '.label'
    //       const name = removeLabelPrefix(fieldPath);
    //       log.debug(
    //         "extractValuesFromRenderedElements: extracted field name",
    //         name,
    //         "from label",
    //         labelId
    //       );

    //       // Check if dropdown is open
    //       const ariaExpanded = htmlElement.getAttribute("aria-expanded");
    //       const isDropdownOpen = ariaExpanded === "true";

    //       if (name && (values[name] === undefined || isDropdownOpen)) {
    //         let value = htmlElement.value;
    //         if (value === "" && htmlElement.defaultValue !== undefined) {
    //           value = htmlElement.defaultValue;
    //         }

    //         // For open dropdowns with empty value, don't overwrite existing field value
    //         if (isDropdownOpen && !value && values[name] !== undefined) {
    //           log.debug(
    //             "extractValuesFromRenderedElements: dropdown is open, preserving existing value for",
    //             name
    //           );
    //         } else {
    //           values[name] = value;
    //           log.debug(
    //             "extractValuesFromRenderedElements: processed combobox (context)",
    //             name,
    //             "=",
    //             value
    //           );
    //         }

    //         // Check for options in dropdown
    //         checkForComboboxOptions(htmlElement, name, values);
    //         return;
    //       }
    //     }
    //   } else {
    //     log.debug("extractValuesFromRenderedElements: no label element found for combobox");
    //   }
    // }

    // Fallback: look for input as next sibling (legacy case)
    if (label && !htmlElement.id.startsWith(label)) return;

    const input = htmlElement.nextElementSibling as HTMLInputElement;
    if (input && input.name) {
      const name = removeLabelPrefix(input.name);
      if (name && values[name] === undefined) {
        values[name] = input.value;
        log.debug(
          "extractValuesFromRenderedElements: processed combobox (sibling)",
          name,
          "=",
          input.value
        );
      }
    }
  });

  // Process options (role="option")
  allOptions.forEach((element: Element) => {
    const htmlElement = element as HTMLElement;
    const ariaLabel: string | null = htmlElement.getAttribute("aria-label");
    if (!label || !ariaLabel || !ariaLabel.startsWith(label)) {
      log.debug("extractValuesFromRenderedElements: skipping option, label mismatch", {
        ariaLabel,
        label,
      });
      return
    };

    const optionValue = (htmlElement as HTMLOptionElement).textContent;
    const targetName = label + ".options";
    if (optionValue) {
      // log.debug(
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

  // Process HTML select options (only if dropdown is visually open)
  // We'll use a more conservative approach - only extract options if we can find
  // specific indicators that the dropdown is actually opened/expanded

  // Check for various dropdown open indicators
  const hasListbox = !!query('[role="listbox"]');
  const hasPresentation = !!query(
    '[role="presentation"]:not([aria-hidden="true"])'
  );
  const hasAutocompletePopper = !!query(
    '.MuiAutocomplete-popper:not([style*="display: none"])'
  );
  const hasPopperPlacement = !!query("[data-popper-placement]");
  const hasMuiPaper = !!query(".MuiPaper-root");
  const hasExpandedSelect = !!query('.MuiSelect-select[aria-expanded="true"]');
  const hasPopover = !!query(".MuiPopover-root");
  const hasMenuList = !!query(".MuiMenuList-root");
  const hasVisibleMenu = !!query('[role="menu"]');

  // Special case: if step indicates dropdown opening interaction (like "after mouseDown"), be more permissive
  // But NOT for steps that indicate the dropdown should be closed (like "after selection change")
  const isAfterDropdownOpeningInteraction =
    step &&
    (step.includes("mouseDown") ||
      (step.includes("after") && !step.includes("selection change") && !step.includes("click")));

  const isAnyDropdownOpen =
    hasListbox ||
    hasPresentation ||
    hasAutocompletePopper ||
    hasPopperPlacement ||
    hasMuiPaper ||
    hasExpandedSelect ||
    hasPopover ||
    hasMenuList ||
    hasVisibleMenu ||
    isAfterDropdownOpeningInteraction; // Be permissive after dropdown opening interactions

  if (isAnyDropdownOpen) {
    allSelectOptions.forEach((element: Element) => {
      const htmlElement = element as HTMLOptionElement;
      const ariaLabel: string | null = htmlElement.getAttribute("aria-label");
      if (!label || !ariaLabel || !ariaLabel.startsWith(label)) return;

      const optionValue = htmlElement.textContent;
      const targetName = label + ".options";
      if (optionValue) {
        if (values[targetName] === undefined) {
          values[targetName] = [];
        }
        values[targetName].push(optionValue);
      }
    });
  }

  // Process select elements
  allSelects.forEach((element: Element) => {
    const select = element as HTMLSelectElement;
    if (!select.name && !select.id) return;

    const name = removeLabelPrefix(select.name || select.id);
    if (!name || values[name] !== undefined) return; // Skip if already processed or no name

    // Skip if this select was already processed by miroirInput logic
    const parentWithTestId = select.closest('[data-testid="miroirInput"]');
    if (parentWithTestId) return;

    values[name] = select.value;
    log.debug("extractValuesFromRenderedElements: processed select", name, "=", select.value);
  });

  // Process select elements (for foreign key dropdowns)
  allSelects.forEach((element: Element) => {
    const select = element as HTMLSelectElement;
    if (!select.name && !select.id) return;

    const elementName = select.id || select.name;
    if (label && !elementName.startsWith(label)) return;

    const name = removeLabelPrefix(elementName);
    if (!name || values[name] !== undefined) return; // Skip if already processed or no name

    // Skip if this select was already processed by miroirInput logic
    const parentWithTestId = select.closest('[data-testid="miroirInput"]');
    if (parentWithTestId) return;

    values[name] = select.value;
    log.debug("extractValuesFromRenderedElements: processed select", name, "=", select.value);
  });

  allGridCells.forEach((element: Element) => {
    const htmlElement = element as HTMLElement;
    // const colId: string | null = htmlElement.getAttribute("col-id");
    const colId: string | null = htmlElement.id;
    log.debug(
      "extractValuesFromRenderedElements",
      label,
      ": processing gridcell",
      colId,
      "=",
      htmlElement.textContent
    );
    if (!label || !colId || !colId.startsWith(label)) return;
    const cellValue = htmlElement.textContent;
    const name = removeLabelPrefix(colId);
    // const name = label;
    if (name && cellValue !== null) {
      values[name] = cellValue;
      log.debug("extractValuesFromRenderedElements: processed gridcell", name, "=", cellValue);
    }
  });
  // Clean up non-indexed duplicates when indexed versions exist
  const fieldsToRemove: string[] = [];
  for (const key in values) {
    // Check if this is a non-indexed field (no dots) that has indexed versions
    if (!key.includes(".") && key !== "testField") {
      const hasIndexedVersions = Object.keys(values).some(
        (otherKey) => otherKey.includes(".") && otherKey.endsWith(`.${key}`)
      );
      if (hasIndexedVersions) {
        fieldsToRemove.push(key);
        log.debug(
          `extractValuesFromRenderedElements: removing non-indexed field "${key}" because indexed versions exist`
        );
      }
    }
  }

  // Remove non-indexed duplicates
  fieldsToRemove.forEach((field) => delete values[field]);

  // No hardcoded foreign key handling - extract only what's actually rendered in the form

  log.debug("extractValuesFromRenderedElements: final values", values);
  return values;
}

// ################################################################################################
export function formValuesToJSON(input: Record<string, any>, sectionName?: string): any {
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
  log.debug("formValuesToJSON before extracting sectionName: result =", result, "sectionName =", sectionName);
  return sectionName?result[sectionName]:result;
}
