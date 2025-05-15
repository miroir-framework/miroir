// import { describe, it, expect } from "vitest";
import {
  sql_jsonb_array_elements,
  sql_jsonb_each,
  sql_jsonb_object_agg,
  sqlColumnAccess,
  sqlColumnAccessOld,
  sqlDefineColumn,
  sqlSelectExpression,
  sqlFromOld,
  sqlNameQuote,
  sqlQuery,
  sqlQueryHereTableDefinition,
  sqlSelectColumns,
  sqlQueryHereTableExpression
} from "../src/1_core/SqlQueryBuilder";

describe("SqlQueryBuilder", () => {
  describe("sqlNameQuote", () => {
    it("quotes a name with double quotes", () => {
      expect(sqlNameQuote("table")).toBe('"table"');
      expect(sqlNameQuote('my"table')).toBe('"my"table"');
    });
  });

  describe("sqlColumnAccessOld", () => {
    it("returns quoted table and column", () => {
      expect(sqlColumnAccessOld("users", "id")).toBe('"users"."id"');
    });
    it("adds AS clause if provided", () => {
      expect(sqlColumnAccessOld("users", "id", "userId")).toBe('"users"."id" AS "userId"');
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
      expect(sqlFromOld(["users", "orders"])).toBe("users, orders");
    });
  });

  // #################################################################################################
  describe("sqlQueryTableLiteral", () => {
    it("returns table literal as is", () => {
      expect(sqlQuery(undefined, "toto")).toBe("toto");
    });
  });

  // #################################################################################################
  describe("sqlColumnAccess", () => {
    it("returns quoted table and column", () => {
      expect(
        sqlColumnAccess({
          queryPart: "tableColumnAccess",
          table: { queryPart: "tableLiteral", name: "users" },
          col: "id",
        })
      ).toBe('"users"."id"');
    });
    // it("adds AS clause if provided", () => {
    //   expect(sqlColumnAccessOld("users", "id", "userId")).toBe('"users"."id" AS "userId"');
    // });
  });


  // #################################################################################################
  describe("sqlSelectExpression", () => {
    it("returns string as is", () => {
      expect(sqlSelectExpression(undefined, "SELECT * FROM users")).toBe("SELECT * FROM users");
    });
    it("returns bypass expression as is", () => {
      expect(
        sqlSelectExpression(undefined, { queryPart: "bypass", value: "SELECT * FROM users" })
      ).toBe("SELECT * FROM users");
    });
    it("returns call expression with function and params", () => {
      expect(
        sqlSelectExpression(undefined, {
          queryPart: "call",
          fct: "jsonb_object_agg",
          params: ["key", "value"],
        })
      ).toBe("jsonb_object_agg(key, value)");
    });
  });

  // #################################################################################################
  describe("sqlDefineColumn", () => {
    it("returns expression as is if no alias", () => {
      expect(sqlDefineColumn(undefined, "COUNT(*)")).toBe("COUNT(*)");
    });
    it("adds AS clause if alias provided", () => {
      expect(
        sqlDefineColumn(undefined, { queryPart: "defineColumn", value: "COUNT(*)", as: "total" })
      ).toBe('COUNT(*) AS "total"');
    });
    it("returns plain inner expression", () => {
      expect(
        sqlDefineColumn(undefined, {
          queryPart: "defineColumn",
          value: { queryPart: "bypass", value: '"x"' },
        })
      ).toBe('"x"');
    });
  });

  // #################################################################################################
  describe("sqlQueryHereTableExpression", () => {
    it("returns bypass expression as is", () => {
      expect(
        sqlQueryHereTableDefinition(undefined, { queryPart: "bypass", value: "SELECT * FROM users" })
      ).toBe("SELECT * FROM users");
    });
    // it("returns call expression with function with string params", () => {
    //   expect(
    //     sqlQueryHereTableExpression(undefined, {
    //       queryPart: "call",
    //       fct: "jsonb_array_elements",
    //       params: ["foo", "bar"],
    //     })
    //   ).toBe("jsonb_array_elements(foo, bar)");
    // });
    // it("returns call expression with function with table reference params", () => {
    //   expect(
    //     sqlQueryHereTableExpression(undefined, {
    //       queryPart: "call",
    //       fct: "jsonb_array_elements",
    //       params: [
    //         { queryPart: "tableLiteral", name: "foo" },
    //         { queryPart: "tableLiteral", name: "bar" },
    //       ],
    //     })
    //   ).toBe('jsonb_array_elements("foo", "bar")');
    // });
  });

  // #################################################################################################
  describe("sqlQueryHereTableDefinition", () => {
    it("returns table literal as is", () => {
      expect(sqlQueryHereTableDefinition(undefined, "toto")).toBe("toto");
    });
    it("returns table literal with AS clause", () => {
      expect(
        sqlQueryHereTableDefinition(undefined, {
          queryPart: "hereTable",
          definition: { queryPart: "tableLiteral", name: "toto" },
          as: "alias",
        })
      ).toBe('"toto" AS "alias"');
    });
    it("returns table literal with AS clause", () => {
      expect(
        sqlQueryHereTableDefinition(undefined, {
          queryPart: "hereTable",
          definition: { queryPart: "tableLiteral", name: "toto" },
          as: "alias",
        })
      ).toBe('"toto" AS "alias"');
    });
    it("returns bypassed expression with AS clause", () => {
      expect(
        sqlQueryHereTableDefinition(undefined, {
          queryPart: "hereTable",
          definition: { queryPart: "bypass", value: "(SELECT * FROM users)" },
          as: "alias",
        })
      ).toBe('(SELECT * FROM users) AS "alias"');
    });
    it("returns call of function with plain parameter and AS clause", () => {
      expect(
        sqlQueryHereTableDefinition(undefined, {
          queryPart: "hereTable",
          definition: { queryPart: "call", fct: "sql_jsonb_array_elements", params: ["foo"] },
          as: "alias",
        })
      ).toBe('sql_jsonb_array_elements(foo) AS "alias"');
    });
    it("returns call of function with table colunm access parameter and AS clause", () => {
      expect(
        sqlQueryHereTableDefinition(undefined, {
          queryPart: "hereTable",
          definition: {
            queryPart: "call",
            fct: "sql_jsonb_array_elements",
            params: [
              {
                queryPart: "tableColumnAccess",
                table: { queryPart: "tableLiteral", name: "foo" },
                col: "bar",
              },
            ],
          },
          as: "alias",
        })
      ).toBe('sql_jsonb_array_elements("foo"."bar") AS "alias"');
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
          select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } }],
          from: "y",
        })
      ).toBe("SELECT x FROM y");
    });

    it("builds query from schema with WHERE", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } }],
          from: "y",
          where: "z=2",
        })
      ).toBe(`SELECT x
FROM y
WHERE z=2`);
    });

    it("builds query from schema with indent level", () => {
      expect(
        sqlQuery(1, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } }],
          from: "y",
          where: "z=2",
        })
      ).toBe(`SELECT x
  FROM y
  WHERE z=2`);
    });
    it("builds query from schema with multiple SELECT columns", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [
            { queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } },
            { queryPart: "defineColumn", value: { queryPart: "bypass", value: "y" }, as: "alias" },
          ],
          from: "z",
        })
      ).toBe(`SELECT x, y AS "alias"
FROM z`);
    });
    it("builds query from schema with multiple FROM tables, bypass table access", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } }],
          from: ["y", "z"],
        })
      ).toBe(`SELECT x
FROM y, z`);
    });
    it("builds query from schema with multiple FROM tables, structured tableLiteral access", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } }],
          from: [{queryPart: "tableLiteral", name: "y"}, "z"],
        })
      ).toBe(`SELECT x
FROM "y", z`);
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
              queryPart: "bypass",
              value: sql_jsonb_object_agg(
                sqlSelectColumns([
                  sqlColumnAccessOld(applyToLabelPairs, "key"),
                  sqlColumnAccessOld(applyToLabelPairs, "value"),
                ])
              ),
            },
            as: transformerLabel,
          },
        ],
        from: [
          {
            queryPart: "tableLiteral",
            name: applyToLabel,
          },
          {
            queryPart: "hereTable",
            definition: {
              queryPart: "call",
              fct: "jsonb_array_elements",
              params: [
                {
                  queryPart: "tableColumnAccess",
                  table: { queryPart: "tableLiteral", name: applyToLabel},
                  col: (applyTo as any).columnNameContainingJsonValue,
                },
              ],
            },
            as: applyToLabelElements,
          },
          {
            queryPart: "hereTable",
            definition: {
              queryPart: "call",
              fct: "jsonb_each",
              params: [
                {
                  queryPart: "tableLiteral",
                  name: applyToLabelElements,
                },
              ],
            },
            as: applyToLabelPairs,
          },
        ],
      });
      expect(sqlNewQuery).toBe(
        `SELECT jsonb_object_agg("listReducerToSpreadObject_applyTo_pairs"."key", "listReducerToSpreadObject_applyTo_pairs"."value") AS "listReducerToSpreadObject"
FROM "listReducerToSpreadObject_applyTo", jsonb_array_elements("listReducerToSpreadObject_applyTo"."objectList") AS "listReducerToSpreadObject_applyTo_elements", jsonb_each("listReducerToSpreadObject_applyTo_elements") AS "listReducerToSpreadObject_applyTo_pairs"`
      );
    });
  });
});
