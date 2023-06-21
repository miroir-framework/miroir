import Box from '@mui/material/Box';
import { Params, useParams } from 'react-router-dom';
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
import { useDomainControllerServiceHook, useErrorLogServiceHook, useMiroirContextSetDeploymentUuid } from "miroir-fwk/4_view/MiroirContextReactProvider";
import {
  useLocalCacheDeploymentSectionReports,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheTransactions
} from "miroir-fwk/4_view/hooks";
import { ReduxStateChanges } from "miroir-redux";


import { ReportComponent } from '../ReportComponent';

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

export type ReportUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'reportUuid';


// ###############################################################################################################
export const ReportPage = (props: ReportPageProps) => {
  const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  console.log('ReportPage params',params);
  const setDeploymentUuid = useMiroirContextSetDeploymentUuid()
  setDeploymentUuid(params.deploymentUuid?params.deploymentUuid:'');

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

  console.log("ReportPage deploymentReports",deploymentReports);

  // const currentReportInstancesApplicationSection:ApplicationSection = currentDeploymentDefinition?.applicationModelLevel == "metamodel"? 'data':'model';
  
  const currentMiroirReport: Report | undefined = deploymentReports?.find(r=>r.uuid === params.reportUuid);
  const currentReportTargetEntity: MetaEntity | undefined = currentReportDeploymentSectionEntities?.find(e=>e?.uuid === currentMiroirReport?.definition?.parentUuid);
  const currentReportTargetEntityDefinition: EntityDefinition | undefined = currentReportDeploymentSectionEntityDefinitions?.find(e=>e?.entityUuid === currentReportTargetEntity?.uuid);
  
  if (params.applicationSection) {
    return (
      <div> 
        {/* params:{JSON.stringify(params)}
        <p /> */}
        {/* <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
        <p /> */}
        <Box>
          <h3>
            erreurs: {JSON.stringify(errorLog)}
          </h3>
  
        </Box>
        {/* <span>packages: {JSON.stringify(ConfigurationService.packages)}</span> */}
          {
            currentMiroirReport && currentReportTargetEntity && currentReportTargetEntityDefinition && params.applicationSection?
              <ReportComponent
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
              />
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
