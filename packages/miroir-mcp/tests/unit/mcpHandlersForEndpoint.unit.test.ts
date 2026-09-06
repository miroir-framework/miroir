import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { DomainControllerInterface } from "miroir-core";
import { handleMcpAction } from "../../src/tools/mcpHandlersForEndpoint.js";

const unusedDomainController = {} as DomainControllerInterface;

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
      () => {
        throw new Error("actionBuilder must not run when args fail validation");
      },
      unusedDomainController,
      {},
    );

    const parsed = result.content[0]?.parsed;
    expect(parsed?.status).toBe("error");
    expect(parsed?.error?.type).toBe("validation_error");
    expect(String(parsed?.error?.message)).toContain("book: Required");
    expect(result.content[0]?.text).not.toContain("ZodError");
  });
});
