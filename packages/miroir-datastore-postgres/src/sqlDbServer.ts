import {
  DataStoreInterface,
  EntityAttributeType,
  EntityDefinition,
  entityEntity,
  Instance,
  ModelReplayableUpdate,
} from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from "sequelize";

const dataTypesMapping: { [type in EntityAttributeType]: DataTypes.AbstractDataTypeConstructor } = {
  STRING: DataTypes.STRING,
  ARRAY: DataTypes.JSONB,
  OBJECT: DataTypes.JSONB,
};

function fromMiroirEntityDefinitionToSequelizeEntityDefinition(
  entityDefinition: EntityDefinition
): ModelAttributes<Model, Attributes<Model>> {
  return Object.fromEntries(
    entityDefinition.attributes.map((a) => {
      return [[a.name], { type: dataTypesMapping[a.type], allowNull: a.nullable, primaryKey: a.name == "uuid" }];
    })
  );
}

export type SqlEntityDefinition = { [entityName in string]: ModelStatic<Model<any, any>> };
export type SqlUuidEntityDefinition = {
  [entityUuid in string]: { entityName: string; sequelizeModel: ModelStatic<Model<any, any>> };
};

// ##############################################################################################
// ##############################################################################################
export class SqlDbServer implements DataStoreInterface {
  // private sqlEntities: SqlEntityDefinition = undefined;
  private sqlUuidEntities: SqlUuidEntityDefinition = undefined;

  constructor(private sequelize: Sequelize) {}

  // ##############################################################################################
  async init(): Promise<void> {
    if (this.sqlUuidEntities) {
      console.warn("sqlDbServer init initialization can not be done a second time", this.sqlUuidEntities);
    } else {
      console.warn("sqlDbServer init initialization started");
      const entities: EntityDefinition[] = await this.getInstancesUuid(
        entityEntity.uuid,
        this.sqlUuidEntityDefinition(entityEntity as EntityDefinition)
      );
      console.log("sqlDbServer uuid init found entities", entities);

      this.sqlUuidEntities = entities.reduce((prev, curr: EntityDefinition) => {
        // console.warn("sqlDbServer uuid init initializing", curr);
        return Object.assign(prev, this.sqlUuidEntityDefinition(curr));
      }, {});
    }
    return Promise.resolve();
  }
  
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
  ) {
    this.sqlUuidEntities = {};
    return this.sequelize.drop();
  }

  // ##############################################################################################
  close() {
    this.sequelize.close();
    // disconnect from DB?
  }

  // ##############################################################################################
  clear() {
    this.dropUuidEntities(this.getUuidEntities());
  }

  // ##############################################################################################
  getUuidEntities(): string[] {
    return this.sqlUuidEntities ? Object.keys(this.sqlUuidEntities) : [];
  }

  // ##############################################################################################
  dropUuidEntity(entityUuid: string) {
    if (this.sqlUuidEntities && this.sqlUuidEntities[entityUuid]) {
      const model = this.sqlUuidEntities[entityUuid];
      console.log("dropUuidEntity entityUuid", entityUuid, model.entityName);
      this.sequelize.modelManager.removeModel(this.sequelize.model(model.entityName));
      delete this.sqlUuidEntities[entityUuid];
    } else {
      console.warn("dropUuidEntity entityUuid", entityUuid, "NOT FOUND.");
    }
  }

  // ##############################################################################################
  dropUuidEntities(entityUuids: string[]) {
    console.log("dropUuidEntities entityUuid", entityUuids);
    entityUuids.forEach((e) => this.dropUuidEntity(e));
  }

  // ##############################################################################################
  sqlUuidEntityDefinition(entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    return {
      [entityDefinition.uuid]: {
        entityName: entityDefinition.name,
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
  // getInstances(entityName:string):Promise<Instance[]> {
  async getInstancesUuid(entityUuid: string, sqlUuidEntities?: SqlUuidEntityDefinition): Promise<any> {
    let result;
    if (!!sqlUuidEntities) {
      if (sqlUuidEntities[entityUuid]) {
        console.log('calling param sqlUuidEntities findall', entityUuid, JSON.stringify(sqlUuidEntities[entityUuid]));
        result = sqlUuidEntities[entityUuid]?.sequelizeModel?.findAll()
      } else {
        result = []
      }
    } else {
      if (!!this.sqlUuidEntities) {
        if (this.sqlUuidEntities[entityUuid]) {
          console.log('calling this.sqlUuidEntities findall', entityUuid);
          
          result = this.sqlUuidEntities[entityUuid]?.sequelizeModel?.findAll()
        } else {
          result = []
        }
      } else {
        result = []
      }        
    }
    return Promise.resolve(result);
    // return sqlUuidEntities
    //   ? sqlUuidEntities[entityUuid]
    //     ? sqlUuidEntities[entityUuid].sequelizeModel.findAll()
    //     : Promise.resolve([])
    //   : this.sqlUuidEntities
    //   ? this.sqlUuidEntities[entityUuid]
    //     ? await this.sqlUuidEntities[entityUuid].sequelizeModel.findAll()
    //     : Promise.resolve([])
    //   : Promise.resolve([]);
  }

  // ##############################################################################################
  async upsertInstanceUuid(entityUuid: string, instance: Instance): Promise<any> {
    if (
      instance.entityUuid == entityEntity.uuid &&
      (this.sqlUuidEntities == undefined || !this.sqlUuidEntities[instance.uuid])
    ) {
      console.log("upsertInstanceUuid create Entity", instance["uuid"], 'named', instance["name"], 'instances', Object.keys(this.sqlUuidEntities?this.sqlUuidEntities:{}));
      const entityDefinition: EntityDefinition = instance as EntityDefinition;
      // this.localIndexedDb.addSubLevels([entityName]);
      this.sqlUuidEntities = Object.assign(
        !!this.sqlUuidEntities ? this.sqlUuidEntities : {},
        this.sqlUuidEntityDefinition(instance as EntityDefinition)
      );
      await this.sqlUuidEntities[entityDefinition.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
      console.log("upsertInstanceUuid created entity", entityDefinition.uuid, 'named',entityDefinition.name,'instances',Object.keys(this.sqlUuidEntities));
    } else {
      if (instance.uuid == entityEntity.uuid) {
        console.log(
          "upsertInstanceUuid instance",
          instance["name"],
          'uuid', instance.uuid,
          "already exists this.sqlEntities:",
          Object.keys(this.sqlUuidEntities)
        );
      } else {
        console.log("upsertInstanceUuid instance not found",instance);
      }
    }

    console.log("upsertInstanceUuid upserting into Entity", instance["entityUuid"], 'named', instance["entityName"], 'existing entities', Object.keys(this.sqlUuidEntities?this.sqlUuidEntities:{}));
    // return this.sqlUuidEntities[instance.entityUuid].sequelizeModel.create(instance as any);
    return this.sqlUuidEntities[instance.entityUuid].sequelizeModel.upsert(instance as any);
  }

  // ##############################################################################################
  async deleteInstancesUuid(entityUuid: string, instances: Instance[]): Promise<any> {
    for (const instance of instances) {
      await this.deleteInstanceUuid(entityUuid,instance);
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async deleteInstanceUuid(entityUuid: string, instance: Instance): Promise<any> {
    console.log('deleteInstanceUuid', entityUuid,instance);
    await this.sqlUuidEntities[entityUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
    return Promise.resolve();
  }

  // ##############################################################################################
  async applyModelEntityUpdate(update: ModelReplayableUpdate) {
    console.log("SqlDbServer applyModelEntityUpdates", update);
    // const modelEntityUpdate = update.modelEntityUpdate;
    const modelCUDupdate = update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate'? update.equivalentModelCUDUpdates[0]:update;
    if (this.sqlUuidEntities && this.sqlUuidEntities[modelCUDupdate.objects[0].entityUuid]) {
      const model = this.sqlUuidEntities[modelCUDupdate.objects[0].entityUuid];
      console.log("dropUuidEntity SqlDbServer applyModelEntityUpdates", modelCUDupdate.updateActionName, modelCUDupdate.objects[0].entityUuid, modelCUDupdate.objects[0].entity);
      if (update.updateActionName == 'WrappedModelEntityUpdateWithCUDUpdate') {
        switch (update.modelEntityUpdate.updateActionName) {
          case "DeleteEntity": {
            await this.deleteInstanceUuid(update.modelEntityUpdate.entityUuid, {uuid:update.modelEntityUpdate.instanceUuid} as Instance)
            break;
          }
          case "alterEntityAttribute":
          case "renameEntity":
            this.sequelize.getQueryInterface().renameTable(update.modelEntityUpdate.entityName, update.modelEntityUpdate['targetValue']);
            this.sequelize.modelManager.removeModel(this.sequelize.model(model.entityName));
            // update this.sqlUuidEntities for the renamed entity
            Object.assign(
              this.sqlUuidEntities,
              this.sqlUuidEntityDefinition(
                update.equivalentModelCUDUpdates[0].objects[0].instances[0] as EntityDefinition
              )
            );
            // update the instance in table Entity corresponding to the renamed entity
            await this.upsertInstanceUuid(modelCUDupdate.objects[0].entityUuid, modelCUDupdate.objects[0].instances[0]);
            // await this.sqlUuidEntities[modelCUDupdate.objects[0].entityUuid].sequelizeModel.upsert(modelCUDupdate.objects[0].instances[0] as any)
            break;
          case "createEntity":
            for (const instance of update.modelEntityUpdate.instances) {
              await this.upsertInstanceUuid(update.modelEntityUpdate.entityUuid, instance);
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
                await this.upsertInstanceUuid(instance.entityUuid, instance);
              }
            }
            break;
          }
          case "delete": {
            for (const instanceCollection of update.objects) {
              for (const instance of instanceCollection.instances) {
                await this.deleteInstanceUuid(instanceCollection.entityUuid, instance)
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
        "dropUuidEntity SqlDbServer entity uuid",
        modelCUDupdate.objects[0].entityUuid,
        "name",
        modelCUDupdate.objects[0].entity,
        "not found!"
      );
    }
  }
}
