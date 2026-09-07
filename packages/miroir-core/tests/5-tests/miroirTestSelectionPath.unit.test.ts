/**
 * MiroirTest suites are selected via the application catalog (`testMiroir` / UI).
 * Vitest filename / RUN_TEST stays for PLATFORM TypeScript tests only.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const TESTS_ROOT = dirname(dirname(THIS_FILE));
const REPO_ROOT = dirname(dirname(dirname(TESTS_ROOT)));
const STANDALONE_TESTS = join(REPO_ROOT, "packages/miroir-standalone-app/tests");

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listTsFiles(full));
      continue;
    }
    if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

function posixRel(from: string, file: string): string {
  return relative(from, file).replaceAll("\\", "/");
}

describe("MiroirTest selection path", () => {
  it("does not re-host MiroirTest suites through per-file vitest wrappers", () => {
    const wrappers = listTsFiles(TESTS_ROOT).filter((file) => {
      const rel = posixRel(TESTS_ROOT, file);
      if (rel === "5-tests/miroirTestSelectionPath.unit.test.ts") {
        return false;
      }
      const text = readFileSync(file, "utf8");
      return /\brunMiroirCoreTestSuite\b/.test(text);
    });
    expect(
      wrappers.map((file) => posixRel(TESTS_ROOT, file)),
      "MiroirTest suites run via testMiroir / UI catalog, not runMiroirCoreTestSuite wrappers",
    ).toEqual([]);
  });

  it("does not keep tautological MiroirTest registration stubs", () => {
    const stubs = listTsFiles(STANDALONE_TESTS).filter((file) => {
      const text = readFileSync(file, "utf8");
      return text.includes("is registered as a MiroirTest suite key");
    });
    expect(stubs.map((file) => posixRel(STANDALONE_TESTS, file))).toEqual([]);
  });

  it("does not keep deprecated MiroirTest integ twins", () => {
    const forbidden = [
      "4_view/Runner_CreateEntity.integ.test.tsx",
      "4_view/Runner_DropEntity.integ.test.tsx",
      "4_view/Runner_Miroir.integ.test.tsx",
      "4_view/Runner_Library.ts",
    ];
    const present = listTsFiles(STANDALONE_TESTS)
      .map((file) => posixRel(STANDALONE_TESTS, file))
      .filter((rel) => forbidden.includes(rel));
    const deprecatedTwins = listTsFiles(STANDALONE_TESTS)
      .filter((file) => {
        const text = readFileSync(file, "utf8");
        return (
          text.includes("@deprecated Prefer MiroirTest") ||
          text.includes("Kept green until G8 cutover")
        );
      })
      .map((file) => posixRel(STANDALONE_TESTS, file));
    expect(
      [...new Set([...present, ...deprecatedTwins])].sort(),
      "integ twins run via testMiroir (runner_create_entity / runner_drop_entity / runner_lend_document / runner_return_document)",
    ).toEqual([]);
  });
});
