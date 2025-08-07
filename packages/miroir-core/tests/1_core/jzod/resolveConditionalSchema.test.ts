import { beforeEach, describe, expect, it } from "vitest";
import { adminConfigurationDeploymentLibrary } from "../../../dist/index.cjs";
import { deployment, JzodElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "../../../src/0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "../../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { resolveConditionalSchema } from "../../../src/1_core/jzod/resolveConditionalSchema";
import { domainStateToReduxDeploymentsState } from "../../../src/tools";
import domainStateImport from "../../2_domain/domainState.json";


import entityBook from "../../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";

const domainState: DomainState = domainStateImport as DomainState;
const reduxDeploymentsState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);

describe("resolveConditionalSchema", () => {
  const testObject = { a: { b: "test" }, c: { d: "book", e: entityBook.uuid } };
  const libraryDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
  const bookEntityUuid = entityBook.uuid;

  // beforeEach(() => {
  // });

  it("returns the original schema if no conditionalMMLS tag is present", async () => {
    const schema: JzodElement = { type: "string" };
    const result = resolveConditionalSchema(schema, {}, [], undefined, undefined, "defaultValue");
    expect(result).toBe(schema);
  });

  it("returns the original schema if conditionalMMLS tag is present but no parentUuid", async () => {
    const schema: JzodElement = {
      type: "string",
      tag: { value: { conditionalMMLS: {} } }
    };
    const result = resolveConditionalSchema(schema, {}, [], undefined, undefined);
    expect(result).toBe(schema);
  });

  it("throws if reduxDeploymentsState is missing when parentUuid is present", async () => {
    const testSchema: JzodElement = {
      type: "object",
      definition: {
        a: {
          type: "object",
          definition: {
            b: { type: "string" },
          },
        },
        c: {
          type: "object",
          definition: {
            d: {
              type: "any",
              tag: { value: { conditionalMMLS: { parentUuid: { path: bookEntityUuid } } } },
            },
          },
        },
      },
    };
    const result = resolveConditionalSchema(
      (testSchema.definition.c as any).definition.d,
      testObject,
      ["c", "d"],
      undefined, // reduxDeploymentsState,
      libraryDeploymentUuid,
      "defaultValue"
    );

    expect(result).toEqual({ error: 'NO_REDUX_DEPLOYMENTS_STATE' });
  });

  it("returns error if deploymentUuid is missing when parentUuid is present", async () => {
    const testSchema: JzodElement = {
      type: "object",
      definition: {
        a: {
          type: "object",
          definition: {
            b: { type: "string" },
          },
        },
        c: {
          type: "object",
          definition: {
            d: {
              type: "any",
              tag: { value: { conditionalMMLS: { parentUuid: { path: bookEntityUuid } } } },
            },
          },
        },
      },
    };
    const result = resolveConditionalSchema(
      (testSchema.definition.c as any).definition.d,
      testObject,
      ["c", "d"],
      reduxDeploymentsState, // reduxDeploymentsState,
      undefined,
      "defaultValue"
    );

    expect(result).toEqual({ error: 'NO_DEPLOYMENT_UUID' });
  });

  it("returns error if no value found at given parentUuid path", async () => {
    const testSchema: JzodElement = {
      type: "object",
      definition: {
        a: {
          type: "object",
          definition: {
            b: { type: "string" },
          },
        },
        c: {
          type: "object",
          definition: {
            d: {
              type: "any",
              tag: { value: { conditionalMMLS: { parentUuid: { path: "#.notExistingAttribute" } } } },
            },
          },
        },
      },
    };
    const result = resolveConditionalSchema(
      (testSchema.definition.c as any).definition.d,
      testObject,
      ["c", "d"],
      reduxDeploymentsState, // reduxDeploymentsState,
      libraryDeploymentUuid,
      "defaultValue"
    );

    console.log("result", JSON.stringify(result, null, 2));
    expect(result).toEqual({
      error: "INVALID_PARENT_UUID_CONFIG",
      details:
        'parentUuid resolution failed: {\n  "error": "PATH_SEGMENT_NOT_FOUND",\n  "segment": "notExistingAttribute",\n  "acc": {\n    "d": "book",\n    "e": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"\n  }\n}',
    });
  });

  // ##############################################################################################
  it("resolves schema using legacy single path configuration", async () => {
    const testSchema: JzodElement = {
      type: "object",
      definition: {
        a: {
          type: "object",
          definition: {
            b: { type: "string" },
          },
        },
        c: {
          type: "object",
          definition: {
            d: {
              type: "any",
              tag: { value: { conditionalMMLS: { parentUuid: { path: "#.e" } } } },
            },
            e: {
              type: "string",
            }
          },
        },
      },
    };
    const result = resolveConditionalSchema(
      (testSchema.definition.c as any).definition.d,
      testObject,
      ["c", "d"],
      reduxDeploymentsState, // reduxDeploymentsState,
      libraryDeploymentUuid,
      "defaultValue"
    );

    expect(result).toEqual({
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
    });
  });

  // it("resolves schema using dual path configuration for defaultValue context", async () => {
  //   const schema: JzodElement = {
  //     type: "string",
  //     tag: {
  //       value: {
  //         conditionalMMLS: {
  //           parentUuid: {
  //             defaultValuePath: "foo.bar",
  //             typeCheckPath: "foo.baz"
  //           }
  //         }
  //       }
  //     }
  //   };
  //   const result = resolveConditionalSchema(
  //     schema,
  //     { foo: { bar: dummyParentUuid } },
  //     ["foo", "bar"],
  //     dummyReduxDeploymentsState,
  //     dummyDeploymentUuid,
  //     "defaultValue"
  //   );
  //   expect(result).toEqual(dummyEntityDefinition.jzodSchema);
  // });

  // it("resolves schema using dual path configuration for typeCheck context", async () => {
  //   const schema: JzodElement = {
  //     type: "string",
  //     tag: {
  //       value: {
  //         conditionalMMLS: {
  //           parentUuid: {
  //             defaultValuePath: "foo.bar",
  //             typeCheckPath: "foo.baz"
  //           }
  //         }
  //       }
  //     }
  //   };
  //   const result = resolveConditionalSchema(
  //     schema,
  //     { foo: { baz: dummyParentUuid } },
  //     ["foo", "baz"],
  //     dummyReduxDeploymentsState,
  //     dummyDeploymentUuid,
  //     "typeCheck"
  //   );
  //   expect(result).toEqual(dummyEntityDefinition.jzodSchema);
  // });
});