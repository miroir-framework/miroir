import {
  DataStoreInterface,
  EntityAttributeType,
  EntityDefinition,
  entityEntity,
  Instance,
  ModelUpdateWithCUDUpdate,
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

    console.log("upsertInstanceUuid inserting into Entity", instance["entityUuid"], 'named', instance["entityName"], 'existing entities', Object.keys(this.sqlUuidEntities?this.sqlUuidEntities:{}));
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
    // console.log('deleteInstanceUuid', entityUuid,instance);
    
    await this.sqlUuidEntities[instance.entityUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
    return Promise.resolve();
  }

  // ##############################################################################################
  async applyModelStructureUpdate(update: ModelUpdateWithCUDUpdate) {
    console.log("SqlDbServer applyModelStructureUpdates", update);
    // const currentUpdate = updates[0];
    // const cudUpdate = update.equivalentModelCUDUpdates[0];
    const modelStructureUpdate = update.modelStructureUpdate;
    if (this.sqlUuidEntities && this.sqlUuidEntities[modelStructureUpdate.entityUuid]) {
      const model = this.sqlUuidEntities[modelStructureUpdate.entityUuid];
      console.log("dropUuidEntity SqlDbServer applyModelStructureUpdates", update.modelStructureUpdate.updateActionName, modelStructureUpdate.entityUuid, model.entityName);
      switch (update.modelStructureUpdate.updateActionName) {
        case "DeleteMetaModelInstance":
          
          break;
        case "alterMetaModelInstance":
        case "alterEntityAttribute":
        case "renameMetaModelInstance":
          this.sequelize.getQueryInterface().renameTable(modelStructureUpdate.entityName, modelStructureUpdate['targetValue']);
          this.sequelize.modelManager.removeModel(this.sequelize.model(model.entityName));
          // const newModel=
          // this.sqlUuidEntities[currentUpdate.entityUuid] = {entityName:currentUpdate.targetValue,sequelizeModel:this.sqlUuidEntities[currentUpdate.entityUuid].sequelizeModel}
          Object.assign(
            this.sqlUuidEntities,
            this.sqlUuidEntityDefinition(
              update.equivalentModelCUDUpdates[0].objects[0].instances[0] as EntityDefinition
            )
          );
          break;
        case "create":
          for (const instance of update.modelStructureUpdate.instances) {
            await this.upsertInstanceUuid(modelStructureUpdate.entityUuid, instance);
          }
        default:
          break;
      }
  
    } else {
      console.warn(
        "dropUuidEntity SqlDbServer entity uuid",
        update.modelStructureUpdate.entityUuid,
        "name",
        update.modelStructureUpdate.entityName,
        "not found!"
      );
    }
  }
}
