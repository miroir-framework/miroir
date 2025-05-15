import { JzodReference } from "miroir-core";
import {
  SqlQueryDefineColumnSchema,
  SqlQueryHereTableDefinitionSchema,
  SqlQueryHereTableExpressionSchema,
  SqlQuerySelectExpressionSchema,
  SqlQuerySelectSchema,
  SqlQueryTableColumnAccessSchema,
  SqlQueryTableLiteralSchema,
} from "../generated";

// ################################################################################################
export function indent(indentLevel: number | undefined) {
  return indentLevel?"  ".repeat(indentLevel): "";
}
// ################################################################################################
export function indentOrSpace(indentLevel: number | undefined) {
  return indentLevel?"  ".repeat(indentLevel): " ";
}
// ################################################################################################
export function flushAndIndent(indentLevel: number | undefined) {
  return indentLevel != undefined?"\n" + indent(indentLevel): " ";
}

// ################################################################################################
export const sqlNameQuote = (name: string) => '"' + name + '"';
export const sqlSelectColumns = (elements: string[]) => elements.join(", ");
export const sql_jsonb_object_agg = (element: string) => 'jsonb_object_agg(' + element + ')';
export const sql_jsonb_array_elements = (element: string) => 'jsonb_array_elements(' + element + ')';
export const sql_jsonb_each = (element: string) => 'jsonb_each(' + element + ')';
export function sqlFromOld(items: string[]) {
  return items.join(", ");
} 
export const sqlColumnAccessOld = (table: string, key: string, as?: string) =>
  sqlNameQuote(table) + "." + sqlNameQuote(key) + (as ? " AS " + sqlNameQuote(as) : "");

// ################################################################################################
export function sqlColumnAccess(q: SqlQueryTableColumnAccessSchema) {
  if (typeof q == "string") {
    return q;
  }
  // return sqlColumnAccessOld(sqlQueryTableLiteral(q.table), q.col);
  return sqlQueryTableLiteral(q.table) + "." + sqlNameQuote(q.col); // + (as ? " AS " + sqlNameQuote(as) : "");
}

// ################################################################################################
export function sqlQueryTableLiteral(q: SqlQueryTableLiteralSchema) {
  if (typeof q == "string") {
    return q;
  }
  return sqlNameQuote(q.name)
}

// ################################################################################################
export function sqlSelectExpression(
  indentLevel: number | undefined,
  q: SqlQuerySelectExpressionSchema 
): string {
  if (typeof q == "string") {
    return q;
  }
  let result;
  switch (q.queryPart) {
    case "bypass": {
      // result = indent(indentLevel) + q.value;
      result = q.value;
      break;
    }
    case "call": {
      result = `${indent(indentLevel)}${q.fct}(${q.params
        .map((item) => sqlSelectExpression(indentLevel, item))
        .join(", ")})`;
      break;
    }
    case "tableColumnAccess": {
      return `${indent(indentLevel)}${sqlColumnAccessOld(sqlQueryTableLiteral(q.table), q.col)}`;
      break;
    }
  }
  // console.log(`indent(${indentLevel})="${indent(indentLevel)}"`);
  // console.log("sqlSelectExpression", q.queryPart, "returns", result);
  return result;
}

// #################################################################################################
export function sqlDefineColumn(indentLevel: number | undefined, q: SqlQueryDefineColumnSchema) {
  if (typeof q == "string") {
    return q;
  }
  return sqlSelectExpression(indentLevel, q.value) + (q.as ? " AS " + sqlNameQuote(q.as) : "");
}

// #################################################################################################
export function sqlQueryHereTableExpression(
  indentLevel: number | undefined, 
  q: SqlQueryHereTableExpressionSchema
): string {
  if (typeof q == "string") {
    return q;
  }
  let result;
  switch (q.queryPart) {
    case "tableLiteral": {
      result = sqlQueryTableLiteral(q);
      break;
    }
    case "tableColumnAccess": {
      result = sqlColumnAccess(q);
      break;
    }
    case "bypass": {
      result = `${indent(indentLevel)}${q.value}`;
      break;
    }
    case "call": {
      result = `${indent(indentLevel)}${q.fct}(${q.params
        .map((item) => sqlQueryHereTableExpression(indentLevel, item))
        .join(", ")})`;
      break;
    }
  }
  return result;
}

// #################################################################################################
export function sqlQueryHereTableDefinition(
  indentLevel: number | undefined, 
  q: SqlQueryHereTableDefinitionSchema
) {
  if (typeof q == "string") {
    return q;
  }
  let result;
  switch (q.queryPart) {
    case "bypass": {
      result = `${indent(indentLevel)}${q.value}`;
      break;
    }
    case "tableLiteral": {
      result = sqlQueryTableLiteral(q);
      break;
    }
    case "hereTable": {
      if (typeof q.definition == "string") {
        result = q.definition + (q.as ? " AS " + sqlNameQuote(q.as) : "");
      } else {
        result = `${indent(indentLevel)}${sqlQueryHereTableExpression(indentLevel, q.definition)}${
          q.as ? " AS " + sqlNameQuote(q.as) : ""
        }`;
      }
      break;
    }
  }

  return result;
}
// #################################################################################################
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
  console.log("sqlQuery selectParts", selectParts);
  const fromParts = !q.from
    ? ""
    : typeof q.from == "string"
    ? q.from
    : q.from
        .map((item) => {
          return sqlQueryHereTableDefinition(indentLevel, item);
        })
        .join(", ");
  return `SELECT ${selectParts}${flushAndIndent(indentLevel)}FROM ${fromParts}${q.where ? `${flushAndIndent(indentLevel)}WHERE ${q.where}` : ""}`;
}

// #################################################################################################
export const sqlQuerySelectSchema: JzodReference = {
  type: "schemaReference",
  context: {
    sqlQueryTableLiteralSchema: {
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
              definition: "tableLiteral",
            },
            name: {
              type: "string",
            },
            // as: {
            //   type: "string",
            //   optional: true,
            // },
          },
        },
      ],
    },
    sqlQueryTableColumnAccessSchema: {
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
              definition: "tableColumnAccess",
            },
            table: {
              type: "schemaReference",
              definition: {
                relativePath: "sqlQueryTableLiteralSchema",
              },
            },
            col: {
              type: "string",
            },
          },
        },
      ],
    },
    sqlQuerySelectExpressionSchema: {
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
              definition: "bypass",
            },
            value: {
              type: "string",
            },
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "sqlQueryTableColumnAccessSchema",
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
                  relativePath: "sqlQuerySelectExpressionSchema",
                },
              },
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
                relativePath: "sqlQuerySelectExpressionSchema",
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
    sqlQueryFromSchema: {
      type: "union",
      definition: [
        {
          type: "string",
        },
        {
          type: "array",
          definition: {
            type: "schemaReference",
            definition: {
              relativePath: "sqlQueryTableLiteralSchema",
            },
          },
        },
      ],
    },
    sqlQueryHereTableExpressionSchema: {
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
              definition: "bypass",
            },
            value: {
              type: "string",
            },
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "sqlQueryTableLiteralSchema",
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "sqlQueryTableColumnAccessSchema",
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
                  relativePath: "sqlQueryHereTableExpressionSchema",
                },
              },
            },
          },
        },
      ],
    },
    sqlQueryHereTableDefinitionSchema: {
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
              definition: "bypass",
            },
            value: {
              type: "string",
            },
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "sqlQueryTableLiteralSchema",
          },
        },
        {
          type: "object",
          definition: {
            queryPart: {
              type: "literal",
              definition: "hereTable",
            },
            definition: {
              type: "schemaReference",
              definition: {
                relativePath: "sqlQueryHereTableExpressionSchema",
              },
            },
            as: {
              type: "string",
              optional: true,
            },
          },
        },
      ],
    },
    rootSqlQuery: {
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
              type: "union",
              optional: true,
              definition: [
                {
                  type: "string",
                },
                {
                  type: "array",
                  definition: {
                    // type: "union",
                    // definition: [
                    //   // {
                    //   //   type: "schemaReference",
                    //   //   definition: {
                    //   //     relativePath: "sqlQueryTableLiteralSchema",
                    //   //   },
                    //   // },
                      // {
                        type: "schemaReference",
                        definition: {
                          relativePath: "sqlQueryHereTableDefinitionSchema",
                        },
                      // },
                  //   ],
                  },
                },
              ],
              // }
              // type: "string",
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