import { ZodType, ZodTypeAny, z } from "zod";
import { JzodElement, JzodObject, jzodElement, jzodObject } from "./preprocessor-generated/miroirFundamentalType";

// enum ConceptLevel {"MetaModel", "Model", "Data"};
// type ConceptLevel = "MetaModel" | "Model" | "Data";

export interface EntityDefinitionEntityDefinitionAttribute {
  id: number,
  name: string,
  defaultLabel: string,
  type: string,
  nullable: boolean,
  editable: boolean,
  lineFormat?: any,
}

export const entityDefinitionEntityDefinitionAttributeSchema: ZodType<EntityDefinitionEntityDefinitionAttribute> = z.object({
  id: z.number(),
  name: z.string(),
  defaultLabel: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  editable: z.boolean(),
  lineFormat: z.any().optional(),
});

export interface EntityDefinitionEntityDefinitionAttributeNew {
  id: number,
  name: string,
  defaultLabel: string,
  // type: string,
  jzodSchema: JzodElement,
  nullable: boolean,
  editable: boolean,
  lineFormat?: EntityDefinitionEntityDefinitionAttributeNew[],
}

export const entityDefinitionEntityDefinitionAttributeNewSchema:ZodType<EntityDefinitionEntityDefinitionAttributeNew> = z.object({
  id: z.number(),
  name: z.string(),
  defaultLabel: z.string(),
  // type: z.string(),
  jzodSchema: jzodElement,
  nullable: z.boolean(),
  editable: z.boolean(),
  lineFormat: z.lazy(()=>z.array(entityDefinitionEntityDefinitionAttributeNewSchema).optional()),
});


// export interface EntityDefinitionEntityDefinition {
export type EntityDefinitionEntityDefinition = {
  uuid: string,
  parentName: string,
  parentUuid: string,
  name: string,
  conceptLevel?: "MetaModel" | "Model" | "Data",
  description: string,
  jzodSchema: JzodObject, 
  attributes?: EntityDefinitionEntityDefinitionAttribute[],
  attributesNew?: EntityDefinitionEntityDefinitionAttributeNew[],
}


export const entityDefinitionEntityDefinitionSchema:ZodType<EntityDefinitionEntityDefinition> = z.object({
  uuid: z.string().uuid(),
  parentName: z.string(),
  parentUuid: z.string().uuid(),
  name: z.string(),
  conceptLevel: z.enum(["MetaModel", "Model", "Data"] as any).optional(),
  description: z.string(),
  jzodSchema: z.lazy(() => jzodObject),
  attributes: z.array(entityDefinitionEntityDefinitionAttributeSchema).optional(),
  attributesNew: z.array(entityDefinitionEntityDefinitionAttributeNewSchema).optional(),
});
// export type entityDefinitionEntityDefinition = z.infer<typeof entityDefinitionEntityDefinitionZodSchema>;
