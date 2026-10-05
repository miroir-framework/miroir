import type { EntityInstance, Menu, MetaModel, MiroirModelEnvironment, SelfApplication } from "miroir-core";
export declare const adminApplication_Meta_DO_NOT_USE: any;
export declare const deployment_Meta_DO_NOT_USE: any;
export declare const selfApplicationMeta: SelfApplication;
export declare const selfApplicationModelBranchMetaMasterBranch: any;
export declare const metaInitApplicationVersion: EntityInstance;
export declare const menuDefaultMeta: Menu;
export declare const defaultMetaAppModel: MetaModel;
export declare function getDefaultMetaModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  metaDeploymentUuid: string,
): MiroirModelEnvironment;
