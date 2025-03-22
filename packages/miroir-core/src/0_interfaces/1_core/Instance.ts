import { z } from "zod";
import { ApplicationSection, entityInstance } from "./preprocessor-generated/miroirFundamentalType";

// // ##########################################################################################
// export const ApplicationConceptLevelSchema = z.union([z.literal("MetaModel"), z.literal("Model"), z.literal("Data")]);
// export type ApplicationConceptLevel = z.infer<typeof ApplicationConceptLevelSchema>;

// ##########################################################################################
export const EntityInstanceWithNameSchema = entityInstance.extend({
  name: z.string(),
});
export type EntityInstanceWithName = z.infer<typeof EntityInstanceWithNameSchema>;

// ##########################################################################################
export function ApplicationSectionOpposite(s:ApplicationSection):ApplicationSection {
  return s == 'model'?'data':'model';
}


export default {}