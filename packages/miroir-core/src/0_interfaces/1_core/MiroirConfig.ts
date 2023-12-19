import { z } from "zod";
import { ApplicationDeploymentSchema } from "../../0_interfaces/1_core/StorageConfiguration.js";
import { StoreConfiguration, entityInstance } from "./preprocessor-generated/miroirFundamentalType";

export type DeploymentMode = 'monoUser' | 'multiUser';

declare interface MiroirConfigRoot {
  // deploymentMode: DeploymentMode;
  deploymentMode: 'monoUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
  versionControlForDataConceptLevel: boolean;

}

export interface StoreUnitConfiguration {
  model: StoreConfiguration;
  data: StoreConfiguration;
}

export interface ServerConfig {
  rootApiUrl: string;
  dataflowConfiguration:z.infer<typeof ApplicationDeploymentSchema>;
  storeConfiguration: {
    miroirServerConfig:StoreUnitConfiguration;
    appServerConfig:StoreUnitConfiguration;
  }
}

export interface MiroirConfigForMsw extends MiroirConfigRoot{
  emulateServer: true;
  rootApiUrl: string;
  miroirServerConfig:StoreUnitConfiguration;
  appServerConfig:StoreUnitConfiguration;
}

export interface MiroirConfigForRest extends MiroirConfigRoot{
  emulateServer: false;
  serverConfig: ServerConfig;
}

export type MiroirConfig = MiroirConfigForMsw | MiroirConfigForRest;

export const StoreBasedConfigurationSchema = entityInstance.extend({
  definition: z.object({currentModelVersion: z.string()})
})

export type StoreBasedConfiguration = z.infer<typeof StoreBasedConfigurationSchema>

// export interface StoreBasedConfiguration extends EntityInstance {
//   definition:{"currentModelVersion":string}
// }