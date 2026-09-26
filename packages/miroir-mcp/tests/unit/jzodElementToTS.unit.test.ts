import { describe, it, expect } from 'vitest';
import { jzodElementToTS } from '../../src/tools/jzodElementToTS.js';

describe('jzodElementToTS', () => {
  it('should convert uuid type to string', () => {
    const mlElement = {
      type: 'uuid',
      tag: {
        value: {
          description: 'Application UUID',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('string');
  });

  it('should convert string type', () => {
    const mlElement = {
      type: 'string',
      tag: {
        value: {
          description: 'Entity name',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('string');
  });

  it('should convert boolean type to boolean', () => {
    const mlElement = {
      type: 'boolean',
      tag: {
        value: {
          description: 'Set to true to include in transaction',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('boolean');
  });

  it('should convert number type to number', () => {
    const mlElement = {
      type: 'number',
      tag: {
        value: {
          description: 'Age in years',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('number');
  });

  it('should convert date type to Date', () => {
    const mlElement = {
      type: 'date',
      tag: {
        value: {
          description: 'Created timestamp',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('Date');
  });

  it('should convert literal string type', () => {
    const mlElement = {
      type: 'literal',
      definition: 'active',
      tag: {
        value: {
          description: 'Status value',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('"active"');
  });

  it('should convert literal number type', () => {
    const mlElement = {
      type: 'literal',
      definition: 42,
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('42');
  });

  it('should convert enum type to union of string literals', () => {
    const mlElement = {
      type: 'enum',
      definition: ['model', 'data'],
      tag: {
        value: {
          description: 'Application section',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('"model" | "data"');
  });

  it('should convert simple object type', () => {
    const mlElement = {
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
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe(`{
  uuid: string;
  name: string;
}`);
  });

  it('should handle optional fields in object', () => {
    const mlElement = {
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

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe(`{
  name: string;
  description?: string;
}`);
  });

  it('should convert array type with primitive items', () => {
    const mlElement = {
      type: 'array',
      tag: {
        value: {
          description: 'Array of strings',
        },
      },
      definition: {
        type: 'string',
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('string[]');
  });

  it('should convert array type with object items', () => {
    const mlElement = {
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
          },
          name: {
            type: 'string',
          },
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe(`{
  uuid: string;
  name: string;
}[]`);
  });

  it('should convert record type', () => {
    const mlElement = {
      type: 'record',
      tag: {
        value: {
          description: 'Key-value pairs',
        },
      },
      definition: {
        type: 'string',
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('Record<string, string>');
  });

  it('should convert record with complex value type', () => {
    const mlElement = {
      type: 'record',
      definition: {
        type: 'object',
        definition: {
          count: {
            type: 'number',
          },
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe(`Record<string, {
  count: number;
}>`);
  });

  it('should convert tuple type', () => {
    const mlElement = {
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
      ],
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('[string, number]');
  });

  it('should convert simple union type', () => {
    const mlElement = {
      type: 'union',
      definition: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('string | number');
  });

  it('should convert union with literal types', () => {
    const mlElement = {
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

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('"active" | "inactive" | "pending"');
  });

  it('should convert union with object types', () => {
    const mlElement = {
      type: 'union',
      definition: [
        {
          type: 'object',
          definition: {
            type: {
              type: 'literal',
              definition: 'success',
            },
            value: {
              type: 'string',
            },
          },
        },
        {
          type: 'object',
          definition: {
            type: {
              type: 'literal',
              definition: 'error',
            },
            message: {
              type: 'string',
            },
          },
        },
      ],
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe(`{
  type: "success";
  value: string;
} | {
  type: "error";
  message: string;
}`);
  });

  it('should resolve schemaReference for applicationSection', () => {
    const mlElement = {
      type: 'schemaReference',
      definition: {
        absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
        relativePath: 'applicationSection',
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('"model" | "data"');
  });

  it('should handle nested objects with proper indentation', () => {
    const mlElement = {
      type: 'object',
      definition: {
        user: {
          type: 'object',
          definition: {
            name: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
          },
        },
        active: {
          type: 'boolean',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe(`{
  user: {
    name: string;
    age: number;
  };
  active: boolean;
}`);
  });

  it('should handle arrays of arrays', () => {
    const mlElement = {
      type: 'array',
      definition: {
        type: 'array',
        definition: {
          type: 'number',
        },
      },
    };

    const result = jzodElementToTS(mlElement as any);

    expect(result).toBe('number[][]');
  });
});
