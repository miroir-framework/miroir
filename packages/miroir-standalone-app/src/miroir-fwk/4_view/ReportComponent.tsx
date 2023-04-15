import { EntityDefinition, EntityInstance, MetaEntity, MiroirReport } from "miroir-core";
import { useLocalCacheEntities, useLocalCacheEntityDefinitions, useLocalCacheInstancesForReport, useLocalCacheReports } from "miroir-fwk/4_view/hooks";
import * as React from "react";

import { MTableComponent } from "./MTableComponent";
import { getColumnDefinitions } from "miroir-react";

export interface MiroirReportComponentProps {
  // reportName: string;
  reportUuid: string;
};


export const ReportComponent: React.FC<MiroirReportComponentProps> = (
  props: MiroirReportComponentProps
) => {
  console.log("ReportComponent props",props);
  const miroirEntities:MetaEntity [] = useLocalCacheEntities();
  const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForReport(props.reportUuid);
  // console.log("ReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  
  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.uuid === props?.reportUuid);
  const currentMiroirEntity: MetaEntity = miroirEntities?.find(e=>e?.uuid === currentMiroirReport?.definition?.parentUuid);
  const currentMiroirEntityDefinition: EntityDefinition = miroirEntityDefinitions?.find(e=>e?.entityUuid === currentMiroirEntity?.uuid);
  console.log("ReportComponent currentMiroirEntity",currentMiroirEntity,"currentMiroirEntityDefinition",currentMiroirEntityDefinition);

  const instancesStringified:EntityInstance[] = instancesToDisplay.map(i=>Object.fromEntries(Object.entries(i).map(e=>[e[0],currentMiroirEntityDefinition?.attributes?.find(a=>a.name==e[0])?.type=='OBJECT'?JSON.stringify(e[1]):e[1]])) as EntityInstance);
  console.log("ReportComponent instancesToDisplay",instancesToDisplay);
  // console.log("ReportComponent currentMiroirReport",currentMiroirReport);
  // console.log("ReportComponent currentMiroirEntity",currentMiroirEntity);

  return (
    <div>
      <h3>
        {/* props: {JSON.stringify(props)} */}
        {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
        {currentMiroirReport?.defaultLabel}
      </h3>
     
      {
        currentMiroirReport?
          (
            miroirReports?.length > 0?
              <div>
                <MTableComponent
                  columnDefs={
                    getColumnDefinitions(currentMiroirEntityDefinition?.attributes)
                  }
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
  );
}