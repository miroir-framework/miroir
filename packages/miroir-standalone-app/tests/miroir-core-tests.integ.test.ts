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
} from "miroir-core";
import { assertMiroirCoreIntegTestLaunchReady } from "./helpers/miroirCoreIntegTestLaunch.js";
import {
  IntegrationTestSession,
  resolveTestSessionForIntegOptionsFromEnv,
} from "./helpers/IntegrationTestSession.js";

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
  const testSession = new IntegrationTestSession(testSessionOptions);
  await runMiroirCoreTestsFromCLI(
    runMiroirTests, 
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
