// #345 Slice 2: miroir-mcp is a library. MCP is served by miroir-server and Electron from their
// environment; the package has no configuration of its own. vitest: package wiring, not reachable
// through MiroirTest.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ConfigurationService, miroirCoreStartup } from "miroir-core";
import { openTestEnvironment } from "miroir-env";

import * as miroirMcp from "../../src/index.js";
import { requiredStoreTypes, initializeStoreStartup } from "../../src/startup/storeStartup.js";

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"));

describe("miroir-mcp package surface", () => {
  it("exports no configuration loader and declares no binary", () => {
    expect(Object.keys(miroirMcp)).not.toContain("loadMiroirMcpConfig");
    expect(Object.keys(miroirMcp)).not.toContain("MiroirMcpConfigSchema");
    expect(packageJson.bin).toBeUndefined();
  });

  it("starts the stores a test environment's client configuration uses", async () => {
    const { miroirConfig } = openTestEnvironment("test-filesystem");
    expect([...requiredStoreTypes(miroirConfig)]).toEqual(["filesystem"]);

    miroirCoreStartup();
    await initializeStoreStartup(miroirConfig);
    expect(ConfigurationService.configurationService.StoreSectionFactoryRegister.has(JSON.stringify({ storageType: "filesystem", section: "model" }))).toBe(true);
  });
});
