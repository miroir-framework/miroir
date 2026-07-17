import type {
  MiroirTestExecutionMode,
} from "./MiroirTestTools";
import { listMiroirTestSuiteKeys } from "./miroirCoreTestSuiteRegistry.js";
import type {
  MiroirTestRunFilter,
  TestSuiteListFilter,
} from "../0_interfaces/5-tests/miroirTestTypes";

const FILTER_META_KEYS = new Set(["testList", "match"]);

export type MiroirTestCliConfig = {
  suiteKeys: string[];
  executionMode: MiroirTestExecutionMode;
  filter?: MiroirTestRunFilter;
};

export type MiroirCoreTestVitestEntry =
  | "miroir-core-tests.unit.test"
  | "miroir-core-tests.integ.test";

/** Vitest entry file basename (without `.ts`) for miroir-core tests. */
export function miroirCoreTestVitestEntry(
  executionMode: MiroirTestExecutionMode,
): MiroirCoreTestVitestEntry {
  return executionMode === "integration"
    ? "miroir-core-tests.integ.test"
    : "miroir-core-tests.unit.test";
}

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

/**
 * Accepts either canonical `{ testList: { "<miroirTestLabel>": ["<leaf>", …] } }`
 * or shorthand `{ "<miroirTestLabel>": ["<leaf>", …] }` (documented CLI form).
 */
export function normalizeMiroirTestRunFilter(
  parsed: Record<string, unknown>,
): MiroirTestRunFilter {
  const hasTestList = Object.hasOwn(parsed, "testList");
  const hasMatch = Object.hasOwn(parsed, "match");
  const shorthandKeys = Object.keys(parsed).filter((key) => !FILTER_META_KEYS.has(key));

  if (hasTestList || hasMatch) {
    const result: MiroirTestRunFilter = {};
    if (hasTestList) {
      result.testList = parsed.testList as TestSuiteListFilter;
    }
    if (hasMatch) {
      result.match = parsed.match as RegExp;
    }
    if (shorthandKeys.length > 0) {
      const merged: Record<string, TestSuiteListFilter> =
        result.testList &&
        typeof result.testList === "object" &&
        !Array.isArray(result.testList)
          ? { ...(result.testList as Record<string, TestSuiteListFilter>) }
          : {};
      for (const key of shorthandKeys) {
        merged[key] = parsed[key] as TestSuiteListFilter;
      }
      result.testList = merged;
    }
    return result;
  }

  if (shorthandKeys.length > 0) {
    const testList: Record<string, TestSuiteListFilter> = {};
    for (const key of shorthandKeys) {
      testList[key] = parsed[key] as TestSuiteListFilter;
    }
    return { testList };
  }

  return parsed as MiroirTestRunFilter;
}

export function parseFilterJson(raw: string | undefined): MiroirTestRunFilter | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MIROIR_TEST_FILTER / --filter must be a JSON object");
  }
  return normalizeMiroirTestRunFilter(parsed as Record<string, unknown>);
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

/** Persistence store backends selectable via `--storage` / `-S` (argv-first CLI). */
export const MIROIR_TEST_STORAGE_TYPES = [
  "sql",
  "filesystem",
  "indexedDb",
  "mongodb",
] as const;

export type MiroirTestStorageType = (typeof MIROIR_TEST_STORAGE_TYPES)[number];

export function isMiroirTestStorageType(value: string): value is MiroirTestStorageType {
  return (MIROIR_TEST_STORAGE_TYPES as readonly string[]).includes(value);
}

/**
 * Parse `--storage value` / `-S value` from argv (does not mutate env).
 * Preferred over `MIROIR_TEST_STORAGE` / `MIROIR_TEST_APP_STORE_TYPE` — argv is the
 * main parameter surface; env remains for CI / legacy.
 */
export function parseStorageArg(argv: string[]): MiroirTestStorageType | undefined {
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--storage" || arg === "-S") {
      const value = argv[++index];
      if (value === undefined) {
        throw new Error(
          `Missing value for ${arg} (expected ${MIROIR_TEST_STORAGE_TYPES.join(" | ")})`,
        );
      }
      if (!isMiroirTestStorageType(value)) {
        throw new Error(
          `Invalid ${arg} "${value}" (expected ${MIROIR_TEST_STORAGE_TYPES.join(" | ")})`,
        );
      }
      return value;
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
  const mode = env.MIROIR_TEST_MODE;
  return mode === "integration" || mode === "integ" ? "integration" : "unit";
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
): MiroirTestCliConfig {
  return resolveMiroirTestCliConfigFromPartial(
    env,
    parseMiroirTestCliArgs(argv),
    listMiroirTestSuiteKeys(),
  );
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
