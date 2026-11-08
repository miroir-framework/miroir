/**
 * #216 Phase 5 — planFreezeApplicationVersionFromMetaModel gate. The Action schema stays in core
 * (`applicationVersionFreeze.actionSchema.unit.test.ts`, #696).
 */
import { describe, expect, it } from "vitest";

import type { Entity } from "@miroir-framework/core";

import {
  planFreezeApplicationVersionFromMetaModel,
  type FreezeMetaModelSlice,
} from "../src/applicationVersionFreeze.js";

const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";
const BOOK = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function emptyMeta(overrides?: Partial<FreezeMetaModelSlice>): FreezeMetaModelSlice {
  return {
    applications: [{ uuid: APP_UUID, versioningEnabled: true }],
    entities: [makeEntity(BOOK, "Book")],
    applicationVersions: [],
    entityVersions: [],
    applicationVersionCrossEntityVersion: [],
    applicationVersionCrossQueryVersion: [],
    queryVersions: [],
    applicationVersionCrossReportVersion: [],
    reportVersions: [],
    applicationVersionCrossMenuVersion: [],
    menuVersions: [],
    applicationVersionCrossEndpointVersion: [],
    endpointVersions: [],
    applicationVersionCrossRunnerVersion: [],
    runnerVersions: [],
    applicationVersionCrossThemeVersion: [],
    themeVersions: [],
    applicationVersionCrossTransformerDefinitionVersion: [],
    applicationVersionCrossMlSchemaVersion: [],
    applicationVersionCrossMiroirTestVersion: [],
    transformerDefinitionVersions: [],
    mlSchemaVersions: [],
    miroirTestVersions: [],
    ...overrides,
  };
}

describe("216 Phase 5 — planFreezeApplicationVersionFromMetaModel gate", () => {
  it("rejects unversioned SelfApplication", () => {
    expect(() =>
      planFreezeApplicationVersionFromMetaModel(
        {
          application: APP_UUID,
          versionName: "V1",
          branch: BRANCH_UUID,
        },
        emptyMeta({
          applications: [{ uuid: APP_UUID, versioningEnabled: false }],
        }),
      ),
    ).toThrow(/versioning enabled/i);
  });

  it("rejects when SelfApplication is missing", () => {
    expect(() =>
      planFreezeApplicationVersionFromMetaModel(
        {
          application: APP_UUID,
          versionName: "V1",
          branch: BRANCH_UUID,
        },
        emptyMeta({ applications: [] }),
      ),
    ).toThrow(/not found/i);
  });

  it("requires branch on first freeze when omitted", () => {
    expect(() =>
      planFreezeApplicationVersionFromMetaModel(
        { application: APP_UUID, versionName: "V1" },
        emptyMeta(),
      ),
    ).toThrow(/branch/i);
  });

  it("treats noValue branch as missing and reuses branch from existing SAV", () => {
    const NO_VALUE = "31f3a03a-f150-416d-9315-d3a752cb4eb4";
    const plan = planFreezeApplicationVersionFromMetaModel(
      {
        application: APP_UUID,
        versionName: "V1",
        branch: NO_VALUE,
      },
      emptyMeta({
        applicationVersions: [
          {
            uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
            parentName: "ApplicationVersion",
            name: "Initial",
            selfApplication: APP_UUID,
            branch: BRANCH_UUID,
            description: "placeholder",
            modelCUDMigration: [],
            modelStructureMigration: [],
          } as any,
        ],
      }),
    );
    expect(plan.selfApplicationVersion.name).toBe("V1");
    expect(plan.selfApplicationVersion.branch).toBe(BRANCH_UUID);
  });

  it("builds plan for versioned app with branch", () => {
    const plan = planFreezeApplicationVersionFromMetaModel(
      {
        application: APP_UUID,
        versionName: "V1",
        branch: BRANCH_UUID,
      },
      emptyMeta(),
    );
    expect(plan.selfApplicationVersion.name).toBe("V1");
    expect(plan.selfApplicationVersion.branch).toBe(BRANCH_UUID);
    expect(plan.entityVersions).toHaveLength(1);
    expect(plan.crossEntityVersions).toHaveLength(1);
    expect(plan.selfApplicationVersion.modelCUDMigration).toEqual([]);
  });
});
