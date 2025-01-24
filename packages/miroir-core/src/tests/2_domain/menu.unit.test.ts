// import { describe, expect } from 'vitest';

import {
  DomainElement,
  DomainElementSuccess
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainQueryReturnType } from "../../0_interfaces/2_domain/DomainElement.js";
import { transformer_menu_AddItem } from "../../1_core/Menu.js";
import { defaultTransformers } from "../../2_domain/Transformers.js";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("menu.unit.test", () => {
  // ################################################################################################
  it("transformer_menu_addItem", async () => { // TODO: test failure cases!
      console.log("transformer_menu_addItem START")

      const result: DomainQueryReturnType<DomainElementSuccess> = transformer_menu_AddItem(
        defaultTransformers,
        "runtime",
        "ROOT",
        {
          transformerType: "transformer_menu_addItem",
          interpolation: "runtime",
          transformerDefinition: {
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
        },
        {},
        {
          menu: {
            uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00",
            parentName: "Menu",
            parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
            name: "MiroirMenu",
            defaultLabel: "Meta-Model",
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
        }
      );

      const expectedResult: DomainQueryReturnType<DomainElementSuccess> = {
        // TODO: actually a non-recursive object element, should be a freeObject
        elementType: "object",
        elementValue: {
          uuid: "eaac459c-6c2b-475c-8ae4-c6c3032dae00",
          parentName: "Menu",
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          name: "MiroirMenu",
          defaultLabel: "Meta-Model",
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
        } as any,
      };

      console.log("################################ result", JSON.stringify(result,null,2))
      // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(result).toEqual(expectedResult);

      console.log("transformer_menu_addItem END")
    }
  );

});
