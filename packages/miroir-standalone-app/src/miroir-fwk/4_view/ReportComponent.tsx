import { EntityDefinition, EntityInstance, MiroirReport } from "miroir-core";
import { useLocalCacheEntities, useLocalCacheInstancesForReport, useLocalCacheReports } from "miroir-fwk/4_view/hooks";
import * as React from "react";

import { MTableComponent } from "./MTableComponent";

export interface MiroirReportComponentProps {
  // reportName: string;
  reportUuid: string;
};


export const ReportComponent: React.FC<MiroirReportComponentProps> = (
  props: MiroirReportComponentProps
) => {
  const miroirEntities:EntityDefinition [] = useLocalCacheEntities();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForReport(props.reportUuid);
  // console.log("ReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  
  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.uuid === props?.reportUuid)
  const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.uuid === currentMiroirReport?.definition?.parentUuid)
  const instancesStringified:EntityInstance[] = instancesToDisplay.map(i=>Object.fromEntries(Object.entries(i).map(e=>[e[0],currentMiroirEntity.attributes.find(a=>a.name==e[0])?.type=='OBJECT'?JSON.stringify(e[1]):e[1]])) as EntityInstance);
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
                    currentMiroirEntity?.attributes?.map(
                      (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
                    )
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