import { describe, expect, it } from "vitest";

import {
  Domain2ElementFailed,
  applyMlSchemaColumnChanges,
  type Entity,
  type ExtractorInstancesByEntity,
  type JzodElement,
  type MiroirModelEnvironment,
} from "miroir-core";
import entityBookJson from "../../miroir-test-app_deployment-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json" with { type: "json" };

import { sqlStringForExtractor } from "../src/1_core/SqlGenerator.js";
import {
  fromMiroirPresentModelToSequelizeEntityDefinition,
  getOptionalNonNullableAttributes,
  stripNullOptionalAttributes,
} from "../src/utils.js";

const entityBook = entityBookJson as Entity;
const BOOK_UUID = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";

const storedBookColumnKeys = [
  "author",
  "conceptLevel",
  "name",
  "parentDefinitionVersionUuid",
  "parentName",
  "parentUuid",
  "publisher",
  "uuid",
  "year",
];

function bookModelEnv(entity: Entity = entityBook): MiroirModelEnvironment {
  return {
    currentModel: { entities: [entity] } as any,
    endpointsByUuid: {},
    miroirFundamentalJzodSchema: {} as any,
  } as unknown as MiroirModelEnvironment;
}

function bookExtractor(
  extra: Partial<ExtractorInstancesByEntity> = {},
): ExtractorInstancesByEntity {
  return {
    extractorOrCombinerType: "extractorInstancesByEntity",
    parentUuid: BOOK_UUID,
    parentName: "Book",
    ...extra,
  };
}

function sqlText(result: unknown): string {
  expect(typeof result).toBe("string");
  return result as string;
}

describe("virtual attributes — Sequelize columns from Book mlSchema", () => {
  it("maps stored mlSchema keys to columns and excludes virtual citation", () => {
    const columns = fromMiroirPresentModelToSequelizeEntityDefinition(entityBook);
    expect(Object.keys(columns).sort()).toEqual([...storedBookColumnKeys].sort());
    expect(columns).not.toHaveProperty("citation");
  });

  it("keeps a virtual addColumn on Entity mlSchema but not as a Sequelize column", () => {
    const virtualDefinition: JzodElement = {
      type: "string",
      optional: true,
      tag: {
        value: {
          virtualAttribute: {
            interpolation: "runtime",
            transformerType: "mustacheStringTemplate",
            definition: "{{name}}",
          },
        },
      },
    } as JzodElement;
    const nextMlSchema = applyMlSchemaColumnChanges(entityBook.mlSchema, {
      addColumns: [{ name: "shelfLabel", definition: virtualDefinition }],
    });
    expect(nextMlSchema.definition).toHaveProperty("shelfLabel");
    const columns = fromMiroirPresentModelToSequelizeEntityDefinition({
      ...entityBook,
      mlSchema: nextMlSchema,
    });
    expect(columns).not.toHaveProperty("shelfLabel");
    expect(columns).not.toHaveProperty("citation");
  });

  it("drops leftover SQL NULL citation on read", () => {
    const optionalNonNullable = getOptionalNonNullableAttributes(entityBook);
    expect(optionalNonNullable).toContain("citation");
    const stripped = stripNullOptionalAttributes(
      {
        uuid: "c97be567-bd70-449f-843e-cd1d64ac1ddd",
        name: "Rear Window",
        citation: null,
      },
      optionalNonNullable,
    );
    expect(stripped).not.toHaveProperty("citation");
    expect(stripped.name).toBe("Rear Window");
  });
});

describe("virtual attributes — SQL extractors for Book citation", () => {
  it("omits citation from SQL when the extractor does not require it", () => {
    const sql = sqlText(sqlStringForExtractor(bookExtractor(), "myschema", bookModelEnv()));
    expect(sql).toBe(`SELECT * FROM "myschema"."Book"`);
    expect(sql).not.toContain("citation");
  });

  it("filters on a citation expression over Book only, not a citation column", () => {
    const sql = sqlText(
      sqlStringForExtractor(
        bookExtractor({
          filter: { attributeName: "citation", value: "Rear Window" },
        }),
        "myschema",
        bookModelEnv(),
      ),
    );
    expect(sql).toContain(`FROM "myschema"."Book"`);
    expect(sql.match(/\bFROM\b/gi)?.length).toBe(1);
    expect(sql.toUpperCase()).not.toContain("JOIN");
    expect(sql).not.toMatch(/"citation"\s+ILIKE/i);
    expect(sql).toContain('"name"');
    expect(sql).toContain('"year"');
    expect(sql).toContain("ILIKE '%Rear Window%'");
  });

  it("projects citation as an expression over Book columns, not as a stored column", () => {
    const sql = sqlText(
      sqlStringForExtractor(
        bookExtractor({
          attributes: ["uuid", "name", "citation"],
        }),
        "myschema",
        bookModelEnv(),
      ),
    );
    expect(sql).toContain(`FROM "myschema"."Book"`);
    expect(sql.match(/\bFROM\b/gi)?.length).toBe(1);
    expect(sql.toUpperCase()).not.toContain("JOIN");
    expect(sql).toContain('AS "citation"');
    expect(sql).toContain('"name"');
    expect(sql).toContain('"year"');
    expect(sql).not.toMatch(/SELECT\s+"citation"/i);
  });

  it("fails QueryNotExecutable when a required virtual transformer cannot compile to SQL", () => {
    const broken: Entity = {
      ...entityBook,
      mlSchema: {
        ...entityBook.mlSchema,
        definition: {
          ...entityBook.mlSchema.definition,
          citation: {
            type: "string",
            optional: true,
            tag: {
              value: {
                virtualAttribute: {
                  interpolation: "runtime",
                  transformerType: "mapList",
                  applyTo: {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    referenceName: "name",
                  },
                  transformer: {
                    transformerType: "returnValue",
                    interpolation: "runtime",
                    value: 1,
                  },
                },
              },
            },
          },
        },
      },
    };
    const result = sqlStringForExtractor(
      bookExtractor({ filter: { attributeName: "citation", value: "x" } }),
      "myschema",
      bookModelEnv(broken),
    );
    expect(result).toBeInstanceOf(Domain2ElementFailed);
    expect((result as Domain2ElementFailed).queryFailure).toBe("QueryNotExecutable");
  });
});
