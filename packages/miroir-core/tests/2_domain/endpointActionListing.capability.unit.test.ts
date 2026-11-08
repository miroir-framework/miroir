/**
 * #696: the Endpoint action catalog that MCP tools, CLI commands and CopilotKit actions are made
 * from leaves out an action whose implementation requires a capability the process does not have. The
 * Miroir ModelEndpoint's `freezeApplicationVersion` requires `versioning`.
 * ```bash
 * RUN_TEST=endpointActionListing.capability npm run testByFile -w @miroir-framework/core -- endpointActionListing.capability
 * ```
 */
import { describe, expect, it } from "vitest";

import { modelEndpointV1 } from "miroir-app-miroir";

import {
  FAIL_CLOSED_PROCESS_CAPABILITIES,
  isEndpointActionAvailable,
  listEndpointActions,
  MIROIR_APPLICATION_UUID,
  type Action,
  type EndpointDefinition,
  type LocalCacheInterface,
  type ProcessCapabilities,
} from "@miroir-framework/core";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("endpointActionListing.capability");

const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const seedMap = { [MIROIR_APPLICATION_UUID]: MIROIR_DEPLOYMENT };

/** A local cache holding the Miroir model with its ModelEndpoint only: what the catalog reads. */
const localCache = {
  getDomainState: () => ({}),
  currentModel: () => ({
    endpoints: [modelEndpointV1 as unknown as EndpointDefinition],
    applications: [{ uuid: MIROIR_APPLICATION_UUID, name: "Miroir" }],
  }),
} as unknown as LocalCacheInterface;

const capabilities = (versioning: boolean): ProcessCapabilities => ({
  ...FAIL_CLOSED_PROCESS_CAPABILITIES,
  versioning,
});

function listedActionTypes(processCapabilities?: ProcessCapabilities): string[] {
  return listEndpointActions(localCache, seedMap, processCapabilities).map((entry) => entry.actionType);
}

const freezeAction = (modelEndpointV1 as unknown as EndpointDefinition).definition.actions.find(
  (action: Action) => (action as any).actionParameters?.actionType?.definition === "freezeApplicationVersion",
) as Action;

if (runThis) {
  describe("endpointActionListing.capability", () => {
    it("the ModelEndpoint's freeze action requires the versioning capability", () => {
      expect((freezeAction as any).actionImplementation?.requiredCapability).toBe("versioning");
      expect(isEndpointActionAvailable(freezeAction, capabilities(true))).toBe(true);
      expect(isEndpointActionAvailable(freezeAction, capabilities(false))).toBe(false);
      expect(isEndpointActionAvailable(freezeAction)).toBe(true);
    });

    it("with versioning on, the catalog lists freezeApplicationVersion", () => {
      expect(listedActionTypes(capabilities(true))).toContain("freezeApplicationVersion");
    });

    it("with versioning off, the catalog leaves out freezeApplicationVersion and keeps the other actions", () => {
      const on = listedActionTypes(capabilities(true));
      const off = listedActionTypes(capabilities(false));
      expect(off).not.toContain("freezeApplicationVersion");
      expect(off).toEqual(on.filter((actionType) => actionType !== "freezeApplicationVersion"));
      expect(off).toContain("commit");
    });

    it("without a snapshot, the catalog lists every action, as before #696", () => {
      expect(listedActionTypes()).toEqual(listedActionTypes(capabilities(true)));
    });
  });
}
