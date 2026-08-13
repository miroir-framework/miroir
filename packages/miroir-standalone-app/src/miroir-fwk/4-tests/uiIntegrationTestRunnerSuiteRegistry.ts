import type { Entity, EntityInstance, MetaModel, MiroirTestDefinition, MiroirTestSuite, Runner } from "miroir-core";
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
  miroirTest_runner_library,
  RUNNER_LIBRARY_RUNNER_REGISTRY,
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
  type TestbedSetupParameters
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

export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> = {
  runner_library: {
    suiteDefinition: (miroirTest_runner_library as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
  },
  // ###############################################################################
  [miroirTest_runner_create_entity.name]: {
    suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
    resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[RUNNER_REF_CREATE_ENTITY],
    skipRunTargetPlayfieldReset: true,
    defaultApplicationName: "testApplication_CreateEntity",
  },
  // ###############################################################################
  [RUNNER_DROP_ENTITY_SUITE_KEY]: {
    suiteDefinition: (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
    resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[RUNNER_REF_DROP_ENTITY],
    skipRunTargetPlayfieldReset: true,
    defaultApplicationName: "testApplication_CreateEntity",
  },
  // ###############################################################################
  [miroirTest_runner_freeze_application_version.name]: {
    suiteDefinition: (miroirTest_runner_freeze_application_version as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    runnerRegistry: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
    resolvedRunner: RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY[runnerFreezeApplicationVersion.uuid],
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    }
  },
  // ###############################################################################
  [miroirTest_domain_controller_data_crud.name]: {
    suiteDefinition: miroirTest_domain_controller_data_crud.definition as MiroirTestSuite,
    runnerRegistry: {},
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
    suiteDefinition: miroirTest_domain_controller_model_crud.definition as MiroirTestSuite,
    runnerRegistry: {},
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_composite_pk_crud.name]: {
    suiteDefinition: miroirTest_domain_controller_composite_pk_crud.definition as MiroirTestSuite,
    runnerRegistry: {},
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
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_model_crud.definition as MiroirTestSuite,
    runnerRegistry: {},
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
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_data_crud.definition as MiroirTestSuite,
    runnerRegistry: {},
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
    suiteDefinition: miroirTest_domain_controller_no_parent_uuid_crud.definition as MiroirTestSuite,
    runnerRegistry: {},
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
    suiteDefinition: miroirTest_domain_controller_model_undo_redo.definition as MiroirTestSuite,
    runnerRegistry: {},
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: [],
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: emptyLibraryPlayfieldMetaModel,
    },
  },
  // ###############################################################################
  [miroirTest_domain_controller_application_version_freeze.name]: {
    suiteDefinition:
      miroirTest_domain_controller_application_version_freeze.definition as MiroirTestSuite,
    runnerRegistry: {},
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    },
  },
  // // ###############################################################################
  // [miroirTest_runner_freeze_application_version.name]: {
  //   suiteDefinition: miroirTest_runner_freeze_application_version.definition as MiroirTestSuite,
  //   runnerRegistry: {},
  //   libraryPlayfieldSeed: {
  //     testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
  //     testbedInitApplicationParameters: libraryTestbedInitParams,
  //     testbedModel: publisherAndCountryTestMetaModel,
  //   },
  // },
  // ###############################################################################
  [miroirTest_evolutionTraceWP1.name]: {
    suiteDefinition: miroirTest_evolutionTraceWP1.definition as MiroirTestSuite,
    runnerRegistry: {},
    libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: libraryEntitiesAndInstancesPublisherAndCountry,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: publisherAndCountryTestMetaModel,
    },
  },

  // ...Object.fromEntries(
  //   domainControllerIntegTests.map((test) => {
  //     if (!test.name || !DOMAIN_CONTROLLER_TESTBED_KEYMAP[test.name]) {
  //       throw new Error(`No playfield seed found for test ${test.name}`);
  //     }
  //     return [
  //       test.name,
  //       {
  //         suiteDefinition: test.definition as MiroirTestSuite,
  //         runnerRegistry: {},
  //         libraryPlayfieldSeed: DOMAIN_CONTROLLER_TESTBED_KEYMAP[test.name],
  //       },
  //     ];
  //   }),
  // ),
};

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}
