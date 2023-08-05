import Box from '@mui/material/Box';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  MetaEntity,
  MiroirMetaModel,
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


import { useEffect, useMemo } from 'react';


import { useCurrentModel } from '../ReduxHooks';
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


let count = 0;
// ###############################################################################################################
export const ReportPage = (props: ReportPageProps) => {
  const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  // const [count,setCount] = useState(0)
  const context = useMiroirContextService();

  count++;
  // useEffect(()=>setCount(count+1));
  console.log("ReportPage count",count,"params", params,);
  // const setDeploymentUuid = context.setDeploymentUuid;
  useEffect(()=>context.setDeploymentUuid(params.deploymentUuid ? params.deploymentUuid : ""));

  const errorLog = useErrorLogService();

  const deployments = useMemo(()=>[applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[],[]);

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == params.deploymentUuid
  );

  const currentModel: MiroirMetaModel = useCurrentModel(params.deploymentUuid);


  console.log("ReportPage currentModel", currentModel);

  const currentMiroirReport: Report | undefined = currentModel.reports?.find((r) => r.uuid === params.reportUuid);

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

  const styles = useMemo(()=>({
    height: "280px",
    width: "90vw",
  }),[])

  if (params.applicationSection) {
    console.log("ReportPage rendering count",count,"params", params,);
    return (
      <div>
        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box>
        <span>ReportPage displayed:{count}</span>
        {
          // currentMiroirReport &&
          currentMiroirReportSectionListDefinition &&
          currentReportTargetEntity &&
          currentReportTargetEntityDefinition &&
          params.deploymentUuid &&
          params.applicationSection 
          ? (
            // <span>Voila! {JSON.stringify(currentMiroirReport)}</span>
            <ReportSectionDisplay
              tableComponentReportType="EntityInstance"
              label={"EntityInstance-" + currentReportTargetEntity?.name}
              currentReportUuid={params.reportUuid?params.reportUuid:""}
              styles={styles}
              chosenApplicationSection={params.applicationSection as ApplicationSection}
              displayedDeploymentDefinition={displayedDeploymentDefinition}
              currentModel={currentModel}
              currentMiroirReportSectionListDefinition={currentMiroirReportSectionListDefinition}
              currentMiroirEntity={currentReportTargetEntity}
              currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
            />
          ) : (
            <div>Oops.</div>
          )
        }
      </div>
    );
  } else {
    return <>Invalid parameters!</>;
  }
};
