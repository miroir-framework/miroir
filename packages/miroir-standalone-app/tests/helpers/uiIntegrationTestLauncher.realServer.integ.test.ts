/**
 * B6-c C4 — Node proof that the UI launcher path works against a live miroir-server
 * (`realServer-*`, ephemeral runTarget, Return Book leaf).
 *
 * Storage backend is selected via argv (preferred) or env:
 *   --storage sql|filesystem|indexedDb|mongodb   → profile `realServer-<storage>`
 *   --profile realServer-<storage>               → same (via testByFile)
 *   MIROIR_TEST_STORAGE / VITE_MIROIR_TEST_CONFIG_FILENAME (fallback)
 * Default: sql → `realServer-sql`.
 *
 * Requires: miroir-server at https://localhost:3080 (same shared server as D9).
 * Skips when the server is unreachable so CI without a local server stays green.
 *
 * @example
 * npm run testByFile -w miroir-standalone-app -- \
 *   --storage sql uiIntegrationTestLauncher.realServer.integ
 * npm run testByFile -w miroir-standalone-app -- \
 *   --profile realServer-filesystem uiIntegrationTestLauncher.realServer.integ
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
import { resolveRealServerUiIntegrationProfile } from "./resolveRealServerUiIntegrationProfile.js";
import { runUiIntegrationTestSuiteInNode } from "./runUiIntegrationTestSuiteInNode.js";

const RETURN_BOOK_LEAF = "Return Book Test Composite Action";
const REAL_SERVER_ROOT_API_URL = "https://localhost:3080";

const { storage, profileName } = resolveRealServerUiIntegrationProfile({
  argv: process.argv.slice(2),
  env: process.env,
});

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

describe(`runUiIntegrationTestSuite ${profileName} (B6-c C4)`, () => {
  it(`runs runner_library Return Book leaf against live miroir-server (${storage}, ephemeral)`, async () => {
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
        profileName,
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
      profileName,
      hostMode: "isolated",
      runTargetMode: "ephemeral",
      success: true,
      inspector: {
        profileName,
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
