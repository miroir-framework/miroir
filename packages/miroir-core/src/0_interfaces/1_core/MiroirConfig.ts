import { z } from "zod";
import { EntityInstance } from "../../0_interfaces/1_core/Instance";
import { DataflowConfiguration } from "../../0_interfaces/1_core/StorageConfiguration.js";

export type DeploymentMode = 'monoUser' | 'multiUser';

declare interface MiroirConfigRoot {
  // deploymentMode: DeploymentMode;
  deploymentMode: 'monoUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
  versionControlForDataConceptLevel: boolean;

}

export interface EmulatedServerConfigIndexedDb {
  emulatedServerType: 'indexedDb';
  indexedDbName: string;
}
export interface EmulatedServerConfigSql {
  emulatedServerType: 'Sql';
  connectionString: string;
}

export type EmulatedServerConfig = EmulatedServerConfigIndexedDb | EmulatedServerConfigSql;
export interface MiroirConfigForMsw extends MiroirConfigRoot{
  emulateServer: true;
  rootApiUrl: string;
  emulatedServerConfig:EmulatedServerConfig;
}

export interface ServerConfig {
  rootApiUrl: string;
  dataflowConfiguration:z.infer<typeof DataflowConfiguration>;
}

export interface MiroirConfigForRest extends MiroirConfigRoot{
  emulateServer: false;
  serverConfig: ServerConfig;
}

export type MiroirConfig = MiroirConfigForMsw | MiroirConfigForRest;

export interface StoreBasedConfiguration extends EntityInstance {
  definition:{"currentModelVersion":string}
}