export interface ServerConfig {
  rootApiUrl: string;
}

export type DeploymentMode = 'monoUser' | 'multiUser';

declare interface MiroirConfigRoot {
  deploymentMode: DeploymentMode;
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
export interface MiroirConfigForRest extends MiroirConfigRoot{
  emulateServer: false;
  serverConfig: ServerConfig;
}

export type MiroirConfig = MiroirConfigForMsw | MiroirConfigForRest;