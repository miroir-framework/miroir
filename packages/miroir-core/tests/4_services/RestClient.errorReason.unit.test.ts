/**
 * Over HTTP/2 (the Vite dev server with TLS) a response has an empty statusText. A 502 from the
 * dev proxy with an empty body made RestClient reject with `undefined` ("Uncaught (in promise)
 * undefined" at startup); the rejection names the request and its status instead.
 */
import { describe, expect, it } from "vitest";

import { RestClient } from "../../src/4_services/RestClient.js";

function respondWith(status: number, statusText: string, body: string) {
  return new RestClient(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => body,
  }));
}

describe("RestClient error reason", () => {
  it("names the request and the status when the response has no statusText and no body", async () => {
    const client = respondWith(502, "", "");
    await expect(client.get("/capabilities", "/capabilities")).rejects.toBe("GET /capabilities: HTTP 502");
  });

  it("adds the statusText when there is one", async () => {
    const client = respondWith(502, "Bad Gateway", "");
    await expect(client.get("/capabilities", "/capabilities")).rejects.toBe(
      "GET /capabilities: HTTP 502 Bad Gateway",
    );
  });

  it("rejects with the fetch failure when the request does not reach a server", async () => {
    const client = new RestClient(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(client.get("/capabilities", "/capabilities")).rejects.toBe("Failed to fetch");
  });
});
