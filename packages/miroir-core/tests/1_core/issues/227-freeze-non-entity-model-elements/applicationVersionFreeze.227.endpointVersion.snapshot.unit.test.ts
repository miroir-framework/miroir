/**
 * #227 Phase 1 — snapshotEndpointsAsHistoricalEndpointVersions.
 */
import { describe, expect, it } from "vitest";

import {
  ENDPOINT_VERSION_ENTITY_UUID,
  snapshotEndpointsAsHistoricalEndpointVersions,
  type StoredEndpointForFreeze,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

function makeEndpoint(
  uuid: string,
  name: string,
  extra?: Partial<StoredEndpointForFreeze>,
): StoredEndpointForFreeze {
  return {
    uuid,
    name,
    version: "1",
    application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
    definition: { actions: [] },
    description: `${name} description`,
    transactionalEndpoint: false,
    ...extra,
  };
}

describe("227 Phase 1 — snapshotEndpointsAsHistoricalEndpointVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `eeeeeeee-eeee-4eee-8eee-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces EndpointVersion with new UUID ≠ live endpoint uuid", () => {
    const endpoint = makeEndpoint("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Books");
    const [ev] = snapshotEndpointsAsHistoricalEndpointVersions([endpoint], { newUuid: deterministic });
    expect(ev.uuid).not.toBe(endpoint.uuid);
  });

  it("sets endpointUuid to live Endpoint.uuid", () => {
    const endpoint = makeEndpoint("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Lend");
    const [ev] = snapshotEndpointsAsHistoricalEndpointVersions([endpoint], { newUuid: deterministic });
    expect(ev.endpointUuid).toBe(endpoint.uuid);
  });

  it("sets parentUuid/parentName to historical EndpointVersion entity", () => {
    const endpoint = makeEndpoint("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Return");
    const [ev] = snapshotEndpointsAsHistoricalEndpointVersions([endpoint], { newUuid: deterministic });
    expect(ev.parentUuid).toBe(ENDPOINT_VERSION_ENTITY_UUID);
    expect(ev.parentName).toBe("EndpointVersion");
  });

  it("copies name, version, application, definition, description, transactionalEndpoint", () => {
    const endpoint = makeEndpoint("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Books", {
      version: "2",
      transactionalEndpoint: true,
    });
    const [ev] = snapshotEndpointsAsHistoricalEndpointVersions([endpoint], { newUuid: deterministic });
    expect(ev.name).toBe("Books");
    expect(ev.version).toBe("2");
    expect(ev.application).toBe(endpoint.application);
    expect(ev.definition).toEqual(endpoint.definition);
    expect(ev.description).toBe("Books description");
    expect(ev.transactionalEndpoint).toBe(true);
  });

  it("deep isolation: mutating source definition after snapshot does not affect copy", () => {
    const endpoint = makeEndpoint("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [ev] = snapshotEndpointsAsHistoricalEndpointVersions([endpoint], { newUuid: deterministic });
    (endpoint.definition as any).actions = [{ actionType: "mutated" }];
    expect((ev.definition as any).actions).toEqual([]);
  });

  it("empty endpoint list produces empty result", () => {
    expect(snapshotEndpointsAsHistoricalEndpointVersions([])).toEqual([]);
  });

  it("throws on Endpoint without definition", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
      version: "1",
      application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
    } as StoredEndpointForFreeze;
    expect(() => snapshotEndpointsAsHistoricalEndpointVersions([incomplete])).toThrow(/definition/);
  });
});
