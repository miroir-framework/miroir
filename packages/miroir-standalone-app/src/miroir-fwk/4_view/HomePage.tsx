import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from "@mui/material";
import Box from '@mui/material/Box';
import { useMemo } from "react";

import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  DomainControllerInterface,
  DomainManyQueriesWithDeploymentUuid,
  EntityDefinition,
  EntityInstance,
  LoggerInterface,
  MetaEntity,
  MiroirFetchQuery,
  MiroirLoggerFactory,
  ObjectListReportSection,
  Report,
  DomainElement,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  entityAuthor,
  entityBook,
  getLoggerName,
  queryVersionBundleProducerV1,
  reportEntityDefinitionList,
  reportEntityList,
  reportReportList,
  resetAndInitMiroirAndApplicationDatabase,
  selectByDomainManyQueriesFromDomainState,
  MetaModel,
  Entity,
  entityDefinitionBook,
  entityDefinitionAuthor
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions,
  useMiroirContextService
} from "../../miroir-fwk/4_view/MiroirContextReactProvider";
import { Importer } from './Importer';
import { useCurrentModel, useDomainStateCleanSelector, useDomainStateSelector } from "./ReduxHooks";


// import entityPublisher from "../../assets/library_model/";
import { packageName } from "../../constants";
import { RootReportSectionView } from "./RootReportSectionView";
import { cleanLevel } from "./constants";

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
  // const currentReportDefinitionDeployment: ApplicationDeploymentConfiguration | undefined = displayedDeploymentDefinition
  // ;
  // const currentReportDefinitionDeployment: ApplicationDeploymentConfiguration | undefined = 
  //   displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || displayedApplicationSection =='model'? 
  //     applicationDeploymentMiroir as ApplicationDeploymentConfiguration
  //     :
  //     displayedDeploymentDefinition
  // ;

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

  const mapping = useMemo(() => ({ // displayedDeploymentDefinition, displayedApplicationSection
    [applicationDeploymentMiroir.uuid]: {
      "model": {
        availableReports: miroirMetaModel.reports.filter(
          (r) => [reportEntityList.uuid, reportEntityDefinitionList.uuid].includes(r.uuid)
          ),
          entities: miroirMetaModel.entities,
          entityDefinitions: miroirMetaModel.entityDefinitions,
        },
      "data": {
        availableReports: miroirMetaModel.reports.filter(
          (r) => ![reportEntityList.uuid, reportEntityDefinitionList.uuid].includes(r.uuid)
        ),
        entities: miroirMetaModel.entities,
        entityDefinitions: miroirMetaModel.entityDefinitions,
      },
    },
    [applicationDeploymentLibrary.uuid]: {
      "model": {
        availableReports: miroirMetaModel.reports,
        entities: miroirMetaModel.entities,
        entityDefinitions: miroirMetaModel.entityDefinitions,
      },
      "data": {
        availableReports: libraryAppModel.reports,
        entities: libraryAppModel.entities,
        entityDefinitions: libraryAppModel.entityDefinitions,
      },
    },
  }), [miroirMetaModel, libraryAppModel]);

  const { availableReports, entities, entityDefinitions } =
    displayedDeploymentDefinition && displayedApplicationSection
      ? mapping[displayedDeploymentDefinition?.uuid][displayedApplicationSection]
      : { availableReports: [], entities: [], entityDefinitions: [] };

      log.info("HomePage availableReports",availableReports);

  const currentMiroirReport: Report | undefined = availableReports?.find(r=>r.uuid === displayedReportUuid);
  const currentMiroirReportSectionObjectList: ObjectListReportSection | undefined =
    currentMiroirReport?.definition?.section?.type == "objectListReportSection"? currentMiroirReport?.definition?.section: undefined
  ;
  log.info("HomePage currentMiroirReport", currentMiroirReport);
  
  // const currentMiroirReportSectionObjectList: ReportSectionListDefinition | undefined =
  //   currentMiroirReport?.type == "list" &&
  //   currentMiroirReport.definition.length > 0 &&
  //   currentMiroirReport?.definition[0].type == "objectListReportSection"
  //     ? (currentMiroirReport?.definition[0] as ReportSectionList).definition
  //     : undefined
  // ;
  const currentReportTargetEntity: Entity | undefined = currentMiroirReportSectionObjectList
    ? entities?.find(
        (e) => e?.uuid === currentMiroirReportSectionObjectList.definition?.parentUuid
      )
    : undefined;
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);
  
  const handleChangeDisplayedReport = (event: SelectChangeEvent) => {
    event.stopPropagation();
    const reportUuid = defaultToEntityList(event.target.value, availableReports);
    setDisplayedReportUuid(reportUuid?reportUuid:'');
  };

  const handleChangeDisplayedApplicationSection = (event: SelectChangeEvent) => {
    event.stopPropagation();
    setDisplayedApplicationSection(event.target.value as ApplicationSection|undefined);
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

    // const bundleProducerQuery: MiroirSelectQuery = useMemo(()=>queryVersionBundleProducerV1.definition,[])
    const bundleProducerQuery: DomainManyQueriesWithDeploymentUuid = useMemo(()=>({
      queryType: "DomainManyQueries",
      deploymentUuid: applicationDeploymentMiroir.uuid,
      applicationSection: "data",
      pageParams: { elementType: "object", elementValue: {} },
      contextResults: { elementType: "object", elementValue: {} },
      queryParams: { elementType: "object", elementValue: { "applicationVersion": { elementType: "instanceUuid", elementValue: "695826c2-aefa-4f5f-a131-dee46fe21c13" } } },
      fetchQuery: queryVersionBundleProducerV1.definition as MiroirFetchQuery
    }),[miroirMetaModel])
  
    // const producedBundle : DomainElement = useDomainStateSelector(selectByDomainManyQueriesFromDomainState, bundleProducerQuery);
    const producedBundle : any = useDomainStateCleanSelector(selectByDomainManyQueriesFromDomainState, bundleProducerQuery);
  
    log.info("producedBundle1",producedBundle)
  

  return (
    <div>
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex' }}> */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentLibrary.uuid,
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
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
      <span>
        <button
          onClick={
            resetAndInitMiroirAndApplicationDatabase.bind(domainController)
          //   async () => {
          //   await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "resetModel",
          //   });
          //   await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "resetModel",
          //   });
          //   log.info(
          //     "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETMODEL APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
          //   );
          //   await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "rollback",
          //   });
          //   await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
          //     actionType: "DomainTransactionalInstanceAction",
          //     actionName: "rollback",
          //   });
          // }
        }
        >
          Reset Application database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
              actionType: "modelAction",
              actionName: "resetData",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentLibrary.uuid,
            });
            log.info(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETDATA FOR LIBRARY APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
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
      <span>
        <button
          onClick={async () => {
            log.info("fetching instances from datastore for deployment", applicationDeploymentMiroir);
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentMiroir.uuid,
            });
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
              actionType: "modelAction",
              actionName: "rollback",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid:applicationDeploymentLibrary.uuid,
            });
          }}
        >
          fetch Miroir & App configurations from database
        </button>
      </span>
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentLibrary.uuid,
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainTransactionalInstanceAction",
                actionName: "UpdateMetaModelInstance",
                instanceAction: {
                  actionType: "instanceAction",
                  actionName: "createInstance",
                  applicationSection: "model",
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
                // update: {
                //   actionType: "EntityInstanceTransactionalCUDUpdate",
                //   actionName: "update",
                //   objects: [
                //     {
                //       parentName: reportReportList.parentName,
                //       parentUuid: reportReportList.parentUuid,
                //       applicationSection: "data",
                //       instances: [
                //         Object.assign({}, reportReportList, {
                //           name: "Report2List",
                //           defaultLabel: "Modified List of Reports",
                //         }) as EntityInstance,
                //       ],
                //     },
                //   ],
                // },
              },
              defaultMiroirMetaModel // TODO replace with current Miroir model (as existing in the datastore)
            );
          }}
        >
          Modify Report List name
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentLibrary.uuid,
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
      <span>transactions: {JSON.stringify(transactions)}</span>
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
            {availableReports.map((r) => {
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
            <RootReportSectionView
              reportSection={currentMiroirReport?.definition}
              applicationSection={displayedApplicationSection}
              deploymentUuid={displayedDeploymentUuid}
            />
          </div>
        )
        : (
          <div>Oops.
            <p>
              currentMiroirReport: {currentMiroirReport?.name}, {currentMiroirReport?.uuid}
            </p>
            <p>
              report section: {JSON.stringify(currentMiroirReportSectionObjectList)}
            </p>
            <p>
              currentReportTargetEntity: {currentReportTargetEntity?.name}, {currentReportTargetEntity?.uuid}
            </p>
          </div>
        )
      }
      {/* </Box> */}
    </div>
  );
};
