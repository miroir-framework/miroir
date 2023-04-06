import { EntityAttribute } from "../../0_interfaces/1_core/EntityDefinition";
import { EntityInstance, EntityInstanceCollection } from "../../0_interfaces/1_core/Instance";
import { CUDActionName } from "../../0_interfaces/2_domain/DomainControllerInterface";

export interface ModelResetUpdate {
  updateActionType: 'ModelResetUpdate';
  updateActionName: 'resetModel';
}

export interface ModelEntityUpdateCreateMetaModelInstance {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'createEntity';
  entityName?:string;
  entityDefinitionUuid:string;
  instances:EntityInstance[];
}

export interface ModelEntityUpdateAlterEntityAttribute {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'alterEntityAttribute';
  entityName?:string;
  entityDefinitionUuid:string;
  entityAttributeId: number;
  update:Partial<EntityAttribute>;
}

export interface ModelEntityUpdateDeleteMetaModelInstance {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'DeleteEntity';
  entityName?:string;
  entityDefinitionUuid:string;
  instanceUuid:string;
}

export interface ModelEntityUpdateRenameEntity {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'renameEntity';
  entityName?:string;
  entityDefinitionUuid:string;
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
  objects?:EntityInstanceCollection[];
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