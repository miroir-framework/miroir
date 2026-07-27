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
  entityEntityDefinition,
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
  reportReportList
} from "miroir-test-app_deployment-miroir";

import {
  entityDefinitionWithResolvedMLSchema
} from "../0_interfaces/1_core/EntityVersion";
import {
  alignEntityDefinitionToPresentEntity,
  projectEntityPresentModelDefinition,
} from "../1_core/entityPresentModel.js";
import {
  Entity,
  EntityVersion,
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


// ################################################################################################
/** Entity-authoritative EntityVersion for bootstrap storage-space / MetaModel seeding. */
function bootstrapEntityDefinitionAligned(
  entity: Entity,
  entityVersion: EntityVersion,
): EntityVersion {
  return entityDefinitionWithResolvedMLSchema(
    alignEntityDefinitionToPresentEntity(entity, entityVersion),
  );
}

/**
 * #220 — complete Entity present model for Entity-only createEntity.
 * Copy present-model from the bootstrap-aligned+resolved EntityVersion onto Entity.
 * Do not use resolveCurrentEntityModel here: resolved mlSchema (extend flattened)
 * would look inconsistent vs Entity assets that still carry extend-form mlSchema.
 */
function bootstrapCompleteEntity(
  entity: Entity,
  entityVersion: EntityVersion,
): Entity {
  const alignedResolved = bootstrapEntityDefinitionAligned(entity, entityVersion);
  return {
    ...entity,
    ...projectEntityPresentModelDefinition(alignedResolved),
  };
}

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
      bootstrapEntityDefinitionAligned(
        entityEntity as Entity,
        entityDefinitionEntity as EntityVersion,
      ),
    ); //entityVersion for entityEntity has not been inserted!
    if (result instanceof Action2Error) {
      return result;
    }

    // bootstrap MetaClass EntityVersion
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntityDefinition as Entity,
      bootstrapEntityDefinitionAligned(
        entityEntityDefinition as Entity,
        entityDefinitionEntityDefinition as EntityVersion,
      ),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity EntityVersion",
      persistenceStoreController.getEntityUuids(),
    );

    // // because entityVersion for entityEntity has not been inserted during datastore.createEntity(entityEntity as Entity,entityDefinitionEntity as EntityVersion);!
    result = await persistenceStoreController.upsertInstance("model", entityEntity as EntityInstance);
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "model",
      entityEntityDefinition as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "model",
      entityDefinitionEntity as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.upsertInstance(
      "model",
      entityDefinitionEntityDefinition as EntityInstance,
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity entity", persistenceStoreController.getEntityUuids());

    // bootstrap SelfApplication
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entitySelfApplication as Entity, entityDefinitionSelfApplication as EntityVersion),
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
      bootstrapCompleteEntity(entitySelfApplicationModelBranch as Entity, entityDefinitionSelfApplicationModelBranch as EntityVersion),
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
      bootstrapCompleteEntity(entitySelfApplicationVersion as Entity, entityDefinitionSelfApplicationVersion as EntityVersion),
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
      bootstrapCompleteEntity(entityEndpointVersion as Entity, entityDefinitionEndpoint as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Endpoint", persistenceStoreController.getEntityUuids());

    // bootstrap Menu
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityMenu as Entity, entityDefinitionMenu as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Menu", persistenceStoreController.getEntityUuids());

    // bootstrap EntityJzodSchema
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityJzodSchema as Entity, entityDefinitionJzodSchema as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity MlSchema", persistenceStoreController.getEntityUuids());

    // bootstrap EntityReport
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityReport as Entity, entityDefinitionReport as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityReport", persistenceStoreController.getEntityUuids());

    // bootstrap EntityRunner
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityRunner as Entity, entityDefinitionRunner as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityRunner", persistenceStoreController.getEntityUuids());

    // bootstrap EntityMiroirTest
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityMiroirTest as Entity, entityDefinitionMiroirTest as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityTest", persistenceStoreController.getEntityUuids());

    // bootstrap EntityTheme
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityTheme as Entity, entityDefinitionTheme as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity EntityTheme", persistenceStoreController.getEntityUuids());

    // bootstrap EntityQuery
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityQueryVersion as Entity, entityDefinitionQuery as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Query", persistenceStoreController.getEntityUuids());

    // bootstrap EntityQueryVersion
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityQueryVersion as Entity, entityDefinitionQuery as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "created entity Query", persistenceStoreController.getEntityUuids());

    // bootstrap ApplicationEvolutionTrace (WP1)
    result = await persistenceStoreController.createEntity(
      bootstrapCompleteEntity(entityApplicationEvolutionTrace as Entity, entityDefinitionApplicationEvolutionTrace as EntityVersion),
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
      bootstrapCompleteEntity(entityApplicationEvolutionTraceEvent as Entity, entityDefinitionApplicationEvolutionTraceEvent as EntityVersion),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(
      logHeader,
      "created entity ApplicationEvolutionTraceEvent",
      persistenceStoreController.getEntityUuids(),
    );

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
      bootstrapEntityDefinitionAligned(
        entityEntity as Entity,
        entityDefinitionEntity as EntityVersion,
      ),
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
      entityEntityDefinition as Entity,
      bootstrapEntityDefinitionAligned(
        entityEntityDefinition as Entity,
        entityDefinitionEntityDefinition as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entitySelfApplication as Entity,
        entityDefinitionSelfApplication as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entitySelfApplicationModelBranch as Entity,
        entityDefinitionSelfApplicationModelBranch as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entitySelfApplicationVersion as Entity,
        entityDefinitionSelfApplicationVersion as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityMenu as Entity,
        entityDefinitionMenu as EntityVersion,
      ),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    log.info(logHeader, "app initialized entity Menu", persistenceStoreController.getEntityUuids());

    // bootstrap Endpoint
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEndpointVersion as Entity,
      bootstrapEntityDefinitionAligned(
        entityEndpointVersion as Entity,
        entityDefinitionEndpoint as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityJzodSchema as Entity,
        entityDefinitionJzodSchema as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityQueryVersion as Entity,
        entityDefinitionQuery as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityReport as Entity,
        entityDefinitionReport as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityRunner as Entity,
        entityDefinitionRunner as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityMiroirTest as Entity,
        entityDefinitionMiroirTest as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityTheme as Entity,
        entityDefinitionTheme as EntityVersion,
      ),
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
      bootstrapEntityDefinitionAligned(
        entityApplicationEvolutionTrace as Entity,
        entityDefinitionApplicationEvolutionTrace as EntityVersion,
      ),
    );
    if (result instanceof Action2Error) {
      return result;
    }
    result = await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityApplicationEvolutionTraceEvent as Entity,
      bootstrapEntityDefinitionAligned(
        entityApplicationEvolutionTraceEvent as Entity,
        entityDefinitionApplicationEvolutionTraceEvent as EntityVersion,
      ),
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
