/**
 * #221 Slice 6 / Group F — Out-of-tree characterization lock.
 *
 * No migration: JzodElementEditor tree and ReportPage mount stay free of
 * EntityVersion / entityDefinition coupling. Schema editing is JzodObject-only.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const VIEW_ROOT = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");
const VALUE_OBJECT_EDITOR = join(VIEW_ROOT, "components/ValueObjectEditor");

/** Core editor surface + children under ValueObjectEditor. */
const EDITOR_FILES = [
  "JzodElementEditor.tsx",
  "JzodElementEditorInterface.ts",
  "JzodElementEditorHooks.ts",
  "JzodObjectEditor.tsx",
  "JzodArrayEditor.tsx",
  "JzodEnumEditor.tsx",
  "JzodAnyEditor.tsx",
  "JzodLiteralEditor.tsx",
  "JzodElementStringEditor.tsx",
  "JzodElementEditorReactCodeMirror.tsx",
  "JzodEditorButton.tsx",
  "BlobEditorField.tsx",
  "FieldValidationError.tsx",
  "FieldValidationContext.tsx",
  "InstanceEditorOutlineContext.tsx",
] as const;

const FORBIDDEN = [
  "EntityVersion",
  "entityVersion",
  "EntityDefinition",
  "entityDefinition",
  "entityDefinitions",
] as const;

describe("221 Phase 6 — JzodElementEditor / ReportPage out of EntityVersion tree", () => {
  it("ValueObjectEditor sources have no EntityVersion / entityDefinition identifiers", () => {
    for (const name of EDITOR_FILES) {
      const source = readFileSync(join(VALUE_OBJECT_EDITOR, name), "utf8");
      for (const token of FORBIDDEN) {
        expect(source, `${name} must not contain ${token}`).not.toMatch(
          new RegExp(`\\b${token}\\b`),
        );
      }
    }
  });

  it("ReportPage mounts ReportDisplay without Entity / EntityVersion imports", () => {
    const source = readFileSync(join(VIEW_ROOT, "routes/ReportPage.tsx"), "utf8");
    expect(source).toMatch(/ReportDisplay/);
    expect(source).not.toMatch(/\bEntityVersion\b/);
    expect(source).not.toMatch(/\bentityVersion\b/);
    expect(source).not.toMatch(/\bEntityDefinition\b/);
    // May import ApplicationSection etc.; forbid bare Entity type import from miroir-core list
    expect(source).not.toMatch(/\bEntity\b/);
  });

  it("ValueObjectEditor directory listing stays covered by EDITOR_FILES lock list", () => {
    const onDisk = readdirSync(VALUE_OBJECT_EDITOR).filter((n) => /\.(ts|tsx)$/.test(n));
    for (const name of onDisk) {
      expect(EDITOR_FILES as readonly string[], `add ${name} to EDITOR_FILES lock list`).toContain(
        name,
      );
    }
  });
});
