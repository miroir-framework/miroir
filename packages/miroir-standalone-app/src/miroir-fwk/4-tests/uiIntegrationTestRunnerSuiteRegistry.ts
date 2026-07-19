import type { MiroirTestDefinition, MiroirTestSuite, Runner } from "miroir-core";
import {
  miroirTest_runner_library,
  RUNNER_LIBRARY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-library";
import {
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-miroir";

import {
  DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_MODEL_UNDO_REDO_SUITE_KEY,
  DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY,
  DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY,
  libraryPlayfieldSeedForActionSuite,
  type LibraryPlayfieldSeed,
} from "../../../tests/helpers/libraryPlayfieldSeeds.js";

export const RUNNER_CREATE_ENTITY_SUITE_KEY = "runner_create_entity";
export const RUNNER_DROP_ENTITY_SUITE_KEY = "runner_drop_entity";

export type UiIntegrationRunnerSuiteEntry = {
  suiteDefinition: MiroirTestSuite;
  /** Empty for actionTest suites (no Runner entities). */
  runnerRegistry: Record<string, Runner>;
  /** Required for DomainController action suites; omitted for runner_library. */
  libraryPlayfieldSeed?: LibraryPlayfieldSeed;
  /**
   * Create/drop entity suites: ephemeral empty playfield — do not remount library
   * seed onto the runTarget (same as CLI `skipRunTargetPlayfieldReset`).
   */
  skipRunTargetPlayfieldReset?: boolean;
  /** Ephemeral runTarget applicationName when suite omits `runTarget`. */
  defaultApplicationName?: string;
};

function actionSuiteEntry(
  suiteKey: string,
  instance: MiroirTestDefinition,
): UiIntegrationRunnerSuiteEntry {
  const seed = libraryPlayfieldSeedForActionSuite(suiteKey);
  if (!seed) {
    throw new Error(
      `UI integration runner registry: missing libraryPlayfieldSeed for action suite "${suiteKey}"`,
    );
  }
  return {
    suiteDefinition: instance.definition as MiroirTestSuite,
    runnerRegistry: {},
    libraryPlayfieldSeed: seed,
  };
}

export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> =
  {
    runner_library: {
      suiteDefinition: (miroirTest_runner_library as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    },
    [RUNNER_CREATE_ENTITY_SUITE_KEY]: {
      suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
      skipRunTargetPlayfieldReset: true,
      defaultApplicationName: "testApplication_CreateEntity",
    },
    [RUNNER_DROP_ENTITY_SUITE_KEY]: {
      suiteDefinition: (miroirTest_runner_drop_entity as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
      skipRunTargetPlayfieldReset: true,
      defaultApplicationName: "testApplication_CreateEntity",
    },
    [DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_DATA_CRUD_SUITE_KEY,
      miroirTest_domain_controller_data_crud as MiroirTestDefinition,
    ),
    [DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_MODEL_CRUD_SUITE_KEY,
      miroirTest_domain_controller_model_crud as MiroirTestDefinition,
    ),
    [DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_COMPOSITE_PK_CRUD_SUITE_KEY,
      miroirTest_domain_controller_composite_pk_crud as MiroirTestDefinition,
    ),
    [DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_NON_UUID_PK_MODEL_CRUD_SUITE_KEY,
      miroirTest_domain_controller_non_uuid_pk_model_crud as MiroirTestDefinition,
    ),
    [DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_NON_UUID_PK_DATA_CRUD_SUITE_KEY,
      miroirTest_domain_controller_non_uuid_pk_data_crud as MiroirTestDefinition,
    ),
    [DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_NO_PARENT_UUID_CRUD_SUITE_KEY,
      miroirTest_domain_controller_no_parent_uuid_crud as MiroirTestDefinition,
    ),
    [DOMAIN_CONTROLLER_MODEL_UNDO_REDO_SUITE_KEY]: actionSuiteEntry(
      DOMAIN_CONTROLLER_MODEL_UNDO_REDO_SUITE_KEY,
      miroirTest_domain_controller_model_undo_redo as MiroirTestDefinition,
    ),
  };

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}

export function resolveUiIntegrationRunnerSuite(suiteKey: string): UiIntegrationRunnerSuiteEntry {
  const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey];
  if (!entry) {
    throw new Error(
      `Unknown UI integration runner suite: ${suiteKey}. ` +
        `Valid keys: ${listUiIntegrationRunnerSuiteKeys().join(", ")}`,
    );
  }
  return entry;
}
