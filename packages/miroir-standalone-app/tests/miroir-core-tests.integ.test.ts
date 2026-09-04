import { expect } from "vitest";
import * as vitest from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  parseMiroirTestCliArgs,
  resolveMiroirTestCliConfigFromPartial,
  runMiroirTests,
  type MiroirConfigClient,
} from "miroir-core";
import {
  listCliUnitSuiteKeysFromFolders,
  resolveCliSuiteKeysFromCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";
import { runMiroirCoreTestsFromCLI } from "./helpers/runMiroirCoreTestsFromCLI.js";
import { assertMiroirCoreIntegTestLaunchReady } from "./helpers/miroirCoreIntegTestLaunch.js";
import { resolveTestSessionForIntegOptionsFromEnv } from "./helpers/IntegrationTestSession.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";

ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const argv = process.argv.slice(2);
const unitSuiteKeys = listCliUnitSuiteKeysFromFolders();
const parsedConfig = resolveMiroirTestCliConfigFromPartial(
  process.env,
  parseMiroirTestCliArgs(argv, { integModeAlias: true }),
  unitSuiteKeys,
);
const config = {
  ...parsedConfig,
  suiteKeys: resolveCliSuiteKeysFromCatalog(parsedConfig.suiteKeys, unitSuiteKeys),
};
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
  const testSession = orchestrator.createSession({
    kind: "transformer",
    context: { miroirConfig: { client: { emulateServer: true } } as MiroirConfigClient },
    sessionSpecificOptions: testSessionOptions,
  });
  await runMiroirCoreTestsFromCLI(
    runMiroirTests, 
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
