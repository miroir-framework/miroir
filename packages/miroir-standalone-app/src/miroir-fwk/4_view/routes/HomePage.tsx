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
} from "miroir-react";
import { PageContainer } from "../components/Page/PageContainer.js";
import { usePageConfiguration } from "../services/index.js";


// import entityPublisher from "../../assets/library_model/";
import {
  packageName
} from "../../../constants.js";
import { useQueryTemplateResults } from "../components/Reports/ReportHooks.js";
import { JsonDisplayHelper } from "miroir-react";
import { cleanLevel } from "../constants.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { RunnerList, runnerConfigs } from "../components/Runners/RunnersList.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "HomePage"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export interface RootComponentProps {
}

// function defaultToEntityList(
//   value: string | undefined,
//   miroirReports: Report[]
// ): string | undefined {
//   return value
//     ? (value as string)
//     : miroirReports.find((r) => r.name == "EntityList")
//     ? "EntityList"
//     : undefined;
// }

// const metaModelReports = [
//   reportEntityList.uuid,
//   reportEntityDefinitionList.uuid,
//   reportEntityDetails.uuid,
//   reportEntityDefinitionDetails.uuid,
// ];



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


  // log.info("HomePage availableReports",availableReports);

  const currentStoredQuery:
    | BoxedQueryWithExtractorCombinerTransformer
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
                extractorOrCombinerType: "extractorByPrimaryKey",
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
      if (!applicationDefinition.homePageUrl) {
        log.warn("HomePage applicationDefinition does not have homePageUrl defined, staying on HomePage", { applicationDefinition });
      } else {
        if (typeof applicationDefinition.homePageUrl === "string") {
          navigate(applicationDefinition.homePageUrl);
        } else {
          const homepageUrl = `/report/${applicationDefinition.homePageUrl.selfApplication}/${
              currentApplicationDeploymentMap[applicationDefinition.homePageUrl.selfApplication]
            }/${applicationDefinition.homePageUrl.section}/${applicationDefinition.homePageUrl.reportUuid}/${applicationDefinition.homePageUrl.instanceUuid ?? "xxxxxx"}`
          log.info("HomePage navigating to homePageUrl", { homepageUrl, applicationDefinition });
          navigate(homepageUrl);
        }
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
      <JsonDisplayHelper debug={true}
        componentName="HomePage"
        elements={[{
          label: `HomePage application: ${currentApplication} section: ${displayedApplicationSection}`,
          data: {
            currentAppModel,
            currentStoredQuery,
            currentStoredQueryResults,
            toolsPageState: context.toolsPageState,
            currentApplicationDeploymentMap,
            applicationDefinition,
          },
          copyButton: true,
          useCodeBlock: true,
        }]}
      />
      {/* undo */}
      {/* <span>
        <button
          onClick={async () => {
            await domainController.handleActionFromUI({
              actionType: "undo",
              endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
              payload: {
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
              endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
              payload: {
                deploymentUuid: deployment_Miroir.uuid,
              }
            }, currentApplicationDeploymentMap, defaultMiroirModelEnvironment);
          }}
        >
          Redo
        </button>
      </span> */}
      <RunnerList config={runnerConfigs} applicationDeploymentMap={currentApplicationDeploymentMap} />
    </PageContainer>
  );
};
