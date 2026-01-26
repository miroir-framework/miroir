import { describe, it, expect } from 'vitest';
import instanceEndpointV1 from '../../../miroir-core/src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json';
// import instanceEndpointV1 from 'miroir-core';
import { mcpToolDescriptionFromActionDefinition } from '../../src/tools/mcpToolDescriptionFromActionDefinition';
import type { application } from 'express';
import { conceptLevel } from 'miroir-core';

// console.log('instanceEndpointV1:', JSON.stringify(instanceEndpointV1, null, 2));
describe('mcpToolDescriptionFromActionDefinition', () => {
  it('should generate mcpToolDescription for createInstance action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_createInstance',
      instanceEndpointV1 as any
    );

    const expected = {
      name: "miroir_createInstance",
      description:
        "Create new entity instances in Miroir. Creates one or more instances of a specific entity type in the specified application deployment.",
      inputSchema: {
        type: "object",
        additionalProperties: true,
        properties: {
          application: {
            type: "string",
            description: "Application UUID where instances will be created",
          },
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "A section of the application (model or data)",
          },
          parentUuid: {
            type: "string",
            description: "Entity UUID (parent entity of the instances to create)",
          },
          objects: {
            type: "array",
            description: "Array of entity instances to create. Each must have uuid and parentUuid.",
            items: {
              type: "object",
              properties: {
                parentName: {
                  type: "string",
                  description: "Parent Name",
                },
                parentUuid: {
                  type: "string",
                  description: "Parent Uuid",
                },
                applicationSection: {
                  type: "string",
                  enum: ["model", "data"],
                  description: "A section of the application (model or data)",
                },
                instances: {
                  type: "array",
                  description: "instances to be created",
                  items: {
                    type: "object",
                    properties: {
                      uuid: { type: "string", description: "Uuid" },
                      parentName: { type: "string", description: "Entity Name" },
                      parentUuid: { type: "string", description: "Entity Uuid" },
                      conceptLevel: {
                        type: "string",
                        enum: ["MetaModel", "Model", "Data"],
                        description: "Concept Level",
                      },
                    },
                    required: ["uuid", "parentUuid"],
                    additionalProperties: true,
                  }
                }
              },
              required: ["parentUuid", "applicationSection", "instances"],
              additionalProperties: true,
            },
          },
        },
        required: ["application", "applicationSection", "parentUuid", "objects"],
      },
    };

    expect(result).toEqual(expected);
  });

  it('should generate mcpToolDescription for getInstance action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_getInstance',
      instanceEndpointV1 as any
    );

    const expected = {
      name: "miroir_getInstance",
      description:
        "Retrieve a single entity instance by UUID. Returns the complete instance data for the specified entity instance.",
      inputSchema: {
        type: "object",
        additionalProperties: true,
        properties: {
          application: {
            type: "string",
            description: "UUID of Application to query",
          },
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "A section of the application (model or data)",
          },
          parentUuid: {
            type: "string",
            description: "UUID of Entity (parent entity)",
          },
          uuid: {
            type: "string",
            description: "UUID of Instance to retrieve",
          },
        },
        required: ["application", "applicationSection", "parentUuid", "uuid"],
      },
    };

    expect(result).toEqual(expected);
  });

  it('should generate mcpToolDescription for getInstances action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_getInstances',
      instanceEndpointV1 as any
    );

    const expected = {
      name: "miroir_getInstances",
      description:
        "Retrieve all instances of a specific entity type. Returns an array of all instances for the given entity.",
      inputSchema: {
        type: "object",
        additionalProperties: true,
        properties: {
          application: {
            type: "string",
            description: "Application UUID to query",
          },
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "A section of the application (model or data)",
          },
          parentUuid: {
            type: "string",
            description: "Entity UUID to get all instances for",
          },
        },
        required: ["application", "applicationSection", "parentUuid"],
      },
    };

    expect(result).toEqual(expected);
  });

  it('should generate mcpToolDescription for updateInstance action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_updateInstance',
      instanceEndpointV1 as any
    );

    console.log('result:', JSON.stringify(result, null, 2));
    const expected = {
      name: "miroir_updateInstance",
      description:
        "Update existing entity instances. Updates one or more instances with new data. Instances are identified by their uuid and parentUuid.",
      inputSchema: {
        type: "object",
        properties: {
          application: {
            type: "string",
            description: "Application UUID",
          },
          applicationSection: {
            type: "string",
            description: "A section of the application (model or data)",
            enum: ["model", "data"],
          },
          includeInTransaction: {
            type: "boolean",
            description: "Set to true to include update in a transaction",
          },
          parentUuid: {
            type: "string",
            description: "The Entity UUID of which instances will be updated",
          },
          objects: {
            type: "array",
            description: "Array of entity instances to be updated",
            items: {
              type: "object",
              properties: {
                parentName: {
                  type: "string",
                  description: "Parent Name",
                },
                parentUuid: {
                  type: "string",
                  description: "Parent Name",
                },
                applicationSection: {
                  type: "string",
                  description: "A section of the application (model or data)",
                  enum: ["model", "data"],
                },
                instances: {
                  type: "array",
                  description: "",
                  items: {
                    type: "object",
                    properties: {
                      uuid: {
                        type: "string",
                        description: "Uuid",
                      },
                      parentName: {
                        type: "string",
                        description: "Entity Name",
                      },
                      parentUuid: {
                        type: "string",
                        description: "Entity Uuid",
                      },
                      conceptLevel: {
                        type: "string",
                        description: "Concept Level",
                        enum: ["MetaModel", "Model", "Data"],
                      },
                    },
                    required: ["uuid", "parentUuid"],
                    additionalProperties: true,
                  },
                },
              },
              required: ["parentUuid", "applicationSection", "instances"],
              additionalProperties: true,
            },
          },
        },
        required: ["application", "applicationSection", "parentUuid", "objects"],
        additionalProperties: true,
      },
    };

    expect(result).toEqual(expected);
  });
});
