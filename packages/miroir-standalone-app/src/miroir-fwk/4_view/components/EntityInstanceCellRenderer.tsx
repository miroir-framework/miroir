import { ICellRendererParams } from "ag-grid-community";
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { memo } from "react";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import { TableComponentRow } from "./MTableComponentInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EntityInstanceCellRenderer")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export const EntityInstanceCellRenderer =  memo((props: ICellRendererParams<TableComponentRow>) => {
  // const context = useMiroirContextService();
  
  const entityUuid = props.colDef?.cellRendererParams.entityUuid;
  const isFK = props.colDef?.cellRendererParams.isFK
  
  const attributeName: string = props.colDef?.field??"unknown attribute name";
  if (isFK && !props.data?.foreignKeyObjects) {
    log.warn("EntityInstanceCellRenderer: no foreign key objects found for attribute '" + attributeName + "'");
    return <span>No foreign key data</span>;
  }
  if (isFK && !props.data?.foreignKeyObjects[entityUuid]) {
    log.warn(
      "EntityInstanceCellRenderer: no foreign key objects found for entity",
      "attribute", attributeName,
      "entity uuid", entityUuid,
      "available foreign key entities", Object.keys(props.data?.foreignKeyObjects??{}),
      "entity definition", props.colDef?.cellRendererParams.entityDefinition,
      "deploymentUuid", props.data?.deploymentUuid
    );
    return <span>Foreign key entity not found</span>;
  }
  
  if (isFK && !(props.data?.rawValue as any)[attributeName]) {
    // Handle case where foreign key attribute doesn't exist on this entity
    // This can happen when a column is configured for an attribute that doesn't exist on the current entity
    log.warn(
      "EntityInstanceCellRenderer: foreign key attribute '" + attributeName + "' not found on entity",
      "raw value", props.data?.rawValue,
      "deploymentUuid", props.data?.deploymentUuid
    );
    return <span>N/A</span>;
  }

  if (isFK && !props.data?.foreignKeyObjects[entityUuid][(props.data?.rawValue as any)[attributeName]]) {
    // Handle case where foreign key object is not found
    // This can happen when the foreign key entity hasn't been fetched or doesn't exist
    log.warn(
      "EntityInstanceCellRenderer: foreign key object not found for attribute " + attributeName,
      "raw value", props.data?.rawValue,
      "target entity uuid", entityUuid,
      "target object uuid", (props.data?.rawValue as any)[attributeName],
      "deploymentUuid", props.data?.deploymentUuid,
      "available foreign key instances", Object.keys(props.data?.foreignKeyObjects[entityUuid]??{})
    );
    return <span>Not found</span>;
  }

  const instanceToDisplay2 = isFK?props.data?.foreignKeyObjects[entityUuid][(props.data?.rawValue as any)[attributeName]]:props.data?.rawValue

  // log.info(
  //   "EntityInstanceCellRenderer called for field",
  //   props.colDef?.field,
  //   "with deploymentUuid",
  //   context.deploymentUuid,
  //   "entityUuid",
  //   entityUuid,
  //   "attributeName",
  //   attributeName,
  //   "props.data?.rawValue",
  //   props.data?.rawValue,
  //   "isFK", isFK,
  //   "props.data?.foreignKeyObjects",
  //   props.data?.foreignKeyObjects,
  //   "instanceToDisplay2",
  //   instanceToDisplay2
  //   // "props.data?.foreignKeyObjects[entityUuid]",
  //   // props.data?.foreignKeyObjects[entityUuid],
  //   // "value",
  //   // props.value
  // );

  // ? instanceToDisplay["name"]
  return (
    <span>
      {instanceToDisplay2
        ? (instanceToDisplay2 as any)[isFK?"name":attributeName]
        : "object to display not found" +
      // {instanceToDisplay
      //   ? (instanceToDisplay as any)[attributeName]
      //   : (currentMiroirEntityDefinition ? (currentMiroirEntityDefinition as any)[attributeName] : "entity definition not found") +
          " " +
          props.value +
          " not known."
      }
    </span>
  );
  // }
})

