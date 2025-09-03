import * as vitest from 'vitest';
// import { describe, expect } from 'vitest';

import { Domain2QueryReturnType } from "../../src/0_interfaces/2_domain/DomainElement";
import { handleTransformer_menu_AddItem } from "../../src/1_core/Menu";
import { defaultTransformers } from "../../src/2_domain/TransformersForRuntime";
import {
  ignoreFailureAttributes,
  runTransformerTestInMemory,
  runTransformerTestSuite,
} from "../../src/4_services/TestTools";
import type { TransformerTestSuite } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { defaultMiroirModelEnviroment } from '../../src/1_core/Model';
import { MiroirEventTracker } from '../../src/3_controllers/MiroirEventTracker';
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
export const transformerTestSuite_applicativeTransformers: TransformerTestSuite = {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "transformers",
  transformerTests: {
    "menu can be built from parts": {
      transformerTestType: "transformerTest",
      transformerTestLabel: "menu can be built from parts",
      transformerName: "menuBuild",
      runTestStep: "runtime",
      transformer: {
        transformerType: "transformer_menu_addItem",
        interpolation: "runtime",
          menuItemReference: "menuItem",
          menuReference: {
            transformerType: "objectDynamicAccess",
            interpolation: "runtime",
            objectAccessPath: [{
              transformerType: "contextReference",
              interpolation: "runtime",
              referenceName: "menu",
            }]
          },
          menuSectionItemInsertionIndex: -1,
      },
      transformerParams: {
        menu: {
          uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00",
          parentName: "Menu",
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          name: "MiroirMenu",
          defaultLabel: "Library Menu",
          description: "This is the default menu allowing to explore the Miroir Meta-Model.",
          definition: {
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
                  {
                    label: "Miroir Endpoints",
                    section: "data",
                    selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                    reportUuid: "ace3d5c9-b6a7-43e6-a277-595329e7532a",
                    icon: "list",
                  },
                ],
              },
            ],
          },
        },
        menuItem: {
          label: "Test",
          section: "data",
          selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
          reportUuid: "ace3d5c9-b6a7-43e6-a277-595329e7532a",
          icon: "location_on",
        },
      },
      expectedValue: {
        // TODO: actually a non-recursive object element, should be a freeObject
        uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00",
        parentName: "Menu",
        parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
        name: "MiroirMenu",
        defaultLabel: "Library Menu",
        description: "This is the default menu allowing to explore the Miroir Meta-Model.",
        definition: {
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
                {
                  label: "Miroir Endpoints",
                  section: "data",
                  selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                  reportUuid: "ace3d5c9-b6a7-43e6-a277-595329e7532a",
                  icon: "list",
                },
                {
                  label: "Test",
                  section: "data",
                  selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
                  reportUuid: "ace3d5c9-b6a7-43e6-a277-595329e7532a",
                  icon: "location_on",
                },
              ],
            },
          ],
        },
      },
    },
  }
}


describe("menu.unit.test", () => {
  // ################################################################################################
  it("transformer_menu_addItem", async () => { // TODO: test failure cases!
      console.log("transformer_menu_addItem START")

      const miroirEventTracker = new MiroirEventTracker();

      // console.log("################################ result", JSON.stringify(result,null,2))
      // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      await runTransformerTestSuite(
        vitest,
        [],
        transformerTestSuite_applicativeTransformers,
        runTransformerTestInMemory,
        defaultMiroirModelEnviroment,
        miroirEventTracker
      );

      // expect(result).toEqual(expectedResult);

      console.log("transformer_menu_addItem END")
    }
  );

});
