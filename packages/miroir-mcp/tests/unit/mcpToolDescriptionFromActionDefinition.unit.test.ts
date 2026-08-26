import { describe, it, expect } from 'vitest';
import { instanceEndpointV1 } from 'miroir-test-app_deployment-miroir';
import { mcpToolDescriptionFromActionDefinition } from '../../src/tools/mcpToolDescriptionFromActionDefinition';

const APPLICATION_SECTION_DEF =
  'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_applicationSection';
const ENTITY_INSTANCE_DEF = 'fe9b7d99-f216-44de-bb6e-60e1a1ebb739_entityInstance';

describe('mcpToolDescriptionFromActionDefinition', () => {
  it('should generate mcpToolDescription for createInstance action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_createInstance',
      instanceEndpointV1 as any
    );

    expect(result.name).toBe('miroir_createInstance');
    expect(result.description).toContain('Create new entity instances');
    expect(result.inputSchema.type).toBe('object');
    expect(result.inputSchema.properties.applicationSection).toEqual({
      $ref: `#/$defs/${APPLICATION_SECTION_DEF}`,
    });
    expect(result.inputSchema.properties.objects.items).toEqual({
      $ref: `#/$defs/${ENTITY_INSTANCE_DEF}`,
    });
    expect(result.inputSchema.$defs?.[APPLICATION_SECTION_DEF]).toMatchObject({
      type: 'string',
      enum: expect.arrayContaining(['model', 'data', 'modelVersion']),
    });
    expect(result.inputSchema.$defs?.[ENTITY_INSTANCE_DEF]).toMatchObject({
      type: 'object',
      properties: expect.objectContaining({
        uuid: expect.any(Object),
        parentUuid: expect.any(Object),
      }),
    });
    expect(result.inputSchema.required).toEqual([
      'application',
      'applicationSection',
      'objects',
    ]);
  });

  it('should generate mcpToolDescription for getInstance action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_getInstance',
      instanceEndpointV1 as any
    );

    expect(result.name).toBe('miroir_getInstance');
    expect(result.description).toContain('Retrieve a single entity instance');
    expect(result.inputSchema.type).toBe('object');
    expect(result.inputSchema.properties.applicationSection).toEqual({
      $ref: `#/$defs/${APPLICATION_SECTION_DEF}`,
    });
    expect(result.inputSchema.$defs?.[APPLICATION_SECTION_DEF]).toMatchObject({
      type: 'string',
      enum: expect.arrayContaining(['model', 'data', 'modelVersion']),
    });
    expect(result.inputSchema.required).toEqual([
      'application',
      'applicationSection',
      'parentUuid',
      'uuid',
    ]);
  });

  it('should generate mcpToolDescription for getInstances action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_getInstances',
      instanceEndpointV1 as any
    );

    expect(result.name).toBe('miroir_getInstances');
    expect(result.description).toContain('Retrieve all instances');
    expect(result.inputSchema.type).toBe('object');
    expect(result.inputSchema.properties.applicationSection).toEqual({
      $ref: `#/$defs/${APPLICATION_SECTION_DEF}`,
    });
    expect(result.inputSchema.properties.attributes).toMatchObject({
      type: 'array',
      items: { type: 'string' },
    });
    expect(result.inputSchema.required).toEqual([
      'application',
      'applicationSection',
      'parentUuid',
    ]);
  });

  it('should generate mcpToolDescription for updateInstance action', () => {
    const result = mcpToolDescriptionFromActionDefinition(
      'miroir_updateInstance',
      instanceEndpointV1 as any,
    );

    expect(result.name).toBe('miroir_updateInstance');
    expect(result.description).toContain('Update existing entity instances');
    expect(result.inputSchema.type).toBe('object');
    expect(result.inputSchema.properties.applicationSection).toEqual({
      $ref: `#/$defs/${APPLICATION_SECTION_DEF}`,
    });
    expect(result.inputSchema.properties.objects.items).toEqual({
      $ref: `#/$defs/${ENTITY_INSTANCE_DEF}`,
    });
    expect(result.inputSchema.required).toEqual([
      'application',
      'applicationSection',
      'objects',
    ]);
  });
});
