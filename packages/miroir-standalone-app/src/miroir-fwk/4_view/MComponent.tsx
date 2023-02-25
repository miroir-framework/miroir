import { Card, CardContent, CardHeader } from "@mui/material";
import { ConfigurationService } from "miroir-core";
import { useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
// import * as React from "react";
import { ReportComponent } from "./ReportComponent";
export interface MComponentProps {
  // store:any;
  reportName:string
}

export const MComponent = (props:MComponentProps) => {
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
      <span>
        packages: {JSON.stringify(ConfigurationService.packages)}
      </span>
      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          <ReportComponent
            reportName={props.reportName}
            // reportName="ReportList"
            // reportName="EntityList"
            // store={store}
          />
        </CardContent>
      </Card>
    </div>
  )
}