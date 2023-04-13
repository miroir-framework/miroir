import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityModelVersion from '../assets/entities/EntityModelVersion.json';
import entityReport from '../assets/entities/EntityReport.json';
import entityEntity from '../assets/entities/EntityEntity.json';
import entityEntityDefinition from '../assets/entities/EntityEntityDefinition.json';
import entityStoreBasedConfiguration from '../assets/entities/EntityStoreBasedConfiguration.json';
import entityDefinitionEntityDefinition from '../assets/entityDefinitions/EntityDefinitionEntityDefinition.json';
import entityDefinitionEntity from '../assets/entityDefinitions/EntityDefinitionEntity.json';
import EntityDefinitionReport from '../assets/entityDefinitions/EntityDefinitionReport.json';
import entityDefinitionModelVersion from '../assets/entityDefinitions/EntityDefinitionModelVersion.json';
import entityDefinitionStoreBasedConfiguration from '../assets/entityDefinitions/StoreBasedConfiguration.json';
import reportConfigurationList from '../assets/reports/ConfigurationList.json';
import reportEntityList from '../assets/reports/entityList.json';
import reportEntityDefinitionList from '../assets/reports/entityDefinitionList.json';
import reportReportList from '../assets/reports/ReportList.json';
import reportModelVersionList from '../assets/reports/ModelVersionList.json';
import instanceModelVersionInitial from '../assets/instances/ModelVersion - initial.json';
import instanceConfigurationReference from '../assets/instances/StoreBasedConfiguration - reference.json';
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition";

export async function modelInitialize(datastore:DataStoreInterface): Promise<void> {
      // TODO: test this.sqlEntities for emptiness, abort if not empty
    // bootstrap MetaClass entity
    console.log('################################### initModel');
    
    await datastore.createEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition); //entityDefinition for entityEntity has not been inserted!

    console.log('created entity entity',datastore.getEntities());

    // bootstrap MetaClass EntityDefinition
    await datastore.createEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
    console.log('created entity EntityDefinition',datastore.getEntities());

    // because entityDefinition for entityEntity has not been inserted during datastore.createEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition);!
    await datastore.upsertInstance(entityEntityDefinition.uuid, entityDefinitionEntity as EntityInstance);

    // bootstrap ModelVersion
    await datastore.createEntity(entityModelVersion as MetaEntity, entityDefinitionModelVersion as EntityDefinition);
    console.log('created entity EntityModelVersion',datastore.getEntities());
    // await datastore.sqlEntities[entityModelVersion.uuid].sequelizeModel.upsert(instanceModelVersionInitial as any);
    await datastore.upsertInstance(entityModelVersion.uuid, instanceModelVersionInitial as EntityInstance);

    // bootstrap EntityStoreBasedConfiguration
    await datastore.createEntity(entityStoreBasedConfiguration as MetaEntity, entityDefinitionStoreBasedConfiguration as EntityDefinition);
    console.log('created entity EntityStoreBasedConfiguration',datastore.getEntities());
    // await this.sqlEntities[entityStoreBasedConfiguration.uuid].sequelizeModel.upsert(instanceConfigurationReference as any);
    await datastore.upsertInstance(entityStoreBasedConfiguration.uuid, instanceConfigurationReference as EntityInstance);

    // bootstrap EntityStoreBasedConfiguration
    await datastore.createEntity(entityReport as MetaEntity, EntityDefinitionReport as EntityDefinition);
    console.log('created entity EntityReport',datastore.getEntities());
    // await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportEntityList as any);
    // await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportEntityDefinitionList as any);
    // await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportModelVersionList as any);
    // await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportConfigurationList as any);
    // await this.sqlEntities[entityReport.uuid].sequelizeModel.upsert(reportReportList as any);
    await datastore.upsertInstance(entityReport.uuid, reportConfigurationList as EntityInstance);
    await datastore.upsertInstance(entityReport.uuid, reportEntityDefinitionList as EntityInstance);
    await datastore.upsertInstance(entityReport.uuid, reportEntityList as EntityInstance);
    await datastore.upsertInstance(entityReport.uuid, reportModelVersionList as EntityInstance);
    await datastore.upsertInstance(entityReport.uuid, reportReportList as EntityInstance);
    console.log('modelInitialize done',await datastore.getState());
    return Promise.resolve(undefined);
}