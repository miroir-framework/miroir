// import { describe, expect } from 'vitest';

import { DomainState } from "../../0_interfaces/2_domain/DomainControllerInterface";

import domainStateImport from "./domainState.json";

const domainState: DomainState = domainStateImport as DomainState;

import {
  DomainElement
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformer_menu_AddItem } from "../../1_core/Menu";
import { defaultTransformers } from "../../2_domain/Transformers";
import { domainStateToDeploymentEntityState } from "../../tools";
import { DeploymentEntityState } from "../../0_interfaces/2_domain/DeploymentStateInterface";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("domainStateToDeploymentEntityState.unit.test", () => {
  // ################################################################################################
  it("domainStateToDeploymentEntityState", async () => 
    {
      // TODO: test failure cases!
      console.log("transformer_menu_addItem START");

      const result = domainStateToDeploymentEntityState(domainState);
      const expectedResult: DeploymentEntityState = {
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
          ids: [
            "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
            "35c5608a-7678-4f07-a4ec-76fc5bc35424",
            "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
            "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
            "5e81e1b9-38be-487c-b3e5-53796c57fccf",
            "7990c0c9-86c3-40a1-a121-036c91b55ed7",
            "8bec933d-6287-4de7-8a88-5c24216de9f4",
            "a659d350-dd97-4da9-91de-524fa01745dc",
            "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
            "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
          ],
          entities: {
            "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
              uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Entity",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "MetaModel",
              description: "The Metaclass for entities.",
            },
            "35c5608a-7678-4f07-a4ec-76fc5bc35424": {
              uuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "ApplicationDeploymentConfiguration",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "An Application Deployment",
            },
            "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
              uuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Report",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "Report, allowing to display model instances",
            },
            "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
              uuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "EntityDefinition",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "MetaModel",
              description: "The Metaclass for the definition of entities.",
            },
            "5e81e1b9-38be-487c-b3e5-53796c57fccf": {
              uuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "JzodSchema",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "Common Jzod Schema definitions, available to all Entity definitions",
            },
            "7990c0c9-86c3-40a1-a121-036c91b55ed7": {
              uuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "StoreBasedConfiguration",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "A configuration of storage-related aspects of a Model.",
            },
            "8bec933d-6287-4de7-8a88-5c24216de9f4": {
              uuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "ApplicationVersionCrossEntityDefinition",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "The (many-to-many) sssociation among ApplicationVersions and EntityDefinitions.",
            },
            "a659d350-dd97-4da9-91de-524fa01745dc": {
              uuid: "a659d350-dd97-4da9-91de-524fa01745dc",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Application",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "An Application",
            },
            "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
              uuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "ApplicationVersion",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "A Version of an Application",
            },
            "cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
              uuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "ApplicationModelBranch",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              conceptLevel: "Model",
              description: "A Branch of an Application Model",
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
          ids: [
            "15407b85-f2c8-4a34-bfa7-89f044ba2407",
            "27046fce-742f-4cc4-bb95-76b271f490a5",
            "381ab1be-337f-4198-b1d3-f686867fc1dd",
            "69bf7c03-a1df-4d1c-88c1-44363feeea87",
            "9460420b-f176-4918-bd45-894ab195ffe9",
            "952d2c65-4da2-45c2-9394-a0920ceedfb6",
            "bd303ae8-6bce-4b44-a63c-815b9ebf728b",
            "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
            "c0b71083-8cc8-43db-bf52-572f1f03bbb5",
            "f93af951-ea13-4815-a2e3-ec0cab1fadd2",
          ],
          entities: {
            "15407b85-f2c8-4a34-bfa7-89f044ba2407": {
              uuid: "15407b85-f2c8-4a34-bfa7-89f044ba2407",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
              conceptLevel: "Model",
              name: "JzodSchema",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: false,
                    },
                  },
                  conceptLevel: {
                    type: "enum",
                    definition: ["MetaModel", "Model", "Data"],
                    optional: true,
                    tag: {
                      id: 5,
                      defaultLabel: "Concept Level",
                      editable: false,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 7,
                      description: "Description",
                      editable: true,
                    },
                  },
                  definition: {
                    type: "schemaReference",
                    context: {
                      jzodObjectOrReference: {
                        type: "union",
                        definition: [
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodReference",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodObject",
                            },
                          },
                        ],
                      },
                    },
                    definition: {
                      relativePath: "jzodObjectOrReference",
                    },
                    optional: true,
                    tag: {
                      id: 8,
                      defaultLabel: "Definition",
                      editable: true,
                    },
                  },
                },
              },
            },
            "27046fce-742f-4cc4-bb95-76b271f490a5": {
              uuid: "27046fce-742f-4cc4-bb95-76b271f490a5",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
              conceptLevel: "Model",
              name: "ApplicationVersion",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                  type: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 7,
                      defaultLabel: "Type of Report",
                      editable: true,
                    },
                  },
                  application: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 8,
                      defaultLabel: "Application",
                      targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                      editable: false,
                    },
                  },
                  branch: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 9,
                      defaultLabel: "Branch",
                      description: "The Branch of this Application Version",
                      targetEntity: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
                      editable: false,
                    },
                  },
                  previousVersion: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 10,
                      defaultLabel: "Previous Application Version",
                      description: "Previous version of the application on this Branch.",
                      targetEntity: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                      editable: false,
                    },
                  },
                  modelStructureMigration: {
                    type: "schemaReference",
                    optional: true,
                    tag: {
                      id: 11,
                      defaultLabel: "Structure Migration from Previous Version",
                      editable: true,
                    },
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodObject",
                    },
                  },
                  modelCUDMigration: {
                    type: "schemaReference",
                    optional: true,
                    tag: {
                      id: 12,
                      defaultLabel: "Create-Update-Delete Migration from Previous Version",
                      editable: true,
                    },
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodObject",
                    },
                  },
                },
              },
            },
            "381ab1be-337f-4198-b1d3-f686867fc1dd": {
              uuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Entity",
              conceptLevel: "MetaModel",
              description: "Entities",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  conceptLevel: {
                    type: "enum",
                    definition: ["MetaModel", "Model", "Data"],
                    optional: true,
                    tag: {
                      id: 4,
                      defaultLabel: "Concept Level",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  author: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Application",
                      targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 7,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                },
              },
            },
            "69bf7c03-a1df-4d1c-88c1-44363feeea87": {
              uuid: "69bf7c03-a1df-4d1c-88c1-44363feeea87",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
              conceptLevel: "Model",
              name: "ApplicationModelBranch",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      targetEntityApplicationSection: "model",
                      targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      editable: false,
                    },
                  },
                  conceptLevel: {
                    type: "enum",
                    definition: ["MetaModel", "Model", "Data"],
                    optional: true,
                    tag: {
                      id: 4,
                      defaultLabel: "Concept Level",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 6,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  application: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 7,
                      defaultLabel: "Application",
                      targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                      editable: false,
                    },
                  },
                  headVersion: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    optional: true,
                    tag: {
                      id: 8,
                      defaultLabel: "Head Version",
                      targetEntity: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 9,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                },
              },
            },
            "9460420b-f176-4918-bd45-894ab195ffe9": {
              uuid: "9460420b-f176-4918-bd45-894ab195ffe9",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
              conceptLevel: "Model",
              name: "Application",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                },
              },
            },
            "952d2c65-4da2-45c2-9394-a0920ceedfb6": {
              uuid: "952d2c65-4da2-45c2-9394-a0920ceedfb6",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              conceptLevel: "Model",
              name: "Report",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  conceptLevel: {
                    type: "enum",
                    definition: ["MetaModel", "Model", "Data"],
                    optional: true,
                    tag: {
                      id: 4,
                      defaultLabel: "Concept Level",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 6,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  type: {
                    type: "enum",
                    definition: ["list", "grid"],
                    optional: true,
                    tag: {
                      id: 7,
                      defaultLabel: "Type of Report",
                      editable: true,
                    },
                  },
                  application: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    optional: true,
                    tag: {
                      id: 8,
                      defaultLabel: "Application",
                      targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                      editable: true,
                    },
                  },
                  definition: {
                    type: "schemaReference",
                    context: {
                      extractorTemplateReturningObject: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "selectObjectByParameterValue",
                          },
                          label: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 1,
                              defaultLabel: "Label",
                              editable: false,
                            },
                          },
                          parentName: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 2,
                              defaultLabel: "Parent Name",
                              editable: false,
                            },
                          },
                          parentUuid: {
                            type: "simpleType",
                            definition: "string",
                            validations: [
                              {
                                type: "uuid",
                              },
                            ],
                            tag: {
                              id: 3,
                              defaultLabel: "Parent Uuid",
                              editable: false,
                            },
                          },
                          instanceUuid: {
                            type: "simpleType",
                            definition: "string",
                            validations: [
                              {
                                type: "uuid",
                              },
                            ],
                            tag: {
                              id: 4,
                              defaultLabel: "Instance Uuid",
                              editable: false,
                            },
                          },
                          rootObjectUuid: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            validations: [
                              {
                                type: "uuid",
                              },
                            ],
                            tag: {
                              id: 5,
                              defaultLabel: "Root Object Uuid",
                              editable: false,
                            },
                          },
                          rootObjectAttribute: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 6,
                              defaultLabel: "Root Object Attribute",
                              editable: false,
                            },
                          },
                          fetchedDataReference: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 7,
                              defaultLabel: "Fetched Data Reference",
                              editable: false,
                            },
                          },
                          fetchedDataReferenceAttribute: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 8,
                              defaultLabel: "Root Object Attribute",
                              editable: false,
                            },
                          },
                        },
                      },
                      extractorTemplateReturningObjectList: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "combinerByRelationReturningObjectList",
                          },
                          label: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 1,
                              defaultLabel: "Label",
                              editable: false,
                            },
                          },
                          parentName: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 2,
                              defaultLabel: "Parent Name",
                              editable: false,
                            },
                          },
                          parentUuid: {
                            type: "simpleType",
                            definition: "string",
                            validations: [
                              {
                                type: "uuid",
                              },
                            ],
                            tag: {
                              id: 3,
                              defaultLabel: "Parent Uuid",
                              editable: false,
                            },
                          },
                          rootObjectUuid: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            validations: [
                              {
                                type: "uuid",
                              },
                            ],
                            tag: {
                              id: 4,
                              defaultLabel: "Root Object Uuid",
                              editable: false,
                            },
                          },
                          rootObjectAttribute: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 5,
                              defaultLabel: "Root Object Attribute",
                              editable: false,
                            },
                          },
                          fetchedDataReference: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                            tag: {
                              id: 6,
                              defaultLabel: "Fetched Data Reference",
                              editable: false,
                            },
                          },
                        },
                      },
                      queryTemplate: {
                        type: "union",
                        discriminator: "type",
                        definition: [
                          {
                            type: "schemaReference",
                            definition: {
                              relativePath: "extractorTemplateReturningObjectList",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              relativePath: "extractorTemplateReturningObject",
                            },
                          },
                        ],
                      },
                      extractorOrCombinerTemplateRecord: {
                        type: "record",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            relativePath: "queryTemplate",
                          },
                        },
                      },
                      objectInstanceReportSection: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "objectInstanceReportSection",
                          },
                          selectData: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              relativePath: "extractorOrCombinerTemplateRecord",
                            },
                          },
                          definition: {
                            type: "object",
                            definition: {
                              label: {
                                type: "simpleType",
                                definition: "string",
                                optional: true,
                                tag: {
                                  id: 1,
                                  defaultLabel: "Label",
                                  editable: false,
                                },
                              },
                              parentUuid: {
                                type: "simpleType",
                                definition: "string",
                                validations: [
                                  {
                                    type: "uuid",
                                  },
                                ],
                                tag: {
                                  id: 2,
                                  defaultLabel: "Entity Uuid",
                                  editable: false,
                                },
                              },
                              fetchedDataReference: {
                                type: "simpleType",
                                definition: "string",
                                optional: true,
                                tag: {
                                  id: 3,
                                  defaultLabel: "Fetched Data Reference",
                                  editable: false,
                                },
                              },
                              query: {
                                type: "schemaReference",
                                optional: true,
                                definition: {
                                  relativePath: "extractorTemplateReturningObject",
                                },
                              },
                            },
                          },
                        },
                      },
                      objectListReportSection: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "objectListReportSection",
                          },
                          definition: {
                            type: "schemaReference",
                            definition: {
                              relativePath: "extractorTemplateReturningObjectList",
                            },
                          },
                        },
                      },
                      gridReportSection: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "grid",
                          },
                          selectData: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              relativePath: "extractorOrCombinerTemplateRecord",
                            },
                          },
                          definition: {
                            type: "array",
                            definition: {
                              type: "array",
                              definition: {
                                type: "schemaReference",
                                definition: {
                                  relativePath: "reportSection",
                                },
                              },
                            },
                          },
                        },
                      },
                      listReportSection: {
                        type: "object",
                        definition: {
                          type: {
                            type: "literal",
                            definition: "list",
                          },
                          selectData: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              relativePath: "extractorOrCombinerTemplateRecord",
                            },
                          },
                          definition: {
                            type: "array",
                            definition: {
                              type: "schemaReference",
                              definition: {
                                relativePath: "reportSection",
                              },
                            },
                          },
                        },
                      },
                      reportSection: {
                        type: "union",
                        discriminator: "type",
                        definition: [
                          {
                            type: "schemaReference",
                            definition: {
                              relativePath: "gridReportSection",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              relativePath: "listReportSection",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              relativePath: "objectListReportSection",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              relativePath: "objectInstanceReportSection",
                            },
                          },
                        ],
                      },
                      rootReport: {
                        type: "object",
                        definition: {
                          parameters: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodObject",
                            },
                          },
                          selectData: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              relativePath: "extractorOrCombinerTemplateRecord",
                            },
                          },
                          section: {
                            type: "schemaReference",
                            definition: {
                              relativePath: "reportSection",
                            },
                          },
                        },
                      },
                    },
                    definition: {
                      eager: true,
                      relativePath: "rootReport",
                    },
                    tag: {
                      id: 9,
                      defaultLabel: "Definition",
                      editable: true,
                    },
                  },
                },
              },
            },
            "bd303ae8-6bce-4b44-a63c-815b9ebf728b": {
              uuid: "bd303ae8-6bce-4b44-a63c-815b9ebf728b",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
              conceptLevel: "Model",
              name: "ApplicationDeploymentConfiguration",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                  application: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 7,
                      defaultLabel: "Application",
                      description: "The Application of the Branch.",
                      targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                      editable: false,
                    },
                  },
                  model: {
                    type: "schemaReference",
                    optional: true,
                    tag: {
                      id: 8,
                      defaultLabel: "Application Deployment Model",
                      editable: true,
                    },
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodObject",
                    },
                  },
                  data: {
                    type: "schemaReference",
                    optional: true,
                    tag: {
                      id: 9,
                      defaultLabel: "Application Deployment Data",
                      editable: true,
                    },
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodObject",
                    },
                  },
                },
              },
            },
            "bdd7ad43-f0fc-4716-90c1-87454c40dd95": {
              uuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              name: "EntityDefinition",
              conceptLevel: "MetaModel",
              description: "definition of an entity",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: false,
                    },
                  },
                  conceptLevel: {
                    type: "enum",
                    definition: ["MetaModel", "Model", "Data"],
                    optional: true,
                    tag: {
                      id: 5,
                      defaultLabel: "Concept Level",
                      editable: false,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                  jzodSchema: {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodObject",
                    },
                    optional: true,
                    tag: {
                      id: 7,
                      defaultLabel: "Jzod Schema",
                      editable: true,
                    },
                  },
                },
              },
            },
            "c0b71083-8cc8-43db-bf52-572f1f03bbb5": {
              uuid: "c0b71083-8cc8-43db-bf52-572f1f03bbb5",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
              conceptLevel: "Model",
              name: "ApplicationVersionCrossEntityDefinition",
              description: "The mapping among Application Versions and Entity Definitions",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      description: "The Parent Entity of this Instance",
                      targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  description: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 6,
                      defaultLabel: "Description",
                      editable: true,
                    },
                  },
                  application: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 7,
                      defaultLabel: "Application",
                      description: "The Application of the Branch.",
                      targetEntity: "a659d350-dd97-4da9-91de-524fa01745dc",
                      editable: false,
                    },
                  },
                  applicationVersion: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 7,
                      defaultLabel: "Application Version",
                      description: "The Application Version of this mapping.",
                      targetEntity: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                      editable: false,
                    },
                  },
                  entity: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 7,
                      defaultLabel: "Entity",
                      description: "The Entity definition of this mapping.",
                      targetEntity: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
                      editable: false,
                    },
                  },
                },
              },
            },
            "f93af951-ea13-4815-a2e3-ec0cab1fadd2": {
              uuid: "f93af951-ea13-4815-a2e3-ec0cab1fadd2",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
              conceptLevel: "Model",
              name: "StoreBasedConfiguration",
              icon: "Interests",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  defaultLabel: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 5,
                      defaultLabel: "Default Label",
                      editable: true,
                    },
                  },
                  definition: {
                    type: "schemaReference",
                    optional: true,
                    tag: {
                      id: 8,
                      defaultLabel: "The configuration itself",
                      editable: true,
                    },
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodObject",
                    },
                  },
                },
              },
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_35c5608a-7678-4f07-a4ec-76fc5bc35424": {
          ids: ["10ff36f2-50a3-48d8-b80f-e48e5d13af8e"],
          entities: {
            "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
              uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
              parentName: "ApplicationDeploymentConfiguration",
              parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
              name: "DefaultMiroirApplicationDeployment",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              applicationModelLevel: "metamodel",
              description: "The default Deployment for Application Miroir",
              model: {
                location: {
                  type: "sql",
                  side: "server",
                  connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                  schema: "miroir",
                },
              },
              data: {
                location: {
                  type: "sql",
                  side: "server",
                  connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                  schema: "miroir",
                },
              },
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
          ids: [
            "0810de28-fdab-4baf-8935-7e04a8f779a9",
            "0e4cf674-3a26-422a-8618-09e32302ac0c",
            "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
            "43f04807-8f96-43f9-876f-9a0210f7b99c",
            "60648b22-e2c6-4b74-8031-53884f597d63",
            "8b22e84e-9374-4121-b2a7-d13d947a0ba2",
            "c9ea3359-690c-4620-9603-b5b402e4a2b9",
            "df0a9a8f-e0f6-4f9f-8635-c8460e638e1b",
            "f9aff35d-8636-4519-8361-c7648e0ddc68",
          ],
          entities: {
            "0810de28-fdab-4baf-8935-7e04a8f779a9": {
              uuid: "0810de28-fdab-4baf-8935-7e04a8f779a9",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "ApplicationVersionList",
              defaultLabel: "List of Aplication Versions",
              type: "list",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "ApplicationVersion",
                    parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                  },
                },
              },
            },
            "0e4cf674-3a26-422a-8618-09e32302ac0c": {
              uuid: "0e4cf674-3a26-422a-8618-09e32302ac0c",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "ApplicationList",
              defaultLabel: "List of Applications",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "Application",
                    parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
                  },
                },
              },
            },
            "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855": {
              uuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "ReportList",
              defaultLabel: "List of Reports",
              type: "list",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "Report",
                    parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
                  },
                },
              },
            },
            "43f04807-8f96-43f9-876f-9a0210f7b99c": {
              uuid: "43f04807-8f96-43f9-876f-9a0210f7b99c",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "StoreBasedConfigurationList",
              defaultLabel: "Store-based Configuration",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "StoreBasedConfiguration",
                    parentUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
                  },
                },
              },
            },
            "60648b22-e2c6-4b74-8031-53884f597d63": {
              uuid: "60648b22-e2c6-4b74-8031-53884f597d63",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "ApplicationModelBranchList",
              defaultLabel: "List of Application Model Branches",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "ApplicationModelBranch",
                    parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
                  },
                },
              },
            },
            "8b22e84e-9374-4121-b2a7-d13d947a0ba2": {
              uuid: "8b22e84e-9374-4121-b2a7-d13d947a0ba2",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "JzodSchemaList",
              defaultLabel: "List of Jzod Schemas",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "JzodSchema",
                    parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
                  },
                },
              },
            },
            "c9ea3359-690c-4620-9603-b5b402e4a2b9": {
              uuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "EntityList",
              defaultLabel: "List of Entities",
              type: "list",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "Entity",
                    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                },
              },
            },
            "df0a9a8f-e0f6-4f9f-8635-c8460e638e1b": {
              uuid: "df0a9a8f-e0f6-4f9f-8635-c8460e638e1b",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "ApplicationDeploymentList",
              defaultLabel: "List of Application Deployments",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "ApplicationDeploymentConfiguration",
                    parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
                  },
                },
              },
            },
            "f9aff35d-8636-4519-8361-c7648e0ddc68": {
              uuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              name: "EntityDefinitionList",
              defaultLabel: "List of Entity Definitions",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "Entity Definition",
                    parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
                  },
                },
              },
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_5e81e1b9-38be-487c-b3e5-53796c57fccf": {
          ids: ["04f8773e-1c9d-4e5a-853e-1f94982f2e94", "1e8dab4b-65a3-4686-922e-ce89a2d62aa9"],
          entities: {
            "04f8773e-1c9d-4e5a-853e-1f94982f2e94": {
              uuid: "04f8773e-1c9d-4e5a-853e-1f94982f2e94",
              parentName: "JzodSchema",
              parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
              name: "jzodBootstrapSchema",
              defaultLabel:
                "The Jzod Schema of all Jzod Schemas. Comes from the @miroir-framework/jzod library. Parses itself.",
              definition: {
                type: "object",
                definition: {
                  jzodArray: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "array",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  jzodAttribute: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "simpleType",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodEnumAttributeTypes",
                        },
                      },
                    },
                  },
                  jzodAttributeStringWithValidations: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "simpleType",
                      },
                      definition: {
                        type: "literal",
                        definition: "string",
                      },
                      validations: {
                        type: "array",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            relativePath: "jzodAttributeStringValidations",
                          },
                        },
                      },
                    },
                  },
                  jzodAttributeStringValidations: {
                    type: "object",
                    definition: {
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "enum",
                        definition: [
                          "max",
                          "min",
                          "length",
                          "email",
                          "url",
                          "emoji",
                          "uuid",
                          "cuid",
                          "cuid2",
                          "ulid",
                          "regex",
                          "includes",
                          "startsWith",
                          "endsWith",
                          "datetime",
                          "ip",
                        ],
                      },
                      parameter: {
                        type: "simpleType",
                        definition: "any",
                      },
                    },
                  },
                  jzodElement: {
                    type: "union",
                    discriminant: "type",
                    definition: [
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodArray",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodAttribute",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodAttributeStringWithValidations",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodEnum",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodFunction",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodLazy",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodLiteral",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodObject",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodRecord",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodReference",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodUnion",
                        },
                      },
                    ],
                  },
                  jzodElementSetSchema: {
                    type: "record",
                    definition: {
                      type: "schemaReference",
                      definition: {
                        relativePath: "jzodElement",
                      },
                    },
                  },
                  jzodEnum: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "enum",
                      },
                      definition: {
                        type: "array",
                        definition: {
                          type: "simpleType",
                          definition: "string",
                        },
                      },
                    },
                  },
                  jzodEnumAttributeTypes: {
                    type: "enum",
                    definition: ["any", "boolean", "number", "string", "uuid"],
                  },
                  jzodFunction: {
                    type: "object",
                    definition: {
                      type: {
                        type: "literal",
                        definition: "function",
                      },
                      args: {
                        type: "array",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            relativePath: "jzodAttribute",
                          },
                        },
                      },
                      returns: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodAttribute",
                        },
                        optional: true,
                      },
                    },
                  },
                  jzodLazy: {
                    type: "object",
                    definition: {
                      type: {
                        type: "literal",
                        definition: "lazy",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodFunction",
                        },
                      },
                    },
                  },
                  jzodLiteral: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "literal",
                      },
                      definition: {
                        type: "simpleType",
                        definition: "string",
                      },
                    },
                  },
                  jzodObject: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "object",
                      },
                      definition: {
                        type: "record",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            relativePath: "jzodElement",
                          },
                        },
                      },
                    },
                  },
                  jzodRecord: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "record",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  jzodReference: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "schemaReference",
                      },
                      definition: {
                        type: "object",
                        definition: {
                          relativePath: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                          },
                          absolutePath: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                          },
                        },
                      },
                    },
                  },
                  jzodUnion: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "literal",
                        definition: "union",
                      },
                      definition: {
                        type: "array",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            relativePath: "jzodElement",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": {
              uuid: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
              parentName: "JzodSchema",
              parentUuid: "5e81e1b9-38be-487c-b3e5-53796c57fccf",
              name: "jzodMiroirBootstrapSchema",
              defaultLabel: "The Jzod Schema for Miroir Jzod Schemas. Parses itself.",
              definition: {
                type: "schemaReference",
                context: {
                  jzodBaseObject: {
                    type: "object",
                    definition: {
                      optional: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      nullable: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      tag: {
                        type: "object",
                        definition: {
                          id: {
                            type: "simpleType",
                            definition: "number",
                          },
                          defaultLabel: {
                            type: "simpleType",
                            definition: "string",
                          },
                          editable: {
                            type: "simpleType",
                            definition: "boolean",
                          },
                        },
                        optional: true,
                      },
                    },
                  },
                  jzodArray: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "array",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  jzodAttribute: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "simpleType",
                      },
                      coerce: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodEnumAttributeTypes",
                        },
                      },
                    },
                  },
                  jzodAttributeDateValidations: {
                    type: "object",
                    definition: {
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "enum",
                        definition: ["min", "max"],
                      },
                      parameter: {
                        type: "simpleType",
                        definition: "any",
                      },
                    },
                  },
                  jzodAttributeDateWithValidations: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "simpleType",
                      },
                      definition: {
                        type: "literal",
                        definition: "date",
                      },
                      validations: {
                        type: "array",
                        optional: true,
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodAttributeDateValidations",
                          },
                        },
                      },
                    },
                  },
                  jzodAttributeNumberValidations: {
                    type: "object",
                    definition: {
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "enum",
                        definition: [
                          "gt",
                          "gte",
                          "lt",
                          "lte",
                          "int",
                          "positive",
                          "nonpositive",
                          "negative",
                          "nonnegative",
                          "multipleOf",
                          "finite",
                          "safe",
                        ],
                      },
                      parameter: {
                        type: "simpleType",
                        definition: "any",
                      },
                    },
                  },
                  jzodAttributeNumberWithValidations: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "simpleType",
                      },
                      definition: {
                        type: "literal",
                        definition: "number",
                      },
                      validations: {
                        type: "array",
                        optional: true,
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodAttributeNumberValidations",
                          },
                        },
                      },
                    },
                  },
                  jzodAttributeStringValidations: {
                    type: "object",
                    definition: {
                      tag: {
                        type: "record",
                        definition: {
                          type: "simpleType",
                          definition: "any",
                        },
                        optional: true,
                      },
                      type: {
                        type: "enum",
                        definition: [
                          "max",
                          "min",
                          "length",
                          "email",
                          "url",
                          "emoji",
                          "uuid",
                          "cuid",
                          "cuid2",
                          "ulid",
                          "regex",
                          "includes",
                          "startsWith",
                          "endsWith",
                          "datetime",
                          "ip",
                        ],
                      },
                      parameter: {
                        type: "simpleType",
                        definition: "any",
                      },
                    },
                  },
                  jzodAttributeStringWithValidations: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "simpleType",
                      },
                      definition: {
                        type: "literal",
                        definition: "string",
                      },
                      validations: {
                        type: "array",
                        optional: true,
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodAttributeStringValidations",
                          },
                        },
                      },
                    },
                  },
                  jzodElement: {
                    type: "union",
                    discriminator: "type",
                    definition: [
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodArray",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodAttribute",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodAttributeDateWithValidations",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodAttributeNumberWithValidations",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodAttributeStringWithValidations",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodEnum",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodFunction",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodLazy",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodLiteral",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodIntersection",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodMap",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodObject",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodPromise",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodRecord",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodReference",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodSet",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodTuple",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodUnion",
                        },
                      },
                    ],
                  },
                  jzodEnum: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "enum",
                      },
                      definition: {
                        type: "array",
                        definition: {
                          type: "simpleType",
                          definition: "string",
                        },
                      },
                    },
                  },
                  jzodEnumAttributeTypes: {
                    type: "enum",
                    definition: [
                      "any",
                      "bigint",
                      "boolean",
                      "date",
                      "never",
                      "null",
                      "number",
                      "string",
                      "uuid",
                      "undefined",
                      "unknown",
                      "void",
                    ],
                  },
                  jzodEnumElementTypes: {
                    type: "enum",
                    definition: [
                      "array",
                      "enum",
                      "function",
                      "lazy",
                      "literal",
                      "intersection",
                      "map",
                      "object",
                      "promise",
                      "record",
                      "schemaReference",
                      "set",
                      "simpleType",
                      "tuple",
                      "union",
                    ],
                  },
                  jzodFunction: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "function",
                      },
                      definition: {
                        type: "object",
                        definition: {
                          args: {
                            type: "array",
                            definition: {
                              type: "schemaReference",
                              definition: {
                                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                                relativePath: "jzodElement",
                              },
                            },
                          },
                          returns: {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                            optional: true,
                          },
                        },
                      },
                    },
                  },
                  jzodLazy: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "lazy",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodFunction",
                        },
                      },
                    },
                  },
                  jzodLiteral: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "literal",
                      },
                      definition: {
                        type: "simpleType",
                        definition: "string",
                      },
                    },
                  },
                  jzodIntersection: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "intersection",
                      },
                      definition: {
                        type: "object",
                        definition: {
                          left: {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                          right: {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                        },
                      },
                    },
                  },
                  jzodMap: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "map",
                      },
                      definition: {
                        type: "tuple",
                        definition: [
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodElement",
                            },
                          },
                        ],
                      },
                    },
                  },
                  jzodObject: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      extend: {
                        type: "union",
                        optional: true,
                        definition: [
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodReference",
                            },
                          },
                          {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                              relativePath: "jzodObject",
                            },
                          },
                        ],
                      },
                      type: {
                        type: "literal",
                        definition: "object",
                      },
                      nonStrict: {
                        type: "simpleType",
                        definition: "boolean",
                        optional: true,
                      },
                      definition: {
                        type: "record",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodElement",
                          },
                        },
                      },
                    },
                  },
                  jzodPromise: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "promise",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  jzodRecord: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "record",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  jzodReference: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "schemaReference",
                      },
                      context: {
                        type: "record",
                        optional: true,
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodElement",
                          },
                        },
                      },
                      definition: {
                        type: "object",
                        definition: {
                          eager: {
                            type: "simpleType",
                            definition: "boolean",
                            optional: true,
                          },
                          relativePath: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                          },
                          absolutePath: {
                            type: "simpleType",
                            definition: "string",
                            optional: true,
                          },
                        },
                      },
                    },
                  },
                  jzodSet: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "set",
                      },
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                  jzodTuple: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "tuple",
                      },
                      definition: {
                        type: "array",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodElement",
                          },
                        },
                      },
                    },
                  },
                  jzodUnion: {
                    type: "object",
                    extend: {
                      type: "schemaReference",
                      definition: {
                        eager: true,
                        absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                        relativePath: "jzodBaseObject",
                      },
                    },
                    definition: {
                      type: {
                        type: "literal",
                        definition: "union",
                      },
                      discriminator: {
                        type: "simpleType",
                        definition: "string",
                        optional: true,
                      },
                      definition: {
                        type: "array",
                        definition: {
                          type: "schemaReference",
                          definition: {
                            absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                            relativePath: "jzodElement",
                          },
                        },
                      },
                    },
                  },
                },
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "jzodElement",
                },
              },
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_7990c0c9-86c3-40a1-a121-036c91b55ed7": {
          ids: ["360fcf1f-f0d4-4f8a-9262-07886e70fa15"],
          entities: {
            "360fcf1f-f0d4-4f8a-9262-07886e70fa15": {
              uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              parentName: "Configuration",
              parentUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
              name: "Reference",
              defaultLabel: "The reference configuration for the database.",
              definition: {
                currentApplicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              },
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_8bec933d-6287-4de7-8a88-5c24216de9f4": {
          ids: [
            "17adb534-1dcb-4874-a4ef-6c1e03b31c4e",
            "48644159-66d4-426d-b38d-d083fd455e7b",
            "4aaba993-f0a1-4a26-b1ea-13b0ad532685",
            "9086f49a-0e81-4902-81f3-560186dee334",
            "ba38669e-ac6f-40ea-af14-bb200db251d8",
            "dc47438c-166a-4d19-aeba-ad70281afdf4",
            "ede7e794-5ae7-48a8-81c9-d1f82df11829",
          ],
          entities: {
            "17adb534-1dcb-4874-a4ef-6c1e03b31c4e": {
              uuid: "17adb534-1dcb-4874-a4ef-6c1e03b31c4e",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "381ab1be-337f-4198-b1d3-f686867fc1dd",
            },
            "48644159-66d4-426d-b38d-d083fd455e7b": {
              uuid: "48644159-66d4-426d-b38d-d083fd455e7b",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
            },
            "4aaba993-f0a1-4a26-b1ea-13b0ad532685": {
              uuid: "4aaba993-f0a1-4a26-b1ea-13b0ad532685",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "69bf7c03-a1df-4d1c-88c1-44363feeea87",
            },
            "9086f49a-0e81-4902-81f3-560186dee334": {
              uuid: "9086f49a-0e81-4902-81f3-560186dee334",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "27046fce-742f-4cc4-bb95-76b271f490a5",
            },
            "ba38669e-ac6f-40ea-af14-bb200db251d8": {
              uuid: "ba38669e-ac6f-40ea-af14-bb200db251d8",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "f93af951-ea13-4815-a2e3-ec0cab1fadd2",
            },
            "dc47438c-166a-4d19-aeba-ad70281afdf4": {
              uuid: "dc47438c-166a-4d19-aeba-ad70281afdf4",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "9460420b-f176-4918-bd45-894ab195ffe9",
            },
            "ede7e794-5ae7-48a8-81c9-d1f82df11829": {
              uuid: "ede7e794-5ae7-48a8-81c9-d1f82df11829",
              parentName: "ApplicationVersionCrossEntityDefinition",
              parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
              applicationVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              entityDefinition: "952d2c65-4da2-45c2-9394-a0920ceedfb6",
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_a659d350-dd97-4da9-91de-524fa01745dc": {
          ids: ["360fcf1f-f0d4-4f8a-9262-07886e70fa15"],
          entities: {
            "360fcf1f-f0d4-4f8a-9262-07886e70fa15": {
              uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              parentName: "Application",
              parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
              name: "Miroir",
              defaultLabel: "The Miroir application.",
              description:
                "This application contaies the Miroir meta-model, and the elements needed to perform the most fundamental application-editing tasks.",
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
          ids: ["695826c2-aefa-4f5f-a131-dee46fe21c13"],
          entities: {
            "695826c2-aefa-4f5f-a131-dee46fe21c13": {
              uuid: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              parentName: "ApplicationVersion",
              parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
              name: "Initial",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
              description: "Initial datastore Miroir application version",
              previousVersion: "",
              modelStructureMigration: [],
              modelCUDMigration: [],
            },
          },
        },
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e_data_cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
          ids: ["ad1ddc4e-556e-4598-9cff-706a2bde0be7"],
          entities: {
            "ad1ddc4e-556e-4598-9cff-706a2bde0be7": {
              uuid: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
              parentName: "ApplicationModelBranch",
              parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
              name: "master",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              headVersion: "695826c2-aefa-4f5f-a131-dee46fe21c13",
              description: "The master Branch of the Miroir Application",
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_a659d350-dd97-4da9-91de-524fa01745dc": {
          ids: ["5af03c98-fe5e-490b-b08f-e1230971c57f"],
          entities: {
            "5af03c98-fe5e-490b-b08f-e1230971c57f": {
              uuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
              parentName: "Application",
              parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
              name: "Library",
              defaultLabel: "The Library application.",
              description: "The model and data of the Library application.",
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_35c5608a-7678-4f07-a4ec-76fc5bc35424": {
          ids: [],
          entities: {},
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_cdb0aec6-b848-43ac-a058-fe2dbe5811f1": {
          ids: ["9034141b-0d0d-4beb-82af-dfc02be15c2d"],
          entities: {
            "9034141b-0d0d-4beb-82af-dfc02be15c2d": {
              uuid: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
              parentName: "ApplicationModelBranch",
              parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
              application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
              headVersion: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
              name: "master",
              description: "The master Branch of the Library Application",
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24": {
          ids: ["419773b4-a73c-46ca-8913-0ee27fb2ce0a"],
          entities: {
            "419773b4-a73c-46ca-8913-0ee27fb2ce0a": {
              uuid: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
              parentName: "ApplicationVersion",
              parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
              name: "Initial",
              application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
              branch: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
              description: "Initial Library application version",
              previousVersion: "",
              modelStructureMigration: [],
              modelCUDMigration: [],
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_16dbfe28-e1d7-4f20-9ba4-c1a9873202ad": {
          ids: [
            "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
            "a027c379-8468-43a5-ba4d-bf618be25cab",
            "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
            "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          ],
          entities: {
            "9ad64893-5f8f-4eaf-91aa-ffae110f88c8": {
              uuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Test",
              conceptLevel: "Model",
              description: "Test Entity.",
            },
            "a027c379-8468-43a5-ba4d-bf618be25cab": {
              uuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Publisher",
              conceptLevel: "Model",
              description: "The publisher of a book.",
            },
            "d7a144ff-d1b9-4135-800c-a7cfc1f38733": {
              uuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Author",
              conceptLevel: "Model",
              description: "The Author of a book.",
            },
            "e8ba151b-d68e-4cc3-9a83-3459d309ccf5": {
              uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              parentName: "Entity",
              parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              name: "Book",
              conceptLevel: "Model",
              description: "A book.",
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_54b9c72f-d4f3-4db9-9e0e-0dc840b530bd": {
          ids: [
            "797dd185-0155-43fd-b23f-f6d0af8cae06",
            "7a939fe8-d119-4e7f-ab94-95b2aae30db9",
            "83872519-ce34-4a24-b1db-b7bf604ebd3a",
            "b30b7180-f7dc-4cca-b4e8-e476b77fe61d",
          ],
          entities: {
            "797dd185-0155-43fd-b23f-f6d0af8cae06": {
              uuid: "797dd185-0155-43fd-b23f-f6d0af8cae06",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              conceptLevel: "Model",
              name: "Book",
              icon: "Book",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  author: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    optional: true,
                    tag: {
                      id: 5,
                      defaultLabel: "Author",
                      targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                      editable: true,
                    },
                  },
                  publisher: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    optional: true,
                    tag: {
                      id: 5,
                      defaultLabel: "Publisher",
                      targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
                      editable: true,
                    },
                  },
                },
              },
            },
            "7a939fe8-d119-4e7f-ab94-95b2aae30db9": {
              uuid: "7a939fe8-d119-4e7f-ab94-95b2aae30db9",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
              conceptLevel: "Model",
              name: "Publisher",
              description: "Publisher",
              icon: "building",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  icon: {
                    id: 5,
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      defaultLabel: "Icon",
                      editable: true,
                    },
                  },
                },
              },
            },
            "83872519-ce34-4a24-b1db-b7bf604ebd3a": {
              uuid: "83872519-ce34-4a24-b1db-b7bf604ebd3a",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
              conceptLevel: "Model",
              name: "Test",
              description: "Test Library Entity",
              icon: "building",
              jzodSchema: {
                type: "object",
                definition: {
                  try: {
                    type: "object",
                    definition: {
                      a: {
                        type: "simpleType",
                        definition: "string",
                        tag: {
                          id: 1,
                          defaultLabel: "A",
                          editable: true,
                        },
                      },
                      b: {
                        type: "object",
                        definition: {
                          inB1: {
                            type: "simpleType",
                            definition: "string",
                          },
                          inB2: {
                            type: "simpleType",
                            definition: "string",
                          },
                        },
                        tag: {
                          id: 2,
                          defaultLabel: "B",
                          editable: true,
                        },
                      },
                      c: {
                        type: "array",
                        definition: {
                          type: "simpleType",
                          definition: "string",
                        },
                        tag: {
                          id: 3,
                          defaultLabel: "C",
                          editable: true,
                        },
                      },
                      d: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodObject",
                        },
                        optional: true,
                        tag: {
                          id: 4,
                          defaultLabel: "D",
                          editable: true,
                        },
                      },
                      e: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodReference",
                        },
                        optional: true,
                        tag: {
                          id: 5,
                          defaultLabel: "E",
                          editable: true,
                        },
                      },
                      f: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodArray",
                        },
                        optional: true,
                        tag: {
                          id: 6,
                          defaultLabel: "F",
                          editable: true,
                        },
                      },
                    },
                  },
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  icon: {
                    id: 5,
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      defaultLabel: "Icon",
                      editable: true,
                    },
                  },
                },
              },
            },
            "b30b7180-f7dc-4cca-b4e8-e476b77fe61d": {
              uuid: "b30b7180-f7dc-4cca-b4e8-e476b77fe61d",
              parentName: "EntityDefinition",
              parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
              entityUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              conceptLevel: "Model",
              name: "Author",
              description: "author",
              icon: "Person",
              jzodSchema: {
                type: "object",
                definition: {
                  uuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 1,
                      defaultLabel: "Uuid",
                      editable: false,
                    },
                  },
                  parentName: {
                    type: "simpleType",
                    definition: "string",
                    optional: true,
                    tag: {
                      id: 2,
                      defaultLabel: "Entity Name",
                      editable: false,
                    },
                  },
                  parentUuid: {
                    type: "simpleType",
                    definition: "string",
                    validations: [
                      {
                        type: "uuid",
                      },
                    ],
                    tag: {
                      id: 3,
                      defaultLabel: "Entity Uuid",
                      editable: false,
                    },
                  },
                  name: {
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      id: 4,
                      defaultLabel: "Name",
                      editable: true,
                    },
                  },
                  icon: {
                    id: 5,
                    type: "simpleType",
                    definition: "string",
                    tag: {
                      defaultLabel: "Gender (narrow-minded)",
                      editable: true,
                    },
                  },
                },
              },
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_3f2baa83-3ef7-45ce-82ea-6a43f7a8c916": {
          ids: [
            "66a09068-52c3-48bc-b8dd-76575bbc8e72",
            "74b010b6-afee-44e7-8590-5f0849e4a5c9",
            "931dd036-dfce-4e47-868e-36dba3654816",
            "a77aa662-006d-46cd-9176-01f02a1a12dc",
            "c3503412-3d8a-43ef-a168-aa36e975e606",
          ],
          entities: {
            "66a09068-52c3-48bc-b8dd-76575bbc8e72": {
              uuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              conceptLevel: "Model",
              name: "AuthorList",
              defaultLabel: "List of Authors",
              definition: {
                parameters: {},
                section: {
                  type: "objectListReportSection",
                  definition: {
                    parentName: "Author",
                    parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                  },
                },
              },
            },
            "74b010b6-afee-44e7-8590-5f0849e4a5c9": {
              uuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              conceptLevel: "Model",
              name: "BookList",
              defaultLabel: "List of Books",
              definition: {
                parameters: {},
                selectData: {
                  books: {
                    type: "combinerByRelationReturningObjectList",
                    parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                  },
                },
                section: {
                  type: "list",
                  definition: [
                    {
                      type: "objectListReportSection",
                      definition: {
                        label: "Books",
                        parentName: "Book",
                        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                        fetchedDataReference: "books",
                      },
                    },
                  ],
                },
              },
            },
            "931dd036-dfce-4e47-868e-36dba3654816": {
              uuid: "931dd036-dfce-4e47-868e-36dba3654816",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              conceptLevel: "Model",
              name: "TestList",
              defaultLabel: "List of Library Tests Instances",
              type: "list",
              definition: {
                type: "objectListReportSection",
                definition: {
                  parentName: "Test",
                  parentUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
                },
              },
            },
            "a77aa662-006d-46cd-9176-01f02a1a12dc": {
              uuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              conceptLevel: "Model",
              name: "PubliserList",
              defaultLabel: "List of Publishers",
              type: "list",
              definition: {
                type: "objectListReportSection",
                definition: {
                  parentName: "Book",
                  parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
                },
              },
            },
            "c3503412-3d8a-43ef-a168-aa36e975e606": {
              uuid: "c3503412-3d8a-43ef-a168-aa36e975e606",
              parentName: "Report",
              parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
              conceptLevel: "Model",
              name: "BookDetails",
              defaultLabel: "Detailed information about a Book",
              definition: {
                selectData: {
                  book: {
                    type: "selectObjectByParameterValue",
                    parentName: "Book",
                    parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                    instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
                  },
                  publisher: {
                    type: "selectObjectByParameterValue",
                    parentName: "Publisher",
                    parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
                    rootObjectUuid: "516a7366-39e7-4998-82cb-80199a7fa667",
                    fetchedDataReference: "book",
                    fetchedDataReferenceAttribute: "publisher",
                  },
                  booksOfPublisher: {
                    type: "combinerByRelationReturningObjectList",
                    parentName: "Book",
                    parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                    entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                    rootObjectUuid: "516a7366-39e7-4998-82cb-80199a7fa667",
                    rootObjectAttribute: "publisher",
                  },
                },
                section: {
                  type: "list",
                  definition: [
                    {
                      type: "objectInstanceReportSection",
                      definition: {
                        label: "My Book",
                        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                        fetchedDataReference: "book",
                      },
                    },
                    {
                      type: "objectListReportSection",
                      definition: {
                        label: "Publisher's (${publisher.name}) Books",
                        parentName: "Book",
                        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                        fetchedDataReference: "booksOfPublisher",
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_model_7990c0c9-86c3-40a1-a121-036c91b55ed7": {
          ids: ["2e5b7948-ff33-4917-acac-6ae6e1ef364f"],
          entities: {
            "2e5b7948-ff33-4917-acac-6ae6e1ef364f": {
              uuid: "2e5b7948-ff33-4917-acac-6ae6e1ef364f",
              parentName: "Configuration",
              parentUuid: "7990c0c9-86c3-40a1-a121-036c91b55ed7",
              name: "Reference",
              defaultLabel: "The reference configuration for the Library application database schemas.",
              definition: {
                currentApplicationVersion: "TBD",
              },
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_9ad64893-5f8f-4eaf-91aa-ffae110f88c8": {
          ids: ["150bacfd-06d0-4ecb-828d-f5275494448a"],
          entities: {
            "150bacfd-06d0-4ecb-828d-f5275494448a": {
              uuid: "150bacfd-06d0-4ecb-828d-f5275494448a",
              parentName: "Test",
              parentUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
              name: "Test instance",
              try: {
                a: "on a réussi!",
                b: {
                  inB1: "on a encore réussi!",
                  inB2: "on a encore réussi 2!",
                },
                c: ["a", "bbbb", "c"],
                d: {
                  type: "object",
                  definition: {
                    optional: {
                      type: "simpleType",
                      definition: "boolean",
                      optional: false,
                    },
                    tag: {
                      optional: true,
                      type: "object",
                      definition: {
                        id: {
                          type: "simpleType",
                          definition: "number",
                        },
                        defaultLabel: {
                          type: "simpleType",
                          definition: "string",
                        },
                        editable: {
                          type: "simpleType",
                          definition: "boolean",
                        },
                      },
                    },
                    type: {
                      type: "literal",
                      definition: "object",
                    },
                    definition: {
                      type: "record",
                      definition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                          relativePath: "jzodElement",
                        },
                      },
                    },
                  },
                },
                e: {
                  type: "schemaReference",
                  definition: {
                    absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                    relativePath: "jzodReference",
                  },
                  optional: true,
                  tag: {
                    id: "5",
                    defaultLabel: "E",
                    editable: true,
                  },
                },
                f: {
                  type: "array",
                  definition: {
                    type: "schemaReference",
                    definition: {
                      absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                      relativePath: "jzodElement",
                    },
                  },
                },
              },
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_a027c379-8468-43a5-ba4d-bf618be25cab": {
          ids: [
            "1f550a2a-33f5-4a56-83ee-302701039494",
            "516a7366-39e7-4998-82cb-80199a7fa667",
            "c1c97d54-aba8-4599-883a-7fe8f3874095",
          ],
          entities: {
            "1f550a2a-33f5-4a56-83ee-302701039494": {
              uuid: "1f550a2a-33f5-4a56-83ee-302701039494",
              parentName: "Publisher",
              parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
              name: "Penguin",
              icon: "",
            },
            "516a7366-39e7-4998-82cb-80199a7fa667": {
              uuid: "516a7366-39e7-4998-82cb-80199a7fa667",
              parentName: "Publisher",
              parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
              name: "Folio",
            },
            "c1c97d54-aba8-4599-883a-7fe8f3874095": {
              uuid: "c1c97d54-aba8-4599-883a-7fe8f3874095",
              parentName: "Publisher",
              parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
              name: "Springer",
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_d7a144ff-d1b9-4135-800c-a7cfc1f38733": {
          ids: [
            "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
            "ce7b601d-be5f-4bc6-a5af-14091594046a",
            "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
            "e4376314-d197-457c-aa5e-d2da5f8d5977",
          ],
          entities: {
            "4441169e-0c22-4fbc-81b2-28c87cf48ab2": {
              uuid: "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
              parentName: "Author",
              parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              name: "Don Norman",
            },
            "ce7b601d-be5f-4bc6-a5af-14091594046a": {
              uuid: "ce7b601d-be5f-4bc6-a5af-14091594046a",
              parentName: "Author",
              parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              name: "Paul Veyne",
            },
            "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17": {
              uuid: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
              parentName: "Author",
              parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              conceptLevel: "Data",
              name: "Cornell Woolrich",
            },
            "e4376314-d197-457c-aa5e-d2da5f8d5977": {
              uuid: "e4376314-d197-457c-aa5e-d2da5f8d5977",
              parentName: "Author",
              parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              conceptLevel: "Data",
              name: "Catherine Guérard",
            },
          },
        },
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4_data_e8ba151b-d68e-4cc3-9a83-3459d309ccf5": {
          ids: [
            "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
            "6fefa647-7ecf-4f83-b617-69d7d5094c37",
            "c6852e89-3c3c-447f-b827-4b5b9d830975",
            "c97be567-bd70-449f-843e-cd1d64ac1ddd",
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
            "e20e276b-619d-4e16-8816-b7ec37b53439",
          ],
          entities: {
            "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7": {
              uuid: "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              name: "Renata n'importe quoi",
              author: "e4376314-d197-457c-aa5e-d2da5f8d5977",
              conceptLevel: "",
              publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
            },
            "6fefa647-7ecf-4f83-b617-69d7d5094c37": {
              uuid: "6fefa647-7ecf-4f83-b617-69d7d5094c37",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              name: "The Bride Wore Black",
              author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
              conceptLevel: "",
              publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095",
            },
            "c6852e89-3c3c-447f-b827-4b5b9d830975": {
              uuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              conceptLevel: "Data",
              name: "Le Pain et le Cirque",
              author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
              publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
            },
            "c97be567-bd70-449f-843e-cd1d64ac1ddd": {
              uuid: "c97be567-bd70-449f-843e-cd1d64ac1ddd",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              name: "Rear Window",
              author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
              conceptLevel: "",
              publisher: "1f550a2a-33f5-4a56-83ee-302701039494",
            },
            "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
              uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              conceptLevel: "Data",
              name: "Et dans l'éternité je ne m'ennuierai pas",
              author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
              publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
            },
            "e20e276b-619d-4e16-8816-b7ec37b53439": {
              uuid: "e20e276b-619d-4e16-8816-b7ec37b53439",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              name: "The Design of Everyday Things",
              author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2",
              conceptLevel: "",
              publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095",
            },
          },
        },
      } as any; // TODO: fix minor typing issues
      // console.log("################################ result", JSON.stringify(result, null, 2));
      // console.log("################################ expectedResult", JSON.stringify(expectedResult,null,2))
      expect(result).toEqual(expectedResult);

      console.log("transformer_menu_addItem END");
    }
  );

});