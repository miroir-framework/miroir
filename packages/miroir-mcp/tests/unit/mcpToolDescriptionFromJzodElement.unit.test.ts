import { describe, it, expect } from 'vitest';
import { mcpToolDescriptionFromJzodElement } from '../../src/tools/mcpToolDescriptionFromJzodElement';

describe('mcpToolDescriptionFromJzodElement', () => {
  it('should convert uuid type to string', () => {
    const jzodElement = {
      type: 'uuid',
      tag: {
        value: {
          description: 'Application UUID',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'Application UUID',
    });
  });

  it('should convert string type', () => {
    const jzodElement = {
      type: 'string',
      tag: {
        value: {
          description: 'Entity name',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'Entity name',
    });
  });

  it('should convert boolean type to string', () => {
    const jzodElement = {
      type: 'boolean',
      tag: {
        value: {
          description: 'Set to true to include in transaction',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'Set to true to include in transaction',
    });
  });

  it('should use defaultLabel when description is not available', () => {
    const jzodElement = {
      type: 'uuid',
      tag: {
        value: {
          defaultLabel: 'Application',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'Application',
    });
  });

  it('should convert schemaReference for applicationSection with enum', () => {
    const jzodElement = {
      type: 'schemaReference',
      tag: {
        value: {
          description: 'Section to query (model or data)',
        },
      },
      definition: {
        absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
        relativePath: 'applicationSection',
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any, 'applicationSection');

    expect(result).toEqual(
        {
        type: 'string',
        enum: ['model', 'data'],
        description: 'A section of the application (model or data)',
      }
    );
  });

  it('should convert object type recursively', () => {
    const jzodElement = {
      type: 'object',
      definition: {
        uuid: {
          type: 'uuid',
          tag: {
            value: {
              description: 'Instance UUID',
            },
          },
        },
        parentUuid: {
          type: 'uuid',
          tag: {
            value: {
              description: 'Parent entity UUID',
            },
          },
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'Instance UUID',
        },
        parentUuid: {
          type: 'string',
          description: 'Parent entity UUID',
        },
      },
      required: ['uuid', 'parentUuid'],
      additionalProperties: true,
    });
  });

  it('should handle optional fields in object', () => {
    const jzodElement = {
      type: 'object',
      definition: {
        name: {
          type: 'string',
          tag: {
            value: {
              description: 'Entity name',
            },
          },
        },
        description: {
          type: 'string',
          optional: true,
          tag: {
            value: {
              description: 'Optional description',
            },
          },
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Entity name',
        },
        description: {
          type: 'string',
          description: 'Optional description',
        },
      },
      required: ['name'],
      additionalProperties: true,
    });
  });

  it('should convert array type with object items', () => {
    const jzodElement = {
      type: 'array',
      tag: {
        value: {
          description: 'Array of instances',
        },
      },
      definition: {
        type: 'object',
        definition: {
          uuid: {
            type: 'uuid',
            tag: {
              value: {
                description: 'Instance UUID',
              },
            },
          },
          name: {
            type: 'string',
            tag: {
              value: {
                description: 'Instance name',
              },
            },
          },
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'array',
      description: 'Array of instances',
      items: {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
            description: 'Instance UUID',
          },
          name: {
            type: 'string',
            description: 'Instance name',
          },
        },
        required: ['uuid', 'name'],
        additionalProperties: true,
      },
    });
  });

  it('should convert array type with schemaReference items', () => {
    const jzodElement = {
      type: 'array',
      tag: {
        value: {
          description: 'Array of entity instances',
        },
      },
      definition: {
        type: 'schemaReference',
        definition: {
          absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
          relativePath: 'entityInstance',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'array',
      description: 'Array of entity instances',
      items: {
        type: "object",
        properties: {
          uuid: { type: "string", description: "Instance UUID" },
          parentUuid: { type: "string", description: "Parent entity UUID" },
        },
        required: ["uuid", "parentUuid"],
        additionalProperties: true,
      },
    });
  });

});
