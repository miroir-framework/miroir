/**
 * #222 Phase 2.2 — extractApplicationModel reads EntityVersion via getApplicationSection.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getApplicationSection } from "../../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const MIROIR_APP_UUID = selfApplicationMiroir.uuid as string;
const LIBRARY_APP_UUID = selfApplicationLibrary.uuid as string;
const EV_UUID = entityEntityVersion.uuid as string;

const modelTs = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../src/1_core/Model.ts",
);

describe("222 Phase 2 — extractApplicationModel section strategy", () => {
  it("#232 EntityVersion section is model-version for both Miroir and Library", () => {
    expect(getApplicationSection(MIROIR_APP_UUID, EV_UUID)).toBe("model-version");
    expect(getApplicationSection(LIBRARY_APP_UUID, EV_UUID)).toBe("model-version");
  });

  it("Entity remains model for both Miroir and Library", () => {
    expect(getApplicationSection(MIROIR_APP_UUID, entityEntity.uuid as string)).toBe("model");
    expect(getApplicationSection(LIBRARY_APP_UUID, entityEntity.uuid as string)).toBe("model");
  });

  it("extractApplicationModel uses getApplicationSection for EntityVersion (not hard-coded model)", () => {
    const src = readFileSync(modelTs, "utf8");
    const extractFn = src.slice(src.indexOf("export async function extractApplicationModel"));
    expect(extractFn).toMatch(/getApplicationSection\s*\(\s*applicationUuid\s*,/);
    expect(extractFn).toMatch(/sectionFor\s*\(\s*entityEntityVersion\.uuid\s*\)/);
    expect(extractFn).not.toMatch(
      /extractEntityInstances\s*\(\s*storeController\s*,\s*"model"\s*,\s*entityEntityVersion\.uuid/,
    );
  });
});
