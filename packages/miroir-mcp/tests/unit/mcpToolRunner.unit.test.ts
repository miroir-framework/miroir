/**
 * #672 D6: `runMcpToolRunner` belongs to the browser-safe client entry, so the apps' shell hosts and the runner
 * tests of miroir-react-testing call the same function.
 */
import { describe, expect, it } from "vitest";
import type { Runner } from "@miroir-framework/core";

import { runMcpToolRunner } from "../../src/client.js";

const mcpToolRunner = {
  uuid: "00000000-0000-4000-8000-000000000672",
  parentUuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
  name: "runMcpToolRunner672",
  definition: { runnerType: "mcpToolRunner", toolName: "miroir_getInstances" },
} as unknown as Runner;

const unreachableFetch = async (): Promise<Response> => {
  throw new Error("connect ECONNREFUSED 127.0.0.1:9");
};

describe("runMcpToolRunner (client entry)", () => {
  it("answers FeatureUnavailable when the mcp capability is off, without calling the server", async () => {
    const envelope = await runMcpToolRunner(mcpToolRunner, {}, "http://127.0.0.1:9/mcp", { mcp: false }, unreachableFetch);

    expect(envelope).toEqual({
      status: "error",
      error: { message: 'Process capability "mcp" is not available', type: "FeatureUnavailable", capability: "mcp" },
    });
  });

  it("turns a failed call into an error envelope", async () => {
    const envelope = await runMcpToolRunner(mcpToolRunner, {}, "http://127.0.0.1:9/mcp", { mcp: true }, unreachableFetch);

    expect(envelope.status).toBe("error");
    expect(envelope.error?.type).toBe("FailedToHandleAction");
  });

  it("rejects a runner that is not an mcpToolRunner", async () => {
    const other = { ...mcpToolRunner, definition: { runnerType: "customRunner" } } as unknown as Runner;

    await expect(runMcpToolRunner(other, {}, "http://127.0.0.1:9/mcp", { mcp: true })).rejects.toThrow(
      "expected mcpToolRunner, got customRunner",
    );
  });
});
