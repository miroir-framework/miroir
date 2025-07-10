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
        headerName: jzodSchema.tag?.value?.defaultLabel ? jzodSchema.tag?.value?.defaultLabel : name,
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
  entityDefinition?: EntityDefinition | undefined
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
  switch (jzodSchema?.type) {
    case "object":
      {
        const schemaKeys = Object.keys(jzodSchema.definition)
        if (viewAttributes) {
          return viewAttributes
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
          return (
            Object.entries(jzodSchema.definition ? jzodSchema.definition : {})
              .map((e: [string, any]) =>
                getColumnDefinitionsFromEntityDefinitionAttribute(deploymentUuid, e[0], e[1], entityDefinition)
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
