import { describe, it, expect } from 'vitest';
import { instanceEndpointV1 } from 'miroir-test-app_deployment-miroir';
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
        properties: {
          application: {
            type: "string",
            description: "Application UUID where instances will be created",
          },
          parentUuid: {
            type: "string",
            description: "UUID of parent entity under which instances will be created",
          },
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "A section of the application (model or data)",
          },
          objects: {
            type: "array",
            description: "Array of entity instances to create. Each must have uuid and parentUuid.",
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
                  enum: ["MetaModel", "Model", "Data", "External"],
                },
              },
              required: [],
              additionalProperties: true,
            },
          },
        },
        required: ["application", "applicationSection", "objects"],
        additionalProperties: true,
      },
    };
    // console.log('result:', JSON.stringify(result, null, 2));
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
      "miroir_updateInstance",
      instanceEndpointV1 as any,
    );

    // console.log("result:", JSON.stringify(result, null, 2));
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
          parentUuid: {
            type: "string",
            description: "UUID of parent entity under which instances will be deleted",
          },
          includeInTransaction: {
            type: "boolean",
            description: "Set to true to include update in a transaction",
          },
          objects: {
            type: "array",
            description: "Array of entity instances to be updated",
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
                  enum: ["MetaModel", "Model", "Data", "External"],
                },
              },
              required: [],
              additionalProperties: true,
            },
          },
        },
        required: ["application", "applicationSection", "objects"],
        additionalProperties: true,
      },
    };
    expect(result).toEqual(expected);
  });
});
