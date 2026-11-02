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
} from "@miroir-framework/core";

export const BUNDLED_MODEL_VERSION_UNSUPPORTED_MESSAGE =
  "Bundled deployments are read-only; the modelVersion section cannot persist version history.";

/** #647 — a bundled deployment has no devData either: measurements are recorded in development. */
export const BUNDLED_DEV_DATA_UNSUPPORTED_MESSAGE =
  "Bundled deployments are read-only; the devData section cannot persist development data.";

export type BundledUnsupportedSection = "modelVersion" | "devData";

const unsupportedMessages: Record<BundledUnsupportedSection, string> = {
  modelVersion: BUNDLED_MODEL_VERSION_UNSUPPORTED_MESSAGE,
  devData: BUNDLED_DEV_DATA_UNSUPPORTED_MESSAGE,
};

/**
 * #232 — explicit rejection of version-history writes on read-only bundled deployments; #647 —
 * the same for devData.
 */
export class BundledUnsupportedOptionalSectionStore implements PersistenceStoreDataSectionInterface {
  constructor(
    private readonly deploymentUuid: string,
    private readonly section: BundledUnsupportedSection = "modelVersion",
  ) {}

  getStoreName(): string {
    return `${this.deploymentUuid}-${this.section}-unsupported`;
  }

  private unsupported<T>(): Promise<T> {
    return Promise.resolve(
      new Action2Error("FailedToUpsertInstance", unsupportedMessages[this.section]) as T,
    );
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
    return this.unsupported();
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
    return this.unsupported();
  }

  async getInstances(_parentUuid: string): Promise<Action2EntityInstanceCollection> {
    return this.unsupported();
  }

  async handleQueryTemplateActionForServerONLY(
    _query: RunBoxedQueryTemplateAction,
  ): Promise<Action2ReturnType> {
    return this.unsupported();
  }

  async handleBoxedQueryAction(_query: RunBoxedQueryAction): Promise<Action2ReturnType> {
    return this.unsupported();
  }

  async upsertInstance(_parentUuid: string, _instance: EntityInstance): Promise<Action2VoidReturnType> {
    return this.unsupported();
  }

  async deleteInstances(_parentUuid: string, _instances: EntityInstance[]): Promise<Action2VoidReturnType> {
    return this.unsupported();
  }

  async deleteInstance(_parentUuid: string, _instance: EntityInstance): Promise<Action2VoidReturnType> {
    return this.unsupported();
  }

  async createStorageSpaceForInstancesOfEntity(_entity: Entity): Promise<Action2VoidReturnType> {
    return this.unsupported();
  }

  async dropStorageSpaceForInstancesOfEntity(_entityUuid: string): Promise<Action2VoidReturnType> {
    return this.unsupported();
  }

  async renameStorageSpaceForInstancesOfEntity(
    _oldName: string,
    _newName: string,
    _entity: Entity,
  ): Promise<Action2VoidReturnType> {
    return this.unsupported();
  }
}

/** The #232 name, from when modelVersion was the only optional section. */
export const BundledUnsupportedModelVersionStore = BundledUnsupportedOptionalSectionStore;
export type BundledUnsupportedModelVersionStore = BundledUnsupportedOptionalSectionStore;
