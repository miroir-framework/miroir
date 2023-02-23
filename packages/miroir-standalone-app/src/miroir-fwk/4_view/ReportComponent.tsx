import { EntityDefinition, MiroirReport, ReportGetInstancesToDispay } from "miroir-core";
import { useLocalCacheEntities, useLocalCacheReports } from "miroir-fwk/4_view/selectors";
import * as React from "react";

// import { EntityDefinition, MiroirReport, ReportGetInstancesToDispay } from 'miroir-core';
import { MTableComponent } from "./MTableComponent";

export interface MiroirReportComponentProps {
  reportName: string;
};


export const ReportComponent = (
  props: MiroirReportComponentProps
) => {
  // const miroirReports = [1];
  const miroirEntities:EntityDefinition [] = useLocalCacheEntities();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  console.log("MiroirReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  
  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  console.log("MiroirReportComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === currentMiroirReport?.definition?.entity)

  console.log("MiroirReportComponent ReportGetInstancesToDispay",ReportGetInstancesToDispay);

  return (
    <div>
      <h3>
        props: {JSON.stringify(props)}
            {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
      </h3>
     
      {
        miroirReports?.length > 0?
          <div>
            <MTableComponent
              columnDefs={
                currentMiroirEntity?.attributes?.map(
                  (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
                )
              }
              // rowData={ReportGetInstancesToDispay(currentMiroirReport,miroirEntities)}
              rowData={ReportGetInstancesToDispay(currentMiroirReport,miroirEntities,miroirReports)}
              // columnDefs={[{"headerName": "name", "field": "name"}]}
              // rowData={[{name:'toto'}]}
            >
            </MTableComponent>
          </div>
        :
          <span>pas d entités</span>
      }
   </div>
  );
}