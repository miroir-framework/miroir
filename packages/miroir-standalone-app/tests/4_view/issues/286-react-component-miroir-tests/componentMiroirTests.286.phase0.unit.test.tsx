/**
 * Issue #286 Slice 0: characterize the contracts that later slices change.
 *
 * `phase0 stable` stays true after Slice 12. The `pre-286 inventory` describe, which recorded the
 * behavior that Slices 2, 3, and 12 changed, was deleted in Slice 12 with the old
 * `JzodElementEditor.test.tsx`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
 * ```
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expect as miroirExpect } from "miroir-core";

import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import { extractValuesFromRenderedElements } from "../../JzodElementEditorTestTools.js";

const REPO_ROOT = resolveRepoRoot();

const MIROIR_TEST_ENTITY_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json",
);
const MIROIR_TEST_ENTITY_VERSION_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json",
);
function readJson(path: string): any {
  return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
}

/** `relativePath` of each member of the `miroirTestLeaf` union, in declaration order. */
function miroirTestLeafMembers(entityOrEntityVersion: any): string[] {
  const leaf = entityOrEntityVersion?.mlSchema?.definition?.definition?.context?.miroirTestLeaf;
  if (!leaf || leaf.type !== "union" || !Array.isArray(leaf.definition)) {
    throw new Error("miroirTestLeaf union not found at mlSchema.definition.definition.context");
  }
  return leaf.definition.map((member: any) => member?.definition?.relativePath);
}

// ################################################################################################
describe("phase0 stable", () => {
  it("miroirTestLeaf lists the same members in the MiroirTest Entity and EntityVersion", () => {
    const entityMembers = miroirTestLeafMembers(readJson(MIROIR_TEST_ENTITY_PATH));
    const entityVersionMembers = miroirTestLeafMembers(readJson(MIROIR_TEST_ENTITY_VERSION_PATH));
    expect(entityMembers.length).toBeGreaterThan(0);
    expect(entityVersionMembers).toEqual(entityMembers);
  });

  it("miroir-core non-throwing expect: not.toBeNull on null and toEqual with an undefined-valued key both give result false", () => {
    expect(miroirExpect(null).not.toBeNull().result).toBe(false);
    expect(miroirExpect({ a: 1, b: undefined }).toEqual({ a: 1 }).result).toBe(false);
  });

  it("extractValuesFromRenderedElements reads a small rendered form through an explicit container", () => {
    const { container } = render(
      <div>
        <input type="text" name="testField.a" defaultValue="foo" readOnly />
        <input type="number" name="testField.b" defaultValue="42" readOnly />
        <input type="checkbox" name="testField.c" defaultChecked readOnly />
      </div>,
    );
    const values = extractValuesFromRenderedElements(expect, undefined, container, "testField");
    expect(values).toEqual({ a: "foo", b: 42, c: true });
  });
});
