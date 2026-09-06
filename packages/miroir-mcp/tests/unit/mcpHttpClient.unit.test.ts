import { describe, expect, it, vi } from "vitest";

import { resolveMcpHttpFetch } from "../../src/mcpHttpClient.js";

describe("resolveMcpHttpFetch", () => {
  it("answers GET /mcp with 405 without calling the inner fetch", async () => {
    const inner = vi.fn();
    const fetchImpl = resolveMcpHttpFetch(inner);

    const response = await fetchImpl(new URL("https://localhost:5173/mcp"), {
      method: "GET",
      headers: { Accept: "text/event-stream" },
    });

    expect(inner).not.toHaveBeenCalled();
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
  });

  it("forwards POST /mcp to the inner fetch", async () => {
    const inner = vi.fn(async () => new Response("ok", { status: 200 }));
    const fetchImpl = resolveMcpHttpFetch(inner);

    const response = await fetchImpl(new URL("https://localhost:5173/mcp"), {
      method: "POST",
      body: "{}",
    });

    expect(inner).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });
});
