import { EntityAttribute } from "../../0_interfaces/1_core/EntityDefinition";
import { Instance, InstanceCollection, InstanceWithName } from "../../0_interfaces/1_core/Instance";
import { CUDActionName } from "../../0_interfaces/2_domain/DomainControllerInterface";
import { MiroirReport } from "../../0_interfaces/1_core/Report";

export const ModelUpdateActionNamesObject = {
  // 'create': 'create',
  // 'rename': 'rename',
}
export type ModelUpdateActionName = keyof typeof ModelUpdateActionNamesObject;
export const ModelUpdateActionNamesArray:ModelUpdateActionName[] = Object.keys(ModelUpdateActionNamesObject) as ModelUpdateActionName[];

export interface ModelCUDUpdate {
  // updateActionType: 'ModelCUDUpdate';
  updateActionName: CUDActionName;
  objects?:InstanceCollection[];
}

export interface ModelResetUpdate {
  updateActionType: 'ModelResetUpdate';
  updateActionName: 'resetModel';
}

export interface ModelStructureAbstractUpdate {
  entityUuid:string;
  // equivalentModelCUDUpdates?: ModelCUDUpdate[];
}

export interface ModelStructureCreateUpdate {
  updateActionName: 'create';
  entityName?:string;
  entityUuid:string;
  instances:Instance[];
}

//alter model instances for instance of the Entity entity
export interface ModelStructureAlterEntityAttributeUpdate {
  updateActionName: 'alterEntityAttribute';
  entityName?:string;
  entityUuid:string;
  entityAttributeId: number;
  update:Partial<EntityAttribute>;
}

export interface ModelStructureAlterMetaModelInstanceUpdate {
  updateActionName: 'alterMetaModelInstance';
  entityName?:string;
  entityUuid:string;
  instanceUuid:string;
  update:Partial<InstanceWithName | MiroirReport>;
}

export interface ModelStructureDeleteMetaModelInstanceUpdate {
  updateActionName: 'DeleteMetaModelInstance';
  entityName?:string;
  entityUuid:string;
  instanceUuid:string;
}


export interface ModelStructureRenameEntityUpdate {
  // updateActionType: 'ModelStructureUpdate';
  updateActionName: 'renameMetaModelInstance';
  entityName?:string;
  entityUuid:string;
  entityAttributeName?:string;
  targetValue?:any;
}

export type ModelStructureUpdate =
  | ModelStructureDeleteMetaModelInstanceUpdate
  | ModelStructureAlterMetaModelInstanceUpdate
  | ModelStructureAlterEntityAttributeUpdate
  | ModelStructureRenameEntityUpdate
  | ModelStructureCreateUpdate;

export interface ModelUpdateWithCUDUpdate {
  modelStructureUpdate: ModelStructureUpdate;
  equivalentModelCUDUpdates?: ModelCUDUpdate[];
}

// export type ModelUpdate = ModelStructureUpdate | ModelResetUpdate;
// export interface ModelStructureUpdateConverterInterface {
//   static modelUpdateToLocalCacheUpdate(modelUpdate:ModelStructureUpdate):DomainDataAction[];
// }