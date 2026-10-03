/**
 * #323: ncc used to rewrite the server's config file read into a build-time copy next to the
 * bundle. Bundles a probe that reads the config like server.ts, then runs it from another folder.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("serverConfigFile");

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROBE_ENTRY = join(TEST_DIR, "support", "configFileBundleProbe.ts");
const NCC_CLI = join(dirname(createRequire(import.meta.url).resolve("@vercel/ncc/package.json")), "dist", "ncc", "cli.js");

describe.runIf(runThis)("ncc bundle reads the selected server config file (#323)", () => {
  let root: string;
  let bundleDir: string;
  let workDir: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "miroir-323-"));
    bundleDir = join(root, "release");
    workDir = join(root, "work");
    mkdirSync(workDir);
    const build = spawnSync(process.execPath, [NCC_CLI, "build", PROBE_ENTRY, "-o", bundleDir, "--quiet"], {
      encoding: "utf8",
    });
    expect(build.status, build.stderr).toBe(0);
  }, 120000);

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function runBundle(args: string[]): string {
    const run = spawnSync(process.execPath, [join(bundleDir, "index.js"), ...args], { cwd: workDir, encoding: "utf8" });
    expect(run.status, run.stderr).toBe(0);
    return run.stdout.trim();
  }

  it("emits no config asset beside the bundle", () => {
    expect(readdirSync(bundleDir).filter((f) => f.endsWith(".json") && f !== "package.json")).toEqual([]);
    expect(existsSync(join(bundleDir, "config"))).toBe(false);
  });

  it("reads --config relative to the working directory", () => {
    writeFileSync(join(workDir, "custom.json"), JSON.stringify({ marker: "custom" }));
    expect(runBundle(["--config", "custom.json"])).toBe(`probe-config:${join(workDir, "custom.json")}:custom`);
  });

  it("reads the default beside the bundle folder, then the release/config copy", () => {
    mkdirSync(join(bundleDir, "config"));
    writeFileSync(join(bundleDir, "config", "miroirConfig.server.json"), JSON.stringify({ marker: "release-copy" }));
    expect(runBundle([])).toBe(
      `probe-config:${join(bundleDir, "config", "miroirConfig.server.json")}:release-copy`,
    );
    mkdirSync(join(root, "config"));
    writeFileSync(join(root, "config", "miroirConfig.server.json"), JSON.stringify({ marker: "beside" }));
    expect(runBundle([])).toBe(`probe-config:${join(root, "config", "miroirConfig.server.json")}:beside`);
  });
});
