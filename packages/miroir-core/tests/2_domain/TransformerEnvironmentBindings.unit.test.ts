import { describe, expect, it } from "vitest";

import type { CoreTransformerForBuildPlusRuntime } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultTransformerInput } from "../../src/0_interfaces/1_core/Transformer";
import {
  collectTransformerEnvironmentBindings,
  formatTransformerEnvironmentLabel,
} from "../../src/2_domain/TransformerEnvironmentBindings";

const identityRow: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "getFromContext",
  referenceName: "row",
};

const listRootEnv = {
  contextNames: ["row", defaultTransformerInput],
  parameterNames: ["pageSize"],
};

describe("collectTransformerEnvironmentBindings", () => {
  it("lists row and defaultInput on mergeIntoObject applyTo and overlay", () => {
    const transformer: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "mergeIntoObject",
      applyTo: identityRow,
      definition: {
        interpolation: "runtime",
        transformerType: "createObject",
        definition: {
          newRecordEntry: {
            transformerType: "returnValue",
            value: 0,
          },
        },
      },
    };
    const bindings = collectTransformerEnvironmentBindings(transformer, listRootEnv);
    const byPath = Object.fromEntries(
      bindings.map((binding) => [binding.path.map(String).join(".") || "root", binding]),
    );

    expect(byPath.root.contextNames).toEqual(["defaultInput", "row"]);
    expect(byPath.root.parameterNames).toEqual(["pageSize"]);
    expect(byPath.applyTo.contextNames).toEqual(["defaultInput", "row"]);
    expect(byPath.applyTo.transformerType).toBe("getFromContext");
    expect(byPath["applyTo.referenceName"].contextNames).toEqual(["defaultInput", "row"]);
    expect(byPath["applyTo.referenceName"].parameterNames).toEqual([]);
    expect(byPath.definition.contextNames).toEqual(["defaultInput", "row"]);
    expect(byPath["definition.definition.newRecordEntry"].contextNames).toEqual([
      "defaultInput",
      "row",
    ]);
  });

  it("adds mergeIntoObject.referenceToOuterObject on the overlay only", () => {
    const transformer: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "mergeIntoObject",
      referenceToOuterObject: "outer",
      applyTo: identityRow,
      definition: {
        interpolation: "runtime",
        transformerType: "createObject",
        definition: {},
      },
    };
    const bindings = collectTransformerEnvironmentBindings(transformer, {
      contextNames: ["row"],
      parameterNames: [],
    });
    const applyTo = bindings.find((binding) => binding.path.join(".") === "applyTo");
    const overlay = bindings.find((binding) => binding.path.join(".") === "definition");
    expect(applyTo?.contextNames).toEqual(["row"]);
    expect(overlay?.contextNames).toEqual(["outer", "row"]);
  });

  it("threads dataflowObject step names into later steps", () => {
    const transformer: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "dataflowObject",
      definition: {
        names: {
          interpolation: "runtime",
          transformerType: "returnValue",
          value: "n",
        },
        first: {
          interpolation: "runtime",
          transformerType: "getFromContext",
          referenceName: "names",
        },
      },
    };
    const bindings = collectTransformerEnvironmentBindings(transformer, {
      contextNames: ["row"],
      parameterNames: [],
    });
    const names = bindings.find((binding) => binding.path.join(".") === "definition.names");
    const first = bindings.find((binding) => binding.path.join(".") === "definition.first");
    expect(names?.contextNames).toEqual(["row"]);
    expect(first?.contextNames).toEqual(["names", "row"]);
  });

  it("binds mapList.elementTransformer to referenceToOuterObject", () => {
    const transformer: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "mapList",
      referenceToOuterObject: "item",
      applyTo: {
        interpolation: "runtime",
        transformerType: "returnValue",
        value: [],
      },
      elementTransformer: {
        interpolation: "runtime",
        transformerType: "getFromContext",
        referenceName: "item",
      },
    };
    const bindings = collectTransformerEnvironmentBindings(transformer, {
      contextNames: ["row"],
      parameterNames: [],
    });
    const applyTo = bindings.find((binding) => binding.path.join(".") === "applyTo");
    const element = bindings.find((binding) => binding.path.join(".") === "elementTransformer");
    expect(applyTo?.contextNames).toEqual(["row"]);
    expect(element?.contextNames).toEqual(["item", "row"]);
  });

  it("lists getFromParameters names on referenceName", () => {
    const transformer: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "getFromParameters",
      referenceName: "pageSize",
    };
    const bindings = collectTransformerEnvironmentBindings(transformer, listRootEnv);
    const referenceName = bindings.find((binding) => binding.path.join(".") === "referenceName");
    expect(referenceName?.parameterNames).toEqual(["pageSize"]);
    expect(referenceName?.contextNames).toEqual([]);
    expect(formatTransformerEnvironmentLabel(referenceName!)).toBe("getFromParameters: pageSize");
  });
});

describe("formatTransformerEnvironmentLabel", () => {
  it("joins both banks for transformer nodes", () => {
    expect(
      formatTransformerEnvironmentLabel({
        path: [],
        transformerType: "mergeIntoObject",
        contextNames: ["defaultInput", "row"],
        parameterNames: [],
      }),
    ).toBe("getFromContext: defaultInput, row · getFromParameters: (none)");
  });
});
