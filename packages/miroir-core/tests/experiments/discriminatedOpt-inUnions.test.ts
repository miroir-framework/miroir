// strict mode
"use strict";


import { z, ZodError, ZodSchema, ZodTypeAny } from "zod";

type TransformerForBuildA = { transformerType: "A"; interpolation?: "build" };
type TransformerForBuildB = { transformerType: "B"; interpolation?: "build" };
type TransformerForBuildC = {
  transformerType: "C";
  interpolation?: "build";
  t: TransformerForBuildTest;
};

type TransformerForBuildTest =
    | string
    | number
    | boolean
    | TransformerForBuildTest[]
    | (
      {
        [P in string]: TransformerForBuildTest;
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
const transformerForBuild: z.ZodType<TransformerForBuildTest> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerType = z.record(
    z.string(),
    transformerForBuild
  ).refine(
    obj => !('transformerType' in obj),
    // obj => !Object.hasOwn(obj,'transformerType'),
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
const testBuild0: TransformerForBuildTest = 1;
const testBuild1: TransformerForBuildTest ={
  transformerType: "A",
}
const testBuild2: TransformerForBuildTest = {
  transformerType: "C",
  t: {
    transformerType: "B",
    interpolation: "build"
  }
}
const testBuild3: TransformerForBuildTest = {
  toto: { transformerType: "A" },
};
const testBuild4: TransformerForBuildTest = {
  transformerType: "C",
  t: { a: { transformerType: "A" }, b: "b", c: { d: [1,2,{ transformerType: "A"}]} },
};

const TestBuild5: TransformerForBuildTest = {
  t: { a: { transformerType: "A" }, b: "b" },
  u: { a: { b: { transformerType: "B" } }, c: { transformerType: "B"} },
}

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

    it("should validate complex nested structure with plain object root", () => {
      expect(() =>
        transformerForBuild.parse(TestBuild5)
      ).not.toThrow();
    });

  });
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Runtime types for the discriminated union
type TransformerForRuntimeTestA = { transformerType: "A"; interpolation: "runtime" };
type TransformerForRuntimeTestB = { transformerType: "B"; interpolation: "runtime" };
type TransformerForRuntimeTestC = {
  transformerType: "C";
  interpolation: "runtime";
  t: TransformerForRuntimeTest;
};

type TransformerForRuntimeTest =
    | string
    | number
    | boolean
    | TransformerForRuntimeTest[]
    | (
      {
        [P in string]: TransformerForRuntimeTest;
      }
       & {
        [P in "transformerType"]?: never;
      }
    )
  | TransformerForRuntimeTestA
  | TransformerForRuntimeTestB
  | TransformerForRuntimeTestC
;

const transformerForRuntimeA: z.ZodType<TransformerForRuntimeTestA> = z.lazy(() =>
  z.object({
    transformerType: z.literal('A'),
    interpolation: z.literal('runtime')
  }).strict()
);  
const transformerForRuntimeB: z.ZodType<TransformerForRuntimeTestB> = z.lazy(() =>
  z.object({
    transformerType: z.literal('B'),
    interpolation: z.literal('runtime')
  }).strict()
);
const transformerForRuntimeC: z.ZodType<TransformerForRuntimeTestC> = z.lazy(() =>
  z.object({
    transformerType: z.literal('C'),
    interpolation: z.literal('runtime'),
    t: transformerForRuntime
  }).strict()
);
const transformerForRuntime: z.ZodType<TransformerForRuntimeTest> = z.lazy(() => {
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
const testRuntime0: TransformerForRuntimeTest = 1;
const testRuntime1: TransformerForRuntimeTest ={
  transformerType: "A",
  interpolation: "runtime"
}
const testRuntime2: TransformerForRuntimeTest = {
  transformerType: "C",
  interpolation: "runtime",
  t: {
    transformerType: "B",
    interpolation: "runtime"
  }
}
const testRuntime3: TransformerForRuntimeTest = {
  toto: { transformerType: "A", interpolation: "runtime" },
};
const testRuntime4: TransformerForRuntimeTest = {
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
type TransformerForBuildOrRuntimeTestA = TransformerForBuildA | TransformerForRuntimeTestA;
type TransformerForBuildOrRuntimeTestB = TransformerForBuildB | TransformerForRuntimeTestB;
type TransformerForBuildOrRuntimeTestC = TransformerForBuildC | TransformerForRuntimeTestC;

type TransformerForBuildOrRuntimeTest =
  | string
  | number
  | boolean
  | TransformerForBuildOrRuntimeTest[]
  | ({
      [P in string]: TransformerForBuildOrRuntimeTest;
    } & {
      [P in "transformerType" | "interpolation"]?: never;
    })
  | TransformerForBuildA
  | TransformerForBuildB
  | TransformerForBuildC
  | TransformerForRuntimeTestA
  | TransformerForRuntimeTestB
  | TransformerForRuntimeTestC;

const transformerForBuildOrRuntimeA: z.ZodType<TransformerForBuildOrRuntimeTestA> = z.union(
  [
    transformerForBuildA,
    transformerForRuntimeA
  ]
)
const transformerForBuildOrRuntimeB: z.ZodType<TransformerForBuildOrRuntimeTestB> = z.union(
  [
    transformerForBuildB,
    transformerForRuntimeB
  ]
)
const transformerForBuildOrRuntimeC: z.ZodType<TransformerForBuildOrRuntimeTestC> = z.union(
  [
    transformerForBuildC,
    transformerForRuntimeC
  ]
);

const transformerForBuildOrRuntimeTest: z.ZodType<TransformerForBuildOrRuntimeTest> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerTypeOrInterpolation = z.record(
    z.string(),
    transformerForRuntime
  ).refine(
    obj => !('transformerType' in obj || 'interpolation' in obj),
    {
      message: "Object must not contain 'transformerType' or 'interpolation' key",
      path: ['transformerType']
    }
  );
  
  // Define the transformer types with specific transformerType values
  
  // Combine all possible types
  return z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(transformerForBuildOrRuntimeTest),
    recordWithoutTransformerTypeOrInterpolation,
    transformerForBuildOrRuntimeA,
    transformerForBuildOrRuntimeB,
    transformerForBuildOrRuntimeC,
  ]);
});

const testBuildOrRuntime0: TransformerForBuildOrRuntimeTest = 1;
const testBuildOrRuntime1: TransformerForBuildOrRuntimeTest = {
  transformerType: "A",
  interpolation: "runtime"
};
const testBuildOrRuntime2: TransformerForBuildOrRuntimeTest = {
  transformerType: "C",
  interpolation: "build",
  t: {
    transformerType: "B",
    // interpolation: "build" // build is optional
  }
};
const testBuildOrRuntime3: TransformerForBuildOrRuntimeTest = {
  transformerType: "C",
  interpolation: "build",
  t: {
    transformerType: "B",
    interpolation: "build"
  }
};
const testBuildOrRuntime4: TransformerForBuildOrRuntimeTest = {
  toto: { transformerType: "A", interpolation: "runtime" },
};
const testBuildOrRuntime5: TransformerForBuildOrRuntimeTest = {
  transformerType: "C",
  interpolation: "runtime",
  t: {
    a: { transformerType: "A", interpolation: "runtime" },
    b: "b",
    c: { d: [1, 2, { transformerType: "B", interpolation: "runtime" }] },
  },
};

describe("buildOrRuntime: Discriminated Union with Optional Interpolation", () => {
  describe("should validate TransformerForBuildOrRuntimeA", () => {
    it("should validate with required fields only", () => {
      expect(() =>
        transformerForBuildOrRuntimeA.parse({ transformerType: "A", interpolation: "runtime" })
      ).not.toThrow();
    });

    it("should validate with optional interpolation", () => {
      expect(() => transformerForBuildOrRuntimeA.parse({ transformerType: "A" })).not.toThrow();
    });

    it("should NOT allow extra fields", () => {
      expect(() =>
        transformerForBuildOrRuntimeA.parse({
          transformerType: "A",
          interpolation: "runtime",
          extra: 123,
        })
      ).toThrow(ZodError);
    });

    it("should reject wrong discriminator", () => {
      expect(() =>
        transformerForBuildOrRuntimeA.parse({ transformerType: "B", interpolation: "runtime" })
      ).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForBuildOrRuntimeB", () => {
    it("should validate with required fields only", () => {
      expect(() =>
        transformerForBuildOrRuntimeB.parse({ transformerType: "B", interpolation: "runtime" })
      ).not.toThrow();
    });

    it("should validate with optional interpolation", () => {
      expect(() => transformerForBuildOrRuntimeB.parse({ transformerType: "B" })).not.toThrow();
    });

    it("should NOT allow extra fields", () => {
      expect(() =>
        transformerForBuildOrRuntimeB.parse({
          transformerType: "B",
          interpolation: "runtime",
          extra: 123,
        })
      ).toThrow(ZodError);
    });

    it("should reject wrong discriminator", () => {
      expect(() =>
        transformerForBuildOrRuntimeB.parse({ transformerType: "C", interpolation: "runtime" })
      ).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForBuildOrRuntimeC", () => {
    it("should validate with nested TransformerForBuildOrRuntimeC and optional interpolation", () => {
      expect(() =>
        transformerForBuildOrRuntimeC.parse({
          transformerType: "C",
          t: { transformerType: "A" },
          interpolation: "build",
        })
      ).not.toThrow();
    });

    it("should validate with nested TransformerForBuildOrRuntimeC and optional interpolation in t", () => {
      expect(() =>
        transformerForBuildOrRuntimeC.parse({
          transformerType: "C",
          t: { transformerType: "B" },
          interpolation: "build",
        })
      ).not.toThrow();
    });
    it("should validate with complex nested structure", () => {
      expect(() =>
        transformerForBuildOrRuntimeC.parse({
          transformerType: "C",
          t: { a: { transformerType: "A" }, b: "b" },
          interpolation: "build",
        })
      ).not.toThrow();
    });
    it("should reject invalid nested transformerType", () => {
      expect(() =>
        transformerForBuildOrRuntimeC.parse({
          transformerType: "C",
          t: { a: { transformerType: "X" } },
          interpolation: "build",
        })
      ).toThrow(ZodError);
    });
  });

  describe("should validate TransformerForBuildOrRuntime with various structures", () => {
    it("should validate primitive number", () => {
      expect(() => transformerForBuildOrRuntimeTest.parse(testBuildOrRuntime0)).not.toThrow();
    });

    it("should validate simple transformer object", () => {
      expect(() => transformerForBuildOrRuntimeTest.parse(testBuildOrRuntime1)).not.toThrow();
    });

    it("should validate nested transformer objects", () => {
      expect(() => transformerForBuildOrRuntimeTest.parse(testBuildOrRuntime2)).not.toThrow();
    });

    it("should validate object with transformer in property", () => {
      expect(() => transformerForBuildOrRuntimeTest.parse(testBuildOrRuntime3)).not.toThrow();
    });

    it("should validate complex nested structure", () => {
      expect(() => transformerForBuildOrRuntimeTest.parse(testBuildOrRuntime4)).not.toThrow();
    });

    it("should validate complex nested structure with runtime interpolation", () => {
      expect(() => transformerForBuildOrRuntimeTest.parse(testBuildOrRuntime5)).not.toThrow();
    });
  });
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
type TransformerForBuildPlusRuntimeA = TransformerForBuildA | TransformerForRuntimeTestA;
type TransformerForBuildPlusRuntimeB = TransformerForBuildB | TransformerForRuntimeTestB;
type TransformerForBuildPlusRuntimeC = {
  transformerType: "C";
  interpolation?: "build";
  t: TransformerForBuildPlusRuntime;
};

type TransformerForBuildPlusRuntime =
    | string
    | number
    | boolean
    | TransformerForBuildPlusRuntime[]
    | (
      {
        [P in string]: TransformerForBuildPlusRuntime;
      }
       & {
        [P in "transformerType" | "interpolation"] ?: never;
      }
    )
  | TransformerForBuildPlusRuntimeA
  | TransformerForBuildPlusRuntimeB
  | TransformerForBuildPlusRuntimeC
;
