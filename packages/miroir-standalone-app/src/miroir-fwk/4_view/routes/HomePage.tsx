import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import { useMemo } from "react";
import { Params } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  ApplicationSection,
  // adminConfigurationDeploymentTest1,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  reportEntityDefinitionDetails,
  reportEntityDefinitionList,
  reportEntityDetails,
  reportEntityList,
  resetAndInitApplicationDeployment,
  SelfApplicationDeploymentConfiguration,
  selfApplicationLibrary,
  selfApplicationMiroir
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import { Importer } from '../Importer.js';
import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions,
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { usePageConfiguration } from "../services/index.js";


// import entityPublisher from "../../assets/library_model/";
import {
  deployments,
  packageName,
  ReportUrlParamKeys
} from "../../../constants.js";
import { cleanLevel } from "../constants.js";


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

  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogService();
  const domainController: DomainControllerInterface = useDomainControllerService();
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Home page configurations loaded successfully",
    actionName: "home page configuration fetch"
  });
  
  // log.info("RootComponent deployments",deployments);

  // context utility functions
  const displayedApplication = context.application;
  const displayedDeploymentUuid = context.deploymentUuid;
  // const setDisplayedDeploymentUuid = context.setDeploymentUuid;

  const displayedReportUuid = context.reportUuid;
  // const setDisplayedReportUuid = context.setReportUuid;
  const displayedApplicationSection = context.applicationSection;
  // const setDisplayedApplicationSection = context.setApplicationSection;

  const currentApplicationDeploymentMap = defaultSelfApplicationDeploymentMap;

  const currentAppModel: MetaModel = useCurrentModel(
    displayedApplication,
    currentApplicationDeploymentMap
  );

  // computing current state #####################################################################
  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == displayedDeploymentUuid
  );
  log.info("HomePage displayedDeploymentDefinition",displayedDeploymentDefinition);

  // TODO: adapt to Admin app deployment!
  const currentModel = displayedDeploymentUuid == adminConfigurationDeploymentMiroir.uuid? defaultMiroirMetaModel:currentAppModel;
  // const currentModel = libraryAppModel;
  log.info("HomePage currentModel",currentModel);

  // const currentReportDefinitionApplicationSection: ApplicationSection | undefined = 
  //   currentReportDefinitionDeployment?.applicationModelLevel == "metamodel"? 'data':'model'
  ;
  log.info(
    "HomePage displayedDeploymentDefinition",
    displayedDeploymentDefinition?.uuid,
    "displayedApplicationSection",
    displayedApplicationSection
  );

  // const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
  //   () => (
  //     {
  //       [adminConfigurationDeploymentAdmin.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
  //         adminConfigurationDeploymentAdmin.uuid,
  //         miroirMetaModel, 
  //         adminAppModel,
  //       ),
  //       [adminConfigurationDeploymentMiroir.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
  //         adminConfigurationDeploymentMiroir.uuid,
  //         miroirMetaModel, 
  //         miroirMetaModel, 
  //       ),
  //       [adminConfigurationDeploymentLibrary.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
  //         adminConfigurationDeploymentLibrary.uuid,
  //         miroirMetaModel, 
  //         libraryAppModel,
  //       ),
  //       // [adminConfigurationDeploymentTest1.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
  //       //   adminConfigurationDeploymentTest1.uuid,
  //       //   miroirMetaModel, 
  //       //   test1AppModel,
  //       // ),
  //       // [adminConfigurationDeploymentTest4.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
  //       //   adminConfigurationDeploymentTest4.uuid,
  //       //   miroirMetaModel, 
  //       //   test4AppModel,
  //       // ),
  //       [adminConfigurationDeploymentParis.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
  //         adminConfigurationDeploymentParis.uuid,
  //         miroirMetaModel, 
  //         parisAppModel,
  //       ),
  //     }
  //   ),
  //   // [miroirMetaModel, libraryAppModel, adminAppModel, test1AppModel, test4AppModel, parisAppModel]
  //   [miroirMetaModel, libraryAppModel, adminAppModel, parisAppModel]
  // );

  // useEffect(() =>
  //   context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(deploymentUuidToReportsEntitiesDefinitionsMapping)
  // );

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
          displayedApplicationSection??"data"
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    displayedApplicationSection,
  ]);
    
  log.info("HomePage availableReports",availableReports);

  const currentMiroirReport: Report | undefined = availableReports?.find((r: Report)=>r.uuid === displayedReportUuid);

  const pageParams:Params<ReportUrlParamKeys> = useMemo(
    () => (
      {
        application: displayedApplication,
        deploymentUuid:displayedDeploymentUuid,
        applicationSection:displayedApplicationSection,
        reportUuid:currentMiroirReport?.uuid,
        instanceUuid: "undefined"
      } as Params<ReportUrlParamKeys>
    ),
    [currentMiroirReport, displayedApplication, displayedApplicationSection, displayedDeploymentUuid]
  )

  // const handleChangeDisplayedReport = (event: SelectChangeEvent) => {
  //   event.stopPropagation();
  //   const reportUuid = defaultToEntityList(event.target.value, availableReports);
  //   setDisplayedReportUuid(reportUuid?reportUuid:'');
  // };

  // const handleChangeDisplayedApplicationSection = (event: SelectChangeEvent) => {
  //   event.stopPropagation();
  //   setDisplayedApplicationSection(event.target.value as ApplicationSection);
  //   setDisplayedReportUuid("");
  // };

  // const handleChangeDisplayedDeployment = (event: SelectChangeEvent) => {
  //   event.stopPropagation();
  //   log.info('handleChangeDisplayedDeployment',event);
  //   setDisplayedDeploymentUuid(event.target.value);
  //   log.info('handleChangeDisplayedDeployment',displayedDeploymentUuid);
  //   setDisplayedApplicationSection('data');
  //   setDisplayedReportUuid("");
  // };

    // // const bundleProducerQuery: QueryTemplate = useMemo(()=>queryVersionBundleProducerV1.definition,[])
    // const bundleProducerQuery: BoxedQueryTemplateWithExtractorCombinerTransformer = useMemo(()=>({
    //   queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    //   deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    //   applicationSection: "data",
    //   pageParams: { elementType: "object", elementValue: {} },
    //   contextResults: { elementType: "object", elementValue: {} },
    //   queryParams: { elementType: "object", elementValue: { "applicationVersion": { elementType: "instanceUuid", elementValue: "695826c2-aefa-4f5f-a131-dee46fe21c13" } } },
    //   extractors: queryVersionBundleProducerV1.definition as ExtractorOrCombinerTemplateRecord
    // }),[miroirMetaModel])
  
    // const producedBundle : Domain2QueryReturnType<DomainElementSuccess> = useDomainStateCleanSelector(runQueryTemplateFromDomainState, bundleProducerQuery);
    // // const producedBundle : any = useDomainStateCleanSelector(runQueryTemplateFromDomainState, getExtractorRunnerParamsForDomainState<BoxedQueryTemplateWithExtractorCombinerTransformer>(bundleProducerQuery));
  
    // log.info("producedBundle1",producedBundle)
  

  return (
    <PageContainer
      withSidebar={true}
      withDocumentOutline={false} // HomePage typically doesn't have document outline
      customSx={{
        // HomePage specific styling
        backgroundColor: 'background.default',
        '& button': {
          margin: 1,
          maxWidth: '100%',
          wordWrap: 'break-word',
        },
      }}
    >
      <h2>Welcome to the Miroir Platform!</h2>
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
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
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
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              }
            }, currentApplicationDeploymentMap, defaultMiroirModelEnvironment);
          }}
        >
          Redo
        </button>
      </span> */}
      {/* rollback */}
      {/* <p /> */}
      {/* Reset SelfApplication database */}
      {/* <span>
        <button
          onClick={async () =>
            resetAndInitApplicationDeployment.bind(domainController, [
              adminConfigurationDeploymentLibrary,
              adminConfigurationDeploymentMiroir,
            ] as any)
          }
        >
          Reset SelfApplication database
        </button>
      </span> */}
      {/* Reset Library SelfApplication Data */}
      <span>
        {/* <button
          onClick={async () => {
            await domainController.handleActionFromUI(
              {
                actionType: "resetData",
                application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: selfApplicationLibrary.uuid,
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              currentApplicationDeploymentMap,
              defaultMiroirModelEnvironment
            );
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETDATA FOR LIBRARY APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleActionFromUI(
              {
                actionType: "rollback",
                application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  application: selfApplicationLibrary.uuid,
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              currentApplicationDeploymentMap,
              defaultMiroirModelEnvironment
            );
          }}
        >
          Reset Library SelfApplication Data
        </button> */}
      </span>
      {/* <p /> */}
      {/* <span>
        <button
          onClick={async () => {
            log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
            await domainController.handleActionFromUI({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
            });
            await domainController.handleActionFromUI({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
            });
          }}
        >
          fetch Miroir & App configurations from database
        </button>
      </span> */}
      {/* <p />
      <span>
        <button
          onClick={async () => {
            await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
          }}
        >
          upload App configuration to database
        </button>
      </span> */}
      <p />
      {/* <span>cache size: {JSON.stringify(domainController.currentLocalCacheInfo())}</span> */}
      {/* <Importer
        filename=""
        currentModel={currentModel}
        // currentDeploymentUuid={adminConfigurationDeploymentTest1.uuid}
        // currentDeploymentUuid="f97cce64-78e9-419f-a4bd-5cbf52833ede" // test4
        // currentDeploymentUuid="3d15b8c8-a74c-48ce-81d5-c76853803b90" // Paris
        currentDeploymentUuid={adminConfigurationDeploymentLibrary.uuid}
        // currentApplicationUuid={test1SelfApplication.uuid}
        // currentApplicationUuid="478d3a5d-d866-41c8-944c-121aca3ab87f" // test4
        // currentApplicationUuid="2c1d14d5-691f-42cf-9850-887122170a43" // Paris
        currentApplicationUuid={selfApplicationLibrary.uuid} 
      ></Importer> */}
    </PageContainer>
  );
};
