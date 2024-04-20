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
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  getDeploymentUuidToReportsEntitiesDefinitionsMapping,
  getLoggerName,
  reportReportList,
  resetAndInitMiroirAndApplicationDatabase
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions,
  useMiroirContextService
} from "../MiroirContextReactProvider";
import { Importer } from '../Importer';
import { useCurrentModel } from "../ReduxHooks";


// import entityPublisher from "../../assets/library_model/";
import { packageName } from "../../../constants";
import { RootReportSectionView } from "../components/RootReportSectionView";
import { cleanLevel } from "../constants";
import { ReportUrlParamKeys } from "./ReportPage";

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


// ###################################################################################
// ###################################################################################
// ###################################################################################
export const HomePage = (props: RootComponentProps) => {
  const context = useMiroirContextService();

  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogService();
  const domainController: DomainControllerInterface = useDomainControllerService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeploymentConfiguration[];
  // log.info("RootComponent deployments",deployments);

  // context utility functions
  const displayedDeploymentUuid = context.deploymentUuid;
  const setDisplayedDeploymentUuid = context.setDeploymentUuid;

  const displayedReportUuid = context.reportUuid;
  const setDisplayedReportUuid = context.setReportUuid;
  const displayedApplicationSection = context.applicationSection;
  const setDisplayedApplicationSection = context.setApplicationSection;

  const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MetaModel = useCurrentModel(displayedDeploymentUuid);

  // computing current state #####################################################################
  const displayedDeploymentDefinition:ApplicationDeploymentConfiguration | undefined = deployments.find(d=>d.uuid == displayedDeploymentUuid);
  log.info("HomePage displayedDeploymentDefinition",displayedDeploymentDefinition);

  const currentModel = displayedDeploymentUuid == applicationDeploymentLibrary.uuid? libraryAppModel:defaultMiroirMetaModel;
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
    () => getDeploymentUuidToReportsEntitiesDefinitionsMapping(miroirMetaModel, libraryAppModel),
    [miroirMetaModel, libraryAppModel]
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
    // const bundleProducerQuery: DomainManyQueriesWithDeploymentUuid = useMemo(()=>({
    //   queryType: "DomainManyQueries",
    //   deploymentUuid: applicationDeploymentMiroir.uuid,
    //   applicationSection: "data",
    //   pageParams: { elementType: "object", elementValue: {} },
    //   contextResults: { elementType: "object", elementValue: {} },
    //   queryParams: { elementType: "object", elementValue: { "applicationVersion": { elementType: "instanceUuid", elementValue: "695826c2-aefa-4f5f-a131-dee46fe21c13" } } },
    //   fetchQuery: queryVersionBundleProducerV1.definition as MiroirFetchQuery
    // }),[miroirMetaModel])
  
    // const producedBundle : DomainElement = useDomainStateCleanSelector(selectByDomainManyQueriesFromDomainState, bundleProducerQuery);
    // // const producedBundle : any = useDomainStateCleanSelector(selectByDomainManyQueriesFromDomainState, getSelectorParams<DomainManyQueriesWithDeploymentUuid>(bundleProducerQuery));
  
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
              deploymentUuid:applicationDeploymentMiroir.uuid
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
              deploymentUuid:applicationDeploymentMiroir.uuid
            });
          }}
        >
          Redo
        </button>
      </span>
      {/* commit miroir */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "modelAction",
                actionName: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid:applicationDeploymentMiroir.uuid,
              },
              defaultMiroirMetaModel
            );
          }}
        >
          Commit Miroir
        </button>
      </span>
      {/* Commit Library app */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction(
              {
                actionType: "modelAction",
                actionName: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid:applicationDeploymentLibrary.uuid,
              },
              defaultMiroirMetaModel
            );
          }}
        >
          Commit Library app
        </button>
      </span>
      {/* rollback */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentMiroir.uuid,
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
            async () =>resetAndInitMiroirAndApplicationDatabase.bind(domainController)
          //   async () => {
          //   await domainController.handleAction({
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "resetModel",
          //   });
          //   await domainController.handleAction({
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "resetModel",
          //   });
          //   log.info(
          //     "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETMODEL APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
          //   );
          //   await domainController.handleAction({
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "rollback",
          //   });
          //   await domainController.handleAction({
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "rollback",
          //   });
          // }
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
              deploymentUuid:applicationDeploymentLibrary.uuid,
            });
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETDATA FOR LIBRARY APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentLibrary.uuid,
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
            log.info("fetching instances from datastore for deployment", applicationDeploymentMiroir);
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentMiroir.uuid,
            });
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentLibrary.uuid,
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
                deploymentUuid:applicationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityName: entityBook.name,
                entityUuid: entityBook.uuid,
                entityDefinitionUuid: entityDefinitionBook.uuid,
                targetValue: "Bookss",
              },
              libraryAppModel
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
                  deploymentUuid: applicationDeploymentMiroir.uuid,
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
                }
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
                deploymentUuid:applicationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityUuid: entityAuthor.uuid,
                entityDefinitionUuid: entityDefinitionAuthor.uuid,
              },
              libraryAppModel // TODO replace with current Miroir model (as existing in the datastore)
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
      <Box>
        <h3>erreurs: {JSON.stringify(errorLog)}</h3>
      </Box>
      {/* <span>packages: {JSON.stringify(ConfigurationService.packages)}</span> */}
      <Importer filename="" currentModel={currentModel} currentDeploymentUuid={displayedDeploymentUuid}></Importer>
      <p />
      <Box sx={{ minWidth: 50 }}>
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
      </Box>
      <p />
      <p />
      <Box sx={{ minWidth: 50 }}>
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
      </Box>
      <p />
      <Box sx={{ minWidth: 50 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={displayedReportUuid}
            label="displayedReportUuid"
            onChange={handleChangeDisplayedReport}
          >
            {availableReports.map((r:Report) => {
              return (
                <MenuItem key={r.name} value={r.uuid}>
                  {r.defaultLabel}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
      {
        currentMiroirReport &&
        displayedDeploymentUuid &&
        displayedApplicationSection ? (
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
        )
        : (
          <div>Oops, HomePage coule not be displayed:
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
        )
      }
      {/* </Box> */}
    </div>
  );
};
