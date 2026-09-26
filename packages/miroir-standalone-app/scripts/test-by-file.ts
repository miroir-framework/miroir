#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildTestByFileVitestArgs, prepareTestByFileLaunch } from "./testByFileLauncher.js";
import { resolveRepoRoot } from "../tests/helpers/integrationTestProfiles.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const { vitestArgs, spawnEnv } = prepareTestByFileLaunch(process.env, argv);

// npm -w sets PWD to the package dir; profile config paths are repo-root relative.
const launchEnv: NodeJS.ProcessEnv = {
  ...spawnEnv,
  PWD: resolveRepoRoot(),
};

// Run vitest's CLI with node directly, without a shell, so every argument (e.g. a `-t`
// pattern with spaces) reaches vitest exactly as given, on every platform.
const vitestBin = path.join(
  path.dirname(createRequire(import.meta.url).resolve("vitest/package.json")),
  "vitest.mjs",
);

const result = spawnSync(process.execPath, [vitestBin, ...buildTestByFileVitestArgs(vitestArgs)], {
  cwd: packageRoot,
  env: launchEnv,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
