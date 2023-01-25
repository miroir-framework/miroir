import { Card, CardContent, CardHeader } from "@mui/material";
import * as React from "react";
import { useErrorLogService } from "miroir-fwk/4_view/ErrorLogReactService";
import { MReportComponent } from "./MReportComponent";

export const MComponent = (props:any) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const errorLogService = useErrorLogService();

  // console.log("MComponent",errorLogService);

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
        </CardContent>
      </Card>
    </div>
  )
}