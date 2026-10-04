import type {
  EndpointDefinition,
  EntityInstance,
  Menu,
  MetaModel,
  MiroirModelEnvironment,
  SelfApplication,
} from "miroir-core";
export declare const adminApplication_GitHub_DO_NOT_USE: any;
export declare const deployment_GitHub_DO_NOT_USE: any;
export declare const selfApplicationGitHub: SelfApplication;
export declare const selfApplicationModelBranchGitHubMasterBranch: any;
export declare const githubInitApplicationVersion: EntityInstance;
export declare const menuDefaultGitHub: Menu;
export declare const githubServiceEndpoint: EndpointDefinition;
export declare const defaultGitHubAppModel: MetaModel;
export declare function getDefaultGitHubModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  githubDeploymentUuid: string,
): MiroirModelEnvironment;
