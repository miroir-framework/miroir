import "@testing-library/jest-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { expect as vitestExpect } from "vitest";

import { ConfigurationService, miroirCoreStartup } from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { miroirAppStartup } from "../../src/startup.js";
import { resolveUiIntegrationRunnerSuite } from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";
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
  it("runs runner_library Return Book leaf via in-process launcher", async () => {
    const { suiteDefinition } = resolveUiIntegrationRunnerSuite("runner_library");

    const result = await runUiIntegrationTestSuiteInNode(
      {
        suiteKey: "runner_library",
        suiteDefinition,
        profileName: "emulatedServer-sql",
        runTargetMode: "pinned",
        hostMode: "isolated",
        filter: {
          testList: {
            "runner.library": [RETURN_BOOK_LEAF],
          },
        },
      },
      vitestExpect,
    );

    expect(result).toMatchObject({
      suiteKey: "runner_library",
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
