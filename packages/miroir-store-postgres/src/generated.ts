import { ZodType, ZodTypeAny, z } from "zod";



export type SqlQueryByPass = {
    queryPart: "bypass";
    value: string;
};
export type SqlQueryTableLiteralSchema = string | SqlQueryByPass | {
    queryPart: "tableLiteral";
    name: string;
};
export type SqlQueryTableColumnAccessSchema = string | {
    queryPart: "tableColumnAccess";
    table: SqlQueryTableLiteralSchema;
    col: string;
};
export type SqlQuerySelectExpressionSchema = string | {
    queryPart: "bypass";
    value: string;
} | SqlQueryTableColumnAccessSchema | {
    queryPart: "call";
    fct: string;
    params: SqlQuerySelectExpressionSchema[];
};
export type SqlQueryDefineColumnSchema = string | {
    queryPart: "defineColumn";
    value: SqlQuerySelectExpressionSchema;
    as?: string | undefined;
};
export type SqlWhereItemSchema = {
    what: SqlQuerySelectSchema;
    as: string;
};
export type SqlQueryFromSchema = string | SqlQueryTableLiteralSchema[];
export type SqlQueryHereTableExpressionSchema = string | {
    queryPart: "bypass";
    value: string;
} | SqlQueryTableLiteralSchema | SqlQueryTableColumnAccessSchema | {
    queryPart: "call";
    fct: string;
    params: SqlQueryHereTableExpressionSchema[];
};
export type SqlQueryHereTableDefinitionSchema = string | {
    queryPart: "bypass";
    value: string;
} | SqlQueryTableLiteralSchema | {
    queryPart: "hereTable";
    definition: SqlQueryHereTableExpressionSchema | RootSqlQuery;
    as?: string | undefined;
};
export type RootSqlQuery = string | {
    queryPart: "query";
    select?: (string | SqlQueryDefineColumnSchema[]) | undefined;
    from?: (string | SqlQueryHereTableDefinitionSchema[]) | undefined;
    where?: string | undefined;
};
export type SqlQuerySelectSchema = RootSqlQuery;

export const sqlQueryByPass: z.ZodType<SqlQueryByPass> = z.object({queryPart:z.literal("bypass"), value:z.string()}).strict();
export const sqlQueryTableLiteralSchema: z.ZodType<SqlQueryTableLiteralSchema> = z.union([z.string(), z.lazy(() =>sqlQueryByPass), z.object({queryPart:z.literal("tableLiteral"), name:z.string()}).strict()]);
export const sqlQueryTableColumnAccessSchema: z.ZodType<SqlQueryTableColumnAccessSchema> = z.union([z.string(), z.object({queryPart:z.literal("tableColumnAccess"), table:z.lazy(() =>sqlQueryTableLiteralSchema), col:z.string()}).strict()]);
export const sqlQuerySelectExpressionSchema: z.ZodType<SqlQuerySelectExpressionSchema> = z.union([z.string(), z.object({queryPart:z.literal("bypass"), value:z.string()}).strict(), z.lazy(() =>sqlQueryTableColumnAccessSchema), z.object({queryPart:z.literal("call"), fct:z.string(), params:z.array(z.lazy(() =>sqlQuerySelectExpressionSchema))}).strict()]);
export const sqlQueryDefineColumnSchema: z.ZodType<SqlQueryDefineColumnSchema> = z.union([z.string(), z.object({queryPart:z.literal("defineColumn"), value:z.lazy(() =>sqlQuerySelectExpressionSchema), as:z.string().optional()}).strict()]);
export const sqlWhereItemSchema: z.ZodType<SqlWhereItemSchema> = z.object({what:z.lazy(() =>sqlQuerySelectSchema), as:z.string()}).strict();
export const sqlQueryFromSchema: z.ZodType<SqlQueryFromSchema> = z.union([z.string(), z.array(z.lazy(() =>sqlQueryTableLiteralSchema))]);
export const sqlQueryHereTableExpressionSchema: z.ZodType<SqlQueryHereTableExpressionSchema> = z.union([z.string(), z.object({queryPart:z.literal("bypass"), value:z.string()}).strict(), z.lazy(() =>sqlQueryTableLiteralSchema), z.lazy(() =>sqlQueryTableColumnAccessSchema), z.object({queryPart:z.literal("call"), fct:z.string(), params:z.array(z.lazy(() =>sqlQueryHereTableExpressionSchema))}).strict()]);
export const sqlQueryHereTableDefinitionSchema: z.ZodType<SqlQueryHereTableDefinitionSchema> = z.union([z.string(), z.object({queryPart:z.literal("bypass"), value:z.string()}).strict(), z.lazy(() =>sqlQueryTableLiteralSchema), z.object({queryPart:z.literal("hereTable"), definition:z.union([z.lazy(() =>sqlQueryHereTableExpressionSchema), z.lazy(() =>rootSqlQuery)]), as:z.string().optional()}).strict()]);
export const rootSqlQuery: z.ZodType<RootSqlQuery> = z.union([z.string(), z.object({queryPart:z.literal("query"), select:z.union([z.string(), z.array(z.lazy(() =>sqlQueryDefineColumnSchema))]).optional(), from:z.union([z.string(), z.array(z.lazy(() =>sqlQueryHereTableDefinitionSchema))]).optional(), where:z.string().optional()}).strict()]);
export const sqlQuerySelectSchema = z.lazy(() =>rootSqlQuery);

