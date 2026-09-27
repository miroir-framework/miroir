// #318 fixture: stands in for `testMiroir --shared`. Takes `--suites a,b` and vitest reporter
// arguments, runs suites.fixture.suites.mjs with one describe per requested suite.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const suites = argv[argv.indexOf("--suites") + 1] ?? "";
const forwarded = argv.filter((a) => a.startsWith("--reporter=") || a.startsWith("--outputFile"));
// Run vitest's own entry with node rather than `npx`: on Windows npx is npx.cmd, which
// spawnSync cannot launch without a shell.
const vitestBin = path.resolve(here, "../../../../node_modules/vitest/vitest.mjs");
const result = spawnSync(
  process.execPath,
  [vitestBin, "run", "--config", path.join(here, "suites.vitest.config.mjs"), ...forwarded],
  { stdio: "inherit", env: { ...process.env, FIXTURE_SUITES: suites } },
);
if (result.error) console.error(`suites-launcher: ${result.error.message}`);
process.exit(result.status ?? 1);
