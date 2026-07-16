/**
 * B6-c C4 — Node proof that the UI launcher path works against a live miroir-server
 * (`realServer-sql`, ephemeral runTarget, Return Book leaf).
 *
 * Requires: miroir-server at https://localhost:3080 (same shared server as D9).
 * Skips when the server is unreachable so CI without a local server stays green.
 */
import "@testing-library/jest-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { expect as vitestExpect } from "vitest";
import crossFetch from "cross-fetch";

import { ConfigurationService, miroirCoreStartup } from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { miroirAppStartup } from "../../src/startup.js";
import {
  assertMiroirServerReachable,
  MiroirServerUnreachableError,
} from "../../src/miroir-fwk/4-tests/assertMiroirServerReachable.js";
import { resolveUiIntegrationRunnerSuite } from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";
import { runUiIntegrationTestSuiteInNode } from "./runUiIntegrationTestSuiteInNode.js";

const RETURN_BOOK_LEAF = "Return Book Test Composite Action";
const REAL_SERVER_ROOT_API_URL = "https://localhost:3080";

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

describe("runUiIntegrationTestSuite realServer-sql (B6-c C4)", () => {
  it("runs runner_library Return Book leaf against live miroir-server (ephemeral)", async () => {
    try {
      await assertMiroirServerReachable(REAL_SERVER_ROOT_API_URL, {
        fetchImpl: crossFetch as unknown as typeof fetch,
        timeoutMs: 3000,
      });
    } catch (error) {
      if (error instanceof MiroirServerUnreachableError) {
        console.warn(
          `[B6-c C4] Skipping: miroir-server unreachable at ${REAL_SERVER_ROOT_API_URL} (${error.message})`,
        );
        return;
      }
      throw error;
    }

    const { suiteDefinition } = resolveUiIntegrationRunnerSuite("runner_library");

    const result = await runUiIntegrationTestSuiteInNode(
      {
        suiteKey: "runner_library",
        suiteDefinition,
        profileName: "realServer-sql",
        runTargetMode: "ephemeral",
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
      profileName: "realServer-sql",
      hostMode: "isolated",
      runTargetMode: "ephemeral",
      success: true,
      inspector: {
        profileName: "realServer-sql",
        sessionKind: "runner",
        runTargetMode: "ephemeral",
        hostMode: "isolated",
      },
    });
    expect(result.runTarget.applicationName).toBe("Library");
    expect(result.inspector.runTarget).toEqual(result.runTarget);
    // Ephemeral UUID v4 — must not collide with the canonical Library app UUID.
    expect(result.runTarget.applicationUuid).not.toBe("f714bb2f-a12d-4e71-a03b-74dcedea6eb4");
  }, 180_000);
});
