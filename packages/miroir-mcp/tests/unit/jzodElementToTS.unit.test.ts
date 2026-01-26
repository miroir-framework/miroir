import { describe, it, expect } from 'vitest';
import { jzodElementToTS } from '../../src/tools/jzodElementToTS.js';

describe('jzodElementToTS', () => {
  it('should convert uuid type to string', () => {
    const jzodElement = {
      type: 'uuid',
      tag: {
        value: {
          description: 'Application UUID',
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('string');
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('string');
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('boolean');
  });

  it('should convert number type to number', () => {
    const jzodElement = {
      type: 'number',
      tag: {
        value: {
          description: 'Age in years',
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('number');
  });

  it('should convert date type to Date', () => {
    const jzodElement = {
      type: 'date',
      tag: {
        value: {
          description: 'Created timestamp',
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('Date');
  });

  it('should convert literal string type', () => {
    const jzodElement = {
      type: 'literal',
      definition: 'active',
      tag: {
        value: {
          description: 'Status value',
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('"active"');
  });

  it('should convert literal number type', () => {
    const jzodElement = {
      type: 'literal',
      definition: 42,
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('42');
  });

  it('should convert enum type to union of string literals', () => {
    const jzodElement = {
      type: 'enum',
      definition: ['model', 'data'],
      tag: {
        value: {
          description: 'Application section',
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('"model" | "data"');
  });

  it('should convert simple object type', () => {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe(`{
  uuid: string;
  name: string;
}`);
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe(`{
  name: string;
  description?: string;
}`);
  });

  it('should convert array type with primitive items', () => {
    const jzodElement = {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('string[]');
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
          },
          name: {
            type: 'string',
          },
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe(`{
  uuid: string;
  name: string;
}[]`);
  });

  it('should convert record type', () => {
    const jzodElement = {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('Record<string, string>');
  });

  it('should convert record with complex value type', () => {
    const jzodElement = {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe(`Record<string, {
  count: number;
}>`);
  });

  it('should convert tuple type', () => {
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
      ],
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('[string, number]');
  });

  it('should convert simple union type', () => {
    const jzodElement = {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('string | number');
  });

  it('should convert union with literal types', () => {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('"active" | "inactive" | "pending"');
  });

  it('should convert union with object types', () => {
    const jzodElement = {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe(`{
  type: "success";
  value: string;
} | {
  type: "error";
  message: string;
}`);
  });

  it('should resolve schemaReference for applicationSection', () => {
    const jzodElement = {
      type: 'schemaReference',
      definition: {
        absolutePath: 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739',
        relativePath: 'applicationSection',
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('"model" | "data"');
  });

  it('should handle nested objects with proper indentation', () => {
    const jzodElement = {
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

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe(`{
  user: {
    name: string;
    age: number;
  };
  active: boolean;
}`);
  });

  it('should handle arrays of arrays', () => {
    const jzodElement = {
      type: 'array',
      definition: {
        type: 'array',
        definition: {
          type: 'number',
        },
      },
    };

    const result = jzodElementToTS(jzodElement as any);

    expect(result).toBe('number[][]');
  });
});
