import {
  entityEntity,
  entitySelfApplicationDeploymentConfiguration,
  entityEndpointVersion,
  entityReport,
  entityEntityDefinition,
  entityJzodSchema,
  entityStoreBasedConfiguration,
  entitySelfApplication,
  entitySelfApplicationVersion,
  entitySelfApplicationModelBranch,
  entityMenu,
  entityQueryVersion,
  entityRunner,
  entityDefinitionMenu,
  entityDefinitionJzodSchema,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionQuery,
  entityDefinitionEntity,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplication,
  entityDefinitionReport,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionEntityDefinition,
  entityDefinitionEndpoint,
  entityDefinitionStoreBasedConfiguration,
  entityDefinitionRunner,
  reportApplicationVersionList,
  reportApplicationList,
  reportReportList,
  reportConfigurationList,
  reportApplicationModelBranchList,
  reportQueryList,
  reportJzodSchemaList,
  reportEndpointVersionList,
  reportEntityList,
  reportApplicationDeploymentConfigurationList,
  reportMenuList,
  reportEntityDefinitionList,
  queryVersionBundleProducerV1,
  modelEndpointV1,
  storeManagementEndpoint as deploymentEndpointV1,
  applicationEndpointV1,
  instanceEndpointV1,
  miroirJzodSchemaBootstrap,
  menuDefaultMiroir,
} from "miroir-test-app_deployment-miroir";
import { menuDefaultLibrary } from "miroir-test-app_deployment-library";

import { MetaEntity } from "../0_interfaces/1_core/EntityDefinition";
import {
  EntityDefinition,
  EntityInstance,
  MetaModel,
  SelfApplication,
  Deployment,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DataStoreApplicationType } from '../0_interfaces/3_controllers/ApplicationControllerInterface.js';
import { LoggerInterface } from '../0_interfaces/4-services/LoggerInterface.js';
import { PersistenceStoreControllerInterface } from '../0_interfaces/4-services/PersistenceStoreControllerInterface.js';
import { MiroirLoggerFactory } from '../4_services/MiroirLoggerFactory.js';
import { packageName } from '../constants.js';
import { cleanLevel } from './constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelInitializer")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export async function modelInitialize(
  metaModel:MetaModel,
  persistenceStoreController:PersistenceStoreControllerInterface,
  dataStoreType: DataStoreApplicationType,
  selfApplication: SelfApplication,
  selfApplicationModelBranch: EntityInstance,
  selfApplicationVersion: EntityInstance,
  // selfApplicationStoreBasedConfiguration: EntityInstance,
): Promise<void> {
  log.info("modelInitialize selfApplication",selfApplication,'dataStoreType',dataStoreType);
  const logHeader = 'modelInitialize '+ selfApplication?.name;
  // TODO: test this.sqlEntities for emptiness, abort if not empty
  // bootstrap MetaClass entity
  log.info('################################### modelInitialize',selfApplication.name,'dataStoreType',dataStoreType);
  
  const insertReferenceInMetaModel = dataStoreType == 'miroir';

  if (dataStoreType == 'miroir') {
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition); //entityDefinition for entityEntity has not been inserted!
  
    // bootstrap MetaClass EntityDefinition
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(entityEntityDefinition as MetaEntity, entityDefinitionEntityDefinition as EntityDefinition);
    log.info(logHeader, 'created entity EntityDefinition',persistenceStoreController.getEntityUuids());
  
    // // because entityDefinition for entityEntity has not been inserted during datastore.createEntity(entityEntity as MetaEntity,entityDefinitionEntity as EntityDefinition);!
    await persistenceStoreController.upsertInstance('model', entityEntity as EntityInstance);
    await persistenceStoreController.upsertInstance('model', entityEntityDefinition as EntityInstance);
    await persistenceStoreController.upsertInstance('model', entityDefinitionEntity as EntityInstance);
    await persistenceStoreController.upsertInstance('model', entityDefinitionEntityDefinition as EntityInstance);
    log.info(logHeader, 'created entity entity',persistenceStoreController.getEntityUuids());
  
    // bootstrap SelfApplication
    await persistenceStoreController.createEntity(entitySelfApplication as MetaEntity, entityDefinitionSelfApplication as EntityDefinition);
    log.info(logHeader, 'created entity SelfApplication',persistenceStoreController.getEntityUuids());
    
    // bootstrap ApplicationModelBranch
    await persistenceStoreController.createEntity(entitySelfApplicationModelBranch as MetaEntity, entityDefinitionSelfApplicationModelBranch as EntityDefinition);
    log.info(logHeader, 'created entity ApplicationModelBranch',persistenceStoreController.getEntityUuids());
    
    // bootstrap ApplicationVersion
    await persistenceStoreController.createEntity(entitySelfApplicationVersion as MetaEntity, entityDefinitionSelfApplicationVersion as EntityDefinition);
    log.info(logHeader, 'created entity ApplicationVersion',persistenceStoreController.getEntityUuids());
    
    // // bootstrap SelfApplication Deployment Configuration
    // await persistenceStoreController.createEntity(entitySelfApplicationDeploymentConfiguration as MetaEntity, entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition);
    // log.info(logHeader, 'created entity entitySelfApplicationDeploymentConfiguration',persistenceStoreController.getEntityUuids());

    


    // // bootstrap Endpoint
    // await persistenceStoreController.createEntity(entityEndpoint as MetaEntity, entityDefinitionEndpoint as EntityDefinition);
    // log.info(logHeader, 'created entity Endpoint',persistenceStoreController.getEntityUuids());
    
    // bootstrap Endpoint version
    await persistenceStoreController.createEntity(entityEndpointVersion as MetaEntity, entityDefinitionEndpoint as EntityDefinition);
    log.info(logHeader, 'created entity Endpoint',persistenceStoreController.getEntityUuids());
    
    // bootstrap Menu
    await persistenceStoreController.createEntity(entityMenu as MetaEntity, entityDefinitionMenu as EntityDefinition);
    log.info(logHeader, 'created entity Menu',persistenceStoreController.getEntityUuids());
    
    // // bootstrap EntityStoreBasedConfiguration
    // await persistenceStoreController.createEntity(entityStoreBasedConfiguration as MetaEntity, entityDefinitionStoreBasedConfiguration as EntityDefinition);
    // log.info(logHeader, 'created entity StoreBasedConfiguration',persistenceStoreController.getEntityUuids());
    
    // bootstrap EntityJzodSchema
    await persistenceStoreController.createEntity(entityJzodSchema as MetaEntity, entityDefinitionJzodSchema as EntityDefinition);
    log.info(logHeader, 'created entity MlSchema',persistenceStoreController.getEntityUuids());
    
    // bootstrap EntityReport
    await persistenceStoreController.createEntity(entityReport as MetaEntity, entityDefinitionReport as EntityDefinition);
    log.info(logHeader, 'created entity EntityReport',persistenceStoreController.getEntityUuids());
    
    // bootstrap EntityRunner
    await persistenceStoreController.createEntity(entityRunner as MetaEntity, entityDefinitionRunner as EntityDefinition);
    log.info(logHeader, 'created entity EntityRunner',persistenceStoreController.getEntityUuids());
    
    // bootstrap EntityQuery
    await persistenceStoreController.createEntity(entityQueryVersion as MetaEntity, entityDefinitionQuery as EntityDefinition);
    log.info(logHeader, 'created entity Query',persistenceStoreController.getEntityUuids());
    
    // bootstrap EntityQueryVersion
    await persistenceStoreController.createEntity(entityQueryVersion as MetaEntity, entityDefinitionQuery as EntityDefinition);
    log.info(logHeader, 'created entity Query',persistenceStoreController.getEntityUuids());
    
    await persistenceStoreController.upsertInstance('data', reportConfigurationList as EntityInstance);
    // await persistenceStoreController.upsertInstance('data', reportEndpointList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportEndpointVersionList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportEntityDefinitionList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportEntityList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportApplicationList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportApplicationDeploymentConfigurationList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportApplicationModelBranchList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportApplicationVersionList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportMenuList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportReportList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportJzodSchemaList as EntityInstance);
    // await persistenceStoreController.upsertInstance('data', reportQueryList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', reportQueryList as EntityInstance);
    await persistenceStoreController.upsertInstance('data', menuDefaultMiroir as EntityInstance);
    await persistenceStoreController.upsertInstance('data', miroirJzodSchemaBootstrap as EntityInstance);
    

    await persistenceStoreController.upsertInstance('data', selfApplication);
    // log.info(logHeader, 'inserting miroir deployment',deployment);
    // await persistenceStoreController.upsertInstance('data', deployment);
    // log.info(logHeader, 'inserting miroir deployment DONE');
    await persistenceStoreController.upsertInstance('data', selfApplicationModelBranch);
    await persistenceStoreController.upsertInstance('data', selfApplicationVersion);
    // await persistenceStoreController.upsertInstance('data', selfApplicationStoreBasedConfiguration);

    // await persistenceStoreController.upsertInstance('data', applicationEndpoint);
    await persistenceStoreController.upsertInstance('data', applicationEndpointV1);
    // await persistenceStoreController.upsertInstance('data', deploymentEndpoint);
    await persistenceStoreController.upsertInstance('data', deploymentEndpointV1);
    // await persistenceStoreController.upsertInstance('data', instanceEndpoint);
    await persistenceStoreController.upsertInstance('data', instanceEndpointV1);
    // await persistenceStoreController.upsertInstance('data', modelEndpoint);
    await persistenceStoreController.upsertInstance('data', modelEndpointV1);

    // await persistenceStoreController.upsertInstance('data', queryBundleProducer);
    await persistenceStoreController.upsertInstance('data', queryVersionBundleProducerV1);
  }

  if (dataStoreType == 'app') {
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntity as MetaEntity,
      entityDefinitionEntity as EntityDefinition
    ); //entityDefinition for entityEntity has not been inserted!

    log.info(logHeader, "app initialized entity Entity", persistenceStoreController.getEntityUuids());

    // bootstrap MetaClass EntityDefinition
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntityDefinition as MetaEntity,
      entityDefinitionEntityDefinition as EntityDefinition
    );
    log.info(logHeader, "app initialized entity Definition", persistenceStoreController.getEntityUuids());

    // bootstrap Self SelfApplication
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplication as MetaEntity,
      entityDefinitionSelfApplication as EntityDefinition
    );
    log.info(logHeader, "app initialized entity SelfApplication", persistenceStoreController.getEntityUuids());

    // bootstrap Self ApplicationModelBranch
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplicationModelBranch as MetaEntity,
      entityDefinitionSelfApplicationModelBranch as EntityDefinition
    );
    log.info(logHeader, "app initialized entity ApplicationModelBranch", persistenceStoreController.getEntityUuids());

    // bootstrap Self ApplicationVersion
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplicationVersion as MetaEntity,
      entityDefinitionSelfApplicationVersion as EntityDefinition
    );
    log.info(logHeader, "app initialized entity ApplicationVersion", persistenceStoreController.getEntityUuids());

    // bootstrap Self Deployment
    // await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
    //   entitySelfApplicationDeploymentConfiguration as MetaEntity,
    //   entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition
    // );
    // log.info(
    //   logHeader,
    //   "app initialized entity deployment",
    //   persistenceStoreController.getEntityUuids()
    // );

    // bootstrap Self Menu
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityMenu as MetaEntity,
      entityDefinitionMenu as EntityDefinition
    );
    log.info(
      logHeader,
      "app initialized entity Menu",
      persistenceStoreController.getEntityUuids()
    );

    // // bootstrap Endpoint
    // await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(entityEndpoint as MetaEntity, entityDefinitionEndpoint as EntityDefinition);
    // log.info(logHeader, 'app initialized entity Endpoint',persistenceStoreController.getEntityUuids());

    // bootstrap Endpoint
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEndpointVersion as MetaEntity,
      entityDefinitionEndpoint as EntityDefinition
    );
    log.info(logHeader, "app initialized entity Endpoint", persistenceStoreController.getEntityUuids());

    // bootstrap QueryVersion
    log.info(logHeader, "app initialized entity Query", persistenceStoreController.getEntityUuids());
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityQueryVersion as MetaEntity,
      entityDefinitionQuery as EntityDefinition
    );

    // bootstrap EntityReport
    log.info(logHeader, "app initializing entity Report", persistenceStoreController.getEntityUuids());
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityReport as MetaEntity,
      entityDefinitionReport as EntityDefinition
    );
    log.info(logHeader, "app initialized entity Report", persistenceStoreController.getEntityUuids());

    log.info(logHeader, "app initializing entity Runner", persistenceStoreController.getEntityUuids());
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityRunner as MetaEntity,
      entityDefinitionRunner as EntityDefinition
    );
    log.info(logHeader, "app initialized entity Runner", persistenceStoreController.getEntityUuids());

    // // bootstrap EntityStoreBasedConfiguration
    // await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
    //   entityStoreBasedConfiguration as MetaEntity,
    //   entityDefinitionStoreBasedConfiguration as EntityDefinition
    // );
    // log.info(logHeader, "app initialized entity StoreBasedConfiguration", persistenceStoreController.getEntityUuids());

    await persistenceStoreController.upsertInstance("model", selfApplication);
    // // log.info(logHeader, 'inserting app deployment',deployment);
    // await persistenceStoreController.upsertInstance("model", deployment);
    // // log.info(logHeader, 'inserting app deployment DONE');
    await persistenceStoreController.upsertInstance("model", selfApplicationModelBranch);
    await persistenceStoreController.upsertInstance("model", selfApplicationVersion);
    // await persistenceStoreController.upsertInstance("model", selfApplicationStoreBasedConfiguration);
    await persistenceStoreController.upsertInstance("model", menuDefaultLibrary);
  }

  // HUGE LOG!
  // log.info(
  //   logHeader,
  //   "modelInitialize done",
  //   JSON.stringify({
  //     model: await persistenceStoreController.getModelState(),
  //     data: await persistenceStoreController.getDataState(),
  //   })
  // );
  return Promise.resolve(undefined);
}