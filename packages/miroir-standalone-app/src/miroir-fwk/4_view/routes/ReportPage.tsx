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
import { ReportSection } from '../ReportSection';

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


  // const currentReportTargetEntityDefinition: EntityDefinition | undefined =
  //   currentModel.entityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);


  if (params.applicationSection) {
    console.log("ReportPage rendering count",count,"params", params,);
    return (
      <div>
                {/* <span>reports: {JSON.stringify(deploymentReports.map((r) => r.name))}</span>
        <p />
        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box> */}

        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box>
        <span>ReportPage displayed:{count}</span>
        {
          // currentMiroirReport &&
          // currentMiroirReportSectionObjectList &&
          // currentReportTargetE(ntity &&
          // currentReportTargetEnt)ityDefinition &&
          params.deploymentUuid &&
          params.applicationSection 
          ? (
            // <span>Voila! {JSON.stringify(currentMiroirReport)}</span>
            params.instanceUuid
              ? <ReportSection
                  reportDefinition={currentMiroirReport?.definition}
                  applicationSection={params.applicationSection as ApplicationSection}
                  deploymentUuid={params.deploymentUuid}
                  // entityUuid={params.?.uuid}
                  instanceUuid={params.instanceUuid}
                />
              // ? <ReportSectionEntityInstance
              //     reportDefinition={currentMiroirReport}
              //     applicationSection={params.applicationSection as ApplicationSection}
              //     deploymentUuid={params.deploymentUuid}
              //     entityUuid={currentReportTargetEntity.uuid}
              //     instanceUuid={params.instanceUuid}
              //   />
              : 
                <div>No instance</div>
                // <ReportSectionListDisplay
                //   tableComponentReportType="EntityInstance"
                //   label={"EntityInstance-" + currentReportTargetEntity?.name}
                //   currentReportUuid={params.reportUuid?params.reportUuid:""}
                //   styles={styles}
                //   chosenApplicationSection={params.applicationSection as ApplicationSection}
                //   displayedDeploymentDefinition={displayedDeploymentDefinition}
                //   currentModel={currentModel}
                //   currentMiroirReportSectionObjectList={currentMiroirReportSectionObjectList}
                //   currentMiroirEntity={currentReportTargetEntity}
                //   currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
                // />
          ) : (
            <div>Oops.</div>
          )
        }
      </div>
    );
  } else {
    return <>ReportPage Invalid parameters! {JSON.stringify(params)}</>;
  }
};
