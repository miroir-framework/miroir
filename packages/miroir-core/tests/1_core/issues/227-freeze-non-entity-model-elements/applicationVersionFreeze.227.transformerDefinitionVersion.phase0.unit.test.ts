/**
 * #227 Phase 0 — TransformerDefinitionVersion freeze contracts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const freezeSource = readFileSync(
  join(__dirname, "../../../../src/1_core/versioning/applicationVersionFreeze.ts"),
  "utf8",
);

describe("227 Phase 0 — TransformerDefinitionVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID).toBe(
      "e1f2a3b4-c5d6-4012-a3b4-c5d6e7f8a9d0",
    );
    expect(APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID).toBe(
      "f2a3b4c5-d6e7-4123-a4b5-c6d7e8f9a0d1",
    );
  });

  it("exports snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions", () => {
    expect(typeof snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions).toBe(
      "function",
    );
  });

  it("FreezeApplicationVersionPlan includes TransformerDefinitionVersion fields", () => {
    expect(freezeSource).toMatch(
      /transformerDefinitionVersions:\s*TransformerDefinitionVersionSnapshot\[\]/,
    );
    expect(freezeSource).toMatch(
      /crossTransformerDefinitionVersions:\s*ApplicationVersionCrossTransformerDefinitionVersionRow\[\]/,
    );
    expect(freezeSource).toMatch(
      /transformerDefinitionVersionApplicationSection:\s*ApplicationSection/,
    );
  });
});
