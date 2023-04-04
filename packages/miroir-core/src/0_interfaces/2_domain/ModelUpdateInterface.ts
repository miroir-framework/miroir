import { EntityAttribute } from "../../0_interfaces/1_core/EntityDefinition";
import { Instance, InstanceCollection, InstanceWithName } from "../../0_interfaces/1_core/Instance";
import { CUDActionName } from "../../0_interfaces/2_domain/DomainControllerInterface";
import { MiroirReport } from "../../0_interfaces/1_core/Report";

// export const ModelUpdateActionNamesObject = {
//   // 'create': 'create',
//   // 'rename': 'rename',
// }
// export type ModelUpdateActionName = keyof typeof ModelUpdateActionNamesObject;
// export const ModelUpdateActionNamesArray:ModelUpdateActionName[] = Object.keys(ModelUpdateActionNamesObject) as ModelUpdateActionName[];

export interface ModelResetUpdate {
  updateActionType: 'ModelResetUpdate';
  updateActionName: 'resetModel';
}

// export interface ModelStructureAbstractUpdate {
//   entityUuid:string;
//   // equivalentModelCUDUpdates?: ModelCUDUpdate[];
// }

export interface ModelEntityUpdateCreateMetaModelInstance {
  updateActionName: 'create';
  entityName?:string;
  entityUuid:string;
  instances:Instance[];
}

//alter model instances for instance of the Entity entity
export interface ModelEntityUpdateAlterEntityAttribute {
  updateActionName: 'alterEntityAttribute';
  entityName?:string;
  entityUuid:string;
  entityAttributeId: number;
  update:Partial<EntityAttribute>;
}

export interface ModelEntityUpdateAlterMetaModelInstance {
  updateActionName: 'alterMetaModelInstance';
  entityName?:string;
  entityUuid:string;
  instanceUuid:string;
  update:Partial<InstanceWithName | MiroirReport>;
}

export interface ModelEntityUpdateDeleteMetaModelInstance {
  updateActionName: 'DeleteMetaModelInstance';
  entityName?:string;
  entityUuid:string;
  instanceUuid:string;
}

export interface ModelEntityUpdateRenameEntity {
  // updateActionType: 'ModelEntityUpdate';
  updateActionName: 'renameEntity';
  entityName?:string;
  entityUuid:string;
  entityAttributeName?:string;
  targetValue?:any;
}

export type ModelEntityUpdate =
  | ModelEntityUpdateDeleteMetaModelInstance
  | ModelEntityUpdateAlterMetaModelInstance
  | ModelEntityUpdateAlterEntityAttribute
  | ModelEntityUpdateRenameEntity
  | ModelEntityUpdateCreateMetaModelInstance;

export interface ModelCUDUpdate {
  // updateActionType: 'ModelCUDUpdate';
  updateActionName: CUDActionName;
  objects?:InstanceCollection[];
}
  
export interface ModelEntityUpdateWithCUDUpdate {
  updateActionName:'ModelEntityUpdateWithCUDUpdate',
  modelEntityUpdate: ModelEntityUpdate;
  equivalentModelCUDUpdates?: ModelCUDUpdate[];
}

export type ModelUpdate = ModelEntityUpdateWithCUDUpdate | ModelCUDUpdate;
// export interface ModelEntityUpdateConverterInterface {
//   static modelUpdateToLocalCacheUpdate(modelUpdate:ModelEntityUpdate):DomainDataAction[];
// }