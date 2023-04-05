import { EntityAttribute } from "../../0_interfaces/1_core/EntityDefinition";
import { Instance, InstanceCollection } from "../../0_interfaces/1_core/Instance";
import { CUDActionName } from "../../0_interfaces/2_domain/DomainControllerInterface";

export interface ModelResetUpdate {
  updateActionType: 'ModelResetUpdate';
  updateActionName: 'resetModel';
}

export interface ModelEntityUpdateCreateMetaModelInstance {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'createEntity';
  entityName?:string;
  entityUuid:string;
  instances:Instance[];
}

export interface ModelEntityUpdateAlterEntityAttribute {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'alterEntityAttribute';
  entityName?:string;
  entityUuid:string;
  entityAttributeId: number;
  update:Partial<EntityAttribute>;
}

export interface ModelEntityUpdateDeleteMetaModelInstance {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'DeleteEntity';
  entityName?:string;
  entityUuid:string;
  instanceUuid:string;
}

export interface ModelEntityUpdateRenameEntity {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'renameEntity';
  entityName?:string;
  entityUuid:string;
  entityAttributeName?:string;
  targetValue?:any;
}

export type ModelEntityUpdate =
  | ModelEntityUpdateCreateMetaModelInstance
  | ModelEntityUpdateAlterEntityAttribute
  | ModelEntityUpdateDeleteMetaModelInstance
  | ModelEntityUpdateRenameEntity
;
export interface ModelCUDUpdate {
  updateActionType: 'ModelCUDUpdate';
  updateActionName: CUDActionName;
  objects?:InstanceCollection[];
}
  
export interface WrappedModelEntityUpdate {
  updateActionName:'WrappedModelEntityUpdate',
  modelEntityUpdate: ModelEntityUpdate;
}

export interface WrappedModelEntityUpdateWithCUDUpdate {
  updateActionName:'WrappedModelEntityUpdateWithCUDUpdate',
  modelEntityUpdate: ModelEntityUpdate;
  equivalentModelCUDUpdates: ModelCUDUpdate[];
}

export type ModelUpdate = WrappedModelEntityUpdate | ModelCUDUpdate;
export type ModelReplayableUpdate = WrappedModelEntityUpdateWithCUDUpdate | ModelCUDUpdate;