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

  // TDD: Union type conversions
  describe('union types', () => {
    it('should convert simple union of primitives using anyOf', () => {
      const jzodElement = {
        type: 'union',
        tag: {
          value: {
            description: 'String or number value',
          },
        },
        definition: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result).toEqual({
        anyOf: [
          {
            type: 'string',
            description: '',
          },
          {
            type: 'number',
            description: '',
          },
        ],
        description: 'String or number value',
      });
    });

    it('should convert union of multiple primitives', () => {
      const jzodElement = {
        type: 'union',
        definition: [
          {
            type: 'string',
            tag: {
              value: {
                description: 'Text value',
              },
            },
          },
          {
            type: 'number',
            tag: {
              value: {
                description: 'Numeric value',
              },
            },
          },
          {
            type: 'boolean',
            tag: {
              value: {
                description: 'Boolean value',
              },
            },
          },
        ],
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result).toEqual({
        anyOf: [
          {
            type: 'string',
            description: 'Text value',
          },
          {
            type: 'number',
            description: 'Numeric value',
          },
          {
            type: 'string',
            description: 'Boolean value',
          },
        ],
        description: '',
      });
    });

    it('should convert union with literal types using anyOf', () => {
      const jzodElement = {
        type: 'union',
        definition: [
          {
            type: 'literal',
            definition: 'active',
          },
          {
            type: 'literal',
            definition: 'inactive',
          },
          {
            type: 'literal',
            definition: 'pending',
          },
        ],
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result).toEqual({
        anyOf: [
          {
            type: 'string',
            const: 'active',
            description: '',
          },
          {
            type: 'string',
            const: 'inactive',
            description: '',
          },
          {
            type: 'string',
            const: 'pending',
            description: '',
          },
        ],
        description: '',
      });
    });

    it('should convert discriminated union using oneOf', () => {
      const jzodElement = {
        type: 'union',
        tag: {
          value: {
            description: 'Shape types',
          },
        },
        definition: [
          {
            type: 'object',
            definition: {
              type: {
                type: 'literal',
                definition: 'circle',
              },
              radius: {
                type: 'number',
                tag: {
                  value: {
                    description: 'Circle radius',
                  },
                },
              },
            },
          },
          {
            type: 'object',
            definition: {
              type: {
                type: 'literal',
                definition: 'rectangle',
              },
              width: {
                type: 'number',
                tag: {
                  value: {
                    description: 'Rectangle width',
                  },
                },
              },
              height: {
                type: 'number',
                tag: {
                  value: {
                    description: 'Rectangle height',
                  },
                },
              },
            },
          },
        ],
        discriminator: 'type',
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result).toEqual({
        oneOf: [
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                const: 'circle',
                description: '',
              },
              radius: {
                type: 'number',
                description: 'Circle radius',
              },
            },
            required: ['type', 'radius'],
            additionalProperties: true,
          },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                const: 'rectangle',
                description: '',
              },
              width: {
                type: 'number',
                description: 'Rectangle width',
              },
              height: {
                type: 'number',
                description: 'Rectangle height',
              },
            },
            required: ['type', 'width', 'height'],
            additionalProperties: true,
          },
        ],
        discriminator: {
          propertyName: 'type',
        },
        description: 'Shape types',
      });
    });

    it('should convert union in object property', () => {
      const jzodElement = {
        type: 'object',
        definition: {
          id: {
            type: 'uuid',
            tag: {
              value: {
                description: 'Identifier',
              },
            },
          },
          value: {
            type: 'union',
            tag: {
              value: {
                description: 'Flexible value field',
              },
            },
            definition: [
              {
                type: 'string',
              },
              {
                type: 'number',
              },
            ],
          },
        },
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result.type).toBe('object');
      expect(result.properties.id.type).toBe('string');
      expect(result.properties.value).toEqual({
        anyOf: [
          {
            type: 'string',
            description: '',
          },
          {
            type: 'number',
            description: '',
          },
        ],
        description: 'Flexible value field',
      });
    });

    it('should convert union with array types', () => {
      const jzodElement = {
        type: 'union',
        definition: [
          {
            type: 'string',
          },
          {
            type: 'array',
            definition: {
              type: 'string',
            },
          },
        ],
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result).toEqual({
        anyOf: [
          {
            type: 'string',
            description: '',
          },
          {
            type: 'array',
            description: '',
            items: {
              type: 'string',
              description: '',
            },
          },
        ],
        description: '',
      });
    });

    it('should handle nested unions', () => {
      const jzodElement = {
        type: 'union',
        definition: [
          {
            type: 'string',
          },
          {
            type: 'union',
            definition: [
              {
                type: 'number',
              },
              {
                type: 'boolean',
              },
            ],
          },
        ],
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result).toEqual({
        anyOf: [
          {
            type: 'string',
            description: '',
          },
          {
            anyOf: [
              {
                type: 'number',
                description: '',
              },
              {
                type: 'string',
                description: '',
              },
            ],
            description: '',
          },
        ],
        description: '',
      });
    });

    it('should convert union with schemaReference', () => {
      const jzodElement = {
        type: 'union',
        definition: [
          {
            type: 'string',
          },
          {
            type: 'schemaReference',
            definition: {
              absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
              relativePath: 'applicationSection',
            },
          },
        ],
      };

      const result = mcpToolDescriptionFromJzodElement(jzodElement as any);

      expect(result.anyOf).toHaveLength(2);
      expect(result.anyOf[0]).toEqual({
        type: 'string',
        description: '',
      });
      expect(result.anyOf[1]).toEqual({
        type: 'string',
        enum: ['model', 'data'],
        description: 'Application Section',
      });
    });
  });

});
