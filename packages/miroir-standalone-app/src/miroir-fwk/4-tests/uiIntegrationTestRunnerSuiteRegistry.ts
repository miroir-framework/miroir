import type {
  ActionIntegrationSessionOptions,
  Entity,
  EntityInstance,
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactoryCreateParams,
  MetaModel,
  MiroirTestDefinition,
  MiroirTestSuite,
  Runner,
  TestbedUuids,
} from "miroir-core";
import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  entityAuthor,
  entityBook,
  entityPublisher,
  lendDocument,
  returnDocument,
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
  defaultLibraryAppModel,
} from "miroir-test-app_deployment-library";
import {
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_evolutionTraceWP1,
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  miroirTest_runner_freeze_application_version,
  // miroirTest_runner_freeze_application_version,
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
  runnerCreateEntity,
  runnerDropEntity,
  runnerFreezeApplicationVersion,
} from "miroir-test-app_deployment-miroir";

import {
  codeItem1,
  codeItem2,
  codeItem3,
  codeNumberTestMetaModel,
  compositeItem1,
  compositeItem2,
  compositeItem3,
  compositePKTestMetaModel,
  emptyLibraryPlayfieldMetaModel,
  entityCodeNumber,
  entityCompositePK,
  entityNoParentUuid,
  libraryEntitiesAndInstancesPublisherAndCountry,
  libraryTestbedInitParams,
  noParentItem1,
  noParentItem2,
  noParentItem3,
  noParentUuidTestMetaModel,
  publisherAndCountryTestMetaModel,
  publisherOnlyTestMetaModel,
  type TestbedSetupParameters,
} from "./uiIntegrationPlayfieldSeeds.js";
import { appForTestFreezePlayfieldSeed } from "./uiIntegrationAppForTestPlayfieldSeed.js";

export const RUNNER_CREATE_ENTITY_SUITE_KEY = miroirTest_runner_create_entity.name;
export const RUNNER_DROP_ENTITY_SUITE_KEY = miroirTest_runner_drop_entity.name;
export const RUNNER_FREEZE_APPLICATION_VERSION_SUITE_KEY =
  miroirTest_runner_freeze_application_version.name;

export type UiIntegrationRunnerTestSuiteEntry = {
  kind: "runnerTest";
  suiteDefinition: MiroirTestSuite;
  resolvedRunner: Runner;
  skipRunTargetPlayfieldReset: boolean;
  /** Ephemeral runTarget applicationName when suite omits `runTarget`. */
  defaultApplicationName: string;
  /** Playfield seed for runner suites that need a custom testbed (e.g. freeze); `null` otherwise. */
  libraryPlayfieldSeed: TestbedSetupParameters | null;
};

export type UiIntegrationDomainControllerTestSuiteEntry = {
  kind: "domainControllerTest";
  suiteDefinition: MiroirTestSuite;
  libraryPlayfieldSeed: TestbedSetupParameters;
};

export type UiIntegrationActionTestSuiteEntry = {
  kind: "actionTest";
  suiteDefinition: MiroirTestSuite;
  libraryPlayfieldSeed: TestbedSetupParameters;
};

export type UiIntegrationRunnerSuiteEntry =
  | UiIntegrationRunnerTestSuiteEntry
  | UiIntegrationDomainControllerTestSuiteEntry
  | UiIntegrationActionTestSuiteEntry;

export function isUiIntegrationRunnerTestSuiteEntry(
  entry: UiIntegrationRunnerSuiteEntry,
): entry is UiIntegrationRunnerTestSuiteEntry {
  return entry.kind === "runnerTest";
}

export function isUiIntegrationDomainControllerTestSuiteEntry(
  entry: UiIntegrationRunnerSuiteEntry,
): entry is UiIntegrationDomainControllerTestSuiteEntry {
  return entry.kind === "domainControllerTest";
}

export function isUiIntegrationActionTestSuiteEntry(
  entry: UiIntegrationRunnerSuiteEntry,
): entry is UiIntegrationActionTestSuiteEntry {
  return entry.kind === "actionTest";
}

export function resolveUiIntegrationDefaultApplicationName(
  entry: UiIntegrationRunnerSuiteEntry,
): string | undefined {
  return entry.kind === "runnerTest" ? entry.defaultApplicationName : undefined;
}

export function resolveUiIntegrationRunnerFromEntry(
  entry: UiIntegrationRunnerSuiteEntry,
): Runner | undefined {
  return entry.kind === "runnerTest" ? entry.resolvedRunner : undefined;
}

export function resolveUiIntegrationOrchestratorSessionKind(
  entry: UiIntegrationRunnerSuiteEntry,
): "runner" | "action" {
  return entry.kind === "runnerTest" ? "runner" : "action";
}

export function buildUiIntegrationOrchestratorCreateSessionParams(
  entry: UiIntegrationRunnerSuiteEntry,
  context: IntegrationTestOrchestratorContext,
  pageLabel: string,
  runTarget: TestbedUuids,
  suiteTestParams: Record<string, unknown> | undefined,
): IntegrationTestSessionFactoryCreateParams {
  if (entry.kind === "runnerTest") {
    return {
      kind: "runner",
      context,
      resolvedRunner: entry.resolvedRunner,
      sessionSpecificOptions: buildUiIntegrationRunnerSessionSpecificOptions(
        entry,
        pageLabel,
        runTarget,
        suiteTestParams,
      ),
    };
  }

  const sessionSpecificOptions = buildUiIntegrationRunnerSessionSpecificOptions(
    entry,
    pageLabel,
    runTarget,
    suiteTestParams,
  );
  if (sessionSpecificOptions.libraryPlayfieldSeed === undefined) {
    throw new Error(
      `action session requires libraryPlayfieldSeed (suite entry kind: ${entry.kind})`,
    );
  }

  return {
    kind: "action",
    context,
    sessionSpecificOptions: sessionSpecificOptions as ActionIntegrationSessionOptions,
  };
}

export function buildUiIntegrationRunnerSessionSpecificOptions(
  entry: UiIntegrationRunnerSuiteEntry,
  pageLabel: string,
  runTarget: TestbedUuids,
  suiteTestParams: Record<string, unknown> | undefined,
): {
  pageLabel: string;
  runTarget: TestbedUuids;
  suiteTestParams: Record<string, unknown> | undefined;
  libraryPlayfieldSeed?: TestbedSetupParameters;
  skipRunTargetPlayfieldReset?: boolean;
} {
  switch (entry.kind) {
    case "runnerTest":
      return {
        pageLabel,
        runTarget,
        suiteTestParams,
        ...(entry.libraryPlayfieldSeed !== null
          ? { libraryPlayfieldSeed: entry.libraryPlayfieldSeed }
          : {}),
        ...(entry.skipRunTargetPlayfieldReset ? { skipRunTargetPlayfieldReset: true } : {}),
      };
    case "domainControllerTest":
    case "actionTest":
      return {
        pageLabel,
        runTarget,
        suiteTestParams,
        libraryPlayfieldSeed: entry.libraryPlayfieldSeed,
      };
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
}

export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> = {
  [miroirTest_runner_lend_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_lend_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    resolvedRunner: lendDocument as Runner,
    skipRunTargetPlayfieldReset: false,
    defaultApplicationName: "Library",
    libraryPlayfieldSeed: null,
  },
  // ###############################################################################
  [miroirTest_runner_return_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_return_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    resolvedRunner: returnDocument as Runner,
    skipRunTargetPlayfieldReset: false,
    defaultApplicationName: "Library",
    libraryPlayfieldSeed: null,
  },
  // ###############################################################################
  [miroirTest_runner_create_entity.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[runnerCreateEntity.uuid],
    skipRunTargetPlayfieldReset: true,
    defaultApplicationName: "testApplication_CreateEntity",
    libraryPlayfieldSeed: null,
  },
  // ###############################################################################
  [RUNNER_DROP_ENTITY_SUITE_KEY]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[runnerDropEntity.uuid],
    skipRunTargetPlayfieldReset: true,
    defaultApplicationName: "testApplication_DropEntity",
    libraryPlayfieldSeed: null,
  },
  // ###############################################################################
  [miroirTest_runner_freeze_application_version.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_freeze_application_version as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[runnerFreezeApplicationVersion.uuid],
    skipRunTargetPlayfieldReset: false,
    libraryPlayfieldSeed: appForTestFreezePlayfieldSeed,
    defaultApplicationName: "appForTest",
  },
  // ###############################################################################
  [miroirTest_domain_controller_data_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_data_crud.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [
        {
          entity: entityAuthor as Entity,
          instances: [
            author1 as EntityInstance,
            author2 as EntityInstance,
            author3 as EntityInstance,
          ],
        },
        {
          entity: entityBook as Entity,
          instances: [
            book1 as EntityInstance,
            book2 as EntityInstance,
            book4 as EntityInstance,
            book5 as EntityInstance,
            book6 as EntityInstance,
          ],
        },
        {
          entity: entityPublisher as Entity,
          instances: [
            publisher1 as EntityInstance,
            publisher2 as EntityInstance,
            publisher3 as EntityInstance,
          ],
        },
      ],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: defaultLibraryAppModel as MetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_model_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_model_crud.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_composite_pk_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_composite_pk_crud.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [
        {
          entity: entityCompositePK,
          instances: [compositeItem1, compositeItem2, compositeItem3],
        },
      ],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: compositePKTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_non_uuid_pk_model_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_model_crud.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [
        {
          entity: entityPublisher as Entity,
          instances: [
            publisher1 as EntityInstance,
            publisher2 as EntityInstance,
            publisher3 as EntityInstance,
          ],
        },
      ],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherOnlyTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_non_uuid_pk_data_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_data_crud.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [
        {
          entity: entityCodeNumber,
          instances: [codeItem1, codeItem2, codeItem3],
        },
      ],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: codeNumberTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_no_parent_uuid_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_no_parent_uuid_crud.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [
        {
          entity: entityPublisher as Entity,
          instances: [
            publisher1 as EntityInstance,
            publisher2 as EntityInstance,
            publisher3 as EntityInstance,
          ],
        },
        {
          entity: entityNoParentUuid,
          instances: [noParentItem1, noParentItem2, noParentItem3],
        },
      ],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: noParentUuidTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_model_undo_redo.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_model_undo_redo.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: emptyLibraryPlayfieldMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_application_version_freeze.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_application_version_freeze.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_evolutionTraceWP1.name]: {
    kind: "actionTest",
    suiteDefinition: miroirTest_evolutionTraceWP1.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    },
  },
};

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}
