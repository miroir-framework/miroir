import { ZodType, ZodTypeAny, z } from "zod";



export type SqlQueryExpressionSchema = string | {
    queryPart: "expr";
    value: string;
} | {
    queryPart: "call";
    fct: string;
    params: SqlQueryExpressionSchema[];
} | {
    queryPart: "columnAccess";
    array: string;
    col: string;
};
export type SqlQueryDefineColumnSchema = string | {
    queryPart: "defineColumn";
    value: SqlQueryExpressionSchema;
    as?: string | undefined;
};
export type SqlWhereItemSchema = {
    what: SqlQuerySelectSchema;
    as: string;
};
export type RootSqlQuery = string | {
    queryPart: "query";
    select?: (string | SqlQueryDefineColumnSchema[]) | undefined;
    from: string;
    where?: string | undefined;
};
export type SqlQuerySelectSchema = RootSqlQuery;

export const sqlQueryExpressionSchema: z.ZodType<SqlQueryExpressionSchema> = z.union([z.string(), z.object({queryPart:z.literal("expr"), value:z.string()}).strict(), z.object({queryPart:z.literal("call"), fct:z.string(), params:z.array(z.lazy(() =>sqlQueryExpressionSchema))}).strict(), z.object({queryPart:z.literal("columnAccess"), array:z.string(), col:z.string()}).strict()]);
export const sqlQueryDefineColumnSchema: z.ZodType<SqlQueryDefineColumnSchema> = z.union([z.string(), z.object({queryPart:z.literal("defineColumn"), value:z.lazy(() =>sqlQueryExpressionSchema), as:z.string().optional()}).strict()]);
export const sqlWhereItemSchema: z.ZodType<SqlWhereItemSchema> = z.object({what:z.lazy(() =>sqlQuerySelectSchema), as:z.string()}).strict();
export const rootSqlQuery: z.ZodType<RootSqlQuery> = z.union([z.string(), z.object({queryPart:z.literal("query"), select:z.union([z.string(), z.array(z.lazy(() =>sqlQueryDefineColumnSchema))]).optional(), from:z.string(), where:z.string().optional()}).strict()]);
export const sqlQuerySelectSchema = z.lazy(() =>rootSqlQuery);

