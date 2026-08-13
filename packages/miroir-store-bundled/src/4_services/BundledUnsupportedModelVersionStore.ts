import {
  ACTION_OK,
  Action2Error,
  type Action2EntityInstanceCollection,
  type Action2EntityInstanceSuccess,
  type Action2ReturnType,
  type Action2VoidReturnType,
  type Entity,
  type EntityInstance,
  type EntityInstanceCollection,
  type PersistenceStoreDataSectionInterface,
  type RunBoxedQueryAction,
  type RunBoxedQueryTemplateAction,
} from "miroir-core";

export const BUNDLED_MODEL_VERSION_UNSUPPORTED_MESSAGE =
  "Bundled deployments are read-only; the modelVersion section cannot persist version history.";

function unsupported<T>(): Promise<T> {
  return Promise.resolve(
    new Action2Error("FailedToUpsertInstance", BUNDLED_MODEL_VERSION_UNSUPPORTED_MESSAGE) as T,
  );
}

/** #232 — explicit rejection of version-history writes on read-only bundled deployments. */
export class BundledUnsupportedModelVersionStore implements PersistenceStoreDataSectionInterface {
  constructor(private readonly deploymentUuid: string) {}

  getStoreName(): string {
    return `${this.deploymentUuid}-modelVersion-unsupported`;
  }

  async open(): Promise<Action2VoidReturnType> {
    return ACTION_OK;
  }

  async close(): Promise<Action2VoidReturnType> {
    return ACTION_OK;
  }

  async bootFromPersistedState(_entities: Entity[]): Promise<Action2VoidReturnType> {
    return ACTION_OK;
  }

  async clear(): Promise<Action2VoidReturnType> {
    return unsupported();
  }

  getEntityUuids(): string[] {
    return [];
  }

  getEntityIdAttribute(_entityUuid: string): string | string[] {
    return "uuid";
  }

  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    return {};
  }

  async getInstance(
    _parentUuid: string,
    _instancePrimaryKey: string,
  ): Promise<Action2EntityInstanceSuccess> {
    return unsupported();
  }

  async getInstances(_parentUuid: string): Promise<Action2EntityInstanceCollection> {
    return unsupported();
  }

  async handleQueryTemplateActionForServerONLY(
    _query: RunBoxedQueryTemplateAction,
  ): Promise<Action2ReturnType> {
    return unsupported();
  }

  async handleBoxedQueryAction(_query: RunBoxedQueryAction): Promise<Action2ReturnType> {
    return unsupported();
  }

  async upsertInstance(_parentUuid: string, _instance: EntityInstance): Promise<Action2VoidReturnType> {
    return unsupported();
  }

  async deleteInstances(_parentUuid: string, _instances: EntityInstance[]): Promise<Action2VoidReturnType> {
    return unsupported();
  }

  async deleteInstance(_parentUuid: string, _instance: EntityInstance): Promise<Action2VoidReturnType> {
    return unsupported();
  }

  async createStorageSpaceForInstancesOfEntity(_entity: Entity): Promise<Action2VoidReturnType> {
    return unsupported();
  }

  async dropStorageSpaceForInstancesOfEntity(_entityUuid: string): Promise<Action2VoidReturnType> {
    return unsupported();
  }

  async renameStorageSpaceForInstancesOfEntity(
    _oldName: string,
    _newName: string,
    _entity: Entity,
  ): Promise<Action2VoidReturnType> {
    return unsupported();
  }
}
