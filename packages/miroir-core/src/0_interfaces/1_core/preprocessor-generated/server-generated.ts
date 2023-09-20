import { ZodType, ZodTypeAny, z } from "zod";

export type SelectObjectInstanceQuery = {
    type: "objectQuery";
    label?: string | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    rootObjectUuid?: string | undefined;
    rootObjectAttribute?: string | undefined;
};
export type SelectObjectListQuery = {
    type: "objectListQuery";
    label?: string | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    rootObjectUuid?: string | undefined;
    rootObjectAttribute?: string | undefined;
    fetchedDataReference?: string | undefined;
};
export type MiroirQuery = SelectObjectListQuery | SelectObjectInstanceQuery;
export type MiroirQueriesObject = {
    [x: string]: MiroirQuery;
};
export type ObjectInstance = {
    type: "objectInstance";
    fetchData?: MiroirQueriesObject;
    definition: {
        label?: string | undefined;
        parentUuid: string;
    };
};
export type ObjectList = {
    type: "objectList";
    fetchData?: MiroirQueriesObject;
    definition?: SelectObjectListQuery;
};
export type GridReportSection = {
    type: "grid";
    fetchData?: MiroirQueriesObject;
    definition: ReportSection[][];
};
export type ListReportSection = {
    type: "list";
    fetchData?: MiroirQueriesObject;
    definition: ReportSection[];
};
export type ReportSection = GridReportSection | ListReportSection | ObjectList | ObjectInstance;
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

export const selectObjectInstanceQuery:z.ZodType<SelectObjectInstanceQuery> = z.object({type:z.literal("objectQuery"),label:z.string().optional(),parentName:z.string().optional(),parentUuid:z.string().uuid(),rootObjectUuid:z.string().uuid().optional(),rootObjectAttribute:z.string().optional(),}).strict();
export const selectObjectListQuery:z.ZodType<SelectObjectListQuery> = z.object({type:z.literal("objectListQuery"),label:z.string().optional(),parentName:z.string().optional(),parentUuid:z.string().uuid(),rootObjectUuid:z.string().uuid().optional(),rootObjectAttribute:z.string().optional(),fetchedDataReference:z.string().optional(),}).strict();
export const miroirQuery:z.ZodType<MiroirQuery> = z.union([z.lazy(() =>selectObjectListQuery),z.lazy(() =>selectObjectInstanceQuery),]);
export const miroirQueriesObject:z.ZodType<MiroirQueriesObject> = z.record(z.string(),z.lazy(() =>miroirQuery));
export const objectInstance:z.ZodType<ObjectInstance> = z.object({type:z.literal("objectInstance"),fetchData:z.lazy(() =>miroirQueriesObject).optional(),definition:z.object({label:z.string().optional(),parentUuid:z.string().uuid(),}).strict(),}).strict();
export const objectList:z.ZodType<ObjectList> = z.object({type:z.literal("objectList"),fetchData:z.lazy(() =>miroirQueriesObject).optional(),definition:z.lazy(() =>selectObjectListQuery),}).strict();
export const gridReportSection:z.ZodType<GridReportSection> = z.object({type:z.literal("grid"),fetchData:z.lazy(() =>miroirQueriesObject).optional(),definition:z.array(z.array(z.lazy(() =>reportSection))),}).strict();
export const listReportSection:z.ZodType<ListReportSection> = z.object({type:z.literal("list"),fetchData:z.lazy(() =>miroirQueriesObject).optional(),definition:z.array(z.lazy(() =>reportSection)),}).strict();
export const reportSection:z.ZodType<ReportSection> = z.union([z.lazy(() =>gridReportSection),z.lazy(() =>listReportSection),z.lazy(() =>objectList),z.lazy(() =>objectInstance),]);
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(),parentName:z.string().optional(),parentUuid:z.string().uuid(),conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(),name:z.string(),defaultLabel:z.string(),type:z.enum(["list","grid"] as any).optional(),application:z.string().uuid().optional(),definition:z.union([z.lazy(() =>gridReportSection),z.lazy(() =>listReportSection),z.lazy(() =>objectList),z.lazy(() =>objectInstance),]),}).strict();
