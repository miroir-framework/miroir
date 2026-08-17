/**
 * #227 Phase 0 — EndpointVersion freeze contracts.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID,
  ENDPOINT_VERSION_ENTITY_UUID,
  snapshotEndpointsAsHistoricalEndpointVersions,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");

describe("227 Phase 0 — EndpointVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(ENDPOINT_VERSION_ENTITY_UUID).toBe("c2d3e4f5-a6b7-4789-a0b1-d2e3f4a5b6c7");
    expect(APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID).toBe(
      "d3e4f5a6-b7c8-4890-b1c2-e3f4a5b6c7d8",
    );
  });

  it("exports snapshotEndpointsAsHistoricalEndpointVersions", () => {
    expect(typeof snapshotEndpointsAsHistoricalEndpointVersions).toBe("function");
  });

  it("FreezeApplicationVersionPlan includes EndpointVersion fields", () => {
    const source = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts"),
      "utf8",
    );
    expect(source).toMatch(/endpointVersions:\s*EndpointVersionSnapshot\[\]/);
    expect(source).toMatch(/crossEndpointVersions:\s*ApplicationVersionCrossEndpointVersionRow\[\]/);
    expect(source).toMatch(/endpointVersionApplicationSection:\s*ApplicationSection/);
  });
});
