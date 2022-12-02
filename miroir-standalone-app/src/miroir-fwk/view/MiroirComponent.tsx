import { Card, CardContent, CardHeader } from "@mui/material";
import * as React from "react";
import { useSelector } from "react-redux";
import { MiroirEntities } from "../entities/Entity";
import { selectAllMiroirEntities } from "../state/selectors";
import { MiroirReportComponent } from "./MiroirReportComponent";

export const MiroirComponent = () => {
  const miroirEntities:MiroirEntities = useSelector(selectAllMiroirEntities)
  return (
    <div>
      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          <MiroirReportComponent
            reportName="EntityList"
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