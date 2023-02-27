export interface MiroirConfig {
  rootApiUrl: string;
  deploymentMode: 'monoUser' | 'multiUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
}