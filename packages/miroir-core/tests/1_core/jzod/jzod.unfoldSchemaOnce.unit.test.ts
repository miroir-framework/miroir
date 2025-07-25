import { describe, it, expect } from 'vitest';
import {
  Entity,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  JzodSchema,
  Menu,
  MetaModel,
  Report,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirModel } from "../../../src/0_interfaces/1_core/Model";

// import { memoizedUnfoldJzodSchemaOnce, unfoldJzodSchemaOnce} from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";
import { unfoldJzodSchemaOnce} from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";


import entitySelfApplication from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entitySelfApplicationDeploymentConfiguration from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entitySelfApplicationModelBranch from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
import entitySelfApplicationVersion from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityApplicationVersionCrossEntityDeployment from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/8bec933d-6287-4de7-8a88-5c24216de9f4.json';
import entityCommit from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/73bb0c69-e636-4e3b-a230-51f25469c089.json';
import entityEndpointVersion from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3d8da4d4-8f76-4bb4-9212-14869d81c00c.json';
import entityEntity from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityJzodSchema from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json';
import entityMenu from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json';
import entityReport from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityStoreBasedConfiguration from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityQueryVersion from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e4320b9e-ab45-4abe-85d8-359604b3c62f.json';

import entityDefinitionAdminApplication from "../../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json";
import entityDefinitionSelfApplication from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionSelfApplicationDeploymentConfiguration from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionSelfApplicationVersion from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionApplicationVersionCrossEntityDeployment from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c0b71083-8cc8-43db-bf52-572f1f03bbb5.json';
import entityDefinitionSelfApplicationModelBranch from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import entityDefinitionCommit from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json';
import entityDefinitionEndpoint from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json';
import entityDefinitionEntityDefinition from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionEntity from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionJzodSchema from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json';
import entityDefinitionMenu from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json';
import entityDefinitionReport from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
import entityDefinitionStoreBasedConfiguration from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';
import entityDefinitionQuery from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json';

import reportApplicationList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportApplicationDeploymentConfigurationList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportApplicationModelBranchList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportApplicationVersionList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import reportCommitList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7947ae40-eb34-4149-887b-15a9021e714e.json';
import reportConfigurationList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportJzodSchemaList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8b22e84e-9374-4121-b2a7-d13d947a0ba2.json';
import reportEndpointVersionList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ace3d5c9-b6a7-43e6-a277-595329e7532a.json';
import reportEntityList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportEntityDefinitionList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import reportReportList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';
import reportMenuList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ecfd8787-09cc-417d-8d2c-173633c9f998.json';

import queryVersionBundleProducerV1 from '../../../src/assets/miroir_data/e4320b9e-ab45-4abe-85d8-359604b3c62f/e8c15587-af5d-4c08-b5b7-22f959447690.json';

import applicationEndpointV1 from '../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ddd9c928-2ceb-4f67-971b-5898090412d6.json';
import deploymentEndpointV1 from '../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json';
import instanceEndpointV1 from '../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json';
import modelEndpointV1 from '../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json';

import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/17adb534-1dcb-4874-a4ef-6c1e03b31c4e.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/48644159-66d4-426d-b38d-d083fd455e7b.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/4aaba993-f0a1-4a26-b1ea-13b0ad532685.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/9086f49a-0e81-4902-81f3-560186dee334.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ba38669e-ac6f-40ea-af14-bb200db251d8.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/dc47438c-166a-4d19-aeba-ad70281afdf4.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionReport from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ede7e794-5ae7-48a8-81c9-d1f82df11829.json';
import selfApplicationVersionInitialMiroirVersion from '../../../src/assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import jzodSchemajzodMiroirBootstrapSchema from "../../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import transformerJzodSchema from "../../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json";
import instanceConfigurationReference from '../../../src/assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import menuDefaultMiroir from '../../../src/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json';



import entityDefinitionBundleV1 from "../../../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json";
// import entityDefinitionCommit from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json";
import modelEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json";
import storeManagementEndpoint from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json";
import instanceEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json";
import undoRedoEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json";
import localCacheEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json";
import domainEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json";
import queryEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json";
import persistenceEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json";
import testEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json";
// import jzodSchemajzodMiroirBootstrapSchema from "../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import entityDefinitionSelfApplicationV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json";
import entityDefinitionSelfApplicationVersionV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json";
// import entityDefinitionEntity from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";
import entityDefinitionEntityDefinitionV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import entityDefinitionJzodSchemaV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json";
// import entityDefinitionMenu  from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json";
import entityDefinitionQueryVersionV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json";
import entityDefinitionReportV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json";
import entityDefinitionTest from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json';
import entityDefinitionTransformerDefinition from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json";


// import entityDefinitionDeployment from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import entityDefinitionDeployment from "../../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import transformerMenuV1 from "../../../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json";
import { entity } from "../../../dist/index";

// import { getMiroirFundamentalJzodSchema} from "../../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema";
import { miroirFundamentalJzodSchema} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
export const defaultMiroirMetaModel: MetaModel = {
  // configuration: [instanceConfigurationReference],
  entities: [
    entitySelfApplication as Entity,
    entitySelfApplicationDeploymentConfiguration as Entity,
    entitySelfApplicationModelBranch as Entity,
    entitySelfApplicationVersion as Entity,
    entityEntity as Entity,
    entityEntityDefinition as Entity,
    entityJzodSchema as Entity,
    entityMenu as Entity,
    entityReport as Entity,
    entityStoreBasedConfiguration as Entity,
    entitySelfApplicationVersion as Entity,
  ],
  entityDefinitions: [
    entityDefinitionSelfApplication as EntityDefinition,
    entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition,
    entityDefinitionSelfApplicationModelBranch as EntityDefinition,
    entityDefinitionSelfApplicationVersion as EntityDefinition,
    entityDefinitionEntity as EntityDefinition,
    entityDefinitionEntityDefinition as EntityDefinition,
    entityDefinitionJzodSchema as EntityDefinition,
    entityDefinitionMenu as EntityDefinition,
    entityDefinitionReport as EntityDefinition,
    entityDefinitionStoreBasedConfiguration as EntityDefinition,
  ],
  jzodSchemas: [
    jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
  ],
  menus: [
    menuDefaultMiroir as Menu,
  ],
  applicationVersions:[
    selfApplicationVersionInitialMiroirVersion
  ],
  reports: [
    reportApplicationDeploymentConfigurationList as Report,
    reportApplicationList as Report,
    reportApplicationModelBranchList as Report,
    reportApplicationVersionList as Report,
    reportConfigurationList as Report,
    reportEntityDefinitionList as Report,
    reportEntityList as Report,
    reportJzodSchemaList as Report,
    reportMenuList as Report,
    reportReportList as Report,
  ],
  applicationVersionCrossEntityDefinition: [
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionReport,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration,
  ]
}

const castMiroirFundamentalJzodSchema: JzodSchema = miroirFundamentalJzodSchema as JzodSchema;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################

function testResolve(
  testId: string,
  miroirFundamentalJzodSchema: JzodSchema,
  testSchema: JzodElement,
  // testValueObject: any,
  expectedResult: JzodElement,
){
  console.log("######################################### running test", testId, "...")
  // const testResult = memoizedUnfoldJzodSchemaOnce(
  const testResult = unfoldJzodSchemaOnce(
    miroirFundamentalJzodSchema,
    testSchema,
    [], // path
    [], // unfoldingReferences
    testSchema, //rootSchema
    0, // depth
    // testValueObject,
    defaultMiroirMetaModel,
    defaultMiroirMetaModel,
  )
  console.log("######################################### test", testId, "has result", JSON.stringify(testResult, null, 2))
  if (testResult.status == "ok") {
    expect(testResult.status).toEqual("ok");
    // console.log("test", testId, "has result", JSON.stringify(testResult.element, null, 2));
    expect(testResult.element).toEqual(expectedResult);
  } else {
    // console.log("test", testId, "has result", JSON.stringify(testResult, null, 2));
    expect(testResult.status).toEqual("ok");
  }
  console.log("######################################### test", testId, "done")
}

interface testFormat {
  // testId: string,
  miroirFundamentalJzodSchema: JzodSchema,
  testSchema: JzodElement,
  // testValueObject: any,
  expectedResult: JzodElement,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'jzodUnfoldSchemaOnce',
  () => {
    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {
        // const miroirFundamentalJzodSchema: JzodSchema = getMiroirFundamentalJzodSchema(
        // const miroirFundamentalJzodSchema: any = getMiroirFundamentalJzodSchema(
        //   entityDefinitionBundleV1 as EntityDefinition,
        //   entityDefinitionCommit as EntityDefinition,
        //   modelEndpointV1,
        //   storeManagementEndpoint,
        //   instanceEndpointVersionV1,
        //   undoRedoEndpointVersionV1,
        //   localCacheEndpointVersionV1,
        //   domainEndpointVersionV1,
        //   queryEndpointVersionV1,
        //   persistenceEndpointVersionV1,
        //   testEndpointVersionV1,
        //   jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
        //   transformerJzodSchema as JzodSchema,
        //   [transformerMenuV1],
        //   entityDefinitionAdminApplication as EntityDefinition,
        //   entityDefinitionSelfApplication as EntityDefinition,
        //   entityDefinitionSelfApplicationVersion as EntityDefinition,
        //   entityDefinitionDeployment as EntityDefinition,
        //   entityDefinitionEntity as EntityDefinition,
        //   entityDefinitionEntityDefinition as EntityDefinition,
        //   entityDefinitionJzodSchema as EntityDefinition,
        //   entityDefinitionMenu  as EntityDefinition,
        //   entityDefinitionQueryVersionV1 as EntityDefinition,
        //   entityDefinitionReport as EntityDefinition,
        //   entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition,
        //   entityDefinitionTest as EntityDefinition,
        //   entityDefinitionTransformerDefinition as EntityDefinition,
        //   entityDefinitionEndpoint as EntityDefinition,
        //   // jzodSchemajzodMiroirBootstrapSchema as any,
        // );
        console.log(expect.getState().currentTestName, "called getMiroirFundamentalJzodSchema");

        const tests: { [k: string]: testFormat } = {
          // plain literal!
          test010: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "literal",
              definition: "myLiteral",
            },
            expectedResult: {
              type: "literal",
              definition: "myLiteral",
            },
          },
          // simpleType
          test020: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "string",
            },
            expectedResult: {
              type: "string",
            },
          },
          // schemaReference (plain, simpleType, non-recursive)
          test030: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                a: {
                  type: "string",
                },
              },
              definition: {
                relativePath: "a",
              },
            },
            expectedResult: {
              type: "string",
            },
          },
          // object, simple
          test040: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "object",
              definition: {
                a: {
                  type: "schemaReference",
                  optional: true,
                  context: {
                    myString: {
                      type: "string",
                    },
                  },
                  definition: { relativePath: "myString" },
                },
                b: {
                  type: "string",
                  optional: true,
                },
                c: {
                  type: "record",
                  optional: true,
                  definition: {
                    type: "string",
                    optional: true,
                  },
                },
              },
            },
            expectedResult: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                  optional: true,
                },
                b: {
                  type: "string",
                  optional: true,
                },
                c: {
                  type: "record",
                  optional: true,
                  definition: {
                    type: "string",
                    optional: true,
                  },
                },
              },
            },
          },
          // schemaReference: object, recursive, 1-level valueObject
          test050: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                myObject: {
                  type: "object",
                  definition: {
                    a: {
                      type: "union",
                      optional: true,
                      definition: [
                        {
                          type: "string",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject" },
                        },
                      ],
                    },
                  },
                },
              },
              definition: { relativePath: "myObject" },
            },
            expectedResult: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  optional: true,
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      context: {
                        myObject: {
                          type: "object",
                          definition: {
                            a: {
                              type: "union",
                              optional: true,
                              definition: [
                                {
                                  type: "string",
                                },
                                {
                                  type: "schemaReference",
                                  definition: { relativePath: "myObject" },
                                },
                              ],
                            },
                          },
                        },
                      },
                      definition: { relativePath: "myObject" },
                    },
                  ],
                },
              },
            },
          },
          // schemaReference: object, recursive, 3-level valueObject
          test060: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                myObject: {
                  type: "object",
                  definition: {
                    a: {
                      type: "union",
                      definition: [
                        {
                          type: "string",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject" },
                        },
                      ],
                    },
                  },
                },
              },
              definition: { relativePath: "myObject" },
            },
            expectedResult: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      definition: {
                        relativePath: "myObject",
                      },
                      context: {
                        myObject: {
                          type: "object",
                          definition: {
                            a: {
                              type: "union",
                              definition: [
                                {
                                  type: "string",
                                },
                                {
                                  type: "schemaReference",
                                  definition: {
                                    relativePath: "myObject",
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          // union of schemaReferences
          test070: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "union",
              discriminator: "extractorOrCombinerType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "extractorOrCombinerContextReference",
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  },
                  context: {},
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "extractorOrCombinerReturningObject",
                    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  },
                  context: {},
                },
              ],
              // },
              // optional: true,
            },
            expectedResult: {
              "type": "union",
              "discriminator": "extractorOrCombinerType",
              "definition": [
                {
                  "type": "object",
                  "definition": {
                    "extractorOrCombinerType": {
                      "type": "literal",
                      "definition": "extractorOrCombinerContextReference"
                    },
                    "extractorOrCombinerContextReference": {
                      "type": "string"
                    }
                  }
                },
                {
                  "type": "union",
                  "discriminator": "extractorOrCombinerType",
                  "definition": [
                    {
                      "type": "object",
                      "extend": {
                        "type": "schemaReference",
                        "definition": {
                          "eager": true,
                          "relativePath": "extractorOrCombinerRoot",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      },
                      "definition": {
                        "label": {
                          "type": "string",
                          "optional": true,
                          "tag": {
                            "value": {
                              "id": 1,
                              "defaultLabel": "Label",
                              "editable": false
                            }
                          }
                        },
                        "applicationSection": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "literal",
                              "definition": "model"
                            },
                            {
                              "type": "literal",
                              "definition": "data"
                            }
                          ],
                          "optional": true,
                          "tag": {
                            "value": {
                              "id": 2,
                              "defaultLabel": "SelfApplication Section",
                              "editable": false
                            }
                          }
                        },
                        "parentName": {
                          "type": "string",
                          "optional": true,
                          "tag": {
                            "value": {
                              "id": 3,
                              "canBeTemplate": true,
                              "defaultLabel": "Parent Name",
                              "editable": false
                            }
                          }
                        },
                        "parentUuid": {
                          "type": "uuid",
                          "tag": {
                            "value": {
                              "id": 4,
                              "canBeTemplate": true,
                              "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                              "defaultLabel": "Parent Uuid",
                              "editable": false
                            }
                          }
                        },
                        "extractorOrCombinerType": {
                          "type": "literal",
                          "definition": "extractorForObjectByDirectReference"
                        },
                        "instanceUuid": {
                          "type": "uuid"
                        }
                      }
                    },
                    {
                      "type": "object",
                      "extend": {
                        "type": "schemaReference",
                        "definition": {
                          "eager": true,
                          "relativePath": "extractorOrCombinerRoot",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      },
                      "definition": {
                        "label": {
                          "type": "string",
                          "optional": true,
                          "tag": {
                            "value": {
                              "id": 1,
                              "defaultLabel": "Label",
                              "editable": false
                            }
                          }
                        },
                        "applicationSection": {
                          "type": "union",
                          "definition": [
                            {
                              "type": "literal",
                              "definition": "model"
                            },
                            {
                              "type": "literal",
                              "definition": "data"
                            }
                          ],
                          "optional": true,
                          "tag": {
                            "value": {
                              "id": 2,
                              "defaultLabel": "SelfApplication Section",
                              "editable": false
                            }
                          }
                        },
                        "parentName": {
                          "type": "string",
                          "optional": true,
                          "tag": {
                            "value": {
                              "id": 3,
                              "canBeTemplate": true,
                              "defaultLabel": "Parent Name",
                              "editable": false
                            }
                          }
                        },
                        "parentUuid": {
                          "type": "uuid",
                          "tag": {
                            "value": {
                              "id": 4,
                              "canBeTemplate": true,
                              "targetEntity": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                              "defaultLabel": "Parent Uuid",
                              "editable": false
                            }
                          }
                        },
                        "extractorOrCombinerType": {
                          "type": "literal",
                          "definition": "combinerForObjectByRelation"
                        },
                        "objectReference": {
                          "type": "string"
                        },
                        "AttributeOfObjectToCompareToReferenceUuid": {
                          "type": "string"
                        }
                      }
                    }
                  ]
                }
              ]
            }
          },
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          test100: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: entityDefinitionEndpoint.jzodSchema as JzodElement,
            expectedResult: {
              "type": "object",
              "definition": {
                "uuid": {
                  "type": "uuid",
                  "tag": {
                    "value": {
                      "id": 1,
                      "defaultLabel": "Uuid",
                      "editable": false
                    }
                  }
                },
                "parentName": {
                  "type": "string",
                  "tag": {
                    "value": {
                      "id": 2,
                      "defaultLabel": "Entity Name",
                      "editable": false
                    }
                  }
                },
                "parentUuid": {
                  "type": "uuid",
                  "tag": {
                    "value": {
                      "id": 3,
                      "defaultLabel": "Entity Uuid",
                      "editable": false
                    }
                  }
                },
                "parentDefinitionVersionUuid": {
                  "type": "uuid",
                  "optional": true,
                  "tag": {
                    "value": {
                      "id": 4,
                      "defaultLabel": "Entity Definition Version Uuid",
                      "editable": false
                    }
                  }
                },
                "name": {
                  "type": "string",
                  "tag": {
                    "value": {
                      "id": 6,
                      "defaultLabel": "Name",
                      "editable": false
                    }
                  }
                },
                "version": {
                  "type": "string",
                  "tag": {
                    "value": {
                      "id": 7,
                      "defaultLabel": "Version",
                      "editable": false
                    }
                  }
                },
                "description": {
                  "type": "string",
                  "optional": true,
                  "tag": {
                    "value": {
                      "id": 8,
                      "defaultLabel": "Description",
                      "editable": true
                    }
                  }
                },
                "transactionalEndpoint": {
                  "type": "boolean",
                  "optional": true,
                  "tag": {
                    "value": {
                      "id": 9,
                      "defaultLabel": "Transactional Endpoint",
                      "editable": true
                    }
                  }
                },
                "definition": {
                  "type": "object",
                  "tag": {
                    "value": {
                      "id": 10,
                      "defaultLabel": "Definition",
                      "editable": true
                    }
                  },
                  "definition": {
                    "actions": {
                      "type": "schemaReference",
                      "context": {
                        "action": {
                          "type": "object",
                          "definition": {
                            "actionParameters": {
                              "type": "object",
                              "definition": {
                                "actionType": {
                                  "type": "schemaReference",
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodLiteral"
                                  }
                                },
                                "actionName": {
                                  "type": "schemaReference",
                                  "optional": true,
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodLiteral"
                                  }
                                },
                                "actionLabel": {
                                  "type": "schemaReference",
                                  "optional": true,
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodAttributePlainStringWithValidations"
                                  }
                                },
                                "endpoint": {
                                  "type": "schemaReference",
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodLiteral"
                                  }
                                },
                                "configuration": {
                                  "type": "schemaReference",
                                  "optional": true,
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodElement"
                                  }
                                },
                                "deploymentUuid": {
                                  "type": "schemaReference",
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodPlainAttribute"
                                  }
                                },
                                "payload": {
                                  "type": "schemaReference",
                                  "optional": true,
                                  "definition": {
                                    "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                    "relativePath": "jzodObject"
                                  }
                                }
                              }
                            },
                            "actionImplementation": {
                              "type": "union",
                              "optional": true,
                              "discriminator": "actionImplementationType",
                              "definition": [
                                {
                                  "type": "object",
                                  "definition": {
                                    "actionImplementationType": {
                                      "type": "literal",
                                      "definition": "libraryImplementation"
                                    },
                                    "inMemoryImplementationFunctionName": {
                                      "type": "string"
                                    },
                                    "sqlImplementationFunctionName": {
                                      "type": "string",
                                      "optional": true
                                    }
                                  }
                                },
                                {
                                  "type": "object",
                                  "definition": {
                                    "actionImplementationType": {
                                      "type": "literal",
                                      "definition": "compositeAction"
                                    },
                                    "definition": {
                                      "type": "schemaReference",
                                      "definition": {
                                        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        "relativePath": "compositeAction"
                                      }
                                    }
                                  }
                                }
                              ]
                            },
                            "actionErrors": {
                              "type": "union",
                              "discriminator": "type",
                              "optional": true,
                              "definition": [
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                    "relativePath": "jzodEnum"
                                  }
                                },
                                {
                                  "type": "schemaReference",
                                  "definition": {
                                    "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                    "relativePath": "jzodLiteral"
                                  }
                                }
                              ]
                            }
                          }
                        },
                        "actionsArray": {
                          "type": "array",
                          "definition": {
                            "type": "schemaReference",
                            "definition": {
                              "relativePath": "action"
                            }
                          }
                        },
                        "actionsUnion": {
                          "type": "object",
                          "extend": {
                            "type": "schemaReference",
                            "definition": {
                              "eager": true,
                              "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              "relativePath": "jzodBaseObject"
                            }
                          },
                          "definition": {
                            "type": {
                              "type": "literal",
                              "definition": "union"
                            },
                            "discriminator": {
                              "type": "string",
                              "optional": true
                            },
                            "definition": {
                              "type": "array",
                              "definition": {
                                "type": "schemaReference",
                                "definition": {
                                  "relativePath": "action"
                                }
                              }
                            }
                          }
                        }
                      },
                      "definition": {
                        "relativePath": "actionsArray"
                      },
                      "tag": {
                        "value": {
                          "id": 10,
                          "defaultLabel": "Endpoint Parameter",
                          "editable": true
                        }
                      }
                    },
                    "actionDefinition": {
                      "type": "schemaReference",
                      "optional": true,
                      "definition": {
                        "absolutePath": "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        "relativePath": "jzodObject"
                      },
                      "tag": {
                        "value": {
                          "id": 11,
                          "defaultLabel": "Endpoint Definition",
                          "editable": true
                        }
                      }
                    },
                    "actionTransformer": {
                      "type": "any",
                      "optional": true
                    },
                    "actionMigrations": {
                      "type": "any",
                      "optional": true
                    }
                  }
                }
              }
            }
          },
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // ######################################################################################
          // real cases
          // unfold record of union
          test200: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "record",
              definition: {
                type: "union",
                discriminator: "extractorOrCombinerType",
                definition: [
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "extractorOrCombinerContextReference",
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    },
                    context: {},
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "extractorOrCombinerReturningObject",
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    },
                    context: {},
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "extractorOrCombinerReturningObjectList",
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    },
                    context: {},
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "extractorWrapper",
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    },
                    context: {},
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath:
                        "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList",
                      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                    },
                    context: {},
                  },
                  {
                    type: "object",
                    definition: {
                      extractorOrCombinerType: {
                        type: "literal",
                        definition: "literal",
                      },
                      definition: {
                        type: "string",
                      },
                    },
                  },
                ],
              },
              optional: true,
            },
            expectedResult: {
              "type": "record",
              "definition": {
                "type": "union",
                "discriminator": "extractorOrCombinerType",
                "definition": [
                  {
                    "type": "object",
                    "definition": {
                      "extractorOrCombinerType": {
                        "type": "literal",
                        "definition": "extractorOrCombinerContextReference"
                      },
                      "extractorOrCombinerContextReference": {
                        "type": "string"
                      }
                    }
                  },
                  {
                    "type": "union",
                    "discriminator": "extractorOrCombinerType",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "extractorForObjectByDirectReference",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "combinerForObjectByRelation",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "discriminator": "extractorOrCombinerType",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "extractorByEntityReturningObjectList",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "combinerByRelationReturningObjectList",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "combinerByManyToManyRelationReturningObjectList",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      }
                    ]
                  },
                  {
                    "type": "union",
                    "discriminator": "extractorOrCombinerType",
                    "definition": [
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "extractorWrapperReturningObject",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      },
                      {
                        "type": "schemaReference",
                        "definition": {
                          "relativePath": "extractorWrapperReturningList",
                          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739"
                        },
                        "context": {}
                      }
                    ]
                  },
                  {
                    "type": "object",
                    "definition": {
                      "extractorOrCombinerType": {
                        "type": "literal",
                        "definition": "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"
                      },
                      "orderBy": {
                        "type": "object",
                        "optional": true,
                        "definition": {
                          "attributeName": {
                            "type": "string"
                          },
                          "direction": {
                            "type": "enum",
                            "optional": true,
                            "definition": [
                              "ASC",
                              "DESC"
                            ]
                          }
                        }
                      },
                      "rootExtractorOrReference": {
                        "type": "union",
                        "discriminator": "extractorOrCombinerType",
                        "definition": [
                          {
                            "type": "schemaReference",
                            "definition": {
                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              "relativePath": "extractor"
                            },
                            "context": {}
                          },
                          {
                            "type": "string"
                          }
                        ]
                      },
                      "subQueryTemplate": {
                        "type": "object",
                        "definition": {
                          "query": {
                            "type": "schemaReference",
                            "definition": {
                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              "relativePath": "extractorOrCombinerTemplate"
                            },
                            "context": {}
                          },
                          "rootQueryObjectTransformer": {
                            "type": "schemaReference",
                            "definition": {
                              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              "relativePath": "recordOfTransformers"
                            },
                            "context": {}
                          }
                        }
                      }
                    }
                  },
                  {
                    "type": "object",
                    "definition": {
                      "extractorOrCombinerType": {
                        "type": "literal",
                        "definition": "literal"
                      },
                      "definition": {
                        "type": "string"
                      }
                    }
                  }
                ]
              },
              "optional": true
            }
          },
          // // infinite unfold of JzodObject
          // test210: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "object",
          //     extend: {
          //       type: "schemaReference",
          //       definition: {
          //         eager: true,
          //         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //         relativePath: "jzodBaseObject",
          //       },
          //       context: {},
          //     },
          //     definition: {
          //       extend: {
          //         type: "union",
          //         optional: true,
          //         definition: [
          //           {
          //             type: "union",
          //             optional: true,
          //             discriminator: "type",
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodReference",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodObject",
          //                 },
          //                 context: {},
          //               },
          //             ],
          //           },
          //           {
          //             type: "array",
          //             definition: {
          //               type: "union",
          //               optional: true,
          //               discriminator: "type",
          //               definition: [
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodReference",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodObject",
          //                   },
          //                   context: {},
          //                 },
          //               ],
          //             },
          //           },
          //         ],
          //       },
          //       type: {
          //         type: "literal",
          //         definition: "object",
          //       },
          //       nonStrict: {
          //         type: "boolean",
          //         optional: true,
          //       },
          //       partial: {
          //         type: "boolean",
          //         optional: true,
          //       },
          //       carryOn: {
          //         type: "union",
          //         discriminator: "type",
          //         optional: true,
          //         definition: [
          //           {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodObject",
          //             },
          //             context: {},
          //           },
          //           {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodUnion",
          //             },
          //             context: {},
          //           },
          //         ],
          //       },
          //       definition: {
          //         type: "record",
          //         definition: {
          //           type: "schemaReference",
          //           definition: {
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodElement",
          //           },
          //           context: {},
          //         },
          //       },
          //     },
          //   },
          //   expectedResult: {_
          //     "type": "object",
          //     "extend": {
          //       "type": "schemaReference",
          //       "definition": {
          //         "eager": true,
          //         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //         "relativePath": "jzodBaseObject"
          //       },
          //       "context": {}
          //     },
          //     "definition": {
          //       "optional": {
          //         "type": "boolean",
          //         "optional": true
          //       },
          //       "nullable": {
          //         "type": "boolean",
          //         "optional": true
          //       },
          //       "tag": {
          //         "type": "object",
          //         "optional": true,
          //         "definition": {
          //           "value": {
          //             "type": "object",
          //             "optional": true,
          //             "definition": {
          //               "id": {
          //                 "type": "number",
          //                 "optional": true
          //               },
          //               "defaultLabel": {
          //                 "type": "string",
          //                 "optional": true
          //               },
          //               "description": {
          //                 "type": "string",
          //                 "optional": true
          //               },
          //               "initializeTo": {
          //                 "type": "any",
          //                 "optional": true
          //               },
          //               "targetEntity": {
          //                 "type": "string",
          //                 "optional": true
          //               },
          //               "targetEntityOrderInstancesBy": {
          //                 "type": "string",
          //                 "optional": true
          //               },
          //               "targetEntityApplicationSection": {
          //                 "type": "enum",
          //                 "optional": true,
          //                 "definition": [
          //                   "model",
          //                   "data",
          //                   "metaModel"
          //                 ]
          //               },
          //               "editable": {
          //                 "type": "boolean",
          //                 "optional": true
          //               },
          //               "canBeTemplate": {
          //                 "type": "boolean",
          //                 "optional": true
          //               }
          //             }
          //           }
          //         }
          //       },
          //       "extend": {
          //         "type": "union",
          //         "optional": true,
          //         "definition": [
          //           {
          //             "type": "union",
          //             "optional": true,
          //             "discriminator": "type",
          //             "definition": [
          //               {
          //                 "type": "object",
          //                 "extend": {
          //                   "type": "schemaReference",
          //                   "definition": {
          //                     "eager": true,
          //                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     "relativePath": "jzodBaseObject"
          //                   },
          //                   "context": {}
          //                 },
          //                 "definition": {
          //                   "optional": {
          //                     "type": "boolean",
          //                     "optional": true
          //                   },
          //                   "nullable": {
          //                     "type": "boolean",
          //                     "optional": true
          //                   },
          //                   "tag": {
          //                     "type": "object",
          //                     "optional": true,
          //                     "definition": {
          //                       "value": {
          //                         "type": "object",
          //                         "optional": true,
          //                         "definition": {
          //                           "id": {
          //                             "type": "number",
          //                             "optional": true
          //                           },
          //                           "defaultLabel": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "description": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "initializeTo": {
          //                             "type": "any",
          //                             "optional": true
          //                           },
          //                           "targetEntity": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "targetEntityOrderInstancesBy": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "targetEntityApplicationSection": {
          //                             "type": "enum",
          //                             "optional": true,
          //                             "definition": [
          //                               "model",
          //                               "data",
          //                               "metaModel"
          //                             ]
          //                           },
          //                           "editable": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           },
          //                           "canBeTemplate": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           }
          //                         }
          //                       }
          //                     }
          //                   },
          //                   "type": {
          //                     "type": "literal",
          //                     "definition": "schemaReference"
          //                   },
          //                   "context": {
          //                     "type": "record",
          //                     "optional": true,
          //                     "definition": {
          //                       "type": "schemaReference",
          //                       "definition": {
          //                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         "relativePath": "jzodElement"
          //                       },
          //                       "context": {}
          //                     }
          //                   },
          //                   "carryOn": {
          //                     "type": "union",
          //                     "optional": true,
          //                     "discriminator": "type",
          //                     "definition": [
          //                       {
          //                         "type": "object",
          //                         "extend": {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "eager": true,
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodBaseObject"
          //                           },
          //                           "context": {}
          //                         },
          //                         "definition": {
          //                           "extend": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "union",
          //                                 "optional": true,
          //                                 "discriminator": "type",
          //                                 "definition": [
          //                                   {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodReference"
          //                                     },
          //                                     "context": {}
          //                                   },
          //                                   {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodObject"
          //                                     },
          //                                     "context": {}
          //                                   }
          //                                 ]
          //                               },
          //                               {
          //                                 "type": "array",
          //                                 "definition": {
          //                                   "type": "union",
          //                                   "optional": true,
          //                                   "discriminator": "type",
          //                                   "definition": [
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodReference"
          //                                       },
          //                                       "context": {}
          //                                     },
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodObject"
          //                                       },
          //                                       "context": {}
          //                                     }
          //                                   ]
          //                                 }
          //                               }
          //                             ]
          //                           },
          //                           "type": {
          //                             "type": "literal",
          //                             "definition": "object"
          //                           },
          //                           "nonStrict": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           },
          //                           "partial": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           },
          //                           "carryOn": {
          //                             "type": "union",
          //                             "discriminator": "type",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodObject"
          //                                 },
          //                                 "context": {}
          //                               },
          //                               {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodUnion"
          //                                 },
          //                                 "context": {}
          //                               }
          //                             ]
          //                           },
          //                           "definition": {
          //                             "type": "record",
          //                             "definition": {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodElement"
          //                               },
          //                               "context": {}
          //                             }
          //                           }
          //                         }
          //                       },
          //                       {
          //                         "type": "object",
          //                         "extend": {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "eager": true,
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodBaseObject"
          //                           },
          //                           "context": {}
          //                         },
          //                         "definition": {
          //                           "type": {
          //                             "type": "literal",
          //                             "definition": "union"
          //                           },
          //                           "discriminator": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "string"
          //                               },
          //                               {
          //                                 "type": "array",
          //                                 "definition": {
          //                                   "type": "string"
          //                                 }
          //                               }
          //                             ]
          //                           },
          //                           "discriminatorNew": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "object",
          //                                 "definition": {
          //                                   "discriminatorType": {
          //                                     "type": "literal",
          //                                     "definition": "string"
          //                                   },
          //                                   "value": {
          //                                     "type": "string"
          //                                   }
          //                                 }
          //                               },
          //                               {
          //                                 "type": "object",
          //                                 "definition": {
          //                                   "discriminatorType": {
          //                                     "type": "literal",
          //                                     "definition": "array"
          //                                   },
          //                                   "value": {
          //                                     "type": "array",
          //                                     "definition": {
          //                                       "type": "string"
          //                                     }
          //                                   }
          //                                 }
          //                               }
          //                             ]
          //                           },
          //                           "carryOn": {
          //                             "optional": true,
          //                             "type": "schemaReference",
          //                             "definition": {
          //                               "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               "relativePath": "jzodObject"
          //                             },
          //                             "context": {}
          //                           },
          //                           "definition": {
          //                             "type": "array",
          //                             "definition": {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodElement"
          //                               },
          //                               "context": {}
          //                             }
          //                           }
          //                         }
          //                       }
          //                     ]
          //                   },
          //                   "definition": {
          //                     "type": "object",
          //                     "definition": {
          //                       "eager": {
          //                         "type": "boolean",
          //                         "optional": true
          //                       },
          //                       "partial": {
          //                         "type": "boolean",
          //                         "optional": true
          //                       },
          //                       "relativePath": {
          //                         "type": "string",
          //                         "optional": true
          //                       },
          //                       "absolutePath": {
          //                         "type": "string",
          //                         "optional": true
          //                       }
          //                     }
          //                   }
          //                 }
          //               },
          //               {
          //                 "type": "object",
          //                 "extend": {
          //                   "type": "schemaReference",
          //                   "definition": {
          //                     "eager": true,
          //                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     "relativePath": "jzodBaseObject"
          //                   },
          //                   "context": {}
          //                 },
          //                 "definition": {
          //                   "optional": {
          //                     "type": "boolean",
          //                     "optional": true
          //                   },
          //                   "nullable": {
          //                     "type": "boolean",
          //                     "optional": true
          //                   },
          //                   "tag": {
          //                     "type": "object",
          //                     "optional": true,
          //                     "definition": {
          //                       "value": {
          //                         "type": "object",
          //                         "optional": true,
          //                         "definition": {
          //                           "id": {
          //                             "type": "number",
          //                             "optional": true
          //                           },
          //                           "defaultLabel": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "description": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "initializeTo": {
          //                             "type": "any",
          //                             "optional": true
          //                           },
          //                           "targetEntity": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "targetEntityOrderInstancesBy": {
          //                             "type": "string",
          //                             "optional": true
          //                           },
          //                           "targetEntityApplicationSection": {
          //                             "type": "enum",
          //                             "optional": true,
          //                             "definition": [
          //                               "model",
          //                               "data",
          //                               "metaModel"
          //                             ]
          //                           },
          //                           "editable": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           },
          //                           "canBeTemplate": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           }
          //                         }
          //                       }
          //                     }
          //                   },
          //                   "extend": {
          //                     "type": "union",
          //                     "optional": true,
          //                     "definition": [
          //                       {
          //                         "type": "union",
          //                         "optional": true,
          //                         "discriminator": "type",
          //                         "definition": [
          //                           {
          //                             "type": "object",
          //                             "extend": {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "eager": true,
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodBaseObject"
          //                               },
          //                               "context": {}
          //                             },
          //                             "definition": {
          //                               "optional": {
          //                                 "type": "boolean",
          //                                 "optional": true
          //                               },
          //                               "nullable": {
          //                                 "type": "boolean",
          //                                 "optional": true
          //                               },
          //                               "tag": {
          //                                 "type": "object",
          //                                 "optional": true,
          //                                 "definition": {
          //                                   "value": {
          //                                     "type": "object",
          //                                     "optional": true,
          //                                     "definition": {
          //                                       "id": {
          //                                         "type": "number",
          //                                         "optional": true
          //                                       },
          //                                       "defaultLabel": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "description": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "initializeTo": {
          //                                         "type": "any",
          //                                         "optional": true
          //                                       },
          //                                       "targetEntity": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "targetEntityOrderInstancesBy": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "targetEntityApplicationSection": {
          //                                         "type": "enum",
          //                                         "optional": true,
          //                                         "definition": [
          //                                           "model",
          //                                           "data",
          //                                           "metaModel"
          //                                         ]
          //                                       },
          //                                       "editable": {
          //                                         "type": "boolean",
          //                                         "optional": true
          //                                       },
          //                                       "canBeTemplate": {
          //                                         "type": "boolean",
          //                                         "optional": true
          //                                       }
          //                                     }
          //                                   }
          //                                 }
          //                               },
          //                               "type": {
          //                                 "type": "literal",
          //                                 "definition": "schemaReference"
          //                               },
          //                               "context": {
          //                                 "type": "record",
          //                                 "optional": true,
          //                                 "definition": {
          //                                   "type": "schemaReference",
          //                                   "definition": {
          //                                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     "relativePath": "jzodElement"
          //                                   },
          //                                   "context": {}
          //                                 }
          //                               },
          //                               "carryOn": {
          //                                 "type": "union",
          //                                 "optional": true,
          //                                 "discriminator": "type",
          //                                 "definition": [
          //                                   {
          //                                     "type": "object",
          //                                     "extend": {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "eager": true,
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodBaseObject"
          //                                       },
          //                                       "context": {}
          //                                     },
          //                                     "definition": {
          //                                       "extend": {
          //                                         "type": "union",
          //                                         "optional": true,
          //                                         "definition": [
          //                                           {
          //                                             "type": "union",
          //                                             "optional": true,
          //                                             "discriminator": "type",
          //                                             "definition": [
          //                                               {
          //                                                 "type": "schemaReference",
          //                                                 "definition": {
          //                                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                   "relativePath": "jzodReference"
          //                                                 },
          //                                                 "context": {}
          //                                               },
          //                                               {
          //                                                 "type": "schemaReference",
          //                                                 "definition": {
          //                                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                   "relativePath": "jzodObject"
          //                                                 },
          //                                                 "context": {}
          //                                               }
          //                                             ]
          //                                           },
          //                                           {
          //                                             "type": "array",
          //                                             "definition": {
          //                                               "type": "union",
          //                                               "optional": true,
          //                                               "discriminator": "type",
          //                                               "definition": [
          //                                                 {
          //                                                   "type": "schemaReference",
          //                                                   "definition": {
          //                                                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                     "relativePath": "jzodReference"
          //                                                   },
          //                                                   "context": {}
          //                                                 },
          //                                                 {
          //                                                   "type": "schemaReference",
          //                                                   "definition": {
          //                                                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                     "relativePath": "jzodObject"
          //                                                   },
          //                                                   "context": {}
          //                                                 }
          //                                               ]
          //                                             }
          //                                           }
          //                                         ]
          //                                       },
          //                                       "type": {
          //                                         "type": "literal",
          //                                         "definition": "object"
          //                                       },
          //                                       "nonStrict": {
          //                                         "type": "boolean",
          //                                         "optional": true
          //                                       },
          //                                       "partial": {
          //                                         "type": "boolean",
          //                                         "optional": true
          //                                       },
          //                                       "carryOn": {
          //                                         "type": "union",
          //                                         "discriminator": "type",
          //                                         "optional": true,
          //                                         "definition": [
          //                                           {
          //                                             "type": "schemaReference",
          //                                             "definition": {
          //                                               "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               "relativePath": "jzodObject"
          //                                             },
          //                                             "context": {}
          //                                           },
          //                                           {
          //                                             "type": "schemaReference",
          //                                             "definition": {
          //                                               "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               "relativePath": "jzodUnion"
          //                                             },
          //                                             "context": {}
          //                                           }
          //                                         ]
          //                                       },
          //                                       "definition": {
          //                                         "type": "record",
          //                                         "definition": {
          //                                           "type": "schemaReference",
          //                                           "definition": {
          //                                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             "relativePath": "jzodElement"
          //                                           },
          //                                           "context": {}
          //                                         }
          //                                       }
          //                                     }
          //                                   },
          //                                   {
          //                                     "type": "object",
          //                                     "extend": {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "eager": true,
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodBaseObject"
          //                                       },
          //                                       "context": {}
          //                                     },
          //                                     "definition": {
          //                                       "type": {
          //                                         "type": "literal",
          //                                         "definition": "union"
          //                                       },
          //                                       "discriminator": {
          //                                         "type": "union",
          //                                         "optional": true,
          //                                         "definition": [
          //                                           {
          //                                             "type": "string"
          //                                           },
          //                                           {
          //                                             "type": "array",
          //                                             "definition": {
          //                                               "type": "string"
          //                                             }
          //                                           }
          //                                         ]
          //                                       },
          //                                       "discriminatorNew": {
          //                                         "type": "union",
          //                                         "optional": true,
          //                                         "definition": [
          //                                           {
          //                                             "type": "object",
          //                                             "definition": {
          //                                               "discriminatorType": {
          //                                                 "type": "literal",
          //                                                 "definition": "string"
          //                                               },
          //                                               "value": {
          //                                                 "type": "string"
          //                                               }
          //                                             }
          //                                           },
          //                                           {
          //                                             "type": "object",
          //                                             "definition": {
          //                                               "discriminatorType": {
          //                                                 "type": "literal",
          //                                                 "definition": "array"
          //                                               },
          //                                               "value": {
          //                                                 "type": "array",
          //                                                 "definition": {
          //                                                   "type": "string"
          //                                                 }
          //                                               }
          //                                             }
          //                                           }
          //                                         ]
          //                                       },
          //                                       "carryOn": {
          //                                         "optional": true,
          //                                         "type": "schemaReference",
          //                                         "definition": {
          //                                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           "relativePath": "jzodObject"
          //                                         },
          //                                         "context": {}
          //                                       },
          //                                       "definition": {
          //                                         "type": "array",
          //                                         "definition": {
          //                                           "type": "schemaReference",
          //                                           "definition": {
          //                                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             "relativePath": "jzodElement"
          //                                           },
          //                                           "context": {}
          //                                         }
          //                                       }
          //                                     }
          //                                   }
          //                                 ]
          //                               },
          //                               "definition": {
          //                                 "type": "object",
          //                                 "definition": {
          //                                   "eager": {
          //                                     "type": "boolean",
          //                                     "optional": true
          //                                   },
          //                                   "partial": {
          //                                     "type": "boolean",
          //                                     "optional": true
          //                                   },
          //                                   "relativePath": {
          //                                     "type": "string",
          //                                     "optional": true
          //                                   },
          //                                   "absolutePath": {
          //                                     "type": "string",
          //                                     "optional": true
          //                                   }
          //                                 }
          //                               }
          //                             }
          //                           },
          //                           {
          //                             "type": "object",
          //                             "extend": {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "eager": true,
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodBaseObject"
          //                               },
          //                               "context": {}
          //                             },
          //                             "definition": {
          //                               "optional": {
          //                                 "type": "boolean",
          //                                 "optional": true
          //                               },
          //                               "nullable": {
          //                                 "type": "boolean",
          //                                 "optional": true
          //                               },
          //                               "tag": {
          //                                 "type": "object",
          //                                 "optional": true,
          //                                 "definition": {
          //                                   "value": {
          //                                     "type": "object",
          //                                     "optional": true,
          //                                     "definition": {
          //                                       "id": {
          //                                         "type": "number",
          //                                         "optional": true
          //                                       },
          //                                       "defaultLabel": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "description": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "initializeTo": {
          //                                         "type": "any",
          //                                         "optional": true
          //                                       },
          //                                       "targetEntity": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "targetEntityOrderInstancesBy": {
          //                                         "type": "string",
          //                                         "optional": true
          //                                       },
          //                                       "targetEntityApplicationSection": {
          //                                         "type": "enum",
          //                                         "optional": true,
          //                                         "definition": [
          //                                           "model",
          //                                           "data",
          //                                           "metaModel"
          //                                         ]
          //                                       },
          //                                       "editable": {
          //                                         "type": "boolean",
          //                                         "optional": true
          //                                       },
          //                                       "canBeTemplate": {
          //                                         "type": "boolean",
          //                                         "optional": true
          //                                       }
          //                                     }
          //                                   }
          //                                 }
          //                               },
          //                               "extend": {
          //                                 "type": "union",
          //                                 "optional": true,
          //                                 "definition": [
          //                                   {
          //                                     "type": "union",
          //                                     "optional": true,
          //                                     "discriminator": "type",
          //                                     "definition": [
          //                                       {
          //                                         "type": "schemaReference",
          //                                         "definition": {
          //                                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           "relativePath": "jzodReference"
          //                                         },
          //                                         "context": {}
          //                                       },
          //                                       {
          //                                         "type": "schemaReference",
          //                                         "definition": {
          //                                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           "relativePath": "jzodObject"
          //                                         },
          //                                         "context": {}
          //                                       }
          //                                     ]
          //                                   },
          //                                   {
          //                                     "type": "array",
          //                                     "definition": {
          //                                       "type": "union",
          //                                       "optional": true,
          //                                       "discriminator": "type",
          //                                       "definition": [
          //                                         {
          //                                           "type": "schemaReference",
          //                                           "definition": {
          //                                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             "relativePath": "jzodReference"
          //                                           },
          //                                           "context": {}
          //                                         },
          //                                         {
          //                                           "type": "schemaReference",
          //                                           "definition": {
          //                                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             "relativePath": "jzodObject"
          //                                           },
          //                                           "context": {}
          //                                         }
          //                                       ]
          //                                     }
          //                                   }
          //                                 ]
          //                               },
          //                               "type": {
          //                                 "type": "literal",
          //                                 "definition": "object"
          //                               },
          //                               "nonStrict": {
          //                                 "type": "boolean",
          //                                 "optional": true
          //                               },
          //                               "partial": {
          //                                 "type": "boolean",
          //                                 "optional": true
          //                               },
          //                               "carryOn": {
          //                                 "type": "union",
          //                                 "discriminator": "type",
          //                                 "optional": true,
          //                                 "definition": [
          //                                   {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodObject"
          //                                     },
          //                                     "context": {}
          //                                   },
          //                                   {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodUnion"
          //                                     },
          //                                     "context": {}
          //                                   }
          //                                 ]
          //                               },
          //                               "definition": {
          //                                 "type": "record",
          //                                 "definition": {
          //                                   "type": "schemaReference",
          //                                   "definition": {
          //                                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     "relativePath": "jzodElement"
          //                                   },
          //                                   "context": {}
          //                                 }
          //                               }
          //                             }
          //                           }
          //                         ]
          //                       },
          //                       {
          //                         "type": "array",
          //                         "definition": {
          //                           "type": "union",
          //                           "optional": true,
          //                           "discriminator": "type",
          //                           "definition": [
          //                             {
          //                               "type": "object",
          //                               "extend": {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "eager": true,
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodBaseObject"
          //                                 },
          //                                 "context": {}
          //                               },
          //                               "definition": {
          //                                 "type": {
          //                                   "type": "literal",
          //                                   "definition": "schemaReference"
          //                                 },
          //                                 "context": {
          //                                   "type": "record",
          //                                   "optional": true,
          //                                   "definition": {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodElement"
          //                                     },
          //                                     "context": {}
          //                                   }
          //                                 },
          //                                 "carryOn": {
          //                                   "type": "union",
          //                                   "optional": true,
          //                                   "discriminator": "type",
          //                                   "definition": [
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodObject"
          //                                       },
          //                                       "context": {}
          //                                     },
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodUnion"
          //                                       },
          //                                       "context": {}
          //                                     }
          //                                   ]
          //                                 },
          //                                 "definition": {
          //                                   "type": "object",
          //                                   "definition": {
          //                                     "eager": {
          //                                       "type": "boolean",
          //                                       "optional": true
          //                                     },
          //                                     "partial": {
          //                                       "type": "boolean",
          //                                       "optional": true
          //                                     },
          //                                     "relativePath": {
          //                                       "type": "string",
          //                                       "optional": true
          //                                     },
          //                                     "absolutePath": {
          //                                       "type": "string",
          //                                       "optional": true
          //                                     }
          //                                   }
          //                                 }
          //                               }
          //                             },
          //                             {
          //                               "type": "object",
          //                               "extend": {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "eager": true,
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodBaseObject"
          //                                 },
          //                                 "context": {}
          //                               },
          //                               "definition": {
          //                                 "extend": {
          //                                   "type": "union",
          //                                   "optional": true,
          //                                   "definition": [
          //                                     {
          //                                       "type": "union",
          //                                       "optional": true,
          //                                       "discriminator": "type",
          //                                       "definition": [
          //                                         {
          //                                           "type": "schemaReference",
          //                                           "definition": {
          //                                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             "relativePath": "jzodReference"
          //                                           },
          //                                           "context": {}
          //                                         },
          //                                         {
          //                                           "type": "schemaReference",
          //                                           "definition": {
          //                                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             "relativePath": "jzodObject"
          //                                           },
          //                                           "context": {}
          //                                         }
          //                                       ]
          //                                     },
          //                                     {
          //                                       "type": "array",
          //                                       "definition": {
          //                                         "type": "union",
          //                                         "optional": true,
          //                                         "discriminator": "type",
          //                                         "definition": [
          //                                           {
          //                                             "type": "schemaReference",
          //                                             "definition": {
          //                                               "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               "relativePath": "jzodReference"
          //                                             },
          //                                             "context": {}
          //                                           },
          //                                           {
          //                                             "type": "schemaReference",
          //                                             "definition": {
          //                                               "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               "relativePath": "jzodObject"
          //                                             },
          //                                             "context": {}
          //                                           }
          //                                         ]
          //                                       }
          //                                     }
          //                                   ]
          //                                 },
          //                                 "type": {
          //                                   "type": "literal",
          //                                   "definition": "object"
          //                                 },
          //                                 "nonStrict": {
          //                                   "type": "boolean",
          //                                   "optional": true
          //                                 },
          //                                 "partial": {
          //                                   "type": "boolean",
          //                                   "optional": true
          //                                 },
          //                                 "carryOn": {
          //                                   "type": "union",
          //                                   "discriminator": "type",
          //                                   "optional": true,
          //                                   "definition": [
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodObject"
          //                                       },
          //                                       "context": {}
          //                                     },
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodUnion"
          //                                       },
          //                                       "context": {}
          //                                     }
          //                                   ]
          //                                 },
          //                                 "definition": {
          //                                   "type": "record",
          //                                   "definition": {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodElement"
          //                                     },
          //                                     "context": {}
          //                                   }
          //                                 }
          //                               }
          //                             }
          //                           ]
          //                         }
          //                       }
          //                     ]
          //                   },
          //                   "type": {
          //                     "type": "literal",
          //                     "definition": "object"
          //                   },
          //                   "nonStrict": {
          //                     "type": "boolean",
          //                     "optional": true
          //                   },
          //                   "partial": {
          //                     "type": "boolean",
          //                     "optional": true
          //                   },
          //                   "carryOn": {
          //                     "type": "union",
          //                     "discriminator": "type",
          //                     "optional": true,
          //                     "definition": [
          //                       {
          //                         "type": "object",
          //                         "extend": {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "eager": true,
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodBaseObject"
          //                           },
          //                           "context": {}
          //                         },
          //                         "definition": {
          //                           "extend": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "union",
          //                                 "optional": true,
          //                                 "discriminator": "type",
          //                                 "definition": [
          //                                   {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodReference"
          //                                     },
          //                                     "context": {}
          //                                   },
          //                                   {
          //                                     "type": "schemaReference",
          //                                     "definition": {
          //                                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       "relativePath": "jzodObject"
          //                                     },
          //                                     "context": {}
          //                                   }
          //                                 ]
          //                               },
          //                               {
          //                                 "type": "array",
          //                                 "definition": {
          //                                   "type": "union",
          //                                   "optional": true,
          //                                   "discriminator": "type",
          //                                   "definition": [
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodReference"
          //                                       },
          //                                       "context": {}
          //                                     },
          //                                     {
          //                                       "type": "schemaReference",
          //                                       "definition": {
          //                                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         "relativePath": "jzodObject"
          //                                       },
          //                                       "context": {}
          //                                     }
          //                                   ]
          //                                 }
          //                               }
          //                             ]
          //                           },
          //                           "type": {
          //                             "type": "literal",
          //                             "definition": "object"
          //                           },
          //                           "nonStrict": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           },
          //                           "partial": {
          //                             "type": "boolean",
          //                             "optional": true
          //                           },
          //                           "carryOn": {
          //                             "type": "union",
          //                             "discriminator": "type",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodObject"
          //                                 },
          //                                 "context": {}
          //                               },
          //                               {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodUnion"
          //                                 },
          //                                 "context": {}
          //                               }
          //                             ]
          //                           },
          //                           "definition": {
          //                             "type": "record",
          //                             "definition": {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodElement"
          //                               },
          //                               "context": {}
          //                             }
          //                           }
          //                         }
          //                       },
          //                       {
          //                         "type": "object",
          //                         "extend": {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "eager": true,
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodBaseObject"
          //                           },
          //                           "context": {}
          //                         },
          //                         "definition": {
          //                           "type": {
          //                             "type": "literal",
          //                             "definition": "union"
          //                           },
          //                           "discriminator": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "string"
          //                               },
          //                               {
          //                                 "type": "array",
          //                                 "definition": {
          //                                   "type": "string"
          //                                 }
          //                               }
          //                             ]
          //                           },
          //                           "discriminatorNew": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "definition": [
          //                               {
          //                                 "type": "object",
          //                                 "definition": {
          //                                   "discriminatorType": {
          //                                     "type": "literal",
          //                                     "definition": "string"
          //                                   },
          //                                   "value": {
          //                                     "type": "string"
          //                                   }
          //                                 }
          //                               },
          //                               {
          //                                 "type": "object",
          //                                 "definition": {
          //                                   "discriminatorType": {
          //                                     "type": "literal",
          //                                     "definition": "array"
          //                                   },
          //                                   "value": {
          //                                     "type": "array",
          //                                     "definition": {
          //                                       "type": "string"
          //                                     }
          //                                   }
          //                                 }
          //                               }
          //                             ]
          //                           },
          //                           "carryOn": {
          //                             "optional": true,
          //                             "type": "schemaReference",
          //                             "definition": {
          //                               "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               "relativePath": "jzodObject"
          //                             },
          //                             "context": {}
          //                           },
          //                           "definition": {
          //                             "type": "array",
          //                             "definition": {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodElement"
          //                               },
          //                               "context": {}
          //                             }
          //                           }
          //                         }
          //                       }
          //                     ]
          //                   },
          //                   "definition": {
          //                     "type": "record",
          //                     "definition": {
          //                       "type": "schemaReference",
          //                       "definition": {
          //                         "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         "relativePath": "jzodElement"
          //                       },
          //                       "context": {}
          //                     }
          //                   }
          //                 }
          //               }
          //             ]
          //           },
          //           {
          //             "type": "array",
          //             "definition": {
          //               "type": "union",
          //               "optional": true,
          //               "discriminator": "type",
          //               "definition": [
          //                 {
          //                   "type": "object",
          //                   "extend": {
          //                     "type": "schemaReference",
          //                     "definition": {
          //                       "eager": true,
          //                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       "relativePath": "jzodBaseObject"
          //                     },
          //                     "context": {}
          //                   },
          //                   "definition": {
          //                     "type": {
          //                       "type": "literal",
          //                       "definition": "schemaReference"
          //                     },
          //                     "context": {
          //                       "type": "record",
          //                       "optional": true,
          //                       "definition": {
          //                         "type": "schemaReference",
          //                         "definition": {
          //                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           "relativePath": "jzodElement"
          //                         },
          //                         "context": {}
          //                       }
          //                     },
          //                     "carryOn": {
          //                       "type": "union",
          //                       "optional": true,
          //                       "discriminator": "type",
          //                       "definition": [
          //                         {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodObject"
          //                           },
          //                           "context": {}
          //                         },
          //                         {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodUnion"
          //                           },
          //                           "context": {}
          //                         }
          //                       ]
          //                     },
          //                     "definition": {
          //                       "type": "object",
          //                       "definition": {
          //                         "eager": {
          //                           "type": "boolean",
          //                           "optional": true
          //                         },
          //                         "partial": {
          //                           "type": "boolean",
          //                           "optional": true
          //                         },
          //                         "relativePath": {
          //                           "type": "string",
          //                           "optional": true
          //                         },
          //                         "absolutePath": {
          //                           "type": "string",
          //                           "optional": true
          //                         }
          //                       }
          //                     }
          //                   }
          //                 },
          //                 {
          //                   "type": "object",
          //                   "extend": {
          //                     "type": "schemaReference",
          //                     "definition": {
          //                       "eager": true,
          //                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       "relativePath": "jzodBaseObject"
          //                     },
          //                     "context": {}
          //                   },
          //                   "definition": {
          //                     "extend": {
          //                       "type": "union",
          //                       "optional": true,
          //                       "definition": [
          //                         {
          //                           "type": "union",
          //                           "optional": true,
          //                           "discriminator": "type",
          //                           "definition": [
          //                             {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodReference"
          //                               },
          //                               "context": {}
          //                             },
          //                             {
          //                               "type": "schemaReference",
          //                               "definition": {
          //                                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 "relativePath": "jzodObject"
          //                               },
          //                               "context": {}
          //                             }
          //                           ]
          //                         },
          //                         {
          //                           "type": "array",
          //                           "definition": {
          //                             "type": "union",
          //                             "optional": true,
          //                             "discriminator": "type",
          //                             "definition": [
          //                               {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodReference"
          //                                 },
          //                                 "context": {}
          //                               },
          //                               {
          //                                 "type": "schemaReference",
          //                                 "definition": {
          //                                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   "relativePath": "jzodObject"
          //                                 },
          //                                 "context": {}
          //                               }
          //                             ]
          //                           }
          //                         }
          //                       ]
          //                     },
          //                     "type": {
          //                       "type": "literal",
          //                       "definition": "object"
          //                     },
          //                     "nonStrict": {
          //                       "type": "boolean",
          //                       "optional": true
          //                     },
          //                     "partial": {
          //                       "type": "boolean",
          //                       "optional": true
          //                     },
          //                     "carryOn": {
          //                       "type": "union",
          //                       "discriminator": "type",
          //                       "optional": true,
          //                       "definition": [
          //                         {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodObject"
          //                           },
          //                           "context": {}
          //                         },
          //                         {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodUnion"
          //                           },
          //                           "context": {}
          //                         }
          //                       ]
          //                     },
          //                     "definition": {
          //                       "type": "record",
          //                       "definition": {
          //                         "type": "schemaReference",
          //                         "definition": {
          //                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           "relativePath": "jzodElement"
          //                         },
          //                         "context": {}
          //                       }
          //                     }
          //                   }
          //                 }
          //               ]
          //             }
          //           }
          //         ]
          //       },
          //       "type": {
          //         "type": "literal",
          //         "definition": "object"
          //       },
          //       "nonStrict": {
          //         "type": "boolean",
          //         "optional": true
          //       },
          //       "partial": {
          //         "type": "boolean",
          //         "optional": true
          //       },
          //       "carryOn": {
          //         "type": "union",
          //         "discriminator": "type",
          //         "optional": true,
          //         "definition": [
          //           {
          //             "type": "object",
          //             "extend": {
          //               "type": "schemaReference",
          //               "definition": {
          //                 "eager": true,
          //                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 "relativePath": "jzodBaseObject"
          //               },
          //               "context": {}
          //             },
          //             "definition": {
          //               "extend": {
          //                 "type": "union",
          //                 "optional": true,
          //                 "definition": [
          //                   {
          //                     "type": "union",
          //                     "optional": true,
          //                     "discriminator": "type",
          //                     "definition": [
          //                       {
          //                         "type": "schemaReference",
          //                         "definition": {
          //                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           "relativePath": "jzodReference"
          //                         },
          //                         "context": {}
          //                       },
          //                       {
          //                         "type": "schemaReference",
          //                         "definition": {
          //                           "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           "relativePath": "jzodObject"
          //                         },
          //                         "context": {}
          //                       }
          //                     ]
          //                   },
          //                   {
          //                     "type": "array",
          //                     "definition": {
          //                       "type": "union",
          //                       "optional": true,
          //                       "discriminator": "type",
          //                       "definition": [
          //                         {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodReference"
          //                           },
          //                           "context": {}
          //                         },
          //                         {
          //                           "type": "schemaReference",
          //                           "definition": {
          //                             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                             "relativePath": "jzodObject"
          //                           },
          //                           "context": {}
          //                         }
          //                       ]
          //                     }
          //                   }
          //                 ]
          //               },
          //               "type": {
          //                 "type": "literal",
          //                 "definition": "object"
          //               },
          //               "nonStrict": {
          //                 "type": "boolean",
          //                 "optional": true
          //               },
          //               "partial": {
          //                 "type": "boolean",
          //                 "optional": true
          //               },
          //               "carryOn": {
          //                 "type": "union",
          //                 "discriminator": "type",
          //                 "optional": true,
          //                 "definition": [
          //                   {
          //                     "type": "schemaReference",
          //                     "definition": {
          //                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       "relativePath": "jzodObject"
          //                     },
          //                     "context": {}
          //                   },
          //                   {
          //                     "type": "schemaReference",
          //                     "definition": {
          //                       "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       "relativePath": "jzodUnion"
          //                     },
          //                     "context": {}
          //                   }
          //                 ]
          //               },
          //               "definition": {
          //                 "type": "record",
          //                 "definition": {
          //                   "type": "schemaReference",
          //                   "definition": {
          //                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     "relativePath": "jzodElement"
          //                   },
          //                   "context": {}
          //                 }
          //               }
          //             }
          //           },
          //           {
          //             "type": "object",
          //             "extend": {
          //               "type": "schemaReference",
          //               "definition": {
          //                 "eager": true,
          //                 "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 "relativePath": "jzodBaseObject"
          //               },
          //               "context": {}
          //             },
          //             "definition": {
          //               "type": {
          //                 "type": "literal",
          //                 "definition": "union"
          //               },
          //               "discriminator": {
          //                 "type": "union",
          //                 "optional": true,
          //                 "definition": [
          //                   {
          //                     "type": "string"
          //                   },
          //                   {
          //                     "type": "array",
          //                     "definition": {
          //                       "type": "string"
          //                     }
          //                   }
          //                 ]
          //               },
          //               "discriminatorNew": {
          //                 "type": "union",
          //                 "optional": true,
          //                 "definition": [
          //                   {
          //                     "type": "object",
          //                     "definition": {
          //                       "discriminatorType": {
          //                         "type": "literal",
          //                         "definition": "string"
          //                       },
          //                       "value": {
          //                         "type": "string"
          //                       }
          //                     }
          //                   },
          //                   {
          //                     "type": "object",
          //                     "definition": {
          //                       "discriminatorType": {
          //                         "type": "literal",
          //                         "definition": "array"
          //                       },
          //                       "value": {
          //                         "type": "array",
          //                         "definition": {
          //                           "type": "string"
          //                         }
          //                       }
          //                     }
          //                   }
          //                 ]
          //               },
          //               "carryOn": {
          //                 "optional": true,
          //                 "type": "schemaReference",
          //                 "definition": {
          //                   "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   "relativePath": "jzodObject"
          //                 },
          //                 "context": {}
          //               },
          //               "definition": {
          //                 "type": "array",
          //                 "definition": {
          //                   "type": "schemaReference",
          //                   "definition": {
          //                     "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     "relativePath": "jzodElement"
          //                   },
          //                   "context": {}
          //                 }
          //               }
          //             }
          //           }
          //         ]
          //       },
          //       "definition": {
          //         "type": "record",
          //         "definition": {
          //           "type": "schemaReference",
          //           "definition": {
          //             "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             "relativePath": "jzodElement"
          //           },
          //           "context": {}
          //         }
          //       }
          //     }
          //   },
          // },
          // // ######################################################################################
          // // ######################################################################################
          // // ######################################################################################
          // // ######################################################################################
          // // ######################################################################################
          // // ######################################################################################
          // // unfold schemaReference to jzodElement
          // test400: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "schemaReference",
          //     definition: {
          //       relativePath: "jzodElement",
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //     },
          //     context: {},
          //   },
          //   expectedResult: {
          //     type: "union",
          //     discriminator: "type",
          //     definition: [
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodArray",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodPlainAttribute",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainDateWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainNumberWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainStringWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodEnum",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodFunction",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodLazy",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodLiteral",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodIntersection",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodMap",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodObject",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodPromise",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodRecord",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodReference",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodSet",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodTuple",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodUnion",
          //         },
          //         context: {},
          //       },
          //     ],
          //   },
          // },
          // // unfold definition of jzodElement
          // test410: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "union",
          //     discriminator: "type",
          //     definition: [
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodArray",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodPlainAttribute",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainDateWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainNumberWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainStringWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodEnum",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodFunction",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodLazy",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodLiteral",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodIntersection",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodMap",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodObject",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodPromise",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodRecord",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodReference",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodSet",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodTuple",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodUnion",
          //         },
          //         context: {},
          //       },
          //     ],
          //   },
          //   expectedResult: {
          //     type: "union",
          //     discriminator: "type",
          //     definition: [
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "array",
          //           },
          //           definition: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodElement",
          //             },
          //             context: {},
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "enum",
          //             definition: [
          //               "any",
          //               "bigint",
          //               "boolean",
          //               "never",
          //               "null",
          //               "uuid",
          //               "undefined",
          //               "unknown",
          //               "void",
          //             ],
          //           },
          //           coerce: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "date",
          //           },
          //           coerce: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           validations: {
          //             type: "array",
          //             optional: true,
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodAttributeDateValidations",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "number",
          //           },
          //           coerce: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           validations: {
          //             type: "array",
          //             optional: true,
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodAttributeNumberValidations",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "string",
          //           },
          //           coerce: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           validations: {
          //             type: "array",
          //             optional: true,
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodAttributeStringValidations",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "enum",
          //           },
          //           definition: {
          //             type: "array",
          //             definition: {
          //               type: "string",
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "function",
          //           },
          //           definition: {
          //             type: "object",
          //             definition: {
          //               args: {
          //                 type: "array",
          //                 definition: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodElement",
          //                   },
          //                   context: {},
          //                 },
          //               },
          //               returns: {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodElement",
          //                 },
          //                 optional: true,
          //                 context: {},
          //               },
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "lazy",
          //           },
          //           definition: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodFunction",
          //             },
          //             context: {},
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "literal",
          //           },
          //           definition: {
          //             type: "string",
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "intersection",
          //           },
          //           definition: {
          //             type: "object",
          //             definition: {
          //               left: {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodElement",
          //                 },
          //                 context: {},
          //               },
          //               right: {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodElement",
          //                 },
          //                 context: {},
          //               },
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "map",
          //           },
          //           definition: {
          //             type: "tuple",
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodElement",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodElement",
          //                 },
          //                 context: {},
          //               },
          //             ],
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           extend: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "union",
          //                 optional: true,
          //                 definition: [
          //                   {
          //                     type: "schemaReference",
          //                     definition: {
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       relativePath: "jzodReference",
          //                     },
          //                     context: {},
          //                   },
          //                   {
          //                     type: "schemaReference",
          //                     definition: {
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       relativePath: "jzodObject",
          //                     },
          //                     context: {},
          //                   },
          //                 ],
          //               },
          //               {
          //                 type: "array",
          //                 definition: {
          //                   type: "union",
          //                   optional: true,
          //                   definition: [
          //                     {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodReference",
          //                       },
          //                       context: {},
          //                     },
          //                     {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodObject",
          //                       },
          //                       context: {},
          //                     },
          //                   ],
          //                 },
          //               },
          //             ],
          //           },
          //           type: {
          //             type: "literal",
          //             definition: "object",
          //           },
          //           nonStrict: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           partial: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           carryOn: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodObject",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodUnion",
          //                 },
          //                 context: {},
          //               },
          //             ],
          //           },
          //           definition: {
          //             type: "record",
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodElement",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "promise",
          //           },
          //           definition: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodElement",
          //             },
          //             context: {},
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "record",
          //           },
          //           definition: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodElement",
          //             },
          //             context: {},
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "schemaReference",
          //           },
          //           context: {
          //             type: "record",
          //             optional: true,
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodElement",
          //               },
          //               context: {},
          //             },
          //           },
          //           carryOn: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodObject",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodUnion",
          //                 },
          //                 context: {},
          //               },
          //             ],
          //           },
          //           definition: {
          //             type: "object",
          //             definition: {
          //               eager: {
          //                 type: "boolean",
          //                 optional: true,
          //               },
          //               partial: {
          //                 type: "boolean",
          //                 optional: true,
          //               },
          //               relativePath: {
          //                 type: "string",
          //                 optional: true,
          //               },
          //               absolutePath: {
          //                 type: "string",
          //                 optional: true,
          //               },
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "set",
          //           },
          //           definition: {
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodElement",
          //             },
          //             context: {},
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "tuple",
          //           },
          //           definition: {
          //             type: "array",
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodElement",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //       },
          //       {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           type: {
          //             type: "literal",
          //             definition: "union",
          //           },
          //           discriminator: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "string",
          //               },
          //               {
          //                 type: "array",
          //                 definition: {
          //                   type: "string",
          //                 },
          //               },
          //             ],
          //           },
          //           discriminatorNew: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "object",
          //                 definition: {
          //                   discriminatorType: {
          //                     type: "literal",
          //                     definition: "string",
          //                   },
          //                   value: {
          //                     type: "string",
          //                   },
          //                 },
          //               },
          //               {
          //                 type: "object",
          //                 definition: {
          //                   discriminatorType: {
          //                     type: "literal",
          //                     definition: "array",
          //                   },
          //                   value: {
          //                     type: "array",
          //                     definition: {
          //                       type: "string",
          //                     },
          //                   },
          //                 },
          //               },
          //             ],
          //           },
          //           carryOn: {
          //             optional: true,
          //             type: "schemaReference",
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodObject",
          //             },
          //             context: {},
          //           },
          //           definition: {
          //             type: "array",
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodElement",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //       },
          //     ],
          //   },
          // },
          // // taken from entityDefinitionBook display, that yields (almost?) infinite recursion
          // test420: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "object",
          //     definition: {
          //       uuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 1,
          //             defaultLabel: "Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentName: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 2,
          //             defaultLabel: "Entity Name",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentUuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 3,
          //             defaultLabel: "Entity Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentDefinitionVersionUuid: {
          //         type: "uuid",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 4,
          //             defaultLabel: "Entity Definition Version Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       name: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 5,
          //             defaultLabel: "Name",
          //             editable: false,
          //           },
          //         },
          //       },
          //       entityUuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 6,
          //             defaultLabel:
          //               "Entity Uuid of the Entity which this definition is the definition",
          //             editable: false,
          //           },
          //         },
          //       },
          //       conceptLevel: {
          //         type: "enum",
          //         definition: ["MetaModel", "Model", "Data"],
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 7,
          //             defaultLabel: "Concept Level",
          //             editable: false,
          //           },
          //         },
          //       },
          //       description: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 8,
          //             defaultLabel: "Description",
          //             editable: true,
          //           },
          //         },
          //       },
          //       defaultInstanceDetailsReportUuid: {
          //         type: "uuid",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 9,
          //             defaultLabel: "Default Report used to display instances of this Entity",
          //             editable: false,
          //           },
          //         },
          //       },
          //       viewAttributes: {
          //         type: "array",
          //         optional: true,
          //         definition: {
          //           type: "string",
          //         },
          //         tag: {
          //           value: {
          //             id: 10,
          //             defaultLabel: "Attributes to display by default",
          //             editable: true,
          //           },
          //         },
          //       },
          //       icon: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 11,
          //             defaultLabel: "Icon used to represent instances of this Entity",
          //             editable: true,
          //           },
          //         },
          //       },
          //       jzodSchema: {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           extend: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "union",
          //                 optional: true,
          //                 definition: [
          //                   {
          //                     type: "schemaReference",
          //                     definition: {
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       relativePath: "jzodReference",
          //                     },
          //                     context: {},
          //                   },
          //                   {
          //                     type: "schemaReference",
          //                     definition: {
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       relativePath: "jzodObject",
          //                     },
          //                     context: {},
          //                   },
          //                 ],
          //               },
          //               {
          //                 type: "array",
          //                 definition: {
          //                   type: "union",
          //                   optional: true,
          //                   definition: [
          //                     {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodReference",
          //                       },
          //                       context: {},
          //                     },
          //                     {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodObject",
          //                       },
          //                       context: {},
          //                     },
          //                   ],
          //                 },
          //               },
          //             ],
          //           },
          //           type: {
          //             type: "literal",
          //             definition: "object",
          //           },
          //           nonStrict: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           partial: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           carryOn: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodObject",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodUnion",
          //                 },
          //                 context: {},
          //               },
          //             ],
          //           },
          //           definition: {
          //             type: "record",
          //             definition: {
          //               type: "schemaReference",
          //               definition: {
          //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                 relativePath: "jzodElement",
          //               },
          //               context: {},
          //             },
          //           },
          //         },
          //         tag: {
          //           value: {
          //             id: 12,
          //             defaultLabel: "Jzod Schema",
          //             editable: true,
          //           },
          //         },
          //       },
          //     },
          //   },
          //   expectedResult: {
          //     type: "object",
          //     definition: {
          //       uuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 1,
          //             defaultLabel: "Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentName: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 2,
          //             defaultLabel: "Entity Name",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentUuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 3,
          //             defaultLabel: "Entity Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentDefinitionVersionUuid: {
          //         type: "uuid",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 4,
          //             defaultLabel: "Entity Definition Version Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       name: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 5,
          //             defaultLabel: "Name",
          //             editable: false,
          //           },
          //         },
          //       },
          //       entityUuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 6,
          //             defaultLabel:
          //               "Entity Uuid of the Entity which this definition is the definition",
          //             editable: false,
          //           },
          //         },
          //       },
          //       conceptLevel: {
          //         type: "enum",
          //         definition: ["MetaModel", "Model", "Data"],
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 7,
          //             defaultLabel: "Concept Level",
          //             editable: false,
          //           },
          //         },
          //       },
          //       description: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 8,
          //             defaultLabel: "Description",
          //             editable: true,
          //           },
          //         },
          //       },
          //       defaultInstanceDetailsReportUuid: {
          //         type: "uuid",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 9,
          //             defaultLabel: "Default Report used to display instances of this Entity",
          //             editable: false,
          //           },
          //         },
          //       },
          //       viewAttributes: {
          //         type: "array",
          //         optional: true,
          //         definition: {
          //           type: "string",
          //         },
          //         tag: {
          //           value: {
          //             id: 10,
          //             defaultLabel: "Attributes to display by default",
          //             editable: true,
          //           },
          //         },
          //       },
          //       icon: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 11,
          //             defaultLabel: "Icon used to represent instances of this Entity",
          //             editable: true,
          //           },
          //         },
          //       },
          //       jzodSchema: {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           optional: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           nullable: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           tag: {
          //             type: "object",
          //             optional: true,
          //             definition: {
          //               value: {
          //                 type: "object",
          //                 optional: true,
          //                 definition: {
          //                   id: {
          //                     type: "number",
          //                     optional: true,
          //                   },
          //                   defaultLabel: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   description: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   initializeTo: {
          //                     type: "any",
          //                     optional: true,
          //                   },
          //                   targetEntity: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   targetEntityOrderInstancesBy: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   targetEntityApplicationSection: {
          //                     type: "enum",
          //                     optional: true,
          //                     definition: ["model", "data", "metaModel"],
          //                   },
          //                   editable: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   canBeTemplate: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                 },
          //               },
          //             },
          //           },
          //           extend: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "union",
          //                 optional: true,
          //                 definition: [
          //                   {
          //                     type: "object",
          //                     extend: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         eager: true,
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodBaseObject",
          //                       },
          //                       context: {},
          //                     },
          //                     definition: {
          //                       optional: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       nullable: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       tag: {
          //                         type: "object",
          //                         optional: true,
          //                         definition: {
          //                           value: {
          //                             type: "object",
          //                             optional: true,
          //                             definition: {
          //                               id: {
          //                                 type: "number",
          //                                 optional: true,
          //                               },
          //                               defaultLabel: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               description: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               initializeTo: {
          //                                 type: "any",
          //                                 optional: true,
          //                               },
          //                               targetEntity: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityOrderInstancesBy: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityApplicationSection: {
          //                                 type: "enum",
          //                                 optional: true,
          //                                 definition: ["model", "data", "metaModel"],
          //                               },
          //                               editable: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               canBeTemplate: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                             },
          //                           },
          //                         },
          //                       },
          //                       type: {
          //                         type: "literal",
          //                         definition: "schemaReference",
          //                       },
          //                       context: {
          //                         type: "record",
          //                         optional: true,
          //                         definition: {
          //                           type: "union",
          //                           discriminator: "type",
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodArray",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPlainAttribute",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainDateWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainNumberWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainStringWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodEnum",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodFunction",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLazy",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLiteral",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodIntersection",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodMap",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPromise",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodRecord",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodSet",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodTuple",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                       carryOn: {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               extend: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodReference",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodReference",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "object",
          //                               },
          //                               nonStrict: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               partial: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               carryOn: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodUnion",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                 ],
          //                               },
          //                               definition: {
          //                                 type: "record",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "union",
          //                               },
          //                               discriminator: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "string",
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "string",
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               discriminatorNew: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "string",
          //                                       },
          //                                       value: {
          //                                         type: "string",
          //                                       },
          //                                     },
          //                                   },
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "array",
          //                                       },
          //                                       value: {
          //                                         type: "array",
          //                                         definition: {
          //                                           type: "string",
          //                                         },
          //                                       },
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               carryOn: {
          //                                 optional: true,
          //                                 type: "schemaReference",
          //                                 definition: {
          //                                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   relativePath: "jzodObject",
          //                                 },
          //                                 context: {},
          //                               },
          //                               definition: {
          //                                 type: "array",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                         ],
          //                       },
          //                       definition: {
          //                         type: "object",
          //                         definition: {
          //                           eager: {
          //                             type: "boolean",
          //                             optional: true,
          //                           },
          //                           partial: {
          //                             type: "boolean",
          //                             optional: true,
          //                           },
          //                           relativePath: {
          //                             type: "string",
          //                             optional: true,
          //                           },
          //                           absolutePath: {
          //                             type: "string",
          //                             optional: true,
          //                           },
          //                         },
          //                       },
          //                     },
          //                   },
          //                   {
          //                     type: "object",
          //                     extend: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         eager: true,
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodBaseObject",
          //                       },
          //                       context: {},
          //                     },
          //                     definition: {
          //                       optional: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       nullable: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       tag: {
          //                         type: "object",
          //                         optional: true,
          //                         definition: {
          //                           value: {
          //                             type: "object",
          //                             optional: true,
          //                             definition: {
          //                               id: {
          //                                 type: "number",
          //                                 optional: true,
          //                               },
          //                               defaultLabel: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               description: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               initializeTo: {
          //                                 type: "any",
          //                                 optional: true,
          //                               },
          //                               targetEntity: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityOrderInstancesBy: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityApplicationSection: {
          //                                 type: "enum",
          //                                 optional: true,
          //                                 definition: ["model", "data", "metaModel"],
          //                               },
          //                               editable: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               canBeTemplate: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                             },
          //                           },
          //                         },
          //                       },
          //                       extend: {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "union",
          //                             optional: true,
          //                             definition: [
          //                               {
          //                                 type: "object",
          //                                 extend: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     eager: true,
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodBaseObject",
          //                                   },
          //                                   context: {},
          //                                 },
          //                                 definition: {
          //                                   type: {
          //                                     type: "literal",
          //                                     definition: "schemaReference",
          //                                   },
          //                                   context: {
          //                                     type: "record",
          //                                     optional: true,
          //                                     definition: {
          //                                       type: "schemaReference",
          //                                       definition: {
          //                                         absolutePath:
          //                                           "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         relativePath: "jzodElement",
          //                                       },
          //                                       context: {},
          //                                     },
          //                                   },
          //                                   carryOn: {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodUnion",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   definition: {
          //                                     type: "object",
          //                                     definition: {
          //                                       eager: {
          //                                         type: "boolean",
          //                                         optional: true,
          //                                       },
          //                                       partial: {
          //                                         type: "boolean",
          //                                         optional: true,
          //                                       },
          //                                       relativePath: {
          //                                         type: "string",
          //                                         optional: true,
          //                                       },
          //                                       absolutePath: {
          //                                         type: "string",
          //                                         optional: true,
          //                                       },
          //                                     },
          //                                   },
          //                                 },
          //                               },
          //                               {
          //                                 type: "object",
          //                                 extend: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     eager: true,
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodBaseObject",
          //                                   },
          //                                   context: {},
          //                                 },
          //                                 definition: {
          //                                   extend: {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "union",
          //                                         optional: true,
          //                                         definition: [
          //                                           {
          //                                             type: "schemaReference",
          //                                             definition: {
          //                                               absolutePath:
          //                                                 "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               relativePath: "jzodReference",
          //                                             },
          //                                             context: {},
          //                                           },
          //                                           {
          //                                             type: "schemaReference",
          //                                             definition: {
          //                                               absolutePath:
          //                                                 "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               relativePath: "jzodObject",
          //                                             },
          //                                             context: {},
          //                                           },
          //                                         ],
          //                                       },
          //                                       {
          //                                         type: "array",
          //                                         definition: {
          //                                           type: "union",
          //                                           optional: true,
          //                                           definition: [
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodReference",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodObject",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                           ],
          //                                         },
          //                                       },
          //                                     ],
          //                                   },
          //                                   type: {
          //                                     type: "literal",
          //                                     definition: "object",
          //                                   },
          //                                   nonStrict: {
          //                                     type: "boolean",
          //                                     optional: true,
          //                                   },
          //                                   partial: {
          //                                     type: "boolean",
          //                                     optional: true,
          //                                   },
          //                                   carryOn: {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodUnion",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   definition: {
          //                                     type: "record",
          //                                     definition: {
          //                                       type: "schemaReference",
          //                                       definition: {
          //                                         absolutePath:
          //                                           "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         relativePath: "jzodElement",
          //                                       },
          //                                       context: {},
          //                                     },
          //                                   },
          //                                 },
          //                               },
          //                             ],
          //                           },
          //                           {
          //                             type: "array",
          //                             definition: {
          //                               type: "union",
          //                               optional: true,
          //                               definition: [
          //                                 {
          //                                   type: "object",
          //                                   extend: {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       eager: true,
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodBaseObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   definition: {
          //                                     type: {
          //                                       type: "literal",
          //                                       definition: "schemaReference",
          //                                     },
          //                                     context: {
          //                                       type: "record",
          //                                       optional: true,
          //                                       definition: {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodElement",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     },
          //                                     carryOn: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodUnion",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                     definition: {
          //                                       type: "object",
          //                                       definition: {
          //                                         eager: {
          //                                           type: "boolean",
          //                                           optional: true,
          //                                         },
          //                                         partial: {
          //                                           type: "boolean",
          //                                           optional: true,
          //                                         },
          //                                         relativePath: {
          //                                           type: "string",
          //                                           optional: true,
          //                                         },
          //                                         absolutePath: {
          //                                           type: "string",
          //                                           optional: true,
          //                                         },
          //                                       },
          //                                     },
          //                                   },
          //                                 },
          //                                 {
          //                                   type: "object",
          //                                   extend: {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       eager: true,
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodBaseObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   definition: {
          //                                     extend: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "union",
          //                                           optional: true,
          //                                           definition: [
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodReference",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodObject",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                           ],
          //                                         },
          //                                         {
          //                                           type: "array",
          //                                           definition: {
          //                                             type: "union",
          //                                             optional: true,
          //                                             definition: [
          //                                               {
          //                                                 type: "schemaReference",
          //                                                 definition: {
          //                                                   absolutePath:
          //                                                     "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                   relativePath: "jzodReference",
          //                                                 },
          //                                                 context: {},
          //                                               },
          //                                               {
          //                                                 type: "schemaReference",
          //                                                 definition: {
          //                                                   absolutePath:
          //                                                     "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                   relativePath: "jzodObject",
          //                                                 },
          //                                                 context: {},
          //                                               },
          //                                             ],
          //                                           },
          //                                         },
          //                                       ],
          //                                     },
          //                                     type: {
          //                                       type: "literal",
          //                                       definition: "object",
          //                                     },
          //                                     nonStrict: {
          //                                       type: "boolean",
          //                                       optional: true,
          //                                     },
          //                                     partial: {
          //                                       type: "boolean",
          //                                       optional: true,
          //                                     },
          //                                     carryOn: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodUnion",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                     definition: {
          //                                       type: "record",
          //                                       definition: {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodElement",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     },
          //                                   },
          //                                 },
          //                               ],
          //                             },
          //                           },
          //                         ],
          //                       },
          //                       type: {
          //                         type: "literal",
          //                         definition: "object",
          //                       },
          //                       nonStrict: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       partial: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       carryOn: {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               extend: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodReference",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodReference",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "object",
          //                               },
          //                               nonStrict: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               partial: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               carryOn: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodUnion",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                 ],
          //                               },
          //                               definition: {
          //                                 type: "record",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "union",
          //                               },
          //                               discriminator: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "string",
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "string",
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               discriminatorNew: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "string",
          //                                       },
          //                                       value: {
          //                                         type: "string",
          //                                       },
          //                                     },
          //                                   },
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "array",
          //                                       },
          //                                       value: {
          //                                         type: "array",
          //                                         definition: {
          //                                           type: "string",
          //                                         },
          //                                       },
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               carryOn: {
          //                                 optional: true,
          //                                 type: "schemaReference",
          //                                 definition: {
          //                                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   relativePath: "jzodObject",
          //                                 },
          //                                 context: {},
          //                               },
          //                               definition: {
          //                                 type: "array",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                         ],
          //                       },
          //                       definition: {
          //                         type: "record",
          //                         definition: {
          //                           type: "union",
          //                           discriminator: "type",
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodArray",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPlainAttribute",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainDateWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainNumberWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainStringWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodEnum",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodFunction",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLazy",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLiteral",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodIntersection",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodMap",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPromise",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodRecord",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodSet",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodTuple",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                     },
          //                   },
          //                 ],
          //               },
          //               {
          //                 type: "array",
          //                 definition: {
          //                   type: "union",
          //                   optional: true,
          //                   definition: [
          //                     {
          //                       type: "object",
          //                       extend: {
          //                         type: "schemaReference",
          //                         definition: {
          //                           eager: true,
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodBaseObject",
          //                         },
          //                         context: {},
          //                       },
          //                       definition: {
          //                         type: {
          //                           type: "literal",
          //                           definition: "schemaReference",
          //                         },
          //                         context: {
          //                           type: "record",
          //                           optional: true,
          //                           definition: {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodElement",
          //                             },
          //                             context: {},
          //                           },
          //                         },
          //                         carryOn: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                         definition: {
          //                           type: "object",
          //                           definition: {
          //                             eager: {
          //                               type: "boolean",
          //                               optional: true,
          //                             },
          //                             partial: {
          //                               type: "boolean",
          //                               optional: true,
          //                             },
          //                             relativePath: {
          //                               type: "string",
          //                               optional: true,
          //                             },
          //                             absolutePath: {
          //                               type: "string",
          //                               optional: true,
          //                             },
          //                           },
          //                         },
          //                       },
          //                     },
          //                     {
          //                       type: "object",
          //                       extend: {
          //                         type: "schemaReference",
          //                         definition: {
          //                           eager: true,
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodBaseObject",
          //                         },
          //                         context: {},
          //                       },
          //                       definition: {
          //                         extend: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "union",
          //                               optional: true,
          //                               definition: [
          //                                 {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodReference",
          //                                   },
          //                                   context: {},
          //                                 },
          //                                 {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodObject",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               ],
          //                             },
          //                             {
          //                               type: "array",
          //                               definition: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodReference",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                 ],
          //                               },
          //                             },
          //                           ],
          //                         },
          //                         type: {
          //                           type: "literal",
          //                           definition: "object",
          //                         },
          //                         nonStrict: {
          //                           type: "boolean",
          //                           optional: true,
          //                         },
          //                         partial: {
          //                           type: "boolean",
          //                           optional: true,
          //                         },
          //                         carryOn: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                         definition: {
          //                           type: "record",
          //                           definition: {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodElement",
          //                             },
          //                             context: {},
          //                           },
          //                         },
          //                       },
          //                     },
          //                   ],
          //                 },
          //               },
          //             ],
          //           },
          //           type: {
          //             type: "literal",
          //             definition: "object",
          //           },
          //           nonStrict: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           partial: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           carryOn: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "object",
          //                 extend: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     eager: true,
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodBaseObject",
          //                   },
          //                   context: {},
          //                 },
          //                 definition: {
          //                   extend: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodReference",
          //                             },
          //                             context: {},
          //                           },
          //                           {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodObject",
          //                             },
          //                             context: {},
          //                           },
          //                         ],
          //                       },
          //                       {
          //                         type: "array",
          //                         definition: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   type: {
          //                     type: "literal",
          //                     definition: "object",
          //                   },
          //                   nonStrict: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   partial: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   carryOn: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "schemaReference",
          //                         definition: {
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodObject",
          //                         },
          //                         context: {},
          //                       },
          //                       {
          //                         type: "schemaReference",
          //                         definition: {
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodUnion",
          //                         },
          //                         context: {},
          //                       },
          //                     ],
          //                   },
          //                   definition: {
          //                     type: "record",
          //                     definition: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodElement",
          //                       },
          //                       context: {},
          //                     },
          //                   },
          //                 },
          //               },
          //               {
          //                 type: "object",
          //                 extend: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     eager: true,
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodBaseObject",
          //                   },
          //                   context: {},
          //                 },
          //                 definition: {
          //                   type: {
          //                     type: "literal",
          //                     definition: "union",
          //                   },
          //                   discriminator: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "string",
          //                       },
          //                       {
          //                         type: "array",
          //                         definition: {
          //                           type: "string",
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   discriminatorNew: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "object",
          //                         definition: {
          //                           discriminatorType: {
          //                             type: "literal",
          //                             definition: "string",
          //                           },
          //                           value: {
          //                             type: "string",
          //                           },
          //                         },
          //                       },
          //                       {
          //                         type: "object",
          //                         definition: {
          //                           discriminatorType: {
          //                             type: "literal",
          //                             definition: "array",
          //                           },
          //                           value: {
          //                             type: "array",
          //                             definition: {
          //                               type: "string",
          //                             },
          //                           },
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   carryOn: {
          //                     optional: true,
          //                     type: "schemaReference",
          //                     definition: {
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       relativePath: "jzodObject",
          //                     },
          //                     context: {},
          //                   },
          //                   definition: {
          //                     type: "array",
          //                     definition: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodElement",
          //                       },
          //                       context: {},
          //                     },
          //                   },
          //                 },
          //               },
          //             ],
          //           },
          //           definition: {
          //             type: "record",
          //             definition: {
          //               type: "union",
          //               discriminator: "type",
          //               definition: [
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodArray",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodPlainAttribute",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodAttributePlainDateWithValidations",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodAttributePlainNumberWithValidations",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodAttributePlainStringWithValidations",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodEnum",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodFunction",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodLazy",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodLiteral",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodIntersection",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodMap",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodObject",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodPromise",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodRecord",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodReference",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodSet",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodTuple",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodUnion",
          //                   },
          //                   context: {},
          //                 },
          //               ],
          //             },
          //           },
          //         },
          //         tag: {
          //           value: {
          //             id: 12,
          //             defaultLabel: "Jzod Schema",
          //             editable: true,
          //           },
          //         },
          //       },
          //     },
          //   },
          //   // }
          // },
          // // Simple test to verify circular reference detection works
          // test421: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "schemaReference",
          //     definition: {
          //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //       relativePath: "jzodElement",
          //     },
          //     context: {},
          //   },
          //   expectedResult: {
          //     type: "union",
          //     discriminator: "type",
          //     definition: [
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodArray",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodPlainAttribute",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainDateWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainNumberWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodAttributePlainStringWithValidations",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodEnum",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodFunction",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodLazy",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodLiteral",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodIntersection",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodMap",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodObject",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodPromise",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodRecord",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodReference",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodSet",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodTuple",
          //         },
          //         context: {},
          //       },
          //       {
          //         type: "schemaReference",
          //         definition: {
          //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //           relativePath: "jzodUnion",
          //         },
          //         context: {},
          //       },
          //     ],
          //   },
          // },
          // TransformerDefinition entity definition
          // test430: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "object",
          //     definition: {
          //       uuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 1,
          //             defaultLabel: "Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentName: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 2,
          //             defaultLabel: "Entity Name",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentUuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 3,
          //             defaultLabel: "Entity Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentDefinitionVersionUuid: {
          //         type: "uuid",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 4,
          //             defaultLabel: "Entity Definition Version Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       name: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 5,
          //             defaultLabel: "Name",
          //             editable: true,
          //           },
          //         },
          //       },
          //       defaultLabel: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 6,
          //             defaultLabel: "Default Label",
          //             editable: true,
          //           },
          //         },
          //       },
          //       description: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 7,
          //             defaultLabel: "Description",
          //             editable: true,
          //           },
          //         },
          //       },
          //       transformerInterface: {
          //         type: "object",
          //         definition: {
          //           transformerParameterSchema: {
          //             type: "object",
          //             definition: {
          //               transformerType: {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodLiteral",
          //                 },
          //               },
          //               transformerDefinition: {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodObject",
          //                 },
          //               },
          //             },
          //           },
          //           transformerResultSchema: {
          //             type: "schemaReference",
          //             optional: true,
          //             definition: {
          //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //               relativePath: "jzodElement",
          //             },
          //           },
          //         },
          //       },
          //       transformerImplementation: {
          //         type: "union",
          //         discriminator: "transformerImplementationType",
          //         definition: [
          //           {
          //             type: "object",
          //             definition: {
          //               transformerImplementationType: {
          //                 type: "literal",
          //                 definition: "libraryImplementation",
          //               },
          //               inMemoryImplementationFunctionName: {
          //                 type: "string",
          //               },
          //               sqlImplementationFunctionName: {
          //                 type: "string",
          //                 optional: true,
          //               },
          //             },
          //           },
          //           {
          //             type: "object",
          //             definition: {
          //               transformerImplementationType: {
          //                 type: "literal",
          //                 definition: "transformer",
          //               },
          //               definition: {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "transformerForBuildOrRuntime",
          //                 },
          //               },
          //             },
          //           },
          //         ],
          //       },
          //     },
          //   },
          //   expectedResult: {
          //     type: "object",
          //     definition: {
          //       uuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 1,
          //             defaultLabel: "Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentName: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 2,
          //             defaultLabel: "Entity Name",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentUuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 3,
          //             defaultLabel: "Entity Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       parentDefinitionVersionUuid: {
          //         type: "uuid",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 4,
          //             defaultLabel: "Entity Definition Version Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       name: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 5,
          //             defaultLabel: "Name",
          //             editable: true,
          //           },
          //         },
          //       },
          //       defaultLabel: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 6,
          //             defaultLabel: "Default Label",
          //             editable: true,
          //           },
          //         },
          //       },
          //       description: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 7,
          //             defaultLabel: "Description",
          //             editable: true,
          //           },
          //         },
          //       },
          //       transformerInterface: {
          //         type: "object",
          //         definition: {
          //           transformerParameterSchema: {
          //             type: "object",
          //             definition: {
          //               transformerType: {
          //                 type: "object",
          //                 extend: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     eager: true,
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodBaseObject",
          //                   },
          //                   context: {},
          //                 },
          //                 definition: {
          //                   type: {
          //                     type: "literal",
          //                     definition: "literal",
          //                   },
          //                   definition: {
          //                     type: "string",
          //                   },
          //                 },
          //               },
          //               transformerDefinition: {
          //                 type: "object",
          //                 extend: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     eager: true,
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodBaseObject",
          //                   },
          //                   context: {},
          //                 },
          //                 definition: {
          //                   extend: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodReference",
          //                             },
          //                             context: {},
          //                           },
          //                           {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodObject",
          //                             },
          //                             context: {},
          //                           },
          //                         ],
          //                       },
          //                       {
          //                         type: "array",
          //                         definition: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   type: {
          //                     type: "literal",
          //                     definition: "object",
          //                   },
          //                   nonStrict: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   partial: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   carryOn: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "schemaReference",
          //                         definition: {
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodObject",
          //                         },
          //                         context: {},
          //                       },
          //                       {
          //                         type: "schemaReference",
          //                         definition: {
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodUnion",
          //                         },
          //                         context: {},
          //                       },
          //                     ],
          //                   },
          //                   definition: {
          //                     type: "record",
          //                     definition: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodElement",
          //                       },
          //                       context: {},
          //                     },
          //                   },
          //                 },
          //               },
          //             },
          //           },
          //           transformerResultSchema: {
          //             type: "union",
          //             discriminator: "type",
          //             definition: [
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodArray",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodPlainAttribute",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodAttributePlainDateWithValidations",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodAttributePlainNumberWithValidations",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodAttributePlainStringWithValidations",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodEnum",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodFunction",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodLazy",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodLiteral",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodIntersection",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodMap",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodObject",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodPromise",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodRecord",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodReference",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodSet",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodTuple",
          //                 },
          //                 context: {},
          //               },
          //               {
          //                 type: "schemaReference",
          //                 definition: {
          //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                   relativePath: "jzodUnion",
          //                 },
          //                 context: {},
          //               },
          //             ],
          //             optional: true,
          //           },
          //         },
          //       },
          //       transformerImplementation: {
          //         type: "union",
          //         discriminator: "transformerImplementationType",
          //         definition: [
          //           {
          //             type: "object",
          //             definition: {
          //               transformerImplementationType: {
          //                 type: "literal",
          //                 definition: "libraryImplementation",
          //               },
          //               inMemoryImplementationFunctionName: {
          //                 type: "string",
          //               },
          //               sqlImplementationFunctionName: {
          //                 type: "string",
          //                 optional: true,
          //               },
          //             },
          //           },
          //           {
          //             type: "object",
          //             definition: {
          //               transformerImplementationType: {
          //                 type: "literal",
          //                 definition: "transformer",
          //               },
          //               definition: {
          //                 type: "union",
          //                 discriminator: ["transformerType", "interpolation"],
          //                 definition: [
          //                   {
          //                     type: "schemaReference",
          //                     definition: {
          //                       relativePath: "transformerForBuild",
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     },
          //                     context: {},
          //                   },
          //                   {
          //                     type: "schemaReference",
          //                     definition: {
          //                       relativePath: "transformerForRuntime",
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     },
          //                     context: {},
          //                   },
          //                 ],
          //               },
          //             },
          //           },
          //         ],
          //       },
          //     },
          //   },
          // },
          // TransformerDefinition entity definition?
          // test432: {
          //   miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
          //   testSchema: {
          //     type: "object",
          //     definition: {
          //       transformerType: {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           optional: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           nullable: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           tag: {
          //             type: "object",
          //             optional: true,
          //             definition: {
          //               value: {
          //                 type: "object",
          //                 optional: true,
          //                 definition: {
          //                   id: {
          //                     type: "number",
          //                     optional: true,
          //                   },
          //                   defaultLabel: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   description: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   initializeTo: {
          //                     type: "any",
          //                     optional: true,
          //                   },
          //                   targetEntity: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   targetEntityOrderInstancesBy: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   targetEntityApplicationSection: {
          //                     type: "enum",
          //                     optional: true,
          //                     definition: ["model", "data", "metaModel"],
          //                   },
          //                   editable: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   canBeTemplate: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                 },
          //               },
          //             },
          //           },
          //           type: {
          //             type: "literal",
          //             definition: "literal",
          //           },
          //           definition: {
          //             type: "string",
          //           },
          //         },
          //       },
          //       transformerDefinition: {
          //         type: "object",
          //         extend: {
          //           type: "schemaReference",
          //           definition: {
          //             eager: true,
          //             absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //             relativePath: "jzodBaseObject",
          //           },
          //           context: {},
          //         },
          //         definition: {
          //           optional: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           nullable: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           tag: {
          //             type: "object",
          //             optional: true,
          //             definition: {
          //               value: {
          //                 type: "object",
          //                 optional: true,
          //                 definition: {
          //                   id: {
          //                     type: "number",
          //                     optional: true,
          //                   },
          //                   defaultLabel: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   description: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   initializeTo: {
          //                     type: "any",
          //                     optional: true,
          //                   },
          //                   targetEntity: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   targetEntityOrderInstancesBy: {
          //                     type: "string",
          //                     optional: true,
          //                   },
          //                   targetEntityApplicationSection: {
          //                     type: "enum",
          //                     optional: true,
          //                     definition: ["model", "data", "metaModel"],
          //                   },
          //                   editable: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   canBeTemplate: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                 },
          //               },
          //             },
          //           },
          //           extend: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "union",
          //                 optional: true,
          //                 definition: [
          //                   {
          //                     type: "object",
          //                     extend: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         eager: true,
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodBaseObject",
          //                       },
          //                       context: {},
          //                     },
          //                     definition: {
          //                       optional: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       nullable: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       tag: {
          //                         type: "object",
          //                         optional: true,
          //                         definition: {
          //                           value: {
          //                             type: "object",
          //                             optional: true,
          //                             definition: {
          //                               id: {
          //                                 type: "number",
          //                                 optional: true,
          //                               },
          //                               defaultLabel: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               description: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               initializeTo: {
          //                                 type: "any",
          //                                 optional: true,
          //                               },
          //                               targetEntity: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityOrderInstancesBy: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityApplicationSection: {
          //                                 type: "enum",
          //                                 optional: true,
          //                                 definition: ["model", "data", "metaModel"],
          //                               },
          //                               editable: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               canBeTemplate: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                             },
          //                           },
          //                         },
          //                       },
          //                       type: {
          //                         type: "literal",
          //                         definition: "schemaReference",
          //                       },
          //                       context: {
          //                         type: "record",
          //                         optional: true,
          //                         definition: {
          //                           type: "union",
          //                           discriminator: "type",
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodArray",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPlainAttribute",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainDateWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainNumberWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainStringWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodEnum",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodFunction",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLazy",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLiteral",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodIntersection",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodMap",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPromise",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodRecord",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodSet",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodTuple",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                       carryOn: {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               extend: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodReference",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodReference",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "object",
          //                               },
          //                               nonStrict: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               partial: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               carryOn: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodUnion",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                 ],
          //                               },
          //                               definition: {
          //                                 type: "record",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "union",
          //                               },
          //                               discriminator: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "string",
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "string",
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               discriminatorNew: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "string",
          //                                       },
          //                                       value: {
          //                                         type: "string",
          //                                       },
          //                                     },
          //                                   },
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "array",
          //                                       },
          //                                       value: {
          //                                         type: "array",
          //                                         definition: {
          //                                           type: "string",
          //                                         },
          //                                       },
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               carryOn: {
          //                                 optional: true,
          //                                 type: "schemaReference",
          //                                 definition: {
          //                                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   relativePath: "jzodObject",
          //                                 },
          //                                 context: {},
          //                               },
          //                               definition: {
          //                                 type: "array",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                         ],
          //                       },
          //                       definition: {
          //                         type: "object",
          //                         definition: {
          //                           eager: {
          //                             type: "boolean",
          //                             optional: true,
          //                           },
          //                           partial: {
          //                             type: "boolean",
          //                             optional: true,
          //                           },
          //                           relativePath: {
          //                             type: "string",
          //                             optional: true,
          //                           },
          //                           absolutePath: {
          //                             type: "string",
          //                             optional: true,
          //                           },
          //                         },
          //                       },
          //                     },
          //                   },
          //                   {
          //                     type: "object",
          //                     extend: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         eager: true,
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodBaseObject",
          //                       },
          //                       context: {},
          //                     },
          //                     definition: {
          //                       optional: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       nullable: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       tag: {
          //                         type: "object",
          //                         optional: true,
          //                         definition: {
          //                           value: {
          //                             type: "object",
          //                             optional: true,
          //                             definition: {
          //                               id: {
          //                                 type: "number",
          //                                 optional: true,
          //                               },
          //                               defaultLabel: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               description: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               initializeTo: {
          //                                 type: "any",
          //                                 optional: true,
          //                               },
          //                               targetEntity: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityOrderInstancesBy: {
          //                                 type: "string",
          //                                 optional: true,
          //                               },
          //                               targetEntityApplicationSection: {
          //                                 type: "enum",
          //                                 optional: true,
          //                                 definition: ["model", "data", "metaModel"],
          //                               },
          //                               editable: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               canBeTemplate: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                             },
          //                           },
          //                         },
          //                       },
          //                       extend: {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "union",
          //                             optional: true,
          //                             definition: [
          //                               {
          //                                 type: "object",
          //                                 extend: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     eager: true,
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodBaseObject",
          //                                   },
          //                                   context: {},
          //                                 },
          //                                 definition: {
          //                                   type: {
          //                                     type: "literal",
          //                                     definition: "schemaReference",
          //                                   },
          //                                   context: {
          //                                     type: "record",
          //                                     optional: true,
          //                                     definition: {
          //                                       type: "schemaReference",
          //                                       definition: {
          //                                         absolutePath:
          //                                           "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         relativePath: "jzodElement",
          //                                       },
          //                                       context: {},
          //                                     },
          //                                   },
          //                                   carryOn: {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodUnion",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   definition: {
          //                                     type: "object",
          //                                     definition: {
          //                                       eager: {
          //                                         type: "boolean",
          //                                         optional: true,
          //                                       },
          //                                       partial: {
          //                                         type: "boolean",
          //                                         optional: true,
          //                                       },
          //                                       relativePath: {
          //                                         type: "string",
          //                                         optional: true,
          //                                       },
          //                                       absolutePath: {
          //                                         type: "string",
          //                                         optional: true,
          //                                       },
          //                                     },
          //                                   },
          //                                 },
          //                               },
          //                               {
          //                                 type: "object",
          //                                 extend: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     eager: true,
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodBaseObject",
          //                                   },
          //                                   context: {},
          //                                 },
          //                                 definition: {
          //                                   extend: {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "union",
          //                                         optional: true,
          //                                         definition: [
          //                                           {
          //                                             type: "schemaReference",
          //                                             definition: {
          //                                               absolutePath:
          //                                                 "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               relativePath: "jzodReference",
          //                                             },
          //                                             context: {},
          //                                           },
          //                                           {
          //                                             type: "schemaReference",
          //                                             definition: {
          //                                               absolutePath:
          //                                                 "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                               relativePath: "jzodObject",
          //                                             },
          //                                             context: {},
          //                                           },
          //                                         ],
          //                                       },
          //                                       {
          //                                         type: "array",
          //                                         definition: {
          //                                           type: "union",
          //                                           optional: true,
          //                                           definition: [
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodReference",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodObject",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                           ],
          //                                         },
          //                                       },
          //                                     ],
          //                                   },
          //                                   type: {
          //                                     type: "literal",
          //                                     definition: "object",
          //                                   },
          //                                   nonStrict: {
          //                                     type: "boolean",
          //                                     optional: true,
          //                                   },
          //                                   partial: {
          //                                     type: "boolean",
          //                                     optional: true,
          //                                   },
          //                                   carryOn: {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodUnion",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   definition: {
          //                                     type: "record",
          //                                     definition: {
          //                                       type: "schemaReference",
          //                                       definition: {
          //                                         absolutePath:
          //                                           "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                         relativePath: "jzodElement",
          //                                       },
          //                                       context: {},
          //                                     },
          //                                   },
          //                                 },
          //                               },
          //                             ],
          //                           },
          //                           {
          //                             type: "array",
          //                             definition: {
          //                               type: "union",
          //                               optional: true,
          //                               definition: [
          //                                 {
          //                                   type: "object",
          //                                   extend: {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       eager: true,
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodBaseObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   definition: {
          //                                     type: {
          //                                       type: "literal",
          //                                       definition: "schemaReference",
          //                                     },
          //                                     context: {
          //                                       type: "record",
          //                                       optional: true,
          //                                       definition: {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodElement",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     },
          //                                     carryOn: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodUnion",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                     definition: {
          //                                       type: "object",
          //                                       definition: {
          //                                         eager: {
          //                                           type: "boolean",
          //                                           optional: true,
          //                                         },
          //                                         partial: {
          //                                           type: "boolean",
          //                                           optional: true,
          //                                         },
          //                                         relativePath: {
          //                                           type: "string",
          //                                           optional: true,
          //                                         },
          //                                         absolutePath: {
          //                                           type: "string",
          //                                           optional: true,
          //                                         },
          //                                       },
          //                                     },
          //                                   },
          //                                 },
          //                                 {
          //                                   type: "object",
          //                                   extend: {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       eager: true,
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodBaseObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   definition: {
          //                                     extend: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "union",
          //                                           optional: true,
          //                                           definition: [
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodReference",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                             {
          //                                               type: "schemaReference",
          //                                               definition: {
          //                                                 absolutePath:
          //                                                   "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                 relativePath: "jzodObject",
          //                                               },
          //                                               context: {},
          //                                             },
          //                                           ],
          //                                         },
          //                                         {
          //                                           type: "array",
          //                                           definition: {
          //                                             type: "union",
          //                                             optional: true,
          //                                             definition: [
          //                                               {
          //                                                 type: "schemaReference",
          //                                                 definition: {
          //                                                   absolutePath:
          //                                                     "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                   relativePath: "jzodReference",
          //                                                 },
          //                                                 context: {},
          //                                               },
          //                                               {
          //                                                 type: "schemaReference",
          //                                                 definition: {
          //                                                   absolutePath:
          //                                                     "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                                   relativePath: "jzodObject",
          //                                                 },
          //                                                 context: {},
          //                                               },
          //                                             ],
          //                                           },
          //                                         },
          //                                       ],
          //                                     },
          //                                     type: {
          //                                       type: "literal",
          //                                       definition: "object",
          //                                     },
          //                                     nonStrict: {
          //                                       type: "boolean",
          //                                       optional: true,
          //                                     },
          //                                     partial: {
          //                                       type: "boolean",
          //                                       optional: true,
          //                                     },
          //                                     carryOn: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodUnion",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                     definition: {
          //                                       type: "record",
          //                                       definition: {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodElement",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     },
          //                                   },
          //                                 },
          //                               ],
          //                             },
          //                           },
          //                         ],
          //                       },
          //                       type: {
          //                         type: "literal",
          //                         definition: "object",
          //                       },
          //                       nonStrict: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       partial: {
          //                         type: "boolean",
          //                         optional: true,
          //                       },
          //                       carryOn: {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               extend: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "union",
          //                                     optional: true,
          //                                     definition: [
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodReference",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                       {
          //                                         type: "schemaReference",
          //                                         definition: {
          //                                           absolutePath:
          //                                             "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                           relativePath: "jzodObject",
          //                                         },
          //                                         context: {},
          //                                       },
          //                                     ],
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "union",
          //                                       optional: true,
          //                                       definition: [
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodReference",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                         {
          //                                           type: "schemaReference",
          //                                           definition: {
          //                                             absolutePath:
          //                                               "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                             relativePath: "jzodObject",
          //                                           },
          //                                           context: {},
          //                                         },
          //                                       ],
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "object",
          //                               },
          //                               nonStrict: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               partial: {
          //                                 type: "boolean",
          //                                 optional: true,
          //                               },
          //                               carryOn: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodUnion",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                 ],
          //                               },
          //                               definition: {
          //                                 type: "record",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                           {
          //                             type: "object",
          //                             extend: {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 eager: true,
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodBaseObject",
          //                               },
          //                               context: {},
          //                             },
          //                             definition: {
          //                               type: {
          //                                 type: "literal",
          //                                 definition: "union",
          //                               },
          //                               discriminator: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "string",
          //                                   },
          //                                   {
          //                                     type: "array",
          //                                     definition: {
          //                                       type: "string",
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               discriminatorNew: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "string",
          //                                       },
          //                                       value: {
          //                                         type: "string",
          //                                       },
          //                                     },
          //                                   },
          //                                   {
          //                                     type: "object",
          //                                     definition: {
          //                                       discriminatorType: {
          //                                         type: "literal",
          //                                         definition: "array",
          //                                       },
          //                                       value: {
          //                                         type: "array",
          //                                         definition: {
          //                                           type: "string",
          //                                         },
          //                                       },
          //                                     },
          //                                   },
          //                                 ],
          //                               },
          //                               carryOn: {
          //                                 optional: true,
          //                                 type: "schemaReference",
          //                                 definition: {
          //                                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                   relativePath: "jzodObject",
          //                                 },
          //                                 context: {},
          //                               },
          //                               definition: {
          //                                 type: "array",
          //                                 definition: {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodElement",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               },
          //                             },
          //                           },
          //                         ],
          //                       },
          //                       definition: {
          //                         type: "record",
          //                         definition: {
          //                           type: "union",
          //                           discriminator: "type",
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodArray",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPlainAttribute",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainDateWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainNumberWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodAttributePlainStringWithValidations",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodEnum",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodFunction",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLazy",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodLiteral",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodIntersection",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodMap",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodPromise",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodRecord",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodSet",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodTuple",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                     },
          //                   },
          //                 ],
          //               },
          //               {
          //                 type: "array",
          //                 definition: {
          //                   type: "union",
          //                   optional: true,
          //                   definition: [
          //                     {
          //                       type: "object",
          //                       extend: {
          //                         type: "schemaReference",
          //                         definition: {
          //                           eager: true,
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodBaseObject",
          //                         },
          //                         context: {},
          //                       },
          //                       definition: {
          //                         type: {
          //                           type: "literal",
          //                           definition: "schemaReference",
          //                         },
          //                         context: {
          //                           type: "record",
          //                           optional: true,
          //                           definition: {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodElement",
          //                             },
          //                             context: {},
          //                           },
          //                         },
          //                         carryOn: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                         definition: {
          //                           type: "object",
          //                           definition: {
          //                             eager: {
          //                               type: "boolean",
          //                               optional: true,
          //                             },
          //                             partial: {
          //                               type: "boolean",
          //                               optional: true,
          //                             },
          //                             relativePath: {
          //                               type: "string",
          //                               optional: true,
          //                             },
          //                             absolutePath: {
          //                               type: "string",
          //                               optional: true,
          //                             },
          //                           },
          //                         },
          //                       },
          //                     },
          //                     {
          //                       type: "object",
          //                       extend: {
          //                         type: "schemaReference",
          //                         definition: {
          //                           eager: true,
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodBaseObject",
          //                         },
          //                         context: {},
          //                       },
          //                       definition: {
          //                         extend: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "union",
          //                               optional: true,
          //                               definition: [
          //                                 {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodReference",
          //                                   },
          //                                   context: {},
          //                                 },
          //                                 {
          //                                   type: "schemaReference",
          //                                   definition: {
          //                                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                     relativePath: "jzodObject",
          //                                   },
          //                                   context: {},
          //                                 },
          //                               ],
          //                             },
          //                             {
          //                               type: "array",
          //                               definition: {
          //                                 type: "union",
          //                                 optional: true,
          //                                 definition: [
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodReference",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                   {
          //                                     type: "schemaReference",
          //                                     definition: {
          //                                       absolutePath:
          //                                         "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                       relativePath: "jzodObject",
          //                                     },
          //                                     context: {},
          //                                   },
          //                                 ],
          //                               },
          //                             },
          //                           ],
          //                         },
          //                         type: {
          //                           type: "literal",
          //                           definition: "object",
          //                         },
          //                         nonStrict: {
          //                           type: "boolean",
          //                           optional: true,
          //                         },
          //                         partial: {
          //                           type: "boolean",
          //                           optional: true,
          //                         },
          //                         carryOn: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodUnion",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                         definition: {
          //                           type: "record",
          //                           definition: {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodElement",
          //                             },
          //                             context: {},
          //                           },
          //                         },
          //                       },
          //                     },
          //                   ],
          //                 },
          //               },
          //             ],
          //           },
          //           type: {
          //             type: "literal",
          //             definition: "object",
          //           },
          //           nonStrict: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           partial: {
          //             type: "boolean",
          //             optional: true,
          //           },
          //           carryOn: {
          //             type: "union",
          //             optional: true,
          //             definition: [
          //               {
          //                 type: "object",
          //                 extend: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     eager: true,
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodBaseObject",
          //                   },
          //                   context: {},
          //                 },
          //                 definition: {
          //                   extend: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "union",
          //                         optional: true,
          //                         definition: [
          //                           {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodReference",
          //                             },
          //                             context: {},
          //                           },
          //                           {
          //                             type: "schemaReference",
          //                             definition: {
          //                               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                               relativePath: "jzodObject",
          //                             },
          //                             context: {},
          //                           },
          //                         ],
          //                       },
          //                       {
          //                         type: "array",
          //                         definition: {
          //                           type: "union",
          //                           optional: true,
          //                           definition: [
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodReference",
          //                               },
          //                               context: {},
          //                             },
          //                             {
          //                               type: "schemaReference",
          //                               definition: {
          //                                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                                 relativePath: "jzodObject",
          //                               },
          //                               context: {},
          //                             },
          //                           ],
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   type: {
          //                     type: "literal",
          //                     definition: "object",
          //                   },
          //                   nonStrict: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   partial: {
          //                     type: "boolean",
          //                     optional: true,
          //                   },
          //                   carryOn: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "schemaReference",
          //                         definition: {
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodObject",
          //                         },
          //                         context: {},
          //                       },
          //                       {
          //                         type: "schemaReference",
          //                         definition: {
          //                           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                           relativePath: "jzodUnion",
          //                         },
          //                         context: {},
          //                       },
          //                     ],
          //                   },
          //                   definition: {
          //                     type: "record",
          //                     definition: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodElement",
          //                       },
          //                       context: {},
          //                     },
          //                   },
          //                 },
          //               },
          //               {
          //                 type: "object",
          //                 extend: {
          //                   type: "schemaReference",
          //                   definition: {
          //                     eager: true,
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodBaseObject",
          //                   },
          //                   context: {},
          //                 },
          //                 definition: {
          //                   type: {
          //                     type: "literal",
          //                     definition: "union",
          //                   },
          //                   discriminator: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "string",
          //                       },
          //                       {
          //                         type: "array",
          //                         definition: {
          //                           type: "string",
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   discriminatorNew: {
          //                     type: "union",
          //                     optional: true,
          //                     definition: [
          //                       {
          //                         type: "object",
          //                         definition: {
          //                           discriminatorType: {
          //                             type: "literal",
          //                             definition: "string",
          //                           },
          //                           value: {
          //                             type: "string",
          //                           },
          //                         },
          //                       },
          //                       {
          //                         type: "object",
          //                         definition: {
          //                           discriminatorType: {
          //                             type: "literal",
          //                             definition: "array",
          //                           },
          //                           value: {
          //                             type: "array",
          //                             definition: {
          //                               type: "string",
          //                             },
          //                           },
          //                         },
          //                       },
          //                     ],
          //                   },
          //                   carryOn: {
          //                     optional: true,
          //                     type: "schemaReference",
          //                     definition: {
          //                       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                       relativePath: "jzodObject",
          //                     },
          //                     context: {},
          //                   },
          //                   definition: {
          //                     type: "array",
          //                     definition: {
          //                       type: "schemaReference",
          //                       definition: {
          //                         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                         relativePath: "jzodElement",
          //                       },
          //                       context: {},
          //                     },
          //                   },
          //                 },
          //               },
          //             ],
          //           },
          //           definition: {
          //             type: "record",
          //             definition: {
          //               type: "union",
          //               discriminator: "type",
          //               definition: [
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodArray",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodPlainAttribute",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodAttributePlainDateWithValidations",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodAttributePlainNumberWithValidations",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodAttributePlainStringWithValidations",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodEnum",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodFunction",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodLazy",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodLiteral",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodIntersection",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodMap",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodObject",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodPromise",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodRecord",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodReference",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodSet",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodTuple",
          //                   },
          //                   context: {},
          //                 },
          //                 {
          //                   type: "schemaReference",
          //                   definition: {
          //                     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          //                     relativePath: "jzodUnion",
          //                   },
          //                   context: {},
          //                 },
          //               ],
          //             },
          //           },
          //         },
          //       },
          //     },
          //   },
          //   expectedResult: {
          //     type: "object",
          //     definition: {
          //       uuid: {
          //         type: "uuid",
          //         tag: {
          //           value: {
          //             id: 1,
          //             defaultLabel: "Uuid",
          //             editable: false,
          //           },
          //         },
          //       },
          //       name: {
          //         type: "string",
          //         tag: {
          //           value: {
          //             id: 2,
          //             defaultLabel: "Name",
          //             editable: true,
          //           },
          //         },
          //       },
          //       description: {
          //         type: "string",
          //         optional: true,
          //         tag: {
          //           value: {
          //             id: 3,
          //             defaultLabel: "Description",
          //             editable: true,
          //           },
          //         },
          //       },
          //     },
          //   },
          // },
        };

        for (const test of Object.entries(tests)) {
          testResolve(test[0], test[1].miroirFundamentalJzodSchema, test[1].testSchema, test[1].expectedResult);
          
        }
      }
    )
  }
)
