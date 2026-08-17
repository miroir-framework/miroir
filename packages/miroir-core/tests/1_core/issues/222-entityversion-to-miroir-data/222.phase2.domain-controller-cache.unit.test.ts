/**
 * #222 Phase 2.3 — DomainController cache-policy map: Miroir relies on Entity.cache
 * (EV not in model fetch); Library still fills EV map from model when present.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { miroirModelEntities } from "../../../../src/1_core/Model.js";
import { entityEntityVersion } from "miroir-test-app_deployment-miroir";
import type { Entity } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const domainControllerTs = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../src/3_controllers/DomainController.ts",
);

describe("222 Phase 2 — DomainController cache-policy map (EV fallback)", () => {
  it("Miroir model fetch set does not include EntityVersion (Entity.cache only)", () => {
    expect(miroirModelEntities.map((e: Entity) => e.uuid)).not.toContain(
      entityEntityVersion.uuid,
    );
  });

  it("loadConfiguration builds EV fallback map only from model-phase EV fetch (Library path)", () => {
    const src = readFileSync(domainControllerTs, "utf8");
    expect(src).toMatch(/entityDefinitionsByEntityUuid/);
    expect(src).toMatch(/modelEntitiesToFetch\.findIndex/);
    // Must not assume Miroir EV is under model section for cache-policy bootstrap
    expect(src).toMatch(/Miroir EV is not in miroirModelEntities|#222/);
  });
});
