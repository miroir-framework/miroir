import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
import { ZodType, ZodTypeAny, z } from "zod";

export type ApplicationSection = "model" | "data";
export type EntityInstance = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
};
export type EntityInstanceCollection = {
    parentName?: string | undefined;
    parentUuid: string;
    applicationSection: "model" | "data";
    instances: EntityInstance[];
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
export type MiroirAllFundamentalTypesUnion = ApplicationSection | EntityInstance | EntityInstanceCollection | LocalCacheAction;
export type MiroirFundamentalType = MiroirAllFundamentalTypesUnion;

export const applicationSection = z.union([z.literal("model"),z.literal("data"),]);
export const entityInstance = z.object({uuid:z.string().uuid(),parentName:z.string().optional(),parentUuid:z.string().uuid(),conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(),}).strict();
export const entityInstanceCollection = z.object({parentName:z.string().optional(),parentUuid:z.string(),applicationSection:z.union([z.literal("model"),z.literal("data"),]),instances:z.array(z.lazy(() =>entityInstance)),}).strict();
export const localCacheAction = z.union([z.object({actionType:z.literal("LocalCacheAction"),actionName:z.literal("create"),}).strict(),z.object({actionType:z.literal("LocalCacheAction"),actionName:z.literal("update"),}).strict(),z.object({actionType:z.literal("LocalCacheAction"),actionName:z.literal("delete"),}).strict(),]);
export const miroirAllFundamentalTypesUnion = z.union([z.lazy(() =>applicationSection),z.lazy(() =>entityInstance),z.lazy(() =>entityInstanceCollection),z.lazy(() =>localCacheAction),]);
export const miroirFundamentalType = z.lazy(() =>miroirAllFundamentalTypesUnion);

