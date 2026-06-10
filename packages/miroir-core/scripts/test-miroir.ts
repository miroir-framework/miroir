#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  miroirTestCliConfigToEnv,
  parseMiroirTestCliConfig,
} from "../tests/helpers/parseMiroirTestCliConfig";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const config = parseMiroirTestCliConfig(process.env, argv);
const env = { ...process.env, ...miroirTestCliConfigToEnv(config) };

const vitestArgs = [
  "vitest",
  "run",
  "--poolOptions.forks.singleFork",
  "--reporter=verbose",
  `tests/${config.vitestEntry}.ts`,
];

const result = spawnSync("npx", vitestArgs, {
  cwd: packageRoot,
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
