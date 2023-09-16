import { ZodType, ZodTypeAny, z } from "zod";

export type ObjectInstance = {
    type: "objectInstance";
    definition: {
        label?: string | undefined;
        parentUuid: string;
    };
};
export type ObjectList = {
    type: "objectList";
    definition: {
        parentName?: string | undefined;
        parentUuid: string;
    };
};
export type GridReportSection = {
    type: "grid";
    definition: ReportDefinition[][];
};
export type ListReportSection = {
    type: "list";
    definition: ReportDefinition[];
};
export type ReportDefinition = GridReportSection | ListReportSection | ObjectList | ObjectInstance;
export type Report = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    name: string;
    defaultLabel: string;
    type?: ("list" | "grid") | undefined;
    application?: string | undefined;
    definition?: GridReportSection | ListReportSection | ObjectList | ObjectInstance;
};

export const objectInstance:z.ZodType<ObjectInstance> = z.object({type:z.literal("objectInstance"),definition:z.object({label:z.string().optional(),parentUuid:z.string().uuid(),}).strict(),}).strict();
export const objectList:z.ZodType<ObjectList> = z.object({type:z.literal("objectList"),definition:z.object({parentName:z.string().optional(),parentUuid:z.string().uuid(),}).strict(),}).strict();
export const gridReportSection:z.ZodType<GridReportSection> = z.object({type:z.literal("grid"),definition:z.array(z.array(z.lazy(() =>reportDefinition))),}).strict();
export const listReportSection:z.ZodType<ListReportSection> = z.object({type:z.literal("list"),definition:z.array(z.lazy(() =>reportDefinition)),}).strict();
export const reportDefinition:z.ZodType<ReportDefinition> = z.union([z.lazy(() =>gridReportSection),z.lazy(() =>listReportSection),z.lazy(() =>objectList),z.lazy(() =>objectInstance),]);
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(),parentName:z.string().optional(),parentUuid:z.string().uuid(),conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(),name:z.string(),defaultLabel:z.string(),type:z.enum(["list","grid"] as any).optional(),application:z.string().uuid().optional(),definition:z.union([z.lazy(() =>gridReportSection),z.lazy(() =>listReportSection),z.lazy(() =>objectList),z.lazy(() =>objectInstance),]),}).strict();
