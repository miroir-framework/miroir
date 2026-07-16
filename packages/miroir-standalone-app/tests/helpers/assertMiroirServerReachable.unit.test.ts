import { describe, expect, it, vi } from "vitest";

import {
  assertMiroirServerReachable,
  MiroirServerUnreachableError,
} from "../../src/miroir-fwk/4-tests/assertMiroirServerReachable.js";

describe("assertMiroirServerReachable (B6-c C2)", () => {
  it("resolves when fetch returns any HTTP response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 404, ok: false });
    await expect(
      assertMiroirServerReachable("https://localhost:3080", { fetchImpl }),
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://localhost:3080",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws MiroirServerUnreachableError when rootApiUrl is empty", async () => {
    await expect(assertMiroirServerReachable("")).rejects.toBeInstanceOf(
      MiroirServerUnreachableError,
    );
  });

  it("throws MiroirServerUnreachableError when fetch fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(
      assertMiroirServerReachable("https://localhost:3080", { fetchImpl }),
    ).rejects.toMatchObject({
      name: "MiroirServerUnreachableError",
      rootApiUrl: "https://localhost:3080",
      message: expect.stringContaining("Failed to fetch"),
    });
  });
});
