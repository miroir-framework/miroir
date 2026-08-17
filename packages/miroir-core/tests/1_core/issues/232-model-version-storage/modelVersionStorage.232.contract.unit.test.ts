/**
 * #232 Slice 1 — section contract: `ApplicationSection` includes `"modelVersion"`.
 *
 * 1.1 RED: the type/validator currently rejects "modelVersion" → fails before the implementation.
 * After GREEN: all three expectations pass.
 */
import { describe, expect, it } from "vitest";

import { applicationSection } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { ApplicationSection } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

describe("232 Slice 1 — ApplicationSection contract", () => {
  it("accepts modelVersion as a valid ApplicationSection", () => {
    const result = applicationSection.safeParse("modelVersion");
    expect(result.success).toBe(true);
  });

  it("still accepts model and data as valid ApplicationSections", () => {
    expect(applicationSection.safeParse("model").success).toBe(true);
    expect(applicationSection.safeParse("data").success).toBe(true);
  });

  it("rejects unknown strings", () => {
    expect(applicationSection.safeParse("unknown-section").success).toBe(false);
  });

  it("ApplicationSection type includes modelVersion (compile-time check)", () => {
    const s: ApplicationSection = "modelVersion";
    expect(s).toBe("modelVersion");
  });
});
