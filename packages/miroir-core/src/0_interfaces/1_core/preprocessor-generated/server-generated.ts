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
export type MiroirSelectQuery = SelectObjectListQuery | SelectObjectInstanceQuery;
export type MiroirSelectQueriesRecord = {
    [x: string]: MiroirSelectQuery;
};
export type MiroirCombineQuery = {
    a: string;
    b: string;
};
export type ObjectInstanceReportSection = {
    type: "objectInstanceReportSection";
    selectData?: MiroirSelectQueriesRecord;
    combineData?: MiroirCombineQuery;
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
    selectData?: MiroirSelectQueriesRecord;
    combineData?: MiroirCombineQuery;
    definition: ReportSection[][];
};
export type ListReportSection = {
    type: "list";
    selectData?: MiroirSelectQueriesRecord;
    combineData?: MiroirCombineQuery;
    definition: ReportSection[];
};
export type ReportSection = GridReportSection | ListReportSection | ObjectListReportSection | ObjectInstanceReportSection;
export type RootReportSection = {
    parameters?: {
        [x: string]: any;
    } | undefined;
    selectData?: MiroirSelectQueriesRecord;
    combineData?: MiroirCombineQuery;
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
        parameters?: {
            [x: string]: any;
        } | undefined;
        selectData?: MiroirSelectQueriesRecord;
        combineData?: MiroirCombineQuery;
        section?: ReportSection;
    };
};

export const selectObjectInstanceQuery:z.ZodType<SelectObjectInstanceQuery> = z.object({type:z.literal("objectQuery"), label:z.string().optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), instanceUuid:z.string().uuid().optional(), rootObjectAttribute:z.string().optional(), fetchedDataReference:z.string().optional(), fetchedDataReferenceAttribute:z.string().optional(), paramReference:z.string().optional(), paramReferenceAttribute:z.string().optional()}).strict();
export const selectObjectListQuery:z.ZodType<SelectObjectListQuery> = z.object({type:z.literal("objectListQuery"), label:z.string().optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), rootObjectUuid:z.string().uuid().optional(), rootObjectAttribute:z.string().optional(), fetchedDataReference:z.string().optional()}).strict();
export const miroirSelectQuery:z.ZodType<MiroirSelectQuery> = z.union([z.lazy(() =>selectObjectListQuery), z.lazy(() =>selectObjectInstanceQuery)]);
export const miroirSelectQueriesRecord:z.ZodType<MiroirSelectQueriesRecord> = z.record(z.string(),z.lazy(() =>miroirSelectQuery));
export const miroirCombineQuery:z.ZodType<MiroirCombineQuery> = z.object({a:z.string(), b:z.string()}).strict();
export const objectInstanceReportSection:z.ZodType<ObjectInstanceReportSection> = z.object({type:z.literal("objectInstanceReportSection"), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCombineQuery).optional(), definition:z.object({label:z.string().optional(), parentUuid:z.string().uuid(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>selectObjectInstanceQuery).optional()}).strict()}).strict();
export const objectListReportSection:z.ZodType<ObjectListReportSection> = z.object({type:z.literal("objectListReportSection"), definition:z.lazy(() =>selectObjectListQuery)}).strict();
export const gridReportSection:z.ZodType<GridReportSection> = z.object({type:z.literal("grid"), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCombineQuery).optional(), definition:z.array(z.array(z.lazy(() =>reportSection)))}).strict();
export const listReportSection:z.ZodType<ListReportSection> = z.object({type:z.literal("list"), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCombineQuery).optional(), definition:z.array(z.lazy(() =>reportSection))}).strict();
export const reportSection:z.ZodType<ReportSection> = z.union([z.lazy(() =>gridReportSection), z.lazy(() =>listReportSection), z.lazy(() =>objectListReportSection), z.lazy(() =>objectInstanceReportSection)]);
export const rootReportSection:z.ZodType<RootReportSection> = z.object({parameters:z.record(z.string(),z.any()).optional(), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCombineQuery).optional(), section:z.lazy(() =>reportSection)}).strict();
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"] as any).optional(), name:z.string(), defaultLabel:z.string(), type:z.enum(["list","grid"] as any).optional(), application:z.string().uuid().optional(), definition:z.object({parameters:z.record(z.string(),z.any()).optional(), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCombineQuery).optional(), section:z.lazy(() =>reportSection)}).strict()}).strict();

