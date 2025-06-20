// strict mode
"use strict";


import { z, ZodError, ZodSchema, ZodTypeAny } from "zod";

type TransformerForBuildA = { transformerType: "A"; interpolation?: "build" };
type TransformerForBuildB = { transformerType: "B"; interpolation?: "build" };
type TransformerForBuildC = {
  transformerType: "C";
  interpolation?: "build";
  t: TransformerForBuild;
};

type TransformerForBuild =
    | string
    | number
    | boolean
    | TransformerForBuild[]
    | (
      {
        [P in string]: TransformerForBuild;
      }
       & {
        [P in "transformerType"]?: never;
      }
    )
  | TransformerForBuildA
  | TransformerForBuildB
  | TransformerForBuildC
;

const transformerForBuildA: z.ZodType<TransformerForBuildA> = z.lazy(() => 
  z.object({
    transformerType: z.literal('A'),
    interpolation: z.literal('build').optional()
  }).strict()
);

const transformerForBuildB: z.ZodType<TransformerForBuildB> = z.lazy(() => 
  z.object({
    transformerType: z.literal('B'),
    interpolation: z.literal('build').optional()
  }).strict()
);

const transformerForBuildC: z.ZodType<TransformerForBuildC> = z.lazy(() => 
  z.object({
    transformerType: z.literal('C'),
    interpolation: z.literal('build').optional(),
    t: transformerForBuild
  }).strict()
);
const transformerForBuild: z.ZodType<TransformerForBuild> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerType = z.record(
    z.string(),
    transformerForBuild
  ).refine(
    obj => !('transformerType' in obj),
    {
      message: "Object must not contain 'transformerType' key",
      path: ['transformerType']
    }
  );
  
  // Define the transformer types with specific transformerType values
  
  // Combine all possible types
  return z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(transformerForBuild),
    recordWithoutTransformerType,
    transformerForBuildA,
    transformerForBuildB,
    transformerForBuildC
  ]);
});

// ################################################################################################
const testBuild0: TransformerForBuild = 1;
const testBuild1: TransformerForBuild ={
  transformerType: "A",
}
const testBuild2: TransformerForBuild = {
  transformerType: "C",
  t: {
    transformerType: "B",
  }
}
const testBuild3: TransformerForBuild = {
  toto: { transformerType: "A" },
};
const testBuild4: TransformerForBuild = {
  transformerType: "C",
  t: { a: { transformerType: "A" }, b: "b", c: { d: [1,2,{ transformerType: "A"}]} },
};

describe("build: Discriminated Union with Optional Interpolation", () => {
  describe("should validate TransformerForBuildA", () => {
    it("should validate with required fields only", () => {
      expect(() => transformerForBuildA.parse({ transformerType: "A" })).not.toThrow();
    });

    it("should validate with optional interpolation", () => {
      expect(() =>
        transformerForBuildA.parse({ transformerType: "A", interpolation: "build" })
      ).not.toThrow();
    });

    it("should NOT allow extra fields", () => {
      expect(() =>
        transformerForBuildA.parse({ transformerType: "A", interpolation: "build", extra: 123 })
      ).toThrow();
    });

    it("should reject wrong discriminator", () => {
      expect(() => transformerForBuildA.parse({ transformerType: "B" })).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForBuildB", () => {
    it("should validate with required fields only", () => {
      expect(() => transformerForBuildB.parse({ transformerType: "B" })).not.toThrow();
    });

    it("should validate with optional interpolation", () => {
      expect(() =>
        transformerForBuildB.parse({ transformerType: "B", interpolation: "build" })
      ).not.toThrow();
    });

    it("should NOT allow extra fields", () => {
      expect(() =>
        transformerForBuildB.parse({ transformerType: "B", interpolation: "build", extra: 123 })
      ).toThrow(ZodError);
    });

    it("should reject wrong discriminator", () => {
      expect(() => transformerForBuildB.parse({ transformerType: "C" })).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForBuildC", () => {
    it("should validate with nested TransformerForBuildC", () => {
      expect(() =>
        transformerForBuildC.parse({ transformerType: "C", t: { transformerType: "A" } })
      ).not.toThrow();
    });

    it("should validate with nested TransformerForBuildC and optional interpolation", () => {
      expect(() =>
        transformerForBuildC.parse({
          transformerType: "C",
          t: { transformerType: "B" },
          interpolation: "build",
        })
      ).not.toThrow();
    });

    it("should validate with complex nested structure", () => {
      expect(() =>
        transformerForBuildC.parse({
          transformerType: "C",
          t: { a: { transformerType: "A" }, b: "b" },
        })
      ).not.toThrow();
    });

    it("should reject invalid nested transformerType", () => {
      expect(() =>
        transformerForBuildC.parse({ transformerType: "C", t: { a: { transformerType: "X" } } })
      ).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForBuild with various structures", () => {
    it("should validate primitive number", () => {
      expect(() => transformerForBuild.parse(testBuild0)).not.toThrow();
    });

    it("should validate simple transformer object", () => {
      expect(() => transformerForBuild.parse(testBuild1)).not.toThrow();
    });

    it("should validate nested transformer objects", () => {
      expect(() => transformerForBuild.parse(testBuild2)).not.toThrow();
    });

    it("should validate object with transformer in property", () => {
      expect(() => transformerForBuild.parse(testBuild3)).not.toThrow();
    });

    it("should validate complex nested structure", () => {
      expect(() => transformerForBuild.parse(testBuild4)).not.toThrow();
    });
  });
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Runtime types for the discriminated union
type TransformerForRuntimeA = { transformerType: "A"; interpolation: "runtime" };
type TransformerForRuntimeB = { transformerType: "B"; interpolation: "runtime" };
type TransformerForRuntimeC = {
  transformerType: "C";
  interpolation: "runtime";
  t: TransformerForRuntime;
};

type TransformerForRuntime =
    | string
    | number
    | boolean
    | TransformerForRuntime[]
    | (
      {
        [P in string]: TransformerForRuntime;
      }
       & {
        [P in "transformerType"]?: never;
      }
    )
  | TransformerForRuntimeA
  | TransformerForRuntimeB
  | TransformerForRuntimeC
;

const transformerForRuntimeA: z.ZodType<TransformerForRuntimeA> = z.lazy(() =>
  z.object({
    transformerType: z.literal('A'),
    interpolation: z.literal('runtime')
  }).strict()
);  
const transformerForRuntimeB: z.ZodType<TransformerForRuntimeB> = z.lazy(() =>
  z.object({
    transformerType: z.literal('B'),
    interpolation: z.literal('runtime')
  }).strict()
);
const transformerForRuntimeC: z.ZodType<TransformerForRuntimeC> = z.lazy(() =>
  z.object({
    transformerType: z.literal('C'),
    interpolation: z.literal('runtime'),
    t: transformerForRuntime
  }).strict()
);
const transformerForRuntime: z.ZodType<TransformerForRuntime> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerType = z.record(
    z.string(),
    transformerForRuntime
  ).refine(
    obj => !('transformerType' in obj),
    {
      message: "Object must not contain 'transformerType' key",
      path: ['transformerType']
    }
  );
  
  // Define the transformer types with specific transformerType values
  
  // Combine all possible types
  return z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(transformerForRuntime),
    recordWithoutTransformerType,
    transformerForRuntimeA,
    transformerForRuntimeB,
    transformerForRuntimeC
  ]);
});

// ################################################################################################
const testRuntime0: TransformerForRuntime = 1;
const testRuntime1: TransformerForRuntime ={
  transformerType: "A",
  interpolation: "runtime"
}
const testRuntime2: TransformerForRuntime = {
  transformerType: "C",
  interpolation: "runtime",
  t: {
    transformerType: "B",
    interpolation: "runtime"
  }
}
const testRuntime3: TransformerForRuntime = {
  toto: { transformerType: "A", interpolation: "runtime" },
};
const testRuntime4: TransformerForRuntime = {
  transformerType: "C",
  interpolation: "runtime",
  t: {
    a: { transformerType: "A", interpolation: "runtime" },
    b: "b",
    c: { d: [1, 2, { transformerType: "B", interpolation: "runtime" }] },
  },
};
describe("runtime: Discriminated Union with Optional Interpolation", () => {
  describe("should validate TransformerForRuntimeA", () => {
    it("should validate TransformerForRuntimeA with required fields", () => {
      expect(() => transformerForRuntimeA.parse({ transformerType: "A", interpolation: "runtime" })).not.toThrow();
    });
    
    it("should NOT allow extra fields in TransformerForRuntimeA", () => {
      expect(() =>
        transformerForRuntimeA.parse({ transformerType: "A", interpolation: "runtime", extra: 123 })
      ).toThrow();
    });
    
    it("should reject TransformerForRuntimeA missing interpolation", () => {
      expect(() => transformerForRuntimeA.parse({ transformerType: "A" })).toThrow(ZodError);
    });
    
    it("should reject TransformerForRuntimeA with wrong discriminator", () => {
      expect(() => transformerForRuntimeA.parse({ transformerType: "B", interpolation: "runtime" })).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForRuntimeB", () => {
    it("should validate TransformerForRuntimeB with required fields", () => {
      expect(() => transformerForRuntimeB.parse({ transformerType: "B", interpolation: "runtime" })).not.toThrow();
    });
    
    it("should NOT allow extra fields in TransformerForRuntimeB", () => {
      expect(() =>
        transformerForRuntimeB.parse({ transformerType: "B", interpolation: "runtime", extra: 123 })
      ).toThrow(ZodError);
    });
    
    it("should reject TransformerForRuntimeB missing interpolation", () => {
      expect(() => transformerForRuntimeB.parse({ transformerType: "B" })).toThrow(ZodError);
    });
    
    it("should reject TransformerForRuntimeB with wrong discriminator", () => {
      expect(() =>
        transformerForRuntimeB.parse({ transformerType: "C", interpolation: "runtime" })
      ).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForRuntimeC", () => {
    it("should validate TransformerForRuntimeC with nested TransformerForRuntimeA", () => {
      expect(() =>
        transformerForRuntimeC.parse({
          transformerType: "C",
          interpolation: "runtime",
          t: { transformerType: "A", interpolation: "runtime" },
        })
      ).not.toThrow();
    });

    it("should validate TransformerForRuntimeC with nested TransformerForRuntimeB", () => {
      expect(() =>
        transformerForRuntimeC.parse({
          transformerType: "C",
          interpolation: "runtime",
          t: { transformerType: "B", interpolation: "runtime" },
        })
      ).not.toThrow();
    });

    it("should validate TransformerForRuntimeC with complex nested structure", () => {
      expect(() =>
        transformerForRuntimeC.parse({
          transformerType: "C",
          interpolation: "runtime",
          t: { a: { transformerType: "A", interpolation: "runtime" }, b: "b" },
        })
      ).not.toThrow();
    });

    it("should reject TransformerForRuntimeC with invalid nested transformerType", () => {
      expect(() =>
        transformerForRuntimeC.parse({
          transformerType: "C",
          interpolation: "runtime",
          t: { a: { transformerType: "X", interpolation: "runtime" } },
        })
      ).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForRuntime with various structures", () => {
    it("should validate primitive number", () => {
      expect(() => transformerForRuntime.parse(testRuntime0)).not.toThrow();
    });
    
    it("should validate simple transformer object", () => {
      expect(() => transformerForRuntime.parse(testRuntime1)).not.toThrow();
    });
    
    it("should validate nested transformer objects", () => {
      expect(() => transformerForRuntime.parse(testRuntime2)).not.toThrow();
    });
    
    it("should validate object with transformer in property", () => {
      expect(() => transformerForRuntime.parse(testRuntime3)).not.toThrow();
    });
    
    it("should validate complex nested structure", () => {
      expect(() => transformerForRuntime.parse(testRuntime4)).not.toThrow();
    });
  });
});



// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
