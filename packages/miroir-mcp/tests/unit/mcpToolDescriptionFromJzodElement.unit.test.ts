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

  it('should resolve schemaReference for applicationSection with enum', () => {
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
        description: 'Application Section',
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

  it('should resolve array type with schemaReference items', () => {
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

    // The resolved entityInstance should be an object with uuid, parentName, parentUuid, and other fields
    expect(result.type).toBe('array');
    expect(result.description).toBe('Array of entity instances');
    expect(result.items.type).toBe('object');
    // entityInstance contains uuid and parentUuid at minimum
    expect(result.items.properties).toHaveProperty('uuid');
    expect(result.items.properties).toHaveProperty('parentUuid');
  });

  it('should resolve schemaReference with context (relative reference)', () => {
    const jzodElement = {
      type: 'schemaReference',
      context: {
        myString: {
          type: 'string',
          tag: {
            value: {
              description: 'A custom string type',
            },
          },
        },
      },
      definition: {
        relativePath: 'myString',
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'A custom string type',
    });
  });

  it('should resolve nested schemaReference in object properties', () => {
    const jzodElement = {
      type: 'object',
      definition: {
        section: {
          type: 'schemaReference',
          definition: {
            absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
            relativePath: 'applicationSection',
          },
        },
        name: {
          type: 'string',
          tag: {
            value: {
              description: 'Name field',
            },
          },
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result.type).toBe('object');
    expect(result.properties.section).toEqual({
      type: 'string',
      enum: ['model', 'data'],
      description: 'Application Section',
    });
    expect(result.properties.name).toEqual({
      type: 'string',
      description: 'Name field',
    });
  });

  it('should resolve schemaReference for entityInstanceCollection', () => {
    const jzodElement = {
      type: 'schemaReference',
      definition: {
        absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
        relativePath: 'entityInstanceCollection',
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result.type).toBe('object');
    expect(result.properties).toHaveProperty('parentUuid');
    expect(result.properties).toHaveProperty('applicationSection');
    expect(result.properties).toHaveProperty('instances');
    // Check that instances is an array type
    expect(result.properties.instances.type).toBe('array');
  });

  it('should handle complex nested schemaReference resolution', () => {
    const jzodElement = {
      type: 'object',
      definition: {
        deployment: {
          type: 'uuid',
          tag: {
            value: {
              description: 'Deployment UUID',
            },
          },
        },
        data: {
          type: 'array',
          tag: {
            value: {
              description: 'Collection of instances',
            },
          },
          definition: {
            type: 'schemaReference',
            definition: {
              absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
              relativePath: 'entityInstance',
            },
          },
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result.type).toBe('object');
    expect(result.properties.deployment.type).toBe('string');
    expect(result.properties.data.type).toBe('array');
    expect(result.properties.data.items.type).toBe('object');
    expect(result.properties.data.items.properties).toHaveProperty('uuid');
  });

  // TDD: New type conversions
  it('should convert number type to number', () => {
    const jzodElement = {
      type: 'number',
      tag: {
        value: {
          description: 'Age in years',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'number',
      description: 'Age in years',
    });
  });

  it('should convert date type to string with date-time format', () => {
    const jzodElement = {
      type: 'date',
      tag: {
        value: {
          description: 'Created timestamp',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      format: 'date-time',
      description: 'Created timestamp',
    });
  });

  it('should convert literal type to const', () => {
    const jzodElement = {
      type: 'literal',
      definition: 'active',
      tag: {
        value: {
          description: 'Status value',
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      const: 'active',
      description: 'Status value',
    });
  });

  it('should convert literal type with number value', () => {
    const jzodElement = {
      type: 'literal',
      definition: 42,
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'number',
      const: 42,
      description: '',
    });
  });

  it('should convert record type to object with additionalProperties', () => {
    const jzodElement = {
      type: 'record',
      tag: {
        value: {
          description: 'Key-value pairs',
        },
      },
      definition: {
        type: 'string',
        tag: {
          value: {
            description: 'Value description',
          },
        },
      },
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'object',
      description: 'Key-value pairs',
      additionalProperties: {
        type: 'string',
        description: 'Value description',
      },
    });
  });

  it('should convert tuple type to array with prefixItems', () => {
    const jzodElement = {
      type: 'tuple',
      tag: {
        value: {
          description: 'Coordinate pair',
        },
      },
      definition: [
        {
          type: 'number',
          tag: {
            value: {
              description: 'X coordinate',
            },
          },
        },
        {
          type: 'number',
          tag: {
            value: {
              description: 'Y coordinate',
            },
          },
        },
      ],
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'array',
      description: 'Coordinate pair',
      prefixItems: [
        {
          type: 'number',
          description: 'X coordinate',
        },
        {
          type: 'number',
          description: 'Y coordinate',
        },
      ],
      minItems: 2,
      maxItems: 2,
    });
  });

  it('should convert tuple with mixed types', () => {
    const jzodElement = {
      type: 'tuple',
      definition: [
        {
          type: 'string',
          tag: {
            value: {
              description: 'Name',
            },
          },
        },
        {
          type: 'number',
          tag: {
            value: {
              description: 'Age',
            },
          },
        },
        {
          type: 'boolean',
          tag: {
            value: {
              description: 'Active',
            },
          },
        },
      ],
    };

    const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

    expect(result).toEqual({
      type: 'array',
      description: '',
      prefixItems: [
        {
          type: 'string',
          description: 'Name',
        },
        {
          type: 'number',
          description: 'Age',
        },
        {
          type: 'string',
          description: 'Active',
        },
      ],
      minItems: 3,
      maxItems: 3,
    });
  });

});
