import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
import { ZodType, ZodTypeAny, z } from "zod";

export type SelectObjectInstanceQuery = {
    type: "objectQuery";
    label?: string | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    instanceUuid?: string | undefined;
    rootObjectAttribute?: string | undefined;
    fetchedDataReference?: string | undefined;
    fetchedDataReferenceAttribute?: string | undefined;
    paramReference?: string | undefined;
    paramReferenceAttribute?: string | undefined;
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
export type ObjectInstanceReportSection = {
    type: "objectInstanceReportSection";
    fetchData?: MiroirQueriesObject;
    definition: {
        label?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: SelectObjectInstanceQuery;
    };
};
export type ObjectListReportSection = {
    type: "objectListReportSection";
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
export type ReportSection = GridReportSection | ListReportSection | ObjectListReportSection | ObjectInstanceReportSection;
export type RootReportSection = {
    parameters?: JzodObject;
    fetchData?: MiroirQueriesObject;
    section?: ReportSection;
};
export type Report = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    name: string;
    defaultLabel: string;
    type?: ("list" | "grid") | undefined;
    application?: string | undefined;
    definition: {
        parameters?: JzodObject;
        fetchData?: MiroirQueriesObject;
        section?: ReportSection;
    };
};

export const selectObjectInstanceQuery:z.ZodType<SelectObjectInstanceQuery> = z.object({type:z.literal("objectQuery"), label:z.string().optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), instanceUuid:z.string().uuid().optional(), rootObjectAttribute:z.string().optional(), fetchedDataReference:z.string().optional(), fetchedDataReferenceAttribute:z.string().optional(), paramReference:z.string().optional(), paramReferenceAttribute:z.string().optional()}).strict();
export const selectObjectListQuery:z.ZodType<SelectObjectListQuery> = z.object({type:z.literal("objectListQuery"), label:z.string().optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), rootObjectUuid:z.string().uuid().optional(), rootObjectAttribute:z.string().optional(), fetchedDataReference:z.string().optional()}).strict();
export const miroirQuery:z.ZodType<MiroirQuery> = z.union([z.lazy(() =>selectObjectListQuery), z.lazy(() =>selectObjectInstanceQuery)]);
export const miroirQueriesObject:z.ZodType<MiroirQueriesObject> = z.record(z.string(),z.lazy(() =>miroirQuery));
export const objectInstanceReportSection:z.ZodType<ObjectInstanceReportSection> = z.object({type:z.literal("objectInstanceReportSection"), fetchData:z.lazy(() =>miroirQueriesObject).optional(), definition:z.object({label:z.string().optional(), parentUuid:z.string().uuid(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>selectObjectInstanceQuery).optional()}).strict()}).strict();
export const objectListReportSection:z.ZodType<ObjectListReportSection> = z.object({type:z.literal("objectListReportSection"), definition:z.lazy(() =>selectObjectListQuery)}).strict();
export const gridReportSection:z.ZodType<GridReportSection> = z.object({type:z.literal("grid"), fetchData:z.lazy(() =>miroirQueriesObject).optional(), definition:z.array(z.array(z.lazy(() =>reportSection)))}).strict();
export const listReportSection:z.ZodType<ListReportSection> = z.object({type:z.literal("list"), fetchData:z.lazy(() =>miroirQueriesObject).optional(), definition:z.array(z.lazy(() =>reportSection))}).strict();
export const reportSection:z.ZodType<ReportSection> = z.union([z.lazy(() =>gridReportSection), z.lazy(() =>listReportSection), z.lazy(() =>objectListReportSection), z.lazy(() =>objectInstanceReportSection)]);
export const rootReportSection:z.ZodType<RootReportSection> = z.object({parameters:z.lazy(() =>jzodObject).optional(), fetchData:z.lazy(() =>miroirQueriesObject).optional(), section:z.lazy(() =>reportSection)}).strict();
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(), name:z.string(), defaultLabel:z.string(), type:z.enum(["list","grid"] as any).optional(), application:z.string().uuid().optional(), definition:z.object({parameters:z.lazy(() =>jzodObject).optional(), fetchData:z.lazy(() =>miroirQueriesObject).optional(), section:z.lazy(() =>reportSection)}).strict()}).strict();

