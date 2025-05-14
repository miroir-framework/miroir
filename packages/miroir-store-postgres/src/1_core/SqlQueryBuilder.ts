import { JzodElement, JzodReference } from "miroir-core";
import { SqlQuerySelectSchema } from "../generated";

export const sqlNameQuote = (name: string) => '"' + name + '"';
export const sqlColumnAccess = (table: string, key: string, as?: string) =>
  sqlNameQuote(table) + "." + sqlNameQuote(key) + (as ? " AS " + sqlNameQuote(as) : "");
export const sqlDefineColumn = (expression: string, as?: string) =>
  expression + (as ? " AS " + sqlNameQuote(as) : "");
export const sqlSelectColumns = (elements: string[]) => elements.join(", ");
// export const sql_jsonb_each = (elements: string[]) => elements.join(", ");
export const sql_jsonb_object_agg = (element: string) => 'jsonb_object_agg(' + element + ')';
export const sql_jsonb_array_elements = (element: string) => 'jsonb_array_elements(' + element + ')';
export const sql_jsonb_each = (element: string) => 'jsonb_each(' + element + ')';
export function sqlFrom(items: string[]) {
  return items.join(", ");
} 
export function sqlQuery(select: string, from: string, where?: string) {
  return `SELECT ${select} FROM ${from}${where ? " WHERE " + where : ""}`;
}
export function sqlQueryNew(p:SqlQuerySelectSchema) {
  return `SELECT ${p.select} FROM ${p.from}${p.where ? " WHERE " + p.where : ""}`;
}

export const sqlQuerySelectSchema: JzodReference = {
  type: "schemaReference",
  context: {
    sqlQueryExpressionSchema: {
      type: "object",
      definition: {
        value: {
          type: "string",
          // description: "The type of the expression.",
        },
        // as: {
        //   type: "string",
        //   // description: "The value of the expression.",
        // },
      },
    },
    sqlQueryColumnExpressionSchema: {
      type: "object",
      definition: {
        value: {
          type: "schemaReference",
          definition: {
            absolutePath: "",
            relativePath: "sqlQueryExpressionSchema",
          },
          // description: "The type of the expression.",
        },
        as: {
          type: "string",
          // description: "The value of the expression.",
        },
      },
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
    innerSqlQuerySelect: {
      type: "object",
      definition: {
        from: {
          type: "string",
          // type: "array",
          // // label: "The name of the table to select from.",
          // definition: {
          //   type: "string",
          //   // description: "The name of the table to select from.",
          // },
        },
        select: {
          type: "string",
          // type: "array",
          // definition: {
          //   type: "schemaReference",
          //   definition: {
          //     absolutePath: "",
          //     relativePath: "sqlQueryExpressionSchema",
          //   },
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
  },
  definition: {
    relativePath: "innerSqlQuerySelect",
  },
};