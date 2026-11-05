/**
 * #679: the setup shared by the Git action tests. The Library deployment of `test-filesystem` is a copy
 * in .miroir/test-filesystem/library/{model,data,modelVersion}; the tests make that folder a Git
 * repository (with isomorphic-git, so no Git binary is needed) and dispatch `gitAction_*` to the real
 * client DomainController, which forwards them to the in-process server.
 *
 * Not reachable through MiroirTest: each test creates a repository on disk before the action runs.
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import { expect } from "vitest";

import {
  Action2Error,
  ConfigurationService,
  GIT_ENDPOINT_UUID,
  getClientEnvironment,
  getProcessCapabilities,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type Action2ReturnType,
  type AuthPrincipal,
  type DomainControllerInterface,
  type GitActionType,
  type MiroirConfigForClientStub,
  type ProcessCapabilities,
  type StoreSectionConfiguration,
} from "@miroir-framework/core";
import { bootEnvironment } from "@miroir-framework/env";
import { fetchMiroirAndAppConfigurations } from "@miroir-framework/react";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";
import { setupMiroirTest } from "miroir-react-testing/src/4-tests/setupMiroirTest.js";

import { loglevelnext } from "../../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../../src/startup.js";
import { openTestEnvironment } from "../../helpers/testEnvironment.js";

export const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
export const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
export const MIROIR_APPLICATION = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
export const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
export const BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
export const BOOK_UBIK = "03ffcae1-b83f-4970-b3d9-04780d3d0780";
export const TEST_AUTHOR = { name: "Miroir Test", email: "miroir-test@example.com" };

export const applicationDeploymentMap = {
  [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT,
  [LIBRARY_APPLICATION]: LIBRARY_DEPLOYMENT,
};

export type GitTestContext = {
  domainController: DomainControllerInterface;
  serverDomainController: DomainControllerInterface;
  /** Absolute folder of the Library copy: the repository root. */
  libraryRoot: string;
  /** Absolute folder of each Library section. */
  sectionDirectory: (section: "model" | "data" | "modelVersion") => string;
  baseCapabilities: ProcessCapabilities;
  /** How many times the registered Git loader ran. */
  loaderCalls: () => number;
};

let started = false;
let loaderCallCount = 0;

/** Startup of the test process: the same registrations a server makes, with a counted Git loader. */
export function startGitTestProcess(): void {
  if (started) {
    return;
  }
  started = true;
  miroirAppStartup();
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });
  ConfigurationService.configurationService.registerGitRepositoryFactory(() => {
    loaderCallCount += 1;
    return import("@miroir-framework/git-isomorphic").then((m) => m.createGitRepositoryFactory());
  });
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
    defaultLevel: "WARN",
    specificLoggerOptions: {},
  } as any);
}

export async function openGitTestContext(): Promise<GitTestContext> {
  startGitTestProcess();
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const testEnvironment = openTestEnvironment("test-filesystem");
  const wired = await setupMiroirTest(testEnvironment.miroirConfig, miroirActivityTracker, miroirEventService);
  await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
  const loaded = await fetchMiroirAndAppConfigurations({
    domainController: wired.domainControllerForClient,
    miroirConfig: testEnvironment.miroirConfig,
  });
  expect(loaded?.status, "the configurations load").not.toBe("error");
  const client = testEnvironment.miroirConfig.client as MiroirConfigForClientStub;
  const sectionDirectory = (section: "model" | "data" | "modelVersion") => {
    const configuration = client.deploymentStorageConfig[LIBRARY_DEPLOYMENT][section] as StoreSectionConfiguration & {
      directory: string;
    };
    return path.resolve(client.filesystemDeploymentRootDirectory, configuration.directory);
  };
  const baseCapabilities = getProcessCapabilities({
    config: {},
    environment: getClientEnvironment(),
    storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
    adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
  });
  return {
    domainController: wired.domainControllerForClient,
    serverDomainController: wired.domainControllerForServer!,
    libraryRoot: path.dirname(sectionDirectory("model")),
    sectionDirectory,
    baseCapabilities,
    loaderCalls: () => loaderCallCount,
  };
}

export function setGitCapability(context: GitTestContext, on: boolean): void {
  context.serverDomainController.setProcessCapabilities({ ...context.baseCapabilities, git: on });
}

/** The section folders of the Library copy; the seeding of the test environment rewrites only these. */
const SECTION_FOLDERS = new Set(["model", "data", "modelVersion", "devData"]);

/**
 * Makes `root` a fresh repository holding one commit of every section file. Whatever an earlier test file
 * left next to the sections (a `.git`, other files) is removed first.
 */
export async function initCommittedRepository(root: string, message = "initial"): Promise<string> {
  for (const entry of fs.readdirSync(root)) {
    if (!SECTION_FOLDERS.has(entry)) {
      fs.rmSync(path.join(root, entry), { recursive: true, force: true });
    }
  }
  await git.init({ fs, dir: root, defaultBranch: "main" });
  const files = await git.statusMatrix({ fs, dir: root });
  for (const [filepath] of files) {
    await git.add({ fs, dir: root, filepath });
  }
  return git.commit({ fs, dir: root, message, author: TEST_AUTHOR });
}

export function gitAction(
  context: GitTestContext,
  actionType: GitActionType,
  payload: Record<string, unknown> = {},
): Promise<Action2ReturnType> {
  return context.domainController.handleAction(
    {
      actionType,
      endpoint: GIT_ENDPOINT_UUID,
      payload: { application: LIBRARY_APPLICATION, ...payload },
    } as any,
    applicationDeploymentMap,
  );
}

/** Runs a Git action on the server's DomainController directly, as the server does for a logged-in user. */
export function gitActionOnServer(
  context: GitTestContext,
  actionType: GitActionType,
  payload: Record<string, unknown>,
  principal: AuthPrincipal,
): Promise<Action2ReturnType> {
  return context.serverDomainController.handleAction(
    {
      actionType,
      endpoint: GIT_ENDPOINT_UUID,
      payload: { application: LIBRARY_APPLICATION, ...payload },
    } as any,
    applicationDeploymentMap,
    undefined,
    undefined,
    undefined,
    principal,
  );
}

/** The path of a Book instance file, relative to the repository root. */
export function bookPath(bookUuid: string): string {
  return `data/${BOOK_ENTITY}/${bookUuid}.json`;
}

/** Modification times handed out by `editUbik`, two seconds apart and ahead of the clock. */
let editClock = Math.floor(Date.now() / 1000) + 10;

/**
 * Rewrites the Ubik Book file with `changes` applied. Its modification time moves two seconds on each
 * time: isomorphic-git compares whole seconds and sizes with the index, so an edit of the same size in the
 * second the file was staged would look unchanged (racy Git), which a person at the page never hits.
 */
export function editUbik(context: GitTestContext, changes: Record<string, unknown>): void {
  const file = path.join(context.libraryRoot, bookPath(BOOK_UBIK));
  writeWorkTreeFile(
    context,
    bookPath(BOOK_UBIK),
    JSON.stringify({ ...JSON.parse(fs.readFileSync(file, "utf8")), ...changes }, undefined, 2),
  );
}

/** Writes a file of the Library repository, moving its modification time on as `editUbik` does. */
export function writeWorkTreeFile(context: GitTestContext, relativePath: string, text: string): void {
  const file = path.join(context.libraryRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  fs.utimesSync(file, editClock, editClock);
  editClock += 2;
}

export function expectOk<T>(result: Action2ReturnType): T {
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
  expect((result as any).status, JSON.stringify(result)).toBe("ok");
  return (result as any).returnedDomainElement as T;
}

export function expectGitError(result: Action2ReturnType, reason: string): Action2Error {
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
  expect((result as Action2Error).errorContext?.reason, JSON.stringify(result)).toBe(reason);
  return result as Action2Error;
}
