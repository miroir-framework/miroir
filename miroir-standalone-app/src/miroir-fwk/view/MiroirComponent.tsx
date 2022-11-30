import { Card, CardContent, CardHeader } from "@mui/material";
import * as React from "react";
import { useSelector } from "react-redux"
import { MiroirEntities } from "../entities/entitySlice";
import { selectAllMiroirEntities } from "../state/store";
import { MiroirTableComponent } from "./TableComponent";

export const MiroirComponent = () => {
  const miroirEntities:MiroirEntities = useSelector(selectAllMiroirEntities)
  return (
    <div>
      <h3>
        {JSON.stringify(miroirEntities)}
      </h3>
      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          {
            miroirEntities?.length > 0?
              <MiroirTableComponent
                columnDefs={
                  miroirEntities?.find(e=>e?.name ==="Entity")
                  .attributes?.find((a)=>a?.name==="attributes")
                  .attributeFormat?.map(
                    (a)=>{return {"headerName": a?.display, "field": a?.name}}
                  )
                }
                rowData={miroirEntities?.find(e=>e?.name ==="Entity")?.attributes}
              ></MiroirTableComponent>
            :
              <span>pas d entités</span>
          }
        </CardContent>
      </Card>
    </div>
  )
}