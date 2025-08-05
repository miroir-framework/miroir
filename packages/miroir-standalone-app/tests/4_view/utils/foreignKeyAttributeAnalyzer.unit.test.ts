import { describe, it, expect } from 'vitest';
import { EntityDefinition } from 'miroir-core';
import { 
  analyzeForeignKeyAttributes, 
  convertToLegacyFormat,
  ForeignKeyAttributeDefinition 
} from '../../../src/miroir-fwk/4_view/utils/foreignKeyAttributeAnalyzer';

describe('analyzeForeignKeyAttributes', () => {
  // Test data setup
  const createEntityDefinition = (
    entityUuid: string, 
    name: string, 
    definition: Record<string, any>
  ): EntityDefinition => ({
    uuid: `${entityUuid}-def`,
    parentName: "EntityDefinition",
    parentUuid: "parent-uuid",
    conceptLevel: "Model" as any,
    name: `${name}Definition`,
    entityUuid,
    jzodSchema: {
      type: "object",
      definition
    }
  });

  const bookEntityDef = createEntityDefinition("book-uuid", "Book", {
    uuid: { type: "uuid" },
    title: { type: "string" },
    authorUuid: { 
      type: "uuid", 
      tag: { value: { selectorParams: {targetEntity: "author-uuid"} } } 
    },
    publisherUuid: { 
      type: "uuid", 
      tag: { value: { selectorParams: {targetEntity: "publisher-uuid"} } } 
    }
  });

  const authorEntityDef = createEntityDefinition("author-uuid", "Author", {
    uuid: { type: "uuid" },
    name: { type: "string" },
    countryUuid: { 
      type: "uuid", 
      tag: { value: { selectorParams: {targetEntity: "country-uuid"} } } 
    }
  });

  const publisherEntityDef = createEntityDefinition("publisher-uuid", "Publisher", {
    uuid: { type: "uuid" },
    name: { type: "string" },
    countryUuid: { 
      type: "uuid", 
      tag: { value: { selectorParams: {targetEntity: "country-uuid"} } } 
    }
  });

  const countryEntityDef = createEntityDefinition("country-uuid", "Country", {
    uuid: { type: "uuid" },
    name: { type: "string" }
  });

  const allEntityDefinitions = [bookEntityDef, authorEntityDef, publisherEntityDef, countryEntityDef];

  describe('Direct foreign key analysis', () => {
    it('should find direct foreign key attributes', () => {
      const result = analyzeForeignKeyAttributes(
        bookEntityDef, 
        allEntityDefinitions, 
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

    it('should return empty array for entity without foreign keys', () => {
      const result = analyzeForeignKeyAttributes(
        countryEntityDef, 
        allEntityDefinitions, 
        { includeTransitive: false }
      );

      expect(result).toHaveLength(0);
    });

    it('should return empty array for undefined entity definition', () => {
      const result = analyzeForeignKeyAttributes(
        undefined, 
        allEntityDefinitions, 
        { includeTransitive: false }
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('Transitive foreign key analysis', () => {
    it('should find transitive foreign key entities', () => {
      const result = analyzeForeignKeyAttributes(
        bookEntityDef, 
        allEntityDefinitions, 
        { includeTransitive: true }
      );

      expect(result.length).toBeGreaterThan(2);
      
      // Should have direct foreign keys
      expect(result.find(fk => fk.attributeName === 'authorUuid')).toBeDefined();
      expect(result.find(fk => fk.attributeName === 'publisherUuid')).toBeDefined();
      
      // Should have transitive foreign key for country
      const countryFK = result.find(fk => fk.attributeName === '__fk_country-uuid');
      expect(countryFK).toBeDefined();
      expect(countryFK?.isDirect).toBe(false);
      expect(countryFK?.targetEntityUuid).toBe('country-uuid');
    });

    it('should not duplicate foreign key entities', () => {
      const result = analyzeForeignKeyAttributes(
        bookEntityDef, 
        allEntityDefinitions, 
        { includeTransitive: true }
      );

      // Even though both Author and Publisher reference Country, 
      // Country should only appear once
      const countryFKs = result.filter(fk => fk.targetEntityUuid === 'country-uuid');
      expect(countryFKs).toHaveLength(1);
    });

    it('should respect maxDepth option', () => {
      // Create a circular reference scenario
      const entityA = createEntityDefinition("entity-a", "EntityA", {
        entityBUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "entity-b"} } } }
      });
      const entityB = createEntityDefinition("entity-b", "EntityB", {
        entityCUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "entity-c"} } } }
      });
      const entityC = createEntityDefinition("entity-c", "EntityC", {
        entityDUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "entity-d"} } } }
      });
      const entityD = createEntityDefinition("entity-d", "EntityD", {
        entityEUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "entity-e"} } } }
      });
      const entityE = createEntityDefinition("entity-e", "EntityE", {
        name: { type: "string" }
      });

      const chainEntities = [entityA, entityB, entityC, entityD, entityE];

      const result = analyzeForeignKeyAttributes(
        entityA, 
        chainEntities, 
        { includeTransitive: true, maxDepth: 2 }
      );

      // Should only go 2 levels deep: A -> B -> C
      expect(result.find(fk => fk.targetEntityUuid === 'entity-b')).toBeDefined();
      expect(result.find(fk => fk.targetEntityUuid === 'entity-c')).toBeDefined();
      expect(result.find(fk => fk.targetEntityUuid === 'entity-d')).toBeUndefined();
      expect(result.find(fk => fk.targetEntityUuid === 'entity-e')).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle entity definition without jzodSchema', () => {
      const invalidEntityDef = {
        ...bookEntityDef,
        jzodSchema: undefined as any
      };

      const result = analyzeForeignKeyAttributes(
        invalidEntityDef, 
        allEntityDefinitions
      );

      expect(result).toHaveLength(0);
    });

    it('should handle entity definition without schema definition', () => {
      const invalidEntityDef = {
        ...bookEntityDef,
        jzodSchema: {
          type: "object" as const,
          definition: undefined as any
        }
      };

      const result = analyzeForeignKeyAttributes(
        invalidEntityDef, 
        allEntityDefinitions
      );

      expect(result).toHaveLength(0);
    });

    it('should handle missing foreign key entity definitions', () => {
      const incompleteEntityDefs = [bookEntityDef]; // Missing author and publisher definitions

      const result = analyzeForeignKeyAttributes(
        bookEntityDef, 
        incompleteEntityDefs, 
        { includeTransitive: true }
      );

      // Should still find direct foreign keys even if their definitions are missing
      expect(result).toHaveLength(2);
      expect(result.find(fk => fk.attributeName === 'authorUuid')).toBeDefined();
      expect(result.find(fk => fk.attributeName === 'publisherUuid')).toBeDefined();
    });

    it('should handle circular foreign key references', () => {
      const entityA = createEntityDefinition("entity-a", "EntityA", {
        entityBUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "entity-b"} } } }
      });
      const entityB = createEntityDefinition("entity-b", "EntityB", {
        entityAUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "entity-a"} } } }
      });

      const circularEntities = [entityA, entityB];

      const result = analyzeForeignKeyAttributes(
        entityA, 
        circularEntities, 
        { includeTransitive: true }
      );

      // Should not cause infinite recursion
      expect(result).toHaveLength(1); // Only the direct FK from A to B
      expect(result[0].attributeName).toBe('entityBUuid');
    });
  });

  describe('convertToLegacyFormat', () => {
    it('should convert to legacy tuple format', () => {
      const foreignKeyAttributes: ForeignKeyAttributeDefinition[] = [
        {
          attributeName: 'authorUuid',
          schema: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "author-uuid"} } } } as any,
          isDirect: true,
          targetEntityUuid: 'author-uuid'
        },
        {
          attributeName: '__fk_country-uuid',
          schema: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "country-uuid"} } } } as any,
          isDirect: false,
          targetEntityUuid: 'country-uuid'
        }
      ];

      const result = convertToLegacyFormat(foreignKeyAttributes);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(['authorUuid', foreignKeyAttributes[0].schema]);
      expect(result[1]).toEqual(['__fk_country-uuid', foreignKeyAttributes[1].schema]);
    });

    it('should handle empty array', () => {
      const result = convertToLegacyFormat([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('Integration test with realistic data', () => {
    it('should handle a complex entity relationship graph', () => {
      // Create a more complex scenario: Book -> Author -> Country, Publisher -> Country, Book -> Genre
      const genreEntityDef = createEntityDefinition("genre-uuid", "Genre", {
        uuid: { type: "uuid" },
        name: { type: "string" }
      });

      const complexBookEntityDef = createEntityDefinition("book-uuid", "Book", {
        uuid: { type: "uuid" },
        title: { type: "string" },
        authorUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "author-uuid"} } } },
        publisherUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "publisher-uuid"} } } },
        genreUuid: { type: "uuid", tag: { value: { selectorParams: {targetEntity: "genre-uuid"} } } }
      });

      const complexEntities = [complexBookEntityDef, authorEntityDef, publisherEntityDef, countryEntityDef, genreEntityDef];

      const result = analyzeForeignKeyAttributes(
        complexBookEntityDef, 
        complexEntities, 
        { includeTransitive: true }
      );

      // Should find:
      // - Direct: authorUuid, publisherUuid, genreUuid (3)
      // - Transitive: country-uuid from both author and publisher (1, deduplicated)
      expect(result.length).toBe(4);

      const directFKs = result.filter(fk => fk.isDirect);
      const transitiveFKs = result.filter(fk => !fk.isDirect);

      expect(directFKs).toHaveLength(3);
      expect(transitiveFKs).toHaveLength(1);
      expect(transitiveFKs[0].targetEntityUuid).toBe('country-uuid');
    });
  });
});
