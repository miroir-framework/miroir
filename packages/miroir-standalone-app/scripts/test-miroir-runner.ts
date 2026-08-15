#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prepareTestMiroirLaunch } from "./testMiroirLauncher.js";
import { resolveRepoRoot } from "../tests/helpers/integrationTestProfiles.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const { vitestEntry, spawnEnv } = prepareTestMiroirLaunch(process.env, argv);

// npm -w sets PWD to the package dir; profile config paths are repo-root relative.
const launchEnv: NodeJS.ProcessEnv = {
  ...spawnEnv,
  PWD: resolveRepoRoot(),
};

const vitestArgs = [
  "vitest",
  "run",
  "--poolOptions.threads.singleThread",
  "--reporter=verbose",
  // vitest root is `tests/` (vite.config.js); pass the entry relative to that root
  `${vitestEntry}.ts`,
];

console.log("launching vitest with args:", vitestArgs);
console.log("in package root:", packageRoot);
if (process.env.MIROIR_TEST_VERBOSE === "1") {
  console.log("with environment:", launchEnv);
} else {
  console.log(
    "log config:",
    launchEnv.VITE_MIROIR_LOG_CONFIG_FILENAME ?? "(default)",
    "test config:",
    launchEnv.VITE_MIROIR_TEST_CONFIG_FILENAME ?? "(default)",
  );
}
const result = spawnSync("npx", vitestArgs, {
  cwd: packageRoot,
  env: launchEnv,
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
