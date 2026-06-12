import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";
import {
  parseMiroirTestCliArgs,
  parseProfileArg,
  resolveMiroirTestCliConfigFromPartial,
} from "./parseMiroirTestCliConfig.js";
import { applyRunnerTestProfile } from "./runnerTestProfiles.js";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type MiroirRunnerTestCliParseResult = MiroirTestCliConfig & {
  vitestEntry: "miroir-runner-tests.integ.test";
};

function listRunnerTestSuiteKeys(): string[] {
  return Object.keys(miroirTest_runner_library.definition as MiroirTestSuite);
}

// ################################################################################################
export function parseMiroirRunnerTestCliConfig(
  env: NodeJS.ProcessEnv,
  argv: string[],
): MiroirRunnerTestCliParseResult {
  applyRunnerTestProfile(parseProfileArg(argv));

  const config = resolveMiroirTestCliConfigFromPartial(
    env,
    parseMiroirTestCliArgs(argv, { integModeAlias: true }),
    listRunnerTestSuiteKeys(),
  );

  if (config.executionMode !== "integration") {
    throw new Error("miroir-standalone-app runner tests require --mode integ");
  }

  return {
    ...config,
    vitestEntry: "miroir-runner-tests.integ.test",
  };
}
