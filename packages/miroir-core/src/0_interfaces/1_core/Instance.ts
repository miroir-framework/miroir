import { z } from "zod";
import { ApplicationSection, applicationSection } from "./preprocessor-generated/miroirFundamentalType";

// ##########################################################################################
export const ApplicationConceptLevelSchema = z.union([z.literal("MetaModel"), z.literal("Model"), z.literal("Data")]);
export type ApplicationConceptLevel = z.infer<typeof ApplicationConceptLevelSchema>;

// ##########################################################################################
export const EntityInstanceSchema = z.object({
  uuid: z.string().uuid(),
  parentUuid: z.string().uuid(),
  parentName: z.string().optional(),
  conceptLevel: ApplicationConceptLevelSchema.optional(),
});
export type EntityInstance = z.infer<typeof EntityInstanceSchema>;

// ##########################################################################################
export const EntityInstanceWithNameSchema = EntityInstanceSchema.extend({
  name: z.string(),
});
export type EntityInstanceWithName = z.infer<typeof EntityInstanceWithNameSchema>;

// // ##########################################################################################
// export const ApplicationSectionSchema = z.union([z.literal("model"), z.literal("data")]);
// export type ApplicationSection = z.infer<typeof ApplicationSectionSchema>;

// ##########################################################################################
export function ApplicationSectionOpposite(s:ApplicationSection):ApplicationSection {
  return s == 'model'?'data':'model';
}

// ##########################################################################################
// TODO: make parameterized type for instances!
export const EntityInstanceCollectionSchema = z.object({
  parentName: z.string().optional(),
  parentUuid: z.string().uuid(),
  applicationSection: applicationSection,
  instances: z.array(EntityInstanceSchema)
});
export type EntityInstanceCollection = z.infer<typeof EntityInstanceCollectionSchema>;


export default {}