import {
  ACTION_OK,
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  ApplicationSection,
  defaultMetaModelEnvironment,
  Domain2ElementFailed,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  ExtractorRunnerInMemory,
  ExtractorTemplateRunnerInMemory,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  type ApplicationDeploymentMap,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { BundledStore } from "./BundledStore.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "BundledModelStoreSection")
).then((logger: LoggerInterface) => {
  log = logger;
});

export class BundledModelStoreSection
  extends BundledStore
  implements PersistenceStoreModelSectionInterface
{
  private dataMap: Map<string, Map<string, EntityInstance>>;
  private entityIdAttributes: Record<string, string | string[]> = {};
  public extractorRunner: ExtractorRunnerInMemory;
  public extractorTemplateRunner: ExtractorTemplateRunnerInMemory;

  constructor(
    storeName: string,
    private applicationSection: ApplicationSection,
    initialData: Record<string, EntityInstance[]>,
    private _dataStore: PersistenceStoreDataSectionInterface,
  ) {
    super(storeName, "BundledModelStoreSection " + storeName);
    this.dataMap = new Map(
      Object.entries(initialData).map(([parentUuid, instances]) => [
        parentUuid,
        new Map(instances.map((i) => [String((i as any).uuid ?? JSON.stringify(i)), i])),
      ]),
    );
    this.extractorRunner = new ExtractorRunnerInMemory(this);
    this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(this, this.extractorRunner);
  }

  // ##############################################################################################
  async bootFromPersistedState(
    entities: Entity[],
    entityDefinitions: EntityDefinition[],
  ): Promise<Action2VoidReturnType> {
    for (const ed of entityDefinitions) {
      const idAttr = (ed as any).idAttribute ?? "uuid";
      if (idAttr !== "uuid") {
        this.entityIdAttributes[ed.entityUuid] = idAttr;
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  getEntityUuids(): string[] {
    return [...this.dataMap.keys()];
  }

  getEntityIdAttribute(entityUuid: string): string | string[] {
    return this.entityIdAttributes[entityUuid] ?? "uuid";
  }

  async clear(): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    _entity: Entity,
    _entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async dropStorageSpaceForInstancesOfEntity(_entityUuid: string): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async renameStorageSpaceForInstancesOfEntity(
    _oldName: string,
    _newName: string,
    _entity: Entity,
    _entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  existsEntity(entityUuid: string): boolean {
    return this.dataMap.has(entityUuid);
  }

  async createEntity(
    _entity: Entity,
    _entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async createEntities(
    _entities: { entity: Entity; entityDefinition: EntityDefinition }[],
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async renameEntityClean(_update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async alterEntityAttribute(
    _update: ModelActionAlterEntityAttribute,
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async dropEntity(_parentUuid: string): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async dropEntities(_parentUuids: string[]): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async getInstance(
    parentUuid: string,
    instancePrimaryKey: string,
  ): Promise<Action2EntityInstanceReturnType> {
    const instance = this.dataMap.get(parentUuid)?.get(instancePrimaryKey);
    if (!instance) {
      return Promise.resolve(
        new Action2Error(
          "FailedToGetInstance",
          `getInstance: instance ${instancePrimaryKey} of entity ${parentUuid} not found in bundled model store`,
        ),
      );
    }
    return Promise.resolve({
      status: "ok",
      returnedDomainElement: instance,
    });
  }

  async getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
    const instances = this.dataMap.get(parentUuid);
    return Promise.resolve({
      status: "ok",
      returnedDomainElement: {
        parentUuid,
        applicationSection: this.applicationSection,
        instances: instances ? [...instances.values()] : [],
      },
    });
  }

  async handleBoxedQueryAction(
    query: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleBoxedQueryAction", "query", query);
    return this.extractorRunner.handleBoxedQueryAction(
      query,
      applicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
  }

  async handleQueryTemplateActionForServerONLY(
    query: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", query);
    return this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(
      query,
      applicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
  }

  async upsertInstance(
    _parentUuid: string,
    _instance: EntityInstance,
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async deleteInstances(
    _parentUuid: string,
    _instances: EntityInstance[],
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  async deleteInstance(
    _parentUuid: string,
    _instance: EntityInstance,
  ): Promise<Action2VoidReturnType> {
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    const result: { [uuid: string]: EntityInstanceCollection } = {};
    for (const parentUuid of this.getEntityUuids()) {
      const instances: Action2EntityInstanceCollectionOrFailure =
        await this.getInstances(parentUuid);
      if (
        instances instanceof Action2Error ||
        instances.returnedDomainElement instanceof Domain2ElementFailed
      ) {
        log.error(this.logHeader, "getState error getting instances for", parentUuid, instances);
        result[parentUuid] = {
          parentUuid,
          applicationSection: this.applicationSection,
          instances: [],
        };
      } else {
        result[parentUuid] = instances.returnedDomainElement as EntityInstanceCollection;
      }
    }
    return Promise.resolve(result);
  }
}
