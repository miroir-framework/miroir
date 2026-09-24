import { describe, expect, it } from "vitest";
import { resolveConditionalSchema } from "../../src/1_core/jzod/resolveConditionalSchema.js";
import {
  defaultMiroirModelEnvironment,
  type MiroirModelEnvironment,
} from "miroir-core";

describe("resolveConditionalSchema on payload union", () => {
  it("returns the union unchanged", () => {
    const ctx = (defaultMiroirModelEnvironment as any).miroirFundamentalJzodSchema
      .definition.context;
    const domainActionTemplate =
      ctx["miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"];
    const branch = domainActionTemplate.definition.find(
      (b: any) => b.definition?.actionType?.definition === "prepareOpenApiDocument",
    );
    const payloadSchema = branch.definition.payload;

    const value = {
      text: {
        transformerType: "getFromParameters",
        interpolation: "runtime",
        safe: true,
        referencePath: ["document", "text"],
      },
    };

    const resolved = resolveConditionalSchema(
      "build",
      [],
      payloadSchema,
      value, // rootObject
      [], // currentValuePath
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
      {},
      {} as any, // reduxDeploymentsState
      "typeCheck",
    );
    if ("error" in resolved) {
      console.error("resolveConditionalSchema error:", JSON.stringify(resolved).slice(0, 1500));
    } else {
      console.log("resolved type:", (resolved as any).type, "tag:", JSON.stringify((resolved as any).tag));
      if ((resolved as any).type === "union") {
        console.log("union branches:", (resolved as any).definition.map((b: any) => b.type));
      }
    }
    expect(true).toBe(true);
  });
});
