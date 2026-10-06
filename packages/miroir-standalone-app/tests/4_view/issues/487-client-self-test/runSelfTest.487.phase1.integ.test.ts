/**
 * #487 Slice 1 (tracer): the `self-test` environment carries `client.selfTest` into the client
 * configuration, and `runSelfTest` loads Admin and the miroir deployment only, reads the miroir app's
 * MiroirTests from the local cache, runs the `unit` ones and returns `passed`.
 *
 * The run boots on `test-filesystem` (tests never run on a non-test environment), with the
 * `client.selfTest` of `self-test`; `bootEnvironment` plays the server's boot, as miroir-server and
 * the Electron main process do.
 *
 * Run:
 *   RUN_TEST=runSelfTest.487.phase1.integ npm run testByFile -w miroir-standalone-app -- runSelfTest.487.phase1.integ
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "process";
import { beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type MiroirConfigClient,
} from "miroir-core";
import {
  bootEnvironment,
  environmentClientConfig,
  environmentRealServerClientConfig,
  resolveEnvironmentFromFiles,
} from "miroir-env";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { setupMiroirTest } from "../../../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { runSelfTest } from "../../../../src/miroir-fwk/4-tests/selfTest/runSelfTest.js";
import type { MiroirSelfTestResult } from "../../../../src/miroir-fwk/4-tests/selfTest/selfTestResult.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import { openTestEnvironment } from "../../../helpers/testEnvironment.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
  defaultLevel: "WARN",
  specificLoggerOptions: {},
} as any);

const repositoryRoot = resolveRepoRoot();
const selfTestEnvironment = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "self-test" } });

/** The `unit`-tagged MiroirTests of the miroir app, read from its assets. */
function unitMiroirTestCount(): number {
  const directory = path.join(
    repositoryRoot,
    "packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
  );
  return readdirSync(directory).filter((file) => {
    const instance = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    return (instance.tags ?? []).includes("unit");
  }).length;
}

describe("self-test environment (#487)", () => {
  it("carries client.selfTest into both client configurations", () => {
    const expected = { enabled: true, tags: ["unit"] };
    expect(environmentClientConfig(selfTestEnvironment).selfTest).toEqual(expected);
    expect(environmentRealServerClientConfig(selfTestEnvironment).selfTest).toEqual(expected);
  });

  it("installs miroir and Admin only, with authentication off", () => {
    expect(selfTestEnvironment.deployments.map((deployment) => deployment.applicationKey).sort()).toEqual([
      "admin",
      "miroir",
    ]);
    expect(selfTestEnvironment.environment.server?.authentication?.enabled).toBe(false);
  });
});

describe("runSelfTest (#487)", () => {
  let domainController: DomainControllerInterface;
  let result: MiroirSelfTestResult;

  beforeAll(async () => {
    const testEnvironment = openTestEnvironment("test-filesystem");
    const miroirConfig: MiroirConfigClient = {
      ...testEnvironment.miroirConfig,
      selfTest: selfTestEnvironment.environment.client?.selfTest,
    };
    const wired = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService);
    await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
    domainController = wired.domainControllerForClient;

    result = await runSelfTest({ domainController, miroirConfig, tracker: miroirActivityTracker });
  }, 300000);

  it("passes on the miroir app's unit MiroirTests", () => {
    expect(result.failures, JSON.stringify(result.failures, null, 2)).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result.verdict).toBe("passed");
    expect(result.tags).toEqual(["unit"]);
    expect(result.environment).toBe("test-filesystem");
    expect(result.counts?.suites).toBe(unitMiroirTestCount());
    expect(result.counts?.failed).toBe(0);
  });

  it("loads Admin and the miroir deployment only", () => {
    const loadedDeployments = Object.keys(domainController.getLocalCache().getDomainState());
    expect(new Set(loadedDeployments)).toEqual(new Set([deployment_Admin.uuid, deployment_Miroir.uuid]));
  });
});
