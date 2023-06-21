import Box from '@mui/material/Box';
import { Params, useNavigate, useParams } from 'react-router-dom';
import {
  ApplicationDeployment,
  ApplicationSection,
  ConfigurationService,
  DomainControllerInterface,
  EntityDefinition,
  MetaEntity,
  MiroirMetaModel,
  Report,
  Uuid,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import { useDomainControllerServiceHook, useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import {
  useLocalCacheDeploymentSectionReports,
  useLocalCacheInstancesForEntity,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheTransactions
} from "miroir-fwk/4_view/hooks";
import { ReduxStateChanges } from "miroir-redux";


import { ReportComponent } from '../ReportComponent';
import { List, ListItem, ListItemButton } from '@mui/material';
import { getColumnDefinitions } from '../EntityViewer';

// duplicated from server!!!!!!!!
const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
  "applicationModelLevel": "model",
  "model": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  },
  "data": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  }
}

export interface ReportPageProps {
  // deploymentUuid: Uuid,
  // store:any;
  // reportName: string;
}

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const EntityInstancePage = (props: ReportPageProps) => {
  const params = useParams<any>() as Readonly<Params<EntityInstanceUrlParamKeys>>;
  // const params = useParams<ReportUrlParams>();
  console.log('ReportPage params',params);
  
  const navigate = useNavigate();

  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogServiceHook();
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];

  const libraryAppModel: MiroirMetaModel =  {
    entities: useLocalCacheSectionEntities(applicationDeploymentLibrary.uuid,'model'),
    entityDefinitions: useLocalCacheSectionEntityDefinitions(applicationDeploymentLibrary.uuid,'model'),
    reports: useLocalCacheDeploymentSectionReports(applicationDeploymentLibrary.uuid,'model'),
    configuration: [],
    applicationVersions: [],
    applicationVersionCrossEntityDefinition: [],
  };

  // computing current state #####################################################################
  const displayedDeploymentDefinition:ApplicationDeployment | undefined = deployments.find(d=>d.uuid == params.deploymentUuid);
  console.log("ReportPage displayedDeploymentDefinition",displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined = 
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || params.applicationSection =='model'? 
      applicationDeploymentMiroir as ApplicationDeployment
      :
      displayedDeploymentDefinition
  ;

  const currentModel = params.deploymentUuid == applicationDeploymentLibrary.uuid? libraryAppModel:defaultMiroirMetaModel;
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined = 
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel"? 'data':'model'
  ;
  console.log("ReportPage currentReportDefinitionDeployment",currentReportDefinitionDeployment,'currentReportDefinitionApplicationSection',currentReportDefinitionApplicationSection);

  const deploymentReports: Report[] = useLocalCacheDeploymentSectionReports(currentReportDefinitionDeployment?.uuid,currentReportDefinitionApplicationSection);
  const currentReportDeploymentSectionEntities: MetaEntity[] = useLocalCacheSectionEntities(currentReportDefinitionDeployment?.uuid,'model'); // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = useLocalCacheSectionEntityDefinitions(currentReportDefinitionDeployment?.uuid,'model'); // EntityDefinitions are always defined in the 'model' section

  console.log("EntityInstancePage currentReportDeploymentSectionEntities",currentReportDeploymentSectionEntities);

  // const currentReportInstancesApplicationSection:ApplicationSection = currentDeploymentDefinition?.applicationModelLevel == "metamodel"? 'data':'model';
  
  // const currentMiroirReport: Report | undefined = deploymentReports?.find(r=>r.uuid === params.reportUuid);
  const currentReportTargetEntity: MetaEntity | undefined = currentReportDeploymentSectionEntities?.find(e=>e?.uuid === params.entityUuid);
  const currentReportTargetEntityDefinition: EntityDefinition | undefined = currentReportDeploymentSectionEntityDefinitions?.find(e=>e?.entityUuid === currentReportTargetEntity?.uuid);
  
  const entityAttributes = currentReportTargetEntityDefinition?.attributes;

  const instancesToDisplay = useLocalCacheInstancesForEntity(
    params.deploymentUuid,
    params.applicationSection as ApplicationSection,
    params.entityUuid,
  );

  const instance:any = instancesToDisplay.find(i=>i.uuid == params.instanceUuid)
  if (params.applicationSection && instance) {
    return (
      <div> 
        params:{JSON.stringify(params)}
        <p />
        {/* <span>
            <button
              onClick={async () => {
                console.log("fetching instances from datastore for deployment",applicationDeploymentMiroir)
                await domainController.handleDomainAction(
                  applicationDeploymentMiroir.uuid,
                  {
                    actionType: "DomainTransactionalAction",
                    actionName: "rollback",
                  }
                );
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  {
                    actionType: "DomainTransactionalAction",
                    actionName: "rollback",
                  }
                );
              }
            }
            >
              fetch Miroir & App configurations from database
            </button>
          </span>
        <p /> */}
        <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
        <p />
        <Box>
          <h3>
            erreurs: {JSON.stringify(errorLog)}
          </h3>
  
        </Box>
        {/* <span>packages: {JSON.stringify(ConfigurationService.packages)}</span> */}

          {
            currentReportTargetEntity && currentReportTargetEntityDefinition && params.applicationSection?
              <div>
                <List sx={{ pt: 0}}>
                  {
                    entityAttributes?.map(
                      (entityAttribute) => {
                        switch (entityAttribute.type) {
                          case "ARRAY": {
                            const columnDefs:any[]=getColumnDefinitions(entityAttribute.lineFormat);
                            return (
                              <ListItem disableGutters key={entityAttribute.name}>
                                <span>
                                  <ReportComponent
                                    tableComponentReportType="JSON_ARRAY"
                                    label={"JSON_ARRAY-"+entityAttribute.name}
                                    columnDefs={columnDefs}
                                    rowData={instance[entityAttribute.name]}
                                    styles={
                                      {
                                        width: '50vw',
                                        height: '22vw',
                                      }
                                    }
                                  ></ReportComponent>
                                </span>
                              </ListItem>
                            )
                            break;
                          }
                          case "ENTITY_INSTANCE_UUID": {
                            // navigate(`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/${targetEntity?.uuid}/${e.data[e.colDef.field]}`);
                            const targetEntity:MetaEntity| undefined = currentReportDeploymentSectionEntities.find(e=>e.name == entityAttribute.defaultLabel) 
                            // const targetObject = 
                            return (
                              <ListItemButton disableGutters key={entityAttribute.name} onClick={()=>{
                                // const url = `/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`;
                                const url = `/instance/${params.deploymentUuid}/${params.applicationSection}/${targetEntity?.uuid}/${instance[entityAttribute.name]}`;
                                console.log('navigate to url',url);
                                
                                navigate(url)
                                }}>
                                {entityAttribute.name}: {instance[entityAttribute.name]}
                              </ListItemButton>
                            )
                          }

                          default: {
                            return (
                              <ListItem disableGutters key={entityAttribute.name}>
                                {entityAttribute.name}: {instance[entityAttribute.name]}
                              </ListItem>
                            )
                            break;
                          }
                        }
                      }
                    )
                  }
                </List>

                {/* <ReportComponent
                  tableComponentReportType="EntityInstance"
                  label={"EntityInstance-"+currentReportTargetEntity?.name}
                  styles={
                    {
                        height: '20vw',
                        width: '90vw',
                      }
                    }
                  chosenApplicationSection={params.applicationSection as ApplicationSection}
                  displayedDeploymentDefinition={displayedDeploymentDefinition}
                  currentModel={currentModel}
                  currentMiroirReport={currentMiroirReport}
                  currentMiroirEntity={currentReportTargetEntity}
                  currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
                /> */}
              </div>

            :
            <div>Oops.</div>
          }
      </div>
    );
  } else {
    return (
      <>
        Invalid parameters!
      </>
    )
  }
};
