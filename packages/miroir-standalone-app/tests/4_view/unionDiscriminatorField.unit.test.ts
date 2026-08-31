import { describe, expect, it } from "vitest";

import {
  isPrimaryUnionDiscriminatorField,
  primaryUnionDiscriminatorField,
} from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/unionDiscriminatorField.js";

describe("unionDiscriminatorField", () => {
  it("treats transformerType as the primary field of the transformer union", () => {
    const discriminator = ["transformerType", "interpolation"];
    expect(primaryUnionDiscriminatorField(discriminator)).toBe("transformerType");
    expect(isPrimaryUnionDiscriminatorField("transformerType", discriminator)).toBe(true);
    expect(isPrimaryUnionDiscriminatorField("interpolation", discriminator)).toBe(false);
  });

  it("treats a string discriminator as primary", () => {
    expect(isPrimaryUnionDiscriminatorField("kind", "kind")).toBe(true);
    expect(isPrimaryUnionDiscriminatorField("other", "kind")).toBe(false);
  });
});
