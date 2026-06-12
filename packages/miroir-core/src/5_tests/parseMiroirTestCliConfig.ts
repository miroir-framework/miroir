import type {
  MiroirTestExecutionMode,
  MiroirTestRunFilter,
} from "./MiroirTestTools";
import { listMiroirTestSuiteKeys } from "../../tests/helpers/miroirCoreTestSuiteRegistry";

export type MiroirTestCliConfig = {
  suiteKeys: string[];
  executionMode: MiroirTestExecutionMode;
  filter?: MiroirTestRunFilter;
};

export type MiroirTestCliParseResult = MiroirTestCliConfig & {
  /** Vitest entry file to run for the selected execution mode. */
  vitestEntry: "miroir-core-tests.unit.test" | "miroir-core-tests.integ.test";
};

export const ALL_SUITES_JOKER = "*";

export type ParseMiroirTestCliArgsOptions = {
  /** Accept `integ` as alias for `integration` (--mode integ). */
  integModeAlias?: boolean;
};

export function splitSuiteKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export function suiteKeysFromEnv(env: NodeJS.ProcessEnv): string[] {
  return splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE);
}

/** Empty list or `*` means every key in `allKeys`. */
export function resolveSuiteKeys(rawKeys: string[], allKeys: string[]): string[] {
  if (rawKeys.length === 0 || rawKeys.includes(ALL_SUITES_JOKER)) {
    return allKeys;
  }
  return rawKeys;
}

/** Empty list or `*` means every registered MiroirTest suite. */
export function resolveMiroirTestSuiteKeys(rawKeys: string[]): string[] {
  return resolveSuiteKeys(rawKeys, listMiroirTestSuiteKeys());
}

export function parseFilterJson(raw: string | undefined): MiroirTestRunFilter | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MIROIR_TEST_FILTER / --filter must be a JSON object");
  }
  return parsed as MiroirTestRunFilter;
}

function normalizeExecutionMode(
  rawMode: string,
  options: ParseMiroirTestCliArgsOptions,
): MiroirTestExecutionMode {
  const mode: MiroirTestExecutionMode =
    options.integModeAlias && rawMode === "integ"
      ? "integration"
      : (rawMode as MiroirTestExecutionMode);
  if (mode !== "unit" && mode !== "integration") {
    const expected = options.integModeAlias
      ? "unit, integ, or integration"
      : "unit or integration";
    throw new Error(`Invalid --mode "${rawMode}" (expected ${expected})`);
  }
  return mode;
}

/** Parse `--profile value` from argv (does not mutate env). */
export function parseProfileArg(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--profile" || arg === "-p") {
      return argv[++index];
    }
  }
  return undefined;
}

/** Parse `--flag value` pairs from argv (does not mutate env). */
export function parseMiroirTestCliArgs(
  argv: string[],
  options: ParseMiroirTestCliArgsOptions = {},
): Partial<MiroirTestCliConfig> {
  const result: Partial<MiroirTestCliConfig> = {};

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--suites" || arg === "-s") {
      result.suiteKeys = splitSuiteKeys(argv[++index]);
    } else if (arg === "--mode" || arg === "-m") {
      result.executionMode = normalizeExecutionMode(argv[++index], options);
    } else if (arg === "--filter" || arg === "-f") {
      result.filter = parseFilterJson(argv[++index]);
    }
  }

  return result;
}

export function executionModeFromEnv(env: NodeJS.ProcessEnv): MiroirTestExecutionMode {
  return env.MIROIR_TEST_MODE === "integration" ? "integration" : "unit";
}

/** Resolve suite keys, mode, and filter from partial argv parse + env fallbacks. */
export function resolveMiroirTestCliConfigFromPartial(
  env: NodeJS.ProcessEnv,
  fromArgs: Partial<MiroirTestCliConfig>,
  allSuiteKeys: string[],
): MiroirTestCliConfig {
  return {
    suiteKeys: resolveSuiteKeys(fromArgs.suiteKeys ?? suiteKeysFromEnv(env), allSuiteKeys),
    executionMode: fromArgs.executionMode ?? executionModeFromEnv(env),
    filter: fromArgs.filter ?? parseFilterJson(env.MIROIR_TEST_FILTER),
  };
}

// ################################################################################################
/**
 * Resolve CLI config from npm args (highest priority) and env vars (CI).
 * When no suites are specified, or `*` is given, all registered suites are selected.
 */
export function parseMiroirTestCliConfig(
  env: NodeJS.ProcessEnv,
  argv: string[],
): MiroirTestCliParseResult {
  const config = resolveMiroirTestCliConfigFromPartial(
    env,
    parseMiroirTestCliArgs(argv),
    listMiroirTestSuiteKeys(),
  );

  return {
    ...config,
    vitestEntry:
      config.executionMode === "integration" ? "miroir-core-tests.integ.test" : "miroir-core-tests.unit.test",
  };
}

// ################################################################################################
/** Build env overrides for `scripts/test-miroir.ts` after parsing raw CLI args. */
/**
 * TODO: return a compositeActionSequence instead of running actions one by one
 * @param config
 * @returns
 */
export function miroirTestCliConfigToEnv(config: MiroirTestCliConfig): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    MIROIR_TEST_MODE: config.executionMode,
  };
  const allSuiteKeys = listMiroirTestSuiteKeys();
  if (
    config.suiteKeys.length === allSuiteKeys.length &&
    allSuiteKeys.every((key) => config.suiteKeys.includes(key))
  ) {
    env.MIROIR_TEST_SUITES = ALL_SUITES_JOKER;
  } else if (config.suiteKeys.length) {
    env.MIROIR_TEST_SUITES = config.suiteKeys.join(",");
  }
  if (config.filter !== undefined) {
    env.MIROIR_TEST_FILTER = JSON.stringify(config.filter);
  }
  return env;
}
