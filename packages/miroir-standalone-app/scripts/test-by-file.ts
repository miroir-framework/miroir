#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prepareTestByFileLaunch } from "./testByFileLauncher.js";
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

const result = spawnSync(
  "npx",
  [
    "vitest",
    "run",
    "--reporter=verbose",
    "--poolOptions.forks.singleFork",
    "--bail=1",
    ...vitestArgs,
  ],
  {
    cwd: packageRoot,
    env: launchEnv,
    stdio: "inherit",
    shell: true,
  },
);

process.exit(result.status ?? 1);
