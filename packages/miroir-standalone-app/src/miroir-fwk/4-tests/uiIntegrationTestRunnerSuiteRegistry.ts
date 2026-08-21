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
import { resolveRunnerFromMiroirTestSuite, resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite } from "miroir-core";
import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  defaultLibraryAppModel,
  entityAuthor,
  entityBook,
  entityPublisher,
  lendDocumentRunner,
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  returnDocumentRunner,
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
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-miroir";

import {
  appForTestEntitiesAndInstancesPublisherAndCountry,
  appForTestPublisherAndCountryMetaModel,
  appForTestTestbedInitParams,
} from "./uiIntegrationAppForTestPlayfieldSeed.js";
import {
  codeItem1,
  codeItem2,
  codeItem3,
  codeNumberTestMetaModel,
  compositeItem1,
  compositeItem2,
  compositeItem3,
  compositePKTestMetaModel,
  emptyLibraryPlayfieldModel,
  entityCodeNumber,
  entityCompositePK,
  entityNoParentUuid,
  libraryEntitiesAndInstancesPublisherAndCountry,
  libraryTestbedInitParams,
  noParentItem1,
  noParentItem2,
  noParentItem3,
  noParentUuidTestMetaModel,
  publisherAndCountryTestModel,
  publisherOnlyTestMetaModel,
  runnerLibraryDocumentEntitiesAndInstances,
  type TestbedSetupParameters,
} from "./uiIntegrationPlayfieldSeeds.js";

export const RUNNER_CREATE_ENTITY_SUITE_KEY = miroirTest_runner_create_entity.name;
export const RUNNER_DROP_ENTITY_SUITE_KEY = miroirTest_runner_drop_entity.name;
export const RUNNER_FREEZE_APPLICATION_VERSION_SUITE_KEY =
  miroirTest_runner_freeze_application_version.name;

/** Runners keyed by uuid for UI integration runnerTest resolution via leaf `runnerRef`. */
export const UI_INTEGRATION_RUNNER_UUID_INDEX: Record<string, Runner> = {
  ...RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
  [lendDocumentRunner.uuid]: lendDocumentRunner,
  [returnDocumentRunner.uuid]: returnDocumentRunner,
};

export type UiIntegrationRunnerTestSuiteEntry = {
  kind: "runnerTest";
  suiteDefinition: MiroirTestSuite;
  /**
   * Playfield seed for runner suites that reset/seed the runTarget in `beforeEach`.
   * `null` for create/drop-entity suites (`skipRunTargetPlayfieldReset`) that manage
   * their own ephemeral deployment inside the composite action.
   */
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

export function resolveUiIntegrationOrchestratorSessionKind(
  entry: UiIntegrationRunnerSuiteEntry,
): "runner" | "action" {
  return entry.kind === "runnerTest" ? "runner" : "action";
}

// ################################################################################################
export function buildUiIntegrationOrchestratorCreateSessionParams(
  entry: UiIntegrationRunnerSuiteEntry,
  context: IntegrationTestOrchestratorContext,
  pageLabel: string,
  runTarget: TestbedUuids,
  suiteTestParams: Record<string, unknown> | undefined,
  runnerUuidIndex: Record<string, Runner>,
): IntegrationTestSessionFactoryCreateParams {
  if (entry.kind === "runnerTest") {
    const resolvedRunner = resolveRunnerFromMiroirTestSuite(entry.suiteDefinition, runnerUuidIndex);
    return {
      kind: "runner",
      context,
      resolvedRunner,
      sessionSpecificOptions: buildUiIntegrationRunnerSessionSpecificOptions(
        entry,
        pageLabel,
        runTarget,
        suiteTestParams,
        runnerUuidIndex,
      ),
    };
  }

  const sessionSpecificOptions = buildUiIntegrationRunnerSessionSpecificOptions(
    entry,
    pageLabel,
    runTarget,
    suiteTestParams,
    runnerUuidIndex,
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
// ################################################################################################
export function buildUiIntegrationRunnerSessionSpecificOptions(
  entry: UiIntegrationRunnerSuiteEntry,
  pageLabel: string,
  runTarget: TestbedUuids,
  suiteTestParams: Record<string, unknown> | undefined,
  runnerUuidIndex: Record<string, Runner>,
): {
  pageLabel: string;
  runTarget: TestbedUuids;
  suiteTestParams: Record<string, unknown> | undefined;
  runnerUuidIndex: Record<string, Runner>;
  libraryPlayfieldSeed?: TestbedSetupParameters;
  skipRunTargetPlayfieldReset?: boolean;
} {
  switch (entry.kind) {
    case "runnerTest":
      return {
        pageLabel,
        runTarget,
        suiteTestParams,
        runnerUuidIndex,
        ...(entry.libraryPlayfieldSeed !== null
          ? { libraryPlayfieldSeed: entry.libraryPlayfieldSeed }
          : {}),
        ...(resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(entry.suiteDefinition)
          ? { skipRunTargetPlayfieldReset: true }
          : {}),
      };
    case "domainControllerTest":
    case "actionTest":
      return {
        pageLabel,
        runTarget,
        suiteTestParams,
        runnerUuidIndex,
        libraryPlayfieldSeed: entry.libraryPlayfieldSeed,
      };
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
}

// ################################################################################################
export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> = {
  [miroirTest_runner_lend_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_lend_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: runnerLibraryDocumentEntitiesAndInstances,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: defaultLibraryAppModel as MetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_runner_return_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_return_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: runnerLibraryDocumentEntitiesAndInstances,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: defaultLibraryAppModel as MetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_runner_create_entity.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    libraryPlayfieldSeed: null,
  },
  // ###############################################################################
  [RUNNER_DROP_ENTITY_SUITE_KEY]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    libraryPlayfieldSeed: null,
  },
  // ###############################################################################
  [miroirTest_runner_freeze_application_version.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_freeze_application_version as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: appForTestEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: appForTestTestbedInitParams,
      testbedModel: appForTestPublisherAndCountryMetaModel,
    },
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
      testbedModel: publisherAndCountryTestModel,
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
      testbedModel: emptyLibraryPlayfieldModel,
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
      testbedModel: publisherAndCountryTestModel,
    },
  },
  // ###############################################################################
  [miroirTest_evolutionTraceWP1.name]: {
    kind: "actionTest",
    suiteDefinition: miroirTest_evolutionTraceWP1.definition as MiroirTestSuite,
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestModel,
    },
  },
};

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}
