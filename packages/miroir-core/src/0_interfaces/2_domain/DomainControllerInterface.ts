import { Uuid } from "../../0_interfaces/1_core/EntityDefinition.js";
import {
  ModelCUDInstanceUpdate,
  WrappedTransactionalEntityUpdate,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
} from "../../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import { DataStoreApplicationType } from "../../3_controllers/ModelInitializer.js";
import { Application } from "../1_core/Application.js";
import { EntityInstance, EntityInstanceCollection } from "../1_core/Instance.js";
import { MiroirMetaModel } from "../1_core/Model.js";

export const CUDActionNamesObject = {
  create: "create",
  update: "update",
  delete: "delete",
};
export type CUDActionName = keyof typeof CUDActionNamesObject;
export const CUDActionNamesArray: CRUDActionName[] = Object.keys(CUDActionNamesObject) as CRUDActionName[];
export const CUDActionNamesArrayString: string[] = CUDActionNamesArray.map((a) => a);

// #############################################################################################
export const CRUDActionNamesObject = {
  ...CUDActionNamesObject,
  read: "read",
};
export type CRUDActionName = keyof typeof CRUDActionNamesObject;
export const CRUDActionNamesArray: CRUDActionName[] = Object.keys(CRUDActionNamesObject) as CRUDActionName[];
export const CRUDActionNamesArrayString: string[] = CRUDActionNamesArray.map((a) => a);

// #############################################################################################
export const undoRedoActionNamesObject = {
  undo: "undo",
  redo: "redo",
};
export type UndoRedoActionName = keyof typeof undoRedoActionNamesObject;
export const undoRedoActionNamesArray: UndoRedoActionName[] = Object.keys(
  undoRedoActionNamesObject
) as UndoRedoActionName[];

// // #############################################################################################
export const ModelEntityUpdateActionNamesObject = {
  resetModel: "resetModel", // to delete all DB contents. DANGEROUS. TEMPORARY?
  initModel: "initModel", // to delete all DB contents. DANGEROUS. TEMPORARY?
  updateEntity: "updateEntity",
};
export type ModelEntityUpdateActionName = keyof typeof ModelEntityUpdateActionNamesObject;
export const ModelEntityUpdateActionNamesArray: ModelEntityUpdateActionName[] = Object.keys(
  ModelEntityUpdateActionNamesObject
) as ModelEntityUpdateActionName[];
export const ModelEntityUpdateActionNamesArrayString: string[] = ModelEntityUpdateActionNamesArray.map((a) => a);

// #############################################################################################
export interface DomainDataAction {
  actionType: "DomainDataAction";
  actionName: CUDActionName;
  steps?: number; // for undo / redo
  uuid?: string;
  objects: EntityInstanceCollection[];
}

export interface DomainTransactionalEntityUpdateAction {
  actionType: "DomainTransactionalAction";
  actionName: "updateEntity"; //`${ModelEntityUpdateActionNamesObject.updateModel}`;
  update: WrappedTransactionalEntityUpdate;
}

export interface DomainTransactionalReplayableEntityUpdateAction {
  actionType: "DomainTransactionalAction";
  actionName: "updateEntity"; //`${ModelEntityUpdateActionNamesObject.updateModel}`;
  update: WrappedTransactionalEntityUpdateWithCUDUpdate;
}

export interface DomainTransactionalCUDAction {
  actionType: "DomainTransactionalAction";
  actionName: "UpdateMetaModelInstance";
  update: ModelCUDInstanceUpdate;
}

export type DomainTransactionalReplayableAction =
  | DomainTransactionalReplayableEntityUpdateAction
  | DomainTransactionalCUDAction;

export interface DomainTransactionalCommitAction {
  actionType: "DomainTransactionalAction";
  actionName: "commit";
  label?: string;
}

export interface DomainTransactionalRollbackAction {
  actionType: "DomainTransactionalAction";
  actionName: "rollback";
}

export interface DomainTransactionalReplaceLocalCacheAction {
  actionType: "DomainTransactionalAction";
  actionName: "replaceLocalCache";
  objects: EntityInstanceCollection[];
}

export interface DomainTransactionalUndoRedoAction {
  actionType: "DomainTransactionalAction";
  actionName: UndoRedoActionName;
  // objects?:EntityInstanceCollection[]; // for "replace" action only. To separate, for clarification?
}

export interface DomainTransactionalResetAction {
  actionType: "DomainTransactionalAction";
  actionName: "resetModel";
}

export interface DomainModelInitActionParams {
  metaModel: MiroirMetaModel;
  dataStoreType: DataStoreApplicationType;
  application: Application;
  applicationDeployment: EntityInstance;
  applicationModelBranch: EntityInstance;
  applicationVersion: EntityInstance;
  applicationStoreBasedConfiguration: EntityInstance;
}
export interface DomainModelInitAction {
  actionType: "DomainTransactionalAction";
  actionName: "initModel";
  params: DomainModelInitActionParams;
}

export type DomainAncillaryAction =
  | DomainTransactionalCommitAction
  | DomainTransactionalRollbackAction
  | DomainTransactionalReplaceLocalCacheAction
  | DomainTransactionalUndoRedoAction
  | DomainTransactionalResetAction
  | DomainModelInitAction;

export type DomainTransactionalAction =
  | DomainAncillaryAction
  | DomainTransactionalCUDAction
  | DomainTransactionalEntityUpdateAction;

export type DomainTransactionalAncillaryOrReplayableAction =
  | DomainAncillaryAction
  | DomainTransactionalCUDAction
  | DomainTransactionalReplayableEntityUpdateAction;

// #############################################################################################
export const remoteStoreActionNamesObject = {
  ...CRUDActionNamesObject,
  ...ModelEntityUpdateActionNamesObject,
};
export type RemoteStoreActionName = keyof typeof remoteStoreActionNamesObject;
export const remoteStoreActionNamesArray: RemoteStoreActionName[] = Object.keys(
  remoteStoreActionNamesObject
) as RemoteStoreActionName[];

// #############################################################################################
export type DomainAction = DomainDataAction | DomainTransactionalAction;
export interface DomainActionWithDeployment {
  deploymentUuid: Uuid;
  domainAction: DomainAction;
}

export type DomainAncillaryOrReplayableAction = DomainDataAction | DomainTransactionalAncillaryOrReplayableAction;

export interface DomainAncillaryOrReplayableActionWithDeployment {
  deploymentUuid: Uuid;
  domainAction: DomainAncillaryOrReplayableAction;
}

export interface DomainInstancesUuidIndex {
  [uuid: string]: EntityInstance;
}
export interface EntitiesDomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-redux.
  [entityUuid: string]: DomainInstancesUuidIndex;
}

export type DomainStateTransformer = (domainState: EntitiesDomainState) => EntitiesDomainState;
export type DomainStateSelector = (domainState: EntitiesDomainState) => EntityInstance[];
export type DomainStateReducer = (domainState: EntitiesDomainState) => any;

export interface DomainControllerInterface {
  handleDomainNonTransactionalAction(deploymentUuid: Uuid, action: DomainDataAction): Promise<void>;
  handleDomainTransactionalAction(
    deploymentUuid: Uuid,
    action: DomainTransactionalAction,
    currentModel?: MiroirMetaModel
  ): Promise<void>;
  handleDomainAction(deploymentUuid: Uuid, action: DomainAction, currentModel?: MiroirMetaModel): Promise<void>;
  currentTransaction(): DomainTransactionalReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}
