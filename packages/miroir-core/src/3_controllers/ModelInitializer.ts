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
  entityDefinitionMiroirTest,
  entityDefinitionQuery,
  entityDefinitionReport,
  entityDefinitionRunner,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionTheme,
  entityDefinitionApplicationEvolutionTrace,
  entityDefinitionApplicationEvolutionTraceEvent,
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityJzodSchema,
  entityMenu,
  entityMiroirTest,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityTheme,
  entityApplicationEvolutionTrace,
  entityApplicationEvolutionTraceEvent,
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossQueryVersion,
  entityDefinitionApplicationVersionCrossEntityDefinition,
  entityHistoricalQueryVersion,
  entityHistoricalReportVersion,
  entityApplicationVersionCrossReportVersion,
  entityHistoricalMenuVersion,
  entityApplicationVersionCrossMenuVersion,
  entityVersionApplicationVersionCrossQueryVersion,
  entityVersionHistoricalQueryVersion,
  entityVersionApplicationVersionCrossReportVersion,
  entityVersionHistoricalReportVersion,
  entityVersionApplicationVersionCrossMenuVersion,
  entityVersionHistoricalMenuVersion,
  instanceEndpointV1,
  materialStoredMiroirTheme,
  menuDefaultMiroir,
  miroirJzodSchemaBootstrap,
  modelEndpointV1,
  queryVersionBundleProducerV1,
  reportApplicationList,
  reportApplicationModelBranchList,
  reportApplicationVersionList,
  reportApplicationEvolutionTraceList,
  reportApplicationEvolutionTraceHistory,
  reportEndpointVersionList,
  reportEntityDefinitionList,
  reportEntityList,
  reportJzodSchemaList,
  reportMenuList,
  reportQueryList,
  reportReportList,
  entityCommit
} from "miroir-test-app_deployment-miroir";

import {
  Entity,
  EntityInstance,
  SelfApplication
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
} from "../0_interfaces/2_domain/DomainElement.js";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { ACTION_OK } from "../1_core/constants.js";
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
): Promise<Action2ReturnType> {
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
  let result: Action2VoidReturnType;

  if (dataStoreType == "miroir") {
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntity as Entity,
    ); //entityVersion for entityEntity has not been inserted!
    if (result instanceof Action2Error) {
      return result;
    }

    // Entity row for Entity (present model); EntityVersion Entity created via createEntity below.
    result = await persistenceStoreController.upsertInstance("model", entityEntity as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }

    // #222 — createEntity writes EntityVersion into the Entity table and creates
    // instance storage on the paired data section (Miroir EV instances live in data).
    result = await persistenceStoreController.createEntity(
      entityEntityVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity EntityVersion",
      persistenceStoreController.getEntityUuids(),
    );

    // Bootstrap historical EntityVersion instances into Miroir data (#222).
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityDefinitionEntity as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityDefinitionEntityDefinition as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap SelfApplication
    result = await persistenceStoreController.createEntity(
      entitySelfApplication as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity SelfApplication",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap ApplicationModelBranch
    result = await persistenceStoreController.createEntity(
      entitySelfApplicationModelBranch as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationModelBranch",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap ApplicationVersion
    result = await persistenceStoreController.createEntity(
      entitySelfApplicationVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationVersion",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Endpoint version
    result = await persistenceStoreController.createEntity(
      entityEndpointVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Endpoint", persistenceStoreController.getEntityUuids());

    // bootstrap Commit
    result = await persistenceStoreController.createEntity(
      entityCommit as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Commit", persistenceStoreController.getEntityUuids());

    // bootstrap Menu
    result = await persistenceStoreController.createEntity(
      entityMenu as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Menu", persistenceStoreController.getEntityUuids());

    // bootstrap EntityJzodSchema
    result = await persistenceStoreController.createEntity(
      entityJzodSchema as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity MlSchema", persistenceStoreController.getEntityUuids());

    // bootstrap EntityReport
    result = await persistenceStoreController.createEntity(
      entityReport as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityReport", persistenceStoreController.getEntityUuids());

    // bootstrap EntityRunner
    result = await persistenceStoreController.createEntity(
      entityRunner as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityRunner", persistenceStoreController.getEntityUuids());

    // bootstrap EntityMiroirTest
    result = await persistenceStoreController.createEntity(
      entityMiroirTest as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityTest", persistenceStoreController.getEntityUuids());

    // bootstrap EntityTheme
    result = await persistenceStoreController.createEntity(
      entityTheme as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityTheme", persistenceStoreController.getEntityUuids());

    // bootstrap present-model Query entity
    result = await persistenceStoreController.createEntity(
      entityQueryVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Query", persistenceStoreController.getEntityUuids());

    // bootstrap historical QueryVersion (#227)
    result = await persistenceStoreController.createEntity(
      entityHistoricalQueryVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity QueryVersion", persistenceStoreController.getEntityUuids());
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityVersionHistoricalQueryVersion as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap ApplicationEvolutionTrace (WP1)
    result = await persistenceStoreController.createEntity(
      entityApplicationEvolutionTrace as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationEvolutionTrace",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap ApplicationEvolutionTraceEvent (WP1)
    result = await persistenceStoreController.createEntity(
      entityApplicationEvolutionTraceEvent as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationEvolutionTraceEvent",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap ApplicationVersionCrossEntityVersion (#216)
    result = await persistenceStoreController.createEntity(
      entityApplicationVersionCrossEntityVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationVersionCrossEntityVersion",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityDefinitionApplicationVersionCrossEntityDefinition as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap ApplicationVersionCrossQueryVersion (#227)
    result = await persistenceStoreController.createEntity(
      entityApplicationVersionCrossQueryVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationVersionCrossQueryVersion",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityVersionApplicationVersionCrossQueryVersion as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap ApplicationVersionCrossReportVersion (#227)
    result = await persistenceStoreController.createEntity(
      entityApplicationVersionCrossReportVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationVersionCrossReportVersion",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityVersionApplicationVersionCrossReportVersion as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap historical ReportVersion (#227)
    result = await persistenceStoreController.createEntity(
      entityHistoricalReportVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity ReportVersion", persistenceStoreController.getEntityUuids());
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityVersionHistoricalReportVersion as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap ApplicationVersionCrossMenuVersion (#227)
    result = await persistenceStoreController.createEntity(
      entityApplicationVersionCrossMenuVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationVersionCrossMenuVersion",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityVersionApplicationVersionCrossMenuVersion as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap historical MenuVersion (#227)
    result = await persistenceStoreController.createEntity(
      entityHistoricalMenuVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity MenuVersion", persistenceStoreController.getEntityUuids());
    result = await persistenceStoreController.upsertInstance(
      "data",
      entityVersionHistoricalMenuVersion as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // await persistenceStoreController.upsertInstance('data', reportEndpointList as EntityInstance);
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportEndpointVersionList as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportEntityDefinitionList as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", reportEntityList as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationList as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationModelBranchList as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationVersionList as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", reportMenuList as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", reportReportList as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", reportJzodSchemaList as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationEvolutionTraceList as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      reportApplicationEvolutionTraceHistory as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    // await persistenceStoreController.upsertInstance('data', reportQueryList as EntityInstance);
    result = await persistenceStoreController.upsertInstance("data", reportQueryList as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", menuDefaultMiroir as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "data",
      miroirJzodSchemaBootstrap as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    result = await persistenceStoreController.upsertInstance("data", selfApplication);
    if (result instanceof Action2Error) {
      return result;
    }
    // log.info(logHeader, 'inserting miroir deployment',deployment);
    // await persistenceStoreController.upsertInstance('data', deployment);
    // log.info(logHeader, 'inserting miroir deployment DONE');
    result = await persistenceStoreController.upsertInstance("data", selfApplicationModelBranch);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", selfApplicationVersion);
    if (result instanceof Action2Error) {
      return result;
    }
    // await persistenceStoreController.upsertInstance('data', selfApplicationStoreBasedConfiguration);

    // await persistenceStoreController.upsertInstance('data', applicationEndpoint);
    result = await persistenceStoreController.upsertInstance("data", applicationEndpointV1);
    if (result instanceof Action2Error) {
      return result;
    }
    // await persistenceStoreController.upsertInstance('data', deploymentEndpoint);
    result = await persistenceStoreController.upsertInstance("data", deploymentEndpointV1);
    if (result instanceof Action2Error) {
      return result;
    }
    // await persistenceStoreController.upsertInstance('data', instanceEndpoint);
    result = await persistenceStoreController.upsertInstance("data", instanceEndpointV1);
    if (result instanceof Action2Error) {
      return result;
    }
    // await persistenceStoreController.upsertInstance('data', modelEndpoint);
    result = await persistenceStoreController.upsertInstance("data", modelEndpointV1);
    if (result instanceof Action2Error) {
      return result;
    }

    // await persistenceStoreController.upsertInstance('data', queryBundleProducer);
    result = await persistenceStoreController.upsertInstance("data", queryVersionBundleProducerV1);
    if (result instanceof Action2Error) {
      return result;
    }

    result = await persistenceStoreController.upsertInstance("data", defaultStoredMiroirTheme);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", darkStoredMiroirTheme);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", compactStoredMiroirTheme);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("data", materialStoredMiroirTheme);
    if (result instanceof Action2Error) {
      return result;
    }
  }

  if (dataStoreType == "app") {
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntity as Entity,
    ); //entityVersion for entityEntity has not been inserted!
    if (result instanceof Action2Error) {
      return result;
    }

    log.info(
      logHeader,
      "app initialized entity Entity",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap MetaClass EntityVersion
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntityVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity Definition",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self SelfApplication
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplication as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity SelfApplication",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self ApplicationModelBranch
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplicationModelBranch as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity ApplicationModelBranch",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self ApplicationVersion
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entitySelfApplicationVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity ApplicationVersion",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap Self Menu
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityMenu as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "app initialized entity Menu", persistenceStoreController.getEntityUuids());

    // bootstrap Endpoint
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEndpointVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity Endpoint",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap MlSchema (required by loadConfigurationFromPersistenceStore metaModelEntities)
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityJzodSchema as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity MlSchema",
      persistenceStoreController.getEntityUuids(),
    );

    // bootstrap QueryVersion
    log.info(
      logHeader,
      "app initialized entity Query",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityQueryVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap EntityReport
    log.info(
      logHeader,
      "app initializing entity Report",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityReport as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
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
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityRunner as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity Runner",
      persistenceStoreController.getEntityUuids(),
    );

    log.info(
      logHeader,
      "app initializing entity MiroirTest",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityMiroirTest as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity MiroirTest",
      persistenceStoreController.getEntityUuids(),
    );

    log.info(
      logHeader,
      "app initializing entity Theme",
      persistenceStoreController.getEntityUuids(),
    );
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityTheme as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "app initialized entity Theme",
      persistenceStoreController.getEntityUuids(),
    );

    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityApplicationEvolutionTrace as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityApplicationEvolutionTraceEvent as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    // #216 — Cross Entity storage (metaModelEntities refresh / freeze ensure-create)
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityApplicationVersionCrossEntityVersion as Entity,
    );
    if (result instanceof Action2Error) {
      return result;
    }

    result = await persistenceStoreController.upsertInstance("model", selfApplication);
    if (result instanceof Action2Error) {
      return result;
    }
    // // log.info(logHeader, 'inserting app deployment',deployment);
    // await persistenceStoreController.upsertInstance("model", deployment);
    // // log.info(logHeader, 'inserting app deployment DONE');
    result = await persistenceStoreController.upsertInstance("model", selfApplicationModelBranch);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance("model", selfApplicationVersion);
    if (result instanceof Action2Error) {
      return result;
    }
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
  return ACTION_OK;
}
