import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "../../src");

function readSrc(relativePath: string): string {
  return readFileSync(join(srcRoot, relativePath), "utf8");
}

describe("browser client entry isolation", () => {
  it("does not import the Node MCP server, Express, or the CLI entry", () => {
    const client = readSrc("client.ts");
    const http = readSrc("mcpHttpClient.ts");
    const constants = readSrc("mcpConstants.ts");

    expect(client.startsWith("#!")).toBe(false);
    expect(client).not.toMatch(/mcpServer|express|ephemeralMcpHttp|from ["']\.\/index/);
    expect(http).not.toMatch(/mcpServer|express/);
    expect(http).toMatch(/mcpConstants/);
    expect(constants).toContain('"/mcp"');
  });
});
