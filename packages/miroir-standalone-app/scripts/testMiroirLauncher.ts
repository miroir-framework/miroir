import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  miroirTestSuiteMountsReport,
  MIROIR_RUNNER_TEST_VITEST_ENTRY,
  parseMiroirRunnerTestCliConfig,
  parseMiroirTestCliArgs,
  parseProfileArg,
  resolveMiroirTestCliConfigFromPartial,
  splitSuiteKeys,
  splitTags,
  walkMiroirTestLeaves,
} from "miroir-core";
import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  listCliTransformerIntegrationSuiteKeysFromFolders,
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
  resolveCliSuiteKeysFromCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import { applyIntegrationTestProfile } from "../tests/helpers/integrationTestProfiles.js";

const ALL_SUITES_JOKER = "*";

/**
 * #318: opt-in shared entry for runner/action suites. Each suite gets its own session inside
 * its own `describe`, so several suites can share one vitest launch. The legacy entry
 * (MIROIR_RUNNER_TEST_VITEST_ENTRY) stays the default.
 */
export const MIROIR_RUNNER_TEST_SHARED_VITEST_ENTRY = "miroir-runner-tests-shared.integ.test";
export const SHARED_RUNNER_FLAG = "--shared";

/**
 * #330: entry of the Report suites (a `reportTest` leaf mounts a Report), in a DOM environment.
 * Like the shared entry, each suite gets its own session, so `--shared` changes nothing there.
 */
export const MIROIR_REPORT_TEST_VITEST_ENTRY = "miroir-report-tests.integ.test";

/**
 * #406: entry of the component suites (a `reactComponentTest` leaf mounts a React component), in a
 * DOM environment. It runs the suites named by `MIROIR_TEST_SUITES`, all of them without it.
 */
export const MIROIR_COMPONENT_TEST_VITEST_ENTRY = "miroir-component-tests.unit.test";

/** The selected suites that mount a React component (#406), refusing a selection mixing them with others. */
function componentSuiteKeys(
  suiteKeys: string[],
  catalog: ReturnType<typeof loadApplicationMiroirTestCatalog>,
): string[] {
  const componentKeys = suiteKeys.filter((key) => {
    const entry = catalog.find((catalogEntry) => catalogEntry.suiteKey === key);
    return (
      entry !== undefined &&
      walkMiroirTestLeaves(entry.suiteDefinition).some((leaf) => leaf.miroirTestType === "reactComponentTest")
    );
  });
  if (componentKeys.length > 0 && componentKeys.length < suiteKeys.length) {
    throw new Error(
      `the selection has both component suites (${componentKeys.join(", ")}) and other suites (${suiteKeys
        .filter((key) => !componentKeys.includes(key))
        .join(", ")}); they run in different entries: launch them separately`,
    );
  }
  return componentKeys;
}

/**
 * The entry of the selected runner / action / Report suites, and the suites it runs: Report
 * suites run in their own DOM entry, the others in the node entries (legacy, or shared with
 * `--shared`). A selection naming both kinds (`--suites`, `--tags`) is refused. The implicit
 * selection of every suite (no `--suites`, or `*`) runs the runner / action suites and leaves out
 * the Report suites, with a warning.
 */
function runnerOrReportVitestEntry(
  suiteKeys: string[],
  catalog: ReturnType<typeof loadApplicationMiroirTestCatalog>,
  argv: string[],
  implicitSelection: boolean,
): { vitestEntry: string; suiteKeys: string[] } {
  const reportSuiteKeys = suiteKeys.filter((key) => {
    const entry = catalog.find((catalogEntry) => catalogEntry.suiteKey === key);
    return entry !== undefined && miroirTestSuiteMountsReport(entry.suiteDefinition);
  });
  const otherKeys = suiteKeys.filter((key) => !reportSuiteKeys.includes(key));
  if (reportSuiteKeys.length > 0 && otherKeys.length === 0) {
    return { vitestEntry: MIROIR_REPORT_TEST_VITEST_ENTRY, suiteKeys };
  }
  if (reportSuiteKeys.length > 0) {
    if (!implicitSelection) {
      throw new Error(
        `the selection has both Report suites (${reportSuiteKeys.join(", ")}) and runner / action suites (${otherKeys.join(", ")}); they run in different entries: launch them separately`,
      );
    }
    console.warn(
      `testMiroir: the Report suites (${reportSuiteKeys.join(", ")}) run in their own entry and are left out of this run: launch them with --suites`,
    );
  }
  return {
    vitestEntry: argv.includes(SHARED_RUNNER_FLAG)
      ? MIROIR_RUNNER_TEST_SHARED_VITEST_ENTRY
      : MIROIR_RUNNER_TEST_VITEST_ENTRY,
    suiteKeys: otherKeys,
  };
}

/** Vitest reporter arguments given to testMiroir, forwarded as is (used by run-nonreg.py --runner shared). */
export function forwardedVitestArgs(argv: string[]): string[] {
  return argv.filter((arg) => arg.startsWith("--reporter=") || arg.startsWith("--outputFile"));
}

function resolveRequestedSuiteKeys(
  env: NodeJS.ProcessEnv,
  argv: string[],
): string[] {
  const fromArgs = parseMiroirTestCliArgs(argv, { integModeAlias: true });
  return fromArgs.suiteKeys ?? splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE);
}

function resolveRequestedTags(env: NodeJS.ProcessEnv, argv: string[]): string[] | undefined {
  return parseMiroirTestCliArgs(argv, { integModeAlias: true }).tags ?? splitTags(env.MIROIR_TEST_TAGS);
}

export function resolveVitestEntry(
  env: NodeJS.ProcessEnv,
  argv: string[],
): { vitestEntry: string; spawnEnv: NodeJS.ProcessEnv } {
  const catalog = loadApplicationMiroirTestCatalog();
  const unitKeys = listCliUnitSuiteKeysFromFolders();
  const transformerIntegKeys = listCliTransformerIntegrationSuiteKeysFromFolders();
  const runnerKeys = listCliRunnerIntegrationSuiteKeysFromFolders();
  const coreKeys = new Set([...unitKeys, ...transformerIntegKeys]);

  const requestedSuiteKeys = resolveRequestedSuiteKeys(env, argv);
  const requestedTags = resolveRequestedTags(env, argv);
  const explicitRequest =
    requestedSuiteKeys.length > 0 && !requestedSuiteKeys.includes(ALL_SUITES_JOKER);
  // #312: tags pick among the suites this launcher can run (integration-capable ones),
  // before routing, so the chosen entry gets an explicit suite list.
  const selectedSuiteKeys = requestedTags?.length
    ? resolveCliSuiteKeysFromCatalog(
        requestedSuiteKeys,
        [...transformerIntegKeys, ...runnerKeys],
        catalog,
        requestedTags,
      )
    : explicitRequest
      ? resolveCliSuiteKeysFromCatalog(requestedSuiteKeys, [...coreKeys, ...runnerKeys], catalog)
      : requestedSuiteKeys;

  // tags select among the integration-capable suites only, so only --suites names component suites
  if (explicitRequest && !requestedTags?.length) {
    const selectedComponentKeys = componentSuiteKeys(selectedSuiteKeys, catalog);
    if (selectedComponentKeys.length > 0) {
      return {
        vitestEntry: MIROIR_COMPONENT_TEST_VITEST_ENTRY,
        spawnEnv: { ...env, MIROIR_TEST_SUITES: selectedComponentKeys.join(",") },
      };
    }
  }

  if (requestedTags?.length) {
    const selectedCoreKeys = selectedSuiteKeys.filter((key) => coreKeys.has(key));
    const selectedRunnerKeys = selectedSuiteKeys.filter((key) => !coreKeys.has(key));
    if (selectedCoreKeys.length > 0 && selectedRunnerKeys.length > 0) {
      throw new Error(
        `--tags ${requestedTags.join(",")} selects both core suites (${selectedCoreKeys.join(", ")}) and runner suites (${selectedRunnerKeys.join(", ")}); they run in different entries: narrow the tags or add --suites`,
      );
    }
  }

  if (
    selectedSuiteKeys.length > 0 &&
    !selectedSuiteKeys.includes(ALL_SUITES_JOKER) &&
    selectedSuiteKeys.every((key) => coreKeys.has(key))
  ) {
    const coreConfig = resolveMiroirTestCliConfigFromPartial(
      env,
      parseMiroirTestCliArgs(argv, { integModeAlias: true }),
      unitKeys,
    );
    if (coreConfig.executionMode !== "integration") {
      throw new Error(
        "miroir-core integration suites require MIROIR_TEST_MODE=integ (or integration)",
      );
    }
    const resolvedCoreConfig = { ...coreConfig, suiteKeys: selectedSuiteKeys };
    return {
      vitestEntry: miroirCoreTestVitestEntry(resolvedCoreConfig.executionMode),
      spawnEnv: {
        ...env,
        ...miroirTestCliConfigToEnv(resolvedCoreConfig),
        MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0",
      },
    };
  }

  const runnerConfig = parseMiroirRunnerTestCliConfig(env, argv, runnerKeys);
  const { vitestEntry, suiteKeys } = runnerOrReportVitestEntry(
    requestedTags?.length
      ? selectedSuiteKeys
      : resolveCliSuiteKeysFromCatalog(runnerConfig.suiteKeys, runnerKeys, catalog),
    catalog,
    argv,
    !explicitRequest && !requestedTags?.length,
  );
  const resolvedRunnerConfig = { ...runnerConfig, suiteKeys };
  return {
    vitestEntry,
    spawnEnv: {
      ...env,
      ...miroirTestCliConfigToEnv(resolvedRunnerConfig),
      MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0",
    },
  };
}

/** Apply `--profile` to process.env, then resolve vitest entry + spawn env (Gap D1). */
export function prepareTestMiroirLaunch(
  env: NodeJS.ProcessEnv,
  argv: string[],
): { vitestEntry: string; spawnEnv: NodeJS.ProcessEnv } {
  applyIntegrationTestProfile(parseProfileArg(argv));
  return resolveVitestEntry(env, argv);
}
