import {
  applicationEndpointV1,
  compactStoredMiroirTheme,
  darkStoredMiroirTheme,
  defaultStoredMiroirTheme,
  storeManagementEndpoint as deploymentEndpointV1,
  entityDefinitionEndpoint,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQuery,
  entityDefinitionReport,
  entityDefinitionRunner,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionTheme,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityTheme,
  instanceEndpointV1,
  materialStoredMiroirTheme,
  menuDefaultMiroir,
  miroirJzodSchemaBootstrap,
  modelEndpointV1,
  queryVersionBundleProducerV1,
  reportApplicationDeploymentConfigurationList,
  reportApplicationList,
  reportApplicationModelBranchList,
  reportApplicationVersionList,
  reportConfigurationList,
  reportEndpointVersionList,
  reportEntityDefinitionList,
  reportEntityList,
  reportJzodSchemaList,
  reportMenuList,
  reportQueryList,
  reportReportList
} from "miroir-test-app_deployment-miroir";

import {
  entityDefinitionWithResolvedMLSchema
} from "../0_interfaces/1_core/EntityDefinition";
import {
  Entity,
  EntityDefinition,
  EntityInstance,
  SelfApplication
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelInitializer"),
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export async function modelInitialize(
  persistenceStoreController: PersistenceStoreControllerInterface,
  dataStoreType: DataStoreApplicationType,
  selfApplication: SelfApplication,
  selfApplicationModelBranch: EntityInstance,
  selfApplicationVersion: EntityInstance,
  // selfApplicationStoreBasedConfiguration: EntityInstance,
  // metaModel?:MetaModel,
): Promise<void> {
  log.info("modelInitialize selfApplication", selfApplication, "dataStoreType", dataStoreType);
  const logHeader = "modelInitialize " + selfApplication?.name;
  // TODO: test this.sqlEntities for emptiness, abort if not empty
  // bootstrap MetaClass entity
  log.info(
    "################################### modelInitialize",
    selfApplication.name,
    "dataStoreType",
    dataStoreType,
  );

  const insertReferenceInMetaModel = dataStoreType == "miroir";

  if (dataStoreType == "miroir") {
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntity as Entity,
      entityDefinitionEntity as EntityDefinition,
    ); //entityDefinition for entityEntity has not been inserted!

    // bootstrap MetaClass EntityDefinition
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntityDefinition as Entity,
      entityDefinitionEntityDefinition as EntityDefinition,
    );
    log.info(
      logHeader,
      "created entity EntityDefinition",
      persistenceStoreController.getEntityUuids(),
    );

    // // because entityDefinition for entityEntity has not been inserted during datastore.createEntity(entityEntity as Entity,entityDefinitionEntity as EntityDefinition);!
    await persistenceStoreController.upsertInstance("model", entityEntity as EntityInstance);
    await persistenceStoreController.upsertInstance(
      "model",
      entityEntityDefinition as EntityInstance,
    );
    await persistenceStoreController.upsertInstance(
      "model",
      entityDefinitionEntity as EntityInstance,
    );
    await persistenceStoreController.upsertInstance(
      "model",
      entityDefinitionEntityDefinition as EntityInstance,
    );
    log.info(logHeader, "created entity entity", persistenceStoreController.getEntityUuids());

    // bootstrap SelfApplication
    await persistenceStoreController.createEntity(
      entitySelfApplication as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionSelfApplication as EntityDefinition),
    );
    log.info(
      logHeader,
      "created entity SelfApplication",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap ApplicationModelBranch
    await persistenceStoreController.createEntity(
      entitySelfApplicationModelBranch as Entity,
      entityDefinitionWithResolvedMLSchema(
        entityDefinitionSelfApplicationModelBranch as EntityDefinition,
      ),
    );
    log.info(
      logHeader,
      "created entity ApplicationModelBranch",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap ApplicationVersion
    await persistenceStoreController.createEntity(
      entitySelfApplicationVersion as Entity,
      entityDefinitionWithResolvedMLSchema(
        entityDefinitionSelfApplicationVersion as EntityDefinition,
      ),
    );
    log.info(
      logHeader,
      "created entity ApplicationVersion",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Endpoint version
    await persistenceStoreController.createEntity(
      entityEndpointVersion as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionEndpoint as EntityDefinition),
    );
    log.info(logHeader, "created entity Endpoint", persistenceStoreController.getEntityUuids());

    // bootstrap Menu
    await persistenceStoreController.createEntity(
      entityMenu as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionMenu as EntityDefinition),
    );
    log.info(logHeader, "created entity Menu", persistenceStoreController.getEntityUuids());

    // // bootstrap EntityStoreBasedConfiguration
    // await persistenceStoreController.createEntity(entityStoreBasedConfiguration as Entity, entityDefinitionStoreBasedConfiguration as EntityDefinition);
    // log.info(logHeader, 'created entity StoreBasedConfiguration',persistenceStoreController.getEntityUuids());

    // bootstrap EntityJzodSchema
    await persistenceStoreController.createEntity(
      entityJzodSchema as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionJzodSchema as EntityDefinition),
    );
    log.info(logHeader, "created entity MlSchema", persistenceStoreController.getEntityUuids());

    // bootstrap EntityReport
    await persistenceStoreController.createEntity(
      entityReport as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionReport as EntityDefinition),
    );
    log.info(logHeader, "created entity EntityReport", persistenceStoreController.getEntityUuids());

    // bootstrap EntityRunner
    await persistenceStoreController.createEntity(
      entityRunner as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionRunner as EntityDefinition),
    );
    log.info(logHeader, "created entity EntityRunner", persistenceStoreController.getEntityUuids());

    // bootstrap EntityTheme
    await persistenceStoreController.createEntity(
      entityTheme as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionTheme as EntityDefinition),
    );
    log.info(logHeader, "created entity EntityTheme", persistenceStoreController.getEntityUuids());

    // bootstrap EntityQuery
    await persistenceStoreController.createEntity(
      entityQueryVersion as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionQuery as EntityDefinition),
    );
    log.info(logHeader, "created entity Query", persistenceStoreController.getEntityUuids());

    // bootstrap EntityQueryVersion
    await persistenceStoreController.createEntity(
      entityQueryVersion as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionQuery as EntityDefinition),
    );
    log.info(logHeader, "created entity Query", persistenceStoreController.getEntityUuids());

    await persistenceStoreController.upsertInstance(
      "data",
      reportConfigurationList as EntityInstance,
    );
    // await persistenceStoreController.upsertInstance('data', reportEndpointList as EntityInstance);
    await persistenceStoreController.upsertInstance(
      "data",
      reportEndpointVersionList as EntityInstance,
    );
    await persistenceStoreController.upsertInstance(
      "data",
      reportEntityDefinitionList as EntityInstance,
    );
    await persistenceStoreController.upsertInstance("data", reportEntityList as EntityInstance);
    await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationList as EntityInstance,
    );
    await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationDeploymentConfigurationList as EntityInstance,
    );
    await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationModelBranchList as EntityInstance,
    );
    await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationVersionList as EntityInstance,
    );
    await persistenceStoreController.upsertInstance("data", reportMenuList as EntityInstance);
    await persistenceStoreController.upsertInstance("data", reportReportList as EntityInstance);
    await persistenceStoreController.upsertInstance("data", reportJzodSchemaList as EntityInstance);
    // await persistenceStoreController.upsertInstance('data', reportQueryList as EntityInstance);
    await persistenceStoreController.upsertInstance("data", reportQueryList as EntityInstance);
    await persistenceStoreController.upsertInstance("data", menuDefaultMiroir as EntityInstance);
    await persistenceStoreController.upsertInstance(
      "data",
      miroirJzodSchemaBootstrap as EntityInstance,
    );

    await persistenceStoreController.upsertInstance("data", selfApplication);
    // log.info(logHeader, 'inserting miroir deployment',deployment);
    // await persistenceStoreController.upsertInstance('data', deployment);
    // log.info(logHeader, 'inserting miroir deployment DONE');
    await persistenceStoreController.upsertInstance("data", selfApplicationModelBranch);
    await persistenceStoreController.upsertInstance("data", selfApplicationVersion);
    // await persistenceStoreController.upsertInstance('data', selfApplicationStoreBasedConfiguration);

    // await persistenceStoreController.upsertInstance('data', applicationEndpoint);
    await persistenceStoreController.upsertInstance("data", applicationEndpointV1);
    // await persistenceStoreController.upsertInstance('data', deploymentEndpoint);
    await persistenceStoreController.upsertInstance("data", deploymentEndpointV1);
    // await persistenceStoreController.upsertInstance('data', instanceEndpoint);
    await persistenceStoreController.upsertInstance("data", instanceEndpointV1);
    // await persistenceStoreController.upsertInstance('data', modelEndpoint);
    await persistenceStoreController.upsertInstance("data", modelEndpointV1);

    // await persistenceStoreController.upsertInstance('data', queryBundleProducer);
    await persistenceStoreController.upsertInstance("data", queryVersionBundleProducerV1);

    await persistenceStoreController.upsertInstance("data", defaultStoredMiroirTheme);
    await persistenceStoreController.upsertInstance("data", darkStoredMiroirTheme);
    await persistenceStoreController.upsertInstance("data", compactStoredMiroirTheme);
    await persistenceStoreController.upsertInstance("data", materialStoredMiroirTheme);
  }

  if (dataStoreType == "app") {
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntity as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionEntity as EntityDefinition),
    ); //entityDefinition for entityEntity has not been inserted!

    log.info(
      logHeader,
      "app initialized entity Entity",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap MetaClass EntityDefinition
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntityDefinition as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionEntityDefinition as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity Definition",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self SelfApplication
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplication as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionSelfApplication as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity SelfApplication",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self ApplicationModelBranch
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplicationModelBranch as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionSelfApplicationModelBranch as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity ApplicationModelBranch",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self ApplicationVersion
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplicationVersion as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionSelfApplicationVersion as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity ApplicationVersion",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self Menu
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityMenu as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionMenu as EntityDefinition),
    );
    log.info(logHeader, "app initialized entity Menu", persistenceStoreController.getEntityUuids());

    // bootstrap Endpoint
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEndpointVersion as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionEndpoint as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity Endpoint",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap QueryVersion
    log.info(
      logHeader,
      "app initialized entity Query",
      persistenceStoreController.getEntityUuids(),
    );
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityQueryVersion as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionQuery as EntityDefinition),
    );

    // bootstrap EntityReport
    log.info(
      logHeader,
      "app initializing entity Report",
      persistenceStoreController.getEntityUuids(),
    );
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityReport as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionReport as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity Report",
      persistenceStoreController.getEntityUuids(),
    );

    log.info(
      logHeader,
      "app initializing entity Runner",
      persistenceStoreController.getEntityUuids(),
    );
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityRunner as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionRunner as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity Runner",
      persistenceStoreController.getEntityUuids(),
    );

    log.info(
      logHeader,
      "app initializing entity Theme",
      persistenceStoreController.getEntityUuids(),
    );
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityTheme as Entity,
      entityDefinitionWithResolvedMLSchema(entityDefinitionTheme as EntityDefinition),
    );
    log.info(
      logHeader,
      "app initialized entity Theme",
      persistenceStoreController.getEntityUuids(),
    );

    // // bootstrap EntityStoreBasedConfiguration
    // await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
    //   entityStoreBasedConfiguration as Entity,
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
    // const defaultMenu: Menu = {
    //   uuid: uuidv4(),
    //   parentName: "Menu",
    //   parentUuid: entityMenu.uuid,
    //   name: "defaultMenu_" + selfApplication.name,
    //   defaultLabel: "Default Menu for " + selfApplication.name,
    //   description: "Default menu for " + selfApplication.name,
    //   definition: {
    //     menuType: "complexMenu",
    //     definition: [
    //       {
    //         title: selfApplication.name + " Menu",
    //         label: selfApplication.name,
    //         items: [
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Application",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "cd24df86-204c-4a72-9ac0-87f2b92f25fe",
    //             icon: "category",
    //             menuItemScope: "model",
    //             instanceUuid: selfApplication.uuid,
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Entities",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    //             icon: "category",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Entity Definitions",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
    //             icon: "category",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Queries",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "32e52150-ac95-4d96-91b7-f231b85fe76e",
    //             icon: "saved_search",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Reports",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
    //             icon: "newspaper",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Menus",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "ecfd8787-09cc-417d-8d2c-173633c9f998",
    //             icon: "list",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Endpoints",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "ace3d5c9-b6a7-43e6-a277-595329e7532a",
    //             icon: "list",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuReportLink",
    //             label: selfApplication.name + " Runners",
    //             section: "model",
    //             selfApplication: selfApplication.uuid,
    //             reportUuid: "3c26c31e-c988-40b2-af47-d7380e35ba80",
    //             icon: "directions_run",
    //             menuItemScope: "model",
    //           },
    //           {
    //             miroirMenuItemType: "miroirMenuItemDivider",
    //             label: selfApplication.name + " Model-Data Divider",
    //             selfApplication: selfApplication.uuid,
    //             menuItemScope: "model",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // };
    // await persistenceStoreController.upsertInstance("model", defaultMenu);
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
