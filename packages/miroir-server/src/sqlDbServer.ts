import { DataStoreInterface, EntityAttributeType, EntityDefinition, entityEntity, Instance } from "miroir-core";
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
        return [[a.name],{type:dataTypesMapping[a.type], allowNull:a.nullable, primaryKey:a.name=='uuid'}]
      }
    )
  );
}

export type SqlEntityDefinition = {[entityName in string]:ModelStatic<Model<any,any>>};


// ##############################################################################################
// ##############################################################################################
export class SqlDbServer implements DataStoreInterface {

  private sqlEntities:SqlEntityDefinition = undefined;

  constructor(
    // private localIndexedDb: IndexedDb,
    private sequelize:Sequelize,
  ){}

  // ##############################################################################################
  getEntities():string[] {
    return this.sqlEntities?Object.keys(this.sqlEntities):[];
  }

  // ##############################################################################################
  dropEntity(entityName:string) {
    if (this.sequelize.isDefined(entityName)) {
      console.warn('dropEntity entityName',entityName,'is defined.');
      if (this.sqlEntities && this.sqlEntities[entityName]) {delete this.sqlEntities[entityName];}
      this.sequelize.modelManager.removeModel(this.sequelize.model(entityName));
    } else {
      console.warn('dropEntity entityName',entityName,'not found.');
    }
  }

    // ##############################################################################################
    dropEntities(entityNames:string[]) {
      entityNames.forEach(e =>this.dropEntity(e));
    }

  // ##############################################################################################
  sqlEntityDefinition(entityDefinition:EntityDefinition):SqlEntityDefinition {
    return {
      [entityDefinition.name]:this.sequelize.define(
        entityDefinition.name, 
        fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
        {
          freezeTableName: true
        }
      )
    }
  }

  // ##############################################################################################
  async init():Promise<void> {
    if (this.sqlEntities) {
      console.warn('sqlDbServer init initialization can not be done a second time', this.sqlEntities);
    } else {
      console.warn('sqlDbServer init initialization started');
      const entities:EntityDefinition[] = await this.getInstances('Entity',this.sqlEntityDefinition(entityEntity as EntityDefinition));
      this.sqlEntities = entities.reduce(
        (prev,curr:EntityDefinition) => {
          console.warn('sqlDbServer init initializing',curr);
          return Object.assign(prev,this.sqlEntityDefinition(curr));
        },{})
    }
    return Promise.resolve()
  }

  // ##############################################################################################
  // getInstances(entityName:string):Promise<Instance[]> {
  getInstances(entityName:string,sqlEntities?:SqlEntityDefinition):Promise<any> {
    return sqlEntities? (
      sqlEntities[entityName]?
        sqlEntities[entityName].findAll()
        : 
        Promise.resolve()
      )
      : 
      (
        this.sqlEntities?(
          this.sqlEntities[entityName]?
            this.sqlEntities[entityName].findAll()
            :
            Promise.resolve([])
        )
        :
        Promise.resolve([])
      )
    ;
  }

  // ##############################################################################################
  // upsertInstance(entityName:string, instance:Instance):Promise<Instance> {
  async upsertInstance(entityName:string, instance:Instance):Promise<any> {
  
    if (instance.entity == "Entity" && (this.sqlEntities == undefined || !this.sqlEntities[instance['name']])) {
      console.log('upsertInstance create entity', instance['name']);
      const entityDefinition: EntityDefinition = instance as EntityDefinition;
      // this.localIndexedDb.addSubLevels([entityName]);
      this.sqlEntities = 
        Object.assign(
          !!this.sqlEntities?this.sqlEntities:{}, this.sqlEntityDefinition(instance as EntityDefinition)
        )
      ;
      console.log('upsertInstance create entity', entityDefinition.name);
      await this.sqlEntities[entityDefinition.name].sync({ force: true });
    } else {
      if (instance.entity == "Entity") {
        console.log('upsertInstance entity', instance['name'],'already exists this.sqlEntities:',Object.keys(this.sqlEntities));
      }
    }
  
    return this.sqlEntities[instance.entity].create(instance as any);
  }

  // ##############################################################################################
  // async deleteInstances(entityName:string, instances:Instance[]):Promise<Instance[]> {
  async deleteInstances(entityName:string, instances:Instance[]):Promise<any> {
    // for (const o of instances) {
    //   await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
    // }
    return Promise.resolve();
  }
}
