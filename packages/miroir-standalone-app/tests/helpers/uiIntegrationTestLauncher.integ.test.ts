import "@testing-library/jest-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { expect as vitestExpect } from "vitest";

import { ConfigurationService, miroirCoreStartup } from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { miroirAppStartup } from "../../src/startup.js";
import { UI_INTEGRATION_RUNNER_SUITE_REGISTRY } from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";
import { runUiIntegrationTestSuiteInNode } from "./runUiIntegrationTestSuiteInNode.js";

const RETURN_BOOK_LEAF = "Return Book Test Composite Action";

beforeAll(() => {
  miroirAppStartup();
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({
    expect: vitestExpect as never,
  });
});

describe("runUiIntegrationTestSuite (B3)", () => {
  it("runs runner_return_document Return Book leaf via in-process launcher", async () => {
    const suiteDefinition = UI_INTEGRATION_RUNNER_SUITE_REGISTRY["runner_return_document"].suiteDefinition;

    const result = await runUiIntegrationTestSuiteInNode(
      {
        suiteKey: "runner_return_document",
        suiteDefinition,
        profileName: "emulatedServer-sql",
        runTargetMode: "pinned",
        hostMode: "isolated",
        filter: {
          testList: {
            "runner.returnDocument": [RETURN_BOOK_LEAF],
          },
        },
      },
      vitestExpect,
    );

    expect(result).toMatchObject({
      suiteKey: "runner_return_document",
      sessionKind: "runner",
      profileName: "emulatedServer-sql",
      hostMode: "isolated",
      runTargetMode: "pinned",
      success: true,
      inspector: {
        profileName: "emulatedServer-sql",
        sessionKind: "runner",
        runTargetMode: "pinned",
        hostMode: "isolated",
      },
    });
    expect(result.runTarget.applicationName).toBe("Library");
    expect(result.inspector.runTarget).toEqual(result.runTarget);
  }, 180_000);
});

describe("runUiIntegrationTestSuite transformer (B7)", () => {
  it("runs one miroirCoreTransformers integ leaf via in-process launcher", async () => {
    const { resolveUiIntegrationTransformerSuite } = await import(
      "../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js"
    );
    const { suiteDefinition } = resolveUiIntegrationTransformerSuite("miroirCoreTransformers");

    const result = await runUiIntegrationTestSuiteInNode(
      {
        suiteKey: "miroirCoreTransformers",
        suiteDefinition,
        profileName: "emulatedServer-sql",
        runTargetMode: "pinned",
        hostMode: "isolated",
        filter: {
          testList: {
            miroirCoreTransformers: {
              runtimeTransformerTests: {
                plus: ["plus with empty args fails"],
              },
            },
          },
        },
      },
      vitestExpect,
    );

    expect(result.suiteKey).toBe("miroirCoreTransformers");
    expect(result.sessionKind).toBe("transformer");
    expect(result.profileName).toBe("emulatedServer-sql");
    expect(result.hostMode).toBe("isolated");
    expect(result.runTargetMode).toBe("pinned");
    expect(result.inspector.sessionKind).toBe("transformer");
    expect(result.runTarget.applicationUuid).toBeTruthy();
    expect(result.runTarget.deploymentUuid).toBeTruthy();
    expect(result.success).toBe(true);
  }, 180_000);
});
