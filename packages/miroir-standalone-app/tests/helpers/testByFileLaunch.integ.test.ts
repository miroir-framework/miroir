import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * #307: launches the real `scripts/test-by-file.ts` on `testByFileLaunch.fixture.unit.test.ts`
 * (three failing cases) and checks which cases vitest ran.
 *
 * npm run testByFile -w miroir-standalone-app -- testByFileLaunch.integ
 */
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function runTestByFile(args: string[]): string {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/test-by-file.ts", "testByFileLaunch.fixture", ...args],
    {
      cwd: packageRoot,
      env: { ...process.env, MIROIR_TEST_BY_FILE_FIXTURE: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
      encoding: "utf8",
    },
  );
  const output = `${result.stdout}${result.stderr}`;
  expect(result.status, output).not.toBe(0);
  return output;
}

function testsLine(output: string): string {
  return output.match(/^\s*Tests\s+(.*)$/m)?.[1].trim() ?? output;
}

describe("testByFile launch (#307)", () => {
  it("bails after the first failing case by default", () => {
    expect(testsLine(runTestByFile([]))).toMatch(/^1 failed .*\(3\)/);
  });

  it("--no-bail runs every case", () => {
    expect(testsLine(runTestByFile(["--no-bail"]))).toMatch(/^3 failed \(3\)/);
  });

  it("a -t pattern with spaces reaches vitest as one argument", () => {
    const output = runTestByFile(["-t", "fixture case two"]);
    expect(testsLine(output)).toMatch(/^1 failed \| 2 skipped \(3\)/);
    expect(output).toMatch(/Test Files\s+1 failed \(1\)/);
  });
});
