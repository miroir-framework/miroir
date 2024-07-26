import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import Box from '@mui/material/Box';
import { useEffect, useMemo } from "react";
import { Params } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  DomainControllerInterface,
  EntityInstance,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentTest1,
  defaultMiroirMetaModel,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  getLoggerName,
  getReportsAndEntitiesDefinitionsForDeploymentUuid,
  reportEntityDefinitionDetails,
  reportEntityDefinitionList,
  reportEntityDetails,
  reportEntityList,
  reportReportList,
  resetAndInitMiroirAndApplicationDatabase
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import { Importer } from '../Importer.js';
import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions,
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";


// import entityPublisher from "../../assets/library_model/";
import { packageName } from "../../../constants.js";
import { RootReportSectionView } from "../components/RootReportSectionView.js";
import { cleanLevel } from "../constants.js";
import {
  ReportUrlParamKeys,
  adminConfigurationDeploymentParis,
  adminConfigurationDeploymentTest4,
  deployments,
  selfApplicationParis,
} from "./ReportPage.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"HomePage");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface RootComponentProps {
  // store:any;
  // reportName: string;
}

function defaultToEntityList(value: string | undefined, miroirReports: Report[]): string | undefined {
  return value ? (value as string) : miroirReports.find((r) => r.name == "EntityList") ? "EntityList" : undefined;
}

const metaModelReports = [reportEntityList.uuid, reportEntityDefinitionList.uuid, reportEntityDetails.uuid, reportEntityDefinitionDetails.uuid];



// ###################################################################################
// ###################################################################################
// ###################################################################################
export const HomePage = (props: RootComponentProps) => {
  const context = useMiroirContextService();

  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogService();
  const domainController: DomainControllerInterface = useDomainControllerService();
  
  // log.info("RootComponent deployments",deployments);

  // context utility functions
  const displayedDeploymentUuid = context.deploymentUuid;
  const setDisplayedDeploymentUuid = context.setDeploymentUuid;

  const displayedReportUuid = context.reportUuid;
  const setDisplayedReportUuid = context.setReportUuid;
  const displayedApplicationSection = context.applicationSection;
  const setDisplayedApplicationSection = context.setApplicationSection;

  const adminAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentAdmin.uuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const currentAppModel: MetaModel = useCurrentModel(displayedDeploymentUuid);
  const libraryAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentLibrary.uuid);

  const test1AppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentTest1.uuid);
  const test4AppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentTest4.uuid);
  const parisAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentParis.uuid);

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
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

  const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
    () => (
      {
        [adminConfigurationDeploymentAdmin.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentAdmin.uuid,
          miroirMetaModel, 
          adminAppModel,
        ),
        [adminConfigurationDeploymentMiroir.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentMiroir.uuid,
          miroirMetaModel, 
          miroirMetaModel, 
        ),
        [adminConfigurationDeploymentLibrary.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentLibrary.uuid,
          miroirMetaModel, 
          libraryAppModel,
        ),
        [adminConfigurationDeploymentTest1.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentTest1.uuid,
          miroirMetaModel, 
          test1AppModel,
        ),
        [adminConfigurationDeploymentTest4.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentTest4.uuid,
          miroirMetaModel, 
          test4AppModel,
        ),
        [adminConfigurationDeploymentParis.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentParis.uuid,
          miroirMetaModel, 
          parisAppModel,
        ),
      }
    ),
    [miroirMetaModel, libraryAppModel, adminAppModel, test1AppModel, test4AppModel, parisAppModel]
  );

  useEffect(() =>
    context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(deploymentUuidToReportsEntitiesDefinitionsMapping)
  );

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
        deploymentUuid:displayedDeploymentUuid,
        applicationSection:displayedApplicationSection,
        reportUuid:currentMiroirReport?.uuid,
        instanceUuid: "undefined"
      } as Params<ReportUrlParamKeys>
    ),
    [currentMiroirReport, displayedApplicationSection, displayedDeploymentUuid]
  )

  const handleChangeDisplayedReport = (event: SelectChangeEvent) => {
    event.stopPropagation();
    const reportUuid = defaultToEntityList(event.target.value, availableReports);
    setDisplayedReportUuid(reportUuid?reportUuid:'');
  };

  const handleChangeDisplayedApplicationSection = (event: SelectChangeEvent) => {
    event.stopPropagation();
    setDisplayedApplicationSection(event.target.value as ApplicationSection);
    setDisplayedReportUuid("");
  };

  const handleChangeDisplayedDeployment = (event: SelectChangeEvent) => {
    event.stopPropagation();
    log.info('handleChangeDisplayedDeployment',event);
    setDisplayedDeploymentUuid(event.target.value);
    log.info('handleChangeDisplayedDeployment',displayedDeploymentUuid);
    setDisplayedApplicationSection('data');
    setDisplayedReportUuid("");
  };

    // // const bundleProducerQuery: MiroirSelectQuery = useMemo(()=>queryVersionBundleProducerV1.definition,[])
    // const bundleProducerQuery: DomainManyExtractors = useMemo(()=>({
    //   queryType: "domainManyExtractors",
    //   deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    //   applicationSection: "data",
    //   pageParams: { elementType: "object", elementValue: {} },
    //   contextResults: { elementType: "object", elementValue: {} },
    //   queryParams: { elementType: "object", elementValue: { "applicationVersion": { elementType: "instanceUuid", elementValue: "695826c2-aefa-4f5f-a131-dee46fe21c13" } } },
    //   fetchQuery: queryVersionBundleProducerV1.definition as MiroirFetchQuery
    // }),[miroirMetaModel])
  
    // const producedBundle : DomainElement = useDomainStateCleanSelector(selectByDomainManyQueriesFromDomainState, bundleProducerQuery);
    // // const producedBundle : any = useDomainStateCleanSelector(selectByDomainManyQueriesFromDomainState, getSelectorParams<DomainManyExtractors>(bundleProducerQuery));
  
    // log.info("producedBundle1",producedBundle)
  

  return (
    <div>
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex' }}> */}
      {/* undo */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction({
              actionType: "undoRedoAction",
              actionName: "undo",
              endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            });
          }}
        >
          undo
        </button>
      </span>
      {/* redo */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction({
              actionType: "undoRedoAction",
              actionName: "redo",
              endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            });
          }}
        >
          Redo
        </button>
      </span>
      {/* commit miroir */}
      {/* <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "modelAction",
                actionName: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              defaultMiroirMetaModel
            );
          }}
        >
          Commit Miroir
        </button>
      </span> */}
      {/* Commit Library app */}
      {/* <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "modelAction",
                actionName: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              defaultMiroirMetaModel
            );
          }}
        >
          Commit Library app
        </button>
      </span> */}
      {/* rollback */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            });
          }}
        >
          Rollback
        </button>
      </span>
      <p />
      {/* Reset Application database */}
      <span>
        <button
          onClick={
            async () => resetAndInitMiroirAndApplicationDatabase.bind(domainController, [adminConfigurationDeploymentLibrary, adminConfigurationDeploymentMiroir] as any)
          }
        >
          Reset Application database
        </button>
      </span>
      {/* Reset Library Application Data */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "resetData",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            });
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETDATA FOR LIBRARY APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            });
          }}
        >
          Reset Library Application Data
        </button>
      </span>
      <p />
      {/* <span>
        <button
          onClick={async () => {
            log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
            });
            await domainController.handleAction({
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
      {/* Modify Book entity name */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "modelAction",
                actionName: "renameEntity",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityName: entityBook.name,
                entityUuid: entityBook.uuid,
                entityDefinitionUuid: entityDefinitionBook.uuid,
                targetValue: "Bookss",
              },
              currentAppModel
            );
          }}
        >
          Modify Book entity name
        </button>
      </span>
      {/* modify report list name */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "transactionalInstanceAction",
                instanceAction: {
                  actionType: "instanceAction",
                  actionName: "updateInstance",
                  applicationSection: "data",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  objects: [
                    {
                      parentName: reportReportList.parentName,
                      parentUuid: reportReportList.parentUuid,
                      applicationSection: "data",
                      instances: [
                        Object.assign({}, reportReportList, {
                          name: "Report2List",
                          defaultLabel: "Modified List of Reports",
                        }) as EntityInstance,
                      ],
                    },
                  ],
                },
              },
              defaultMiroirMetaModel // TODO replace with current Miroir model (as existing in the datastore)
            );
          }}
        >
          Modify Report List name
        </button>
      </span>
      {/* remove author entity */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "modelAction",
                actionName: "dropEntity",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityUuid: entityAuthor.uuid,
                entityDefinitionUuid: entityDefinitionAuthor.uuid,
              },
              currentAppModel // TODO replace with current Miroir model (as existing in the datastore)
            );
          }}
        >
          Remove Author entity
        </button>
      </span>
      <p />
      <div>uuid: {uuidv4()}</div>
      <div>transactions: {JSON.stringify(transactions)}</div>
      <p />
      <span>cache size: {JSON.stringify(domainController.currentLocalCacheInfo())}</span>
      <p />
      <p />
      {/* <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
      <p /> */}
      <span>Applications: {}</span>
      <p />
      <div>
        <h3>erreurs: {JSON.stringify(errorLog)}</h3>
      </div>
      {/* <span>packages: {JSON.stringify(ConfigurationService.packages)}</span> */}
      <Importer
        filename=""
        currentModel={currentModel}
        // currentDeploymentUuid={adminConfigurationDeploymentTest1.uuid}
        // currentDeploymentUuid="f97cce64-78e9-419f-a4bd-5cbf52833ede" // test4
        // currentDeploymentUuid="f1b74341-129b-474c-affa-e910d6cba01d" // Paris
        currentDeploymentUuid={adminConfigurationDeploymentParis.uuid}
        // currentApplicationUuid={test1SelfApplication.uuid}
        // currentApplicationUuid="478d3a5d-d866-41c8-944c-121aca3ab87f" // test4
        // currentApplicationUuid="2c1d14d5-691f-42cf-9850-887122170a43" // Paris
        currentApplicationUuid={selfApplicationParis.uuid} // Paris
      ></Importer>
      <p />
      {/* <Box sx={{ minWidth: 50 }}> */}
      <div>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Chosen application Deployment</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={context.deploymentUuid}
            label="displayedDeploymentUuid"
            onChange={handleChangeDisplayedDeployment}
          >
            {deployments.map((deployment) => {
              return (
                <MenuItem key={deployment.name} value={deployment.uuid}>
                  {deployment.description}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </div>
      <p />
      <p />
      {/* <Box sx={{ minWidth: 50 }}> */}
      <div>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Chosen Application Section</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={displayedApplicationSection}
            label="displayedApplicationSection"
            onChange={handleChangeDisplayedApplicationSection}
          >
            {["model", "data"].map((applicationSection) => {
              return (
                <MenuItem key={applicationSection} value={applicationSection}>
                  {applicationSection}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </div>
      <p />
      {/* <Box sx={{ minWidth: 50 }}> */}
      <div>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={displayedReportUuid}
            label="displayedReportUuid"
            onChange={handleChangeDisplayedReport}
          >
            {availableReports.map((r: Report) => {
              return (
                <MenuItem key={r.name} value={r.uuid}>
                  {r.defaultLabel}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </div>
      {currentMiroirReport && displayedDeploymentUuid && displayedApplicationSection ? (
        <div>
          {/* <div>HomePage reportSection: {JSON.stringify(currentMiroirReport?.definition)}</div> */}
          {/* <div>
              reportUuid: {displayedReportUuid}
            </div> */}
          <RootReportSectionView
            rootReportSection={currentMiroirReport?.definition}
            applicationSection={displayedApplicationSection}
            deploymentUuid={displayedDeploymentUuid}
            pageParams={pageParams}
          />
        </div>
      ) : (
        <div>
          Oops, HomePage coule not be displayed:
          <p>
            currentMiroirReport: {currentMiroirReport?.name}, {currentMiroirReport?.uuid}
          </p>
          {/* <p>
              report section: {JSON.stringify(currentMiroirReportSectionObjectList)}
            </p> */}
          {/* <p>
              currentReportTargetEntity: {currentReportTargetEntity?.name}, {currentReportTargetEntity?.uuid}
            </p> */}
        </div>
      )}
      {/* </Box> */}
    </div>
  );
};
