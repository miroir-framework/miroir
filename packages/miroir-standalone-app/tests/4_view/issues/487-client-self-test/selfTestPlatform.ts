/**
 * #487: the platform the self-test tests boot. The client and the emulated server run on
 * `test-filesystem` (tests never run on a non-test environment) with the `client.selfTest` of the
 * `self-test` environment; `bootEnvironment` plays the server's boot, as miroir-server and the
 * Electron main process do.
 */
import process from "process";
import { expect } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type MiroirConfigClient,
} from "miroir-core";
import { bootEnvironment, resolveEnvironmentFromFiles, type ResolvedEnvironment } from "miroir-env";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { setupMiroirTest } from "../../../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import { openTestEnvironment } from "../../../helpers/testEnvironment.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

export const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
  defaultLevel: "WARN",
  specificLoggerOptions: {},
} as any);

export const repositoryRoot = resolveRepoRoot();

export const selfTestEnvironment: ResolvedEnvironment = resolveEnvironmentFromFiles({
  cwd: repositoryRoot,
  env: { MIROIR_ENV: "self-test" },
});

/** Boots the client and its emulated server; `selfTest` defaults to the `self-test` environment's. */
export async function bootSelfTestPlatform(
  selfTest: MiroirConfigClient["selfTest"] = selfTestEnvironment.environment.client?.selfTest,
): Promise<{ domainController: DomainControllerInterface; miroirConfig: MiroirConfigClient }> {
  const testEnvironment = openTestEnvironment("test-filesystem");
  const miroirConfig: MiroirConfigClient = { ...testEnvironment.miroirConfig, selfTest };
  const wired = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService);
  await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
  return { domainController: wired.domainControllerForClient, miroirConfig };
}
