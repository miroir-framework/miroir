import { describe, it, expect } from "vitest";
import { type MiroirModelEnvironment } from "miroir-core";
import { sqlStringForExtractor } from "../src/1_core/SqlGenerator";

// ################################################################################################
// Minimal model environment factory: only provides currentModel.entityDefinitions.
// The tested function only reads `modelEnvironment?.currentModel?.entityDefinitions`.
function makeModelEnv(
  entityDefinitions: Array<{
    entityUuid: string;
    idAttribute?: string | string[];
    externalDataSource?: { schema?: string };
  }>
): MiroirModelEnvironment {
  return {
    currentModel: { entityDefinitions } as any,
    endpointsByUuid: {},
    miroirFundamentalJzodSchema: {} as any,
  } as unknown as MiroirModelEnvironment;
}

const emptyModelEnv = makeModelEnv([]);

// ################################################################################################
describe("sqlStringForExtractor", () => {
  // ##############################################################################################
  describe("extractorByPrimaryKey", () => {
    it("generates SELECT with default uuid PK and provided schema", () => {
      const extractor = {
        extractorOrCombinerType: "extractorByPrimaryKey" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        instanceUuid: "instance-uuid-1",
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "uuid" = 'instance-uuid-1'`
      );
    });

    it("uses custom single-attribute PK from entity definition", () => {
      const modelEnv = makeModelEnv([
        { entityUuid: "entity-uuid-custom", idAttribute: "code" },
      ]);
      const extractor = {
        extractorOrCombinerType: "extractorByPrimaryKey" as const,
        parentUuid: "entity-uuid-custom",
        parentName: "MyEntity",
        instanceUuid: "CODE-001",
      };

      const result = sqlStringForExtractor(extractor, "myschema", modelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "code" = 'CODE-001'`
      );
    });

    it("uses custom schema from entity definition externalDataSource", () => {
      const modelEnv = makeModelEnv([
        {
          entityUuid: "entity-uuid-ext",
          externalDataSource: { schema: "external_schema" },
        },
      ]);
      const extractor = {
        extractorOrCombinerType: "extractorByPrimaryKey" as const,
        parentUuid: "entity-uuid-ext",
        parentName: "ExternalEntity",
        instanceUuid: "some-uuid-value",
      };

      const result = sqlStringForExtractor(extractor, "fallback_schema", modelEnv);

      expect(result).toBe(
        `SELECT * FROM "external_schema"."ExternalEntity" WHERE "uuid" = 'some-uuid-value'`
      );
    });

    it("generates composite PK WHERE clause for multi-attribute primary key", () => {
      const modelEnv = makeModelEnv([
        { entityUuid: "entity-uuid-composite", idAttribute: ["region", "code"] },
      ]);
      const extractor = {
        extractorOrCombinerType: "extractorByPrimaryKey" as const,
        parentUuid: "entity-uuid-composite",
        parentName: "CompositeEntity",
        instanceUuid: "north|item1",
      };

      const result = sqlStringForExtractor(extractor, "myschema", modelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."CompositeEntity" WHERE "region" = 'north' AND "code" = 'item1'`
      );
    });

    it("handles composite PK values with escaped separator character", () => {
      const modelEnv = makeModelEnv([
        { entityUuid: "entity-uuid-composite", idAttribute: ["region", "code"] },
      ]);
      const extractor = {
        extractorOrCombinerType: "extractorByPrimaryKey" as const,
        parentUuid: "entity-uuid-composite",
        parentName: "CompositeEntity",
        // "north|west" as first part (escaped pipe), "item1" as second
        instanceUuid: "north\\|west|item1",
      };

      const result = sqlStringForExtractor(extractor, "myschema", modelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."CompositeEntity" WHERE "region" = 'north|west' AND "code" = 'item1'`
      );
    });

    it("falls back to uuid PK when entity UUID is not found in model environment", () => {
      const modelEnv = makeModelEnv([
        { entityUuid: "other-entity-uuid", idAttribute: "code" },
      ]);
      const extractor = {
        extractorOrCombinerType: "extractorByPrimaryKey" as const,
        parentUuid: "unknown-entity-uuid",
        parentName: "SomeEntity",
        instanceUuid: "some-id",
      };

      const result = sqlStringForExtractor(extractor, "myschema", modelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."SomeEntity" WHERE "uuid" = 'some-id'`
      );
    });
  });

  // ##############################################################################################
  describe("extractorInstancesByEntity", () => {
    it("generates SELECT without WHERE clause when no filter is provided", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(`SELECT * FROM "myschema"."MyEntity"`);
    });

    it("generates IS NULL WHERE clause for undefined filter", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "myAttr",
          undefined: true,
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "myAttr" IS NULL`
      );
    });

    it("generates IS NOT NULL WHERE clause for negated undefined filter", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "myAttr",
          not: true,
          undefined: true,
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "myAttr" IS NOT NULL`
      );
    });

    it("generates IN clause for values filter", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "status",
          values: ["active", "pending"],
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "status" IN ('active', 'pending')`
      );
    });

    it("generates NOT IN clause for negated values filter", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "status",
          not: true,
          values: ["deleted", "archived"],
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "status" NOT IN ('deleted', 'archived')`
      );
    });

    it("generates ILIKE clause for single value filter", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "title",
          value: "hello",
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "title" ILIKE '%hello%'`
      );
    });

    it("generates NOT ILIKE clause for negated single value filter", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "title",
          not: true,
          value: "hello",
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(
        `SELECT * FROM "myschema"."MyEntity" WHERE "title" NOT ILIKE '%hello%'`
      );
    });

    it("generates no WHERE clause when filter has no condition fields", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "myAttr",
          // no undefined, no values, no value
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(`SELECT * FROM "myschema"."MyEntity"`);
    });

    it("uses custom schema from entity definition", () => {
      const modelEnv = makeModelEnv([
        {
          entityUuid: "entity-uuid-ext",
          externalDataSource: { schema: "external_schema" },
        },
      ]);
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-ext",
        parentName: "ExternalEntity",
      };

      const result = sqlStringForExtractor(extractor, "fallback_schema", modelEnv);

      expect(result).toBe(`SELECT * FROM "external_schema"."ExternalEntity"`);
    });

    it("ignores values filter with empty array", () => {
      const extractor = {
        extractorOrCombinerType: "extractorInstancesByEntity" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        filter: {
          attributeName: "status",
          values: [],
        },
      };

      const result = sqlStringForExtractor(extractor, "myschema", emptyModelEnv);

      expect(result).toBe(`SELECT * FROM "myschema"."MyEntity"`);
    });
  });

  // ##############################################################################################
  describe("unsupported extractorOrCombinerType", () => {
    it("throws for combinerOneToOne", () => {
      const extractor = {
        extractorOrCombinerType: "combinerOneToOne" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        orderBy: undefined,
        objectReference: "ref",
        AttributeOfObjectToCompareToReferenceUuid: "uuid",
      };

      expect(() =>
        sqlStringForExtractor(extractor as any, "myschema", emptyModelEnv)
      ).toThrow("sqlForExtractor combinerOneToOne not implemented");
    });

    it("throws for extractorWrapperReturningObject", () => {
      const extractor = {
        extractorOrCombinerType: "extractorWrapperReturningObject" as const,
        extractorRecordOfExtractorOrCombiner: {},
      };

      expect(() =>
        sqlStringForExtractor(extractor as any, "myschema", emptyModelEnv)
      ).toThrow(
        "sqlForExtractor not implemented for extractorOrCombinerType: extractorWrapperReturningObject"
      );
    });

    it("throws for extractorWrapperReturningList", () => {
      const extractor = {
        extractorOrCombinerType: "extractorWrapperReturningList" as const,
        extractorRecordOfExtractorOrCombiner: {},
      };

      expect(() =>
        sqlStringForExtractor(extractor as any, "myschema", emptyModelEnv)
      ).toThrow(
        "sqlForExtractor not implemented for extractorOrCombinerType: extractorWrapperReturningList"
      );
    });

    it("throws for combinerOneToMany", () => {
      const extractor = {
        extractorOrCombinerType: "combinerOneToMany" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        objectReference: "ref",
        AttributeOfObjectToCompareToReferenceUuid: "uuid",
      };

      expect(() =>
        sqlStringForExtractor(extractor as any, "myschema", emptyModelEnv)
      ).toThrow(
        "sqlForExtractor not implemented for extractorOrCombinerType: combinerOneToMany"
      );
    });

    it("throws for combinerManyToMany", () => {
      const extractor = {
        extractorOrCombinerType: "combinerManyToMany" as const,
        parentUuid: "entity-uuid-1",
        parentName: "MyEntity",
        objectListReference: "refList",
      };

      expect(() =>
        sqlStringForExtractor(extractor as any, "myschema", emptyModelEnv)
      ).toThrow(
        "sqlForExtractor not implemented for extractorOrCombinerType: combinerManyToMany"
      );
    });
  });
});
