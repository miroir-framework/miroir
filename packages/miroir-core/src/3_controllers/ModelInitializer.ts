import {
  appModelInitializeCreateEntityOrder,
  entityEntity,
  entityEntityVersion,
  miroirModelInitializeCreateEntityOrder,
  miroirModelInitializeDataInstances,
  miroirModelInitializeEntityVersionsAfterEntityEntityVersion,
  miroirModelInitializeEntityVersionsByEntityUuid,
} from "miroir-app-miroir";

import {
  ApplicationSection,
  Entity,
  EntityInstance,
  EntityVersion,
  SelfApplication,
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
import { devDataEntityUuids } from "../1_core/Model.js";
import { resolveVersioningMode } from "../1_core/versioning/versioningMode.js";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelInitializer");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
).then((logger: LoggerInterface) => {
  log = logger;
});

function abortOnError(result: Action2VoidReturnType): Action2Error | null {
  return result instanceof Action2Error ? result : null;
}

async function upsertInstances(
  persistenceStoreController: PersistenceStoreControllerInterface,
  section: ApplicationSection,
  instances: readonly EntityInstance[],
): Promise<Action2Error | null> {
  for (const instance of instances) {
    const error = abortOnError(
      await persistenceStoreController.upsertInstance(section, instance),
    );
    if (error) {
      return error;
    }
  }
  return null;
}

async function createEntityAndBootstrapVersions(
  persistenceStoreController: PersistenceStoreControllerInterface,
  entity: Entity,
  entityVersionInstances: readonly EntityVersion[],
  logHeader: string,
): Promise<Action2Error | null> {
  // #647: a devData Entity's instances live in the devData section, whose storage is created on first
  // write: Miroir's model gets the Entity row, its data section no storage.
  if (devDataEntityUuids.has(entity.uuid!)) {
    return abortOnError(await persistenceStoreController.upsertInstance("model", entity as EntityInstance));
  }
  const createError = abortOnError(await persistenceStoreController.createEntity(entity));
  if (createError) {
    return createError;
  }
  log.info(logHeader, "created entity", entity.name, persistenceStoreController.getEntityUuids());

  return upsertInstances(
    persistenceStoreController,
    "data",
    entityVersionInstances as unknown as EntityInstance[],
  );
}

async function initializeMiroirModel(
  persistenceStoreController: PersistenceStoreControllerInterface,
  logHeader: string,
  selfApplication: SelfApplication,
  selfApplicationModelBranch: EntityInstance,
  selfApplicationVersion: EntityInstance,
): Promise<Action2Error | null> {
  let error = abortOnError(
    await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(
      entityEntity as Entity,
    ),
  );
  if (error) {
    return error;
  }

  error = abortOnError(
    await persistenceStoreController.upsertInstance("model", entityEntity as EntityInstance),
  );
  if (error) {
    return error;
  }

  const [firstEntity, ...remainingEntities] = miroirModelInitializeCreateEntityOrder;
  if (firstEntity.uuid !== entityEntityVersion.uuid) {
    throw new Error("miroirModelInitializeCreateEntityOrder must start with EntityVersion");
  }

  error = await createEntityAndBootstrapVersions(
    persistenceStoreController,
    firstEntity,
    miroirModelInitializeEntityVersionsAfterEntityEntityVersion,
    logHeader,
  );
  if (error) {
    return error;
  }

  for (const entity of remainingEntities) {
    const entityVersions =
      miroirModelInitializeEntityVersionsByEntityUuid.get(entity.uuid!) ?? [];
    error = await createEntityAndBootstrapVersions(
      persistenceStoreController,
      entity,
      entityVersions,
      logHeader,
    );
    if (error) {
      return error;
    }
  }

  error = await upsertInstances(
    persistenceStoreController,
    "data",
    miroirModelInitializeDataInstances,
  );
  if (error) {
    return error;
  }

  return upsertInstances(persistenceStoreController, "data", [
    selfApplication,
    selfApplicationModelBranch,
    selfApplicationVersion,
  ]);
}

async function initializeAppModel(
  persistenceStoreController: PersistenceStoreControllerInterface,
  logHeader: string,
  selfApplication: SelfApplication,
  selfApplicationModelBranch: EntityInstance,
  selfApplicationVersion: EntityInstance,
): Promise<Action2Error | null> {
  for (const entity of appModelInitializeCreateEntityOrder) {
    const error = abortOnError(
      await persistenceStoreController.createModelStorageSpaceForInstancesOfEntity(entity),
    );
    if (error) {
      return error;
    }
    log.info(
      logHeader,
      "app initialized entity",
      entity.name,
      persistenceStoreController.getEntityUuids(),
    );
  }

  const modelError = await upsertInstances(persistenceStoreController, "model", [
    selfApplication,
    selfApplicationModelBranch,
  ]);
  if (modelError) {
    return modelError;
  }
  // #577: a versioned-internal app keeps its version history in modelVersion, where freeze
  // reads the version chain; an unversioned app has no modelVersion store, so its init-only
  // version stays in model.
  return upsertInstances(
    persistenceStoreController,
    resolveVersioningMode(selfApplication) === "versioned-internal" ? "modelVersion" : "model",
    [selfApplicationVersion],
  );
}

// ################################################################################################
export async function modelInitialize(
  persistenceStoreController: PersistenceStoreControllerInterface,
  dataStoreType: DataStoreApplicationType,
  selfApplication: SelfApplication,
  selfApplicationModelBranch: EntityInstance,
  selfApplicationVersion: EntityInstance,
): Promise<Action2ReturnType> {
  log.info("modelInitialize selfApplication", selfApplication, "dataStoreType", dataStoreType);
  const logHeader = "modelInitialize " + selfApplication?.name;
  log.info(
    "################################### modelInitialize",
    selfApplication.name,
    "dataStoreType",
    dataStoreType,
  );

  if (dataStoreType === "miroir") {
    const error = await initializeMiroirModel(
      persistenceStoreController,
      logHeader,
      selfApplication,
      selfApplicationModelBranch,
      selfApplicationVersion,
    );
    if (error) {
      return error;
    }
  }

  if (dataStoreType === "app") {
    const error = await initializeAppModel(
      persistenceStoreController,
      logHeader,
      selfApplication,
      selfApplicationModelBranch,
      selfApplicationVersion,
    );
    if (error) {
      return error;
    }
  }

  return ACTION_OK;
}
