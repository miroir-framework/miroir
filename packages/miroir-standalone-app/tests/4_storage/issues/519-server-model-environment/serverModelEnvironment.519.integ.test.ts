/**
 * #519 — The server runs a query with the model environment of its application.
 *
 * A query sent to the server (`queryExecutionStrategy: "storage"`, emulated server) uses a
 * composite TransformerDefinition of the Library in a runtime transformer. The server reads the
 * Library's model from its store, so the composite runs in memory and translates to SQL; saving
 * the composite through the server is enough for the next query to use it.
 *
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- serverModelEnvironment.519 --profile emulatedServer-filesystem
 * MIROIR_POSTGRES_PASSWORD=... \
 *   npm run testByFile -w miroir-standalone-app -- serverModelEnvironment.519 --profile emulatedServer-sql
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  type Action2ReturnType,
  type ApplicationDeploymentMap,
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type EndpointDefinition,
  type LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
  type StoreUnitConfiguration,
  type TransformerDefinition,
} from "miroir-core";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";
import { defaultMiroirMetaModel, entityTransformerDefinition } from "miroir-app-miroir";
import {
  deployment_Library_DO_NO_USE,
  endpointDocument,
  entityBook,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-example-library";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { selfApplicationDeploymentConfigurationsTO_REMOVE } from "../../../../src/miroir-fwk/4-tests/tests-utils.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { AppStackIntegrationTestSession } from "../../../helpers/IntegrationTestSession.js";
import {
  libraryEntitiesAndInstances,
  libraryTestbedInitParams,
} from "../../../helpers/libraryPlayfieldSeeds.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig, logConfig } = await loadTestConfigFiles(process.env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
const loggerOptions: LoggerOptions = logConfig;
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};
const libraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

// ################################################################################################
const countBooksBody = {
  transformerType: "aggregate",
  interpolation: "runtime",
  applyTo: {
    transformerType: "getFromContext",
    interpolation: "runtime",
    referenceName: "books",
  },
};

const countBooks: TransformerDefinition = {
  uuid: "5f19c2a4-8d3e-4b7a-9c61-2e4d5b6a7c80",
  parentName: entityTransformerDefinition.name,
  parentUuid: entityTransformerDefinition.uuid,
  name: "countBooks",
  defaultLabel: "countBooks",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: { type: "literal", definition: "countBooks" },
      transformerDefinition: { type: "object", definition: {} },
    },
    transformerResultSchema: { returns: "mlSchema", definition: { type: "any" } },
  },
  transformerImplementation: {
    transformerImplementationType: "transformer",
    definition: countBooksBody,
  },
} as any;

/** Runs on the server: the client's DomainController sends a "storage" query through REST. */
function runBookCountOnServer(runtimeTransformer: any): Promise<Action2ReturnType> {
  return domainController.handleAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: "0faae143-0d7b-4a8a-a950-4fc3df943bde",
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          application: selfApplicationLibrary.uuid,
          runAsSql: true,
          extractors: {
            books: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              applicationSection: "data",
              parentName: entityBook.name,
              parentUuid: entityBook.uuid,
            },
          },
          runtimeTransformers: { bookCount: runtimeTransformer },
        },
      },
    } as any,
    applicationDeploymentMap,
    libraryModelEnvironment,
  );
}

let domainController: DomainControllerInterface;

beforeAll(async () => {
  if (!miroirConfig.client.emulateServer) {
    throw new Error("#519 runs through the emulated server: use an emulatedServer-* profile.");
  }
  const storageConfiguration = (deploymentUuid: string): StoreUnitConfiguration =>
    miroirConfig.client.deploymentStorageConfig[deploymentUuid];
  const session = new AppStackIntegrationTestSession(miroirConfig, {
    applicationDeploymentMap,
    adminDeployment: { ...deployment_Admin, configuration: storageConfiguration(deployment_Admin.uuid) },
    libraryDeploymentStorageConfiguration: storageConfiguration(deployment_Library_DO_NO_USE.uuid),
  });
  domainController = (await session.initSession()).domainController;
  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);
  await resetIntegTestbed({
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
    librarySelfApplicationUuid: selfApplicationLibrary.uuid,
    deploymentsToReset: selfApplicationDeploymentConfigurationsTO_REMOVE,
    testbedEntitiesAndInstances: libraryEntitiesAndInstances,
    testbedInitApplicationParameters: libraryTestbedInitParams,
    testbedModel: libraryModelEnvironment.currentModel as any,
  });
});

// ################################################################################################
// the cases run in order: the first builds the server's environment of the Library, the second
// changes the Library's model through the server, the third sees the change
describe("#519 the server runs queries with the application's model environment", () => {
  it("refuses a composite the Library does not define", async () => {
    const result = await runBookCountOnServer({ transformerType: "countBooks", interpolation: "runtime" });

    expect(result instanceof Action2Error || result.status === "error", JSON.stringify(result)).toBe(true);
  });

  it("saves the composite in the Library's model through the server", async () => {
    const result = await domainController.handleAction(
      {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: selfApplicationLibrary.uuid,
          applicationSection: "model",
          parentUuid: entityTransformerDefinition.uuid,
          objects: [countBooks],
        },
      } as any,
      applicationDeploymentMap,
      libraryModelEnvironment,
    );

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
  });

  it("runs a runtime transformer using the composite, with the result of its body", async () => {
    const withComposite = await runBookCountOnServer({ transformerType: "countBooks", interpolation: "runtime" });
    const inlined = await runBookCountOnServer(countBooksBody);

    expect(inlined instanceof Action2Error, JSON.stringify(inlined)).toBe(false);
    expect(withComposite instanceof Action2Error, JSON.stringify(withComposite)).toBe(false);
    expect((withComposite as any).returnedDomainElement.bookCount).toEqual(
      (inlined as any).returnedDomainElement.bookCount,
    );
    expect((withComposite as any).returnedDomainElement.bookCount).toEqual([{ aggregate: 6 }]);
  });
});
