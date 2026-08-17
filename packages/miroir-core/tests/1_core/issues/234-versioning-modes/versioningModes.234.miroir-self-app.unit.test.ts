/**
 * #234 Slice 1.2 — canonical Miroir SelfApplication row carries versioningMode.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import type { SelfApplication } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { REPO_ROOT } from "./versioningModes.234.slice0-inventory.js";

const MIROIR_SELF_APPLICATION_JSON = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json",
);

describe("234 Slice 1.2 — Miroir SelfApplication metadata", () => {
  it("canonical JSON row has versioningMode versioned-internal and versioningEnabled true", () => {
    const row = JSON.parse(readFileSync(MIROIR_SELF_APPLICATION_JSON, "utf8")) as SelfApplication;
    expect(row.versioningMode).toBe("versioned-internal");
    expect(row.versioningEnabled).toBe(true);
  });

  it("selfApplicationMiroir package export matches canonical row", () => {
    expect((selfApplicationMiroir as SelfApplication).versioningMode).toBe("versioned-internal");
    expect((selfApplicationMiroir as SelfApplication).versioningEnabled).toBe(true);
  });
});
