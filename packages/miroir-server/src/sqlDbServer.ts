import { DataStoreInterface, EntityAttributeType, EntityDefinition, entityEntity, Instance, ModelStructureUpdate } from "miroir-core";
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
export type SqlUuidEntityDefinition = {[entityUuid in string]:{entityName:string,sequelizeModel:ModelStatic<Model<any,any>>}};


// ##############################################################################################
// ##############################################################################################
export class SqlDbServer implements DataStoreInterface {

  private sqlEntities:SqlEntityDefinition = undefined;
  private sqlUuidEntities:SqlUuidEntityDefinition = undefined;

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
      if (this.sqlEntities && this.sqlEntities[entityName]) {
        delete this.sqlEntities[entityName];
      }
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
  getUuidEntities():string[] {
    return this.sqlUuidEntities?Object.keys(this.sqlUuidEntities):[];
  }

  // ##############################################################################################
  dropUuidEntity(entityUuid:string) {
    if (this.sqlUuidEntities && this.sqlUuidEntities[entityUuid]) {
      const model = this.sqlUuidEntities[entityUuid];
      console.log('dropUuidEntity entityUuid',entityUuid,model.entityName);
      this.sequelize.modelManager.removeModel(this.sequelize.model(model.entityName));
      delete this.sqlUuidEntities[entityUuid];
    } else {
      console.warn('dropUuidEntity entityUuid',entityUuid,'NOT FOUND.');
    }

    // if (this.sequelize.isDefined(entityUuid)) {
    //   console.warn('dropEntity entityName',entityUuid,'is defined.');
    //   if (this.sqlEntities && this.sqlEntities[entityUuid]) {delete this.sqlEntities[entityUuid];}
    //   this.sequelize.modelManager.removeModel(this.sequelize.model(entityUuid));
    // } else {
    //   console.warn('dropEntity entityName',entityUuid,'not found.');
    // }
  }

    // ##############################################################################################
    dropUuidEntities(entityUuids:string[]) {
      console.log('dropUuidEntities entityUuid',entityUuids);
      entityUuids.forEach(e =>this.dropUuidEntity(e));
    }

  // ##############################################################################################
  sqlUuidEntityDefinition(entityDefinition:EntityDefinition):SqlUuidEntityDefinition {
    return {
      [entityDefinition.uuid]:{
        entityName:entityDefinition.name,
        sequelizeModel:this.sequelize.define(
          entityDefinition.name, 
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true
          }
        )
      }
    }
  }

  // ##############################################################################################
  async init():Promise<void> {
    if (this.sqlEntities) {
      console.warn('sqlDbServer init initialization can not be done a second time', this.sqlEntities);
    } else {
      console.warn('sqlDbServer init initialization started');
      const entities:EntityDefinition[] = await this.getInstancesUuid(entityEntity.uuid,this.sqlUuidEntityDefinition(entityEntity as EntityDefinition));
      // this.sqlEntities = entities.reduce(
      //   (prev,curr:EntityDefinition) => {
      //     console.warn('sqlDbServer init initializing',curr);
      //     return Object.assign(prev,this.sqlEntityDefinition(curr));
      //   },{})
      this.sqlUuidEntities = entities.reduce(
        (prev,curr:EntityDefinition) => {
          console.warn('sqlDbServer uuid init initializing',curr);
          return Object.assign(prev,this.sqlUuidEntityDefinition(curr));
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
        Promise.resolve([])
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
  // getInstances(entityName:string):Promise<Instance[]> {
  getInstancesUuid(entityUuid:string,sqlUuidEntities?:SqlUuidEntityDefinition):Promise<any> {
    return sqlUuidEntities? (
      sqlUuidEntities[entityUuid]?
        sqlUuidEntities[entityUuid].sequelizeModel.findAll()
        : 
        Promise.resolve([])
      )
      : 
      (
        this.sqlUuidEntities?(
          this.sqlUuidEntities[entityUuid]?
            this.sqlUuidEntities[entityUuid].sequelizeModel.findAll()
            :
            Promise.resolve([])
        )
        :
        Promise.resolve([])
      )
    ;
  }

  // ##############################################################################################
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
  async upsertInstanceUuid(entityUuid:string, instance:Instance):Promise<any> {
  
    if (entityUuid == entityEntity.uuid && (this.sqlEntities == undefined || !this.sqlUuidEntities[entityEntity.uuid])) {
      console.log('upsertInstanceUuid create entity', instance['uuid'], instance['name']);
      const entityDefinition: EntityDefinition = instance as EntityDefinition;
      // this.localIndexedDb.addSubLevels([entityName]);
      this.sqlUuidEntities = 
        Object.assign(
          !!this.sqlUuidEntities?this.sqlUuidEntities:{}, this.sqlUuidEntityDefinition(instance as EntityDefinition)
        )
      ;
      await this.sqlUuidEntities[entityDefinition.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
      console.log('upsertInstanceUuid created entity', entityDefinition.uuid, entityDefinition.name);
    } else {
      if (instance.entityUuid == entityEntity.uuid) {
        console.log('upsertInstanceUuid entity', instance['name'],'already exists this.sqlEntities:',Object.keys(this.sqlEntities));
      }
    }
  
    return this.sqlUuidEntities[instance.entityUuid].sequelizeModel.create(instance as any);
  }

  // ##############################################################################################
  // async deleteInstances(entityName:string, instances:Instance[]):Promise<Instance[]> {
  async deleteInstances(entityName:string, instances:Instance[]):Promise<any> {
    // for (const o of instances) {
    //   await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
    // }
    return Promise.resolve();
  }

  // ##############################################################################################
  // async deleteInstances(entityName:string, instances:Instance[]):Promise<Instance[]> {
  async deleteInstancesUuid(entityUuid:string, instances:Instance[]):Promise<any> {
    // for (const o of instances) {
    //   await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
    // }
    return Promise.resolve();
  }

  // ##############################################################################################
  async applyModelStructureUpdates(updates:ModelStructureUpdate[]){
    console.log('SqlDbServer applyModelStructureUpdates',updates);
    const currentUpdate = updates[0];
    if (this.sqlUuidEntities && this.sqlUuidEntities[currentUpdate.entityUuid]) {
      const model = this.sqlUuidEntities[currentUpdate.entityUuid];
      console.log('dropUuidEntity SqlDbServer applyModelStructureUpdates',currentUpdate.entityUuid,model.entityName);
      this.sequelize.getQueryInterface().renameTable(currentUpdate.entityName,currentUpdate.targetValue);
      this.sequelize.modelManager.removeModel(this.sequelize.model(model.entityName));
      // const newModel=
      // this.sqlUuidEntities[currentUpdate.entityUuid] = {entityName:currentUpdate.targetValue,sequelizeModel:this.sqlUuidEntities[currentUpdate.entityUuid].sequelizeModel}
      Object.assign(this.sqlUuidEntities, this.sqlUuidEntityDefinition(currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0] as EntityDefinition));
    } else {
      console.warn('dropUuidEntity SqlDbServer entity uuid',currentUpdate.entityUuid,'name',currentUpdate.entityName,'not found!');
      
    }
  }

}
