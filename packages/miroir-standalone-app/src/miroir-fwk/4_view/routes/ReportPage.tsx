import Box from '@mui/material/Box';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  MetaEntity,
  MiroirApplicationModel,
  ObjectList,
  Report,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  report
} from "miroir-core";
import {
  useErrorLogService,
  useMiroirContextService
} from "miroir-fwk/4_view/MiroirContextReactProvider";
import { Params, useParams } from 'react-router-dom';


import { useEffect, useMemo } from 'react';


import { useCurrentModel } from '../ReduxHooks';
import { ReportSectionListDisplay } from '../ReportSectionListDisplay';
import { ReportSectionEntityInstance } from '../ReportSectionEntityInstance';

export interface ReportPageProps {
  // deploymentUuid: Uuid,
  // store:any;
  // reportName: string;
}

export type ReportUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'reportUuid' | 'instanceUuid';


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

  const currentModel: MiroirApplicationModel = useCurrentModel(params.deploymentUuid);


  console.log("ReportPage currentModel", currentModel);

  const currentMiroirReport: Report | undefined = currentModel.reports?.find((r) => r.uuid === params.reportUuid);

  const currentMiroirReportSectionObjectList: ObjectList | undefined =
    currentMiroirReport?.definition?.type == "objectList"
      ? currentMiroirReport?.definition
      : undefined;
  // const currentMiroirReportSectionObjectList: ReportSectionListDefinition | undefined =
  //   currentMiroirReport?.definition.type == "list" &&
  //   currentMiroirReport?.definition.definition.length > 0 &&
  //   currentMiroirReport?.definition[0].type == "objectList"
  //     ? (currentMiroirReport?.definition[0] as ReportSectionList).definition
  //     : undefined;
  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList
    ? currentModel.entities?.find(
        (e) => e?.uuid === currentMiroirReportSectionObjectList.definition.parentUuid
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
          currentMiroirReportSectionObjectList &&
          currentReportTargetEntity &&
          currentReportTargetEntityDefinition &&
          params.deploymentUuid &&
          params.applicationSection 
          ? (
            // <span>Voila! {JSON.stringify(currentMiroirReport)}</span>
              params.instanceUuid
              ? <ReportSectionEntityInstance
                applicationSection={params.applicationSection as ApplicationSection}
                deploymentUuid={params.deploymentUuid}
                entityUuid={currentReportTargetEntity.uuid}
                instanceUuid={params.instanceUuid}

                  // tableComponentReportType="EntityInstance"
                  // label={"EntityInstance-" + currentReportTargetEntity?.name}
                  // currentReportUuid={params.reportUuid?params.reportUuid:""}
                  // styles={styles}
                  // chosenApplicationSection={params.applicationSection as ApplicationSection}
                  // displayedDeploymentDefinition={displayedDeploymentDefinition}
                  // currentModel={currentModel}
                  // currentMiroirReportSectionObjectList={currentMiroirReportSectionObjectList}
                  // currentMiroirEntity={currentReportTargetEntity}
                  // currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
                />
              : <ReportSectionListDisplay
                  tableComponentReportType="EntityInstance"
                  label={"EntityInstance-" + currentReportTargetEntity?.name}
                  currentReportUuid={params.reportUuid?params.reportUuid:""}
                  styles={styles}
                  chosenApplicationSection={params.applicationSection as ApplicationSection}
                  displayedDeploymentDefinition={displayedDeploymentDefinition}
                  currentModel={currentModel}
                  currentMiroirReportSectionObjectList={currentMiroirReportSectionObjectList}
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
