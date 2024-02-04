import { z } from "zod";
import { entityInstance } from "./preprocessor-generated/miroirFundamentalType";

export type DeploymentMode = 'monoUser' | 'multiUser';

declare interface MiroirConfigRoot {
  // deploymentMode: DeploymentMode;
  deploymentMode: 'monoUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
  versionControlForDataConceptLevel: boolean;

}


// export const StoreBasedConfigurationSchema = entityInstance.extend({
//   definition: z.object({currentApplicationVersion: z.string()})
// })

// export type StoreBasedConfiguration = z.infer<typeof StoreBasedConfigurationSchema>

// export interface StoreBasedConfiguration extends EntityInstance {
//   definition:{"currentApplicationVersion":string}
// }