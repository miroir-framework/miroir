import { Card, CardContent, CardHeader } from "@mui/material";
import * as React from "react";
import { useErrorLogService } from "src/miroir-fwk/4_view/ErrorLogReactService";
import { MReportComponent } from "./MReportComponent";

export const MComponent = (props:any) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const errorLogService = useErrorLogService();

  console.log("MComponent",errorLogService);

  // const {store} = props;
  return (
    <div>
      <h3>
        {/* props: {JSON.stringify(props)} */}
            erreurs: {JSON.stringify(errorLogService.getErrorLog())}
      </h3>
      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          <MReportComponent
            reportName="EntityList"
            // store={store}
          />
          {/* </MiroirReportComponent> */}
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