#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prepareTestMiroirLaunch } from "./testMiroirLauncher.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const { vitestEntry, spawnEnv } = prepareTestMiroirLaunch(process.env, argv);

const vitestArgs = [
  "vitest",
  "run",
  "--poolOptions.forks.singleFork",
  "--reporter=verbose",
  `tests/${vitestEntry}.ts`,
];

const result = spawnSync("npx", vitestArgs, {
  cwd: packageRoot,
  env: spawnEnv,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
