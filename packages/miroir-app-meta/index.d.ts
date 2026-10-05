import type { Entity, EntityInstance, Menu, MetaModel, MiroirModelEnvironment, Report, SelfApplication } from "miroir-core";
export declare const adminApplication_Meta_DO_NOT_USE: any;
export declare const deployment_Meta_DO_NOT_USE: any;
export declare const selfApplicationMeta: SelfApplication;
export declare const selfApplicationModelBranchMetaMasterBranch: any;
export declare const metaInitApplicationVersion: EntityInstance;
export declare const menuDefaultMeta: Menu;
export declare const defaultMetaAppModel: MetaModel;
export declare const entityBundleSizeMeasurement: Entity;
export declare const reportBundleSizeHistory: Report;
export declare const reportBundleSizeMeasurementDetails: Report;
export declare const bundleSizeMeasurementSeed: EntityInstance[];
export declare const testConfiguration_metaBundleSizeSeed: {
  uuid: string;
  testbedModel: MetaModel;
  testbedEntitiesAndInstances: { entity: Entity; instances: EntityInstance[] }[];
};
export declare function getDefaultMetaModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  metaDeploymentUuid: string,
): MiroirModelEnvironment;
