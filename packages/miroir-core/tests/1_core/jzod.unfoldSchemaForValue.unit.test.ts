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
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirModel } from "../../src/0_interfaces/1_core/Model";

import { resolveReferencesForJzodSchemaAndValueObject } from "../../src/1_core/jzod/JzodUnfoldSchemaForValue";

import entitySelfApplication from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entitySelfApplicationDeploymentConfiguration from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entitySelfApplicationModelBranch from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
import entitySelfApplicationVersion from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityApplicationVersionCrossEntityDeployment from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/8bec933d-6287-4de7-8a88-5c24216de9f4.json';
import entityCommit from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/73bb0c69-e636-4e3b-a230-51f25469c089.json';
import entityEndpointVersion from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3d8da4d4-8f76-4bb4-9212-14869d81c00c.json';
import entityEntity from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityJzodSchema from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json';
import entityMenu from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json';
import entityReport from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityStoreBasedConfiguration from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityQueryVersion from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e4320b9e-ab45-4abe-85d8-359604b3c62f.json';

import entityDefinitionAdminApplication from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json";
import entityDefinitionSelfApplication from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionSelfApplicationDeploymentConfiguration from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionSelfApplicationVersion from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionApplicationVersionCrossEntityDeployment from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c0b71083-8cc8-43db-bf52-572f1f03bbb5.json';
import entityDefinitionSelfApplicationModelBranch from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import entityDefinitionCommit from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json';
import entityDefinitionEndpoint from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json';
import entityDefinitionEntityDefinition from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionEntity from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionJzodSchema from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json';
import entityDefinitionMenu from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json';
import entityDefinitionReport from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
import entityDefinitionStoreBasedConfiguration from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';
import entityDefinitionQuery from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json';

import reportApplicationList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportApplicationDeploymentConfigurationList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportApplicationModelBranchList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportApplicationVersionList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import reportCommitList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7947ae40-eb34-4149-887b-15a9021e714e.json';
import reportConfigurationList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportJzodSchemaList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8b22e84e-9374-4121-b2a7-d13d947a0ba2.json';
import reportEndpointVersionList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ace3d5c9-b6a7-43e6-a277-595329e7532a.json';
import reportEntityList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportEntityDefinitionList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import reportReportList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';
import reportMenuList from '../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ecfd8787-09cc-417d-8d2c-173633c9f998.json';
// import reportQueryVersionList from '../../src/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7aed09a9-8a2d-4437-95ab-62966e38352c.json';

import queryVersionBundleProducerV1 from '../../src/assets/miroir_data/e4320b9e-ab45-4abe-85d8-359604b3c62f/e8c15587-af5d-4c08-b5b7-22f959447690.json';

import applicationEndpointV1 from '../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ddd9c928-2ceb-4f67-971b-5898090412d6.json';
import deploymentEndpointV1 from '../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json';
import instanceEndpointV1 from '../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json';
import modelEndpointV1 from '../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json';

import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/17adb534-1dcb-4874-a4ef-6c1e03b31c4e.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/48644159-66d4-426d-b38d-d083fd455e7b.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/4aaba993-f0a1-4a26-b1ea-13b0ad532685.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/9086f49a-0e81-4902-81f3-560186dee334.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ba38669e-ac6f-40ea-af14-bb200db251d8.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/dc47438c-166a-4d19-aeba-ad70281afdf4.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionReport from '../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ede7e794-5ae7-48a8-81c9-d1f82df11829.json';
import selfApplicationVersionInitialMiroirVersion from '../../src/assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import jzodSchemajzodMiroirBootstrapSchema from "../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import transformerJzodSchema from "../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json";
import instanceConfigurationReference from '../../src/assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import menuDefaultMiroir from '../../src/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json';



import entityDefinitionBundleV1 from "../../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json";
// import entityDefinitionCommit from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json";
import modelEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json";
import storeManagementEndpoint from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json";
import instanceEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json";
import undoRedoEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json";
import localCacheEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json";
import domainEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json";
import queryEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json";
import persistenceEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json";
import testEndpointVersionV1 from "../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json";
// import jzodSchemajzodMiroirBootstrapSchema from "../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import entityDefinitionSelfApplicationV1 from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json";
import entityDefinitionSelfApplicationVersionV1 from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json";
// import entityDefinitionEntity from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";
import entityDefinitionEntityDefinitionV1 from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import entityDefinitionJzodSchemaV1 from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json";
// import entityDefinitionMenu  from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json";
import entityDefinitionQueryVersionV1 from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json";
import entityDefinitionReportV1 from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json";
import entityDefinitionTest from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json';
import entityDefinitionTransformerDefinition from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json";


// import entityDefinitionDeployment from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import entityDefinitionDeployment from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import transformerMenuV1 from "../../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json";

import { getMiroirFundamentalJzodSchema, miroirFundamentalJzodSchemaUuid } from "../../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema";
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
  jzodSchemas: [jzodSchemajzodMiroirBootstrapSchema as JzodSchema],
  menus: [menuDefaultMiroir as Menu],
  applicationVersions: [selfApplicationVersionInitialMiroirVersion],
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
  ],
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################


function testResolve(
  testId: string,
  miroirFundamentalJzodSchema: JzodSchema,
  testSchema: JzodElement,
  testValueObject: any,
  expectedResult: JzodElement
) {
  console.log("######################################### running test", testId, "...");
  const testResult = resolveReferencesForJzodSchemaAndValueObject(
    miroirFundamentalJzodSchema,
    testSchema,
    testValueObject,
    defaultMiroirMetaModel,
    defaultMiroirMetaModel,
    {}
  );
  if (testResult.status == "ok") {
    expect(testResult.status).toEqual("ok");
    console.log("test", testId, "has result", JSON.stringify(testResult.element, null, 2));
    expect(testResult.element).toEqual(expectedResult);
  } else {
    console.log("test", testId, "failed with error", testResult.error);
    expect(testResult.status).toEqual("ok");
  }
}

interface testFormat {
  // testId: string,
  miroirFundamentalJzodSchema: JzodSchema,
  testSchema: JzodElement;
  testValueObject: any;
  expectedResult: JzodElement;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe("jzod.unfoldSchemaForValue", () => {
  // ###########################################################################################
  it("miroir entity definition object format", () => {
    // const miroirFundamentalJzodSchema: JzodSchema = getMiroirFundamentalJzodSchema(
    const miroirFundamentalJzodSchema: any = getMiroirFundamentalJzodSchema(
      entityDefinitionBundleV1 as EntityDefinition,
      entityDefinitionCommit as EntityDefinition,
      modelEndpointV1,
      storeManagementEndpoint,
      instanceEndpointVersionV1,
      undoRedoEndpointVersionV1,
      localCacheEndpointVersionV1,
      domainEndpointVersionV1,
      queryEndpointVersionV1,
      persistenceEndpointVersionV1,
      testEndpointVersionV1,
      jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
      transformerJzodSchema as JzodSchema,
      [transformerMenuV1],
      entityDefinitionAdminApplication as EntityDefinition,
      entityDefinitionSelfApplication as EntityDefinition,
      entityDefinitionSelfApplicationVersion as EntityDefinition,
      entityDefinitionDeployment as EntityDefinition,
      entityDefinitionEntity as EntityDefinition,
      entityDefinitionEntityDefinition as EntityDefinition,
      entityDefinitionJzodSchema as EntityDefinition,
      entityDefinitionMenu as EntityDefinition,
      entityDefinitionQueryVersionV1 as EntityDefinition,
      entityDefinitionReport as EntityDefinition,
      entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition,
      entityDefinitionTest as EntityDefinition,
      entityDefinitionTransformerDefinition as EntityDefinition,
      // jzodSchemajzodMiroirBootstrapSchema as any,
    );
    console.log(expect.getState().currentTestName, "called getMiroirFundamentalJzodSchema");

    const tests: { [k: string]: testFormat } = {
      // plain literal!
      test010: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "literal",
          definition: "myLiteral",
        },
        expectedResult: {
          type: "literal",
          definition: "myLiteral",
        },
        testValueObject: "myLiteral",
      },
      // simpleType
      test020: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "string",
        },
        expectedResult: {
          type: "string",
        },
        testValueObject: "myString",
      },
      // schemaReference (plain, simpleType, non-recursive)
      test030: {
        miroirFundamentalJzodSchema,
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
        testValueObject: "myString",
      },
      // schemaReference: object, recursive, 1-level valueObject
      test040: {
        miroirFundamentalJzodSchema,
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
              type: "string",
            },
          },
        },
        testValueObject: { a: "myString" },
      },
      // schemaReference: object, recursive, 2-level valueObject
      test050: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          context: {
            myObject: {
              type: "object",
              definition: {
                a: {
                  type: "union",
                  discriminator: "type",
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
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          },
        },
        testValueObject: { a: { a: "myString" } },
      },
      // schemaReference: object, recursive, 3-level valueObject
      test060: {
        miroirFundamentalJzodSchema,
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
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    a: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
        testValueObject: { a: { a: { a: "myString" } } },
      },
      // schemaReference: record of recursive object, with 2-level valueObject
      test070: {
        miroirFundamentalJzodSchema,
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
            myRecord: {
              type: "record",
              definition: {
                type: "schemaReference",
                definition: { relativePath: "myObject" },
              },
            },
          },
          definition: { relativePath: "myRecord" },
        },
        expectedResult: {
          type: "object",
          definition: {
            r1: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    a: {
                      type: "string",
                    },
                  },
                },
              },
            },
            r2: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          },
        },
        testValueObject: { r1: { a: { a: "myString" } }, r2: { a: "myString" } },
      },
      // result must be identical to test70, but this time the schemaReference is places inside the record, not the other way around
      test080: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "record",
          definition: {
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
        },
        expectedResult: {
          type: "object",
          definition: {
            r1: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    a: {
                      type: "string",
                    },
                  },
                },
              },
            },
            r2: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
          },
        },
        testValueObject: { r1: { a: { a: "myString" } }, r2: { a: "myString" } },
      },
      // array of simpleType
      test090: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "array",
          definition: {
            type: "string",
          },
        },
        expectedResult: {
          type: "array",
          definition: {
            type: "string",
          },
        },
        testValueObject: ["1", "2", "3"],
      },
      // array of schemaReference / object
      test100: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "array",
          definition: {
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
        },
        expectedResult: {
          type: "array",
          definition: {
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
          // "type": "array",
          // "definition": {
          //   "type": "object",
          //   "definition": {
          //     "a": {
          //       "type": "string"
          //     }
          //   }
          // }
        },
        testValueObject: [
          { a: "myString" },
          // { a: { a: "myString" } }
        ],
      },
      // TODO: array of union Type
      // array of schemaReference / object
      test120: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          context: {
            myObjectRoot: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
              },
            },
            myObject: {
              type: "object",
              extend: {
                type: "schemaReference",
                definition: {
                  relativePath: "myObjectRoot",
                },
              },
              definition: {
                b: {
                  type: "string",
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
              type: "string",
            },
            b: {
              type: "string",
            },
          },
        },
        testValueObject: { a: "myString", b: "anotherString" },
      },
      // JzodSchema: literal
      test500: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "jzodElement",
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "literal",
            },
            definition: {
              type: "string",
            },
          },
        },
        testValueObject: { type: "literal", definition: "myLiteral" },
      },
      // JzodSchema: string
      test510: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "jzodElement",
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "string",
            },
          },
        },
        testValueObject: { type: "string" },
      },
      // JzodSchema: object, simpleType attributes
      test520: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "jzodElement",
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "object",
            },
            definition: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "string",
                    },
                  },
                },
              },
            },
          },
        },
        testValueObject: { type: "object", definition: { a: { type: "string" } } },
      },
      // JzodSchema: schema reference with simple attribute
      test530: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "jzodElement",
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "schemaReference",
            },
            definition: {
              type: "object",
              definition: {
                absolutePath: {
                  type: "string",
                  optional: true,
                },
                relativePath: {
                  type: "string",
                  optional: true,
                },
              },
            },
          },
        },
        testValueObject: {
          type: "schemaReference",
          definition: { absolutePath: miroirFundamentalJzodSchemaUuid, relativePath: "jzodElement" },
        },
      },
      // JzodSchema: schema reference for object with extend clause
      test540: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "jzodElement",
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "schemaReference",
            },
            context: {
              type: "object",
              definition: {
                a: {
                  type: "object",
                  definition: {
                    type: {
                      type: "literal",
                      definition: "string",
                    },
                  },
                },
              },
            },
            definition: {
              type: "object",
              definition: {
                relativePath: {
                  type: "string",
                  optional: true,
                },
              },
            },
          },
        },
        testValueObject: {
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
      },
      //
      // based on "real" cases
      test900: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "object",
          definition: {
            uuid: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Uuid",
                  editable: false,
                },
              },
            },
            parentName: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 2,
                  defaultLabel: "Entity Name",
                  editable: false,
                },
              },
            },
            parentUuid: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 3,
                  defaultLabel: "Entity Uuid",
                  editable: false,
                },
              },
            },
            name: {
              type: "string",
              tag: {
                value: {
                  id: 4,
                  defaultLabel: "Name",
                  editable: true,
                },
              },
            },
            author: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              optional: true,
              tag: {
                value: {
                  id: 5,
                  defaultLabel: "Author",
                  targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                  editable: true,
                },
              },
            },
            publisher: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              optional: true,
              tag: {
                value: {
                  id: 5,
                  defaultLabel: "Publisher",
                  targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
                  editable: true,
                },
              },
            },
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            uuid: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 1,
                  defaultLabel: "Uuid",
                  editable: false,
                },
              },
            },
            parentName: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 2,
                  defaultLabel: "Entity Name",
                  editable: false,
                },
              },
            },
            parentUuid: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              tag: {
                value: {
                  id: 3,
                  defaultLabel: "Entity Uuid",
                  editable: false,
                },
              },
            },
            name: {
              type: "string",
              tag: {
                value: {
                  id: 4,
                  defaultLabel: "Name",
                  editable: true,
                },
              },
            },
            author: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              optional: true,
              tag: {
                value: {
                  id: 5,
                  defaultLabel: "Author",
                  targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                  editable: true,
                },
              },
            },
            publisher: {
              type: "string",
              validations: [
                {
                  type: "uuid",
                },
              ],
              optional: true,
              tag: {
                value: {
                  id: 5,
                  defaultLabel: "Publisher",
                  targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
                  editable: true,
                },
              },
            },
          },
        },
        testValueObject: {
          uuid: "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          name: "Renata n'importe quoi",
          author: "e4376314-d197-457c-aa5e-d2da5f8d5977",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
        },
      },
      // based on "real" cases
      test910: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          context: {
            menuItem: {
              type: "object",
              definition: {
                label: {
                  type: "string",
                },
                section: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "applicationSection",
                  },
                },
                selfApplication: {
                  type: "string",
                  validations: [
                    {
                      type: "uuid",
                    },
                  ],
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                },
                reportUuid: {
                  type: "string",
                  validations: [
                    {
                      type: "uuid",
                    },
                  ],
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                },
                instanceUuid: {
                  type: "string",
                  optional: true,
                  validations: [
                    {
                      type: "uuid",
                    },
                  ],
                  tag: {
                    value: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                },
                icon: {
                  type: "string",
                  validations: [
                    {
                      type: "uuid",
                    },
                  ],
                },
              },
            },
            menuItemArray: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  relativePath: "menuItem",
                },
              },
            },
            sectionOfMenu: {
              type: "object",
              definition: {
                title: {
                  type: "string",
                },
                label: {
                  type: "string",
                },
                items: {
                  type: "schemaReference",
                  definition: {
                    relativePath: "menuItemArray",
                  },
                },
              },
            },
            simpleMenu: {
              type: "object",
              definition: {
                menuType: {
                  type: "literal",
                  definition: "simpleMenu",
                },
                definition: {
                  type: "schemaReference",
                  definition: {
                    relativePath: "menuItemArray",
                  },
                },
              },
            },
            complexMenu: {
              type: "object",
              definition: {
                menuType: {
                  type: "literal",
                  definition: "complexMenu",
                },
                definition: {
                  type: "array",
                  definition: {
                    type: "schemaReference",
                    definition: {
                      relativePath: "sectionOfMenu",
                    },
                  },
                },
              },
            },
            menuDefinition: {
              type: "union",
              discriminator: "menuType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "simpleMenu",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "complexMenu",
                  },
                },
              ],
            },
          },
          definition: {
            relativePath: "menuDefinition",
          },
        },
        expectedResult: {
          type: "object",
          definition: {
            menuType: {
              type: "literal",
              definition: "complexMenu",
            },
            definition: {
              type: "array",
              definition: {
                type: "object",
                definition: {
                  title: {
                    type: "string",
                  },
                  label: {
                    type: "string",
                  },
                  items: {
                    type: "schemaReference",
                    definition: {
                      relativePath: "menuItemArray",
                    },
                  },
                  // {
                  //   type: "array",
                  //   definition: {
                  //     type: "object",
                  //     definition: {
                  //       label: {
                  //         type: "string",
                  //       },
                  //       section: {
                  //         type: "literal",
                  //         definition: "model",
                  //       },
                  //       selfApplication: {
                  //         type: "string",
                  //         validations: [
                  //           {
                  //             type: "uuid",
                  //           },
                  //         ],
                  //         tag: {
                  //           id: 1,
                  //           defaultLabel: "Uuid",
                  //           editable: false,
                  //         },
                  //       },
                  //       reportUuid: {
                  //         type: "string",
                  //         validations: [
                  //           {
                  //             type: "uuid",
                  //           },
                  //         ],
                  //         tag: {
                  //           id: 1,
                  //           defaultLabel: "Uuid",
                  //           editable: false,
                  //         },
                  //       },
                  //       icon: {
                  //         type: "string",
                  //         validations: [
                  //           {
                  //             type: "uuid",
                  //           },
                  //         ],
                  //       },
                  //     },
                  //   },
                  // },
                },
              },
            },
          },
        },
        testValueObject: {
          menuType: "complexMenu",
          definition: [
            {
              title: "Miroir",
              label: "miroir",
              items: [
                {
                  label: "Miroir Entities",
                  section: "model",
                  selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                  reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                  icon: "category",
                },
                {
                  label: "Miroir Entity Definitions",
                  section: "model",
                  selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                  reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                  icon: "category",
                },
                {
                  label: "Miroir Reports",
                  section: "data",
                  selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                  reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                  icon: "list",
                },
                {
                  label: "Miroir Menus",
                  section: "data",
                  selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                  reportUuid: "ecfd8787-09cc-417d-8d2c-173633c9f998",
                  icon: "list",
                },
              ],
            },
            {
              title: "Library",
              label: "library",
              items: [
                {
                  label: "Library Entities",
                  section: "model",
                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                  reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                  icon: "category",
                },
                {
                  label: "Library Entity Definitions",
                  section: "model",
                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                  reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                  icon: "category",
                },
                {
                  label: "Library Tests",
                  section: "data",
                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                  reportUuid: "931dd036-dfce-4e47-868e-36dba3654816",
                  icon: "category",
                },
                {
                  label: "Library Books",
                  section: "data",
                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                  reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
                  icon: "auto_stories",
                },
                {
                  label: "Library Authors",
                  section: "data",
                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                  reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
                  icon: "star",
                },
                {
                  label: "Library Publishers",
                  section: "data",
                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                  reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
                  icon: "account_balance",
                },
              ],
            },
          ],
        },
      },
      // based on "real" cases
      test920: {
        miroirFundamentalJzodSchema,
        testSchema: {
          type: "schemaReference",
          context: {
            applicationSection: {
              type: "union",
              definition: [
                {
                  type: "literal",
                  definition: "model",
                },
                {
                  type: "literal",
                  definition: "data",
                },
              ],
            },
            transformer_constantUuid: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "constantUuid",
                },
                value: {
                  type: "string",
                },
              },
            },
            transformer_constantString: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "constantString",
                },
                value: {
                  type: "string",
                },
              },
            },
            transformer_newUuid: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "newUuid",
                },
              },
            },
            transformerForRuntime_contextReference: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "contextReference",
                },
                referenceName: {
                  optional: true,
                  type: "string",
                },
                referencePath: {
                  optional: true,
                  type: "array",
                  definition: {
                    type: "string",
                  },
                },
              },
            },
            transformer_parameterReference: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "parameterReference",
                },
                referenceName: {
                  optional: true,
                  type: "string",
                },
                referencePath: {
                  optional: true,
                  type: "array",
                  definition: {
                    type: "string",
                  },
                },
              },
            },
            transformer_contextOrParameterReferenceTO_REMOVE: {
              type: "union",
              discriminator: "transformerType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformerForRuntime_contextReference",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformer_parameterReference",
                  },
                },
              ],
            },
            transformer_InnerReference: {
              type: "union",
              discriminator: "transformerType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformer_constantUuid",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformer_constantString",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformer_newUuid",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformer_contextOrParameterReferenceTO_REMOVE",
                  },
                },
              ],
            },
            extractorTemplateRoot: {
              type: "object",
              definition: {
                label: {
                  type: "string",
                  optional: true,
                  tag: { value: { id: 1, defaultLabel: "Label", editable: false } },
                },
                applicationSection: {
                  type: "schemaReference",
                  optional: true,
                  tag: { value: { id: 2, defaultLabel: "Parent Uuid", editable: false } },
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "applicationSection",
                  },
                },
                parentName: {
                  type: "string",
                  optional: true,
                  tag: { value: { id: 3, defaultLabel: "Parent Name", editable: false } },
                },
                parentUuid: {
                  type: "schemaReference",
                  tag: { value: { id: 4, defaultLabel: "Parent Uuid", editable: false } },
                  definition: {
                    relativePath: "transformer_InnerReference",
                  },
                },
              },
            },
            extractorTemplateExtractorForObjectByDirectReference: {
              type: "object",
              extend: {
                type: "schemaReference",
                definition: {
                  eager: true,
                  relativePath: "extractorTemplateRoot",
                },
              },
              definition: {
                extractorOrCombinerType: {
                  type: "literal",
                  definition: "extractorForObjectByDirectReference",
                },
                instanceUuid: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: miroirFundamentalJzodSchemaUuid,
                    relativePath: "transformer_InnerReference",
                  },
                },
              },
            },
            extractorTemplateForObjectListByEntity: {
              type: "object",
              extend: {
                type: "schemaReference",
                definition: {
                  eager: true,
                  relativePath: "extractorTemplateRoot",
                },
              },
              definition: {
                extractorOrCombinerType: {
                  type: "literal",
                  definition: "extractorTemplateForObjectListByEntity",
                },
                filter: {
                  type: "object",
                  optional: true,
                  definition: {
                    attributeName: {
                      type: "string",
                    },
                    value: {
                      type: "schemaReference",
                      definition: {
                        relativePath: "transformer_constantString",
                      },
                    },
                  },
                },
              },
            },
            extractorTemplateByExtractorWrapperReturningObject: {
              type: "union",
              discriminator: "extractorOrCombinerType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "extractorTemplateExtractorForObjectByDirectReference",
                  },
                },
                {
                  type: "object",
                  definition: {
                    extractorOrCombinerType: {
                      type: "literal",
                      definition: "extractorWrapperReturningObject",
                    },
                    definition: {
                      type: "record",
                      definition: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "extractorTemplateByExtractorWrapperReturningObject",
                        },
                      },
                    },
                  },
                },
              ],
            },
            extractorTemplateByExtractorWrapperReturningList: {
              type: "union",
              discriminator: "extractorOrCombinerType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "extractorTemplateForObjectListByEntity",
                  },
                },
                {
                  type: "object",
                  definition: {
                    extractorOrCombinerType: {
                      type: "literal",
                      definition: "extractorWrapperReturningList",
                    },
                    definition: {
                      type: "array",
                      definition: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "extractorTemplateByExtractorWrapperReturningList",
                        },
                      },
                    },
                  },
                },
              ],
            },
            extractorTemplateByExtractorWrapper: {
              type: "union",
              discriminator: "extractorOrCombinerType",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "extractorTemplateByExtractorWrapperReturningObject",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "extractorTemplateByExtractorWrapperReturningList",
                  },
                },
              ],
            },
          },
          definition: {
            relativePath: "extractorTemplateByExtractorWrapper",
          },
        },
        expectedResult: { // TODO: missing alternate possible union branches in parentUuid, instanceUuid?
          type: "object",
          definition: {
            extractorOrCombinerType: {
              type: "literal",
              definition: "extractorForObjectByDirectReference",
            },
            parentName: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 3,
                  defaultLabel: "Parent Name",
                  editable: false,
                },
              },
            },
            parentUuid: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "constantUuid",
                },
                value: {
                  type: "string",
                },
              },
            },
            instanceUuid: {
              type: "object",
              definition: {
                transformerType: {
                  type: "literal",
                  definition: "parameterReference",
                },
                referenceName: {
                  optional: true,
                  type: "string",
                },
              },
            },
          },
        },
        testValueObject: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Report",
          parentUuid: {
            transformerType: "constantUuid",
            value: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          },
          instanceUuid: {
            transformerType: "parameterReference",
            referenceName: "instanceUuid",
          },
        },
      },

    };

    for (const test of Object.entries(tests)) {
      testResolve(
        test[0],
        test[1].miroirFundamentalJzodSchema,
        test[1].testSchema,
        test[1].testValueObject,
        test[1].expectedResult
      );
    }
  });
});
