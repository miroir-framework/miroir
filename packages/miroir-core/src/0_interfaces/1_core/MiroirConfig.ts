export interface ServerConfig {
  emulateServer: boolean;
  rootApiUrl: string;
}
export interface MiroirConfig {
  serverConfig: ServerConfig;
  deploymentMode: 'monoUser' | 'multiUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
  versionControlForDataConceptLevel: boolean;
}