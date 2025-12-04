import { Formik } from "formik";
import { useSelector } from "react-redux";

// import { ReactCodeMirror } from "@uiw/react-codemirror";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { ValueObjectGrid } from "../components/Grids/ValueObjectGrid";
import { PageContainer } from "../components/Page/PageContainer";

// const MyReactCodeMirror: React.Component = ReactCodeMirror
// const MyReactCodeMirror: any = ReactCodeMirror // TODO: solve the mystery: it was once well-typed, now the linter raises an error upon direct (default-typed) use!

import {
  Domain2ElementFailed,
  DomainAction,
  DomainControllerInterface,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirConfigClient,
  MiroirLoggerFactory,
  StoreUnitConfiguration,
  TestCompositeActionParams,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentParis,
  defaultLibraryModelEnvironment,
  defaultMetaModelEnvironment,
  displayTestSuiteResultsDetails,
  entityApplicationForAdmin,
  entityBook,
  entityDeployment,
  entityMenu,
  entitySelfApplication,
  entityTransformerTest,
  expect,
  jzodTypeCheck,
  selfApplicationDeploymentLibrary,
  testSuitesResults,
  transformerTest_resolveConditionalSchema,
  type Domain2QueryReturnType,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap,
  type TestSuiteResult,
  type TransformerTestSuite,
  type Uuid
} from "miroir-core";

import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from "miroir-localcache-redux";
// import {
//   Entity,
//   TestSuiteResult
// } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { applicationParis, packageName } from "../../../constants.js";
import { getTestSuitesForBuildPlusRuntimeCompositeAction } from "../../4-tests/applicative.Library.BuildPlusRuntimeCompositeAction.js";
import { testOnLibrary_deleteLibraryDeployment } from "../../4-tests/tests-utils-testOnLibrary.js";
import { runTestOrTestSuite } from "../../4-tests/tests-utils.js";
import {
  useDomainControllerService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirContextformHelperState
} from "../MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { cleanLevel } from "../constants.js";
import { usePageConfiguration } from "../services/index.js";

import { RunTransformerTestSuiteButton } from "../components/Buttons/RunTransformerTestSuiteButton";
import { TransformerEditor } from "../components/TransformerEditor/TransformerEditor";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext";

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerBuilderPage"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export const emptyString = ""
export const dataSection = "data"
export const emptyList:any[] = []
export const emptyObject = {}

const pageLabel = "Tools";

export const defaultObject: JzodObject = {
  type: "object",
  definition: {}
} as JzodObject

const initialValues = {
  newApplicationName: "placeholder...",
  newAdminAppApplicationUuid: applicationParis.uuid,
  newSelfApplicationUuid: applicationParis.selfApplication,
  newDeploymentUuid: adminConfigurationDeploymentParis.uuid,
}

export interface MiroirForm {
  formSchema: JzodElement,
  formAction: DomainAction,
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
let count = 0;
export const TransformerBuilderPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  // const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Tools page configurations loaded successfully",
    actionName: "tools page configuration fetch"
  });

  // const errorLog = useErrorLogService();
  const context = useMiroirContextService();
  const domainController: DomainControllerInterface = useDomainControllerService();
  // const currentModel: MetaModel = useCurrentModel(
  //   context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  // );
  // const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const [formState,setFormState] = useState<{[k:string]:any}>(initialValues)
  const [testResults, setTestResults] = useState<TestSuiteResult | undefined>(
    undefined
  );
  // const [resolveConditionalSchemaResults, setResolveConditionalSchemaResults] = useState<string>("");
  const [resolveConditionalSchemaResultsData, setResolveConditionalSchemaResultsData] = useState<any[]>([]); // TODO: use a precise type!


  // const resolvedTestResultsJzodSchema: JzodElement | undefined = useMemo(() => {
  //   if (
  //     testResults &&
  //     context.miroirFundamentalJzodSchema != undefined &&
  //     (testSuitesResults != undefined && testSuitesResults.context != undefined)
  //   ) {
  //     const configuration = jzodTypeCheck(
  //       (context.miroirFundamentalJzodSchema.definition as any).context.testsResults,
  //       testResults?.testsSuiteResults?.["applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"],
  //       [], // currentValuePath
  //       [], // currentTypePath
  //       {
  //         miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema,
  //         currentModel,
  //         miroirMetaModel: currentMiroirModel,
  //       },
  //       emptyObject
  //     );

  //     return configuration.status == "ok" ? configuration.resolvedSchema : defaultObject;
  //   }
  // }, [context.miroirFundamentalJzodSchema, testResults]);

  // log.info(
  //   "called jzodTypeCheck: resolvedTestResultsJzodSchema",
  //   resolvedTestResultsJzodSchema,
  //   context.miroirFundamentalJzodSchema,
  //   // "rawSchema",
  //   // rawSchema
  // );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap?.extractState(state.presentModelSnapshot.current, () => ({}), defaultMetaModelEnvironment)
  );
  
  const entityTransformerTestKey = adminConfigurationDeploymentMiroir.uuid + "_data_" + entityTransformerTest.uuid
  // log.info(
  //   "Tools.tsx deploymentEntityStateSelectorMap",
  //   deploymentEntityStateSelectorMap,
  //   "entityTransformerTestKey",
  //   entityTransformerTestKey,
  //   Object.keys(deploymentEntityState).includes(entityTransformerTestKey),
  //   "deploymentEntityState",
  //   deploymentEntityState,
  // );
  const transformerTestSuite_resolveConditionalSchema: Domain2QueryReturnType<any> | undefined =
    Object.keys(deploymentEntityState).includes(entityTransformerTestKey)
      ? (deploymentEntityStateSelectorMap.extractEntityInstance(
          deploymentEntityState,
          {
            extractor: {
              queryType: "boxedExtractorOrCombinerReturningObject",
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              contextResults: {},
              pageParams: {},
              queryParams: {},
              select: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                applicationSection: "data",
                parentUuid: entityTransformerTest.uuid,
                instanceUuid: transformerTest_resolveConditionalSchema.uuid,
              },
            },
          },
          defaultMetaModelEnvironment
        ) as Domain2QueryReturnType<TransformerTestSuite>)
      : undefined;
  // log.info(
  //   "Tools.tsx transformerTestSuite_resolveConditionalSchema",
  //   transformerTestSuite_resolveConditionalSchema
  // );
  if (transformerTestSuite_resolveConditionalSchema && transformerTestSuite_resolveConditionalSchema instanceof Domain2ElementFailed) {
    throw new Error(
      `transformerTestSuite_resolveConditionalSchema not found in deploymentEntityState: ${JSON.stringify(
        transformerTestSuite_resolveConditionalSchema
      )}`
    );
  }

  // ##############################################################################################
  const onSubmit = useCallback(
    async (
      actionCreateSchemaParamValues: any /* actually follows formJzodSchema */,
      formikFunctions: { setSubmitting: any; setErrors: any }
    ) => {
      try {
        //  Send values somehow
        setformHelperState(actionCreateSchemaParamValues);

        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Tools.tsx onSubmit formik values",
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
        
        const paramsForTemplates = {
          ...actionCreateSchemaParamValues,
          entityApplicationForAdmin,
          entitySelfApplication,
          adminConfigurationDeploymentAdmin,
          entityMenu,
          entityDeployment,
        };
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Tools.tsx onSubmit formik values actionCreateSchemaParamValues",
          actionCreateSchemaParamValues,
          "paramsForTemplates",
          paramsForTemplates
        );

          const testStoreUnitConfiguration: StoreUnitConfiguration = {
            admin: {
              emulatedServerType: "filesystem",
              directory: "./tests/tmp/miroir_admin",
            },
            model: {
              emulatedServerType: "filesystem",
              directory: "./tests/tmp/miroir_model",
            },
            data: {
              emulatedServerType: "filesystem",
              directory: "./tests/tmp/miroir_data",
            },
          };

          const testMiroirConfig: MiroirConfigClient = {
            miroirConfigType: "client",
            client: {
              emulateServer: true,
              rootApiUrl: "http://localhost:3080",
              deploymentStorageConfig: {
                "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
                  admin: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroirAdmin",
                  },
                  model: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroir",
                  },
                  data: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroir",
                  },
                },
                "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": {
                  admin: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroirAdmin",
                  },
                  model: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "library",
                  },
                  data: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "library",
                  },
                },
              },
              // deploymentMode: "monoUser",
              // monoUserAutentification: false,
              // monoUserVersionControl: false,
              // versionControlForDataConceptLevel: false,
            },
          };

        const {
          testSuitesForBuildPlusRuntimeCompositeAction,
          testDeploymentStorageConfiguration,
          testDeploymentUuid,
        }: {
          testSuitesForBuildPlusRuntimeCompositeAction: Record<string, TestCompositeActionParams>;
          testDeploymentStorageConfiguration: any;
          testDeploymentUuid: Uuid;
        } = getTestSuitesForBuildPlusRuntimeCompositeAction(testMiroirConfig);

        for (const [currentTestSuiteName, testSuite] of Object.entries(
          testSuitesForBuildPlusRuntimeCompositeAction as Record<string, TestCompositeActionParams>
        )) {
          const testSuiteResults = await runTestOrTestSuite(
            // localCache,
            domainController,
            testSuite,
            context.miroirContext.miroirActivityTracker,
            (testSuite as any)["testParams"]
          );
          log.info(
            "testSuiteResults",
            currentTestSuiteName,
            testSuiteResults,
            "testSuite",
            testSuite
          );
          if (!testSuiteResults || testSuiteResults.status !== "ok") {
            expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
          }
        }

        // const deleteNewApplicationResult = await domainController.handleCompositeAction(
        //   testOnLibrary_deleteLibraryDeployment({
        //   miroirConfigType: "client",
        //   client: {
        //     emulateServer: true,
        //     rootApiUrl: "http://localhost:3080",
        //     deploymentStorageConfig: {
        //       [actionCreateSchemaParamValues.newDeploymentUuid]:testDeploymentStorageConfiguration
        //       },
        //     }}, actionCreateSchemaParamValues.newDeploymentUuid),
        //   paramsForTemplates,
        //   defaultLibraryModelEnvironment // TODO: use real model environment for current deployment
        // );

        // log.info(
        //   "store deleted with uuid",
        //   actionCreateSchemaParamValues.newDeploymentUuid,
        //   JSON.stringify(deleteNewApplicationResult, null, 2)
        // );
        // // not needed in the GUI, the admin and miroir models stay there.
        // // await deleteAndCloseApplicationDeployments(
        // //   miroirConfig,
        // //   domainController,
        // //   [
        // //     typedAdminConfigurationDeploymentMiroir
        // //   ],
        // // );
    
        const testSuitePath = [{ testSuite: Object.keys(testSuitesForBuildPlusRuntimeCompositeAction)[0]}]
        const globalTestSuiteResults = context.miroirContext.miroirActivityTracker.getTestSuiteResult(
          testSuitePath
        );
        setTestResults(globalTestSuiteResults);
        log.info("testResults", globalTestSuiteResults);


        displayTestSuiteResultsDetails(
          // TestFramework,
          Object.keys(testSuitesForBuildPlusRuntimeCompositeAction)[0],
          testSuitePath,
          context.miroirContext.miroirActivityTracker
        );


        // log.info("created Deployment instance in Admin App deployment");
      } catch (e) {
        log.error(e);
        //  Map and show the errors in your form
        // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)

        // setErrors(formErrors)
        // this.setState({
        //   unknownErrors,
        // })
      } finally {
        formikFunctions.setSubmitting(false);
      }
    },
    []
  ); // end onSubmit()

  // ##############################################################################################

  // log.info(
  //   "Tools.tsx render",
  //   // currentEnumJzodSchemaResolver,
  //   "testResults",
  //   testResults,
  //   "testSuitesResults",
  //   testSuitesResults,
  //   "testSuitesResults.context",
  //   testSuitesResults.context,
  //   // "resolvedTestResultsJzodSchema",
  //   // resolvedTestResultsJzodSchema,
  //   // (resolvedTestResultsJzodSchema as any)?.element,
  // );
  const testSuiteKey = "resolveConditionalSchema";

  return (
    <ReportPageContextProvider>
      <PageContainer>
        {/* Transformer Editor */}
        <div style={{ margin: "20px 0" }}>
          <TransformerEditor
            deploymentUuid={selfApplicationDeploymentLibrary.uuid}
            entityUuid={entityBook.uuid}
          />
        </div>
      </PageContainer>
    </ReportPageContextProvider>
  );
}