import { expect } from "vitest";
import * as vitest from "vitest";

import {
  ConfigurationService,
  listMiroirTestSuiteKeys,
  MiroirActivityTracker,
  parseMiroirTestCliArgs,
  resolveMiroirTestCliConfigFromPartial,
  runMiroirCoreTestsFromCLI,
  runMiroirTests,
  type MiroirConfigClient,
} from "miroir-core";
import { assertMiroirCoreIntegTestLaunchReady } from "./helpers/miroirCoreIntegTestLaunch.js";
import { resolveTestSessionForIntegOptionsFromEnv } from "./helpers/IntegrationTestSession.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";

ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const argv = process.argv.slice(2);
const config = resolveMiroirTestCliConfigFromPartial(
  process.env,
  parseMiroirTestCliArgs(argv, { integModeAlias: true }),
  listMiroirTestSuiteKeys(),
);
const testSessionOptions = resolveTestSessionForIntegOptionsFromEnv(process.env);
const miroirActivityTracker = new MiroirActivityTracker();
assertMiroirCoreIntegTestLaunchReady({
  env: process.env,
  argv,
  config,
  testSessionOptions,
});

if (config.suiteKeys.length > 0) {
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  const testSession = orchestrator.createSession(
    "transformer",
    { miroirConfig: { client: { emulateServer: true } } as MiroirConfigClient },
    testSessionOptions,
  );
  await runMiroirCoreTestsFromCLI(
    runMiroirTests, 
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
