import { describe, expect, it } from "vitest";

import { TransformerFailure } from "../../src/0_interfaces/2_domain/DomainElement";
import { transformer_resolveReference } from "../../src/2_domain/TransformersForRuntime";

const contextBank = {
  row: { uuid: "row-1", name: "Ada" },
  defaultInput: [{ uuid: "row-1", name: "Ada" }, { uuid: "row-2", name: "Grace" }],
};

describe("transformer_resolveReference", () => {
  it("does not return the whole context bank for an empty referencePath", () => {
    expect(() =>
      transformer_resolveReference(
        "runtime",
        ["test"],
        {
          interpolation: "runtime",
          transformerType: "getFromContext",
          referencePath: [],
        } as any,
        "context",
        {},
        contextBank,
      ),
    ).toThrow(TransformerFailure);
  });

  it("still resolves a non-empty referencePath", () => {
    const result = transformer_resolveReference(
      "runtime",
      ["test"],
      {
        interpolation: "runtime",
        transformerType: "getFromContext",
        referencePath: ["row", "name"],
      } as any,
      "context",
      {},
      contextBank,
    );

    expect(result).toBe("Ada");
  });
});
