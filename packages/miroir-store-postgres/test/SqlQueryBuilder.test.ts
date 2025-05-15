// import { describe, it, expect } from "vitest";
import {
  sql_jsonb_array_elements,
  sql_jsonb_each,
  sql_jsonb_object_agg,
  sqlColumnAccess,
  sqlDefineColumn,
  sqlFrom,
  sqlNameQuote,
  sqlQuery,
  sqlSelectColumns
} from "../src/1_core/SqlQueryBuilder";

describe("SqlQueryBuilder", () => {
  describe("sqlNameQuote", () => {
    it("quotes a name with double quotes", () => {
      expect(sqlNameQuote("table")).toBe('"table"');
      expect(sqlNameQuote('my"table')).toBe('"my"table"');
    });
  });

  describe("sqlColumnAccess", () => {
    it("returns quoted table and column", () => {
      expect(sqlColumnAccess("users", "id")).toBe('"users"."id"');
    });
    it("adds AS clause if provided", () => {
      expect(sqlColumnAccess("users", "id", "userId")).toBe('"users"."id" AS "userId"');
    });
  });

  describe("sqlSelectColumns", () => {
    it("joins elements with comma", () => {
      expect(sqlSelectColumns(["a", "b", "c"])).toBe("a, b, c");
    });
  });

  describe("sql_jsonb_object_agg", () => {
    it("wraps element in jsonb_object_agg()", () => {
      expect(sql_jsonb_object_agg("foo")).toBe("jsonb_object_agg(foo)");
    });
  });

  describe("sql_jsonb_array_elements", () => {
    it("wraps element in jsonb_array_elements()", () => {
      expect(sql_jsonb_array_elements("bar")).toBe("jsonb_array_elements(bar)");
    });
  });

  describe("sql_jsonb_each", () => {
    it("wraps element in jsonb_each()", () => {
      expect(sql_jsonb_each("baz")).toBe("jsonb_each(baz)");
    });
  });

  describe("sqlFrom", () => {
    it("joins items with comma", () => {
      expect(sqlFrom(["users", "orders"])).toBe("users, orders");
    });
  });

  describe("sqlDefineColumn", () => {
    it("returns expression as is if no alias", () => {
      expect(sqlDefineColumn(undefined, "COUNT(*)")).toBe("COUNT(*)");
    });
    it("adds AS clause if alias provided", () => {
      expect(sqlDefineColumn(undefined, {queryPart: "defineColumn", value: "COUNT(*)", as: "total"})).toBe('COUNT(*) AS "total"');
    });
  });


  // #################################################################################################
  describe("sqlQuery", () => {
    it("returns query as is if string", () => {
      expect(sqlQuery(undefined, "SELECT * FROM users")).toBe("SELECT * FROM users");
    });

    it("builds query from schema with no select", () => {
      expect(
        sqlQuery(undefined, {
          queryPart: "query",
          from: "y",
        })
      ).toBe("SELECT * FROM y");
    });

    it("builds query from schema with SELECT string", () => {
      expect(
        sqlQuery(undefined, {
          queryPart: "query",
          select: "x",
          from: "y",
        })
      ).toBe("SELECT x FROM y");
    });

    it("builds query from schema without WHERE", () => {
      expect(
        sqlQuery(undefined, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "expr", value: "x" } }],
          from: "y",
        })
      ).toBe("SELECT x FROM y");
    });

    it("builds SELECT query from schema with WHERE", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "expr", value: "x" } }],
          from: "y",
          where: "z=2",
        })
      ).toBe(`SELECT x
FROM y
WHERE z=2`);
    });
  });

  // #################################################################################################
  describe("ListReducerToSpreadObjectTransformer", () => {
    // it("is an object with expected structure", () => {
    //   expect(sqlQuerySelectSchema).toHaveProperty("type", "schemaReference");
    //   expect(sqlQuerySelectSchema).toHaveProperty("context");
    //   expect(sqlQuerySelectSchema).toHaveProperty("definition");
    //   expect(sqlQuerySelectSchema.definition).toHaveProperty("relativePath", "rootSqlQuery");
    // });

    it("for json_array input", () => {
      const transformerLabel = "listReducerToSpreadObject";
      const applyToLabel = transformerLabel + "_applyTo";
      const applyToLabelElements = applyToLabel + "_elements";
      const applyToLabelPairs = applyToLabel + "_pairs";
      const applyTo = {
        type: "json_array",
        sqlStringOrObject: 'SELECT "constantObject" AS "objectList"\n  FROM "objectList"',
        usedContextEntries: ["objectList"],
        resultAccessPath: [0, "objectList"],
        columnNameContainingJsonValue: "objectList",
      };
      const sqlNewQuery = sqlQuery(0, {
        queryPart: "query",
        select: [
          {
            queryPart: "defineColumn",
            value: {
              queryPart: "expr",
              value: sql_jsonb_object_agg(
                sqlSelectColumns([
                  sqlColumnAccess(applyToLabelPairs, "key"),
                  sqlColumnAccess(applyToLabelPairs, "value"),
                ])
              ),
            },
            as: transformerLabel,
          },
        ],
        from: sqlFrom([
          sqlNameQuote(applyToLabel),
          sqlDefineColumn(
            0,
            {
              queryPart: "defineColumn",
              value: sql_jsonb_array_elements(
                sqlColumnAccess(applyToLabel, (applyTo as any).columnNameContainingJsonValue)
              ),
              as: applyToLabelElements,
            }
          ),
          sqlDefineColumn(0, {queryPart: "defineColumn", value: sql_jsonb_each(sqlNameQuote(applyToLabelElements)), as: applyToLabelPairs}),
        ]),
      });
      expect(sqlNewQuery).toBe(
        `SELECT jsonb_object_agg("listReducerToSpreadObject_applyTo_pairs"."key", "listReducerToSpreadObject_applyTo_pairs"."value") AS "listReducerToSpreadObject"
FROM "listReducerToSpreadObject_applyTo", jsonb_array_elements("listReducerToSpreadObject_applyTo"."objectList") AS "listReducerToSpreadObject_applyTo_elements", jsonb_each("listReducerToSpreadObject_applyTo_elements") AS "listReducerToSpreadObject_applyTo_pairs"`
      );
    });
  });
});
