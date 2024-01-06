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
  FetchedData,
  LoggerInterface,
  MetaEntity,
  MiroirApplicationModel,
  MiroirFetchQuery,
  MiroirLoggerFactory,
  MiroirSelectQueriesRecord,
  ObjectListReportSection,
  Report,
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
  selectByDomainManyQueriesFromDomainState
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions,
  useMiroirContextService
} from "../../miroir-fwk/4_view/MiroirContextReactProvider";
import { Importer } from './Importer';
import { useCurrentModel, useDomainStateSelector } from "./ReduxHooks";


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
  // log.log("RootComponent deployments",deployments);

  // context utility functions
  const displayedDeploymentUuid = context.deploymentUuid;
  const setDisplayedDeploymentUuid = context.setDeploymentUuid;

  const displayedReportUuid = context.reportUuid;
  const setDisplayedReportUuid = context.setReportUuid;
  const displayedApplicationSection = context.applicationSection;
  const setDisplayedApplicationSection = context.setApplicationSection;

  const miroirMetaModel: MiroirApplicationModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MiroirApplicationModel = useCurrentModel(displayedDeploymentUuid);

  // computing current state #####################################################################
  const displayedDeploymentDefinition:ApplicationDeploymentConfiguration | undefined = deployments.find(d=>d.uuid == displayedDeploymentUuid);
  log.log("HomePage displayedDeploymentDefinition",displayedDeploymentDefinition);
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
  log.log("HomePage currentModel",currentModel);

  // const currentReportDefinitionApplicationSection: ApplicationSection | undefined = 
  //   currentReportDefinitionDeployment?.applicationModelLevel == "metamodel"? 'data':'model'
  ;
  log.log(
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

      log.log("HomePage availableReports",availableReports);

  const currentMiroirReport: Report | undefined = availableReports?.find(r=>r.uuid === displayedReportUuid);
  const currentMiroirReportSectionObjectList: ObjectListReportSection | undefined =
    currentMiroirReport?.definition?.section?.type == "objectListReportSection"? currentMiroirReport?.definition?.section: undefined
  ;
  log.log("HomePage currentMiroirReport", currentMiroirReport);
  
  // const currentMiroirReportSectionObjectList: ReportSectionListDefinition | undefined =
  //   currentMiroirReport?.type == "list" &&
  //   currentMiroirReport.definition.length > 0 &&
  //   currentMiroirReport?.definition[0].type == "objectListReportSection"
  //     ? (currentMiroirReport?.definition[0] as ReportSectionList).definition
  //     : undefined
  // ;
  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList
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
    log.log('handleChangeDisplayedDeployment',event);
    setDisplayedDeploymentUuid(event.target.value);
    log.log('handleChangeDisplayedDeployment',displayedDeploymentUuid);
    setDisplayedApplicationSection('data');
    setDisplayedReportUuid("");
  };

    // const bundleProducerQuery: MiroirSelectQuery = useMemo(()=>queryVersionBundleProducerV1.definition,[])
    const bundleProducerQuery: DomainManyQueriesWithDeploymentUuid = useMemo(()=>({
      queryType: "DomainManyQueries",
      deploymentUuid: displayedDeploymentUuid,
      applicationSection: displayedApplicationSection??"data",
      fetchQuery: queryVersionBundleProducerV1.definition as MiroirFetchQuery
    }),[displayedDeploymentUuid, displayedApplicationSection])
  
    const producedBundle : FetchedData | undefined = useDomainStateSelector(selectByDomainManyQueriesFromDomainState, bundleProducerQuery);
  
    log.info("producedBundle1",producedBundle)
  

  return (
    <div>
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex' }}> */}
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainTransactionalAction(applicationDeploymentMiroir.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "undo",
            });
          }}
        >
          undo
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainTransactionalAction(applicationDeploymentMiroir.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "redo",
            });
          }}
        >
          Redo
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainTransactionalAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainTransactionalAction",
                actionName: "commit",
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
            await domainController.handleDomainTransactionalAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainTransactionalAction",
                actionName: "commit",
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
            await domainController.handleDomainTransactionalAction(applicationDeploymentMiroir.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "rollback",
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
          //     actionType: "DomainTransactionalAction",
          //     actionName: "resetModel",
          //   });
          //   await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
          //     actionType: "DomainTransactionalAction",
          //     actionName: "resetModel",
          //   });
          //   log.log(
          //     "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETMODEL APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
          //   );
          //   await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
          //     actionType: "DomainTransactionalAction",
          //     actionName: "rollback",
          //   });
          //   await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
          //     actionType: "DomainTransactionalAction",
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
              actionType: "DomainTransactionalAction",
              actionName: "resetData",
            });
            log.log(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETDATA FOR LIBRARY APPLICATION DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "rollback",
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
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "initModel",
              params: {
                dataStoreType: "miroir",
                metaModel: defaultMiroirMetaModel,
                application: applicationMiroir,
                applicationDeploymentConfiguration: applicationDeploymentMiroir,
                applicationModelBranch: applicationModelBranchMiroirMasterBranch,
                applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
                applicationVersion: applicationVersionInitialMiroirVersion,
              },
            });
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "initModel",
              params: {
                dataStoreType: "app",
                metaModel: defaultMiroirMetaModel,
                application: applicationLibrary,
                applicationDeploymentConfiguration: applicationDeploymentLibrary,
                applicationModelBranch: applicationModelBranchLibraryMasterBranch,
                applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
                applicationVersion: applicationVersionLibraryInitialVersion,
              },
            });
            // TODO: transactional action must not autocommit! initModel neither?!
            // .then(
            // async () => {
            log.log(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "rollback",
            });
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "rollback",
            });
            // }
            // );
          }}
        >
          Init database
        </button>
      </span> */}
      <span>
        <button
          onClick={async () => {
            log.log("fetching instances from datastore for deployment", applicationDeploymentMiroir);
            await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "rollback",
            });
            await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
              actionType: "DomainTransactionalAction",
              actionName: "rollback",
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
            await domainController.handleDomainTransactionalAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainTransactionalAction",
                actionName: "updateEntity",
                update: {
                  updateActionName: "WrappedTransactionalEntityUpdate",
                  modelEntityUpdate: {
                    updateActionType: "ModelEntityUpdate",
                    updateActionName: "renameEntity",
                    entityName: entityBook.name,
                    entityUuid: entityBook.uuid,
                    targetValue: "Bookss",
                  },
                },
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
            await domainController.handleDomainTransactionalAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainTransactionalAction",
                actionName: "UpdateMetaModelInstance",
                update: {
                  updateActionType: "ModelCUDInstanceUpdate",
                  updateActionName: "update",
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
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainTransactionalAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainTransactionalAction",
                actionName: "updateEntity",
                update: {
                  updateActionName: "WrappedTransactionalEntityUpdate",
                  modelEntityUpdate: {
                    updateActionType: "ModelEntityUpdate",
                    updateActionName: "DeleteEntity",
                    entityName: entityAuthor.name,
                    entityUuid: entityAuthor.uuid,
                    // instanceUuid:entityAuthor.uuid,
                  },
                },
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
            <div>HomePage reportSection: {JSON.stringify(currentMiroirReport?.definition)}</div>
            <RootReportSectionView
              fetchedData={{}}
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
