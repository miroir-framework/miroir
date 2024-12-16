import { z } from "zod";
import { entityInstance } from "../1_core/preprocessor-generated/miroirFundamentalType.js";

export const ZEntityIdSchema = z.union([z.number(), z.string()]);
export const ZDictionarySchema = z.record(z.string().uuid(), entityInstance);
export type MiroirDictionary = z.infer<typeof ZDictionarySchema>;
export const ZEntityStateSchema = z.object({ ids: z.array(z.string()), entities: ZDictionarySchema });
export type ZEntityState = z.infer<typeof ZEntityStateSchema>; //not used

export type DeploymentEntityState = { [DeploymentUuidSectionEntityUuid: string]: ZEntityState };
