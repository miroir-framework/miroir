import { EntityDefinition, EntityInstance, MetaEntity, MiroirReport } from "miroir-core";
import { useLocalCacheDeploymentEntities, useLocalCacheDeploymentEntityDefinitions, useLocalCacheDeploymentReports, useLocalCacheEntities, useLocalCacheEntityDefinitions, useLocalCacheInstancesForReport, useLocalCacheReports } from "miroir-fwk/4_view/hooks";
import * as React from "react";

import { MTableComponent } from "./MTableComponent";
import { getColumnDefinitions } from "miroir-fwk/4_view/EntityViewer";
// import { getColumnDefinitions } from "miroir-react";

export interface MiroirReportComponentProps {
  // reportName: string;
  deploymentUuid: string;
  reportUuid: string;
};


export const ReportComponent: React.FC<MiroirReportComponentProps> = (
  props: MiroirReportComponentProps
) => {
  // console.log("ReportComponent props",props);
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
  // const miroirReports:MiroirReport[] = useLocalCacheReports();
  
  
  const miroirEntities:MetaEntity [] = useLocalCacheDeploymentEntities(props.deploymentUuid);
  const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheDeploymentEntityDefinitions(props.deploymentUuid);
  const deploymentReports: MiroirReport[] = useLocalCacheDeploymentReports(props.deploymentUuid);
  console.log("ReportComponent miroirEntities",miroirEntities, "miroirEntityDefinitions", miroirEntityDefinitions);
  
  const currentMiroirReport: MiroirReport | undefined = deploymentReports?.find(r=>r.uuid === props?.reportUuid);
  const currentMiroirEntity: MetaEntity | undefined = miroirEntities?.find(e=>e?.uuid === currentMiroirReport?.definition?.parentUuid);
  const currentMiroirEntityDefinition: EntityDefinition | undefined = miroirEntityDefinitions?.find(e=>e?.entityUuid === currentMiroirEntity?.uuid);
  console.log("ReportComponent currentMiroirReport",currentMiroirReport,"currentMiroirEntity",currentMiroirEntity,"currentMiroirEntityDefinition",currentMiroirEntityDefinition);

  const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForReport(props.deploymentUuid,props.reportUuid);
  

  const instancesStringified:EntityInstance[] = instancesToDisplay.map(i=>Object.fromEntries(Object.entries(i).map(e=>[e[0],currentMiroirEntityDefinition?.attributes?.find(a=>a.name==e[0])?.type=='OBJECT'?JSON.stringify(e[1]):e[1]])) as EntityInstance);
  console.log("ReportComponent instancesToDisplay",instancesToDisplay);
  // console.log("ReportComponent currentMiroirReport",currentMiroirReport);
  // console.log("ReportComponent currentMiroirEntity",currentMiroirEntity);
  const columnDefs=currentMiroirEntityDefinition?getColumnDefinitions(currentMiroirEntityDefinition?.attributes):[];
  console.log("ReportComponent columnDefs",columnDefs);

  return (
    <div>
      <div>
          {/* props: {JSON.stringify(props)} */}
          {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
          colonnes: {JSON.stringify(columnDefs)}
          <p/>
          deployment: {JSON.stringify(props.deploymentUuid)}
          <p/>
        <h3>
          {currentMiroirReport?.defaultLabel}
        </h3>

      </div>
      <p></p>
      <div>
        {
          currentMiroirReport?
            (
              deploymentReports?.length > 0?
                <div>
                  <MTableComponent
                    reportDefinition={currentMiroirReport}
                    columnDefs={columnDefs}
                    rowData={instancesStringified}
                  >
                  </MTableComponent>
                </div>
              :
                <span>No elements in the report</span>
            )
          :
            <span>no report to display</span>
        }
      </div>
    </div>
  );
}