import type {
  MiroirTestExecutionMode,
  MiroirTestRunFilter,
} from "../../src/4_services/MiroirTestTools";
import { listMiroirTestSuiteKeys } from "./miroirTestSuiteRegistry";

export type MiroirTestCliConfig = {
  suiteKeys: string[];
  executionMode: MiroirTestExecutionMode;
  filter?: MiroirTestRunFilter;
};

export type MiroirTestCliParseResult = MiroirTestCliConfig & {
  /** Vitest entry file to run for the selected execution mode. */
  vitestEntry: "miroir-tests.unit.test" | "miroir-tests.integ.test";
};

const ALL_SUITES_SENTINEL = "*";

function splitSuiteKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

/** Empty list or `*` means every registered MiroirTest suite. */
export function resolveMiroirTestSuiteKeys(rawKeys: string[]): string[] {
  if (rawKeys.length === 0 || rawKeys.includes(ALL_SUITES_SENTINEL)) {
    return listMiroirTestSuiteKeys();
  }
  return rawKeys;
}

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

/** Parse `--flag value` pairs from argv (does not mutate env). */
export function parseMiroirTestCliArgs(argv: string[]): Partial<MiroirTestCliConfig> {
  const result: Partial<MiroirTestCliConfig> = {};

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--suites" || arg === "-s") {
      result.suiteKeys = splitSuiteKeys(argv[++index]);
    } else if (arg === "--mode" || arg === "-m") {
      const mode = argv[++index] as MiroirTestExecutionMode;
      if (mode !== "unit" && mode !== "integration") {
        throw new Error(`Invalid --mode "${mode}" (expected unit or integration)`);
      }
      result.executionMode = mode;
    } else if (arg === "--filter" || arg === "-f") {
      result.filter = parseFilterJson(argv[++index]);
    }
  }

  return result;
}

/**
 * Resolve CLI config from npm args (highest priority) and env vars (CI).
 * When no suites are specified, or `*` is given, all registered suites are selected.
 */
export function parseMiroirTestCliConfig(
  env: NodeJS.ProcessEnv = process.env,
  argv: string[] = process.argv.slice(2),
): MiroirTestCliParseResult {
  const fromArgs = parseMiroirTestCliArgs(argv);

  const suiteKeys = resolveMiroirTestSuiteKeys(
    fromArgs.suiteKeys ??
      splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE),
  );

  const executionMode: MiroirTestExecutionMode =
    fromArgs.executionMode ??
    (env.MIROIR_TEST_MODE === "integration" ? "integration" : "unit");

  const filter =
    fromArgs.filter ?? parseFilterJson(env.MIROIR_TEST_FILTER);

  return {
    suiteKeys,
    executionMode,
    filter,
    vitestEntry:
      executionMode === "integration" ? "miroir-tests.integ.test" : "miroir-tests.unit.test",
  };
}

/** Build env overrides for `scripts/test-miroir.ts` after parsing raw CLI args. */
export function miroirTestCliConfigToEnv(config: MiroirTestCliConfig): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    MIROIR_TEST_MODE: config.executionMode,
  };
  const allSuiteKeys = listMiroirTestSuiteKeys();
  if (
    config.suiteKeys.length === allSuiteKeys.length &&
    allSuiteKeys.every((key) => config.suiteKeys.includes(key))
  ) {
    env.MIROIR_TEST_SUITES = ALL_SUITES_SENTINEL;
  } else if (config.suiteKeys.length) {
    env.MIROIR_TEST_SUITES = config.suiteKeys.join(",");
  }
  if (config.filter !== undefined) {
    env.MIROIR_TEST_FILTER = JSON.stringify(config.filter);
  }
  return env;
}
