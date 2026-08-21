import { describe, expect, it } from "vitest";

import type { Entity, MetaModelPartial } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  buildResetAndinitializeDeploymentActionSequence,
  emptyMetaModel,
  resolveMetaModelPartial,
} from "../../src/1_core/Deployment";
import { noValue } from "../../src/1_core/Instance";

describe("resolveMetaModelPartial", () => {
  it("defaults omitted array fields to empty arrays", () => {
    const partial: MetaModelPartial = {
      applicationUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      applicationName: "partial-app",
    };

    const resolved = resolveMetaModelPartial(partial);

    expect(resolved.applicationUuid).toBe(partial.applicationUuid);
    expect(resolved.applicationName).toBe("partial-app");
    expect(resolved.entities).toEqual([]);
    expect(resolved.menus).toEqual([]);
    expect(resolved.reports).toEqual([]);
    expect(resolved.runners).toEqual([]);
  });

  it("uses emptyMetaModel scalar defaults when omitted", () => {
    const resolved = resolveMetaModelPartial({ entities: [] });

    expect(resolved.applicationUuid).toBe(emptyMetaModel.applicationUuid);
    expect(resolved.applicationName).toBe("");
    expect(resolved.entities).toEqual([]);
  });

  it("preserves provided entities and coerces explicit undefined arrays to []", () => {
    const entity = { uuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Book" } as Entity;
    const resolved = resolveMetaModelPartial({
      entities: [entity],
      menus: undefined,
    });

    expect(resolved.entities).toEqual([entity]);
    expect(resolved.menus).toEqual([]);
  });
});

describe("buildResetAndinitializeDeploymentActionSequence with MetaModelPartial", () => {
  it("accepts entity-only partial without throwing on spread", () => {
    const entityUuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const actionSequence = buildResetAndinitializeDeploymentActionSequence(
      "dddddddd-dddd-dddd-dddd-dddddddddddd",
      "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      {
        dataStoreType: "app",
        selfApplication: { uuid: noValue.uuid!, name: "test" } as any,
        applicationModelBranch: { uuid: noValue.uuid! } as any,
        applicationVersion: { uuid: noValue.uuid! } as any,
      },
      [],
      {
        entities: [{ uuid: entityUuid, name: "OnlyEntity" } as Entity],
      },
    );

    const createEntityStep = actionSequence.payload.actionSequence.find(
      (step) => step.actionType === "createEntity",
    );
    expect(createEntityStep?.payload.entities?.map((e: Entity) => e.uuid)).toEqual([entityUuid]);
  });
});
