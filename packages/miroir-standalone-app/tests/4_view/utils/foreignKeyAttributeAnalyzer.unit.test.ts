import { describe, it, expect } from 'vitest';
import type { Entity } from 'miroir-core';
import { 
  analyzeForeignKeyAttributes, 
  convertToLegacyFormat,
  ForeignKeyAttributeDefinition 
} from '../../../src/miroir-fwk/4_view/utils/foreignKeyAttributeAnalyzer';

describe('analyzeForeignKeyAttributes', () => {
  const createEntity = (
    uuid: string, 
    name: string, 
    definition: Record<string, any>
  ): Entity => ({
    uuid,
    parentName: "Entity",
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    name,
    mlSchema: {
      type: "object",
      definition
    }
  });

  const bookEntity = createEntity("book-uuid", "Book", {
    uuid: { type: "uuid" },
    title: { type: "string" },
    authorUuid: { 
      type: "uuid", 
      tag: { value: { foreignKeyParams: {targetEntity: "author-uuid"} } } 
    },
    publisherUuid: { 
      type: "uuid", 
      tag: { value: { foreignKeyParams: {targetEntity: "publisher-uuid"} } } 
    }
  });

  const authorEntity = createEntity("author-uuid", "Author", {
    uuid: { type: "uuid" },
    name: { type: "string" },
    countryUuid: { 
      type: "uuid", 
      tag: { value: { foreignKeyParams: {targetEntity: "country-uuid"} } } 
    }
  });

  const publisherEntity = createEntity("publisher-uuid", "Publisher", {
    uuid: { type: "uuid" },
    name: { type: "string" },
    countryUuid: { 
      type: "uuid", 
      tag: { value: { foreignKeyParams: {targetEntity: "country-uuid"} } } 
    }
  });

  const countryEntity = createEntity("country-uuid", "Country", {
    uuid: { type: "uuid" },
    name: { type: "string" }
  });

  const allEntities = [bookEntity, authorEntity, publisherEntity, countryEntity];

  describe('Direct foreign key analysis', () => {
    it('should find direct foreign key attributes', () => {
      const result = analyzeForeignKeyAttributes(
        bookEntity, 
        allEntities, 
        { includeTransitive: false }
      );

      expect(result).toHaveLength(2);
      
      const authorFK = result.find(fk => fk.attributeName === 'authorUuid');
      expect(authorFK).toBeDefined();
      expect(authorFK?.isDirect).toBe(true);
      expect(authorFK?.targetEntityUuid).toBe('author-uuid');

      const publisherFK = result.find(fk => fk.attributeName === 'publisherUuid');
      expect(publisherFK).toBeDefined();
      expect(publisherFK?.isDirect).toBe(true);
      expect(publisherFK?.targetEntityUuid).toBe('publisher-uuid');
    });

    it('should return empty array for entity with no foreign keys', () => {
      const result = analyzeForeignKeyAttributes(
        countryEntity, 
        allEntities, 
        { includeTransitive: false }
      );

      expect(result).toHaveLength(0);
    });

    it('should return empty array for undefined entity', () => {
      const result = analyzeForeignKeyAttributes(
        undefined, 
        allEntities, 
        { includeTransitive: false }
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('Transitive foreign key analysis', () => {
    it('should find transitive foreign key entities', () => {
      const result = analyzeForeignKeyAttributes(
        bookEntity, 
        allEntities, 
        { includeTransitive: true }
      );

      expect(result.length).toBeGreaterThan(2);
      
      expect(result.find(fk => fk.attributeName === 'authorUuid')).toBeDefined();
      expect(result.find(fk => fk.attributeName === 'publisherUuid')).toBeDefined();
      
      const countryFK = result.find(fk => fk.attributeName === '__fk_country-uuid');
      expect(countryFK).toBeDefined();
      expect(countryFK?.isDirect).toBe(false);
      expect(countryFK?.targetEntityUuid).toBe('country-uuid');
    });

    it('should not duplicate foreign key entities', () => {
      const result = analyzeForeignKeyAttributes(
        bookEntity, 
        allEntities, 
        { includeTransitive: true }
      );

      const countryFKs = result.filter(fk => fk.targetEntityUuid === 'country-uuid');
      expect(countryFKs).toHaveLength(1);
    });

    it('should respect maxDepth option', () => {
      const entityA = createEntity("entity-a", "EntityA", {
        entityBUuid: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "entity-b"} } } }
      });
      const entityB = createEntity("entity-b", "EntityB", {
        entityCUuid: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "entity-c"} } } }
      });
      const entityC = createEntity("entity-c", "EntityC", {
        entityDUuid: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "entity-d"} } } }
      });
      const entityD = createEntity("entity-d", "EntityD", {
        name: { type: "string" }
      });

      const deepEntities = [entityA, entityB, entityC, entityD];

      const resultDepth1 = analyzeForeignKeyAttributes(
        entityA, 
        deepEntities, 
        { includeTransitive: true, maxDepth: 1 }
      );

      expect(resultDepth1).toHaveLength(1);
      expect(resultDepth1[0].attributeName).toBe('entityBUuid');

      const resultDepth2 = analyzeForeignKeyAttributes(
        entityA, 
        deepEntities, 
        { includeTransitive: true, maxDepth: 2 }
      );

      expect(resultDepth2.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle circular foreign key references', () => {
      const entityA = createEntity("entity-a", "EntityA", {
        entityBUuid: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "entity-b"} } } }
      });
      const entityB = createEntity("entity-b", "EntityB", {
        entityAUuid: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "entity-a"} } } }
      });

      const circularEntities = [entityA, entityB];

      const result = analyzeForeignKeyAttributes(
        entityA, 
        circularEntities, 
        { includeTransitive: true }
      );

      // Direct A→B plus transitive B→A (A not yet in the FK set when walking B)
      expect(result).toHaveLength(2);
      expect(result[0].attributeName).toBe('entityBUuid');
      expect(result[1].attributeName).toBe('__fk_entity-a');
    });
  });

  describe('convertToLegacyFormat', () => {
    it('should convert to legacy tuple format', () => {
      const foreignKeyAttributes: ForeignKeyAttributeDefinition[] = [
        {
          attributeName: 'authorUuid',
          schema: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "author-uuid"} } } } as any,
          isDirect: true,
          targetEntityUuid: 'author-uuid'
        },
        {
          attributeName: '__fk_country-uuid',
          schema: { type: "uuid", tag: { value: { foreignKeyParams: {targetEntity: "country-uuid"} } } } as any,
          isDirect: false,
          targetEntityUuid: 'country-uuid'
        }
      ];

      const legacy = convertToLegacyFormat(foreignKeyAttributes);
      expect(legacy).toHaveLength(2);
      expect(legacy[0][0]).toBe('authorUuid');
      expect(legacy[1][0]).toBe('__fk_country-uuid');
    });
  });
});
