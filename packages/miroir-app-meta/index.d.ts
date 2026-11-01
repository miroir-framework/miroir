import type { Entity, EntityInstance, MetaModel, MiroirModelEnvironment, SelfApplication } from "miroir-core";
export declare const adminApplication_Meta_DO_NOT_USE: any;
export declare const deployment_Meta_DO_NOT_USE: any;
export declare const selfApplicationMeta: SelfApplication;
export declare const selfApplicationModelBranchMetaMasterBranch: any;
export declare const metaInitApplicationVersion: EntityInstance;
export declare const defaultMetaAppModel: MetaModel;
export declare const entityBundleSizeMeasurement: Entity;
export declare const entityAgentRunMeasurement: Entity;
export declare const entityPageLoadMeasurement: Entity;
export declare function getDefaultMetaModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  metaDeploymentUuid: string,
): MiroirModelEnvironment;
