import { EntityAttribute, EntityDefinition, MetaEntity } from "../../0_interfaces/1_core/EntityDefinition";
import { EntityInstanceCollection } from "../../0_interfaces/1_core/Instance";
import { CUDActionName } from "../../0_interfaces/2_domain/DomainControllerInterface";

export interface ModelResetUpdate {
  updateActionType: 'ModelResetUpdate';
  updateActionName: 'resetModel';
}

export interface ModelEntityUpdateCreateMetaModelInstance {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'createEntity';
  // parentName?:string;
  // parentUuid:string;
  entities: {
    entity: MetaEntity;
    entityDefinition: EntityDefinition
  }[];
}

export interface ModelEntityUpdateAlterEntityAttribute {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'alterEntityAttribute';
  parentName?:string;
  parentUuid:string;
  entityAttributeId: number;
  update:Partial<EntityAttribute>;
}

export interface ModelEntityUpdateDeleteMetaModelInstance {
  updateActionType: 'ModelEntityUpdate';
  updateActionName: 'DeleteEntity';
  entityName?:string;
  entityUuid:string;
  // instanceUuid:string;
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
export interface ModelCUDInstanceUpdate {
  updateActionType: 'ModelCUDInstanceUpdate';
  updateActionName: CUDActionName;
  objects:EntityInstanceCollection[];
}
  
export interface WrappedTransactionalEntityUpdate {
  updateActionName:'WrappedTransactionalEntityUpdate',
  modelEntityUpdate: ModelEntityUpdate;
}

export interface WrappedTransactionalEntityUpdateWithCUDUpdate {
  updateActionName:'WrappedTransactionalEntityUpdateWithCUDUpdate',
  modelEntityUpdate: ModelEntityUpdate;
  equivalentModelCUDUpdates: ModelCUDInstanceUpdate[];
}

export type ModelUpdate = WrappedTransactionalEntityUpdate | ModelCUDInstanceUpdate;
export type ModelReplayableUpdate = WrappedTransactionalEntityUpdateWithCUDUpdate | ModelCUDInstanceUpdate;