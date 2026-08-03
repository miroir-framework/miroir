import type { MiroirTestDefinition, MiroirTestSuite, Runner } from "miroir-core";
import {
  miroirTest_runner_library,
  RUNNER_LIBRARY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-library";
import {
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  miroirTest_runner_freeze_application_version,
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
  runnerCreateEntity,
  runnerDropEntity,
  runnerFreezeApplicationVersion,
} from "miroir-test-app_deployment-miroir";

import {
  DOMAIN_CONTROLLER_TESTBED_KEYMAP,
  domainControllerIntegTests,
  type TestbedSetupParameters,
} from "../../../tests/helpers/libraryPlayfieldSeeds.js";

export const RUNNER_CREATE_ENTITY_SUITE_KEY = miroirTest_runner_create_entity.name;
export const RUNNER_DROP_ENTITY_SUITE_KEY = miroirTest_runner_drop_entity.name;
export const RUNNER_FREEZE_APPLICATION_VERSION_SUITE_KEY = miroirTest_runner_freeze_application_version.name;

const RUNNER_REF_CREATE_ENTITY = runnerCreateEntity.uuid;
const RUNNER_REF_DROP_ENTITY = runnerDropEntity.uuid;

export type UiIntegrationRunnerSuiteEntry = {
  suiteDefinition: MiroirTestSuite;
  /** Empty for actionTest suites (no Runner entities). */
  runnerRegistry: Record<string, Runner>;
  /**
   * When set, `resolveRunnerTestLeaf` uses this Runner instead of
   * `runnerRegistry[leaf.runnerRef]`. Omitted for multi-runner suites (e.g. runner_library).
   */
  resolvedRunner?: Runner;
  /** Required for DomainController action suites; omitted for runner_library. */
  libraryPlayfieldSeed?: TestbedSetupParameters;
  /**
   * Create/drop entity suites: ephemeral empty playfield — do not remount library
   * seed onto the runTarget (same as CLI `skipRunTargetPlayfieldReset`).
   */
  skipRunTargetPlayfieldReset?: boolean;
  /** Ephemeral runTarget applicationName when suite omits `runTarget`. */
  defaultApplicationName?: string;
};

export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> =
  {
    runner_library: {
      suiteDefinition: (miroirTest_runner_library as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    },
    [miroirTest_runner_create_entity.name]: {
      suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
      resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[RUNNER_REF_CREATE_ENTITY],
      skipRunTargetPlayfieldReset: true,
      defaultApplicationName: "testApplication_CreateEntity",
    },
    [RUNNER_DROP_ENTITY_SUITE_KEY]: {
      suiteDefinition: (miroirTest_runner_drop_entity as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
      resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[RUNNER_REF_DROP_ENTITY],
      skipRunTargetPlayfieldReset: true,
      defaultApplicationName: "testApplication_CreateEntity",
    },
    [miroirTest_runner_freeze_application_version.name]: {
      suiteDefinition: (miroirTest_runner_freeze_application_version as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
      resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[runnerFreezeApplicationVersion.uuid],
      libraryPlayfieldSeed: DOMAIN_CONTROLLER_TESTBED_KEYMAP[miroirTest_runner_freeze_application_version.name],
    },
    ...Object.fromEntries(
      domainControllerIntegTests.map((test) => {
        if (!test.name || !DOMAIN_CONTROLLER_TESTBED_KEYMAP[test.name]) {
          throw new Error(`No playfield seed found for test ${test.name}`);
        }
        return [
          test.name,
          {
            suiteDefinition: test.definition as MiroirTestSuite,
            runnerRegistry: {},
            libraryPlayfieldSeed: DOMAIN_CONTROLLER_TESTBED_KEYMAP[test.name],
          },
        ];
      }),
    ),
  };

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}
