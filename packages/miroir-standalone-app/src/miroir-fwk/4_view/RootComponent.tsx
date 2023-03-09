import { Box, Card, CardContent, CardHeader, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { ConfigurationService, MiroirReport } from "miroir-core";
import { useLocalCacheReports } from "miroir-fwk/4_view/hooks";
import { useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import * as React from "react";
import { ReportComponent } from "./ReportComponent";
export interface RootComponentProps {
  // store:any;
  reportName:string
}

function defaultToEntityList(value:string, miroirReports:MiroirReport[]):string {
  return value?value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined)
}
export const RootComponent = (props:RootComponentProps) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const errorLog = useErrorLogServiceHook();
  const [displayedReportName, setDisplayedReportName] = React.useState('');


  const handleChange = (event: SelectChangeEvent) => {
    // setDisplayedReportName(event.target.value?event.target.value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined));
    setDisplayedReportName(defaultToEntityList(event.target.value,miroirReports));
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
      <p/>
      <Box sx={{ minWidth: 50 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            // value={displayedReportName?displayedReportName:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined)}
            value={defaultToEntityList(displayedReportName,miroirReports)}
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
      </Box>
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