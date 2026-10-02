/**
 * Component tests (#406): `testMiroir --suites` routes the component suites (a `reactComponentTest`
 * leaf mounts a React component) to their DOM entry, and refuses a selection mixing them with
 * other suites.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestLauncher.unit
 * ```
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  MIROIR_COMPONENT_TEST_VITEST_ENTRY,
  resolveVitestEntry,
} from "../../scripts/testMiroirLauncher.js";

const ENV_KEYS = ["MIROIR_TEST_MODE", "MIROIR_TEST_SUITES", "MIROIR_TEST_TAGS"] as const;

describe("testMiroirLauncher and component suites (#406)", () => {
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it("routes component suites to the component entry, with the selected suites", () => {
    const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
      "--suites",
      "ui.transformerEditor,ui.mlElementEditor.literal",
    ]);
    expect(vitestEntry).toBe(MIROIR_COMPONENT_TEST_VITEST_ENTRY);
    expect(spawnEnv.MIROIR_TEST_SUITES?.split(",").sort()).toEqual([
      "ui.mlElementEditor.literal",
      "ui.transformerEditor",
    ]);
  });

  it("refuses a selection mixing component suites and other suites", () => {
    expect(() =>
      resolveVitestEntry(process.env, ["--suites", "ui.transformerEditor,report.bookDetails", "--mode", "integ"]),
    ).toThrow(/both component suites \(ui\.transformerEditor\) and other suites \(report\.bookDetails\)/);
  });

  it("leaves the other suites to their entries", () => {
    const { vitestEntry } = resolveVitestEntry(process.env, ["--suites", "report.bookDetails", "--mode", "integ"]);
    expect(vitestEntry).not.toBe(MIROIR_COMPONENT_TEST_VITEST_ENTRY);
  });
});
