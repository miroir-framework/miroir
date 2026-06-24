import { expect } from "vitest";
import * as vitest from "vitest";

import {
  ConfigurationService,
  listMiroirTestSuiteKeys,
  parseMiroirTestCliArgs,
  resolveMiroirTestCliConfigFromPartial,
  runMiroirCoreTestsFromCLI,
} from "miroir-core";
import { assertMiroirCoreIntegTestLaunchReady } from "./helpers/miroirCoreIntegTestLaunch.js";
import {
  TestSessionForInteg,
  resolveTestSessionForIntegOptionsFromEnv,
} from "./helpers/TestSessionForInteg.js";

ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const argv = process.argv.slice(2);
const config = {
  ...resolveMiroirTestCliConfigFromPartial(
    process.env,
    parseMiroirTestCliArgs(argv, { integModeAlias: true }),
    listMiroirTestSuiteKeys(),
  ),
  vitestEntry: "miroir-core-tests.integ.test" as const,
};
const testSessionOptions = resolveTestSessionForIntegOptionsFromEnv(process.env);

assertMiroirCoreIntegTestLaunchReady({
  env: process.env,
  argv,
  config,
  testSessionOptions,
});

if (config.suiteKeys.length > 0) {
  const testSession = new TestSessionForInteg(testSessionOptions);
  const executionEnvironment = await testSession.initSession();
  await runMiroirCoreTestsFromCLI(vitest, config, {
    executionEnvironment,
    testSession,
  });
}
