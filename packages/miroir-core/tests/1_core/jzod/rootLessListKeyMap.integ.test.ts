import { describe, expect, it } from "vitest";
import {
  JzodElement,
  JzodObject,
  JzodSchema,
  MetaModel,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { rootLessListKeyMap } from "../../../src/1_core/jzod/rootLessListKeyMap";

import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";


const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as JzodSchema;

describe("rootLessListKeyMap", () => {
  const mockMiroirFundamentalJzodSchema = {} as JzodSchema;
  const mockCurrentModel = {} as MetaModel;
  const mockMiroirMetaModel = {} as MetaModel;

  // ##############################################################################################
  it("inconsistency: string value and  object schema should throw an error", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodObject = {
      type: "object",
      definition: {
        name: { type: "string" },
      },
    };
    const currentValue = "John";

    // Assert
    expect(() =>
      rootLessListKeyMap(
        rootLessListKey,
        resolvedJzodSchema,
        mockCurrentModel,
        mockMiroirMetaModel,
        mockMiroirFundamentalJzodSchema,
        currentValue
      )
    ).toThrow(/could not resolve jzod schema/);
  });

  // ##############################################################################################
  it("should handle an empty object value", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodObject = {
      type: "object",
      definition: {},
    };
    const currentValue = {};

    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );

    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: resolvedJzodSchema,
      },
    });
  });

  // ##############################################################################################
  it("should handle an empty array value", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodElement = {
      type: "array",
      definition: { type: "any" },
    };
    const currentValue: any[] = [];
    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );
    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: {
          type: "tuple",
          definition: [],
        },
      },
    });
  });

  // ##############################################################################################
  it("simple object value: should return a map with the root key and resolved schema", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodObject = {
      type: "object",
      definition: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const currentValue = { name: "John", age: 30 };

    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );

    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: resolvedJzodSchema,
      },
      [rootLessListKey + ".name"]: {
        resolvedElementJzodSchema: {
          type: "string",
        },
      },
      [rootLessListKey + ".age"]: {
        resolvedElementJzodSchema: {
          type: "number",
        },
      },
    });
  });

  // ##############################################################################################
  it("should handle a nested object value", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodObject = {
      type: "object",
      definition: {
        person: {
          type: "object",
          definition: {
            name: { type: "string" },
            address: {
              type: "object",
              definition: {
                city: { type: "string" },
                zipCode: { type: "string" },
              },
            },
          },
        },
      },
    };
    const currentValue = {
      person: {
        name: "John",
        address: {
          city: "New York",
          zipCode: "10001",
        },
      },
    };

    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );

    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: resolvedJzodSchema,
      },
      [rootLessListKey + ".person"]: {
        resolvedElementJzodSchema: resolvedJzodSchema.definition.person,
      },
      [rootLessListKey + ".person.name"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".person.address"]: {
        resolvedElementJzodSchema: (resolvedJzodSchema.definition.person as JzodObject).definition.address,
      },
      [rootLessListKey + ".person.address.city"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".person.address.zipCode"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
    });
  });

  // ##############################################################################################
  it("simple array value: should return a map with the root key and resolved schema", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodElement = {
      type: "array",
      definition: { type: "string" },
    };
    const currentValue: string[] = ["apple", "banana", "cherry"];

    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );

    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: {
          type: "tuple",
          definition: [
            { type: "string" },
            { type: "string" },
            { type: "string" },
          ]
        },
      },
      [rootLessListKey + ".0"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".1"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".2"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
    });
  });

  // ############################################################################################
  it("simple tuple value: should return a map with the root key and resolved schema", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodElement = {
      type: "tuple",
      definition: [
        { type: "string" },
        { type: "number" },
      ],
    };
    const currentValue: [string, number] = ["apple", 1];

    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );

    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: resolvedJzodSchema,
      },
      [rootLessListKey + ".0"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".1"]: {
        resolvedElementJzodSchema: { type: "number" },
      },
    });
  });

  // #################################################################################################
  it("simple tuple inside an array value: should return a map with the root key and resolved schema", () => {
    // Mock data
    const rootLessListKey = "testKey";
    const resolvedJzodSchema: JzodElement = {
      type: "array",
      definition: {
        type: "tuple",
        definition: [
          { type: "string" },
          { type: "number" },
        ],
      },
    };
    const currentValue: [string, number][] = [
      ["apple", 1],
      ["banana", 2],
    ];

    // Execute function
    const result = rootLessListKeyMap(
      rootLessListKey,
      resolvedJzodSchema,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );

    expect(result).toEqual({
      [rootLessListKey]: {
        resolvedElementJzodSchema: {
          type: "tuple",
          definition: [
            { type: "tuple", definition: [{ type: "string" }, { type: "number" }]},
            { type: "tuple", definition: [{ type: "string" }, { type: "number" }]},
          ]
        }
      },
      [rootLessListKey + ".0"]: {
        resolvedElementJzodSchema: { type: "tuple", definition: [{ type: "string" }, { type: "number" }] },
      },
      [rootLessListKey + ".0.0"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".0.1"]: {
        resolvedElementJzodSchema: { type: "number" },
      },
      [rootLessListKey + ".1"]: {
        resolvedElementJzodSchema: { type: "tuple", definition: [{ type: "string" }, { type: "number" }] },
      },
      [rootLessListKey + ".1.0"]: {
        resolvedElementJzodSchema: { type: "string" },
      },
      [rootLessListKey + ".1.1"]: {
        resolvedElementJzodSchema: { type: "number" },
      },
    });
  });


  // ##############################################################################################
  it("real case: objectListReportSection for Author's list", () => {
    // Mock data
    const rootLessListKey = "testKey";

    const rawJzodSchema: JzodElement = {
      type: "schemaReference",
      definition: {
        absolutePath: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        relativePath: "objectListReportSection",
      },
    }
    const currentValue: any[] = [
      {
        type: "objectListReportSection",
        definition: {
          parentName: "Author",
          parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          label: "Authors",
          fetchedDataReference: "authors",
          sortByAttribute: "name",
        },
      },
    ];
    const resolvedJzodSchemaByHand: JzodElement = {
      type: "tuple",
      definition: [
        {
          type: "object",
          definition: {
            type: { type: "literal", definition: "objectListReportSection" },
            definition: {
              type: "object",
              definition: {
                parentName: {
                  type: "string",
                  optional: true,
                  tag: { value: { id: 2, defaultLabel: "Entity Name", editable: false } },
                },
                parentUuid: {
                  type: "uuid",
                  tag: {
                    value: {
                      id: 2,
                      defaultLabel: "Entity Uuid",
                      targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      editable: false,
                    },
                  },
                },
                label: {
                  type: "string",
                  optional: true,
                  tag: { value: { id: 1, defaultLabel: "Label", editable: false } },
                },
                fetchedDataReference: {
                  type: "string",
                  optional: true,
                  tag: {
                    value: { id: 3, defaultLabel: "Fetched Data Reference", editable: false },
                  },
                },
                sortByAttribute: { type: "string", optional: true },
              },
            },
          },
        },
      ],
    };
    const result = rootLessListKeyMap(
      // rootLessListKey,
      "",
      resolvedJzodSchemaByHand,
      mockCurrentModel,
      mockMiroirMetaModel,
      mockMiroirFundamentalJzodSchema,
      currentValue
    );
    // console.log(JSON.stringify(result, null,2));
    expect(result).toEqual({
      "0": {
        resolvedElementJzodSchema: {
          type: "object",
          definition: {
            type: {
              type: "literal",
              definition: "objectListReportSection",
            },
            definition: {
              type: "object",
              definition: {
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
                  type: "uuid",
                  tag: {
                    value: {
                      id: 2,
                      defaultLabel: "Entity Uuid",
                      targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      editable: false,
                    },
                  },
                },
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
                fetchedDataReference: {
                  type: "string",
                  optional: true,
                  tag: {
                    value: {
                      id: 3,
                      defaultLabel: "Fetched Data Reference",
                      editable: false,
                    },
                  },
                },
                sortByAttribute: {
                  type: "string",
                  optional: true,
                },
              },
            },
          },
        },
      },
      "": {
        resolvedElementJzodSchema: {
          type: "tuple",
          definition: [
            {
              type: "object",
              definition: {
                type: {
                  type: "literal",
                  definition: "objectListReportSection",
                },
                definition: {
                  type: "object",
                  definition: {
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
                      type: "uuid",
                      tag: {
                        value: {
                          id: 2,
                          defaultLabel: "Entity Uuid",
                          targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                          editable: false,
                        },
                      },
                    },
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
                    fetchedDataReference: {
                      type: "string",
                      optional: true,
                      tag: {
                        value: {
                          id: 3,
                          defaultLabel: "Fetched Data Reference",
                          editable: false,
                        },
                      },
                    },
                    sortByAttribute: {
                      type: "string",
                      optional: true,
                    },
                  },
                },
              },
            },
          ],
        },
      },
      "0.type": {
        resolvedElementJzodSchema: {
          type: "literal",
          definition: "objectListReportSection",
        },
      },
      "0.definition": {
        resolvedElementJzodSchema: {
          type: "object",
          definition: {
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
              type: "uuid",
              tag: {
                value: {
                  id: 2,
                  defaultLabel: "Entity Uuid",
                  targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  editable: false,
                },
              },
            },
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
            fetchedDataReference: {
              type: "string",
              optional: true,
              tag: {
                value: {
                  id: 3,
                  defaultLabel: "Fetched Data Reference",
                  editable: false,
                },
              },
            },
            sortByAttribute: {
              type: "string",
              optional: true,
            },
          },
        },
      },
      "0.definition.parentName": {
        resolvedElementJzodSchema: {
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
      },
      "0.definition.parentUuid": {
        resolvedElementJzodSchema: {
          type: "uuid",
          tag: {
            value: {
              id: 2,
              defaultLabel: "Entity Uuid",
              targetEntity: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              editable: false,
            },
          },
        },
      },
      "0.definition.label": {
        resolvedElementJzodSchema: {
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
      },
      "0.definition.fetchedDataReference": {
        resolvedElementJzodSchema: {
          type: "string",
          optional: true,
          tag: {
            value: {
              id: 3,
              defaultLabel: "Fetched Data Reference",
              editable: false,
            },
          },
        },
      },
      "0.definition.sortByAttribute": {
        resolvedElementJzodSchema: {
          type: "string",
          optional: true,
        },
      },
    });
  });


  // ##############################################################################################
  // it("should throw an error when jzodTypeCheck returns undefined", () => {
  //   // Mock data
  //   const rootLessListKey = "testKey";
  //   const rawJzodSchema: JzodObject = {
  //     type: "object",
  //     definition: {},
  //   };
  //   const currentValue = {};

  //   // Setup mock return value
  //   (mockedJzodTypeCheck as vi.Mock).mockReturnValue(undefined);

  //   // Assert
  //   expect(() =>
  //     rootLessListKeyMap(
  //       rootLessListKey,
  //       rawJzodSchema,
  //       mockCurrentModel,
  //       mockMiroirMetaModel,
  //       mockMiroirFundamentalJzodSchema,
  //       currentValue
  //     )
  //   ).toThrow(/could not resolve jzod schema/);
  // });

  // it("should throw an error when jzodTypeCheck returns an error status", () => {
  //   // Mock data
  //   const rootLessListKey = "testKey";
  //   const rawJzodSchema: JzodObject = {
  //     type: "object",
  //     definition: {},
  //   };
  //   const currentValue = {};

  //   // Setup mock return value
  //   (jzodTypeCheck as vi.Mock).mockReturnValue({
  //     status: "error",
  //     error: "Something went wrong",
  //   });

  //   // Assert
  //   expect(() =>
  //     rootLessListKeyMap(
  //       rootLessListKey,
  //       rawJzodSchema,
  //       mockCurrentModel,
  //       mockMiroirMetaModel,
  //       mockMiroirFundamentalJzodSchema,
  //       currentValue
  //     )
  //   ).toThrow(/could not resolve jzod schema/);
  // });

  // it("should handle undefined rawJzodSchema", () => {
  //   // Mock data
  //   const rootLessListKey = "testKey";
  //   const rawJzodSchema = undefined;
  //   const currentValue = {};

  //   // Assert
  //   expect(() =>
  //     rootLessListKeyMap(
  //       rootLessListKey,
  //       rawJzodSchema,
  //       mockCurrentModel,
  //       mockMiroirMetaModel,
  //       mockMiroirFundamentalJzodSchema,
  //       currentValue
  //     )
  //   ).toThrow(/could not resolve jzod schema/);
  // });
});
