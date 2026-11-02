/**
 * #580: the PageLoadMeasurement Entity, and the standalone app's copies of the uuids where page
 * loads are recorded: the devData section of the Miroir application (#647). The page module that
 * reads them imports no package but types.
 *
 * Not reachable through MiroirTest: it compares TypeScript constants of the client with model assets.
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- loadTimingContract
 * ```
 */
import { describe, expect, it } from "vitest";

import { checkModelValidationInstance, defaultMiroirModelEnvironment, type MlElement } from "@miroir-framework/core";
import { deployment_Miroir } from "miroir-app-admin";
import { entityPageLoadMeasurement, selfApplicationMiroir } from "miroir-app-miroir";

import {
  ENTITY_PAGE_LOAD_MEASUREMENT_UUID,
  MIROIR_DEPLOYMENT_UUID,
  MIROIR_SELF_APPLICATION_UUID,
} from "../../../src/loadTimings/loadTimingConstants.js";

const record = {
  uuid: "5f7f1d1e-5d1a-4a55-9d5e-0f2b7f6f1a01",
  parentName: "PageLoadMeasurement",
  parentUuid: ENTITY_PAGE_LOAD_MEASUREMENT_UUID,
  pageLoad: "b1f0c5a2-8f43-4c1e-9c43-2a3f4f8e7d10",
  measuredAt: "2026-10-27T10:00:00.000Z",
  step: "initialLoad",
  page: "home",
  url: "/?page=home",
  durationMs: 1840,
  settled: true,
  milestones: { responseEnd: 12, entryScript: 310, firstRender: 900 },
  chunkCount: 1,
  chunkTransferBytes: 1200,
  chunkEncodedBytes: 1100,
  chunks: [{ file: "assets/HomePage-abc.js", startMs: 950, durationMs: 40, transferBytes: 1200, encodedBytes: 1100 }],
  dataRequestCount: 3,
  dataTransferBytes: 5400,
  client: "webApp",
  buildMode: "production",
};

function validate(instance: Record<string, unknown>) {
  return checkModelValidationInstance(
    (entityPageLoadMeasurement as { mlSchema: MlElement }).mlSchema,
    instance,
    String(instance.uuid),
    defaultMiroirModelEnvironment,
  ).status;
}

describe("PageLoadMeasurement contract (#580)", () => {
  it("the standalone app's uuids are Miroir's", () => {
    expect({
      entity: ENTITY_PAGE_LOAD_MEASUREMENT_UUID,
      selfApplication: MIROIR_SELF_APPLICATION_UUID,
      deployment: MIROIR_DEPLOYMENT_UUID,
    }).toEqual({
      entity: entityPageLoadMeasurement.uuid,
      selfApplication: selfApplicationMiroir.uuid,
      deployment: deployment_Miroir.uuid,
    });
  });

  it("is not loaded when the client refreshes the Miroir deployment", () => {
    expect((entityPageLoadMeasurement as { cache?: { cacheAllInstancesOnRefresh?: boolean } }).cache?.cacheAllInstancesOnRefresh).toBe(false);
  });

  it("accepts a step record", () => {
    expect(validate(record)).toBe("ok");
  });

  it("refuses a record without its step", () => {
    const { step: _step, ...withoutStep } = record;
    expect(validate(withoutStep)).not.toBe("ok");
  });
});
