import * as React from "react";

import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { MiroirReport, MiroirReports } from "src/miroir-fwk/0_interfaces/1_core/Report";
import { ReportGetInstancesToDispay } from "src/miroir-fwk/1_core/Report";
import { useLocalStoreEntities, useLocalStoreReports } from "src/miroir-fwk/4_services/localStore/InstanceSlice";
import { MTableComponent } from "./MTableComponent";

export interface MiroirReportComponentProps {
  reportName: string;
};

export const MReportComponent = (
  props: MiroirReportComponentProps
) => {
  // const miroirReports = [1];
  const miroirEntities:EntityDefinition[] = useLocalStoreEntities();
  const miroirReports:MiroirReports = useLocalStoreReports();
  console.log("MiroirReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  
  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  console.log("MiroirReportComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === currentMiroirReport?.definition?.entity)

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
              rowData={ReportGetInstancesToDispay(currentMiroirReport,miroirEntities)}
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