import { z } from "zod";

import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance.js";

// import { JzodElement } from "./preprocessor-generated/miroirFundamentalType.js";


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
  application: UuidSchema,
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

export default {}