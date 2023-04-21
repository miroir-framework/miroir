import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityModelVersion from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityReport from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityEntity from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityStoreBasedConfiguration from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityDefinitionEntityDefinition from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionEntity from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import EntityDefinitionReport from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
import entityDefinitionModelVersion from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionStoreBasedConfiguration from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';
import reportConfigurationList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportEntityList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportEntityDefinitionList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import reportReportList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';
import reportModelVersionList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import instanceModelVersionInitial from '../assets/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import instanceConfigurationReference from '../assets/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
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