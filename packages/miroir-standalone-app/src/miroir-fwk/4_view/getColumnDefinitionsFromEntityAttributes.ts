import { ColDef } from "ag-grid-community";

import { JzodElement } from "@miroir-framework/jzod-ts";

import { EntityDefinition, JzodObject, LoggerInterface, MiroirLoggerFactory, entityAuthor, entityPublisher, getLoggerName } from "miroir-core";

import { GenderCellEditor } from "../../miroir-fwk/4_view/GenderCellEditor";
import {
  DefaultCellRenderer,
  EntityInstanceCellRenderer,
  // SelectEntityInstanceEditorNotUsed,
} from "../../miroir-fwk/4_view/SelectEntityInstanceEditor";
import GenderCellRenderer from "./GenderCellRenderer";
import { packageName } from "../../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"getColumnDefinitionsFromEntityDefinitionAttribute");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
export function getColumnDefinitionsFromEntityDefinitionAttribute(
  name: string,
  jzodSchema: JzodElement,
  // jzodObjectSchema?: JzodObject,
  entityDefinition?: EntityDefinition | undefined,
): ColDef<any> {

  if (jzodSchema?.extra?.targetEntity) {
    const result =  {
      // field: "publisher",
      field: name,
      cellRenderer: EntityInstanceCellRenderer,
      // cellEditor: SelectEntityInstanceEditorNotUsed, // can not be edited in table column: click navigates to instance details report page
      // cellEditorPopup: true,
      // editable: true,
      // sort:'asc',
      // cellEditorParams: {
      //   entityUuid: jzodSchema?.extra?.targetEntity,
      // },
      cellRendererParams: {
        entityUuid: jzodSchema?.extra?.targetEntity,
        entityDefinition
      },
    };
    // log.info(
    //   "column with targetEntity named",
    //   name,
    //   "jzodSchema",
    //   jzodSchema,
    //   "targetEntity",
    //   jzodSchema?.extra?.targetEntity,
    //   "entityPublisher.uuid",
    //   entityPublisher.uuid,
    //   entityPublisher.uuid == jzodSchema?.extra?.targetEntity,
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
          entityUuid: entityDefinition?.entityUuid??"",
          entityDefinition
        },
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
      };
      break;
    }
    case "conceptLevel": {
      // log.info("column conceptLevel", name, jzodSchema);
      return {
        field: name,
        headerName: jzodSchema.extra?.defaultLabel ? jzodSchema.extra?.defaultLabel : name,
      };
    }
    default: {
      log.info("column default:", name, jzodSchema);
      return {
        field: name,
        cellRenderer: DefaultCellRenderer,
        cellRendererParams: {
          columnName: name,
        },
        headerName: jzodSchema.extra?.defaultLabel ? jzodSchema.extra?.defaultLabel : name,
        // "sort":'asc'
      };
      break;
    }
  }
}

// ################################################################################################
export function getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
  jzodSchema: JzodElement | undefined,
  viewAttributes?: string[],
  entityDefinition?: EntityDefinition | undefined
): ColDef<any>[] {
  switch (jzodSchema?.type) {
    case "object":
      {
        const schemaKeys = Object.keys(jzodSchema.definition)
        if (viewAttributes) {
          return viewAttributes
            .filter((a: string) => [a, schemaKeys.find((b) => b == a)])
            .map((a: string) =>
              getColumnDefinitionsFromEntityDefinitionAttribute(
                a,
                jzodSchema.definition[a],
                // jzodSchema as JzodObject,
                entityDefinition
              )
            );
        } else {
          return (
            Object.entries(jzodSchema.definition ? jzodSchema.definition : {})
              // ?.filter((e: [string, any]) => viewAttributes == undefined || viewAttributes.includes(e[0]))
              .map((e: [string, any]) =>
                getColumnDefinitionsFromEntityDefinitionAttribute(e[0], e[1], entityDefinition)
              )
          );
        }
      }
      break;
    default: {
      return [];
      break;
    }
  }
}
