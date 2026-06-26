import "@testing-library/jest-dom";
import * as vitest from "vitest";
import { expect } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  miroirCoreStartup,
  runMiroirTests,
  type LoggerInterface,
  type LoggerOptions,
  parseMiroirRunnerTestCliConfig,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { env } from "process";
import { loglevelnext } from "../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../src/startup.js";
import { loadTestConfigFiles } from "./utils/fileTools.js";
import { runMiroirRunnerTestsFromCLI } from "./helpers/runMiroirRunnerTestsFromCLI.js";
import { RunnerTestSession } from "./helpers/RunnerTestSession.js";

const pageLabel = "miroir-runner-tests.integ";

let log: LoggerInterface = console as unknown as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel),
).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const config = parseMiroirRunnerTestCliConfig(process.env, process.argv.slice(2));
const { miroirConfig, logConfig } = await loadTestConfigFiles(env);
const loggerOptions = logConfig as LoggerOptions;

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);
log.info("miroir-runner-tests.integ started", JSON.stringify(config, null, 2));

if (config.suiteKeys.length > 0) {
  const testSession = new RunnerTestSession({
    miroirConfig,
    miroirActivityTracker,
    miroirEventService,
  });

  await runMiroirRunnerTestsFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
