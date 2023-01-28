import { Card, CardContent, CardHeader } from "@mui/material";
import { useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
// import * as React from "react";
import { MReportComponent } from "./MReportComponent";

export const MComponent = (props:any) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const errorLog = useErrorLogServiceHook();

  // console.log("MComponent",errorLogService);

  // const {store} = props;
  return (
    <div>
      <h3>
        {/* props: {JSON.stringify(props)} */}
            erreurs: {JSON.stringify(errorLog)}
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