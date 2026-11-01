// #645: two copies of miroir-core in one realm warn, the record of copies is on globalThis.
// Vitest rather than MiroirTest: two module instances of the built core are not reachable through the ML.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import packageJson from "../../package.json";
import {
  MIROIR_CORE_INSTANCES,
  registerMiroirCoreInstance,
  type MiroirCoreInstance,
} from "../../src/3_controllers/duplicateCoreGuard";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const builtCore = join(packageRoot, "dist/index.js");
const guardSources = ["duplicateCoreGuard.ts", "ConfigurationService.ts"].map((file) =>
  join(packageRoot, "src/3_controllers", file),
);
const copies = join(packageRoot, "tests/tmp");
// one folder per run, so a core unit run and the nonreg step in the same checkout do not delete each other's copies
let runFolder = "";
let hrefA = "";
let hrefB = "";

const WARNING = "copies are loaded";

/** The parent's environment without what would change the child's behaviour or output (vitest, log presets). */
function childEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(VITEST|MIROIR_LOG_CONFIG|VITE_MIROIR_LOG_CONFIG)/.test(key)) continue;
    env[key] = value;
  }
  return { ...env, ...extra };
}

/** Imports the given specifiers in order in a fresh Node process; returns the record and stderr. */
function runFresh(specifiers: string[], extraEnv: Record<string, string> = {}) {
  const script =
    specifiers.map((specifier) => `await import(${JSON.stringify(specifier)});`).join("\n") +
    `\nconsole.log("RECORD:" + JSON.stringify(globalThis[Symbol.for("miroir-core.instances")] ?? null));`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: packageRoot,
    env: childEnv(extraEnv),
    encoding: "utf-8",
    timeout: 60_000,
  });
  expect(result.status, result.stderr).toBe(0);
  const recordLine = result.stdout.split("\n").find((line) => line.startsWith("RECORD:"));
  expect(recordLine, result.stdout).toBeDefined();
  return {
    record: JSON.parse(recordLine!.slice("RECORD:".length)) as MiroirCoreInstance[],
    stderr: result.stderr,
  };
}

describe("two copies of the built core, each case in a fresh Node process", () => {
  beforeAll(() => {
    const built = existsSync(builtCore) && readFileSync(builtCore, "utf-8").includes("miroir-core.instances");
    if (!built || guardSources.some((source) => statSync(builtCore).mtimeMs < statSync(source).mtimeMs)) {
      throw new Error("dist/index.js is older than the duplicate-core guard: rebuild core (npm run build -w miroir-core)");
    }
    mkdirSync(copies, { recursive: true });
    runFolder = mkdtempSync(join(copies, "645-"));
    const copyA = join(runFolder, "a/index.js");
    const copyB = join(runFolder, "b/index.js");
    for (const copy of [copyA, copyB]) {
      mkdirSync(dirname(copy), { recursive: true });
      copyFileSync(builtCore, copy);
    }
    hrefA = pathToFileURL(copyA).href;
    hrefB = pathToFileURL(copyB).href;
  });

  afterAll(() => {
    if (runFolder) rmSync(runFolder, { recursive: true, force: true });
  });

  it("one copy is recorded and prints nothing", () => {
    const { record, stderr } = runFresh([hrefA]);
    expect(record).toEqual([{ version: packageJson.version, location: hrefA }]);
    expect(stderr).not.toContain(WARNING);
  });

  it("a copy from a second folder warns, naming both copies", () => {
    const { record, stderr } = runFresh([hrefA, hrefB]);
    expect(record).toEqual([
      { version: packageJson.version, location: hrefA },
      { version: packageJson.version, location: hrefB },
    ]);
    const warnings = stderr.split("\n").filter((line) => line.includes(WARNING));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(`${packageJson.version} at ${hrefA}`);
    expect(warnings[0]).toContain(`${packageJson.version} at ${hrefB}`);
  });

  it("outside dev tooling, the same file evaluated again is a second copy", () => {
    const { record, stderr } = runFresh([hrefA, `${hrefA}?again`]);
    expect(record.map((instance) => instance.location)).toEqual([hrefA, hrefA]);
    expect(stderr).toContain(WARNING);
  });

  it("under vitest, the same file evaluated again is the same copy", () => {
    const { record, stderr } = runFresh([hrefA, `${hrefA}?again`], { VITEST: "true" });
    expect(record).toEqual([{ version: packageJson.version, location: hrefA }]);
    expect(stderr).not.toContain(WARNING);
  });
});

describe("registerMiroirCoreInstance", () => {
  function run(steps: { url: string | undefined; devTool: boolean }[], target: Record<symbol, unknown> = {}) {
    const warnings: string[] = [];
    for (const step of steps) {
      registerMiroirCoreInstance("1.2.3", step.url, step.devTool, target, (message) => warnings.push(message));
    }
    return { record: target[MIROIR_CORE_INSTANCES] as MiroirCoreInstance[], warnings };
  }

  it("records the location without query or hash, and unknown without a URL", () => {
    const { record, warnings } = run([
      { url: "file:///a/index.js?t=1#x", devTool: true },
      { url: undefined, devTool: true },
    ]);
    expect(record).toEqual([
      { version: "1.2.3", location: "file:///a/index.js" },
      { version: "1.2.3", location: "unknown" },
    ]);
    expect(warnings).toHaveLength(1);
  });

  it("under dev tooling, one location is one copy; a new location warns once, naming every copy", () => {
    const { record, warnings } = run([
      { url: "file:///a/index.js", devTool: true },
      { url: "file:///a/index.js?t=2", devTool: true },
      { url: "file:///b/index.js", devTool: true },
    ]);
    expect(record).toHaveLength(2);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("2 copies are loaded");
    expect(warnings[0]).toContain("1.2.3 at file:///a/index.js, 1.2.3 at file:///b/index.js");
  });

  it("outside dev tooling, every evaluation is a copy", () => {
    const { record, warnings } = run([
      { url: "file:///a/index.js", devTool: false },
      { url: "file:///a/index.js", devTool: false },
    ]);
    expect(record).toHaveLength(2);
    expect(warnings).toHaveLength(1);
  });

  it.each([
    ["another shape", { copies: 3 }],
    ["a frozen array", Object.freeze([] as MiroirCoreInstance[])],
    ["an array with an entry in another shape", [null]],
  ])("a record in %s is reported and left as it was, without throwing", (_label, foreign) => {
    const target: Record<symbol, unknown> = { [MIROIR_CORE_INSTANCES]: foreign };
    const warnings: string[] = [];
    expect(() =>
      registerMiroirCoreInstance("1.2.3", "file:///a/index.js", false, target, (message) => warnings.push(message)),
    ).not.toThrow();
    expect(target[MIROIR_CORE_INSTANCES]).toBe(foreign);
    expect(warnings).toEqual([expect.stringContaining("unrecognised record")]);
  });
});
