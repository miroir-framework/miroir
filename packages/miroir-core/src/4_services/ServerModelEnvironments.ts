import {
  entityDefinitionTheme,
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityMenu,
  entityMiroirTest,
  entityMlSchema,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationVersion,
  entityTransformerDefinition,
  selfApplicationMiroir,
} from "miroir-app-miroir";

import type { Uuid } from "../0_interfaces/1_core/EntityVersion";
import type {
  ApplicationSection,
  EntityInstance,
  MetaModel,
  SelfApplication,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2Error, Domain2ElementFailed } from "../0_interfaces/2_domain/DomainElement";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { defaultMiroirModelEnvironment, getApplicationSection } from "../1_core/Model";
import { getMiroirFundamentalSchemaForDeployment } from "../2_domain/schemaForDeployment";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ServerModelEnvironments");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// #519: the server runs an application's actions and queries with that application's model
// environment (its model, its deployment schema with the composite TransformerDefinition branches,
// hence their registry), read from the model section of the deployment's store. The server's local
// cache is never loaded, so it cannot give the model. An environment is kept per deployment until a
// REST handler reports a write that can change the model (`forget`).
// ################################################################################################

async function readInstances(
  persistenceStoreController: PersistenceStoreControllerInterface,
  section: ApplicationSection,
  entityUuid: Uuid,
): Promise<EntityInstance[]> {
  const result = await persistenceStoreController.getInstances(section, entityUuid);
  if (result instanceof Action2Error || result.returnedDomainElement instanceof Domain2ElementFailed) {
    // an application may lack the collection of a model Entity (no Theme, no Runner, ...)
    return [];
  }
  return result.returnedDomainElement.instances ?? [];
}

/** The model of `application`, read from the model section of its deployment's store. */
export async function metaModelFromPersistenceStore(
  application: Uuid,
  persistenceStoreController: PersistenceStoreControllerInterface,
): Promise<MetaModel> {
  const read = (entityUuid: Uuid) =>
    readInstances(persistenceStoreController, getApplicationSection(application, entityUuid), entityUuid);
  const [
    entities,
    entityVersions,
    endpoints,
    mlSchemas,
    menus,
    reports,
    storedQueries,
    runners,
    tests,
    themes,
    transformerDefinitions,
    applications,
    applicationVersions,
  ] = await Promise.all([
    readInstances(persistenceStoreController, "model", entityEntity.uuid),
    read(entityEntityVersion.uuid),
    read(entityEndpointVersion.uuid),
    read(entityMlSchema.uuid),
    read(entityMenu.uuid),
    read(entityReport.uuid),
    read(entityQueryVersion.uuid),
    read(entityRunner.uuid),
    read(entityMiroirTest.uuid),
    read(entityDefinitionTheme.entityUuid),
    read(entityTransformerDefinition.uuid),
    read(entitySelfApplication.uuid),
    read(entitySelfApplicationVersion.uuid),
  ]);
  const selfApplications = applications as SelfApplication[];
  const matchedApplication =
    selfApplications.find((a) => a.uuid === application) ?? selfApplications[0];
  return {
    applicationUuid: application,
    applicationName: matchedApplication?.name ?? "",
    applications: selfApplications,
    applicationVersions: applicationVersions as MetaModel["applicationVersions"],
    applicationVersionCrossEntityVersion: [],
    applicationVersionCrossQueryVersion: [],
    applicationVersionCrossReportVersion: [],
    applicationVersionCrossMenuVersion: [],
    applicationVersionCrossEndpointVersion: [],
    applicationVersionCrossRunnerVersion: [],
    applicationVersionCrossThemeVersion: [],
    applicationVersionCrossTransformerDefinitionVersion: [],
    queryVersions: [],
    reportVersions: [],
    menuVersions: [],
    endpointVersions: [],
    runnerVersions: [],
    themeVersions: [],
    transformerDefinitionVersions: [],
    endpoints: endpoints as MetaModel["endpoints"],
    entities: entities as MetaModel["entities"],
    entityVersions: entityVersions as MetaModel["entityVersions"],
    mlSchemas: mlSchemas as MetaModel["mlSchemas"],
    menus: menus as MetaModel["menus"],
    reports: reports as MetaModel["reports"],
    runners: runners as MetaModel["runners"],
    storedQueries: storedQueries as MetaModel["storedQueries"],
    tests: tests as MetaModel["tests"],
    themes: themes as MetaModel["themes"],
    transformerDefinitions: transformerDefinitions as MetaModel["transformerDefinitions"],
  };
}

/** The model environment of an application model: its deployment schema, its endpoints. */
export function modelEnvironmentForApplicationModel(
  deploymentUuid: Uuid,
  model: MetaModel,
): MiroirModelEnvironment {
  return {
    deploymentUuid,
    miroirFundamentalMlSchema: getMiroirFundamentalSchemaForDeployment(deploymentUuid, model),
    miroirMetaModel: defaultMiroirModelEnvironment.miroirMetaModel,
    currentModel: model,
    endpointsByUuid: {
      ...defaultMiroirModelEnvironment.endpointsByUuid,
      ...Object.fromEntries(model.endpoints.map((endpoint) => [endpoint.uuid, endpoint])),
    },
  };
}

// ################################################################################################
export class ServerModelEnvironments {
  // deployment uuid -> application uuid -> environment being built or built
  private environments = new Map<Uuid, Map<Uuid, Promise<MiroirModelEnvironment>>>();

  constructor(private persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface) {}

  /**
   * The environment of `application`. Miroir's is the static one, as Miroir's model is bundled;
   * an application without an open deployment gets it too, as before #519.
   */
  forApplication(
    application: Uuid | undefined,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<MiroirModelEnvironment> {
    if (!application || application === selfApplicationMiroir.uuid) {
      return Promise.resolve(defaultMiroirModelEnvironment);
    }
    const deploymentUuid = applicationDeploymentMap[application];
    const persistenceStoreController = deploymentUuid
      ? this.persistenceStoreControllerManager.getPersistenceStoreController(deploymentUuid)
      : undefined;
    if (!deploymentUuid || !persistenceStoreController) {
      return Promise.resolve(defaultMiroirModelEnvironment);
    }
    const ofDeployment = this.environments.get(deploymentUuid) ?? new Map();
    this.environments.set(deploymentUuid, ofDeployment);
    const known = ofDeployment.get(application);
    if (known) {
      return known;
    }
    const built = metaModelFromPersistenceStore(application, persistenceStoreController)
      .then((model) => modelEnvironmentForApplicationModel(deploymentUuid, model))
      .catch((error) => {
        log.warn("forApplication could not read the model of", application, "deployment", deploymentUuid, error);
        ofDeployment.delete(application);
        return defaultMiroirModelEnvironment;
      });
    ofDeployment.set(application, built);
    return built;
  }

  /** Drop the environments of `deploymentUuid`, or of every deployment; rebuilt when next asked. */
  forget(deploymentUuid?: Uuid): void {
    if (deploymentUuid) {
      this.environments.delete(deploymentUuid);
    } else {
      this.environments.clear();
    }
  }
}

const serverModelEnvironmentsByManager = new WeakMap<
  PersistenceStoreControllerManagerInterface,
  ServerModelEnvironments
>();

/** The environments of the deployments a PersistenceStoreControllerManager serves (one per server). */
export function serverModelEnvironments(
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
): ServerModelEnvironments {
  const known = serverModelEnvironmentsByManager.get(persistenceStoreControllerManager);
  if (known) {
    return known;
  }
  const created = new ServerModelEnvironments(persistenceStoreControllerManager);
  serverModelEnvironmentsByManager.set(persistenceStoreControllerManager, created);
  return created;
}
