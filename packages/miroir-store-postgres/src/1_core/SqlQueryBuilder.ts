import { JzodReference, MiroirLoggerFactory, type LoggerInterface } from "miroir-core";
import {
  SqlQueryDefineColumnSchema,
  SqlQueryHereTableDefinitionSchema,
  SqlQueryHereTableExpressionSchema,
  SqlQuerySelectExpressionSchema,
  SqlQuerySelectSchema,
  SqlQueryTableColumnAccessSchema,
  SqlQueryTableLiteralSchema,
} from "../generated";
import { cleanLevel } from "../4_services/constants";
import { packageName } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlQueryBuilder")
).then((logger: LoggerInterface) => {log = logger});

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
  return indentLevel != undefined?"\n" + indent(indentLevel): "";
}

// ################################################################################################
export function flushAndIndentOrSpace(indentLevel: number | undefined) {
  return indentLevel != undefined?"\n" + indent(indentLevel): " ";
  // return indentLevel != undefined?"\n" + indent(indentLevel): " ";
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
export function sqlQueryTableLiteral(q: SqlQueryTableLiteralSchema) {
  if (typeof q == "string") {
    return sqlNameQuote(q);
  }
  switch (q.queryPart) {
    case "tableLiteral": {
      return sqlNameQuote(q.name);
    }
    case "bypass": {
      return q.value;
    }
    default: {
      throw new Error("Unknown query part: " + JSON.stringify(q));
    }
  }
}

// ################################################################################################
export function sqlTableColumnAccess(q: SqlQueryTableColumnAccessSchema) {
  if (typeof q == "string") {
    return q;
  }
  return sqlQueryTableLiteral(q.table) + "." + (q.col?sqlNameQuote(q.col):"*"); // + (as ? " AS " + sqlNameQuote(as) : "");
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
    case "case": {
      const indentNext = indentLevel != undefined ? indentLevel + 1 : undefined;
      // log.info("sqlSelectExpression", q.queryPart, "indentLevel", indentLevel, "indentNext", indentNext);
      result = `${indent(indentLevel)}CASE${flushAndIndentOrSpace(indentNext)}WHEN ${sqlSelectExpression(undefined, q.when)}${flushAndIndentOrSpace(indentNext)}THEN ${sqlSelectExpression(
        undefined,
        q.then
      )}${flushAndIndentOrSpace(indentNext)}ELSE ${sqlSelectExpression(undefined, q.else)}${flushAndIndentOrSpace(indentLevel)}END`;
      break;
    }
    case "tableColumnAccess": {
      return sqlTableColumnAccess(q);
      break;
    }
    case "tableLiteral": {
      result = sqlQueryTableLiteral(q);
      break;
    }
  }
  // log.info(`indent(${indentLevel})="${indent(indentLevel)}"`);
  // log.info("sqlSelectExpression", q.queryPart, "returns", result);
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
      result = sqlTableColumnAccess(q);
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
): string {
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
        switch (q.definition.queryPart) {
          case "query": {
            result = '(' + sqlQuery(indentLevel??0 + 1, q.definition) + ')' + (q.as ? " AS " + sqlNameQuote(q.as) : "");
            break;
          }
          case "bypass":
          case "tableLiteral":
          case "tableColumnAccess":
          case "call": {
            result = `${indent(indentLevel)}${sqlQueryHereTableExpression(indentLevel, q.definition)}${
              q.as ? " AS " + sqlNameQuote(q.as) : ""
            }`;
            break;
          }
          default: {
            throw new Error("Unknown query part: " + JSON.stringify(q.definition));
            break;
          }
        }
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
  log.info("sqlQuery selectParts", selectParts);
  const fromParts =
    (q.from == undefined || (Array.isArray(q.from) && q.from.length == 0))
      ? ""
      : ("FROM " +
        (typeof q.from == "string"
          ? q.from
          : q.from
              .map((item) => {
                return sqlQueryHereTableDefinition(indentLevel, item);
              })
              .join(", ")));

  log.info("sqlQuery fromParts", fromParts);
  return `SELECT ${selectParts}${flushAndIndentOrSpace(indentLevel)}${fromParts}${q.where ? `${flushAndIndentOrSpace(indentLevel)}WHERE ${q.where}` : ""}`;
}

// #################################################################################################
export const sqlQuerySelectSchema: JzodReference = {
  type: "schemaReference",
  context: {
    sqlQueryByPass: {
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
    sqlQueryTableLiteralSchema: {
      type: "union",
      definition: [
        {
          type: "string",
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "sqlQueryByPass",
          },
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
              optional: true, // "*" if not present
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
              definition: "case",
            },
            when: {
              type: "schemaReference",
              definition: {
                relativePath: "sqlQuerySelectExpressionSchema",
              },
            },
            then: {
              type: "schemaReference",
              definition: {
                relativePath: "sqlQuerySelectExpressionSchema",
              },
            },
            else: {
              type: "schemaReference",
              definition: {
                relativePath: "sqlQuerySelectExpressionSchema",
              },
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
              type: "union",
              definition: [
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "sqlQueryHereTableExpressionSchema",
                  },
                },
                {
                  type: "schemaReference",
                  definition: {
                    relativePath: "rootSqlQuery",
                  },
                },
              ],
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
                    type: "schemaReference",
                    definition: {
                      relativePath: "sqlQueryHereTableDefinitionSchema",
                    },
                  },
                },
              ],
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