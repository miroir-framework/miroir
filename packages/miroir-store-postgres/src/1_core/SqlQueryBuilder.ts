import { JzodReference } from "miroir-core";
import { SqlQueryDefineColumnSchema, SqlQueryExpressionSchema, SqlQuerySelectSchema } from "../generated";

// ################################################################################################
export function indent(indentLevel: number | undefined) {
  return indentLevel?"  ".repeat(indentLevel): "";
}
// ################################################################################################
export function flushAndIndent(indentLevel: number | undefined) {
  return indentLevel != undefined?"\n" + indent(indentLevel): " ";
}

// ################################################################################################
export const sqlNameQuote = (name: string) => '"' + name + '"';
export const sqlColumnAccess = (table: string, key: string, as?: string) =>
  sqlNameQuote(table) + "." + sqlNameQuote(key) + (as ? " AS " + sqlNameQuote(as) : "");
export const sqlSelectColumns = (elements: string[]) => elements.join(", ");
export const sql_jsonb_object_agg = (element: string) => 'jsonb_object_agg(' + element + ')';
export const sql_jsonb_array_elements = (element: string) => 'jsonb_array_elements(' + element + ')';
export const sql_jsonb_each = (element: string) => 'jsonb_each(' + element + ')';
export function sqlFrom(items: string[]) {
  return items.join(", ");
} 

export function sqlExpression(indentLevel: number | undefined, q: SqlQueryExpressionSchema):string {
  if (typeof q == "string") {
    return q;
  }
  switch (q.queryPart) {
    case "expr":
      return `${indent(indentLevel)}${q.value}`;
    case "call":
      return `${indent(indentLevel)}${q.fct}(${q.params.map((item) => sqlExpression(indentLevel, item)).join(", ")})`;
    case "columnAccess":
      return `${indent(indentLevel)}${sqlColumnAccess(q.array, q.col)}`;
  }
}

export function sqlDefineColumn(indentLevel: number | undefined, q: SqlQueryDefineColumnSchema) {
  if (typeof q == "string") {
    return q;
  }
  return sqlExpression(indentLevel, q.value) + (q.as ? " AS " + sqlNameQuote(q.as) : "");
}

export function sqlQuery(indentLevel: number | undefined, q: SqlQuerySelectSchema) {
  if (typeof q == "string") {
    return q;
  }
  const selectParts = !q.select
    ? "*"
    :
    typeof q.select == "string"
      ? q.select
      : q.select
          .map((item) => typeof item == "string"?item:sqlDefineColumn(indentLevel, item))
          .join(", ");
  return `SELECT ${selectParts}${flushAndIndent(indentLevel)}FROM ${q.from}${q.where ? `${flushAndIndent(indentLevel)}WHERE ${q.where}` : ""}`;
}

// #################################################################################################
export const sqlQuerySelectSchema: JzodReference = {
  type: "schemaReference",
  context: {
    sqlQueryExpressionSchema: {
      type: "union",
      definition: [
        {
          type: "string",
        },
        {
          type: "object",
          definition: {
            queryPart: {
              type: "literal",
              definition: "expr",
            },
            value: {
              type: "string",
            },
          },
        },
        {
          type: "object",
          definition: {
            queryPart: {
              type: "literal",
              definition: "call",
            },
            fct: {
              type: "string",
            },
            params: {
              type: "array",
              definition: {
                type: "schemaReference",
                definition: {
                  relativePath: "sqlQueryExpressionSchema",
                },
              },
            },
          },
        },
        {
          type: "object",
          definition: {
            queryPart: {
              type: "literal",
              definition: "columnAccess",
            },
            array: {
              type: "string",
            },
            col: {
              type: "string",
            },
          },
        },
      ],
    },
    sqlQueryDefineColumnSchema: {
      type: "union",
      definition: [
        {
          type: "string",
        },
        {
          type: "object",
          definition: {
            queryPart: {
              type: "literal",
              definition: "defineColumn",
            },
            value: {
              // type: "string"
              type: "schemaReference",
              definition: {
                relativePath: "sqlQueryExpressionSchema",
              },
              // description: "The type of the expression.",
            },
            as: {
              type: "string",
              optional: true,
              // description: "The value of the expression.",
            },
          },
        },
      ],
    },
    sqlWhereItemSchema: {
      type: "object",
      definition: {
        what: {
          type: "schemaReference",
          definition: {
            absolutePath: "",
            relativePath: "sqlQuerySelectSchema",
          },
        },
        as: {
          type: "string",
          // description: "The value of the expression.",
        },
      },
    },
    rootSqlQuery: {
      type: "union",
      definition: [
        {
          type: "string"
        },
        {
          type: "object",
          definition: {
            queryPart: {
              type: "literal",
              definition: "query",
            },
            select: {
              type: "union",
              optional: true,
              definition: [
                {
                  type: "string",
                },
                {
                  type: "array",
                  definition: {
                    type: "schemaReference",
                    definition: {
                      relativePath: "sqlQueryDefineColumnSchema",
                    },
                  },
                },
              ],
            },
            from: {
              type: "string",
              // type: "array",
              // // label: "The name of the table to select from.",
              // definition: {
              //   type: "string",
              //   // description: "The name of the table to select from.",
              // },
            },
            where: {
              type: "string",
              optional: true,
              // type: "array",
              // optional: true,
              // // description: "The conditions for the WHERE clause.",
              // definition: {
              //   type: "schemaReference",
              //   definition: {
              //     absolutePath: "",
              //     relativePath: "sqlWhereItemSchema",
              //   },
              // },
            },
          },
        },
      ],
    },
  },
  definition: {
    relativePath: "rootSqlQuery",
  },
};