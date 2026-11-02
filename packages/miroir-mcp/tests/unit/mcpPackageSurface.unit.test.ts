// #345 Slice 2: miroir-mcp is a library. MCP is served by miroir-server and Electron from their
// environment; the package has no configuration of its own. vitest: package wiring, not reachable
// through MiroirTest.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import * as miroirMcp from "../../src/index.js";

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"));

describe("miroir-mcp package surface", () => {
  it("exports no configuration loader and declares no binary", () => {
    expect(Object.keys(miroirMcp)).not.toContain("loadMiroirMcpConfig");
    expect(Object.keys(miroirMcp)).not.toContain("MiroirMcpConfigSchema");
    expect(packageJson.bin).toBeUndefined();
  });
});
