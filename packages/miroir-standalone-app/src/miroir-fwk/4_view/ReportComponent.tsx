import AddBoxIcon from '@mui/icons-material/AddBox';
import {
  Button
} from "@mui/material";
import * as React from "react";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";

import {
  ApplicationDeploymentSchema,
  ApplicationSectionSchema,
  EntityAttribute,
  EntityAttributeArray,
  EntityDefinitionSchema,
  EntityInstance,
  MetaEntitySchema,
  ReportSchema,
  entityDefinitionEntityDefinition
} from "miroir-core";
import {
  useLocalCacheInstancesForEntity
} from "miroir-fwk/4_view/hooks";

import { ColDef } from "ag-grid-community";
import { getColumnDefinitions } from "miroir-fwk/4_view/EntityViewer";
import { EditorAttribute, InstanceEditorDialog, emails } from "./InstanceEditorDialog";
import { MTableComponent, TableComponentTypeSchema } from "./MTableComponent";
// import { getColumnDefinitions } from "miroir-react";


// export const TableComponentReportTypeSchema = z.enum([
//   "EntityInstance",
//   "JSON_ARRAY",
// ]);

// export type TableComponentReportType = z.infer<typeof TableComponentReportTypeSchema>;
export const ReportComponentEntityInstancePropsSchema = z.object({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  // tableComponentReportType: TableComponentTypeSchema,
  currentMiroirReport: ReportSchema.optional(),
  currentMiroirEntity: MetaEntitySchema.optional(),
  currentMiroirEntityDefinition: EntityDefinitionSchema.optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  chosenApplicationSection: ApplicationSectionSchema.optional(),
  currentModel:z.any(),
});

export const ReportComponentJsonArrayPropsSchema = z.object({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  // tableComponentReportType: TableComponentTypeSchema,
  // currentMiroirReport: ReportSchema.optional(),
  // currentMiroirEntity: MetaEntitySchema.optional(),
  // currentMiroirEntityDefinition: EntityDefinitionSchema.optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  chosenApplicationSection: ApplicationSectionSchema.optional(),
  currentModel:z.any(),
});

// ##########################################################################################
export const ReportComponentPropsSchema = z.union([
  ReportComponentEntityInstancePropsSchema,
  ReportComponentJsonArrayPropsSchema,
]);


export type ReportComponentProps = z.infer<typeof ReportComponentPropsSchema>;

// export interface MiroirReportComponentProps {
//   // reportName: string;
//   // chosenDeploymentUuid: string;
//   tableComponentReportType:TableComponentType,
//   currentMiroirReport: Report | undefined;
//   currentMiroirEntity: MetaEntity | undefined;
//   currentMiroirEntityDefinition: EntityDefinition | undefined;
//   displayedDeploymentDefinition: ApplicationDeployment | undefined;
//   chosenApplicationSection: ApplicationSection | undefined;
//   currentModel:MiroirMetaModel,
//   // reportUuid: string;
// };


export const ReportComponent: React.FC<ReportComponentProps> = (
  props: ReportComponentProps
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

  if (props.tableComponentReportType == "EntityInstance") {
    // console.log("ReportComponent props",props);
    let instancesToDisplay: EntityInstance[];
    let instancesStringified: EntityInstance[];
    const currentEntityAttributes: EntityAttribute[] = props.currentMiroirEntityDefinition?.attributes?props.currentMiroirEntityDefinition?.attributes:[];
    let currentEditorAttributes: EditorAttribute[];

    let columnDefs:ColDef<any>[];

    // if (props.tableComponentReportType == "EntityInstance") {
      instancesToDisplay = useLocalCacheInstancesForEntity(
        props.displayedDeploymentDefinition?.uuid,
        props.chosenApplicationSection,
        props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
      );
    
      instancesStringified = instancesToDisplay.map(
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
      currentEditorAttributes = currentEntityAttributes.map(a=>{
        const attributeDefaultValue:any = {
          'uuid': uuidv4(),
          'parentName':props.currentMiroirEntity?.name,
          'parentUuid':props.currentMiroirEntity?.uuid,
          'conceptLevel':'Model',
          'application': props.displayedDeploymentDefinition?.application
        }
        if (Object.keys(attributeDefaultValue).includes(a.name)) {
          return {attribute:a,value:attributeDefaultValue[a.name]}
        } else {
          return {attribute:a,value:''}
        }
      });
      columnDefs=getColumnDefinitions(currentEntityAttributes);

    // } else { // props.tableComponentReportType == "JSON_ARRAY"
    //   instancesToDisplay = []
    //   instancesStringified = []
    //   currentEditorAttributes = []
    //   columnDefs = []
    // }

    console.log("ReportComponent instancesToDisplay",instancesToDisplay);
    console.log("ReportComponent props.currentMiroirEntity",props?.currentMiroirEntity);
    console.log("ReportComponent columnDefs",columnDefs);

    return (
      <div>
        <span>
            <div>
              {/* <Typography variant="subtitle1" component="div">
                Selected: {selectedValue}
              </Typography>
              <br /> */}
            </div>
          </span>
        <p>
        </p>
        <div>
          {
            props?.currentMiroirReport?
              (
                columnDefs?.length > 0?
                  <div>
                    <div>
                        {/* props: {JSON.stringify(props)} */}
                        {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
                        colonnes: {JSON.stringify(columnDefs)}
                        <p/>
                        deployment: {JSON.stringify(props.displayedDeploymentDefinition?.uuid)}
                        <p/>
                      <h3>
                        {props?.currentMiroirReport?.defaultLabel}
                        <Button variant="outlined" onClick={handleClickOpen}>
                          <AddBoxIcon/>
                        </Button>
                      </h3>
                    </div>
                    {
                      props.tableComponentReportType == "EntityInstance"?
                        <InstanceEditorDialog
                          selectedValue={selectedValue}
                          currentMiroirEntity={props.currentMiroirEntity}
                          currentMiroirEntityDefinition={props.currentMiroirEntityDefinition}
                          editorAttributes={currentEditorAttributes}
                          displayedDeploymentDefinition={props.displayedDeploymentDefinition}
                          currentModel={props.currentModel}
                          // rowData={instancesStringified}
                          open={open}
                          onClose={handleClose}
                        />
                      :
                      <div/>
                    }
                    <MTableComponent
                      type={props.tableComponentReportType}
                      currentMiroirEntity={props.currentMiroirEntity}
                      currentMiroirEntityDefinition={props.currentMiroirEntityDefinition}
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
  } else {
    let columnDefs:any[];
    if (entityDefinitionEntityDefinition.attributes[7].type == "ARRAY") {
      const a:EntityAttributeArray = entityDefinitionEntityDefinition.attributes[7] as EntityAttributeArray;
      columnDefs=getColumnDefinitions(a.lineFormat);
    } else {
      columnDefs = []
    }

    return (
      <div>
        <span>
            <div>
              {/* <Typography variant="subtitle1" component="div">
                Selected: {selectedValue}
              </Typography>
              <br /> */}
            </div>
          </span>
        <p>
        </p>
        <div>
          <MTableComponent
            // type={props.tableComponentReportType}
            type="JSON_ARRAY"
            // currentMiroirEntity={props.currentMiroirEntity}
            // currentMiroirEntityDefinition={props.currentMiroirEntityDefinition}
            // reportDefinition={props.currentMiroirReport}
            columnDefs={columnDefs}
            rowData={entityDefinitionEntityDefinition.attributes}
          >
          </MTableComponent>
        </div>
      </div>
    );
  }

}