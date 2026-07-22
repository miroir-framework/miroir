/**
 * #214 Phase 3 — selectors route to partial segment when extractor has attributes.
 */
import { describe, expect, it } from "vitest";
import {
  getReduxDeploymentsStateIndex,
  selectEntityInstanceUuidIndexFromReduxDeploymentsState,
  type ApplicationDeploymentMap,
  type EntityInstance,
  type ReduxDeploymentsState,
} from "../../src/index.js";

const APP = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEPLOY = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ENT = "62209e4a-e429-4d7d-9b28-dcc1da6b51a2";
const INST = "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c";

const map: ApplicationDeploymentMap = { [APP]: DEPLOY };
const fullIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "full");
const partialIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "partial");

function params(attributes?: string[]) {
  return {
    extractor: {
      application: APP,
      select: {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: ENT,
        applicationSection: "data" as const,
        ...(attributes?.length ? { attributes } : {}),
      },
    },
  } as any;
}

describe("ReduxDeploymentsStateQuerySelectors segment routing (#214)", () => {
  it("with attributes: reads partial segment, ignores full", () => {
    const state = {
      [fullIndex]: {
        ids: ["full-only"],
        entities: {
          "full-only": { uuid: "full-only", parentUuid: ENT, name: "full" } as EntityInstance,
        },
        segment: { kind: "full", freshness: "fresh" },
      },
      [partialIndex]: {
        ids: [INST],
        entities: {
          [INST]: {
            uuid: INST,
            parentUuid: ENT,
            name: "partial-row",
            defaultLabel: "Partial",
          } as EntityInstance,
        },
        segment: {
          kind: "partial",
          freshness: "fresh",
          projection: ["defaultLabel", "name", "uuid"],
        },
      },
    } as unknown as ReduxDeploymentsState;

    const result = selectEntityInstanceUuidIndexFromReduxDeploymentsState(
      state,
      map,
      params(["name", "defaultLabel", "uuid"])
    );
    expect(result).toMatchObject({
      [INST]: { name: "partial-row", defaultLabel: "Partial" },
    });
    expect(result).not.toHaveProperty("full-only");
  });

  it("without attributes: reads full segment only", () => {
    const state = {
      [fullIndex]: {
        ids: [INST],
        entities: {
          [INST]: {
            uuid: INST,
            parentUuid: ENT,
            name: "full-row",
            contents: { encoding: "base64", data: "AA" },
          } as EntityInstance,
        },
        segment: { kind: "full", freshness: "fresh" },
      },
      [partialIndex]: {
        ids: ["from-partial"],
        entities: {
          "from-partial": {
            uuid: "from-partial",
            parentUuid: ENT,
            name: "partial-only",
          } as EntityInstance,
        },
        segment: {
          kind: "partial",
          freshness: "fresh",
          projection: ["name", "uuid"],
        },
      },
    } as unknown as ReduxDeploymentsState;

    const result = selectEntityInstanceUuidIndexFromReduxDeploymentsState(
      state,
      map,
      params()
    );
    expect(result).toMatchObject({
      [INST]: { name: "full-row", contents: expect.anything() },
    });
    expect(result).not.toHaveProperty("from-partial");
  });
});
