import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
import { ZodType, ZodTypeAny, z } from "zod";

export type ApplicationSection = "model" | "data";
export type EntityRoot = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    name: string;
    description?: string | undefined;
};
export type EntityInstanceCollection = {
    parentName?: string | undefined;
    parentUuid: string;
    applicationSection: "model" | "data";
    instances: EntityRoot[];
};
export type LocalCacheAction = {
    actionType: "LocalCacheAction";
    actionName: "create";
} | {
    actionType: "LocalCacheAction";
    actionName: "update";
} | {
    actionType: "LocalCacheAction";
    actionName: "delete";
};
export type MiroirAllFundamentalTypesUnion = ApplicationSection | EntityRoot | EntityInstanceCollection | LocalCacheAction;
export type MiroirFundamentalType = MiroirAllFundamentalTypesUnion;

export const applicationSection:z.ZodType<ApplicationSection> = z.union([z.literal("model"), z.literal("data")]);
export const entityRoot:z.ZodType<EntityRoot> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(), name:z.string(), description:z.string().optional()}).strict();
export const entityInstanceCollection:z.ZodType<EntityInstanceCollection> = z.object({parentName:z.string().optional(), parentUuid:z.string(), applicationSection:z.union([z.literal("model"), z.literal("data")]), instances:z.array(z.lazy(() =>entityRoot))}).strict();
export const localCacheAction:z.ZodType<LocalCacheAction> = z.union([z.object({actionType:z.literal("LocalCacheAction"), actionName:z.literal("create")}).strict(), z.object({actionType:z.literal("LocalCacheAction"), actionName:z.literal("update")}).strict(), z.object({actionType:z.literal("LocalCacheAction"), actionName:z.literal("delete")}).strict()]);
export const miroirAllFundamentalTypesUnion:z.ZodType<MiroirAllFundamentalTypesUnion> = z.union([z.lazy(() =>applicationSection), z.lazy(() =>entityRoot), z.lazy(() =>entityInstanceCollection), z.lazy(() =>localCacheAction)]);
export const miroirFundamentalType: z.ZodType<MiroirFundamentalType> = z.lazy(() =>miroirAllFundamentalTypesUnion);

