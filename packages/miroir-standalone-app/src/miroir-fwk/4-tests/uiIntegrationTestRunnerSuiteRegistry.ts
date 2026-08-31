import type {
  ActionIntegrationSessionOptions,
  InitApplicationParameters,
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactoryCreateParams,
  MiroirTestDefinition,
  MiroirTestSuite,
  Runner,
  TestbedUuids,
} from "miroir-core";
import {
  resolveRunnerFromMiroirTestSuite,
  resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite,
  resolveSuitePlayfieldSeed,
} from "miroir-core";
import {
  lendDocumentRunner,
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
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

import { getTestConfigurationFromIndex } from "./testConfigurationInstanceIndex.js";
import {
  appForTestTestbedInitParams
} from "./uiIntegrationAppForTestPlayfieldSeed.js";
import {
  libraryTestbedInitParams,
  type TestbedSetupParameters
} from "./uiIntegrationPlayfieldSeeds.js";

export const RUNNER_CREATE_ENTITY_SUITE_KEY = miroirTest_runner_create_entity.name;
// export const RUNNER_DROP_ENTITY_SUITE_KEY = miroirTest_runner_drop_entity.name;
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
  testbedInitApplicationParameters?: InitApplicationParameters;
};

export type UiIntegrationDomainControllerTestSuiteEntry = {
  kind: "domainControllerTest";
  suiteDefinition: MiroirTestSuite;
  testbedInitApplicationParameters?: InitApplicationParameters;
};

export type UiIntegrationActionTestSuiteEntry = {
  kind: "actionTest";
  suiteDefinition: MiroirTestSuite;
  testbedInitApplicationParameters?: InitApplicationParameters;
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
  if (sessionSpecificOptions.testBedModelAndInstances === undefined) {
    throw new Error(
      `action session requires testBedModelAndInstances (suite entry kind: ${entry.kind})`,
    );
  }

  return {
    kind: "action",
    context,
    sessionSpecificOptions: sessionSpecificOptions as ActionIntegrationSessionOptions,
  };
}
// ################################################################################################
function composeUiIntegrationPlayfieldSeed(
  entry: UiIntegrationRunnerSuiteEntry,
): TestbedSetupParameters | undefined {
  if (resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(entry.suiteDefinition)) {
    return undefined;
  }

  const resolved = resolveSuitePlayfieldSeed(
    entry.suiteDefinition,
    getTestConfigurationFromIndex,
  );
  if (resolved === null) {
    throw new Error(
      `UI integration suite "${entry.suiteDefinition.miroirTestLabel}" has no suite-owned playfield (inline testbed or TestConfiguration uuid)`,
    );
  }

  const init = entry.testbedInitApplicationParameters;
  if (init === undefined) {
    throw new Error(
      `UI integration suite "${entry.suiteDefinition.miroirTestLabel}" is missing testbedInitApplicationParameters`,
    );
  }

  return {
    testbedModel: resolved.testbedModel,
    testbedEntitiesAndInstances: resolved.testbedEntitiesAndInstances,
    testbedInitApplicationParameters: init,
  };
}

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
  testBedModelAndInstances?: TestbedSetupParameters;
  skipRunTargetPlayfieldReset?: boolean;
} {
  const skipReset = resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(entry.suiteDefinition);
  const playfield = composeUiIntegrationPlayfieldSeed(entry);
  return {
    pageLabel,
    runTarget,
    suiteTestParams,
    runnerUuidIndex,
    ...(playfield !== undefined ? { testBedModelAndInstances: playfield } : {}),
    ...(skipReset ? { skipRunTargetPlayfieldReset: true } : {}),
  };
}

// ################################################################################################
export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> = {
  [miroirTest_runner_lend_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_lend_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_runner_return_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_return_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_runner_create_entity.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_runner_drop_entity.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_drop_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_runner_freeze_application_version.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_freeze_application_version as MiroirTestDefinition)
      .definition as MiroirTestSuite,
    testbedInitApplicationParameters: appForTestTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_data_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_data_crud.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_model_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_model_crud.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_composite_pk_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_composite_pk_crud.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_non_uuid_pk_model_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_model_crud.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_non_uuid_pk_data_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_data_crud.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_no_parent_uuid_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_no_parent_uuid_crud.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_model_undo_redo.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_model_undo_redo.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_domain_controller_application_version_freeze.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_application_version_freeze.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
  // ###############################################################################
  [miroirTest_evolutionTraceWP1.name]: {
    kind: "actionTest",
    suiteDefinition: miroirTest_evolutionTraceWP1.definition as MiroirTestSuite,
    testbedInitApplicationParameters: libraryTestbedInitParams,
  },
};

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}
