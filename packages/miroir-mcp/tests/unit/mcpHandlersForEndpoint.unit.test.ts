import { describe, expect, it } from "vitest";
import { z } from "zod";

import { handleMcpAction } from "../../src/tools/mcpHandlersForEndpoint.js";

describe("handleMcpAction validation", () => {
  it("returns a structured validation_error for missing required args without throwing", async () => {
    const result = await handleMcpAction(
      "Library_lendDocument",
      {
        user: "04c371ed-702d-4dd9-a06d-8a04eda5d24f",
        startDate: "2024-01-01T00:00:00.000Z",
      },
      z.object({
        user: z.string(),
        book: z.string(),
        startDate: z.string(),
      }),
      async () => {
        throw new Error("execute must not run when args fail validation");
      },
    );

    const parsed = result.content[0]?.parsed;
    expect(parsed?.status).toBe("error");
    expect(parsed?.error?.type).toBe("validation_error");
    expect(String(parsed?.error?.message)).toContain("book: Invalid input: expected string, received undefined");
    expect(result.content[0]?.text).not.toContain("ZodError");
  });
});
