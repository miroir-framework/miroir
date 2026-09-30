import { describe, expect, it } from "vitest";

import type { MlElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { mlToZod, mlToZodTextAndZodSchema, valueToMl } from "../../../src/1_core/mls/mlJzodAdapter";

// #145: the adapter is the only door from Miroir to @miroir-framework/jzod.
const bookSchema: MlElement = {
  type: "object",
  definition: {
    title: { type: "string" },
    pages: { type: "number", optional: true },
  },
};

describe("mlJzodAdapter", () => {
  describe("valueToMl", () => {
    it("returns the schema of a scalar", () => {
      expect(valueToMl("a")).toEqual({ type: "string" });
      expect(valueToMl(1)).toEqual({ type: "number" });
    });

    it("returns the schema of an object", () => {
      expect(valueToMl({ title: "Dune", pages: 412 })).toEqual({
        type: "object",
        definition: { title: { type: "string" }, pages: { type: "number" } },
      });
    });

    it("returns an array or a tuple schema depending on the array resolution", () => {
      expect(valueToMl(["a", "b"], "arrayAsArray")).toEqual({ type: "array", definition: { type: "string" } });
      expect(valueToMl(["a", 1], "arrayAsTuple")).toEqual({
        type: "tuple",
        definition: [{ type: "string" }, { type: "number" }],
      });
    });
  });

  describe("mlToZod", () => {
    it("returns a Zod schema that parses the values of the ML schema", () => {
      const zodSchema = mlToZod(bookSchema);
      expect(zodSchema.safeParse({ title: "Dune" }).success).toBe(true);
      expect(zodSchema.safeParse({ title: 1 }).success).toBe(false);
    });
  });

  describe("mlToZodTextAndZodSchema", () => {
    it("returns the Zod text and a Zod schema", () => {
      const result = mlToZodTextAndZodSchema(bookSchema);
      expect(result.zodText).toContain("z.string()");
      expect(result.zodSchema.safeParse({ title: "Dune", pages: 412 }).success).toBe(true);
      expect(result.zodSchema.safeParse({ pages: 412 }).success).toBe(false);
    });

    it("reads dates as strings with datesAsString", () => {
      const dateSchema: MlElement = { type: "date" };
      expect(mlToZodTextAndZodSchema(dateSchema).zodSchema.safeParse("2026-09-28").success).toBe(false);
      expect(
        mlToZodTextAndZodSchema(dateSchema, () => ({}), () => ({}), { datesAsString: true }).zodSchema.safeParse(
          "2026-09-28"
        ).success
      ).toBe(true);
    });
  });
});
