import { describe, expect, it, vi } from "vitest";

import { PersistenceStoreController } from "../../src/4_services/PersistenceStoreController.js";

describe("214 Phase 1 — PersistenceStoreController projection", () => {
  function makeController(instances: Record<string, unknown>[]) {
    const dataStoreSection = {
      getStoreName: () => "test-data",
      getInstances: vi.fn(async () => ({
        status: "ok",
        returnedDomainElement: {
          parentUuid: instances[0]?.parentUuid ?? "22222222-2222-2222-2222-222222222222",
          applicationSection: "data",
          instances,
        },
      })),
    };
    const modelStoreSection = { getStoreName: () => "test-model" };
    const adminStore = { getStoreName: () => "admin" };
    return new PersistenceStoreController(
      adminStore as any,
      modelStoreSection as any,
      dataStoreSection as any
    );
  }

  it("projects getInstances when attributes are provided", async () => {
    const full = {
      uuid: "11111111-1111-1111-1111-111111111111",
      parentUuid: "22222222-2222-2222-2222-222222222222",
      parentName: "Blob",
      name: "logo",
      contents: "huge",
    };
    const controller = makeController([full]);
    const projected = await controller.getInstances("data", full.parentUuid, ["name"]);
    expect(projected).toMatchObject({ status: "ok" });
    const out = (projected as any).returnedDomainElement.instances;
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      uuid: full.uuid,
      parentUuid: full.parentUuid,
      parentName: full.parentName,
      name: "logo",
    });
    expect(out[0]).not.toHaveProperty("contents");
  });

  it("returns full instances when attributes are omitted", async () => {
    const full = {
      uuid: "11111111-1111-1111-1111-111111111111",
      parentUuid: "22222222-2222-2222-2222-222222222222",
      name: "logo",
      contents: "huge",
    };
    const controller = makeController([full]);
    const result = await controller.getInstances("data", full.parentUuid);
    expect((result as any).returnedDomainElement.instances[0]).toEqual(full);
  });
});
