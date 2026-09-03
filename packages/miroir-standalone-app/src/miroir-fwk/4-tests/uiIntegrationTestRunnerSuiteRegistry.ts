import type {
  ActionIntegrationSessionOptions,
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
  resolveSuiteTestbedInitApplicationParameters,
  composeIntegTestbedResetParams,
  type IntegTestbedResetParams,
} from "miroir-core";
import {
  lendDocumentRunner,
  mcpLendDocumentRunner,
  miroirTest_runner_lend_document,
  miroirTest_runner_mcp_lend_document,
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
  miroirTest_runner_mcp_get_instances,
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-miroir";

import { getTestConfigurationFromIndex } from "./testConfigurationInstanceIndex.js";
import { getTestbedInitApplicationParametersFromRef } from "./testbedInitApplicationParametersIndex.js";

export const RUNNER_CREATE_ENTITY_SUITE_KEY = miroirTest_runner_create_entity.name;
// export const RUNNER_DROP_ENTITY_SUITE_KEY = miroirTest_runner_drop_entity.name;
export const RUNNER_FREEZE_APPLICATION_VERSION_SUITE_KEY =
  miroirTest_runner_freeze_application_version.name;

/** Runners keyed by uuid for UI integration runnerTest resolution via leaf `runnerRef`. */
export const UI_INTEGRATION_RUNNER_UUID_INDEX: Record<string, Runner> = {
  ...RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
  [lendDocumentRunner.uuid]: lendDocumentRunner,
  [mcpLendDocumentRunner.uuid]: mcpLendDocumentRunner,
  [returnDocumentRunner.uuid]: returnDocumentRunner,
};

export type UiIntegrationRunnerTestSuiteEntry = {
  kind: "runnerTest";
  suiteDefinition: MiroirTestSuite;
};

export type UiIntegrationDomainControllerTestSuiteEntry = {
  kind: "domainControllerTest";
  suiteDefinition: MiroirTestSuite;
};

export type UiIntegrationActionTestSuiteEntry = {
  kind: "actionTest";
  suiteDefinition: MiroirTestSuite;
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
  if (sessionSpecificOptions.integTestbedResetParams === undefined) {
    throw new Error(
      `action session requires integTestbedResetParams (suite entry kind: ${entry.kind})`,
    );
  }

  return {
    kind: "action",
    context,
    sessionSpecificOptions: sessionSpecificOptions as ActionIntegrationSessionOptions,
  };
}
// ################################################################################################
export function composeUiIntegrationTestbedResetParams(
  entry: UiIntegrationRunnerSuiteEntry,
): IntegTestbedResetParams | undefined {
  if (resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(entry.suiteDefinition)) {
    return undefined;
  }

  const playfieldSeed = resolveSuitePlayfieldSeed(
    entry.suiteDefinition,
    getTestConfigurationFromIndex,
  );
  if (playfieldSeed === null) {
    throw new Error(
      `UI integration suite "${entry.suiteDefinition.miroirTestLabel}" has no suite-owned playfield (inline testbed or TestConfiguration uuid)`,
    );
  }

  const testbedInitApplicationParameters = resolveSuiteTestbedInitApplicationParameters(
    entry.suiteDefinition,
    getTestbedInitApplicationParametersFromRef,
  );
  if (testbedInitApplicationParameters === null) {
    return undefined;
  }

  return composeIntegTestbedResetParams(playfieldSeed, testbedInitApplicationParameters);
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
  integTestbedResetParams?: IntegTestbedResetParams;
  skipRunTargetPlayfieldReset?: boolean;
} {
  const skipReset = resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(entry.suiteDefinition);
  const integTestbedResetParams = composeUiIntegrationTestbedResetParams(entry);
  return {
    pageLabel,
    runTarget,
    suiteTestParams,
    runnerUuidIndex,
    ...(integTestbedResetParams !== undefined ? { integTestbedResetParams } : {}),
    ...(skipReset ? { skipRunTargetPlayfieldReset: true } : {}),
  };
}

// ################################################################################################
export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> = {
  [miroirTest_runner_lend_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_lend_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_runner_return_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_return_document as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_runner_create_entity.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_create_entity as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_runner_mcp_get_instances.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_mcp_get_instances as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_runner_mcp_lend_document.name]: {
    kind: "runnerTest",
    suiteDefinition: (miroirTest_runner_mcp_lend_document as MiroirTestDefinition)
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
  },
  // ###############################################################################
  [miroirTest_domain_controller_data_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_data_crud.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_model_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_model_crud.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_composite_pk_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_composite_pk_crud.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_non_uuid_pk_model_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_model_crud.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_non_uuid_pk_data_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_non_uuid_pk_data_crud.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_no_parent_uuid_crud.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_no_parent_uuid_crud.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_model_undo_redo.name]: {
    kind: "domainControllerTest",
    suiteDefinition: miroirTest_domain_controller_model_undo_redo.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_domain_controller_application_version_freeze.name]: {
    kind: "domainControllerTest",
    suiteDefinition:
      miroirTest_domain_controller_application_version_freeze.definition as MiroirTestSuite,
  },
  // ###############################################################################
  [miroirTest_evolutionTraceWP1.name]: {
    kind: "actionTest",
    suiteDefinition: miroirTest_evolutionTraceWP1.definition as MiroirTestSuite,
  },
};

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}
