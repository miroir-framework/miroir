import { describe, expect, it } from "vitest";
import {
  defaultMiroirModelEnvironment,
  jzodUnion_recursivelyUnfold,
  unionObjectChoices,
  type JzodUnion,
  type MiroirModelEnvironment,
} from "miroir-core";

describe("payload union internals", () => {
  it("inspects unfolded union and object choices", () => {
    const ctx = (defaultMiroirModelEnvironment as any).miroirFundamentalJzodSchema
      .definition.context;
    const domainActionTemplate =
      ctx["miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"];
    const branch = domainActionTemplate.definition.find(
      (b: any) => b.definition?.actionType?.definition === "prepareOpenApiDocument",
    );
    const payloadSchema = branch.definition.payload as JzodUnion;

    const unfolded = jzodUnion_recursivelyUnfold(
      payloadSchema,
      new Set(),
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
    );
    if (unfolded.status === "error") {
      console.error("unfold error", unfolded);
      return;
    }
    console.log(
      "unfolded types:",
      unfolded.result.map((e: any) =>
        e.type === "schemaReference" ? `ref:${e.definition.relativePath}` : e.type,
      ),
    );
    const choices = unionObjectChoices(
      unfolded.result,
      defaultMiroirModelEnvironment as MiroirModelEnvironment,
      {},
    );
    console.log("object choices count:", choices.length);
    for (const c of choices) {
      console.log(
        "choice keys:",
        Object.keys((c as any).definition ?? {}),
        "transformerType=",
        JSON.stringify((c as any).definition?.transformerType),
      );
    }
    expect(true).toBe(true);
  });
});
