"use strict";

import { describe, expect } from 'vitest';
import { z, ZodTypeAny } from "zod";

import {
  ActionError,
  buildPlusRuntimeCompositeAction,
  BuildPlusRuntimeCompositeAction,
  CompositeActionSequence,
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
  testBuildPlusRuntimeCompositeAction,
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
import { defaultMiroirMetaModel } from '../test_assets/defaultMiroirMetaModel';

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
  | CompositeActionSequence
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
  "commit ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "commit",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      },
    },
  },
  "rollback ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "rollback",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      }
    },
  },
  "initModel ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "initModel",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        params: {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          // metaModel: defaultMiroirMetaModel,
          metaModel: {
            endpoints: [],
            entities: [],
            entityDefinitions: [],
            jzodSchemas: [],
            menus: [],
            applicationVersions: [],
            reports: [],
            applicationVersionCrossEntityDefinition: [],
            storedQueries: [],
          },
          // TODO: this is wrong, selfApplication, selfApplication version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
          selfApplication: testApplicationConfig.selfApplication,
          applicationModelBranch: testApplicationConfig.applicationModelBranch,
          applicationVersion: testApplicationConfig.applicationVersion,
        },
      },
    },
  },
  "resetModel ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "resetModel",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      }
    },
  },
  "resetData ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "resetData",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      }
    },
  },
  "alterEntityAttribute ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "alterEntityAttribute",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
        entityName: "newEntity",
        entityUuid: "00000000-0000-0000-0000-000000000002",
        addColumns: [
          {
            name: "aNewColumnForTest",
            definition: {
              type: "number",
              optional: true,
              tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)", editable: true } },
            },
          },
        ],
      },
    },
  },
  "renameEntity ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "renameEntity",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
        entityName: "newEntity",
        entityUuid: "00000000-0000-0000-0000-000000000002",
        targetValue: "renamedEntity",
      },
    },
  },
  "createEntity ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "createEntity",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        entities: [
          {
            entity: entityEntity as Entity,
            entityDefinition: entityDefinitionEntity as EntityDefinition,
          },
        ],
      },
    },
  },
  "dropEntity ModelAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "dropEntity",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        entityDefinitionUuid: "00000000-0000-0000-0000-000000000001",
        entityUuid: "00000000-0000-0000-0000-000000000002",
      },
    },
  },
  // ##############################################################################################
  // InstanceAction
  "createInstance InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "createInstance",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        parentUuid: entityMenu.uuid,
        objects: [
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultMiroir as Entity],
          },
        ],
      },
    },
  },
  "updateInstance InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "updateInstance",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        objects: [
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultMiroir as EntityInstance],
          },
        ],
      },
    },
  },
  "deleteInstance InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "deleteInstance",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        objects: [
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultMiroir as Entity],
          },
        ],
      },
    },
  },
  "deleteInstanceWithCascade InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "deleteInstanceWithCascade",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        objects: [
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultMiroir as Entity],
          },
        ],
      },
    },
  },
  "getInstances InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "getInstances",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        parentUuid: entityMenu.uuid,
      },
    },
  },
  "getInstance InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "getInstance",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        parentUuid: entityMenu.uuid,
        applicationSection: "data",
        uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
      },
    },
  },
  // ##############################################################################################
  // LocalCacheAction
  "loadNewInstancesInLocalCache InstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "loadNewInstancesInLocalCache",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        objects: [
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [menuDefaultMiroir as Entity],
          },
        ],
      },
    },
  },
  "undoRedoAction undo is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "undo",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      }
    },
  },
  "undoRedoAction redo is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "redo",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      }
    },
  },
  "transactionalInstanceAction is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "transactionalInstanceAction",
      // endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        instanceAction: {
          actionType: "createInstance",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
            applicationSection: "data",
            parentUuid: entityMenu.uuid,
            objects: [
              {
                parentName: entityMenu.name,
                parentUuid: entityMenu.uuid,
                applicationSection: "model",
                instances: [menuDefaultMiroir as Entity],
              },
            ],
          },
        },
      },
    },
  },
  // ##############################################################################################
  // PersistenceAction
  "LocalPersistenceAction is parsable": {
    zodSchema: persistenceAction,
    action: {
      actionType: "LocalPersistenceAction_create",
      endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      payload: {
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        section: "data",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        parentName: entityMenu.name,
        parentUuid: entityMenu.uuid,
        uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
        objects: [menuDefaultMiroir as EntityInstance],
      },
    },
  },
  // ##############################################################################################
  // StoreManagementAction
  "storeManagementAction_createStore is parsable": {
    zodSchema: storeManagementAction,
    action: {
      actionType: "storeManagementAction_createStore",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        configuration: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
      },
    },
  },
  "storeManagementAction_deleteStore is parsable": {
    zodSchema: storeManagementAction,
    action: {
      actionType: "storeManagementAction_deleteStore",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        configuration: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
      },
      // storeName: sqlDbStoreName,
    },
  },
  "storeManagementAction_resetAndInitApplicationDeployment is parsable": {
    zodSchema: storeManagementAction,
    action: {
      actionType: "storeManagementAction_resetAndInitApplicationDeployment",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        deployments: [
          {
            uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
            parentName: "Deployment",
            parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
            parentDefinitionVersionUuid: "00000000-0000-0000-0000-000000000000",
            name: "TestApplicationSqlDeployment",
            defaultLabel: "TestApplicationSqlDeployment",
            description: "The default Sql Deployment for TestApplication",
            adminApplication: "00000000-0000-0000-0000-000000000001",
            bundle: "00000000-0000-0000-0000-000000000002",
            configuration: {
              admin: {
                emulatedServerType: "sql",
                connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                schema: "TestApplicationAdmin",
              },
              model: {
                emulatedServerType: "sql",
                connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                schema: "TestApplicationModel",
              },
              data: {
                emulatedServerType: "sql",
                connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                schema: "TestApplicationData",
              },
            },
            // model?: JzodObject | undefined;
            // data?: JzodObject | undefined;
          },
        ],
      },
    },
  },
  "storeManagementAction_openStore is parsable": {
    zodSchema: storeManagementAction,
    action: {
      actionType: "storeManagementAction_openStore",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        configuration: {
          admin: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
        },
      },
      // configuration: adminConfigurationDeploymentMiroir.configuration as StoreUnitConfiguration,
      // storeName: sqlDbStoreName,
    },
  },
  "storeManagementAction_closeStore is parsable": {
    zodSchema: storeManagementAction,
    action: {
      actionType: "storeManagementAction_closeStore",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      },
    },
  },
  // ##############################################################################################
  // extractors and queries
  // ##############################################################################################
  "runBoxedExtractorAction is parsable": {
    zodSchema: persistenceAction,
    action: {
      actionType: "runBoxedExtractorAction",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        query: {
          queryType: "boxedExtractorOrCombinerReturningObject",
          deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
          pageParams: {},
          queryParams: {},
          contextResults: {},
          select: {
            extractorOrCombinerType: "extractorForObjectByDirectReference",
            parentUuid: entityMenu.uuid,
            parentName: entityMenu.name,
            applicationSection: "model",
            instanceUuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
          },
        },
      },
    },
  },
  "runBoxedQueryAction is parsable": {
    zodSchema: persistenceAction,
    action: {
      actionType: "runBoxedQueryAction",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      payload: {
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
        applicationSection: "data",
        query: {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
          pageParams: {},
          queryParams: {},
          contextResults: {},
          extractors: {
            extractorForObjectByDirectReference: {
              extractorOrCombinerType: "extractorForObjectByDirectReference",
              parentUuid: entityMenu.uuid,
              parentName: entityMenu.name,
              applicationSection: "model",
              instanceUuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00", // This is the uuid of the menuDefaultMiroir instance
            },
          },
          combiners: {},
        },
      },
    },
  },
  // ##############################################################################################
  // ExtractorTemplate, QueryTemplate #############################################################
  // ##############################################################################################
  "extractorTemplateForObjectListByEntity is parsable": {
    // zodSchema: extractorTemplateReturningObjectOrObjectList,
    zodSchema: extractorOrCombinerTemplate,
    action: {
      extractorTemplateType: "extractorTemplateForObjectListByEntity",
      parentUuid: {
        transformerType: "getFromParameters",
        interpolation: "build",
        referenceName: entityMenu.uuid,
      },
      parentName: entityMenu.name,
      applicationSection: "model",
    },
  },
  "combinerByRelationReturningObjectList is parsable": {
    zodSchema: extractorOrCombinerTemplate,
    action: {
      extractorTemplateType: "combinerByRelationReturningObjectList",
      parentUuid: {
        transformerType: "getFromParameters",
        interpolation: "build",
        referenceName: entityMenu.uuid,
      },
      parentName: entityMenu.name,
      applicationSection: "model",
      objectReference: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referenceName: "publisher",
      },
      AttributeOfListObjectToCompareToReferenceUuid: "publisher",
    },
  },
  "boxedQueryTemplateWithExtractorCombinerTransformer is parsable": {
    zodSchema: miroirQueryTemplate,
    action: {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
      contextResults: {},
      pageParams: {
        applicationSection: "data",
      },
      queryParams: {},
      extractorTemplates: {
        authors: {
          extractorTemplateType: "extractorTemplateForObjectListByEntity",
          parentName: "Author",
          parentUuid: {
            transformerType: "returnValue",
            mlSchema: {
              type: "uuid",
            },
            interpolation: "build",
            value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          },
          filter: {
            attributeName: "name",
            value: {
              transformerType: "returnValue",
              mlSchema: {
                type: "string",
              },
              interpolation: "build",
              value: "or",
            },
          },
        },
      },
    },
  },
  // ##############################################################################################
  // CompositeActionSequence ##############################################################################
  // ##############################################################################################
  "compositeActionSequence is parsable": {
    zodSchema: domainAction,
    action: {
      actionType: "compositeActionSequence",
      deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "IGNORED",
        definition: [
          {
            actionType: "createInstance",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              applicationSection: "data",
              parentUuid: entityMenu.uuid,
              objects: [
                {
                  parentName: entityMenu.name,
                  parentUuid: entityMenu.uuid,
                  applicationSection: "model",
                  instances: [menuDefaultMiroir as Entity],
                },
              ],
            },
          },
          {
            actionType: "updateInstance",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              applicationSection: "data",
              objects: [
                {
                  parentName: entityMenu.name,
                  parentUuid: entityMenu.uuid,
                  applicationSection: "model",
                  instances: [menuDefaultMiroir as EntityInstance],
                },
              ],
            },
          },
        ],
      },
    },
  },
  // ##############################################################################################
  // BuildPlusRuntimeCompositeAction ##############################################################
  // ##############################################################################################
  "buildPlusRuntimeCompositeAction.testCompositeAction.testCompositeActions is parsable": {
    zodSchema: z.record(z.string(), testBuildPlusRuntimeCompositeAction),
    action: (
      getTestSuitesForBuildPlusRuntimeCompositeAction(undefined)
        .testSuitesForBuildPlusRuntimeCompositeAction[
        "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"
      ] as any
    ).testCompositeAction.testCompositeActions,
  },
  // "buildPlusRuntimeCompositeAction is parsable": {
  //   // zodSchema: buildPlusRuntimeCompositeAction,
  //   zodSchema: testCompositeActionParams,
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
      // zodSchema.parse(action, {path: ["testCompositeAction", "testCompositeActions"]});
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