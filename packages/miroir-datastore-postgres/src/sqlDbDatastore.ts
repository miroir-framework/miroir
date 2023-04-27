import {
  applyModelEntityUpdate,
  DataStoreInterface,
  EntityAttributeType,
  EntityDefinition,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  MetaEntity,
  ModelEntityUpdateRenameEntity,
  modelInitialize,
  ModelReplayableUpdate,
  WrappedModelEntityUpdateWithCUDUpdate
} from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from "sequelize";

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
  [parentUuid in string]: { parentName: string; sequelizeModel: ModelStatic<Model<any, any>> };
};

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export class SqlDbDatastore implements DataStoreInterface {
  private sqlDataSchemaTableAccess: SqlUuidEntityDefinition = undefined;
  private sqlModelSchemaTableAccess: SqlUuidEntityDefinition = undefined;

  constructor(
    private modelSequelize: Sequelize,
    private modelSchema: string,
    private dataSequelize: Sequelize,
    private dataSchema: string,
  ) {}

  // ##############################################################################################
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
  
  // ##############################################################################################
  async start(): Promise<void> {
    if (this.sqlDataSchemaTableAccess) {
      console.warn("sqlDbServer start initialization can not be done a second time", this.sqlDataSchemaTableAccess);
    } else {
      console.warn("sqlDbServer start initialization started");
      const entityAccessObject = this.getAccessToModelSectionEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition);

      const entities = await this.getBootstrapInstances(
        entityEntity.uuid,
        entityAccessObject
      ) as MetaEntity[];
      console.log("################### sqlDbServer start model found entities", entities);

      const entityDefinitionAccessObject = this.getAccessToModelSectionEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
      const entityDefinitions = await this.getBootstrapInstances(
        entityEntityDefinition.uuid,
        entityDefinitionAccessObject
      ) as EntityDefinition[];
      console.log("################### sqlDbServer start model found entityDefinitions", entityDefinitions);

      this.sqlModelSchemaTableAccess = Object.assign({},entityAccessObject,entityDefinitionAccessObject)

      this.sqlDataSchemaTableAccess = entities
        .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1)
        .reduce(
          (prev, curr: EntityDefinition) => {
            const entityDefinition = entityDefinitions.find(e=>e.entityUuid==curr.uuid);
            // console.warn("sqlDbServer start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
            return Object.assign(prev, this.getAccessToDataSectionEntity(curr,entityDefinition));
          }, {}
        )
      ;
    }
    console.log("################### sqlDbServer start data found sqlDataSchemaTableAccess", this.sqlDataSchemaTableAccess);
    return Promise.resolve();
  }
  

  // ##############################################################################################
  async createEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    console.log('createEntity input: entity',entity,'entityDefinition',entityDefinition, 'sqlEntities',this.sqlDataSchemaTableAccess);
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error('createEntity inconsistent input: given entityDefinition is not related to given entity.');
    } else {
      // if ([entityEntity.uuid,entityEntityDefinition.uuid].includes(entity.uuid)) { // TODO: UGLY!!!!!!! DOES IT EVEN WORK????
      if (entity.conceptLevel == 'MetaModel') { // TODO: UGLY!!!!!!! DOES IT EVEN WORK????
        this.sqlModelSchemaTableAccess = Object.assign(
          {},
          this.sqlModelSchemaTableAccess,
          this.getAccessToDataSectionEntity(entity, entityDefinition)
        );
        console.log('createEntity creating table',entity.name);
        await this.sqlModelSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
        } else {
        this.sqlDataSchemaTableAccess = Object.assign(
          {},
          this.sqlDataSchemaTableAccess,
          this.getAccessToDataSectionEntity(entity, entityDefinition)
        );
        console.log('createEntity creating table',entity.name);
        await this.sqlDataSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
      }
      console.log('createEntity table',entity.name,'created.');
      if (!!this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntity.uuid]) {
        await this.sqlModelSchemaTableAccess[entityEntity.uuid].sequelizeModel.upsert(entity as any);
      } else {
        console.error('createEntity could not insert entity',entity);
      }
      if (!!this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid]) {
        await this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid].sequelizeModel.upsert(entityDefinition as any);
      } else {
        console.error('createEntity could not insert entityDefinition',entityDefinition);
      }
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
        await this.deleteDataInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
  
        const entityDefinitions = (await this.getDataInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
        for (
          const entityDefinition of entityDefinitions
        ) {
          await this.deleteDataInstance(entityEntityDefinition.uuid, entityDefinition)
        }
      } else {
        console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
      }
    }
  }


  // ##############################################################################################
  async initModel(
  ):Promise<void> {
    await modelInitialize(this);
    return Promise.resolve(undefined);
  }

  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstance[]}>{ // TODO: same implementation as in IndexedDbDataStore
    let result = {};
    console.log('getState this.getEntities()',this.getEntities());
    
    for (const parentUuid of this.getEntities()) {
      console.log('getState getting instances for',parentUuid);
      const instances = await this.getDataInstances(parentUuid);
      console.log('getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async getModelInstance(parentUuid: string, uuid: string): Promise<EntityInstance> {
    const result:EntityInstance = (await this.sqlModelSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid)).dataValues;
    return Promise.resolve(result);
  }

  // ##############################################################################################
    async getModelInstances(parentUuid: string): Promise<EntityInstance[]> {
      let result;
      if (this.sqlModelSchemaTableAccess) {
        if (this.sqlModelSchemaTableAccess[parentUuid]) {
          console.log('getModelInstances calling this.sqlEntities findall', parentUuid);

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
  async getInstances(parentUuid: string): Promise<EntityInstance[]> {
    if ([entityEntity.uuid,entityEntityDefinition.uuid].includes(parentUuid)) {
      return this.getModelInstances(parentUuid);
    } else {
      return this.getDataInstances(parentUuid)
    }
    // if (sqlEntities) {
    //   if (sqlEntities[parentUuid]) {
    //     console.log('getModelInstances calling param sqlEntities findall', parentUuid, JSON.stringify(sqlEntities[parentUuid]));
    //     result = sqlEntities[parentUuid]?.sequelizeModel?.findAll()
    //   } else {
    //     result = []
    //   }
    // } else {
    //   result = []
    // }
    // return Promise.resolve(result);
  }

  // ##############################################################################################
  async getBootstrapInstances(parentUuid: string, sqlEntities: SqlUuidEntityDefinition): Promise<EntityInstance[]> {
    let result;
    if (sqlEntities) {
      if (sqlEntities[parentUuid]) {
        console.log('getModelInstances calling param sqlEntities findall', parentUuid, JSON.stringify(sqlEntities[parentUuid]));
        result = sqlEntities[parentUuid]?.sequelizeModel?.findAll()
      } else {
        result = []
      }
    } else {
      result = []
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance> {
    const result:EntityInstance = (await this.sqlDataSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid)).dataValues;
    return Promise.resolve(result);
  }

  // ##############################################################################################
  // async getDataInstances(parentUuid: string, sqlEntities?: SqlUuidEntityDefinition): Promise<EntityInstance[]> {
  async getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
    let result;
    // if (sqlEntities) {
    //   if (sqlEntities[parentUuid]) {
    //     console.log('getEntityInstances calling param sqlEntities findall', parentUuid, JSON.stringify(sqlEntities[parentUuid]));
    //     result = sqlEntities[parentUuid]?.sequelizeModel?.findAll()
    //   } else {
    //     result = []
    //   }
    // } else {
      if (this.sqlDataSchemaTableAccess) {
        if (this.sqlDataSchemaTableAccess[parentUuid]) {
          console.log('getEntityInstances calling this.sqlEntities findall', parentUuid);

          result = this.sqlDataSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll()
        } else {
          result = []
        }
      } else {
        result = []
      }
    // }
    return Promise.resolve(result);
  }


  // ##############################################################################################
  open() {
      // connect to DB?
  }

  // ##############################################################################################
  async dropModelAndData(
  ):Promise<void> {
    // await this.clear();
    // await this.modelSequelize.drop();
    // drop model
    if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid]) {
      const model = this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid];
      console.log("dropModelAndData entityUuid", entityEntityDefinition.uuid, 'name',entityEntityDefinition.name);
      await model.sequelizeModel.drop();
      delete this.sqlModelSchemaTableAccess[entityEntityDefinition.uuid];
    }
    if (this.sqlModelSchemaTableAccess && this.sqlModelSchemaTableAccess[entityEntity.uuid]) {
      const model = this.sqlModelSchemaTableAccess[entityEntity.uuid];
      console.log("dropModelAndData entityUuid", entityEntity.uuid, 'parentName',entityEntity.name);
      await model.sequelizeModel.drop();
      delete this.sqlDataSchemaTableAccess[entityEntity.uuid];
    }

    // drop data
    await this.dataSequelize.drop();

    // this.sqlEntityDefinitions = {};
    this.sqlModelSchemaTableAccess = {};
    this.sqlDataSchemaTableAccess = {};
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
    const modelCUDupdate = update.equivalentModelCUDUpdates[0];
    const model = this.sqlDataSchemaTableAccess[modelCUDupdate.objects[0].parentUuid];
    await this.modelSequelize.getQueryInterface().renameTable(update.modelEntityUpdate['entityName'], update.modelEntityUpdate['targetValue']);
    this.modelSequelize.modelManager.removeModel(this.modelSequelize.model(model.parentName));
    // update this.sqlUuidEntities for the renamed entity
    Object.assign(
      this.sqlDataSchemaTableAccess,
      this.getAccessToDataSectionEntity( // TODO: decouple from ModelUpdateConverter implementation
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
        update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
      )
    );
    // update the instance in table Entity corresponding to the renamed entity
    await this.upsertDataInstance(modelCUDupdate.objects[0].parentUuid, modelCUDupdate.objects[0].instances[0]);
    // await this.sqlUuidEntities[modelCUDupdate.objects[0].parentUuid].sequelizeModel.upsert(modelCUDupdate.objects[0].instances[0] as any)
  }

  // ##############################################################################################
  async upsertDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("upsertDataInstance upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing entities', Object.keys(this.sqlDataSchemaTableAccess?this.sqlDataSchemaTableAccess:{}),'instance',instance);
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    return this.sqlDataSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
  }

  // ##############################################################################################
  async upsertModelInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("upsertModelInstance upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing entities', Object.keys(this.sqlDataSchemaTableAccess?this.sqlDataSchemaTableAccess:{}),'instance',instance);
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    return this.sqlModelSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
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
