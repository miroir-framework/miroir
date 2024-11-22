import { ICellRendererParams } from "ag-grid-community";
import { LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { memo } from "react";
import { packageName } from "../../../constants.js";
import { TableComponentRow } from "./MTableComponentInterface.js";
import { cleanLevel } from "../constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"EntityInstanceCellRenderer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
export const EntityInstanceCellRenderer =  memo((props: ICellRendererParams<TableComponentRow>) => {
  // const context = useMiroirContextService();
  
  // const deploymentUuid = context.deploymentUuid;
  const entityUuid = props.colDef?.cellRendererParams.entityUuid;
  const isFK = props.colDef?.cellRendererParams.isFK
  // const currentMiroirEntityDefinition = props.colDef?.cellRendererParams.entityDefinition
  // log.info(
  //   "EntityInstanceCellRenderer called for field",
  //   props.colDef?.field,
  //   "with deploymentUuid",
  //   context.deploymentUuid,
  //   "entityUuid",
  //   entityUuid,
  //   "props:",
  //   props,
  //   "value",
  //   props.value
  // );
  
  // const currentModelSelectorParams:LocalCacheExtractor = useMemo(
  //   () => ({
  //     queryType: "localCacheEntityInstancesExtractor",
  //     definition: {
  //       deploymentUuid: context.deploymentUuid,
  //     }
  //   } as LocalCacheExtractor),
  //   [context]
  // );

  // const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState,[]);
  // const currentModel = useSelector((state: ReduxStateWithUndoRedo) =>
  //   localSelectModelForDeployment(state, currentModelSelectorParams)
  // ) as MetaModel

  // TODO: costly!!!!
  // const currentModel: MetaModel = useCurrentModel(context.deploymentUuid)
  // const currentMiroirEntityDefinition: EntityDefinition | undefined =
  //   props.colDef?.cellRendererParams.entityDefinition ??
  //   currentModel.entityDefinitions?.find((e) => e?.entityUuid == entityUuid)
  // ;
  
  // log.info("EntityInstanceCellRenderer currentMiroirEntityDefinition", currentMiroirEntityDefinition)
  // const selectorParams:LocalCacheExtractor = useMemo(
  //   () => ({
  //     queryType: "localCacheEntityInstancesExtractor",
  //     definition: {
  //       deploymentUuid,
  //       applicationSection: context.applicationSection,
  //       entityUuid: entityUuid,
  //     }
  //   } as LocalCacheExtractor),
  //   [deploymentUuid, entityUuid]
  // );
  // const instancesToDisplay: EntityInstanceWithName[] = useSelector((state: ReduxStateWithUndoRedo) =>
  //   selectInstanceArrayForDeploymentSectionEntity(state, selectorParams)
  // ) as EntityInstanceWithName[];
  // log.info("EntityInstanceCellRenderer instancesToDisplay",instancesToDisplay);

  // const instanceToDisplay: EntityInstanceWithName = (
  //   props.colDef?.cellRendererParams.entityDefinition
  //     ? props.data?.rawValue
  //     : instancesToDisplay.find((i) => i.uuid == (props.data?.rawValue as any)[props.colDef?.field ?? ""])
  // ) as EntityInstanceWithName;

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

