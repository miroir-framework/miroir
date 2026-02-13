import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  dummyDomainManyQueryWithDeploymentUuid,
  entitySelfApplication,
  LoggerInterface,
  MiroirLoggerFactory,
  Report,
  reportEntityDefinitionDetails,
  reportEntityDefinitionList,
  reportEntityDetails,
  reportEntityList,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type MetaModel,
  type SelfApplication
} from "miroir-core";

import {
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { usePageConfiguration } from "../services/index.js";


// import entityPublisher from "../../assets/library_model/";
import {
  packageName
} from "../../../constants.js";
import { useQueryTemplateResults } from "../components/Reports/ReportHooks.js";
import { ThemedOnScreenDebug } from "../components/Themes/BasicComponents.js";
import { cleanLevel } from "../constants.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { RunnerList, runnerConfigs } from "../components/Runners/RunnersList.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "HomePage"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export interface RootComponentProps {
  // store:any;
  // reportName: string;
}

function defaultToEntityList(
  value: string | undefined,
  miroirReports: Report[]
): string | undefined {
  return value
    ? (value as string)
    : miroirReports.find((r) => r.name == "EntityList")
    ? "EntityList"
    : undefined;
}

const metaModelReports = [
  reportEntityList.uuid,
  reportEntityDefinitionList.uuid,
  reportEntityDetails.uuid,
  reportEntityDefinitionDetails.uuid,
];



// ###################################################################################
// ###################################################################################
// ###################################################################################
export const HomePage = (props: RootComponentProps) => {
  const context = useMiroirContextService();

  const currentApplication = context.toolsPageState?.applicationSelector ?? context.application;
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Home page configurations loaded successfully",
    actionName: "home page configuration fetch"
  });

  const displayedApplicationSection = context.applicationSection;
  const currentApplicationDeploymentMap = context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;

  const currentAppModel: MetaModel = useCurrentModel(
    currentApplication,
    currentApplicationDeploymentMap
  );

  // computing current state #####################################################################
  // const displayedDeploymentDefinition: Deployment | undefined = deployments.find(
  //   (d) => d.uuid == displayedDeploymentUuid
  // );
  // log.info("HomePage displayedDeploymentDefinition",displayedDeploymentDefinition);

  // // TODO: adapt to Admin app deployment!
  // const currentModel = displayedDeploymentUuid == deployment_Miroir.uuid? defaultMiroirMetaModel:currentAppModel;
  // // const currentModel = libraryAppModel;
  // log.info("HomePage currentModel",currentModel);

  // // const currentReportDefinitionApplicationSection: ApplicationSection | undefined = 
  // //   currentReportDefinitionDeployment?.applicationModelLevel == "metamodel"? 'data':'model'
  // ;
  // log.info(
  //   "HomePage displayedDeploymentDefinition",
  //   displayedDeploymentDefinition?.uuid,
  //   "displayedApplicationSection",
  //   displayedApplicationSection
  // );

  // log.info("HomePage availableReports",availableReports);

  const currentStoredQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    // | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      currentApplication && currentAppModel?.entities?.length > 0
        ? {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: currentApplication,
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractors: {
              selfApplication: {
                extractorOrCombinerType: "extractorForObjectByDirectReference",
                label: "HomePage_selfApplication",
                parentName: "SelfApplication",
                parentUuid: entitySelfApplication.uuid,
                applicationSection: "model",
                instanceUuid: currentApplication,
              },
            },
          }
        : dummyDomainManyQueryWithDeploymentUuid,
    [currentApplication, currentAppModel]
  );

  const currentStoredQueryResults: Domain2QueryReturnType<Record<string, any>> =
    useQueryTemplateResults(
      {
        // applicationSection: pageParams.applicationSection as ApplicationSection,
        // deploymentUuid: pageParams.deploymentUuid!,
        // instanceUuid: pageParams.instanceUuid,
        // pageParams: pageParams,
        // reportDefinition: currentMiroirReport,
      },
      currentApplicationDeploymentMap,
      currentStoredQuery
    );

  const applicationDefinition: SelfApplication | undefined =
    currentStoredQueryResults instanceof Domain2ElementFailed
      ? undefined
      : currentStoredQueryResults?.reportData?.selfApplication;
  // log.info("HomePage currentStoredQueryResults",currentStoredQueryResults);

  const navigate = useNavigate();


  useEffect(() => {
    if (applicationDefinition) {
      log.info("HomePage fetched applicationDefinition", applicationDefinition);
      if (applicationDefinition.homePageUrl) {
        navigate(applicationDefinition.homePageUrl);
      }
    }
  }, [applicationDefinition]);

  return (
    <PageContainer
      withSidebar={true}
      withDocumentOutline={false} // HomePage typically doesn't have document outline
      customSx={{
        // HomePage specific styling
        backgroundColor: "background.default",
        "& button": {
          margin: 1,
          maxWidth: "100%",
          wordWrap: "break-word",
        },
      }}
    >
      <h2>Welcome to the Miroir Platform!</h2>
      <ThemedOnScreenDebug
        label={`HomePage application: ${currentApplication} section: ${displayedApplicationSection}`}
        data={{
          currentAppModel,
          currentStoredQuery,
          currentStoredQueryResults,
          toolsPageState: context.toolsPageState,
          currentApplicationDeploymentMap,
          applicationDefinition,
        }}
        // initiallyUnfolded={false}
        copyButton={true}
        useCodeBlock={true}
      />
      {/* undo */}
      {/* <span>
        <button
          onClick={async () => {
            await domainController.handleActionFromUI({
              actionType: "undo",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
              payload: {
                application: selfApplicationMiroir.uuid,
                deploymentUuid: deployment_Miroir.uuid,
              }
            }, currentApplicationDeploymentMap, defaultMiroirModelEnvironment);
          }}
        >
          undo
        </button>
      </span> */}
      {/* redo */}
      {/* <span>
        <button
          onClick={async () => {
            await domainController.handleActionFromUI({
              actionType: "redo",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
              payload: {
                application: selfApplicationMiroir.uuid,
                deploymentUuid: deployment_Miroir.uuid,
              }
            }, currentApplicationDeploymentMap, defaultMiroirModelEnvironment);
          }}
        >
          Redo
        </button>
      </span> */}
      <RunnerList config={runnerConfigs} applicationDeploymentMap={currentApplicationDeploymentMap} />



      {/* <p /> */}
      {/* <span>cache size: {JSON.stringify(domainController.currentLocalCacheInfo())}</span> */}
      {/* <Importer
        filename=""
        currentModel={currentModel}
        // currentDeploymentUuid={adminConfigurationDeploymentTest1.uuid}
        // currentDeploymentUuid="f97cce64-78e9-419f-a4bd-5cbf52833ede" // test4
        // currentDeploymentUuid="3d15b8c8-a74c-48ce-81d5-c76853803b90" // Paris
        currentDeploymentUuid={deployment_Library_DO_NO_USE.uuid}
        // currentApplicationUuid={test1SelfApplication.uuid}
        // currentApplicationUuid="478d3a5d-d866-41c8-944c-121aca3ab87f" // test4
        // currentApplicationUuid="2c1d14d5-691f-42cf-9850-887122170a43" // Paris
        currentApplicationUuid={selfApplicationLibrary.uuid} 
      ></Importer> */}
    </PageContainer>
  );
};
