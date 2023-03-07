import { DataStoreInterface, EntityAttributeType, EntityAttributeTypeObject, EntityDefinition, Instance } from "miroir-core";
import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic, Sequelize } from 'sequelize';

const dataTypesMapping:{[type in EntityAttributeType]: DataTypes.AbstractDataTypeConstructor} = {
  STRING: DataTypes.STRING,
  ARRAY: DataTypes.JSONB,
  OBJECT: DataTypes.JSONB,
}

function fromMiroirEntityDefinitionToSequelizeEntityDefinition(
  entityDefinition:EntityDefinition
):ModelAttributes<Model, Attributes<Model>> {
  return Object.fromEntries(
    entityDefinition.attributes.map(
      (a) => {
        // return [[a.name],{type:DataTypes.STRING, allowNull:true}]
        return [[a.name],{type:dataTypesMapping[a.type], allowNull:true, primaryKey:a.name=='uuid'}]
      }
    )
  );
    // uuid: {
    //   type: DataTypes.UUID,
    //   primaryKey: true,
    //   allowNull: false
    // },
  // }
}

export class sqlDbServer implements DataStoreInterface {

  private sqlEntities:{[entityName in string]:ModelStatic<Model<any,any>>} = {};

  constructor(
    // private localIndexedDb: IndexedDb,
    private sequelize:Sequelize,
  ){}
  
  // getInstances(entityName:string):Promise<Instance[]> {
  getInstances(entityName:string):Promise<any> {
    return this.sqlEntities[entityName]?this.sqlEntities[entityName].findAll():Promise.resolve([]);
  }

  // upsertInstance(entityName:string, instance:Instance):Promise<Instance> {
  async upsertInstance(entityName:string, instance:Instance):Promise<any> {
  
    if (instance.entity == "Entity" && !this.sqlEntities[instance['name']]) {
      const entityDefinition: EntityDefinition = instance as EntityDefinition;
      // this.localIndexedDb.addSubLevels([entityName]);
      this.sqlEntities = 
        Object.assign(
          this.sqlEntities,
          {
            [entityDefinition.name]:this.sequelize.define(
              entityDefinition.name, 
              // {...fromMiroirEntityDefinitionToSequelizeEntityDefinition(instance as EntityDefinition)}
              fromMiroirEntityDefinitionToSequelizeEntityDefinition(instance as EntityDefinition),
              {
                freezeTableName: true
              }
            )
          }
        )
      ;
      console.log('upsertInstance create entity', entityDefinition.name);
      await this.sqlEntities[entityDefinition.name].sync({ force: true });
    }
  
    return this.sqlEntities[instance.entity].create(instance as any);
  }

  // async deleteInstances(entityName:string, instances:Instance[]):Promise<Instance[]> {
  async deleteInstances(entityName:string, instances:Instance[]):Promise<any> {
    // for (const o of instances) {
    //   await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
    // }
    return Promise.resolve();
  }
}
