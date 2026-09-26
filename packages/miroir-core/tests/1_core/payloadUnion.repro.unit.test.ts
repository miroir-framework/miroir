import { describe, expect, it } from "vitest";
import {
  defaultMiroirModelEnvironment,
  jzodTypeCheck,
  type MlElement,
  type MiroirModelEnvironment,
} from "miroir-core";

describe("payload union resolution repro", () => {
  it("getFromParameters value resolves against payload union", () => {
    const ctx = (defaultMiroirModelEnvironment as any).miroirFundamentalJzodSchema
      .definition.context;
    const domainActionTemplate =
      ctx["miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"];
    const branch = domainActionTemplate.definition.find(
      (b: any) => b.definition?.actionType?.definition === "prepareOpenApiDocument",
    );
    const payloadSchema = branch.definition.payload as MlElement;
    console.log("payloadSchema type:", payloadSchema.type);

    const value = {
      text: {
        transformerType: "getFromParameters",
        interpolation: "runtime",
        safe: true,
        referencePath: ["document", "text"],
      },
    };

    const result = jzodTypeCheck(
      payloadSchema,
      value,
      [],
      [],
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
      value, // currentDefaultValue
      {} as any, // reduxDeploymentsState — truthy: UI path
      undefined,
      value, // rootObject
    );
    if (result.status !== "ok") {
      console.error("failed:", JSON.stringify(result, null, 2).slice(0, 3000));
    }
    expect(result.status).toBe("ok");
  });
});
