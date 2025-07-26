import { ColDef } from "ag-grid-community";


import {
  EntityDefinition,
  JzodElement,
  LoggerInterface,
  MiroirLoggerFactory
} from "miroir-core";

import { packageName } from "../../constants.js";
import { EntityInstanceCellRenderer } from "./components/EntityInstanceCellRenderer.js";
import { GenderCellEditor } from "./components/GenderCellEditor.js";
import GenderCellRenderer from "./components/GenderCellRenderer.js";
import {
  DefaultCellRenderer,
} from "./components/SelectEntityInstanceEditor.js";
import { cleanLevel } from "./constants.js";
import { calculateAdaptiveColumnWidths, ColumnWidthSpec } from "./adaptiveColumnWidths.js";
import { TableComponentRow } from "./components/MTableComponentInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getColumnDefinitionsFromEntityDefinitionAttribute")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export function getColumnDefinitionsFromEntityDefinitionAttribute(
  deploymentUuid: string, // prop drilling
  name: string,
  jzodSchema: JzodElement,
  // jzodObjectSchema?: JzodObject,
  entityDefinition?: EntityDefinition | undefined,
  width?: number,
): ColDef<any> {

  if (jzodSchema?.tag?.value?.targetEntity) {
    const result =  {
      // field: "publisher",
      field: name,
      cellRenderer: EntityInstanceCellRenderer,
      // cellEditor: SelectEntityInstanceEditorNotUsed, // can not be edited in table column: click navigates to instance details report page
      // cellEditorPopup: true,
      // editable: true,
      // sort:'asc',
      // cellEditorParams: {
      //   entityUuid: jzodSchema?.tag?.value?.targetEntity,
      // },
      cellRendererParams: {
        deploymentUuid,
        isFK: true,
        entityUuid: jzodSchema?.tag?.value?.targetEntity,
        entityDefinition
      },
      width: width,
    };
    // log.info(
    //   "column with targetEntity named",
    //   name,
    //   "jzodSchema",
    //   jzodSchema,
    //   "targetEntity",
    //   jzodSchema?.tag?.value?.targetEntity,
    //   "entityPublisher.uuid",
    //   entityPublisher.uuid,
    //   entityPublisher.uuid == jzodSchema?.tag?.value?.targetEntity,
    //   "result",
    //   result
    // );

    return result;
  }
  log.info(
    "getColumnDefinitionsFromEntityDefinitionAttribute name column",
    name,
    "jzodSchema",
    jzodSchema,
    // "jzodObjectSchema",
    // jzodObjectSchema,
    "entityDefinition",
    entityDefinition
  );

  switch (name) {
    case "uuid":
    case "name": {

      return {
        field: name,
        cellRenderer: EntityInstanceCellRenderer,
        // cellEditor: SelectEntityInstanceEditorNotUsed,
        // cellEditorPopup: true,
        // editable: true,
        // cellEditorParams: {
        //   entityUuid: entityDefinition?.uuid??"",
        // },
        cellRendererParams: {
          deploymentUuid,
          entityUuid: entityDefinition?.entityUuid??"",
          entityDefinition
        },
        width: width,
      };
      break;
    }
    case "gender": {
      return {
        field: "gender",
        cellRenderer: GenderCellRenderer,
        cellEditor: GenderCellEditor,
        cellEditorPopup: true,
        editable: true,
        width: width,
      };
      break;
    }
    case "conceptLevel": {
      // log.info("column conceptLevel", name, jzodSchema);
      return {
        field: name,
        headerName: jzodSchema.tag?.value?.defaultLabel ? jzodSchema.tag?.value?.defaultLabel : name,
        width: width,
      };
    }
    default: {
      if (!jzodSchema) {
        log.error(
          "getColumnDefinitionsFromEntityDefinitionAttribute: jzodSchema is undefined for name",
          name,
          "entityDefinition",
          entityDefinition
        );
      } else {
        log.info("column default:", name, jzodSchema);
      }
      return {
        field: name,
        cellRenderer: DefaultCellRenderer,
        cellRendererParams: {
          deploymentUuid,
          columnName: name,
        },
        headerName: jzodSchema.tag?.value?.defaultLabel ? jzodSchema.tag?.value?.defaultLabel : name,
        width: width,
        // "sort":'asc'
      };
      break;
    }
  }
}

// ################################################################################################
export function getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
  deploymentUuid: string,
  jzodSchema: JzodElement | undefined,
  viewAttributes?: string[],
  entityDefinition?: EntityDefinition | undefined,
  rowData?: TableComponentRow[],
  availableWidth?: number
): ColDef<any>[] {
  log.info(
    "getColumnDefinitionsFromEntityDefinitionJzodObjectSchema",
    "deploymentUuid",
    deploymentUuid,
    "jzodSchema",
    jzodSchema,
    "viewAttributes",
    viewAttributes,
    "entityDefinition",
    entityDefinition
  );
  
  let columnDefs: ColDef<any>[] = [];
  
  switch (jzodSchema?.type) {
    case "object":
      {
        const schemaKeys = Object.keys(jzodSchema.definition)
        if (viewAttributes) {
          columnDefs = viewAttributes
            .filter((a: string) => [a, schemaKeys.find((b) => b == a)])
            .map((a: string) =>
              getColumnDefinitionsFromEntityDefinitionAttribute(
                deploymentUuid,
                a,
                jzodSchema.definition[a],
                entityDefinition
              )
            );
        } else {
          columnDefs = Object.entries(jzodSchema.definition ? jzodSchema.definition : {})
            .map((e: [string, any]) =>
              getColumnDefinitionsFromEntityDefinitionAttribute(deploymentUuid, e[0], e[1], entityDefinition)
            );
        }
      }
      break;
    default: {
      columnDefs = [];
      break;
    }
  }

  // Calculate adaptive widths if row data is provided
  if (rowData && rowData.length > 0 && columnDefs.length > 0) {
    const widthSpecs = calculateAdaptiveColumnWidths(
      columnDefs,
      rowData,
      availableWidth || 1200,
      jzodSchema?.type === "object" ? jzodSchema.definition : undefined
    );

    // Apply calculated widths to column definitions
    columnDefs.forEach((colDef, index) => {
      const widthSpec = widthSpecs.find(spec => spec.field === colDef.field);
      if (widthSpec) {
        colDef.width = Math.round(widthSpec.calculatedWidth);
        colDef.minWidth = Math.round(widthSpec.minWidth);
        colDef.maxWidth = Math.round(widthSpec.maxWidth);
      }
    });
  }

  return columnDefs;
}
