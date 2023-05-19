import { StoreControllerInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import entityApplication from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entityApplicationDeployment from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entityApplicationVersion from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityApplicationModelBranch from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
import entityEntity from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
// import entityModelVersion from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityReport from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityStoreBasedConfiguration from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityDefinitionEntityDefinition from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionEntity from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionApplication from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionApplicationDeployment from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionApplicationVersion from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionApplicationModelBranch from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import EntityDefinitionReport from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
// import entityDefinitionModelVersion from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionStoreBasedConfiguration from '../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';
import reportApplicationList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportApplicationDeploymentList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportApplicationModelBranchList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportApplicationVersionList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import reportConfigurationList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportEntityList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportEntityDefinitionList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import reportReportList from '../assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';

import { EntityInstance } from "../0_interfaces/1_core/Instance.js";
import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model";
import { Application } from "../0_interfaces/1_core/Application.js";

export type DataStoreApplicationType = 'miroir' | 'app';

export const metamodelEntities = [
  entityApplication,
  entityApplicationDeployment, // TODO: remove, deployments are not part of applications, they are external to them, belonging to a separate application, which contents is specific to each node (no transactions / historization)
  entityApplicationModelBranch,
  entityApplicationVersion,
  entityEntity,
  entityEntityDefinition,
  entityReport,
  entityStoreBasedConfiguration,
];

export async function modelInitialize(
  metaModel:MiroirMetaModel,
  datastore:StoreControllerInterface,
  dataStoreType: DataStoreApplicationType,
  application: Application,
  applicationDeployment: EntityInstance,
  applicationModelBranch: EntityInstance,
  applicationVersion: EntityInstance,
  applicationStoreBasedConfiguration: EntityInstance,
): Promise<void> {
  const logHeader = 'modelInitialize '+ application.name;
  // TODO: test this.sqlEntities for emptiness, abort if not empty
  // bootstrap MetaClass entity
  console.log('################################### initApplication',application.name,'dataStoreType',dataStoreType);
  
  const insertReferenceInMetaModel = dataStoreType == 'miroir';

  if (dataStoreType == 'miroir') {
    await datastore.createStorageSpaceForInstancesOfEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition); //entityDefinition for entityEntity has not been inserted!
  
    // bootstrap MetaClass EntityDefinition
    await datastore.createStorageSpaceForInstancesOfEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
    console.log(logHeader, 'created entity EntityDefinition',datastore.getEntities());
  
    // // because entityDefinition for entityEntity has not been inserted during datastore.createEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition);!
    await datastore.upsertModelInstance(entityEntity.uuid, entityEntity as EntityInstance);
    await datastore.upsertModelInstance(entityEntity.uuid, entityEntityDefinition as EntityInstance);
    await datastore.upsertModelInstance(entityEntityDefinition.uuid, entityDefinitionEntity as EntityInstance);
    await datastore.upsertModelInstance(entityEntityDefinition.uuid, entityDefinitionEntityDefinition as EntityInstance);
    console.log(logHeader, 'created entity entity',datastore.getEntities());
  
    // bootstrap Application
    await datastore.createEntity(entityApplication as MetaEntity, entityDefinitionApplication as EntityDefinition);
    console.log(logHeader, 'created entity EntityApplication',datastore.getEntities());
    
    // bootstrap ApplicationModelBranch
    await datastore.createEntity(entityApplicationModelBranch as MetaEntity, entityDefinitionApplicationModelBranch as EntityDefinition);
    console.log(logHeader, 'created entity EntityApplicationModelBranch',datastore.getEntities());
    
    // bootstrap ApplicationVersion
    await datastore.createEntity(entityApplicationVersion as MetaEntity, entityDefinitionApplicationVersion as EntityDefinition);
    console.log(logHeader, 'created entity EntityApplicationVersion',datastore.getEntities());
    
    // bootstrap Application
    await datastore.createEntity(entityApplicationDeployment as MetaEntity, entityDefinitionApplicationDeployment as EntityDefinition);
    console.log(logHeader, 'created entity EntityApplicationDeployment',datastore.getEntities());
    
    // bootstrap EntityStoreBasedConfiguration
    await datastore.createEntity(entityStoreBasedConfiguration as MetaEntity, entityDefinitionStoreBasedConfiguration as EntityDefinition);
    console.log(logHeader, 'created entity EntityStoreBasedConfiguration',datastore.getEntities());
    
    // bootstrap EntityStoreBasedConfiguration
    await datastore.createEntity(entityReport as MetaEntity, EntityDefinitionReport as EntityDefinition);
    console.log(logHeader, 'created entity EntityReport',datastore.getEntities());
    
    await datastore.upsertDataInstance(entityReport.uuid, reportConfigurationList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportEntityDefinitionList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportEntityList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportApplicationList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportApplicationDeploymentList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportApplicationModelBranchList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportApplicationVersionList as EntityInstance);
    await datastore.upsertDataInstance(entityReport.uuid, reportReportList as EntityInstance);


    await datastore.upsertDataInstance(entityApplication.uuid, application);
    await datastore.upsertDataInstance(entityApplicationDeployment.uuid, applicationDeployment);
    await datastore.upsertDataInstance(entityApplicationModelBranch.uuid, applicationModelBranch);
    await datastore.upsertDataInstance(entityApplicationVersion.uuid, applicationVersion);
    await datastore.upsertDataInstance(entityStoreBasedConfiguration.uuid, applicationStoreBasedConfiguration);
  }

  if (dataStoreType == 'app') {
    await datastore.createStorageSpaceForInstancesOfEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition); //entityDefinition for entityEntity has not been inserted!
  
    console.log(logHeader, 'app initialized entity entity',datastore.getEntities());
  
    // bootstrap MetaClass EntityDefinition
    await datastore.createStorageSpaceForInstancesOfEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityDefinition',datastore.getEntities());
  
    // bootstrap Application
    await datastore.createStorageSpaceForInstancesOfEntity(entityApplication as MetaEntity, entityDefinitionApplication as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityApplication',datastore.getEntities());
    
    // bootstrap ApplicationModelBranch
    await datastore.createStorageSpaceForInstancesOfEntity(entityApplicationModelBranch as MetaEntity, entityDefinitionApplicationModelBranch as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityApplicationModelBranch',datastore.getEntities());
    
    // bootstrap ApplicationVersion
    await datastore.createStorageSpaceForInstancesOfEntity(entityApplicationVersion as MetaEntity, entityDefinitionApplicationVersion as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityApplicationVersion',datastore.getEntities());
    
    // bootstrap Application
    await datastore.createStorageSpaceForInstancesOfEntity(entityApplicationDeployment as MetaEntity, entityDefinitionApplicationDeployment as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityApplicationDeployment',datastore.getEntities());
    
    // bootstrap EntityStoreBasedConfiguration
    await datastore.createStorageSpaceForInstancesOfEntity(entityStoreBasedConfiguration as MetaEntity, entityDefinitionStoreBasedConfiguration as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityStoreBasedConfiguration',datastore.getEntities());
    
    // bootstrap EntityStoreBasedConfiguration
    await datastore.createStorageSpaceForInstancesOfEntity(entityReport as MetaEntity, EntityDefinitionReport as EntityDefinition);
    console.log(logHeader, 'app initialized entity EntityReport',datastore.getEntities());
    
    await datastore.upsertModelInstance(entityApplication.uuid, application);
    await datastore.upsertModelInstance(entityApplicationDeployment.uuid, applicationDeployment);
    await datastore.upsertModelInstance(entityApplicationModelBranch.uuid, applicationModelBranch);
    await datastore.upsertModelInstance(entityApplicationVersion.uuid, applicationVersion);
    await datastore.upsertModelInstance(entityStoreBasedConfiguration.uuid, applicationStoreBasedConfiguration);
  }


  console.log(logHeader, 'modelInitialize done',await datastore.getState());
  return Promise.resolve(undefined);
}