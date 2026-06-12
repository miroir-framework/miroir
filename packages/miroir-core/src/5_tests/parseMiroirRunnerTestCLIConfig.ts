import type { MiroirTestExecutionMode, MiroirTestRunFilter } from "./MiroirTestTools.js";
import { applyRunnerTestProfile } from "./runnerTestProfiles.js";
import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const ALL_SUITES_JOKER = "*";

export type MiroirRunnerTestCliParseResult = MiroirTestCliConfig & {
  vitestEntry: "miroir-runner-tests.integ.test";
};


// ################################################################################################
function splitSuiteKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

// ################################################################################################
/**
 * resolves "joker" filter (ALL_SUITES_JOKER) to all available keys, returns rawKeys otherwise
 * @param rawKeys 
 * @param all_keys 
 * @returns 
 */
function resolveRunnerSuiteKeys(rawKeys: string[], all_keys: string[]): string[] {
  if (rawKeys.length === 0 || rawKeys.includes(ALL_SUITES_JOKER)) {
    return all_keys;
  }
  return rawKeys;
}

// ################################################################################################
function parseMiroirTestCliArgs(argv: string[]): {
  suiteKeys?: string[];
  executionMode?: MiroirTestExecutionMode;
  filter?: MiroirTestRunFilter;
} {
  const result: {
    suiteKeys?: string[];
    executionMode?: MiroirTestExecutionMode;
    filter?: MiroirTestRunFilter;
  } = {};

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--suites" || arg === "-s") {
      result.suiteKeys = splitSuiteKeys(argv[++index]);
    } else if (arg === "--mode" || arg === "-m") {
      const rawMode = argv[++index];
      const mode: MiroirTestExecutionMode =
        rawMode === "integ" ? "integration" : (rawMode as MiroirTestExecutionMode);
      if (mode !== "unit" && mode !== "integration") {
        throw new Error(`Invalid --mode "${rawMode}" (expected unit, integ, or integration)`);
      }
      result.executionMode = mode;
    } else if (arg === "--filter" || arg === "-f") {
      result.filter = parseFilterJson(argv[++index]);
    }
  }

  return result;
}

// ################################################################################################
function parseFilterJson(raw: string | undefined): MiroirTestRunFilter | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MIROIR_TEST_FILTER / --filter must be a JSON object");
  }
  return parsed as MiroirTestRunFilter;
}

// ################################################################################################
function parseProfileArg(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--profile" || arg === "-p") {
      return argv[++index];
    }
  }
  return undefined;
}

// ################################################################################################
export function parseMiroirRunnerTestCliConfig(
  env: NodeJS.ProcessEnv = process.env,
  argv: string[] = process.argv.slice(2),
): MiroirRunnerTestCliParseResult {
  applyRunnerTestProfile(parseProfileArg(argv));
  const fromArgs = parseMiroirTestCliArgs(argv);

  const suiteKeys = resolveRunnerSuiteKeys(
    fromArgs.suiteKeys ?? splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE),
    Object.keys(miroirTest_runner_library.definition as MiroirTestSuite)
  );

  const executionMode: MiroirTestExecutionMode =
    fromArgs.executionMode ??
    (env.MIROIR_TEST_MODE === "integration" ? "integration" : "unit");

  if (executionMode !== "integration") {
    throw new Error("miroir-standalone-app runner tests require --mode integ");
  }

  const filter = fromArgs.filter ?? parseFilterJson(env.MIROIR_TEST_FILTER);

  const result: MiroirRunnerTestCliParseResult =  {
    suiteKeys,
    executionMode,
    filter,
    vitestEntry: "miroir-runner-tests.integ.test",
  };
  return result;
}
