import Box from '@mui/material/Box';
import {
  ApplicationDeployment,
  ApplicationSection,
  DomainControllerInterface,
  EntityDefinition,
  MetaEntity,
  MiroirMetaModel,
  Report,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions
} from "miroir-fwk/4_view/MiroirContextReactProvider";
import { ReduxStateChanges } from "miroir-redux";
import { Params, useParams } from 'react-router-dom';


import { List, ListItem } from '@mui/material';
import { ReportSectionDisplay } from '../ReportSectionDisplay';
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from '../getColumnDefinitionsFromEntityAttributes';

import { JzodElement } from '@miroir-framework/jzod';
import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import { EntityInstanceLink } from '../EntityInstanceLink';
import {
  useLocalCacheDeploymentSectionReportsTOREFACTOR,
  useLocalCacheInstancesForEntityTOREFACTOR,
  useLocalCacheMetaModel,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
} from "../ReduxHooks";

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
  
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogService();
  const domainController: DomainControllerInterface = useDomainControllerService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];



  const libraryAppModel: MiroirMetaModel = useLocalCacheMetaModel(applicationDeploymentLibrary.uuid)();

  // const libraryAppModel: MiroirMetaModel =  {
  //   entities: useLocalCacheSectionEntities(applicationDeploymentLibrary.uuid,'model'),
  //   entityDefinitions: useLocalCacheSectionEntityDefinitions(applicationDeploymentLibrary.uuid,'model'),
  //   reports: useLocalCacheDeploymentSectionReportsTOREFACTOR(applicationDeploymentLibrary.uuid,'model'),
  //   configuration: [],
  //   applicationVersions: [],
  //   applicationVersionCrossEntityDefinition: [],
  // };

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

  const deploymentReports: Report[] = useLocalCacheDeploymentSectionReportsTOREFACTOR(currentReportDefinitionDeployment?.uuid,currentReportDefinitionApplicationSection);
  const currentReportDeploymentSectionEntities: MetaEntity[] = useLocalCacheSectionEntities(currentReportDefinitionDeployment?.uuid,'model'); // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = useLocalCacheSectionEntityDefinitions(currentReportDefinitionDeployment?.uuid,'model'); // EntityDefinitions are always defined in the 'model' section

  console.log("EntityInstancePage currentReportDeploymentSectionEntities",currentReportDeploymentSectionEntities);

  // const currentReportInstancesApplicationSection:ApplicationSection = currentDeploymentDefinition?.applicationModelLevel == "metamodel"? 'data':'model';
  
  // const currentMiroirReport: Report | undefined = deploymentReports?.find(r=>r.uuid === params.reportUuid);
  const currentReportTargetEntity: MetaEntity | undefined = currentReportDeploymentSectionEntities?.find(e=>e?.uuid === params.entityUuid);
  const currentReportTargetEntityDefinition: EntityDefinition | undefined = currentReportDeploymentSectionEntityDefinitions?.find(e=>e?.entityUuid === currentReportTargetEntity?.uuid);
  
  const entityAttributes:{[attributeName: string]: JzodElement} | undefined = currentReportTargetEntityDefinition?.jzodSchema.definition;

  const instancesToDisplay = useLocalCacheInstancesForEntityTOREFACTOR(
    params.deploymentUuid,
    params.applicationSection as ApplicationSection,
    params.entityUuid,
  );

  const instance:any = instancesToDisplay.find(i=>i.uuid == params.instanceUuid)
  const publisherBooks = useLocalCacheInstancesForEntityTOREFACTOR(
    // props.displayedDeploymentDefinition?.uuid,
    params.deploymentUuid,
    // 'data',
    params.applicationSection as ApplicationSection,
    entityBook.uuid,
    // props.tableComponentReportType == "EntityInstance" && props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
  ).filter((b:any)=>b['publisher'] == instance.uuid);

  const authorBooks = useLocalCacheInstancesForEntityTOREFACTOR(
    // props.displayedDeploymentDefinition?.uuid,
    params.deploymentUuid,
    // 'data',
    params.applicationSection as ApplicationSection,
    entityBook.uuid,
    // props.tableComponentReportType == "EntityInstance" && props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
  ).filter((b:any)=>b['author'] == instance.uuid);
  
  console.log('EntityInstancePage publisherBooks',publisherBooks,'authorBooks',authorBooks);
  
  if (params.applicationSection && instance) {
    return (
      <div> 
        {/* params:{JSON.stringify(params)}
        <p /> */}
        <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
        <p />
        <Box>
          <h3>
            erreurs: {JSON.stringify(errorLog)}
          </h3>
  
        </Box>
        <span>
          Entity Instance Attribute Values:
        </span>
          {
            currentReportTargetEntity && currentReportTargetEntityDefinition && params.applicationSection?
              <div>
                <List sx={{ pt: 0}}>
                  {
                    Object.entries(entityAttributes?entityAttributes:{})?.map(
                      (entityAttribute:[string,JzodElement]) => {
                        const currentAttributeDefinition = entityAttribute[1];
                        switch (currentAttributeDefinition.type) {
                          case "array": {
                            const columnDefs:any[]=getColumnDefinitionsFromEntityDefinitionJzodSchema(currentAttributeDefinition.definition);
                            return (
                              <ListItem disableGutters key={entityAttribute[0]}>
                                <span>
                                  <ReportSectionDisplay
                                    tableComponentReportType="JSON_ARRAY"
                                    label={"JSON_ARRAY-"+entityAttribute[0]}
                                    columnDefs={columnDefs}
                                    rowData={instance[entityAttribute[0]]}
                                    styles={
                                      {
                                        width: '50vw',
                                        height: '22vw',
                                      }
                                    }
                                  ></ReportSectionDisplay>
                                </span>
                              </ListItem>
                            )
                            break;
                          }
                          // case "object": {
                          //   const columnDefs:any[]=getColumnDefinitionsFromEntityDefinitionJzodSchema(currentAttributeDefinition.definition);
                          //   return (
                          //     <ListItem disableGutters key={entityAttribute[0]}>
                          //       <span>
                          //         <ReportSectionDisplay
                          //           tableComponentReportType="JSON_ARRAY"
                          //           label={"JSON_ARRAY-"+entityAttribute[0]}
                          //           columnDefs={columnDefs}
                          //           rowData={instance[entityAttribute[0]]}
                          //           styles={
                          //             {
                          //               width: '50vw',
                          //               height: '22vw',
                          //             }
                          //           }
                          //         ></ReportSectionDisplay>
                          //       </span>
                          //     </ListItem>
                          //   )
                          //   break;
                          // }
                          case "simpleType": {
                            // navigate(`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/${targetEntity?.uuid}/${e.data[e.colDef.field]}`);
                            const targetEntityUuid = currentAttributeDefinition.extra?.targetEntity
                            if (entityAttribute[1].definition == "string" && targetEntityUuid) {
                              const targetEntity:MetaEntity| undefined = currentReportDeploymentSectionEntities.find(e=>e.uuid == targetEntityUuid) 
                              return (
                                <ListItem  disableGutters key={entityAttribute[0]}>
                                  {entityAttribute[0]}: 
                                  <EntityInstanceLink
                                    deploymentUuid={params.deploymentUuid as string}
                                    applicationSection={params.applicationSection as ApplicationSection}
                                    entityUuid={targetEntity?.uuid as string}
                                    instanceUuid={instance[entityAttribute[0]]}
                                    label={instance[entityAttribute[0]]}
                                    key={instance[entityAttribute[0]]}
                                  />
                                </ListItem>
                              )
                            } else {
                              
                            }
                          }
                          default: {
                            return (
                              <ListItem disableGutters key={entityAttribute[0]}>
                                {entityAttribute[0]}: {instance[entityAttribute[0]]}
                              </ListItem>
                            )
                            break;
                          }
                        }
                      }
                    )
                  }
                </List>

                {/* { */}
                {/* <div> */}
                <span>
                  Publisher Books:
                </span>
                <List sx={{ pt: 0}}>
                  {
                    publisherBooks?.map(
                      (book:any) => {
                        return (
                          <ListItem disableGutters key={book.name}>
                            {/* {book.name} */}
                            <EntityInstanceLink
                              deploymentUuid={params.deploymentUuid as string}
                              applicationSection={params.applicationSection as ApplicationSection}
                              entityUuid={entityBook.uuid}
                              instanceUuid={book.uuid}
                              label={book.name}
                              key={book.uuid}
                            />
                          </ListItem>
                        )
                      }
                    )
                  }
                  </List>
                <span>
                  Author Books:
                </span>
                <List sx={{ pt: 0}}>
                  {
                    authorBooks?.map(
                      (book:any) => {
                        return (
                          <ListItem disableGutters key={book.name}>
                            {/* {book.name} */}
                            <EntityInstanceLink
                              deploymentUuid={params.deploymentUuid as string}
                              applicationSection={params.applicationSection as ApplicationSection}
                              entityUuid={entityBook.uuid}
                              instanceUuid={book.uuid}
                              label={book.name}
                              key={book.uuid}
                            />
                          </ListItem>
                        )
                      }
                    )
                  }
                  </List>
                {/* } */}
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
