import { ZodType, ZodTypeAny, z } from "zod";

export type  = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    name: string;
    defaultLabel: string;
    type?: ("list" | "grid") | undefined;
    application?: string | undefined;
    definition: {
        type: "list";
        definition: {
            parentName?: string | undefined;
            parentUuid: string;
        }[];
    } | {
        type: "grid";
        definition: {
            parentName?: string | undefined;
            parentUuid: string;
        }[][];
    };
};

export const  = z.object({uuid:z.string().uuid(),parentName:z.string().optional(),parentUuid:z.string().uuid(),conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(),name:z.string(),defaultLabel:z.string(),type:z.enum(["list","grid"] as any).optional(),application:z.string().uuid().optional(),definition:z.union([z.object({type:z.literal("list"),definition:z.array(z.object({parentName:z.string().optional(),parentUuid:z.string().uuid(),}).strict()),}).strict(),z.object({type:z.literal("grid"),definition:z.array(z.array(z.object({parentName:z.string().optional(),parentUuid:z.string().uuid(),}).strict())),}).strict(),]),}).strict();
