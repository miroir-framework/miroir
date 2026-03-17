// import { describe, it, expect } from "vitest";
import {
  sql_jsonb_array_elements,
  sql_jsonb_each,
  sql_jsonb_object_agg,
  sqlTableColumnAccess,
  sqlColumnAccessOld,
  sqlDefineColumn,
  sqlSelectExpression,
  sqlFromOld,
  sqlNameQuote,
  sqlQuery,
  sqlQueryHereTableDefinition,
  sqlSelectColumns,
  sqlQueryHereTableExpression,
  sqlQueryTableLiteral,
  sqlWith,
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
    it("returns table literal as quoted string (that is a table name) by default", () => {
      expect(sqlQueryTableLiteral("toto")).toBe('"toto"');
    });
    it("returns bypass value", () => {
      expect(sqlQueryTableLiteral({ queryPart: "bypass", value: "toto" })).toBe("toto");
    });
    it("returns quoted name", () => {
      expect(sqlQueryTableLiteral({ queryPart: "tableLiteral", name: "toto" })).toBe('"toto"');
    });
  });

  // #################################################################################################
  describe("sqlTableColumnAccess", () => {
    it("returns quoted table when using plain string", () => {
      expect(
        sqlTableColumnAccess({
          queryPart: "tableColumnAccess",
          table: "users",
          col: "id",
        })
      ).toBe('"users"."id"');
    });
    it("returns quoted table when using tableLiteral", () => {
      expect(
        sqlTableColumnAccess({
          queryPart: "tableColumnAccess",
          table: { queryPart: "tableLiteral", name: "users" },
          col: "id",
        })
      ).toBe('"users"."id"');
    });
    it("returns bypassed table name", () => {
      expect(
        sqlTableColumnAccess({
          queryPart: "tableColumnAccess",
          table: { queryPart: "bypass", value: '"users"' },
          col: "id",
        })
      ).toBe('"users"."id"');
    });
    it("returns '*' as column name by default", () => {
      expect(
        sqlTableColumnAccess({
          queryPart: "tableColumnAccess",
          table: "users",
        })
      ).toBe('"users".*');
    });
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
    it("returns case expression with WHEN and THEN", () => {
      expect(
        sqlSelectExpression(undefined, {
          queryPart: "case",
          when: "x=1",
          then: "y",
          // when: [
          //   { condition: "x=1", then: "y" },
          //   { condition: "x=2", then: "z" },
          // ],
          else: "default",
        })
      ).toBe(`CASE WHEN x=1 THEN y ELSE default END`);
  });
  it("indented_returns case expression with WHEN and THEN", () => {
    expect(
      sqlSelectExpression(0, {
        queryPart: "case",
        when: "x=1",
        then: "y",
        else: "default",
      })
    ).toBe(`CASE
  WHEN x=1
  THEN y
  ELSE default
END`);
  });
  it("returns table column access expression", () => {
    expect(
      sqlSelectExpression(undefined, {
        queryPart: "tableColumnAccess",
        table: { queryPart: "tableLiteral", name: "users" },
        col: "id",
      })
    ).toBe('"users"."id"');
  });
  it("return table access expression", () => {
    expect(
      sqlSelectExpression(undefined, {
        queryPart: "tableLiteral",
        name: "users",
      })
    ).toBe('"users"');
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
    it("builds query subquery", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "x" } }],
          from: [
            {
              queryPart: "hereTable",
              definition: {
                queryPart: "query",
                select: [{ queryPart: "defineColumn", value: { queryPart: "bypass", value: "y" } }],
                from: ["z"],
              },
              as: "alias",
            },
          ],
        })
      ).toBe(`SELECT x
FROM (SELECT y
FROM z) AS "alias"`);
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
                  col: applyTo.columnNameContainingJsonValue,
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

  // #################################################################################################
  describe("sqlQuery with ORDER BY", () => {
    it("builds query with ORDER BY clause", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: "*",
          from: [{ queryPart: "tableLiteral", name: "users" }],
          orderBy: '"name" ASC',
        })
      ).toBe(`SELECT *
FROM "users"
ORDER BY "name" ASC`);
    });

    it("builds query with WHERE and ORDER BY", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          from: [{ queryPart: "tableLiteral", name: "users" }],
          where: '"active" = true',
          orderBy: '"name"',
        })
      ).toBe(`SELECT *
FROM "users"
WHERE "active" = true
ORDER BY "name"`);
    });

    it("builds query with GROUP BY and ORDER BY", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: "COUNT(*)", as: "cnt" }],
          from: [{ queryPart: "tableLiteral", name: "orders" }],
          groupBy: '"status"',
          orderBy: '"status"',
        })
      ).toBe(`SELECT COUNT(*) AS "cnt"
FROM "orders"
GROUP BY "status"
ORDER BY "status"`);
    });
  });

  // #################################################################################################
  describe("sqlQuery with LIMIT and OFFSET", () => {
    it("builds query with LIMIT only", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          from: [{ queryPart: "tableLiteral", name: "users" }],
          limit: 10,
        })
      ).toBe(`SELECT *
FROM "users"
LIMIT 10`);
    });

    it("builds query with LIMIT and OFFSET", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          from: [{ queryPart: "tableLiteral", name: "users" }],
          limit: 1,
          offset: 5,
        })
      ).toBe(`SELECT *
FROM "users"
LIMIT 1 OFFSET 5`);
    });

    it("builds query with ORDER BY, LIMIT and OFFSET", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          from: [{ queryPart: "tableLiteral", name: "users" }],
          orderBy: '"name"',
          limit: 1,
          offset: 3,
        })
      ).toBe(`SELECT *
FROM "users"
ORDER BY "name"
LIMIT 1 OFFSET 3`);
    });
  });

  // #################################################################################################
  describe("sqlQuery with DISTINCT ON", () => {
    it("builds query with DISTINCT ON clause", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          distinctOn: '"name"',
          from: [{ queryPart: "tableLiteral", name: "users" }],
          orderBy: '"name"',
        })
      ).toBe(`SELECT DISTINCT ON ("name") *
FROM "users"
ORDER BY "name"`);
    });

    it("builds query with DISTINCT ON and specific columns", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          distinctOn: '"department"',
          select: [{ queryPart: "defineColumn", value: '"name"' }],
          from: [{ queryPart: "tableLiteral", name: "employees" }],
          orderBy: '"department", "salary" DESC',
        })
      ).toBe(`SELECT DISTINCT ON ("department") "name"
FROM "employees"
ORDER BY "department", "salary" DESC`);
    });
  });

  // #################################################################################################
  describe("sqlQuery with LATERAL from", () => {
    it("builds query with LATERAL subquery in FROM", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          from: [
            { queryPart: "tableLiteral", name: "orders" },
            {
              queryPart: "hereTable",
              lateral: true,
              definition: {
                queryPart: "call",
                fct: "jsonb_array_elements",
                params: [{ queryPart: "tableColumnAccess", table: "orders", col: "items" }],
              },
              as: "item",
            },
          ],
        })
      ).toBe(`SELECT *
FROM "orders", LATERAL jsonb_array_elements("orders"."items") AS "item"`);
    });

    it("builds query with LATERAL subquery without AS", () => {
      expect(
        sqlQuery(undefined, {
          queryPart: "query",
          from: [
            { queryPart: "tableLiteral", name: "t" },
            {
              queryPart: "hereTable",
              lateral: true,
              definition: { queryPart: "bypass", value: 'jsonb_each("t"."data")' },
              as: "kv",
            },
          ],
        })
      ).toBe(`SELECT * FROM "t", LATERAL jsonb_each("t"."data") AS "kv"`);
    });
  });

  // #################################################################################################
  describe("sqlQuery with HAVING", () => {
    it("builds query with GROUP BY and HAVING", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [{ queryPart: "defineColumn", value: "COUNT(*)", as: "cnt" }],
          from: [{ queryPart: "tableLiteral", name: "orders" }],
          groupBy: '"status"',
          having: "COUNT(*) > 5",
        })
      ).toBe(`SELECT COUNT(*) AS "cnt"
FROM "orders"
GROUP BY "status"
HAVING COUNT(*) > 5`);
    });

    it("builds query with GROUP BY, HAVING, and ORDER BY", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          select: [
            { queryPart: "defineColumn", value: '"department"' },
            { queryPart: "defineColumn", value: "AVG(salary)", as: "avg_salary" },
          ],
          from: [{ queryPart: "tableLiteral", name: "employees" }],
          groupBy: '"department"',
          having: "AVG(salary) > 50000",
          orderBy: '"department"',
        })
      ).toBe(`SELECT "department", AVG(salary) AS "avg_salary"
FROM "employees"
GROUP BY "department"
HAVING AVG(salary) > 50000
ORDER BY "department"`);
    });
  });

  // #################################################################################################
  describe("sqlWith", () => {
    it("returns finalSelect when no CTEs", () => {
      expect(sqlWith([], "SELECT * FROM t")).toBe("SELECT * FROM t");
    });

    it("builds WITH clause with single CTE", () => {
      expect(
        sqlWith([{ name: "cte1", sql: "SELECT 1 AS x" }], 'SELECT * FROM "cte1"', 0)
      ).toBe(`WITH
"cte1" AS (
  SELECT 1 AS x
)
SELECT * FROM "cte1"`);
    });

    it("builds WITH clause with multiple CTEs", () => {
      expect(
        sqlWith(
          [
            { name: "a", sql: "SELECT 1" },
            { name: "b", sql: "SELECT 2" },
          ],
          'SELECT * FROM "b"',
          0
        )
      ).toBe(`WITH
"a" AS (
  SELECT 1
),
"b" AS (
  SELECT 2
)
SELECT * FROM "b"`);
    });
  });

  // #################################################################################################
  describe("sqlQuery combined clauses (ORDER BY + GROUP BY + HAVING + LIMIT + OFFSET + DISTINCT ON)", () => {
    it("builds a full query with all clauses", () => {
      expect(
        sqlQuery(0, {
          queryPart: "query",
          distinctOn: '"category"',
          select: [
            { queryPart: "defineColumn", value: '"category"' },
            { queryPart: "defineColumn", value: "SUM(amount)", as: "total" },
          ],
          from: [{ queryPart: "tableLiteral", name: "sales" }],
          where: '"year" = 2024',
          groupBy: '"category"',
          having: "SUM(amount) > 100",
          orderBy: '"category"',
          limit: 10,
          offset: 0,
        })
      ).toBe(`SELECT DISTINCT ON ("category") "category", SUM(amount) AS "total"
FROM "sales"
WHERE "year" = 2024
GROUP BY "category"
HAVING SUM(amount) > 100
ORDER BY "category"
LIMIT 10 OFFSET 0`);
    });
  });
});
