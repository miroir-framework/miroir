import {
  DataStoreInterface,
  EntityAttributeType,
  EntityDefinition,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionModelVersion,
  EntityDefinitionReport,
  entityDefinitionStoreBasedConfiguration,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  entityModelVersion,
  entityReport,
  entityStoreBasedConfiguration,
  instanceConfigurationReference,
  instanceModelVersionInitial,
  MetaEntity,
  ModelReplayableUpdate,
  reportConfigurationList,
  reportEntityDefinitionList,
  reportEntityList,
  reportModelVersionList,
  reportReportList,
} from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from "sequelize";

const dataTypesMapping: { [type in EntityAttributeType]: DataTypes.AbstractDataTypeConstructor } = {
  STRING: DataTypes.STRING,
  ARRAY: DataTypes.JSONB,
  OBJECT: DataTypes.JSONB,
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
export class SqlDbServer implements DataStoreInterface {
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

    // TODO: test this.sqlEntities for emptiness, abort if not empty
    // bootstrap MetaClass entity
    console.log('################################### initModel');
    
    await this.createEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition);
    console.log('created entity entity',this.sqlEntities);

    // bootstrap MetaClass EntityDefinition
    await this.createEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
    console.log('created entity EntityDefinition',this.sqlEntities);

    await this.sqlEntities[entityEntityDefinition.uuid].sequelizeModel.upsert(entityDefinitionEntity as any);

    // bootstrap ModelVersion
    await this.createEntity(entityModelVersion as MetaEntity, entityDefinitionModelVersion as EntityDefinition);
    console.log('created entity EntityModelVersion',this.sqlEntities);
    await this.sqlEntities[entityModelVersion.uuid].sequelizeModel.upsert(instanceModelVersionInitial as any);

    // bootstrap EntityStoreBasedConfiguration
    await this.createEntity(entityStoreBasedConfiguration as MetaEntity, entityDefinitionStoreBasedConfiguration as EntityDefinition);
    console.log('created entity EntityStoreBasedConfiguration',this.sqlEntities);
    await this.sqlEntities[entityStoreBasedConfiguration.uuid].sequelizeModel.upsert(instanceConfigurationReference as any);

    // bootstrap EntityStoreBasedConfiguration
    await this.createEntity(entityReport as MetaEntity, EntityDefinitionReport as EntityDefinition);
    console.log('created entity EntityReport',this.sqlEntities);
    await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportEntityList as any);
    await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportEntityDefinitionList as any);
    await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportModelVersionList as any);
    await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportConfigurationList as any);
    await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportReportList as any);
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
  public getdb():any{
    return undefined;
  }

  // ##############################################################################################
  addConcepts(conceptsNames:string[]) {
    
  }

  // ##############################################################################################
  open() {
      // connect to DB?
  }

  // ##############################################################################################
  async dropModel(
  ):Promise<void> {
    this.sqlEntityDefinitions = {};
    this.sqlEntities = {};
    await this.sequelize.drop();
  }
  
  
  // ##############################################################################################
  close() {
    this.sequelize.close();
    // disconnect from DB?
  }

  // ##############################################################################################
  clear() { // redundant with dropmodel?
    this.dropEntities(this.getEntityDefinitions());
  }

  // ##############################################################################################
  getEntityDefinitions(): string[] {
    return this.sqlEntityDefinitions ? Object.keys(this.sqlEntityDefinitions) : [];
  }

  // ##############################################################################################
  getEntities(): string[] {
    return this.sqlEntities ? Object.keys(this.sqlEntities) : [];
  }

  // ##############################################################################################
  dropEntities(entityUuids: string[]) {
    console.log("dropEntities parentUuid", entityUuids);
    entityUuids.forEach((e) => this.dropEntity(e));
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
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", JSON.stringify(update));
    // const modelEntityUpdate = update.modelEntityUpdate;
    const modelCUDupdate = update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
    console.log("SqlDbServer applyModelEntityUpdates actionName", modelCUDupdate.updateActionName, 'parentUuid',modelCUDupdate.objects[0].parentUuid, 'parentName',modelCUDupdate.objects[0].parentName);
    if (this.sqlEntities && this.sqlEntities[modelCUDupdate.objects[0].parentUuid]) {
      const model = this.sqlEntities[modelCUDupdate.objects[0].parentUuid];
      if (update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate') {
        console.log('apply WrappedModelEntityUpdateWithCUDUpdate');
        switch (update.modelEntityUpdate.updateActionName) {
          case "DeleteEntity": {
            console.log('apply DeleteEntity',update.modelEntityUpdate.entityUuid);
            // await this.deleteInstance(update.modelEntityUpdate.parentUuid, {uuid:update.modelEntityUpdate.instanceUuid} as EntityInstance)
            await this.dropEntity(update.modelEntityUpdate.entityUuid)
            break;
          }
          case "alterEntityAttribute":
          case "renameEntity":
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
            break;
          case "createEntity":{
            for (const entity of update.modelEntityUpdate.entities) {
              await this.createEntity(entity.entity, entity.entityDefinition);
            }
            break;
          }
          default:
            break;
        }
      } else { // modelCUDupdate
        switch (update.updateActionName) {
          case "create":
          case "update": {
              for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.upsertInstance(instance.parentUuid, instance);
              }
            }
            break;
          }
          case "delete": {
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.deleteInstance(instanceCollection.parentUuid, instance)
              }
            }
            break;
          }
          default:
            break;
        }
      }
    } else {
      console.warn(
        "SqlDbServer applyModelEntityUpdate entity uuid",
        modelCUDupdate.objects[0].parentUuid,
        "name",
        modelCUDupdate.objects[0].parentName,
        "not found!"
      );
    }
  }
}
