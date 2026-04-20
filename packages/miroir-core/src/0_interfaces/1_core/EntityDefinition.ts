import { z } from "zod";

import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance";
import type { JzodObject, EntityDefinition } from "./preprocessor-generated/miroirFundamentalType";
import { miroirFundamentalJzodSchema } from "./preprocessor-generated/miroirFundamentalJzodSchema";

// import { JzodElement } from "./preprocessor-generated/miroirFundamentalType";


// ##########################################################################################


export const UuidSchema = z.string().uuid();
// const px = z.custom<`${number}px`>((val) => {
//   return /^\d+px$/.test(val as string);
// });
// type px = z.infer<typeof px>; // `${number}px`

export type Uuid = z.infer<typeof UuidSchema>;
// export type Uuid = UUID<string>;

// #################################################################################################
export const MetaEntitySchema = EntityInstanceWithNameSchema.extend({
  description: z.string(),
  selfApplication: UuidSchema,
});
export type MetaEntity = z.infer<typeof MetaEntitySchema>;

/**
* duplicated from Redux
* @public
*/
export interface InstanceDictionaryNum<T> {
  [id: number]: T | undefined;
}

/**
* duplicated from Redux
* @public
*/
export interface InstanceDictionary<T> extends InstanceDictionaryNum<T> {
  [id: string]: T | undefined;
}

export function entityDefinitionMLSchema(e: EntityDefinition): JzodObject {
  if (e.mlSchema.extend && (Array.isArray(e.mlSchema.extend) || e.mlSchema.extend.type !== "schemaReference" || e.mlSchema.extend.definition.relativePath !== "entityDefinitionRoot")) {
    throw new Error("Only extension of the entityDefinitionRoot schema is allowed for the mlSchema of an EntityDefinition");
  }
  const extendedMLSchema: JzodObject | undefined= e.mlSchema.extend ? miroirFundamentalJzodSchema.definition.context.entityDefinitionRoot as JzodObject : undefined;
  return {
    type: "object",
    definition: {
      ...(extendedMLSchema ? extendedMLSchema.definition : {}),
      ...e.mlSchema.definition,
    }
  }
}

export function entityDefinitionWithResolvedMLSchema(e: EntityDefinition): EntityDefinition {
  if (e.mlSchema.extend && (Array.isArray(e.mlSchema.extend) || e.mlSchema.extend.type !== "schemaReference" || e.mlSchema.extend.definition.relativePath !== "entityDefinitionRoot")) {
    throw new Error("Only extension of the entityDefinitionRoot schema is allowed for the mlSchema of an EntityDefinition");
  }
  const extendedMLSchema: JzodObject | undefined= e.mlSchema.extend ? miroirFundamentalJzodSchema.definition.context.entityDefinitionRoot as JzodObject : undefined;
  return {
    ...e,
    mlSchema: {
      type: "object",
      definition: {
        ...(extendedMLSchema ? extendedMLSchema.definition : {}),
        ...e.mlSchema.definition,
      },
    },
  };
}