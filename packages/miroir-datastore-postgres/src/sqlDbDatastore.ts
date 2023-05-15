import {
  Application,
  applyModelEntityUpdate,
  DataStoreApplicationType,
  DataStoreInterface,
  EntityAttributeType,
  EntityDefinition,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  metamodelEntities,
  MiroirMetaModel,
  ModelEntityUpdateRenameEntity,
  modelInitialize,
  ModelReplayableUpdate,
  WrappedModelEntityUpdateWithCUDUpdate
} from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, QueryInterfaceOptions, QueryTypes, Sequelize } from "sequelize";

const dataTypesMapping: { [type in EntityAttributeType]: DataTypes.AbstractDataTypeConstructor } = {
  STRING: DataTypes.STRING,
  ARRAY: DataTypes.JSONB, // OK?
  OBJECT: DataTypes.JSONB, 
  // OBJECT: DataTypes.STRING, // TODO: use JSONB for OBJECTs on postgres!
  ENTITY_INSTANCE_UUID: DataTypes.STRING,
};

// ##############################################################################################
function fromMiroirEntityDefinitionToSequelizeEntityDefinition(
  entityDefinition: EntityDefinition
): ModelAttributes<Model, Attributes<Model>> {
  return Object.fromEntries(
    entityDefinition.attributes.map((a) => {
      return [[a.name], { type: dataTypesMapping[a.type], allowNull: a.nullable, primaryKey: a.name == "uuid" }];
    })
  );
}

// ##############################################################################################
// export type SqlEntityDefinition = { [parentName in string]: ModelStatic<Model<any, any>> };
export type SqlUuidEntityDefinition = {
  [parentUuid in string]: { parentName?: string; sequelizeModel: ModelStatic<Model<any, any>> };
};

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export class SqlDbDatastore implements DataStoreInterface {
  private sqlDataSchemaTableAccess: SqlUuidEntityDefinition = {};
  private sqlModelSchemaTableAccess: SqlUuidEntityDefinition= {};
  private logHeader: string;

  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private modelSequelize: Sequelize,
    private modelSchema: string,
    private dataSequelize: Sequelize,
    private dataSchema: string,
  ) {
    this.logHeader = 'SqlDbDatastore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
  }

  // ##############################################################################################
  // TODO: does side effect on sequelize object => refactor!
  getAccessToEntity(sequelize:Sequelize, entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entity.uuid]: {
        parentName: entity.parentName, 
        sequelizeModel: sequelize.define(
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
  // TODO: does side effect => refactor!
  getAccessToModelSectionEntity(entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
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
  getAccessToDataSectionEntity(entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    // TODO: does side effect => refactor!
    return {
      [entity.uuid]: {
        parentName: entity.parentName,
        sequelizeModel: this.dataSequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
            schema: this.dataSchema,
          }
        ),
      },
    };
  }
  
  // // ##############################################################################################
  async initApplication(
    metaModel:MiroirMetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
    ):Promise<void> {
    await modelInitialize(
      metaModel,
      this,
      dataStoreType,
      application,
      applicationDeployment,
      applicationModelBranch,
      applicationVersion,
      applicationStoreBasedConfiguration,
    );
    return Promise.resolve(undefined);
  }

  // ##############################################################################################
  async dropModelAndData(
    metaModel:MiroirMetaModel,
  ):Promise<void> {
    // drop model schema Entities
    // if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid]) {
    //   const model = this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid];
    //   console.log("dropModelAndData entityUuid", entityEntityDefinition.uuid, 'name',entityEntityDefinition.name);
    //   await model.sequelizeModel.drop();
    //   delete this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid];
    // }
    // if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntity.uuid]) {
    //   const model = this.sqlModelSchemaTableAccess[entityEntity.uuid];
    //   console.log("dropModelAndData entityUuid", entityEntity.uuid, 'parentName',entityEntity.name);
    //   await model.sequelizeModel.drop();
    //   delete this.sqlDataSchemaTableAccess[entityEntity.uuid];
    // }
    await this.modelSequelize.drop();


    // drop data schema Entities
    await this.dataSequelize.drop();

    // this.sqlEntityDefinitions = {};
    this.sqlModelSchemaTableAccess = {};
    this.sqlDataSchemaTableAccess = {};
  }
    
  // ##############################################################################################
  async createProxy(
    metaModel:MiroirMetaModel,
    dataStoreType?: DataStoreApplicationType,
  ): Promise<void> {
    if (Object.keys(this.sqlDataSchemaTableAccess).length > 0) {
      // TODO: allow refresh
      console.warn(this.logHeader,"createProxy initialization can not be done a second time", this.sqlDataSchemaTableAccess);
    } else {
      console.warn(this.logHeader,"createProxy started");
      // const metaModelEntityEntity = metaModel.entities.find(e=>e.uuid = entityEntity.uuid);
      // const metaModelEntityDefinitionEntity = metaModel.entityDefinitions.find(e=>e.uuid = entityDefinitionEntity.uuid);
      // const metaModelEntityEntityDefinition = metaModel.entities.find(e=>e.uuid = entityEntityDefinition.uuid);
      // const metaModelEntityDefinitionEntityDefinition = metaModel.entityDefinitions.find(e=>e.uuid = entityDefinitionEntityDefinition.uuid);

      if (this.dataStoreType == 'miroir') {
        // TODO: read metamodel version in configuration first, and open table with the corresponding definition
        this.sqlModelSchemaTableAccess = metaModel.entities
          .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)>=0) // the meta-model only has Entity and EntityDefinition entities
          .reduce(
            (prev, curr: MetaEntity) => { // TODO: take into account Application Version to determine applicable Entity Definition
              const entityDefinition = metaModel.entityDefinitions.find(e=>e.entityUuid==curr.uuid);
              // console.warn("sqlDbServer start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
              if (entityDefinition) {
                return Object.assign(prev, this.getAccessToModelSectionEntity(curr,entityDefinition));
              } else {
                return prev;
              }
            }, {}
          )
        ;
      } else {
        // create proxies for model Entities (Entity, EntityDefinition, Report, etc.)
        this.sqlModelSchemaTableAccess = metaModel.entities
        .reduce(
            (prev, curr: MetaEntity) => { // TODO: take into account Application Version to determine applicable Entity Definition
              const entityDefinition = metaModel.entityDefinitions.find(e=>e.entityUuid==curr.uuid);
              // console.warn("sqlDbServer start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
              if (entityDefinition) {
                return Object.assign(prev, this.getAccessToModelSectionEntity(curr,entityDefinition));
              } else {
                return prev;
              }
            }, {}
          )
        ;
      }

      const entities = (await this.getModelInstances(entityEntity.uuid)) as MetaEntity[];
      const entityDefinitions = (await this.getModelInstances(entityEntityDefinition.uuid)) as EntityDefinition[];

      this.sqlDataSchemaTableAccess = entities
        .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1)
        .reduce(
          (prev, curr: MetaEntity) => {
            const entityDefinition = entityDefinitions.find(e=>e.entityUuid==curr.uuid);
            // console.warn("sqlDbServer start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
            if (entityDefinition) {
              return Object.assign(prev, this.getAccessToDataSectionEntity(curr,entityDefinition));
            } else {
              return prev;
            }
          }, {}
        )
      ;
    }
    console.log("###################",this.logHeader,"createProxy model found sqlModelSchemaTableAccess", this.sqlModelSchemaTableAccess,'this.modelSequelize',Object.keys(this.modelSequelize.models),'config',this.dataSequelize.config);
    console.log("###################",this.logHeader,"createProxy data found sqlDataSchemaTableAccess", this.sqlDataSchemaTableAccess,'this.dataSequelize',Object.keys(this.dataSequelize.models),'config',this.modelSequelize.config);
    return Promise.resolve();
  }
  

  // ##############################################################################################
  async initializeEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
    // dataStoreType: DataStoreApplicationType = 'app',
    // insertReferenceInMetaModel: boolean = true,
  ) {
    console.log('initializeEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'input: entity',entity,'entityDefinition',entityDefinition, 'sqlEntities',this.sqlDataSchemaTableAccess);
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error('initializeEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'inconsistent input: given entityDefinition is not related to given entity.');
    } else {
      this.sqlModelSchemaTableAccess = Object.assign(
        {},
        this.sqlModelSchemaTableAccess,
        this.getAccessToDataSectionEntity(entity, entityDefinition)
      );
      console.log('initializeEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'creating model schema table',entity.name);
      await this.sqlModelSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
    }
  }

  // ##############################################################################################
  async createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
    // dataStoreType: DataStoreApplicationType = 'app',
    // insertReferenceInMetaModel: boolean = true,
  ) {
    console.log('createEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'input: entity',entity,'entityDefinition',entityDefinition, 'sqlEntities',this.sqlDataSchemaTableAccess);
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error('createEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'inconsistent input: given entityDefinition is not related to given entity.');
    } else {
      this.sqlDataSchemaTableAccess = Object.assign(
        {},
        this.sqlDataSchemaTableAccess,
        this.getAccessToDataSectionEntity(entity, entityDefinition)
      );
      console.log('createEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'creating data schema table',entity.name);
      await this.sqlDataSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!

      if (!!this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntity.uuid]) {
        await this.sqlModelSchemaTableAccess[entityEntity.uuid].sequelizeModel.upsert(entity as any);
      } else {
        console.error('createEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'could not insert in model schema for entity',entity);
      }
      if (!!this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid]) {
        await this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid].sequelizeModel.upsert(entityDefinition as any);
      } else {
        console.error('createEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'could not insert in model schema for entityDefinition',entityDefinition);
      }
      // }
    }
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    if ([entityEntity.uuid,entityEntityDefinition.uuid].includes(entityUuid)) { // TODO: UGLY!!!!!!! DOES IT EVEN WORK????
      if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityUuid]) {
        const model = this.sqlModelSchemaTableAccess[entityUuid];
        console.log("dropEntity entityUuid", entityUuid, 'parentName',model.parentName);
        await model.sequelizeModel.drop();
        delete this.sqlModelSchemaTableAccess[entityUuid];
      } else {
        console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
      }
        
    } else {
      if (this.sqlDataSchemaTableAccess && this.sqlDataSchemaTableAccess[entityUuid]) {
        const model = this.sqlDataSchemaTableAccess[entityUuid];
        console.log("dropEntity entityUuid", entityUuid, 'parentName',model.parentName);
        // this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
        await model.sequelizeModel.drop();
        delete this.sqlDataSchemaTableAccess[entityUuid];
        await this.deleteModelInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
  
        //remove all entity definitions for the dropped entity
        const entityDefinitions = (await this.getModelInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
        for (
          const entityDefinition of entityDefinitions
        ) {
          await this.deleteModelInstance(entityEntityDefinition.uuid, entityDefinition)
        }
      } else {
        console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
      }
    }
  }


  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in IndexedDbDataStore
    let result = {};
    console.log('getState this.getEntities()',this.getEntities());
    
    for (const parentUuid of this.getEntities()) {
      console.log('getState getting instances for',parentUuid);
      const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances:await this.getDataInstances(parentUuid)};
      console.log('getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async getModelInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[parentUuid]) {
      const result:EntityInstance  = (await this.sqlModelSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))?.dataValues;
      return Promise.resolve(result);
    } else {
      console.warn('getModelInstance',this.applicationName,this.dataStoreType,'could not find entityUuid',parentUuid);
      return Promise.resolve(undefined);
    }
  }

  // ##############################################################################################
    async getModelInstances(parentUuid: string): Promise<EntityInstance[]> {
      console.log('getModelInstances calling findall', parentUuid);
      let result;
      if (this.sqlModelSchemaTableAccess) {
        if (this.sqlModelSchemaTableAccess[parentUuid]) {

          result = this.sqlModelSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll()
        } else {
          result = []
        }
      } else {
        result = []
      }
      return Promise.resolve(result);
    }

      // ##############################################################################################
  async getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    if (this.sqlDataSchemaTableAccess && this.sqlDataSchemaTableAccess[parentUuid]) {
      const result:EntityInstance = (await this.sqlDataSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))?.dataValues;
      return Promise.resolve(result);
    } else {
      console.warn('getDataInstance',this.applicationName,this.dataStoreType,'could not find entityUuid',parentUuid);
      return Promise.resolve(undefined);
    }
  }

  // ##############################################################################################
  // async getDataInstances(parentUuid: string, sqlEntities?: SqlUuidEntityDefinition): Promise<EntityInstance[]> {
  async getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
    let result;
    if (this.sqlDataSchemaTableAccess) {
      if (this.sqlDataSchemaTableAccess[parentUuid]) {
        console.log('getDataInstances calling this.sqlEntities findall', parentUuid);

        result = this.sqlDataSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll()
      } else {
        result = []
      }
    } else {
      result = []
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  // async getInstances(parentUuid: string): Promise<EntityInstance[]> {
  async getInstances(parentUuid: string): Promise<EntityInstanceCollection> {
    const modelEntitiesUuid = this.dataStoreType == "app"?metamodelEntities.map(e=>e.uuid):[entityEntity.uuid,entityEntityDefinition.uuid];
    if (modelEntitiesUuid.includes(parentUuid)) {
      return {parentUuid:parentUuid, applicationSection:'model', instances: await this.getModelInstances(parentUuid)};
    } else {
      return {parentUuid:parentUuid, applicationSection:'data', instances: await this.getDataInstances(parentUuid)}
    }
  }

  // // ##############################################################################################
  // async getBootstrapInstances(parentUuid: string, sqlEntities: SqlUuidEntityDefinition): Promise<EntityInstance[]> {
  //   let result;
  //   if (sqlEntities) {
  //     if (sqlEntities[parentUuid]) {
  //       console.log('getBootstrapInstances calling param sqlEntities findall', parentUuid, JSON.stringify(sqlEntities[parentUuid]));
  //       result = sqlEntities[parentUuid]?.sequelizeModel?.findAll()
  //     } else {
  //       result = []
  //     }
  //   } else {
  //     result = []
  //   }
  //   return Promise.resolve(result);
  // }



  // ##############################################################################################
  open() {
      // connect to DB?
  }

  // ##############################################################################################
  close() {
    this.modelSequelize.close();
    this.dataSequelize.close();
    // disconnect from DB?
  }

  // ##############################################################################################
  clear() { // redundant with dropModelAndData?
    this.dropEntities(this.getEntities());
  }

  // ##############################################################################################
  getEntities(): string[] {
    return this.sqlDataSchemaTableAccess ? Object.keys(this.sqlDataSchemaTableAccess) : [];
  }

  // ##############################################################################################
  dropEntities(entityUuids: string[]) {
    console.log("dropEntities parentUuid", entityUuids);
    entityUuids.forEach((e) => this.dropEntity(e));
  }


  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
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
      
      await this.dataSequelize.getQueryInterface().renameTable({tableName:update.modelEntityUpdate['entityName'],schema:this.dataSchema}, update.modelEntityUpdate['targetValue']);
      // console.log(this.logHeader, 'renameEntity renameTable done.');

      if (modelCUDupdate.objects && model?.parentName) { // this.modelSequelize indexes tables by name, it has to be updated to stay consistent
        // removing dataSequelize model with old name
        this.dataSequelize.modelManager.removeModel(this.dataSequelize.model(update.modelEntityUpdate['entityName']));
        // creating dataSequelize model for the renamed entity
        Object.assign(
          this.sqlDataSchemaTableAccess,
          this.getAccessToDataSectionEntity( // TODO: decouple from ModelUpdateConverter implementation
            update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
            update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
          )
        );
        // update the instance in table Entity and EntityDefinition corresponding to the renamed entity
        await this.upsertModelInstance(modelCUDupdate.objects[0].parentUuid, modelCUDupdate.objects[0].instances[0]);
        await this.upsertModelInstance(entityEntityDefinition.uuid, modelCUDupdate.objects[1].instances[0]);
        
      } else {
        console.error('renameEntity could not execute update',update);
      }
    } else {
      console.error('renameEntity could not execute update',update);
    }
    console.log(this.logHeader, 'renameEntity done.');
  }

  // ##############################################################################################
  async upsertDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("upsertDataInstance application",this.applicationName,"upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing data schema entities', Object.keys(this.sqlDataSchemaTableAccess?this.sqlDataSchemaTableAccess:{}),'instance',instance);
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    return this.sqlDataSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
  }

  // ##############################################################################################
  async upsertModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("upsertModelInstance",this.applicationName,"upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing model schema entities', Object.keys(this.sqlModelSchemaTableAccess?this.sqlModelSchemaTableAccess:{}),'instance',instance);
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    return this.sqlModelSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
  }

  // #############################################################################################
  async upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any> {
    console.log('upsertInstance application',this.applicationName,'type',this.dataStoreType,'parentUuid',parentUuid,'data entities',this.getEntities());
    
    if (this.getEntities().includes(parentUuid)) {
      return this.upsertDataInstance(parentUuid,instance);
    } else {
      return this.upsertModelInstance(parentUuid,instance);
    }
  }

  // ##############################################################################################
  async deleteModelInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    for (const instance of instances) {
      await this.deleteModelInstance(parentUuid,instance);
    }
    return Promise.resolve();
  }


  // ##############################################################################################
  async deleteModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log('deleteModelInstance', parentUuid,instance);
    await this.sqlModelSchemaTableAccess[parentUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
    return Promise.resolve();
  }

  // ##############################################################################################
  async deleteDataInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    for (const instance of instances) {
      await this.deleteDataInstance(parentUuid,instance);
    }
    return Promise.resolve();
  }


  // ##############################################################################################
  async deleteDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log('deleteDataInstance', parentUuid,instance);
    await this.sqlDataSchemaTableAccess[parentUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
    return Promise.resolve();
  }

  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return (!!this.sqlDataSchemaTableAccess && !!this.sqlDataSchemaTableAccess[entityUuid]);
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", JSON.stringify(update));
    await applyModelEntityUpdate(this,update);
  }
}
