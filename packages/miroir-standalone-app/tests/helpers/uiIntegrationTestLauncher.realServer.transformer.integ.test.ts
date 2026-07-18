/**
 * RealServer transformer UI integ proof (B7 follow-up).
 *
 * Requires: miroir-server at https://localhost:3080 with SQL backend.
 * Skips when the server is unreachable so CI without a local server stays green.
 *
 * @example
 * npm run testByFile -w miroir-standalone-app -- \
 *   --storage sql uiIntegrationTestLauncher.realServer.transformer.integ
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
import { resolveUiIntegrationTransformerSuite } from "../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js";
import { TRANSFORMER_LEAF_FILTER } from "./uiIntegrationTestLaunchFilterHelpers.js";
import { resolveRealServerUiIntegrationProfile } from "./resolveRealServerUiIntegrationProfile.js";
import { runUiIntegrationTestSuiteInNode } from "./runUiIntegrationTestSuiteInNode.js";

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

describe(`runUiIntegrationTestSuite transformer ${profileName}`, () => {
  it(`runs miroirCoreTransformers leaf against live miroir-server (${storage}, ephemeral)`, async () => {
    // First profile in scope: realServer-sql only.
    if (profileName !== "realServer-sql") {
      console.warn(
        `Skipping: transformer realServer proof is scoped to realServer-sql (got ${profileName})`,
      );
      return;
    }

    try {
      await assertMiroirServerReachable(REAL_SERVER_ROOT_API_URL, {
        fetchImpl: crossFetch as unknown as typeof fetch,
        timeoutMs: 3000,
      });
    } catch (error) {
      if (error instanceof MiroirServerUnreachableError) {
        console.warn(
          `Skipping: miroir-server unreachable at ${REAL_SERVER_ROOT_API_URL} (${error.message})`,
        );
        return;
      }
      throw error;
    }

    const { suiteDefinition } = resolveUiIntegrationTransformerSuite("miroirCoreTransformers");

    const result = await runUiIntegrationTestSuiteInNode(
      {
        suiteKey: "miroirCoreTransformers",
        suiteDefinition,
        profileName,
        runTargetMode: "ephemeral",
        hostMode: "isolated",
        filter: TRANSFORMER_LEAF_FILTER as never,
      },
      vitestExpect,
    );

    expect(result).toMatchObject({
      suiteKey: "miroirCoreTransformers",
      sessionKind: "transformer",
      profileName,
      hostMode: "isolated",
      runTargetMode: "ephemeral",
      success: true,
      inspector: {
        profileName,
        sessionKind: "transformer",
        runTargetMode: "ephemeral",
        hostMode: "isolated",
      },
    });
    expect(result.runTarget.applicationName).toMatch(/^testApplication-/);
    expect(result.inspector.runTarget).toEqual(result.runTarget);
  }, 180_000);
});
