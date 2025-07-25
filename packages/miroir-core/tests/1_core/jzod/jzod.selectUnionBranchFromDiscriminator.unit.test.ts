import { describe, expect, it } from 'vitest';
import { Entity, EntityDefinition, JzodElement, JzodEnum, JzodLiteral, JzodObject, JzodSchema, Menu, MetaModel, Report } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selectUnionBranchFromDiscriminator, SelectUnionBranchFromDiscriminatorReturnType } from '../../../src/1_core/jzod/jzodTypeCheck';
// import { selectUnionBranchFromDiscriminator } from "./JzodUnfoldSchemaForValue";

import entityEntity from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entitySelfApplicationDeploymentConfiguration from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entityReport from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityEntityDefinition from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityJzodSchema from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json';
import entityStoreBasedConfiguration from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entitySelfApplication from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entitySelfApplicationVersion from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entitySelfApplicationModelBranch from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
import entityMenu from '../../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json';

import entityDefinitionMenu from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json';
import entityDefinitionJzodSchema from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json';
import entityDefinitionSelfApplicationVersion from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionEntity from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionSelfApplicationModelBranch from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import entityDefinitionSelfApplication from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionReport from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
import entityDefinitionSelfApplicationDeploymentConfiguration from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionEntityDefinition from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionStoreBasedConfiguration from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';

import reportApplicationVersionList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import reportApplicationList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportReportList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';
import reportConfigurationList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportApplicationModelBranchList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportJzodSchemaList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8b22e84e-9374-4121-b2a7-d13d947a0ba2.json';
import reportEntityList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportApplicationDeploymentConfigurationList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportMenuList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ecfd8787-09cc-417d-8d2c-173633c9f998.json';
import reportEntityDefinitionList from '../../../src/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';

import jzodSchemajzodMiroirBootstrapSchema from "../../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/17adb534-1dcb-4874-a4ef-6c1e03b31c4e.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/48644159-66d4-426d-b38d-d083fd455e7b.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/4aaba993-f0a1-4a26-b1ea-13b0ad532685.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/9086f49a-0e81-4902-81f3-560186dee334.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ba38669e-ac6f-40ea-af14-bb200db251d8.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/dc47438c-166a-4d19-aeba-ad70281afdf4.json';
import applicationVersionInitialMiroirVersionCrossEntityDefinitionReport from '../../../src/assets/miroir_data/8bec933d-6287-4de7-8a88-5c24216de9f4/ede7e794-5ae7-48a8-81c9-d1f82df11829.json';
import selfApplicationVersionInitialMiroirVersion from '../../../src/assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import menuDefaultMiroir from '../../../src/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json';


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

import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as JzodSchema;

// Helper to create a JzodObject with a literal discriminator
function makeObjectWithLiteralDiscriminators(discriminators: [string, string][]): JzodObject {
  const definition: Record<string, JzodLiteral | { type: "string" }> = {};
  for (const [discriminator, value] of discriminators) {
    definition[discriminator] = {
      type: "literal",
      definition: value
    } as JzodLiteral;
  }
  definition["foo"] = { type: "string" };
  return {
    type: "object",
    definition
  };
}

// Helper to create a JzodObject with an enum discriminator
function makeObjectWithEnumDiscriminator(discriminator: string, values: string[]): JzodObject {
  return {
    type: "object",
    definition: {
      [discriminator]: {
        type: "enum",
        definition: values
      } as JzodEnum,
      foo: { type: "string" }
    }
  };
}

// ################################################################################################
describe("selectUnionBranchFromDiscriminator", () => {
  // ##############################################################################################
  it("returns error if discriminator is not found in the value object and at least 2 options are possible", () => {
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator, "B"]]);
    const valueObject = { foo: "bar" }; // No 'type' field

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/no discriminator values found in valueObject and multiple choices exist/);
  });

  // ###############################################################################################
  it("returns error if no branch matches the discriminator value, and at least 2 options are possible", () => {
    console.log("Testing", expect.getState().currentTestName);
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator, "B"]]);
    const valueObject = { type: "C", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found no match/);
  });

  // ##############################################################################################
  it("returns error if multiple branches match the discriminator value", () => {
    const discriminator = "type";
    const objA1 = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objA2 = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const valueObject = { type: "A", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA1, objA2],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found many matches/);
  });

    // ##############################################################################################
  it("returns error if first entry a discriminator array matches many options and second entry is not found in valueObject (thus matches 0)", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", foo: "bar" }; // No 'kind' field

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found no match/);
  });

  // ##############################################################################################
  it("returns error if first entry a discriminator array matches many options and second entry matches no option", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", kind: "C", foo: "bar" }; // No 'kind' field

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("error");
    expect((result as any).error).toMatch(/found no match/);
  });

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // TODO: in a union, there must be at least 2 branches to select from, so this case should not happen
  it("returns the given type if only 1 is provided, even if it does not match the given discriminator", () => {
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "C"]]);
    const valueObject = { type: "A", foo: "bar" };
    const result = selectUnionBranchFromDiscriminator(
      [objA],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objA);
    }
  });


  // ##############################################################################################
  it("selects the correct branch for a literal discriminator", () => {
    const discriminator = "type";
    const objA = makeObjectWithLiteralDiscriminators([[discriminator, "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator, "B"]]);
    const valueObject = { type: "B", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objB);
    }
  });

  // ##############################################################################################
  it("selects the correct branch for an enum discriminator", () => {
    const discriminator = "kind";
    const objEnum = makeObjectWithEnumDiscriminator(discriminator, ["X", "Y"]);
    const objOther = makeObjectWithLiteralDiscriminators([[discriminator, "Z"]]);
    const valueObject = { kind: "Y", foo: "baz" };

    const result = selectUnionBranchFromDiscriminator(
      [objEnum, objOther],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objEnum);
    }
  });

  // ##############################################################################################
  it("selects the correct branch for an enum with multiple values", () => {
    const discriminator = "kind";
    const objEnum = makeObjectWithEnumDiscriminator(discriminator, ["X", "Y", "Z"]);
    const valueObject = { kind: "Z", foo: "baz" };

    const result = selectUnionBranchFromDiscriminator(
      [objEnum],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objEnum);
    }
  });

  // ##############################################################################################
  it("returns found branch based on the first entry in a discriminator array if only 1 option matches, even if the discriminator features many items", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "B"]]);
    const valueObject = { type: "B", foo: "bar" };

    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objB);
    }
  });

  // ##############################################################################################
  it("returns found branch based on the second entry in a discriminator array if only 1 option matches", () => {
    const discriminator = ["type", "kind"];
    const objA = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "A"]]);
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "A"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", kind: "B", foo: "bar" };
    
    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );
    
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual(objB);
    }
  });

  // #################################################################################################
  it("returns found branch based on the first entry in a discriminator array if one of the entries has the discrimitator in an 'extend' clause", () => {
    const discriminator = ["type", "kind"];
    const objA: JzodObject = {
      type: "object",
      extend: [
        {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "abstractObject",
          },
          context: {},
        },
      ],
      definition: {
        [discriminator[1]]: { type: "literal", definition: "A" },
        foo: { type: "string" },
      },
    };
    const objB = makeObjectWithLiteralDiscriminators([[discriminator[0], "B"], [discriminator[1], "B"]]);
    const valueObject = { type: "A", kind: "A", foo: "bar" };
    
    const result = selectUnionBranchFromDiscriminator(
      [objA, objB],
      discriminator,
      valueObject,
      [], // valueObjectPath
      [], // typePath 
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {
        abstractObject: {
          type: "object",
          definition: {
            [discriminator[0]]: { type: "literal", definition: "A" },
          },
        },
      }
    );
    
    // console.log("currentDiscriminatedObjectJzodSchema", JSON.stringify(currentDiscriminatedObjectJzodSchema, null, 2));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual({
        type: "object",
        definition: {
          type: {
            type: "literal",
            definition: "A",
          },
          kind: {
            type: "literal",
            definition: "A",
          },
          foo: {
            type: "string",
          },
        },
      });
    }
  });

  // #################################################################################################
  it("returns the correct branch for combinerByRelationReturningObjectList in combinerTemplate", () => {
    const unionObjectChoices: JzodObject[] = [
      // extractorForObjectByDirectReference
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorForObjectByDirectReference",
          },
          instanceUuid: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_InnerReference",
            },
            context: {},
          },
        },
      },
      // combinerForObjectByRelation
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: { type: "literal", definition: "combinerForObjectByRelation" },
          objectReference: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForRuntime_InnerReference",
            },
            context: {},
          },
          AttributeOfObjectToCompareToReferenceUuid: { type: "string" },
        },
      },
      // combinerByRelationReturningObjectList
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "combinerByRelationReturningObjectList",
          },
          orderBy: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
            },
          },
          objectReference: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForRuntime_InnerReference",
            },
            context: {},
          },
          objectReferenceAttribute: { type: "string", optional: true },
          AttributeOfListObjectToCompareToReferenceUuid: { type: "string" },
        },
      },
      // combinerByManyToManyRelationReturningObjectList
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "combinerByManyToManyRelationReturningObjectList",
          },
          orderBy: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
            },
          },
          objectListReference: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForRuntime_contextReference",
            },
            context: {},
          },
          objectListReferenceAttribute: { type: "string", optional: true },
          AttributeOfRootListObjectToCompareToListReferenceUuid: {
            type: "string",
            optional: true,
          },
        },
      },
      // extractorCombinerByHeteronomousManyToManyReturningListOfObjectList
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList",
          },
          rootExtractorOrReference: {
            type: "union",
            discriminator: "extractorOrCombinerType",
            definition: [
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "extractorOrCombinerTemplate",
                },
                context: {},
              },
              { type: "string" },
            ],
          },
          subQueryTemplate: {
            type: "object",
            definition: {
              query: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "extractorOrCombinerTemplate",
                },
                context: {},
              },
              rootQueryObjectTransformer: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "recordOfTransformers",
                },
                context: {},
              },
            },
          },
        },
      },
      // literal
      {
        type: "object",
        definition: {
          extractorTemplateType: { type: "literal", definition: "literal" },
          definition: { type: "string" },
        },
      },
      // extractorTemplateByExtractorWrapperReturningObject
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorTemplateByExtractorWrapperReturningObject",
          },
          definition: {
            type: "record",
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "transformer_contextOrParameterReferenceTO_REMOVE",
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              },
              context: {},
            },
          },
        },
      },
      // extractorTemplateByExtractorWrapperReturningList
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorTemplateByExtractorWrapperReturningList",
          },
          definition: {
            type: "array",
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "transformer_contextOrParameterReferenceTO_REMOVE",
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              },
              context: {},
            },
          },
        },
      },
      // extractorTemplateForObjectListByEntity
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: {
            eager: true,
            relativePath: "extractorTemplateRoot",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
        },
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "extractorTemplateForObjectListByEntity",
          },
          orderBy: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
            },
          },
          filter: {
            type: "object",
            optional: true,
            definition: {
              attributeName: { type: "string" },
              value: {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "transformerForBuildPlusRuntime",
                },
                context: {},
              },
            },
          },
        },
      },
      // // combinerByRelationReturningObjectList !!!!!!!!!!!!!!!!!!!!!!!!!!
      // {
      //   type: "object",
      //   extend: {
      //     type: "schemaReference",
      //     definition: {
      //       eager: true,
      //       relativePath: "extractorTemplateRoot",
      //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //     },
      //     context: {},
      //   },
      //   definition: {
      //     extractorTemplateType: {
      //       type: "literal",
      //       definition: "combinerByRelationReturningObjectList",
      //     },
      //     orderBy: {
      //       type: "object",
      //       optional: true,
      //       definition: {
      //         attributeName: { type: "string" },
      //         direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
      //       },
      //     },
      //     objectReference: {
      //       type: "schemaReference",
      //       definition: {
      //         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //         relativePath: "transformerForRuntime_InnerReference",
      //       },
      //       context: {},
      //     },
      //     objectReferenceAttribute: { type: "string", optional: true },
      //     AttributeOfListObjectToCompareToReferenceUuid: { type: "string" },
      //   },
      // },
      // // combinerByManyToManyRelationReturningObjectList !!!!!!!!!!!!!!!!!!!!!!!!!!
      // {
      //   type: "object",
      //   extend: {
      //     type: "schemaReference",
      //     definition: {
      //       eager: true,
      //       relativePath: "extractorTemplateRoot",
      //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //     },
      //     context: {},
      //   },
      //   definition: {
      //     extractorTemplateType: {
      //       type: "literal",
      //       definition: "combinerByManyToManyRelationReturningObjectList",
      //     },
      //     orderBy: {
      //       type: "object",
      //       optional: true,
      //       definition: {
      //         attributeName: { type: "string" },
      //         direction: { type: "enum", optional: true, definition: ["ASC", "DESC"] },
      //       },
      //     },
      //     objectListReference: {
      //       type: "schemaReference",
      //       definition: {
      //         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //         relativePath: "transformerForRuntime_contextReference",
      //       },
      //       context: {},
      //     },
      //     objectListReferenceAttribute: { type: "string", optional: true },
      //     AttributeOfRootListObjectToCompareToListReferenceUuid: {
      //       type: "string",
      //       optional: true,
      //     },
      //   },
      // },
    ];

    const valueObject = {
      extractorTemplateType: "combinerByRelationReturningObjectList",
      parentName: "Book",
      parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      objectReference: {
        transformerType: "contextReference",
        interpolation: "runtime",
        referenceName: "author",
      },
      AttributeOfListObjectToCompareToReferenceUuid: "author",
    };

    const result = selectUnionBranchFromDiscriminator(
      unionObjectChoices,
      ["extractorTemplateType"],
      valueObject,
      [], // valueObjectPath
      [], // typePath
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {
      }
    );
    
    console.log("currentDiscriminatedObjectJzodSchema", JSON.stringify(result.status === "ok" ? result.currentDiscriminatedObjectJzodSchema : null, null, 2));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual({
      type: "object",
      definition: {
        label: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 1,
              defaultLabel: "Label",
              editable: false,
            },
          },
        },
        applicationSection: {
          type: "schemaReference",
          optional: true,
          tag: {
            value: {
              id: 2,
              defaultLabel: "SelfApplication Section",
              editable: false,
            },
          },
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "applicationSection",
          },
          context: {},
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
          type: "union",
          discriminator: "transformerType",
          tag: {
            value: {
              id: 4,
              defaultLabel: "Parent Uuid",
              editable: false,
            },
          },
          definition: [
            {
              type: "string",
            },
            {
              type: "schemaReference",
              definition: {
                absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                relativePath: "transformerForBuild_InnerReference",
              },
              context: {},
            },
          ],
        },
        extractorTemplateType: {
          type: "literal",
          definition: "combinerByRelationReturningObjectList",
        },
        orderBy: {
          type: "object",
          optional: true,
          definition: {
            attributeName: {
              type: "string",
            },
            direction: {
              type: "enum",
              optional: true,
              definition: ["ASC", "DESC"],
            },
          },
        },
        objectReference: {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "transformerForRuntime_InnerReference",
          },
          context: {},
        },
        objectReferenceAttribute: {
          type: "string",
          optional: true,
        },
        AttributeOfListObjectToCompareToReferenceUuid: {
          type: "string",
        },
      }
    });
    }
  });

  // #################################################################################################
  it("returns the correct branch for a string that could be a transformer or a runtime transformer", () => {
    const unionObjectChoices: JzodObject[] = [
      // mustacheStringTemplate
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "mustacheStringTemplate" },
          definition: { type: "string" },
        },
      },
      // constant
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constant" },
          value: { type: "any" },
        },
      },
      // parameterReference
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_optional_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", optional: true, definition: "build" },
          transformerType: { type: "literal", definition: "parameterReference" },
          referenceName: { optional: true, type: "string" },
          referencePath: { optional: true, type: "array", definition: { type: "string" } },
        },
      },
      // constantUuid
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constantUuid" },
          value: { type: "string" },
        },
      },
      // constantObject
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constantObject" },
          value: { type: "record", definition: { type: "any" } },
        },
      },
      // constantString
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "constantString" },
          value: { type: "string" },
        },
      },
      // newUuid
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "newUuid" },
        },
      },
      // newUuid  !!!!!!!!!!!!!
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "newUuid" },
        },
      },
      // objectDynamicAccess
      {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformerForBuild_Abstract",
            },
            context: {},
          },
        ],
        definition: {
          interpolation: { type: "literal", definition: "build" },
          transformerType: { type: "literal", definition: "objectDynamicAccess" },
          objectAccessPath: {
            type: "array",
            definition: {
              type: "union",
              discriminator: "transformerType",
              definition: [
                {
                  type: "object",
                  extend: [
                    {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        relativePath: "transformerForRuntime_optional_Abstract",
                      },
                      context: {},
                    },
                  ],
                  definition: {
                    interpolation: { type: "literal", optional: true, definition: "runtime" },
                    transformerType: { type: "literal", definition: "contextReference" },
                    referenceName: { optional: true, type: "string" },
                    referencePath: {
                      optional: true,
                      type: "array",
                      definition: { type: "string" },
                    },
                  },
                },
                {
                  type: "object",
                  extend: [
                    {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        relativePath: "transformerForRuntime_Abstract",
                      },
                      context: {},
                    },
                  ],
                  definition: {
                    interpolation: { type: "literal", definition: "runtime" },
                    transformerType: { type: "literal", definition: "objectDynamicAccess" },
                    objectAccessPath: {
                      type: "array",
                      definition: {
                        type: "union",
                        discriminator: "transformerType",
                        definition: [
                          {
                            type: "object",
                            extend: [
                              {
                                type: "schemaReference",
                                definition: {
                                  eager: true,
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForRuntime_optional_Abstract",
                                },
                                context: {},
                              },
                            ],
                            definition: {
                              transformerType: { type: "literal", definition: "contextReference" },
                              referenceName: { optional: true, type: "string" },
                              referencePath: {
                                optional: true,
                                type: "array",
                                definition: { type: "string" },
                              },
                            },
                          },
                          {
                            type: "object",
                            extend: [
                              {
                                type: "schemaReference",
                                definition: {
                                  eager: true,
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForRuntime_Abstract",
                                },
                                context: {},
                              },
                            ],
                            definition: {
                              transformerType: {
                                type: "literal",
                                definition: "objectDynamicAccess",
                              },
                              objectAccessPath: {
                                type: "array",
                                definition: {
                                  type: "union",
                                  discriminator: "transformerType",
                                  definition: [
                                    {
                                      type: "schemaReference",
                                      definition: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath:
                                          "transformerForBuildPlusRuntime_contextReference",
                                      },
                                    },
                                    {
                                      type: "schemaReference",
                                      definition: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath:
                                          "transformerForBuildPlusRuntime_objectDynamicAccess",
                                      },
                                    },
                                    {
                                      type: "schemaReference",
                                      definition: {
                                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                        relativePath:
                                          "transformerForBuildPlusRuntime_mustacheStringTemplate",
                                      },
                                    },
                                    { type: "string" },
                                  ],
                                },
                              },
                            },
                          },
                          {
                            type: "object",
                            extend: [
                              {
                                type: "schemaReference",
                                definition: {
                                  eager: true,
                                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                                  relativePath: "transformerForRuntime_Abstract",
                                },
                                context: {},
                              },
                            ],
                            definition: {
                              transformerType: {
                                type: "literal",
                                definition: "mustacheStringTemplate",
                              },
                              definition: { type: "string" },
                            },
                          },
                          { type: "string" },
                        ],
                      },
                    },
                  },
                },
                {
                  type: "object",
                  extend: [
                    {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                        relativePath: "transformerForBuild_Abstract",
                      },
                      context: {},
                    },
                  ],
                  definition: {
                    interpolation: { type: "literal", definition: "build" },
                    transformerType: { type: "literal", definition: "mustacheStringTemplate" },
                    definition: { type: "string" },
                  },
                },
                { type: "string" },
              ],
            },
          },
        },
      },
    ];
    });

  // ##################################################################################################
  it("returns the correct branch for an object without any discriminator values when exactly 1 branch without any discriminator values exists in the discriminated union", () => {
    const unionObjectChoices: JzodObject[] = [
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "branchWithoutDiscriminator",
          },
          someProperty: { type: "string" },
        },
      },
      {
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "branchWithDiscriminator",
          },
          discriminator: { type: "string" },
        },
      },
    ];

    const valueObject = {
      someProperty: "testValue",
    };

    const result = selectUnionBranchFromDiscriminator(
      unionObjectChoices,
      [], // no discriminator keys
      valueObject,
      [], // valueObjectPath
      [], // typePath
      castMiroirFundamentalJzodSchema,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
      {}
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.flattenedUnionChoices.length).toBe(1);
      expect(result.currentDiscriminatedObjectJzodSchema).toEqual({
        type: "object",
        definition: {
          extractorTemplateType: {
            type: "literal",
            definition: "branchWithoutDiscriminator",
          },
          someProperty: { type: "string" },
        },
      });
    }
  });

});