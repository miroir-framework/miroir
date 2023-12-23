import { z } from "zod";
import { MiroirConfigClient, entityInstance } from "./preprocessor-generated/miroirFundamentalType";

export type DeploymentMode = 'monoUser' | 'multiUser';

declare interface MiroirConfigRoot {
  // deploymentMode: DeploymentMode;
  deploymentMode: 'monoUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
  versionControlForDataConceptLevel: boolean;

}

// export interface StoreUnitConfiguration {
//   model: StoreSectionConfiguration;
//   data: StoreSectionConfiguration;
// }

// export interface ServerConfigForClientConfig {
//   rootApiUrl: string;
//   dataflowConfiguration:z.infer<typeof ApplicationDeploymentSchema>;
//   storeSectionConfiguration: {
//     miroirServerConfig:StoreUnitConfiguration;
//     appServerConfig:StoreUnitConfiguration;
//   }
// }

// export interface MiroirConfigForMsw extends MiroirConfigRoot{
//   emulateServer: true;
//   rootApiUrl: string;
//   miroirServerConfig:StoreUnitConfiguration;
//   appServerConfig:StoreUnitConfiguration;
// }

// export interface MiroirConfigForRest extends MiroirConfigRoot{
//   emulateServer: false;
//   serverConfig: ServerConfigForClientConfig;
// }

// export type MiroirConfigClient = MiroirConfigForMsw | MiroirConfigForRest;
// export type MiroirConfigClient = {
//   client: MiroirConfigForMsw | MiroirConfigForRest
// };

// export type MiroirConfigServer = {
//   server: any
// };


// export type MiroirConfig = MiroirConfigClient | MiroirConfigServer;

export const StoreBasedConfigurationSchema = entityInstance.extend({
  definition: z.object({currentModelVersion: z.string()})
})

export type StoreBasedConfiguration = z.infer<typeof StoreBasedConfigurationSchema>

// export interface StoreBasedConfiguration extends EntityInstance {
//   definition:{"currentModelVersion":string}
// }