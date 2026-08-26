import { describe, it, expect } from 'vitest';
import { jzodElementToJsonSchema } from '../../src/tools/jzodElementToJsonSchema';

describe('jzodElementToJsonSchema', () => {
  it('should convert uuid type to string', () => {
    const jzodElement = {
      type: 'uuid',
      tag: {
        value: {
          description: 'Application UUID',
        },
      },
    };

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'Entity name',
    });
  });

  it('should convert boolean type to boolean', () => {
    const jzodElement = {
      type: 'boolean',
      tag: {
        value: {
          description: 'Set to true to include in transaction',
        },
      },
    };

    const result = jzodElementToJsonSchema(jzodElement as any);

    expect(result).toEqual({
      type: 'boolean',
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

    const result = jzodElementToJsonSchema(jzodElement as any);

    expect(result).toEqual({
      type: 'string',
      description: 'Application',
    });
  });

  it('should resolve schemaReference for applicationSection with enum via $ref/$defs', () => {
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

    const result = jzodElementToJsonSchema(jzodElement as any, 'applicationSection');
    const defKey = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_applicationSection';

    // Root must be type:object for MCP/Cursor (#248); non-object defs are wrapped via allOf.
    expect(result.type).toBe('object');
    expect(result.allOf).toEqual([
      {
        type: 'string',
        enum: ['model', 'data', 'modelVersion'],
        description:
          'A section of the application (model, data, or modelVersion for version history)',
      },
    ]);
    expect(result.$defs[defKey]).toEqual({
      type: 'string',
      enum: ['model', 'data', 'modelVersion'],
      description:
        'A section of the application (model, data, or modelVersion for version history)',
    });
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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);
    const entityInstanceKey = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_entityInstance';

    expect(result.type).toBe('array');
    expect(result.description).toBe('Array of entity instances');
    expect(result.items).toEqual({ $ref: `#/$defs/${entityInstanceKey}` });
    expect(result.$defs[entityInstanceKey].type).toBe('object');
    expect(result.$defs[entityInstanceKey].properties).toHaveProperty('uuid');
    expect(result.$defs[entityInstanceKey].properties).toHaveProperty('parentUuid');
  });

  it('should resolve schemaReference with context (relative reference) via $ref/$defs', () => {
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

    const result = jzodElementToJsonSchema(jzodElement as any);
    const defKey = '_myString';

    expect(result.type).toBe('object');
    expect(result.allOf).toEqual([
      {
        type: 'string',
        description: 'A custom string type',
      },
    ]);
    expect(result.$defs[defKey]).toEqual({
      type: 'string',
      description: 'A custom string type',
    });
  });

  it('should resolve nested schemaReference in object properties via $ref/$defs', () => {
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

    const result = jzodElementToJsonSchema(jzodElement as any);
    const sectionKey = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_applicationSection';

    expect(result.type).toBe('object');
    expect(result.properties.section).toEqual({ $ref: `#/$defs/${sectionKey}` });
    expect(result.$defs[sectionKey]).toEqual({
      type: 'string',
      enum: ['model', 'data', 'modelVersion'],
      description:
        'A section of the application (model, data, or modelVersion for version history)',
    });
    expect(result.properties.name).toEqual({
      type: 'string',
      description: 'Name field',
    });
  });

  it('should resolve schemaReference for entityInstanceCollection via $ref/$defs', () => {
    const jzodElement = {
      type: 'schemaReference',
      definition: {
        absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
        relativePath: 'entityInstanceCollection',
      },
    };

    const result = jzodElementToJsonSchema(jzodElement as any);
    const collectionKey = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_entityInstanceCollection';

    // Root $ref expanded once so inputSchema.type is object (#248 cause 2).
    expect(result.type).toBe('object');
    expect(result.properties).toHaveProperty('parentUuid');
    expect(result.properties).toHaveProperty('applicationSection');
    expect(result.properties).toHaveProperty('instances');
    expect(result.properties.instances.type).toBe('array');
    expect(result.$defs[collectionKey].type).toBe('object');
  });

  it('should handle complex nested schemaReference resolution via $ref/$defs', () => {
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

    const result = jzodElementToJsonSchema(jzodElement as any);
    const entityInstanceKey = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_entityInstance';

    expect(result.type).toBe('object');
    expect(result.properties.deployment.type).toBe('string');
    expect(result.properties.data.type).toBe('array');
    expect(result.properties.data.items).toEqual({ $ref: `#/$defs/${entityInstanceKey}` });
    expect(result.$defs[entityInstanceKey].properties).toHaveProperty('uuid');
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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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

    const result = jzodElementToJsonSchema(jzodElement as any);

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
          type: 'boolean',
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

      const result = jzodElementToJsonSchema(jzodElement as any);

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

      const result = jzodElementToJsonSchema(jzodElement as any);

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
            type: 'boolean',
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

      const result = jzodElementToJsonSchema(jzodElement as any);

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

      const result = jzodElementToJsonSchema(jzodElement as any);

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

      const result = jzodElementToJsonSchema(jzodElement as any);

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

      const result = jzodElementToJsonSchema(jzodElement as any);

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

      const result = jzodElementToJsonSchema(jzodElement as any);

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
                type: 'boolean',
                description: '',
              },
            ],
            description: '',
          },
        ],
        description: '',
      });
    });

    it('should convert union with schemaReference via $ref/$defs', () => {
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

      const result = jzodElementToJsonSchema(jzodElement as any);
      const sectionKey = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_applicationSection';

      expect(result.anyOf).toHaveLength(2);
      expect(result.anyOf[0]).toEqual({
        type: 'string',
        description: '',
      });
      expect(result.anyOf[1]).toEqual({ $ref: `#/$defs/${sectionKey}` });
      expect(result.$defs[sectionKey]).toEqual({
        type: 'string',
        enum: ['model', 'data', 'modelVersion'],
        description:
          'A section of the application (model, data, or modelVersion for version history)',
      });
    });
  });

  describe("cycle-safe conversion", () => {
    it("does not stack overflow on self-referential meta-schema references (jzodElement)", () => {
      const jzodElement = {
        type: "schemaReference",
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "jzodElement",
        },
      };

      expect(() => jzodElementToJsonSchema(jzodElement as any)).not.toThrow();
      const result = jzodElementToJsonSchema(jzodElement as any);
      const defKey = "fe9b7d99-f216-44de-bb6e-60e1a1ebb739_jzodElement";
      expect(result.type).toBe("object");
      expect(result.$defs[defKey]).toBeDefined();
      // Recursive encounters must reuse $ref, not re-inline (size stays bounded).
      const serialized = JSON.stringify(result);
      expect(serialized.length).toBeLessThan(512 * 1024);
    });

    it("ensures root inputSchema is type object when payload is a schemaReference", () => {
      const jzodElement = {
        type: "schemaReference",
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "boxedQueryWithExtractorCombinerTransformer",
        },
      };

      const result = jzodElementToJsonSchema(jzodElement as any);
      expect(result.type).toBe("object");
      expect(result.$ref).toBeUndefined();
      expect(result.properties || result.allOf).toBeTruthy();
    });

    it("does not stack overflow on compositeActionSequence payload shape", () => {
      const jzodElement = {
        type: "schemaReference",
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "compositeActionSequence",
        },
      };

      expect(() => jzodElementToJsonSchema(jzodElement as any)).not.toThrow();
      const result = jzodElementToJsonSchema(jzodElement as any);
      const serialized = JSON.stringify(result);
      // Pre-$ref this class of schema expanded to tens of MB; budget matches #248 provisional gate.
      expect(serialized.length).toBeLessThan(512 * 1024);
    });

    it("converts Jzod any type to a generic object instead of throwing", () => {
      const jzodElement = {
        type: "any",
        tag: {
          value: {
            description: "Opaque model payload",
          },
        },
      };

      const result = jzodElementToJsonSchema(jzodElement as any);

      expect(result.type).toBe("object");
      expect(result.description).toBe("Opaque model payload");
    });
  });

});
