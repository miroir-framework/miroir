import { Card, CardContent, CardHeader } from "@mui/material";
import * as React from "react";
import { MiroirReportComponent } from "./MiroirReportComponent";

export const MiroirComponent = (props:any) => {
  const {store} = props;
  return (
    <div>
      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          <MiroirReportComponent
            reportName="EntityList"
            // store={store}
          ></MiroirReportComponent>
          {/* {
            miroirEntities?.length > 0?
              <MiroirTableComponent
                columnDefs={
                  miroirEntities?.find(e=>e?.name ==="Entity")
                  ?.attributes?.find((a)=>a?.name==="attributes")
                  ?.attributeFormat?.map(
                    (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
                  )
                }
                rowData={miroirEntities?.find(e=>e?.name ==="Entity")?.attributes}
              ></MiroirTableComponent>
            :
              <span>pas d entités</span>
          } */}
        </CardContent>
      </Card>
    </div>
  )
}