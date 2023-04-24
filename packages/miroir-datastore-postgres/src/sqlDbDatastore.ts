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
  ARRAY: DataTypes.JSONB,
  OBJECT: DataTypes.JSONB,
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
export class SqlDbDatastore implements DataStoreInterface {
  // private sqlEntities: SqlEntityDefinition = undefined;
  private sqlEntityDefinitions: SqlUuidEntityDefinition = undefined;
  private sqlEntities: SqlUuidEntityDefinition = undefined;

  constructor(private sequelize: Sequelize) {}

  // ##############################################################################################
  sqlEntityDefinition(entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entityDefinition.uuid]: {
        parentName: entityDefinition.name,
        sequelizeModel: this.sequelize.define(
          entityDefinition.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
          }
        ),
      },
    };
  }

  // ##############################################################################################
  sqlEntity(entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entity.uuid]: {
        parentName: entity.parentName,
        sequelizeModel: this.sequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
          }
        ),
      },
    };
  }
  
  // ##############################################################################################
  async start(): Promise<void> {
    if (this.sqlEntities) {
      console.warn("sqlDbServer start initialization can not be done a second time", this.sqlEntities);
    } else {
      console.warn("sqlDbServer start initialization started");
      const entityAccessObject = this.sqlEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition);

      const entities = await this.getInstances(
        entityEntity.uuid,
        entityAccessObject
      ) as MetaEntity[];
      console.log("################### sqlDbServer start found entities", entities);

      const entityDefinitionAccessObject = this.sqlEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
      const entityDefinitions = await this.getInstances(
        entityEntityDefinition.uuid,
        entityDefinitionAccessObject
      ) as EntityDefinition[];
      console.log("################### sqlDbServer start found entityDefinitions", entityDefinitions);

      this.sqlEntities = entities
        .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1)
        .reduce(
          (prev, curr: EntityDefinition) => {
            const entityDefinition = entityDefinitions.find(e=>e.entityUuid==curr.uuid);
            console.warn("sqlDbServer start sqlEntities init initializing entity", curr.name,curr.parentUuid,'found entityDefinition',entityDefinition);
            return Object.assign(prev, this.sqlEntity(curr,entityDefinition));
          },
          Object.assign({},entityAccessObject,entityDefinitionAccessObject)
        )
      ;
    }
    console.log("################### sqlDbServer init found sqlEntities", this.sqlEntities);
    return Promise.resolve();
  }
  

  // ##############################################################################################
  async createEntity(entity:MetaEntity, entityDefinition: EntityDefinition) {
    console.log('createEntity input: entity',entity,'entityDefinition',entityDefinition, 'sqlEntities',this.sqlEntities);
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error('createEntity inconsistent input: given entityDefinition is not related to given entity.');
    } else {
      this.sqlEntities = Object.assign(
        {},
        this.sqlEntities,
        this.sqlEntity(entity, entityDefinition)
      );
      console.log('createEntity creating table',entity.name);
      await this.sqlEntities[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
      console.log('createEntity table',entity.name,'created.');
      if (!!this.sqlEntities && this.sqlEntities[entityEntity.uuid]) {
        await this.sqlEntities[entityEntity.uuid].sequelizeModel.upsert(entity as any);
      } else {
        console.error('createEntity could not insert entity',entity);
      }
      if (!!this.sqlEntities && this.sqlEntities[entityEntityDefinition.uuid]) {
        await this.sqlEntities[entityEntityDefinition.uuid].sequelizeModel.upsert(entityDefinition as any);
      } else {
        console.warn('createEntity could not insert entityDefinition',entityDefinition);
      }
    }
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string) {
    if (this.sqlEntities && this.sqlEntities[entityUuid]) {
      const model = this.sqlEntities[entityUuid];
      console.log("dropEntity entityUuid", entityUuid, 'parentName',model.parentName);
      // this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
      await model.sequelizeModel.drop();
      delete this.sqlEntities[entityUuid];
      await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);

      const entityDefinitions = (await this.getInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
      for (
        const entityDefinition of entityDefinitions
      ) {
        await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition)
      }
    } else {
      console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
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
      const instances = await this.getInstances(parentUuid);
      console.log('getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async getInstances(parentUuid: string, sqlEntities?: SqlUuidEntityDefinition): Promise<EntityInstance[]> {
    let result;
    if (!!sqlEntities) {
      if (sqlEntities[parentUuid]) {
        console.log('getEntityInstances calling param sqlEntities findall', parentUuid, JSON.stringify(sqlEntities[parentUuid]));
        result = sqlEntities[parentUuid]?.sequelizeModel?.findAll()
      } else {
        result = []
      }
    } else {
      if (!!this.sqlEntities) {
        if (this.sqlEntities[parentUuid]) {
          console.log('getEntityInstances calling this.sqlEntities findall', parentUuid);

          result = this.sqlEntities[parentUuid]?.sequelizeModel?.findAll()
        } else {
          result = []
        }
      } else {
        result = []
      }
    }
    return Promise.resolve(result);
  }


  // ##############################################################################################
  open() {
      // connect to DB?
  }

  // ##############################################################################################
  async dropModel(
  ):Promise<void> {
    // await this.clear();
    await this.sequelize.drop();
    if (this.sqlEntities && this.sqlEntities[entityEntityDefinition.uuid]) {
      const model = this.sqlEntities[entityEntityDefinition.uuid];
      console.log("dropModel entityUuid", entityEntityDefinition.uuid, 'name',entityEntityDefinition.name);
      await model.sequelizeModel.drop();
      delete this.sqlEntities[entityEntityDefinition.uuid];
    }
    if (this.sqlEntities && this.sqlEntities[entityEntity.uuid]) {
      const model = this.sqlEntities[entityEntity.uuid];
      console.log("dropModel entityUuid", entityEntity.uuid, 'parentName',entityEntity.name);
      await model.sequelizeModel.drop();
      delete this.sqlEntities[entityEntity.uuid];
    }

    this.sqlEntityDefinitions = {};
    this.sqlEntities = {};
  }
  
  
  // ##############################################################################################
  close() {
    this.sequelize.close();
    // disconnect from DB?
  }

  // ##############################################################################################
  clear() { // redundant with dropmodel?
    this.dropEntities(this.getEntities());
  }

  // ##############################################################################################
  getEntities(): string[] {
    return this.sqlEntities ? Object.keys(this.sqlEntities) : [];
  }

  // ##############################################################################################
  async getInstance(parentUuid: string, uuid: string): Promise<EntityInstance> {
    const result:EntityInstance = (await this.sqlEntities[parentUuid].sequelizeModel.findByPk(uuid)).dataValues;
    return Promise.resolve(result);
  }

  // ##############################################################################################
  dropEntities(entityUuids: string[]) {
    console.log("dropEntities parentUuid", entityUuids);
    entityUuids.forEach((e) => this.dropEntity(e));
  }


  // ##############################################################################################
  async renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate){
    const modelCUDupdate = update.equivalentModelCUDUpdates[0];
    const model = this.sqlEntities[modelCUDupdate.objects[0].parentUuid];
    await this.sequelize.getQueryInterface().renameTable(update.modelEntityUpdate['entityName'], update.modelEntityUpdate['targetValue']);
    this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
    // update this.sqlUuidEntities for the renamed entity
    Object.assign(
      this.sqlEntities,
      this.sqlEntity( // TODO: decouple from ModelUpdateConverter implementation
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
        update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
      )
    );
    // update the instance in table Entity corresponding to the renamed entity
    await this.upsertInstance(modelCUDupdate.objects[0].parentUuid, modelCUDupdate.objects[0].instances[0]);
    // await this.sqlUuidEntities[modelCUDupdate.objects[0].parentUuid].sequelizeModel.upsert(modelCUDupdate.objects[0].instances[0] as any)
  }

  // ##############################################################################################
  async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("upsertInstance upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing entities', Object.keys(this.sqlEntities?this.sqlEntities:{}),'instance',instance);
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    return this.sqlEntities[instance.parentUuid].sequelizeModel.upsert(instance as any);
  }

  // ##############################################################################################
  async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    for (const instance of instances) {
      await this.deleteInstance(parentUuid,instance);
    }
    return Promise.resolve();
  }


  // ##############################################################################################
  async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log('deleteInstance', parentUuid,instance);
    await this.sqlEntities[parentUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
    return Promise.resolve();
  }

  // ##############################################################################################
  existsEntity(entityUuid:string):boolean {
    return (!!this.sqlEntities && !!this.sqlEntities[entityUuid]);
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", JSON.stringify(update));
    await applyModelEntityUpdate(this,update);
  }
}
