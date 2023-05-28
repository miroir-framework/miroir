import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { v4 as uuidv4 } from 'uuid';

import { ApplicationDeployment, ApplicationSection, EntityAttribute, EntityDefinition, EntityInstance, MetaEntity, MiroirMetaModel, MiroirReport, entityEntity } from "miroir-core";
import {
  useLocalCacheDeploymentSectionReports,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheEntityDefinitions,
  useLocalCacheInstancesForReport,
  useLocalCacheReports,
  useLocalCacheInstancesForEntity,
} from "miroir-fwk/4_view/hooks";
import * as React from "react";

import { MTableComponent } from "./MTableComponent";
import { getColumnDefinitions } from "miroir-fwk/4_view/EntityViewer";
import { EditorAttribute, SimpleDialog, emails } from "./InstanceEditorDialog";
// import { getColumnDefinitions } from "miroir-react";

export interface MiroirReportComponentProps {
  // reportName: string;
  chosenDeploymentUuid: string;
  displayedDeploymentDefinition: ApplicationDeployment | undefined;
  chosenApplicationSection: ApplicationSection | undefined;
  currentMiroirReport: MiroirReport | undefined;
  currentMiroirEntity: MetaEntity | undefined;
  currentMiroirEntityDefinition: EntityDefinition | undefined;
  currentModel:MiroirMetaModel,
  reportUuid: string;
};


export const ReportComponent: React.FC<MiroirReportComponentProps> = (
  props: MiroirReportComponentProps
) => {
  const [open, setOpen] = React.useState(false);

  const [selectedValue, setSelectedValue] = React.useState(emails[1]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value: string) => {
    setOpen(false);
    // setSelectedValue(value);
  };

  // console.log("ReportComponent props",props);
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
  // const miroirReports:MiroirReport[] = useLocalCacheReports();
  
  
  // const miroirEntities:MetaEntity [] = useLocalCacheSectionEntities(props.deploymentUuid,'model');
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(props.deploymentUuid,'model');
  // const deploymentReports: MiroirReport[] = useLocalCacheDeploymentSectionReports(props.deploymentUuid,'model');
  // console.log("ReportComponent miroirEntities",miroirEntities, "miroirEntityDefinitions", miroirEntityDefinitions);
  
  const instancesToDisplay: EntityInstance[] = useLocalCacheInstancesForEntity(
    props.chosenDeploymentUuid,
    props.chosenApplicationSection,
    props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
  );

  const instancesStringified: EntityInstance[] = instancesToDisplay.map(
    (i) =>
      Object.fromEntries(
        Object.entries(i).map((e) => [
          e[0],
          props.currentMiroirEntityDefinition?.attributes?.find((a) => a.name == e[0])?.type == "OBJECT"
            ? JSON.stringify(e[1])
            : e[1],
        ])
      ) as EntityInstance
  );
  console.log("ReportComponent instancesToDisplay",instancesToDisplay);
  console.log("ReportComponent props.currentMiroirEntity",props.currentMiroirEntity);
  // console.log("ReportComponent currentMiroirReport",currentMiroirReport);
  // console.log("ReportComponent currentMiroirEntity",currentMiroirEntity);
  const currentEntityAttributes: EntityAttribute[] = props.currentMiroirEntityDefinition?.attributes?props.currentMiroirEntityDefinition?.attributes:[];
  const currentEditorAttributes: EditorAttribute[] = currentEntityAttributes.map(a=>{
    // switch (props.currentMiroirEntityDefinition?.parentUuid) {
      // case entityEntity.uuid
        switch (a.name) {
          case 'uuid':
            return {attribute:a,value:uuidv4()}
          case 'parentName':
            return {attribute:a,value:props.currentMiroirEntity?.name}
          case 'parentUuid':
            return {attribute:a,value:props.currentMiroirEntity?.uuid}
          case 'conceptLevel':
            return {attribute:a,value:'Model'}
          case 'application':
            return {attribute:a,value:props.displayedDeploymentDefinition?.application}
          default:
            return {attribute:a,value:''}
        }
    //   default:
    //     return {attribute:a,value:''};
    // }
  });
  const columnDefs=getColumnDefinitions(currentEntityAttributes);
  console.log("ReportComponent columnDefs",columnDefs);

  return (
    <div>
      <div>
          {/* props: {JSON.stringify(props)} */}
          {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
          colonnes: {JSON.stringify(columnDefs)}
          <p/>
          deployment: {JSON.stringify(props.chosenDeploymentUuid)}
          <p/>
        <h3>
          {props.currentMiroirReport?.defaultLabel}
        </h3>

      </div>
      <span>
          <div>
            <Typography variant="subtitle1" component="div">
              Selected: {selectedValue}
            </Typography>
            <br />
            <Button variant="outlined" onClick={handleClickOpen}>
              Open simple dialog
            </Button>
            <SimpleDialog
              selectedValue={selectedValue}
              editorAttributes={currentEditorAttributes}
              displayedDeploymentDefinition={props.displayedDeploymentDefinition}
              currentModel={props.currentModel}
              // rowData={instancesStringified}
              open={open}
              onClose={handleClose}
            />
          </div>
        </span>
      <p>
      </p>
      <div>
        {
          props.currentMiroirReport?
            (
              columnDefs?.length > 0?
                <div>
                  <MTableComponent
                    reportDefinition={props.currentMiroirReport}
                    columnDefs={columnDefs}
                    rowData={instancesStringified}
                  >
                  </MTableComponent>
                </div>
              :
                <span>No elements in the report</span>
            )
          :
            <span>no report to display</span>
        }
      </div>
    </div>
  );
}