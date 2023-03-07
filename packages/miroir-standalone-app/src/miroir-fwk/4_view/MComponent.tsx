import { Card, CardContent, CardHeader, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { ConfigurationService, MiroirReport } from "miroir-core";
import { useLocalCacheReports } from "miroir-fwk/4_view/hooks";
import { useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import * as React from "react";
import { ReportComponent } from "./ReportComponent";
export interface MComponentProps {
  // store:any;
  reportName:string
}

export const MComponent = (props:MComponentProps) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const errorLog = useErrorLogServiceHook();
  const [displayedReportName, setDisplayedReportName] = React.useState('EntityList');


  const handleChange = (event: SelectChangeEvent) => {
    setDisplayedReportName(event.target.value as string);
  };

  console.log("MComponent miroirReports",miroirReports);

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
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={displayedReportName}
          label="displayedReportName"
          onChange={handleChange}
        >
          {
            miroirReports.map(r=>{return <MenuItem key={r.name} value={r.name}>{r.defaultLabel}</MenuItem>})
          }
          {/* <MenuItem value='EntityList'>List of Entities</MenuItem> */}
          {/* <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem> */}
        </Select>
      </FormControl>

      <Card>
        <CardHeader>
          AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        </CardHeader>
        <CardContent>
          <ReportComponent
            reportName={displayedReportName}
            // reportName={props.reportName}
            // reportName="ReportList"
            // reportName="EntityList"
            // store={store}
          />
        </CardContent>
      </Card>
    </div>
  )
}