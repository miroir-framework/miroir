/**
 * #273 Slice 2 — GET /capabilities on RestClientStub before login.
 */
import { afterEach, describe, expect, it } from "vitest";

import { RestClientStub } from "miroir-core";
import type { ProcessCapabilities } from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesHttp.273.phase2";

const snapshot: ProcessCapabilities = {
  ai: true,
  mcp: true,
  designerTools: true,
  availableStoreTypes: ["indexedDb"],
  creatableStoreTypes: ["indexedDb"],
  storeAdministration: true,
};

if (runThis) {
  describe("processCapabilitiesHttp.273.phase2 RestClientStub GET /capabilities", () => {
    const previousAuth = process.env.MIROIR_AUTH_ENABLED;

    afterEach(() => {
      if (previousAuth === undefined) {
        delete process.env.MIROIR_AUTH_ENABLED;
      } else {
        process.env.MIROIR_AUTH_ENABLED = previousAuth;
      }
    });

    it("returns HTTP 200 and the stored snapshot after setProcessCapabilities", async () => {
      const stub = new RestClientStub("http://test");
      stub.setProcessCapabilities(snapshot);
      const result = await stub.get("/capabilities", "/capabilities");
      expect(result).toMatchObject({
        status: 200,
        data: { status: "ok", capabilities: snapshot },
      });
    });

    it("succeeds with MIROIR_AUTH_ENABLED=1 and no Authorization header", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const stub = new RestClientStub("http://test");
      stub.setProcessCapabilities(snapshot);
      const result = await stub.get("/capabilities", "/capabilities");
      expect(result).toMatchObject({
        status: 200,
        data: { status: "ok", capabilities: snapshot },
      });
    });

    it("returns 401 for an unknown path when auth is on (gate, not a throw)", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const stub = new RestClientStub("http://test");
      stub.setProcessCapabilities(snapshot);
      const result = await stub.get("/no-such-route", "/no-such-route");
      expect(result).toMatchObject({
        status: 401,
      });
    });
  });
}
