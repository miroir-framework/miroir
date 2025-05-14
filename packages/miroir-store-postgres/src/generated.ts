import { ZodType, ZodTypeAny, z } from "zod";



export type SqlQueryExpressionSchema = {
    value: string;
};
export type SqlQueryColumnExpressionSchema = {
    value: SqlQueryExpressionSchema;
    as: string;
};
export type SqlWhereItemSchema = {
    what: SqlQuerySelectSchema;
    as: string;
};
export type InnerSqlQuerySelect = {
    from: string;
    select: string;
    where?: string | undefined;
};
export type SqlQuerySelectSchema = InnerSqlQuerySelect;

export const sqlQueryExpressionSchema: z.ZodType<SqlQueryExpressionSchema> = z.object({value:z.string()}).strict();
export const sqlQueryColumnExpressionSchema: z.ZodType<SqlQueryColumnExpressionSchema> = z.object({value:z.lazy(() =>sqlQueryExpressionSchema), as:z.string()}).strict();
export const sqlWhereItemSchema: z.ZodType<SqlWhereItemSchema> = z.object({what:z.lazy(() =>sqlQuerySelectSchema), as:z.string()}).strict();
export const innerSqlQuerySelect: z.ZodType<InnerSqlQuerySelect> = z.object({from:z.string(), select:z.string(), where:z.string().optional()}).strict();
export const sqlQuerySelectSchema = z.lazy(() =>innerSqlQuerySelect);

