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
    throw new Error("EntityInstanceCellRenderer no foreign key objects found for attribute '" + attributeName + "'"); 
  }
  if (isFK && !props.data?.foreignKeyObjects[entityUuid]) {
    throw new Error(
      "EntityInstanceCellRenderer no foreign key objects found for attribute '" +
        attributeName +
        "' entity uuid " +
        entityUuid +
        " foreign key entities " +
        // Object.keys(props.data?.foreignKeyObjects??{})
        JSON.stringify(props.data?.foreignKeyObjects??{}) +
        " entity definition " + 
        JSON.stringify(props.colDef?.cellRendererParams.entityDefinition, null, 2) +
        " deploymentUuid " + props.data?.deploymentUuid
    ); 
  }
  
  if (isFK && !(props.data?.rawValue as any)[attributeName]) {
    throw new Error(
      "EntityInstanceCellRenderer no foreign key uuid found for attribute '" +
        attributeName +
        "' on raw value " +
        JSON.stringify(props.data?.rawValue) +
        " deploymentUuid " + props.data?.deploymentUuid
    ); 
  }

  if (isFK && !props.data?.foreignKeyObjects[entityUuid][(props.data?.rawValue as any)[attributeName]]) {
    throw new Error(
      "EntityInstanceCellRenderer no foreign key object found for attribute " +
        attributeName +
        " on raw value " +
        JSON.stringify(props.data?.rawValue) +
        " target entity uuid " + entityUuid + 
        " target object uuid " + (props.data?.rawValue as any)[attributeName] +
        " deploymentUuid " + props.data?.deploymentUuid +
        " foreign key instances " +
        Object.keys(props.data?.foreignKeyObjects[entityUuid]??{})
    ); 
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

