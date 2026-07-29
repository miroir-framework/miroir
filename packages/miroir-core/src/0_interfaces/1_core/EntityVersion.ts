import { z } from "zod";

import { EntityInstanceWithNameSchema } from "./Instance";
import type {
  Entity,
  EntityVersion,
  JzodObject,
} from "./preprocessor-generated/miroirFundamentalType";
import { miroirFundamentalJzodSchema } from "./preprocessor-generated/miroirFundamentalJzodSchema";

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

type PresentModelSchemaSource = {
  mlSchema?: JzodObject | undefined;
  name?: string | undefined;
  uuid?: string | undefined;
};

function assertPresentModelMlSchema(source: PresentModelSchemaSource): JzodObject {
  if (!source.mlSchema) {
    throw new Error(
      `Present-model source ${source.name ?? source.uuid ?? "<unknown>"} has no mlSchema`,
    );
  }
  if (
    source.mlSchema.extend &&
    (Array.isArray(source.mlSchema.extend) ||
      source.mlSchema.extend.type !== "schemaReference" ||
      source.mlSchema.extend.definition.relativePath !== "entityDefinitionRoot")
  ) {
    throw new Error(
      "Only extension of the entityDefinitionRoot schema is allowed for the mlSchema of an Entity / EntityVersion",
    );
  }
  return source.mlSchema;
}

function resolvePresentModelMlSchema(source: PresentModelSchemaSource): JzodObject {
  const mlSchema = assertPresentModelMlSchema(source);
  const extendedMLSchema: JzodObject | undefined = mlSchema.extend
    ? (miroirFundamentalJzodSchema.definition.context.entityDefinitionRoot as JzodObject)
    : undefined;
  return {
    type: "object",
    definition: {
      ...(extendedMLSchema ? extendedMLSchema.definition : {}),
      ...mlSchema.definition,
    },
  };
}

/**
 * Resolve Entity-carried mlSchema (Entity-authoritative present model, #217 Phase 4).
 */
export function entityMLSchema(entity: Entity): JzodObject {
  return resolvePresentModelMlSchema(entity);
}

/**
 * Return Entity with mlSchema inlined (entityDefinitionRoot extend flattened).
 */
export function entityWithResolvedMLSchema(entity: Entity): Entity {
  return {
    ...entity,
    mlSchema: entityMLSchema(entity),
  };
}

/**
 * @deprecated Prefer {@link entityMLSchema}. Retained for EntityVersion compatibility readers.
 */
export function entityDefinitionMLSchema(e: EntityVersion): JzodObject {
  return resolvePresentModelMlSchema(e);
}

/**
 * @deprecated Prefer {@link entityWithResolvedMLSchema} and
 * `alignEntityDefinitionToPresentEntity` from entityPresentModel.
 * Retained for EntityVersion compatibility readers during #217.
 */
export function entityDefinitionWithResolvedMLSchema(e: EntityVersion): EntityVersion {
  return {
    ...e,
    mlSchema: entityDefinitionMLSchema(e),
  };
}
