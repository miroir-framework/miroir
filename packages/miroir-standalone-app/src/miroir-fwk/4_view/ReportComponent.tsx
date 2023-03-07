import { EntityDefinition, Instance, MiroirReport } from "miroir-core";
import { useLocalCacheEntities, useLocalCacheInstancesForReport, useLocalCacheReports } from "miroir-fwk/4_view/hooks";
import * as React from "react";

import { MTableComponent } from "./MTableComponent";

export interface MiroirReportComponentProps {
  reportName: string;
};


export const ReportComponent: React.FC<MiroirReportComponentProps> = (
  props: MiroirReportComponentProps
) => {
  const miroirEntities:EntityDefinition [] = useLocalCacheEntities();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const instancesToDisplay:Instance[] = useLocalCacheInstancesForReport(props.reportName);
  console.log("MiroirReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  
  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === currentMiroirReport?.definition?.entity)
  console.log("MiroirReportComponent instancesToDisplay",instancesToDisplay);

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
                  rowData={instancesToDisplay}
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