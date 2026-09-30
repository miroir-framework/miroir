// The only door from Miroir to Jzod (#145): Miroir's meta-language (ML) is implemented with @miroir-framework/jzod,
// and no other file imports it (lint rule `no-restricted-imports` in eslint.config.mjs). The casts between Jzod's
// types and the ML types live here. The TypeScript generation functions (jzod-ts) are in mlJzodTsAdapter.ts, a
// Node-only entry point.
import {
  jzodToZod,
  jzodToZodTextAndZodSchema,
  valueToJzod,
  type ZodTextAndZodSchemaRecord,
} from "@miroir-framework/jzod";
import type { ZodTypeAny } from "zod";

import type { MlElement } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/** The Zod schema of an ML schema, with its Zod source text. */
export interface MlZodTextAndZodSchema {
  contextZodSchema?: { [k: string]: ZodTypeAny };
  contextZodText?: { [k: string]: string };
  objectShapeZodSchema?: { [k: string]: ZodTypeAny };
  objectShapeZodText?: { [k: string]: string };
  zodSchema: ZodTypeAny;
  zodText: string;
}

export type MlZodTextAndZodSchemaRecord = { [k: string]: MlZodTextAndZodSchema };

export interface MlToZodOptions {
  /** dates are parsed from their string form */
  datesAsString?: boolean;
}

type JzodElementParameter = Parameters<typeof jzodToZodTextAndZodSchema>[0];

/**
 * The ML schema that describes `value`.
 * @param arrayResolution "arrayAsArray" types an array by its first item, "arrayAsTuple" (the default) item by item
 */
export function valueToMl(value: unknown, arrayResolution?: "arrayAsArray" | "arrayAsTuple"): MlElement {
  return valueToJzod(value, arrayResolution) as MlElement;
}

/** The Zod schema of an ML schema. */
export function mlToZod(mlSchema: MlElement): ZodTypeAny {
  return jzodToZod(mlSchema);
}

/**
 * The Zod schema and Zod source text of an ML schema.
 * @param getEagerReferences the schemas of the references resolved eagerly
 * @param getLazyReferences the schemas of the references resolved lazily
 */
export function mlToZodTextAndZodSchema(
  mlSchema: MlElement,
  getEagerReferences: () => MlZodTextAndZodSchemaRecord = () => ({}),
  getLazyReferences: () => MlZodTextAndZodSchemaRecord = () => ({}),
  options?: MlToZodOptions
): MlZodTextAndZodSchema {
  return jzodToZodTextAndZodSchema(
    mlSchema as JzodElementParameter,
    getEagerReferences as () => ZodTextAndZodSchemaRecord,
    getLazyReferences as () => ZodTextAndZodSchemaRecord,
    options
  );
}
