import { describe, it, expect } from 'vitest';
import instanceEndpointV1 from '../../../miroir-core/src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json';
import { mcpToolDescriptionFromActionDefinition } from '../../src/tools/mcpToolDescriptionFromActionDefinition';

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
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "Section where instances will be created (model or data)",
          },
          parentUuid: {
            type: "string",
            description: "Entity UUID (parent entity of the instances to create)",
          },
          instances: {
            type: "array",
            description: "Array of entity instances to create. Each must have uuid and parentUuid.",
            items: {
              type: "object",
              properties: {
                uuid: { type: "string", description: "Instance UUID" },
                parentUuid: { type: "string", description: "Parent entity UUID" },
              },
              required: ["uuid", "parentUuid"],
              additionalProperties: true,
            },
          },
        },
        required: ["application", "applicationSection", "parentUuid", "instances"],
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
        properties: {
          application: {
            type: "string",
            description: "UUID of Application to query",
          },
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "Section to query (model or data)",
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
        properties: {
          application: {
            type: "string",
            description: "Application UUID to query",
          },
          applicationSection: {
            type: "string",
            enum: ["model", "data"],
            description: "Section to query (model or data)",
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
            enum: ["model", "data"],
            description: "Section where instances will be updated",
          },
          includeInTransaction: {
            type: "string",
            description: "Set to true to include update in a transaction",
          },
          instances: {
            type: "array",
            description: "Array of entity instances with updated data",
          },
        },
        required: ["application", "applicationSection", "instances"],
      },
    };

    expect(result).toEqual(expected);
  });
});
