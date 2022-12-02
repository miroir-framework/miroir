import { Card, CardContent, CardHeader } from "@mui/material";
import * as React from "react";
import { useSelector } from "react-redux";
import { MiroirEntities } from "../entities/entitySlice";
import { selectAllMiroirEntities } from "../state/selectors";
import { MiroirListComponent } from "./MiroirListComponent";
import { MiroirTableComponent } from "./MiroirTableComponent";

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
          <MiroirListComponent></MiroirListComponent>
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