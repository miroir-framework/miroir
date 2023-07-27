import Box from '@mui/material/Box';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  MetaEntity,
  Report,
  ReportSectionList,
  ReportSectionListDefinition,
  applicationDeploymentMiroir
} from "miroir-core";
import {
  useErrorLogService,
  useMiroirContextService
} from "miroir-fwk/4_view/MiroirContextReactProvider";
import { Params, useParams } from 'react-router-dom';


import { useEffect } from 'react';
import { useLocalCacheMetaModel } from '../ReduxHooks';
import { ReportSectionDisplay } from '../ReportSectionDisplay';

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
  const context = useMiroirContextService();

  console.log("ReportPage params", params);
  const setDeploymentUuid = context.setDeploymentUuid;
  useEffect(()=>setDeploymentUuid(params.deploymentUuid ? params.deploymentUuid : ""));

  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogService();
  // const domainController: DomainControllerInterface = useDomainControllerService();

  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == params.deploymentUuid
  );
  console.log("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || params.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  // const currentModel =
  // params.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  // const currentModel = useCallback(()=>useLocalCacheMetaModel(params.deploymentUuid),[params.deploymentUuid]);

  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  console.log(
    "ReportPage currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  // const deploymentReports: Report[] = useLocalCacheDeploymentSectionReportsTOREFACTOR(
  //   currentReportDefinitionDeployment?.uuid,
  //   currentReportDefinitionApplicationSection
  // );
  // console.log('deploymentReports2',deploymentReports);
  
  // const currentReportDeploymentSectionEntities: MetaEntity[] = useLocalCacheSectionEntities(
  //   currentReportDefinitionDeployment?.uuid,
  //   "model"
  // ); // Entities are always defined in the 'model' section
  // const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = useLocalCacheSectionEntityDefinitions(
  //   currentReportDefinitionDeployment?.uuid,
  //   "model"
  // ); // EntityDefinitions are always defined in the 'model' section

  // console.log("ReportPage deploymentReports", deploymentReports);

  // const currentReportInstancesApplicationSection:ApplicationSection = currentDeploymentDefinition?.applicationModelLevel == "metamodel"? 'data':'model';
  const currentModel = useLocalCacheMetaModel(params.deploymentUuid)();

  console.log("ReportPage currentModel", currentModel);

  const currentMiroirReport: Report | undefined = currentModel.reports?.find((r) => r.uuid === params.reportUuid);
  // const currentReportTargetEntity: MetaEntity | undefined = currentReportDeploymentSectionEntities?.find(e=>e?.uuid === currentMiroirReport?.definition?.parentUuid);
  const currentMiroirReportSectionListDefinition: ReportSectionListDefinition | undefined =
    currentMiroirReport?.type == "list" &&
    currentMiroirReport.definition.length > 0 &&
    currentMiroirReport?.definition[0].type == "objectList"
      ? (currentMiroirReport?.definition[0] as ReportSectionList).definition
      : undefined;
  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionListDefinition
    ? currentModel.entities?.find(
        (e) => e?.uuid === currentMiroirReportSectionListDefinition.parentUuid
      )
    : undefined;
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentModel.entityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  if (params.applicationSection) {
    return (
      <div>
        {/* params:{JSON.stringify(params)}
        <p /> */}
        {/* <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
        <p /> */}
        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box>
        {/* <span>packages: {JSON.stringify(ConfigurationService.packages)}</span> */}
        {currentMiroirReport &&
        currentMiroirReportSectionListDefinition &&
        currentReportTargetEntity &&
        currentReportTargetEntityDefinition &&
        params.deploymentUuid &&
        params.applicationSection ? (
          <ReportSectionDisplay
            tableComponentReportType="EntityInstance"
            label={"EntityInstance-" + currentReportTargetEntity?.name}
            currentReportUuid={params.reportUuid?params.reportUuid:""}
            styles={{
              height: "20vw",
              width: "90vw",
            }}
            chosenApplicationSection={params.applicationSection as ApplicationSection}
            displayedDeploymentDefinition={displayedDeploymentDefinition}
            currentModel={currentModel}
            currentMiroirReportSectionListDefinition={currentMiroirReportSectionListDefinition}
            currentMiroirEntity={currentReportTargetEntity}
            currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
          />
        ) : (
          <div>Oops.</div>
        )}
      </div>
    );
  } else {
    return <>Invalid parameters!</>;
  }
};
