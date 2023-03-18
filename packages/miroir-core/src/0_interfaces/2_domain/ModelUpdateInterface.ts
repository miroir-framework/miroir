import { InstanceCollection } from "../../0_interfaces/1_core/Instance";
import { CUDActionName } from "../../0_interfaces/2_domain/DomainControllerInterface";

export const ModelUpdateActionNamesObject = {
  'rename': 'rename',
}
export type ModelUpdateActionName = keyof typeof ModelUpdateActionNamesObject;
export const ModelUpdateActionNamesArray:ModelUpdateActionName[] = Object.keys(ModelUpdateActionNamesObject) as ModelUpdateActionName[];

export interface ModelResetUpdate {
  updateActionType: 'ModelResetUpdate';
  updateActionName: 'resetModel';
}

export interface ModelStructureUpdate {
  updateActionType: 'ModelStructureUpdate';
  updateActionName: ModelUpdateActionName;
  entityName?:string;
  entityUuid?:string;
  entityAttributeName?:string;
  targetValue?:any;
  equivalentModelCUDUpdates?: ModelCUDUpdate[];
}

export interface ModelCUDUpdate {
  updateActionType: 'ModelCUDUpdate';
  updateActionName: CUDActionName;
  objects?:InstanceCollection[];
}

export type ModelUpdate = ModelStructureUpdate | ModelResetUpdate;
// export interface ModelStructureUpdateConverterInterface {
//   static modelUpdateToLocalCacheUpdate(modelUpdate:ModelStructureUpdate):DomainDataAction[];
// }