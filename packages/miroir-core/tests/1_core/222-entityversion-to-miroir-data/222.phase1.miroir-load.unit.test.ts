/**
 * #222 Phase 1.3 — Entity boots without EV in model; EV listable via data section API.
 */
import { describe, expect, it } from "vitest";

import {
  getApplicationSection,
  miroirModelEntities,
} from "../../../src/1_core/Model.js";
import {
  entityEntity,
  entityEntityVersion,
  entityVersionEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import type { Entity } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0 } from "./222.slice0-inventory.js";

const MIROIR_APP_UUID = selfApplicationMiroir.uuid as string;

describe("222 Phase 1 — Miroir load contracts (Entity bootstrap; EV in data)", () => {
  it("miroir model bootstrap set is Entity MetaModel peers without EntityVersion", () => {
    const uuids = miroirModelEntities.map((e: Entity) => e.uuid);
    expect(uuids).toContain(entityEntity.uuid);
    expect(uuids).not.toContain(entityEntityVersion.uuid);
  });

  it("#232 EntityVersion routes to model-version (was data in #222)", () => {
    expect((entityEntity as Entity).mlSchema).toBeDefined();
    expect(getApplicationSection(MIROIR_APP_UUID, entityEntity.uuid as string)).toBe("model");
    expect(getApplicationSection(MIROIR_APP_UUID, entityEntityVersion.uuid as string)).toBe(
      "model-version",
    );
  });

  it("Slice 0 EntityVersion instance UUIDs remain importable (self-EV sample)", () => {
    expect(MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0).toContain(
      entityVersionEntityVersion.uuid as string,
    );
    expect(entityVersionEntityVersion.uuid).toBe("bdd7ad43-f0fc-4716-90c1-87454c40dd95");
    expect((entityVersionEntityVersion as { parentUuid?: string }).parentUuid).toBe(
      entityEntityVersion.uuid,
    );
  });
});
