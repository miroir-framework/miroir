import { describe, expect, it } from "vitest";

import { miroirTest_runner_return_document } from "miroir-test-app_deployment-library";
import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";

import {
  isUiIntegrationSuiteRunSuccessful,
  resolveUiIntegrationTestRunTarget,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js";
import {
  buildUiIntegrationOrchestratorCreateSessionParams,
  listUiIntegrationRunnerSuiteKeys,
  resolveUiIntegrationOrchestratorSessionKind,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
  UI_INTEGRATION_RUNNER_UUID_INDEX,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

function runnerReturnDocumentSuite(): MiroirTestSuite {
  return (miroirTest_runner_return_document as MiroirTestDefinition).definition as MiroirTestSuite;
}

describe("uiIntegrationTestRunnerSuiteRegistry (B3)", () => {
  it("lists runner_lend_document, runner_return_document, runner_create_entity, runner_drop_entity, and domain_controller action suites", () => {
    const keys = listUiIntegrationRunnerSuiteKeys();
    expect(keys).toContain("runner_lend_document");
    expect(keys).toContain("runner_return_document");
    expect(keys).toContain("runner_create_entity");
    expect(keys).toContain("runner_drop_entity");
    expect(keys).toContain("domain_controller_data_crud");
    expect(keys).toContain("domain_controller_model_crud");
  });

  it("registry entries use discriminated union kinds", () => {
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_lend_document.kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_return_document.kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_create_entity.kind).toBe("runnerTest");
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_data_crud.kind).toBe(
      "domainControllerTest",
    );
    expect(UI_INTEGRATION_RUNNER_SUITE_REGISTRY.evolutionTraceWP1.kind).toBe("actionTest");
  });

  it("buildUiIntegrationOrchestratorCreateSessionParams distinguishes runner vs action kinds", () => {
    const context = { miroirConfig: {} as never };
    const runTarget = {
      applicationUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deploymentUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      applicationName: "Library",
    };
    const runnerParams = buildUiIntegrationOrchestratorCreateSessionParams(
      UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_lend_document,
      context,
      "test",
      runTarget,
      {},
      UI_INTEGRATION_RUNNER_UUID_INDEX,
    );
    expect(runnerParams.kind).toBe("runner");
    if (runnerParams.kind === "runner") {
      expect(runnerParams.resolvedRunner).toBeDefined();
      expect(runnerParams.sessionSpecificOptions?.runnerUuidIndex).toBe(
        UI_INTEGRATION_RUNNER_UUID_INDEX,
      );
    }

    const actionParams = buildUiIntegrationOrchestratorCreateSessionParams(
      UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_data_crud,
      context,
      "test",
      runTarget,
      {},
      UI_INTEGRATION_RUNNER_UUID_INDEX,
    );
    expect(actionParams.kind).toBe("action");
    if (actionParams.kind === "action") {
      expect(actionParams.sessionSpecificOptions.libraryPlayfieldSeed).toBeDefined();
      expect("resolvedRunner" in actionParams).toBe(false);
    }
  });

  it("resolveUiIntegrationOrchestratorSessionKind maps registry entry kinds", () => {
    expect(
      resolveUiIntegrationOrchestratorSessionKind(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_return_document,
      ),
    ).toBe("runner");
    expect(
      resolveUiIntegrationOrchestratorSessionKind(
        UI_INTEGRATION_RUNNER_SUITE_REGISTRY.domain_controller_data_crud,
      ),
    ).toBe("action");
  });

});

describe("uiIntegrationTestTransformerSuiteRegistry (B7)", () => {
  it("lists and resolves miroirCoreTransformers", async () => {
    const {
      listUiIntegrationTransformerSuiteKeys,
      resolveUiIntegrationTransformerSuite,
    } = await import("../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js");
    expect(listUiIntegrationTransformerSuiteKeys()).toContain("miroirCoreTransformers");
    const entry = resolveUiIntegrationTransformerSuite("miroirCoreTransformers");
    expect(entry.suiteDefinition.miroirTestLabel).toBe("miroirCoreTransformers");
  });
});

describe("resolveUiIntegrationTestRunTarget (B3)", () => {
  it("pinned mode uses suite runTarget", () => {
    const suite = runnerReturnDocumentSuite();
    const resolved = resolveUiIntegrationTestRunTarget("pinned", suite);

    expect(resolved.applicationUuid).toBe(suite.runTarget?.applicationUuid);
    expect(resolved.deploymentUuid).toBe(suite.runTarget?.deploymentUuid);
  });

  it("ephemeral mode ignores suite pins", () => {
    const suite = runnerReturnDocumentSuite();
    const pinned = resolveUiIntegrationTestRunTarget("pinned", suite);
    const ephemeral = resolveUiIntegrationTestRunTarget("ephemeral", suite);

    expect(ephemeral.applicationUuid).not.toBe(pinned.applicationUuid);
    expect(ephemeral.deploymentUuid).not.toBe(pinned.deploymentUuid);
  });
});

describe("isUiIntegrationSuiteRunSuccessful (B3)", () => {
  it("returns false when no test results exist", () => {
    expect(
      isUiIntegrationSuiteRunSuccessful(
        {
          getTestAssertionsResults: () => ({}),
        } as never,
        "runner_return_document",
      ),
    ).toBe(false);
  });

  it("returns true for nested transformer suite results (B7)", () => {
    expect(
      isUiIntegrationSuiteRunSuccessful(
        {
          getTestAssertionsResults: () => ({
            testsSuiteResults: {
              runtimeTransformerTests: {
                testsSuiteResults: {
                  plus: {
                    testsResults: {
                      "plus with empty args fails": {
                        testLabel: "plus with empty args fails",
                        testResult: "ok",
                        testAssertionsResults: {},
                      },
                    },
                  },
                },
              },
            },
          }),
        } as never,
        "miroirCoreTransformers",
      ),
    ).toBe(true);
  });
});
