"use strict";

import { describe, expect } from 'vitest';
import { ZodTypeAny } from "zod";

import {
  ActionError,
  buildPlusRuntimeCompositeAction,
  BuildPlusRuntimeCompositeAction,
  CompositeAction,
  domainAction,
  DomainAction,
  Entity,
  EntityDefinition,
  EntityInstance,
  ExtractorOrCombinerTemplate,
  extractorTemplateReturningObjectOrObjectList,
  ExtractorTemplateReturningObjectOrObjectList,
  MiroirQueryTemplate,
  miroirQueryTemplate,
  persistenceAction,
  PersistenceAction,
  storeManagementAction,
  TestBuildPlusRuntimeCompositeActionSuite,
  testBuildPlusRuntimeCompositeActionSuite,
  TestCompositeAction,
  TestCompositeActionParams,
  testCompositeActionParams,
  ZodParseError
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { InitApplicationParameters } from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface";
import entityEntity from "../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityDefinitionEntity from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";
import entityMenu from "../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json";
import menuDefaultMiroir from "../../src/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json";
import adminConfigurationDeploymentMiroir from "../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";



import { zodErrorDeepestIssueLeaves } from "../../src/1_core/zodParseErrorHandler";
import { defaultMiroirMetaModel } from './defaultMiroirMetaModel';

import { Uuid } from '../../src/0_interfaces/1_core/EntityDefinition.js';
import { getBasicApplicationConfiguration } from '../../src/2_domain/Deployment.js';
import { extractorOrCombiner, extractorOrCombinerTemplate, menu, StoreUnitConfiguration } from '../../dist';
import { deployments } from 'miroir-standalone-app/src/constants';
import { Type } from 'typescript';
import { getTestSuitesForBuildPlusRuntimeCompositeAction } from 'miroir-standalone-app/src/miroir-fwk/4-tests/applicative.Library.BuildPlusRuntimeCompositeAction';

const testSuiteName = "transformers.integ.test";

const testApplicationName = "testApplication"
const sqlDbStoreName = "testStoreName"
const connectionString = "postgres://postgres:postgres@localhost:5432/postgres"
// const schema = "testSchema"
const schema = testApplicationName;
const paramSelfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const paramAdminConfigurationDeploymentUuid: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const applicationModelBranchUuid: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const selfApplicationVersionUuid: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const testApplicationConfig: InitApplicationParameters = getBasicApplicationConfiguration(
  testApplicationName,
  paramSelfApplicationUuid,
  // {
  //   emulatedServerType: "sql",
  //   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  // },
  paramAdminConfigurationDeploymentUuid,
  applicationModelBranchUuid,
  selfApplicationVersionUuid
);

// ################################################################################################
// TS VALIDATION TESTS ############################################################################
// ################################################################################################
const actionTest1: ActionError = {
  status: "error",
  errorType: "FailedToGetInstances",
  errorMessage: "Failed to get instances",
};

// ################################################################################################
// ZOD VALIDATION TESTS ###########################################################################
// ################################################################################################
type ZodParseTestActionType =
  | DomainAction
  | PersistenceAction
  | ExtractorOrCombinerTemplate
  | MiroirQueryTemplate
  | CompositeAction
  | BuildPlusRuntimeCompositeAction
  | TestBuildPlusRuntimeCompositeActionSuite
  | TestCompositeActionParams
;
type ZodParseTest<ActionType extends ZodParseTestActionType> = {
  // actionType: Type,
  zodSchema: ZodTypeAny,
  // action: DomainAction | PersistenceAction
  action: ActionType
}

const actionsZodParseTests: Record<string, ZodParseTest<ZodParseTestActionType>> = {
  // // error actions
  // "actionError is parsable": {
  //   zodSchema: actionError,
  //   action: actionTest1,
  // },
  // model actions
  // ##############################################################################################
  // ModelAction
  // "commit ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "commit",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //   },
  // },
  // "rollback ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "rollback",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //   },
  // },
  // "initModel ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "initModel",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     params: {
  //       dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
  //       // metaModel: defaultMiroirMetaModel,
  //       metaModel: {
  //         entities: [],
  //         entityDefinitions: [],
  //         jzodSchemas: [],
  //         menus: [],
  //         applicationVersions: [],
  //         reports: [],
  //         applicationVersionCrossEntityDefinition: [],
  //       },
  //       // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
  //       selfApplication: testApplicationConfig.selfApplication,
  //       applicationModelBranch: testApplicationConfig.applicationModelBranch,
  //       applicationVersion: testApplicationConfig.applicationVersion,
  //     },
  //   },
  // },
  // "resetModel ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "resetModel",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //   },
  // },
  // "resetData ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "resetData",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //   },
  // },
  // "alterEntityAttribute ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "alterEntityAttribute",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
  //     entityName: "newEntity",
  //     entityUuid: "00000000-0000-0000-0000-000000000002",
  //     addColumns: [
  //       {
  //         name: "aNewColumnForTest",
  //         definition: {
  //           type: "number",
  //           optional: true,
  //           tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)", editable: true } },
  //         },
  //       },
  //     ],
  //   },
  // },
  // "renameEntity ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "renameEntity",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
  //     entityName: "newEntity",
  //     entityUuid: "00000000-0000-0000-0000-000000000002",
  //     targetValue: "renamedEntity",
  //   },
  // },
  // "createEntity ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "createEntity",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     entities: [
  //       {
  //         entity: entityEntity as Entity,
  //         entityDefinition: entityDefinitionEntity as EntityDefinition,
  //       },
  //     ],
  //   },
  // },
  // "dropEntity ModelAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "dropEntity",
  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
  //     entityUuid: "00000000-0000-0000-0000-000000000002",
  //   },
  // },
  // // ##############################################################################################
  // // InstanceAction
  // "createInstance InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "createInstance",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     objects: [
  //       {
  //         parentName: entityMenu.name,
  //         parentUuid: entityMenu.uuid,
  //         applicationSection: "model",
  //         instances: [menuDefaultMiroir as Entity],
  //       },
  //     ],
  //   },
  // },
  // "updateInstance InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "updateInstance",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     objects: [
  //       {
  //         parentName: entityMenu.name,
  //         parentUuid: entityMenu.uuid,
  //         applicationSection: "model",
  //         instances: [menuDefaultMiroir as EntityInstance],
  //       },
  //     ],
  //   },
  // },
  // "deleteInstance InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "deleteInstance",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     objects: [
  //       {
  //         parentName: entityMenu.name,
  //         parentUuid: entityMenu.uuid,
  //         applicationSection: "model",
  //         instances: [menuDefaultMiroir as Entity],
  //       },
  //     ],
  //   },
  // },
  // "deleteInstanceWithCascade InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "deleteInstanceWithCascade",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     objects: [
  //       {
  //         parentName: entityMenu.name,
  //         parentUuid: entityMenu.uuid,
  //         applicationSection: "model",
  //         instances: [menuDefaultMiroir as Entity],
  //       },
  //     ],
  //   },
  // },
  // "getInstances InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "getInstances",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     parentUuid: entityMenu.uuid,
  //   },
  // },
  // "getInstance InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "getInstance",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     parentUuid: entityMenu.uuid,
  //     uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
  //   },
  // },
  // // ##############################################################################################
  // // LocalCacheAction
  // "loadNewInstancesInLocalCache InstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "loadNewInstancesInLocalCache",
  //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     objects: [
  //       {
  //         parentName: entityMenu.name,
  //         parentUuid: entityMenu.uuid,
  //         applicationSection: "model",
  //         instances: [menuDefaultMiroir as Entity],
  //       },
  //     ],
  //   },
  // },
  // "undoRedoAction undo is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "undoRedoAction",
  //     endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     actionName: "undo",
  //   },
  // },
  // "undoRedoAction redo is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "undoRedoAction",
  //     endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     actionName: "redo",
  //   },
  // },
  // "transactionalInstanceAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "transactionalInstanceAction",
  //     // endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     instanceAction: {
  //       actionType: "createInstance",
  //       deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //       endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //       applicationSection: "data",
  //       objects: [
  //         {
  //           parentName: entityMenu.name,
  //           parentUuid: entityMenu.uuid,
  //           applicationSection: "model",
  //           instances: [menuDefaultMiroir as Entity],
  //         },
  //       ],
  //     },
  //   },
  // },
  // // ##############################################################################################
  // // PersistenceAction
  // "LocalPersistenceAction is parsable": {
  //   zodSchema: persistenceAction,
  //   action: {
  //     actionType: "LocalPersistenceAction",
  //     endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     actionName: "create",
  //     section: "data",
  //     parentName: entityMenu.name,
  //     parentUuid: entityMenu.uuid,
  //     uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
  //     objects: [menuDefaultMiroir as EntityInstance],
  //   },
  // },
  // // ##############################################################################################
  // // StoreManagementAction
  // "storeManagementAction_createStore is parsable": {
  //   zodSchema: storeManagementAction,
  //   action: {
  //     actionType: "storeManagementAction_createStore",
  //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     configuration: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
  //   },
  // },
  // "storeManagementAction_deleteStore is parsable": {
  //   zodSchema: storeManagementAction,
  //   action: {
  //     actionType: "storeManagementAction_deleteStore",
  //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     configuration: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
  //     // storeName: sqlDbStoreName,
  //   },
  // },
  // "storeManagementAction_resetAndInitApplicationDeployment is parsable": {
  //   zodSchema: storeManagementAction,
  //   action: {
  //     actionType: "storeManagementAction_resetAndInitApplicationDeployment",
  //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     deployments: [
  //       {
  //         uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //         parentName: "Deployment",
  //         parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  //         parentDefinitionVersionUuid: "00000000-0000-0000-0000-000000000000",
  //         name: "TestApplicationSqlDeployment",
  //         defaultLabel: "TestApplicationSqlDeployment",
  //         description: "The default Sql Deployment for TestApplication",
  //         adminApplication: "00000000-0000-0000-0000-000000000001",
  //         bundle: "00000000-0000-0000-0000-000000000002",
  //         configuration: {
  //           admin: {
  //             emulatedServerType: "sql",
  //             connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //             schema: "TestApplicationAdmin",
  //           },
  //           model: {
  //             emulatedServerType: "sql",
  //             connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //             schema: "TestApplicationModel",
  //           },
  //           data: {
  //             emulatedServerType: "sql",
  //             connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //             schema: "TestApplicationData",
  //           },
  //         },
  //         // model?: JzodObject | undefined;
  //         // data?: JzodObject | undefined;
  //       },
  //     ],
  //   },
  // },
  // "storeManagementAction_openStore is parsable": {
  //   zodSchema: storeManagementAction,
  //   action: {
  //     actionType: "storeManagementAction_openStore",
  //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     configuration: {
  //       admin: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
  //     },
  //     // configuration: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
  //     // storeName: sqlDbStoreName,
  //   },
  // },
  // "storeManagementAction_closeStore is parsable": {
  //   zodSchema: storeManagementAction,
  //   action: {
  //     actionType: "storeManagementAction_closeStore",
  //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //   },
  // },
  // // ##############################################################################################
  // // extractors and queries
  // // ##############################################################################################
  // "runBoxedExtractorAction is parsable": {
  //   zodSchema: persistenceAction,
  //   action: {
  //     actionType: "runBoxedExtractorAction",
  //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     actionName: "runQuery",
  //     query: {
  //       queryType: "boxedExtractorOrCombinerReturningObject",
  //       deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //       pageParams: {},
  //       queryParams: {},
  //       contextResults: {},
  //       select: {
  //         extractorOrCombinerType: "extractorForObjectByDirectReference",
  //         parentUuid: entityMenu.uuid,
  //         parentName: entityMenu.name,
  //         applicationSection: "model",
  //         instanceUuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
  //       },
  //     },
  //   },
  // },
  // "runBoxedQueryAction is parsable": {
  //   zodSchema: persistenceAction,
  //   action: {
  //     actionType: "runBoxedQueryAction",
  //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     applicationSection: "data",
  //     actionName: "runQuery",
  //     query: {
  //       queryType: "boxedQueryWithExtractorCombinerTransformer",
  //       deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //       pageParams: {},
  //       queryParams: {},
  //       contextResults: {},
  //       extractors: {
  //         extractorForObjectByDirectReference: {
  //           extractorOrCombinerType: "extractorForObjectByDirectReference",
  //           parentUuid: entityMenu.uuid,
  //           parentName: entityMenu.name,
  //           applicationSection: "model",
  //           instanceUuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
  //         },
  //       },
  //       combiners: {},
  //     },
  //   },
  // },
  // // ##############################################################################################
  // // ExtractorTemplate, QueryTemplate #############################################################
  // // ##############################################################################################
  // "extractorTemplateForObjectListByEntity is parsable": {
  //   // zodSchema: extractorTemplateReturningObjectOrObjectList,
  //   zodSchema: extractorOrCombinerTemplate,
  //   action: {
  //     extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //     parentUuid: {
  //       transformerType: "parameterReference",
  //       interpolation: "build",
  //       referenceName: entityMenu.uuid,
  //     },
  //     parentName: entityMenu.name,
  //     applicationSection: "model",
  //   },
  // },
  // "combinerByRelationReturningObjectList is parsable": {
  //   zodSchema: extractorOrCombinerTemplate,
  //   action: {
  //     extractorTemplateType: "combinerByRelationReturningObjectList",
  //     parentUuid: {
  //       transformerType: "parameterReference",
  //       interpolation: "build",
  //       referenceName: entityMenu.uuid,
  //     },
  //     parentName: entityMenu.name,
  //     applicationSection: "model",
  //     objectReference: {
  //       transformerType: "contextReference",
  //       interpolation: "runtime",
  //       referenceName: "publisher",
  //     },
  //     AttributeOfListObjectToCompareToReferenceUuid: "publisher",
  //   },
  // },
  // "boxedQueryTemplateWithExtractorCombinerTransformer is parsable": {
  //   zodSchema: miroirQueryTemplate,
  //   action: {
  //     queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //     deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //     contextResults: {},
  //     pageParams: {
  //       applicationSection: "data",
  //     },
  //     queryParams: {},
  //     extractorTemplates: {
  //       authors: {
  //         extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //         parentName: "Author",
  //         parentUuid: {
  //           transformerType: "constantUuid",
  //           interpolation: "build",
  //           value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //         },
  //         filter: {
  //           attributeName: "name",
  //           value: {
  //             transformerType: "constantString",
  //             interpolation: "build",
  //             value: "or",
  //           },
  //         },
  //       },
  //     },
  //   },
  // },
  // // ##############################################################################################
  // // CompositeAction ##############################################################################
  // // ##############################################################################################
  // "compositeAction is parsable": {
  //   zodSchema: domainAction,
  //   action: {
  //     actionType: "compositeAction",
  //     actionName: "sequence",
  //     deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //     definition: [
  //       {
  //         actionType: "createInstance",
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //         applicationSection: "data",
  //         objects: [
  //           {
  //             parentName: entityMenu.name,
  //             parentUuid: entityMenu.uuid,
  //             applicationSection: "model",
  //             instances: [menuDefaultMiroir as Entity],
  //           },
  //         ],
  //       },
  //       {
  //         actionType: "updateInstance",
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //         applicationSection: "data",
  //         objects: [
  //           {
  //             parentName: entityMenu.name,
  //             parentUuid: entityMenu.uuid,
  //             applicationSection: "model",
  //             instances: [menuDefaultMiroir as EntityInstance],
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // },
  // ##############################################################################################
  // BuildPlusRuntimeCompositeAction ##############################################################
  // ##############################################################################################
  "buildPlusRuntimeCompositeAction is parsable": {
    // zodSchema: buildPlusRuntimeCompositeAction,
    zodSchema: testCompositeActionParams,
    action:
      getTestSuitesForBuildPlusRuntimeCompositeAction(undefined)
        .testSuitesForBuildPlusRuntimeCompositeAction[
        "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"
      ],
  },

    // action: {
    //   actionType: "compositeAction",
    //   actionLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
    //   actionName: "sequence",
    //   templates: {
    //     createEntity_newEntity: {
    //       uuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "newEntityUuid",
    //       },
    //       parentUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referencePath: ["entityEntity", "uuid"],
    //       },
    //       selfApplication: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "testSelfApplicationUuid",
    //       },
    //       description: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "createEntity_newEntityDescription",
    //       },
    //       name: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "newEntityName",
    //       },
    //     },
    //     createEntity_newEntityDefinition: {
    //       name: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "newEntityName",
    //       },
    //       uuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "newEntityDefinitionUuid",
    //       },
    //       parentName: "EntityDefinition",
    //       parentUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referencePath: ["entityEntityDefinition", "uuid"],
    //       },
    //       entityUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referencePath: ["createEntity_newEntity", "uuid"],
    //       },
    //       conceptLevel: "Model",
    //       defaultInstanceDetailsReportUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "defaultInstanceDetailsReportUuid",
    //       },
    //       jzodSchema: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "newEntityJzodSchema",
    //       },
    //     },
    //     newEntityListReport: {
    //       uuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "createEntity_newEntityListReportUuid",
    //       },
    //       selfApplication: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "testSelfApplicationUuid",
    //       },
    //       parentName: "Report",
    //       parentUuid: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "{{entityReport.uuid}}",
    //       },
    //       conceptLevel: "Model",
    //       name: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "{{newEntityName}}List",
    //       },
    //       defaultLabel: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "List of {{newEntityName}}s",
    //       },
    //       type: "list",
    //       definition: {
    //         extractors: {
    //           instanceList: {
    //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //             parentName: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referenceName: "newEntityName",
    //             },
    //             parentUuid: {
    //               transformerType: "mustacheStringTemplate",
    //               interpolation: "build",
    //               definition: "{{createEntity_newEntity.uuid}}",
    //             },
    //           },
    //         },
    //         section: {
    //           type: "objectListReportSection",
    //           definition: {
    //             label: {
    //               transformerType: "mustacheStringTemplate",
    //               interpolation: "build",
    //               definition: "{{newEntityName}}s",
    //             },
    //             parentUuid: {
    //               transformerType: "mustacheStringTemplate",
    //               interpolation: "build",
    //               definition: "{{createEntity_newEntity.uuid}}",
    //             },
    //             fetchedDataReference: "instanceList",
    //           },
    //         },
    //       },
    //     },
    //     newEntityDetailsReport: {
    //       uuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "createEntity_newEntityDetailsReportUuid",
    //       },
    //       selfApplication: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "testSelfApplicationUuid",
    //       },
    //       parentName: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "{{entityReport.name}}",
    //       },
    //       parentUuid: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "{{entityReport.uuid}}",
    //       },
    //       conceptLevel: "Model",
    //       name: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "{{newEntityName}}Details",
    //       },
    //       defaultLabel: {
    //         transformerType: "mustacheStringTemplate",
    //         interpolation: "build",
    //         definition: "Details of {{newEntityName}}",
    //       },
    //       definition: {
    //         extractorTemplates: {
    //           elementToDisplay: {
    //             transformerType: "constant",
    //             interpolation: "build",
    //             value: {
    //               extractorTemplateType: "extractorForObjectByDirectReference",
    //               parentName: {
    //                 transformerType: "contextReference",
    //                 interpolation: "build",
    //                 referenceName: "newEntityName",
    //               },
    //               parentUuid: {
    //                 transformerType: "mustacheStringTemplate",
    //                 interpolation: "build",
    //                 definition: "{{newEntityUuid}}",
    //               },
    //               instanceUuid: {
    //                 transformerType: "constant",
    //                 interpolation: "runtime",
    //                 value: {
    //                   transformerType: "contextReference",
    //                   interpolation: "runtime",
    //                   referenceName: "instanceUuid",
    //                 },
    //               },
    //             },
    //           },
    //         },
    //         section: {
    //           type: "list",
    //           definition: [
    //             {
    //               type: "objectInstanceReportSection",
    //               definition: {
    //                 label: {
    //                   transformerType: "mustacheStringTemplate",
    //                   interpolation: "build",
    //                   definition: "My {{newEntityName}}",
    //                 },
    //                 parentUuid: {
    //                   transformerType: "mustacheStringTemplate",
    //                   interpolation: "build",
    //                   definition: "{{newEntityUuid}}",
    //                 },
    //                 fetchedDataReference: "elementToDisplay",
    //               },
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   },
    //   definition: [
    //     {
    //       actionType: "createEntity",
    //       actionLabel: "createEntity",
    //       deploymentUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "testDeploymentUuid",
    //       },
    //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //       entities: [
    //         {
    //           entity: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "createEntity_newEntity",
    //           },
    //           entityDefinition: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "createEntity_newEntityDefinition",
    //           },
    //         },
    //       ],
    //     },
    //     {
    //       actionType: "transactionalInstanceAction",
    //       actionLabel: "createReports",
    //       instanceAction: {
    //         actionType: "createInstance",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //         objects: [
    //           {
    //             parentName: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referencePath: ["newEntityListReport", "parentName"],
    //             },
    //             parentUuid: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referencePath: ["newEntityListReport", "parentUuid"],
    //             },
    //             applicationSection: "model",
    //             instances: [
    //               {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referenceName: "newEntityListReport",
    //               },
    //               {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referenceName: "newEntityDetailsReport",
    //               },
    //             ],
    //           },
    //         ],
    //       },
    //     },
    //     {
    //       actionType: "commit",
    //       actionLabel: "commit",
    //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //       deploymentUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "testDeploymentUuid",
    //       },
    //     },
    //     {
    //       actionType: "compositeRunBoxedExtractorOrQueryAction",
    //       actionLabel: "getListOfEntityDefinitions",
    //       nameGivenToResult: "newApplicationEntityDefinitionList",
    //       query: {
    //         actionType: "runBoxedExtractorOrQueryAction",
    //         actionName: "runQuery",
    //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         query: {
    //           queryType: "boxedQueryWithExtractorCombinerTransformer",
    //           deploymentUuid: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "testDeploymentUuid",
    //           },
    //           pageParams: {
    //             currentDeploymentUuid: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referenceName: "testDeploymentUuid",
    //             },
    //           },
    //           queryParams: {},
    //           contextResults: {},
    //           extractors: {
    //             entityDefinitions: {
    //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //               applicationSection: "model",
    //               parentName: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityEntityDefinition", "name"],
    //               },
    //               parentUuid: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityEntityDefinition", "uuid"],
    //               },
    //               orderBy: {
    //                 attributeName: "name",
    //                 direction: "ASC",
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     {
    //       actionType: "compositeRunBoxedExtractorOrQueryAction",
    //       actionLabel: "getListOfEntities",
    //       nameGivenToResult: "newApplicationEntityList",
    //       query: {
    //         actionType: "runBoxedExtractorOrQueryAction",
    //         actionName: "runQuery",
    //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         query: {
    //           queryType: "boxedQueryWithExtractorCombinerTransformer",
    //           deploymentUuid: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "testDeploymentUuid",
    //           },
    //           pageParams: {
    //             currentDeploymentUuid: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referenceName: "testDeploymentUuid",
    //             },
    //           },
    //           queryParams: {},
    //           contextResults: {},
    //           extractors: {
    //             entities: {
    //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //               applicationSection: "model",
    //               parentName: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityEntity", "name"],
    //               },
    //               parentUuid: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityEntity", "uuid"],
    //               },
    //               orderBy: {
    //                 attributeName: "name",
    //                 direction: "ASC",
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     {
    //       actionType: "compositeRunBoxedExtractorOrQueryAction",
    //       actionLabel: "getListOfReports",
    //       nameGivenToResult: "newApplicationReportList",
    //       query: {
    //         actionType: "runBoxedExtractorOrQueryAction",
    //         actionName: "runQuery",
    //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         query: {
    //           queryType: "boxedQueryWithExtractorCombinerTransformer",
    //           deploymentUuid: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "testDeploymentUuid",
    //           },
    //           pageParams: {
    //             currentDeploymentUuid: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referenceName: "testDeploymentUuid",
    //             },
    //           },
    //           runAsSql: true,
    //           queryParams: {},
    //           contextResults: {},
    //           extractors: {
    //             reports: {
    //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //               applicationSection: "model",
    //               parentName: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityReport", "name"],
    //               },
    //               parentUuid: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityReport", "uuid"],
    //               },
    //               orderBy: {
    //                 attributeName: "name",
    //                 direction: "ASC",
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     {
    //       actionType: "compositeRunBoxedQueryAction",
    //       actionLabel: "getMenu",
    //       nameGivenToResult: "menuUpdateQueryResult",
    //       queryTemplate: {
    //         actionType: "runBoxedQueryAction",
    //         actionName: "runQuery",
    //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         query: {
    //           queryType: "boxedQueryWithExtractorCombinerTransformer",
    //           deploymentUuid: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "testDeploymentUuid",
    //           },
    //           pageParams: {},
    //           queryParams: {},
    //           contextResults: {},
    //           extractors: {
    //             menuList: {
    //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //               applicationSection: "model",
    //               parentName: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityMenu", "name"],
    //               },
    //               parentUuid: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityMenu", "uuid"],
    //               },
    //             },
    //           },
    //           runtimeTransformers: {
    //             menu: {
    //               transformerType: "listPickElement",
    //               interpolation: "runtime",
    //               applyTo: {
    //                 referenceType: "referencedTransformer",
    //                 reference: {
    //                   transformerType: "contextReference",
    //                   interpolation: "runtime",
    //                   referenceName: "menuList",
    //                 },
    //               },
    //               index: 0,
    //             },
    //             menuItem: {
    //               transformerType: "freeObjectTemplate",
    //               interpolation: "runtime",
    //               definition: {
    //                 reportUuid: {
    //                   transformerType: "parameterReference",
    //                   interpolation: "build",
    //                   referenceName: "createEntity_newEntityListReportUuid",
    //                 },
    //                 label: {
    //                   transformerType: "mustacheStringTemplate",
    //                   interpolation: "build",
    //                   definition: "List of {{newEntityName}}s",
    //                 },
    //                 section: "data",
    //                 selfApplication: {
    //                   transformerType: "parameterReference",
    //                   interpolation: "build",
    //                   referencePath: ["adminConfigurationDeploymentParis", "uuid"],
    //                 },
    //                 icon: "local_drink",
    //               },
    //             },
    //             updatedMenu: {
    //               transformerType: "transformer_menu_addItem",
    //               interpolation: "runtime",
    //               menuItemReference: {
    //                 transformerType: "contextReference",
    //                 interpolation: "runtime",
    //                 referenceName: "menuItem",
    //               },
    //               menuReference: {
    //                 transformerType: "contextReference",
    //                 interpolation: "runtime",
    //                 referenceName: "menu",
    //               },
    //               menuSectionItemInsertionIndex: -1,
    //             },
    //           },
    //         },
    //       },
    //     },
    //     {
    //       actionType: "transactionalInstanceAction",
    //       actionLabel: "updateMenu",
    //       instanceAction: {
    //         actionType: "updateInstance",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //         objects: [
    //           {
    //             parentName: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referencePath: ["entityMenu", "name"],
    //             },
    //             parentUuid: {
    //               transformerType: "parameterReference",
    //               interpolation: "build",
    //               referencePath: ["entityMenu", "uuid"],
    //             },
    //             applicationSection: "model",
    //             instances: [
    //               {
    //                 transformerType: "contextReference",
    //                 interpolation: "runtime",
    //                 referencePath: ["menuUpdateQueryResult", "updatedMenu"],
    //               },
    //             ],
    //           },
    //         ],
    //       },
    //     },
    //     {
    //       actionType: "commit",
    //       actionLabel: "commit",
    //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //       deploymentUuid: {
    //         transformerType: "parameterReference",
    //         interpolation: "build",
    //         referenceName: "testDeploymentUuid",
    //       },
    //     },
    //     {
    //       actionType: "compositeRunBoxedQueryAction",
    //       actionLabel: "getNewMenuList",
    //       nameGivenToResult: "newMenuList",
    //       queryTemplate: {
    //         actionType: "runBoxedQueryAction",
    //         actionName: "runQuery",
    //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //         applicationSection: "model",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           interpolation: "build",
    //           referenceName: "testDeploymentUuid",
    //         },
    //         query: {
    //           queryType: "boxedQueryWithExtractorCombinerTransformer",
    //           deploymentUuid: {
    //             transformerType: "parameterReference",
    //             interpolation: "build",
    //             referenceName: "testDeploymentUuid",
    //           },
    //           pageParams: {},
    //           queryParams: {},
    //           contextResults: {},
    //           extractors: {
    //             menuList: {
    //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //               applicationSection: "model",
    //               parentName: "Menu",
    //               parentUuid: {
    //                 transformerType: "parameterReference",
    //                 interpolation: "build",
    //                 referencePath: ["entityMenu", "uuid"],
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   ],
    // },
  // },
  // "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test is parsable": {
  //   // zodSchema: testCompositeActionParams,
  //   zodSchema: testBuildPlusRuntimeCompositeActionSuite,
  //   action:
  //     getTestSuitesForBuildPlusRuntimeCompositeAction(undefined)
  //       .testSuitesForBuildPlusRuntimeCompositeAction[
  //       "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"
  //     ],
  // },
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe("zodParseActions", () => {
  it.each(Object.entries(actionsZodParseTests))("%s", (testName, testParams) => {
    const { zodSchema, action } = testParams;
    console.log(expect.getState().currentTestName, "action to test=", JSON.stringify(action, null, 2));
    try {
      zodSchema.parse(action);
      expect(true).toBe(true); // Pass the test if parsing does not throw an error
    } catch (error) {
      const zodParseError = error as ZodParseError;
      console.error("Zod parse error :", JSON.stringify(zodErrorDeepestIssueLeaves(zodParseError), null, 2));
      expect(true).toBe(false); // Fail the test if parsing throws an error
      // throw error; // Re-throw the error to fail the test
    }
  });
});


  // it("reportCountryList.definition.extractorTemplates.countries is parsable by extractorOrCombinerTemplate", () => {
  //   const zodSchema = extractorOrCombinerTemplate
  //   const transformer = reportCountryList.definition.extractorTemplates.countries;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });

  // it("reportCountryList.definition.extractorTemplates is parsable by extractorOrCombinerTemplateRecord", () => {
  //   const zodSchema = extractorOrCombinerTemplateRecord
  //   const transformer = reportCountryList.definition.extractorTemplates;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });

  // it("reportCountryList.definition is parsable by rootReport", () => {
  //   const zodSchema = rootReport
  //   const transformer = reportCountryList.definition;
  //   console.log("transformer to test=", JSON.stringify(transformer, null, 2));
  //   expect(() => zodSchema.parse(transformer)).not.toThrow();
  // });
// });


// })