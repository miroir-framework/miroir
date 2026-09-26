import { describe, expect, it } from "vitest";
import {
  defaultMiroirModelEnvironment,
  jzodUnion_recursivelyUnfold,
  jzodUnionResolvedTypeForObject,
  type MlUnion,
  type MiroirModelEnvironment,
} from "miroir-core";

describe("union resolved type for object", () => {
  it("picks getFromParameters branch for transformer value", () => {
    const ctx = (defaultMiroirModelEnvironment as any).miroirFundamentalJzodSchema
      .definition.context;
    const domainActionTemplate =
      ctx["miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"];
    const branch = domainActionTemplate.definition.find(
      (b: any) => b.definition?.actionType?.definition === "prepareOpenApiDocument",
    );
    const payloadSchema = branch.definition.payload as MlUnion;

    const unfolded = jzodUnion_recursivelyUnfold(
      payloadSchema,
      new Set(),
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
    );
    if (unfolded.status === "error") throw new Error("unfold failed");

    const value = {
      transformerType: "getFromParameters",
      interpolation: "runtime",
      safe: true,
      referencePath: ["document", "text"],
    };

    const resolved = jzodUnionResolvedTypeForObject(
      unfolded.result,
      payloadSchema,
      payloadSchema.discriminator,
      value,
      [],
      [],
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
    );
    if (resolved.status === "error") {
      console.error("resolve error:", JSON.stringify(resolved, null, 2).slice(0, 2500));
    } else {
      console.log(
        "resolved schema keys:",
        Object.keys((resolved.resolvedJzodObjectSchema as any).definition ?? {}),
      );
    }
    expect(resolved.status).toBe("ok");
  });
});
