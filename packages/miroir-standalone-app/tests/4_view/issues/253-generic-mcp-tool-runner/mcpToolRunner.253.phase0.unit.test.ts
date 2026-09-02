import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  entityRunner,
  reportMiroirRunners,
  reportVersioning,
  runnerCreateEntity,
  runnerDeployApplication,
  runnerDropApplication,
  runnerDropEntity,
  runnerFreezeApplicationVersion,
  runnerMcpGetInstances,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import {
  lendDocument,
  mcpLendDocument,
  reportLibraryHome,
  returnDocument,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import { resolveRunnerDefinitionApplication } from "../../../../src/miroir-fwk/4_view/components/Runners/runnerDefinitionApplication.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "mcpToolRunner.253.phase0" ||
  RUN_TEST === "mcpToolRunner.253.phase0.unit.test";

const ENTITY_RUNNER_UUID = "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd";
const CREATE_APPLICATION_UUID = "bcc872dc-649a-410a-81bc-a8ad65f21e1c";

const REPO_ROOT = resolveRepoRoot();

type RunnerInstance = {
  uuid: string;
  name: string;
  definition: { runnerType: string };
};

type ReportSection = {
  type: string;
  definition?: { runnerReportSectionType?: string; label?: string; runner?: string };
};

function runnerTypeLiterals(): string[] {
  const union = entityRunner.mlSchema.definition.definition;
  expect(union.type).toBe("union");
  expect(union.discriminator).toBe("runnerType");
  return union.definition.map(
    (arm: { definition: { runnerType: { definition: string } } }) =>
      arm.definition.runnerType.definition,
  );
}

function runnerReportSections(report: { definition: { section: { definition: ReportSection[] } } }) {
  return report.definition.section.definition.filter(
    (section) => section.type === "runnerReportSection",
  );
}

function jsonFilesIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

const SKIP_WALK_DIRS = new Set(["node_modules", "dist", "graphify-out", ".git"]);

function collectRunnerInstanceFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) {
      return;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || SKIP_WALK_DIRS.has(entry.name)) {
        continue;
      }
      const full = join(dir, entry.name);
      if (entry.name === ENTITY_RUNNER_UUID) {
        found.push(...jsonFilesIn(full).map((name) => join(full, name)));
      } else {
        walk(full);
      }
    }
  };
  walk(root);
  return found.sort();
}

function readRunnerJson(relativePath: string): RunnerInstance {
  return JSON.parse(readFileSync(join(REPO_ROOT, relativePath), "utf8")) as RunnerInstance;
}

const runnerCreateApplication = readRunnerJson(
  `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/${CREATE_APPLICATION_UUID}.json`,
);

const EXPECTED_RUNNERS: { name: string; runnerType: string; uuid: string }[] = [
  { name: "dropApplication", runnerType: "customRunner", uuid: "1cd065d8-dfb0-466f-974c-e81e993f2c66" },
  { name: "freezeApplicationVersion", runnerType: "customRunner", uuid: "20d51c4c-52e5-4077-baf3-5e87bd75e496" },
  { name: "dropEntity", runnerType: "customRunner", uuid: "44313751-b0e5-4132-bb12-a544806e759b" },
  { name: "deployApplication", runnerType: "customRunner", uuid: "4f3cd0b1-08a1-421c-84f7-e0589be88d18" },
  { name: "createEntity", runnerType: "customRunner", uuid: "82f81a25-2366-4abf-8a97-83ca5e9a9c46" },
  { name: "createApplication", runnerType: "customRunner", uuid: CREATE_APPLICATION_UUID },
  { name: "mcpGetInstances", runnerType: "mcpToolRunner", uuid: "897e9711-65a0-414e-9773-19de92ade533" },
  { name: "returnDocument", runnerType: "actionRunner", uuid: "98a38a84-e702-4540-a056-c7676a193a2b" },
  { name: "lendDocument", runnerType: "actionRunner", uuid: "cc853632-f158-43fa-b9ed-437c9c25f539" },
  { name: "mcpLendDocument", runnerType: "mcpToolRunner", uuid: "dbb39e31-5c7d-4473-9adb-5286e2972e46" },
];

const MIROIR_DATA_RUNNER_INSTANCES: RunnerInstance[] = [
  runnerDropApplication,
  runnerFreezeApplicationVersion,
  runnerDropEntity,
  runnerDeployApplication,
  runnerCreateEntity,
  runnerCreateApplication,
  runnerMcpGetInstances,
];

describe.skipIf(!shouldRun)("mcpToolRunner #253 phase0 — current contracts", () => {
  it("Runner Entity union has customRunner | actionRunner | mcpToolRunner", () => {
    expect(entityRunner.uuid).toBe(ENTITY_RUNNER_UUID);
    expect(runnerTypeLiterals()).toEqual(["customRunner", "actionRunner", "mcpToolRunner"]);
  });

  it("exactly 10 Runner instances including mcpGetInstances and mcpLendDocument", () => {
    const imported: RunnerInstance[] = [
      runnerDropApplication,
      runnerFreezeApplicationVersion,
      runnerDropEntity,
      runnerDeployApplication,
      runnerCreateEntity,
      runnerCreateApplication,
      runnerMcpGetInstances,
      returnDocument,
      lendDocument,
      mcpLendDocument,
    ];

    expect(
      imported
        .map((runner) => ({
          name: runner.name,
          runnerType: runner.definition.runnerType,
          uuid: runner.uuid,
        }))
        .sort((left, right) => left.uuid.localeCompare(right.uuid)),
    ).toEqual([...EXPECTED_RUNNERS].sort((left, right) => left.uuid.localeCompare(right.uuid)));

    const sourceTrees = [
      "packages/miroir-test-app_deployment-miroir/assets",
      "packages/miroir-test-app_deployment-library/assets",
      "packages/miroir-test-app_deployment-admin/assets",
      "packages/miroir-standalone-app/tests/assets",
    ];
    const instanceFiles = sourceTrees
      .flatMap((tree) => collectRunnerInstanceFiles(join(REPO_ROOT, tree)))
      .map((absolute) => relative(REPO_ROOT, absolute).replaceAll("\\", "/"))
      .sort();
    expect(instanceFiles).toEqual([
      `packages/miroir-test-app_deployment-library/assets/library_model/${ENTITY_RUNNER_UUID}/98a38a84-e702-4540-a056-c7676a193a2b.json`,
      `packages/miroir-test-app_deployment-library/assets/library_model/${ENTITY_RUNNER_UUID}/cc853632-f158-43fa-b9ed-437c9c25f539.json`,
      `packages/miroir-test-app_deployment-library/assets/library_model/${ENTITY_RUNNER_UUID}/dbb39e31-5c7d-4473-9adb-5286e2972e46.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/1cd065d8-dfb0-466f-974c-e81e993f2c66.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/20d51c4c-52e5-4077-baf3-5e87bd75e496.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/44313751-b0e5-4132-bb12-a544806e759b.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/4f3cd0b1-08a1-421c-84f7-e0589be88d18.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/82f81a25-2366-4abf-8a97-83ca5e9a9c46.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/897e9711-65a0-414e-9773-19de92ade533.json`,
      `packages/miroir-test-app_deployment-miroir/assets/miroir_data/${ENTITY_RUNNER_UUID}/${CREATE_APPLICATION_UUID}.json`,
    ]);
  });

  it("MIROIR_DATA_RUNNER_UUIDS has exactly the 7 Miroir-data runner uuids", () => {
    const miroirDataUuids = MIROIR_DATA_RUNNER_INSTANCES.map((runner) => runner.uuid);
    expect(miroirDataUuids).toHaveLength(7);
    expect(new Set(miroirDataUuids).size).toBe(7);

    const libraryPage = selfApplicationLibrary.uuid;
    for (const uuid of miroirDataUuids) {
      expect(resolveRunnerDefinitionApplication(libraryPage, uuid)).toBe(
        selfApplicationMiroir.uuid,
      );
    }
    expect(resolveRunnerDefinitionApplication(libraryPage, lendDocument.uuid)).toBe(libraryPage);
    expect(resolveRunnerDefinitionApplication(libraryPage, mcpLendDocument.uuid)).toBe(
      libraryPage,
    );
    expect(resolveRunnerDefinitionApplication(libraryPage, returnDocument.uuid)).toBe(
      libraryPage,
    );
    expect(
      resolveRunnerDefinitionApplication(libraryPage, "00000000-0000-4000-8000-000000000000"),
    ).toBe(libraryPage);
  });

  it("execute reports have 6 + 3 + 1 runnerReportSections", () => {
    const miroirRunnerSections = runnerReportSections(reportMiroirRunners);
    expect(miroirRunnerSections).toHaveLength(6);
    expect(miroirRunnerSections.map((section) => section.definition)).toEqual([
      {
        runnerReportSectionType: "storedRunner",
        label: "deployApplication",
        runner: runnerDeployApplication.uuid,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "createApplication",
        runner: CREATE_APPLICATION_UUID,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "dropApplication",
        runner: runnerDropApplication.uuid,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "dropEntity",
        runner: runnerDropEntity.uuid,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "createEntity",
        runner: runnerCreateEntity.uuid,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "MCP: getInstances",
        runner: runnerMcpGetInstances.uuid,
      },
    ]);

    const libraryHomeSections = runnerReportSections(reportLibraryHome);
    expect(libraryHomeSections).toHaveLength(3);
    expect(libraryHomeSections.map((section) => section.definition)).toEqual([
      {
        runnerReportSectionType: "storedRunner",
        label: "lendBook",
        runner: lendDocument.uuid,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "returnBook",
        runner: returnDocument.uuid,
      },
      {
        runnerReportSectionType: "storedRunner",
        label: "MCP: lendDocument",
        runner: mcpLendDocument.uuid,
      },
    ]);

    const versioningSections = runnerReportSections(reportVersioning);
    expect(versioningSections).toHaveLength(1);
    expect(versioningSections[0]?.definition).toEqual({
      runnerReportSectionType: "storedRunner",
      label: "freezeApplicationVersion",
      runner: runnerFreezeApplicationVersion.uuid,
    });
  });

  it("browser MCP runner modules import miroir-mcp/client, not the Node CLI entry", () => {
    const viewRoot = join(
      REPO_ROOT,
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners",
    );
    const runMcp = readFileSync(join(viewRoot, "runMcpToolRunner.ts"), "utf8");
    const resolveMcp = readFileSync(join(viewRoot, "resolveMcpToolAction.ts"), "utf8");
    expect(runMcp).toMatch(/from ["']miroir-mcp\/client["']/);
    expect(resolveMcp).toMatch(/from ["']miroir-mcp\/client["']/);
    expect(runMcp).not.toMatch(/from ["']miroir-mcp["']/);
    expect(resolveMcp).not.toMatch(/from ["']miroir-mcp["']/);

    const runnerTestSession = readFileSync(
      join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4-tests/RunnerTestSession.ts"),
      "utf8",
    );
    expect(runnerTestSession).not.toMatch(/from ["']miroir-mcp["']/);
  });

  it("vite.config.js server.proxy includes /mcp", () => {
    const viteConfig = readFileSync(
      join(REPO_ROOT, "packages/miroir-standalone-app/vite.config.js"),
      "utf8",
    );
    const proxyBlock = viteConfig.match(/proxy:\s*\{([\s\S]*?)\n\s*\}/);
    expect(proxyBlock).not.toBeNull();
    const proxyKeys = [...(proxyBlock?.[1] ?? "").matchAll(/['"](\/[^'"]+)['"]/g)].map(
      (match) => match[1],
    );
    expect(proxyKeys).toEqual([
      "/queryTemplate",
      "/query",
      "/action",
      "/CRUD",
      "/api/copilotkit",
      "/mcp",
    ]);
    expect(proxyKeys).toContain("/mcp");
  });
});
