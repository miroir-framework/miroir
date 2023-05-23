import {
  Application,
  DataStoreApplicationType,
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  MiroirMetaModel,
  ModelReplayableUpdate,
  ModelStoreInterface,
  StoreControllerInterface,
  WrappedModelEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
  modelInitialize,
} from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "./utils.js";

export class SqlDbModelStore implements ModelStoreInterface {
  private sqlModelSchemaTableAccess: SqlUuidEntityDefinition = {};
  private logHeader: string;
  public modelSequelize: Sequelize;

  // ##############################################################################################
  constructor(
    // seq: any,
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    public modelConnectionString:string,
    public modelSchema:string,
    private sqlDbDataStore: DataStoreInterface,

    // private modelSequelize: Sequelize,
    // private modelSchema: string,
    // private sqlDbStoreFacade: StoreControllerInterface
  ) {
    this.logHeader = "SqlDbModelStore" + " Application " + this.applicationName + " dataStoreType " + this.dataStoreType;
    // if (!seq) throw Error('seq is undefined!');

    this.modelSequelize = new Sequelize(modelConnectionString,{schema:modelSchema}) // Example for postgres
  }

  // ##############################################################################################
  public async connect():Promise<void> {
    try {
      await this.modelSequelize.authenticate();
      console.log('Application',this.applicationName,'dataStoreType',this.dataStoreType,'data Connection to postgres data schema', this.modelSchema, 'has been established successfully.');
    } catch (error) {
      console.error('Unable to connect data', this.modelSchema, ' to the postgres database:', error);
    }
    return Promise.resolve();
  }

  
  // ##############################################################################################
  // TODO: does side effect => refactor!
  getAccessToModelSectionEntity(entity: MetaEntity, entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entity.uuid]: {
        parentName: entity.parentName,
        sequelizeModel: this.modelSequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
            schema: this.modelSchema,
          }
        ),
      },
    };
  }

  // ##############################################################################################
  async bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ): Promise<void> {
    if (Object.keys(this.sqlModelSchemaTableAccess).length > 0) {
      // TODO: allow refresh
      console.warn(
        this.logHeader,
        "bootModelStortFromPersistedState initialization can not be done a second time",
        this.sqlModelSchemaTableAccess
      );
    } else {
      console.log(this.logHeader, "bootModelStortFromPersistedState started");

      if (this.dataStoreType == "miroir") {
        // TODO: read metamodel version in configuration first, and open table with the corresponding definition
        this.sqlModelSchemaTableAccess = entities
          .filter((e) => ["Entity", "EntityDefinition"].indexOf(e.name) >= 0) // the meta-model only has Entity and EntityDefinition entities
          .reduce((prev, curr: MetaEntity) => {
            // TODO: take into account Application Version to determine applicable Entity Definition
            const entityDefinition = entityDefinitions.find((e) => e.entityUuid == curr.uuid);
            // console.warn("sqlDbServer start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
            if (entityDefinition) {
              return Object.assign(prev, this.getAccessToModelSectionEntity(curr, entityDefinition));
            } else {
              return prev;
            }
          }, {});
      } else {
        // create proxies for model Entities (Entity, EntityDefinition, Report, etc.)
        this.sqlModelSchemaTableAccess = entities.reduce((prev, curr: MetaEntity) => {
          // TODO: take into account Application Version to determine applicable Entity Definition
          const entityDefinition = entityDefinitions.find((e) => e.entityUuid == curr.uuid);
          // console.warn("sqlDbServer start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
          if (entityDefinition) {
            return Object.assign(prev, this.getAccessToModelSectionEntity(curr, entityDefinition));
          } else {
            return prev;
          }
        }, {});
      }

      const dataEntities = (await this.getInstances(entityEntity.uuid)) as MetaEntity[];
      const dataEntityDefinitions = (await this.getInstances(entityEntityDefinition.uuid)) as EntityDefinition[];

      await this.sqlDbDataStore.bootFromPersistedState(dataEntities, dataEntityDefinitions);
    }
    console.log(
      "###################",
      this.logHeader,
      "bootFromPersistedState model found sqlModelSchemaTableAccess",
      this.sqlModelSchemaTableAccess,
      "this.modelSequelize",
      Object.keys(this.modelSequelize.models)
    );
    console.log(
      "###################",
      this.logHeader,
      "bootFromPersistedState data found this.dataSequelize",
      this.sqlDbDataStore.getEntityUuids()
    );
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropModelAndData(metaModel: MiroirMetaModel): Promise<void> {
    // drop data anq model Entities
    await this.sqlDbDataStore.dropData();
    await this.modelSequelize.drop();
    // await this.dataSequelize.drop();

    this.sqlModelSchemaTableAccess = {};
    console.log(this.logHeader, "dropModelAndData DONE", this.getEntities());

    return Promise.resolve();
  }

  // ##############################################################################################
  getEntities(): string[] {
    return this.sqlDbDataStore.getEntityUuids();
  }

  // ##############################################################################################
  existsEntity(entityUuid: string): boolean {
    return this.sqlDbDataStore.getEntityUuids().includes(entityUuid);
  }

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    console.log(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "Application",
      this.applicationName,
      "dataStoreType",
      this.dataStoreType,
      "input: entity",
      entity,
      "entityDefinition",
      entityDefinition,
      "sqlEntities",
      this.sqlModelSchemaTableAccess
    );
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
        "Application",
        this.applicationName,
        "dataStoreType",
        this.dataStoreType,
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      this.sqlModelSchemaTableAccess = Object.assign(
        {},
        this.sqlModelSchemaTableAccess,
        this.getAccessToModelSectionEntity(entity, entityDefinition)
      );
      console.log(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
        "Application",
        this.applicationName,
        "dataStoreType",
        this.dataStoreType,
        "creating model schema table",
        entity.name
      );
      await this.sqlModelSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    console.log(
      this.logHeader,
      "createEntity",
      "input: entity",
      entity,
      "entityDefinition",
      entityDefinition,
      "sqlEntities",
      this.sqlDbDataStore.getEntityUuids()
    );
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(
        this.logHeader,
        "createEntity",
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      await this.sqlDbDataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);

      if (!!this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntity.uuid]) {
        await this.sqlModelSchemaTableAccess[entityEntity.uuid].sequelizeModel.upsert(entity as any);
      } else {
        console.error(
          this.logHeader,
          "createEntity",
          "Application",
          this.applicationName,
          "dataStoreType",
          this.dataStoreType,
          "could not insert in model schema for entity",
          entity
        );
      }
      if (!!this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid]) {
        await this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid].sequelizeModel.upsert(
          entityDefinition as any
        );
      } else {
        console.error(
          this.logHeader,
          "createEntity",
          "Application",
          this.applicationName,
          "dataStoreType",
          this.dataStoreType,
          "could not insert in model schema for entityDefinition",
          entityDefinition
        );
      }
      // }
    }
    console.log(this.logHeader, "createEntity", "done for", entity.name);
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    if ([entityEntity.uuid, entityEntityDefinition.uuid].includes(entityUuid)) {
      // TODO: UGLY!!!!!!! DOES IT EVEN WORK????
      if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityUuid]) {
        const model = this.sqlModelSchemaTableAccess[entityUuid];
        console.log("dropEntity entityUuid", entityUuid, "parentName", model.parentName);
        await model.sequelizeModel.drop();
        delete this.sqlModelSchemaTableAccess[entityUuid];
      } else {
        console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
      }
    } else {
      if (this.sqlDbDataStore.getEntityUuids().includes(entityUuid)) {
        await this.sqlDbDataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);

        //remove all entity definitions for the dropped entity
        const entityDefinitions = (
          (await this.getInstances(entityEntityDefinition.uuid)) as EntityDefinition[]
        ).filter((i) => i.entityUuid == entityUuid);
        for (const entityDefinition of entityDefinitions) {
          await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      } else {
        console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
      }
    }
    return Promise.resolve();
  }
  // ##############################################################################################
  async dropEntities(entityUuids: string[]) {
    console.log("dropEntities parentUuid", entityUuids);
    for (const e of entityUuids) {
      await this.dropEntity(e);
    }
    return Promise.resolve();
  }
  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate) {
    if (
      update.equivalentModelCUDUpdates.length 
      && update.equivalentModelCUDUpdates[0]
      && update.equivalentModelCUDUpdates[0].objects?.length
      && update.equivalentModelCUDUpdates[0].objects[0]
      && update.equivalentModelCUDUpdates[0].objects[1]
      && update.equivalentModelCUDUpdates[0].objects[0].instances[0]
      && update.equivalentModelCUDUpdates[0].objects[1].instances[0]
    ) {
      const modelCUDupdate = update.equivalentModelCUDUpdates[0];
      const model = (modelCUDupdate && modelCUDupdate.objects?.length && modelCUDupdate.objects[0])?this.sqlModelSchemaTableAccess[modelCUDupdate.objects[0].parentUuid]:undefined;
      console.log(this.logHeader,'renameEntity update',update);
      console.log(this.logHeader,'renameEntity model',model);
      
      // console.log(this.logHeader,'renameEntity modelSequelize tables',Object.keys(this.modelSequelize.models), 'this.sqlModelSchemaTableAccess',this.sqlModelSchemaTableAccess);
      // console.log(this.logHeader,'renameEntity dataSequelize ',this.dataSequelize.config,'tables',Object.keys(this.dataSequelize.models),'this.sqlDataSchemaTableAccess',this.sqlDataSchemaTableAccess);
      
      await this.sqlDbDataStore.renameStorageSpaceForInstancesOfEntity(
        update.modelEntityUpdate['entityName'],
        update.modelEntityUpdate['targetValue'],
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
        update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
      );

      if (modelCUDupdate.objects && model?.parentName) { // this.modelSequelize indexes tables by name, it has to be updated to stay consistent
        // update the instance in table Entity and EntityDefinition corresponding to the renamed entity
        await this.upsertInstance(modelCUDupdate.objects[0].parentUuid, modelCUDupdate.objects[0].instances[0]);
        await this.upsertInstance(entityEntityDefinition.uuid, modelCUDupdate.objects[1].instances[0]);
        
      } else {
        console.error('renameEntity could not execute update',update);
      }
    } else {
      console.error('renameEntity could not execute update',update);
    }
    console.log(this.logHeader, 'renameEntity done.');
    return Promise.resolve();
  }

  // ##############################################################################################
  async getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[parentUuid]) {
      const result:EntityInstance = (await this.sqlModelSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))?.dataValues;
      return Promise.resolve(result);
    } else {
      console.warn('getInstance',this.applicationName,this.dataStoreType,'could not find entityUuid',parentUuid);
      return Promise.resolve(undefined);
    }
  }

  // ##############################################################################################
  async getInstances(parentUuid: string): Promise<EntityInstance[]> {
    console.log(this.logHeader, "getModelInstances calling findall", parentUuid);
    let result;
    if (this.sqlModelSchemaTableAccess) {
      if (this.sqlModelSchemaTableAccess[parentUuid]) {
        result = await this.sqlModelSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll();
      } else {
        result = [];
      }
    } else {
      result = [];
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log(
      this.logHeader,
      "upsertInstance",
      this.applicationName,
      "upserting into Parent",
      instance["parentUuid"],
      "named",
      instance["parentName"],
      "existing model schema entities",
      Object.keys(this.sqlModelSchemaTableAccess ? this.sqlModelSchemaTableAccess : {}),
      "instance",
      instance
    );
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    await this.sqlModelSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
    return Promise.resolve();
  }
  // ##############################################################################################
  async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    for (const instance of instances) {
      await this.deleteInstance(parentUuid, instance);
    }
    return Promise.resolve();
  }
  // ##############################################################################################
  async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("deleteInstance", parentUuid, instance);
    await this.sqlModelSchemaTableAccess[parentUuid].sequelizeModel.destroy({ where: { uuid: instance.uuid } });
    return Promise.resolve();
  }
  
  // ##############################################################################################
  applyModelEntityUpdate(update: ModelReplayableUpdate) {
    throw new Error("Method not implemented.");
  }

  // ##############################################################################################
  async close(): Promise<void> {
    await this.modelSequelize?.close();
    return Promise.resolve();
    // disconnect from DB?
  }
  
}
