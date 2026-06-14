#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  miroirTestCliConfigToEnv,
  parseMiroirTestCliConfig,
} from "../src/5_tests/parseMiroirTestCliConfig";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const config = parseMiroirTestCliConfig(process.env, argv);

if (config.executionMode === "integration") {
  console.error(
    "miroir-core integration tests run from miroir-standalone-app:\n" +
      "  MIROIR_TEST_SUITES=<suite> MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app",
  );
  process.exit(1);
}

const env = { ...process.env, ...miroirTestCliConfigToEnv(config) };

const vitestArgs = [
  "vitest",
  "run",
  "--poolOptions.forks.singleFork",
  "--reporter=verbose",
  "tests/miroir-core-tests.unit.test.ts",
];

const result = spawnSync("npx", vitestArgs, {
  cwd: packageRoot,
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
