// The TypeScript generation half of the Jzod adapter (#145), see mlJzodAdapter.ts. @miroir-framework/jzod-ts needs
// the TypeScript compiler, so this file is the Node-only entry point `miroir-core/ml-to-ts`, kept out of the main
// (browser) entry. Used by the type generators of miroir-core and miroir-store-postgres.
import { jzodToTsCode, jzodToZodTextAndZodSchemaForTsGeneration } from "@miroir-framework/jzod-ts";

import type { MlElement } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MlZodTextAndZodSchema, MlZodTextAndZodSchemaRecord } from "./mlJzodAdapter";

type JzodTsContext = Parameters<typeof jzodToTsCode>[2];

/**
 * The TypeScript source of the types and Zod schemas of an ML schema.
 * @param typeName the name of the main type and Zod schema
 * @param context the Zod schemas of the references of `mlSchema`
 * @param exportPrefix prefix the declarations with `export`
 * @param headerForZodImports `true` for the default Zod import header, or the header text
 * @param typeAnnotationForSchema the names of the schemas whose Zod declaration is annotated with their type
 * @param extendedTsTypesText TypeScript source added after the imports
 */
export function mlToTs(
  typeName: string,
  mlSchema: MlElement,
  context?: MlZodTextAndZodSchemaRecord,
  exportPrefix?: boolean,
  headerForZodImports?: boolean | string,
  typeAnnotationForSchema?: string[],
  extendedTsTypesText?: string
): string {
  return jzodToTsCode(
    typeName,
    mlSchema,
    context as JzodTsContext,
    exportPrefix,
    headerForZodImports,
    typeAnnotationForSchema,
    extendedTsTypesText
  );
}

/** The Zod schema and Zod source text of an ML schema, in the form `mlToTs` expects in its context. */
export function mlToZodTextAndZodSchemaForTsGeneration(
  mlSchema: MlElement,
  context?: MlZodTextAndZodSchemaRecord
): MlZodTextAndZodSchema {
  return jzodToZodTextAndZodSchemaForTsGeneration(mlSchema, context as JzodTsContext);
}
