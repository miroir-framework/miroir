import { ZodType, ZodTypeAny, z } from "zod";

export type Transformer_label = {
    label?: string | undefined;
};
export type Transformer_mustacheStringTemplate = {
    transformerType: "mustacheStringTemplate";
    definition: string;
};
export type Transformer_constant = {
    transformerType: "constant";
    value?: any;
};
export type Transformer_constantListAsExtractor = {
    transformerType: "constantListAsExtractor";
    value: any[];
};
export type Transformer_constantObject = {
    transformerType: "constantObject";
    value: {
        [x: string]: any;
    };
};
export type Transformer_constantString = {
    transformerType: "constantString";
    value: string;
};
export type Transformer_constantUuid = {
    transformerType: "constantUuid";
    value: string;
};
export type Transformer_newUuid = {
    transformerType: "newUuid";
};
export type Transformer_contextReference = {
    transformerType: "contextReference";
    referenceName?: string | undefined;
    referencePath?: string[] | undefined;
};
export type Transformer_parameterReference = {
    transformerType: "parameterReference";
    referenceName?: string | undefined;
    referencePath?: string[] | undefined;
};
export type Transformer_contextOrParameterReference = Transformer_contextReference | Transformer_parameterReference;
export type Transformer_objectDynamicAccess = {
    transformerType: "objectDynamicAccess";
    objectAccessPath: (Transformer_contextOrParameterReference | Transformer_objectDynamicAccess | Transformer_mustacheStringTemplate | string)[];
};
export type Transformer_extractors = Transformer_constantListAsExtractor;
export type Transformer_InnerReference = Transformer_mustacheStringTemplate | Transformer_constant | Transformer_constantUuid | Transformer_constantObject | Transformer_constantString | Transformer_newUuid | Transformer_contextOrParameterReference | Transformer_objectDynamicAccess;
export type Transformer_orderBy = {
    label?: string | undefined;
    orderBy?: string | undefined;
};
export type TransformerForBuild_count_root = {
    transformerType: "count";
    attribute?: string | undefined;
    groupBy?: string | undefined;
};
export type TransformerForBuild_unique_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "unique";
    attribute: string;
};
export type TransformerForBuild_object_fullTemplate_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "object_fullTemplate";
    referenceToOuterObject: string;
};
export type TransformerForBuild_object_listReducerToIndexObject_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listReducerToIndexObject";
    indexAttribute: string;
};
export type TransformerForBuild_object_listPickElement_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listPickElement";
    index: number;
};
export type TransformerForBuild_objectEntries_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectEntries";
};
export type TransformerForBuild_objectValues_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectValues";
};
export type TransformerForRuntime_Abstract = {
    interpolation: "runtime";
};
export type TransformerForRuntime_orderedTransformer = {
    interpolation: "runtime";
    orderBy?: string | undefined;
};
export type ApplicationSection = "model" | "data";
export type ExtractorTemplateRoot = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
};
export type ExtractorOrCombinerRoot = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
};
export type ShippingBox = {
    deploymentUuid: string;
    pageParams: {
        [x: string]: any;
    };
    queryParams: {
        [x: string]: any;
    };
    contextResults: {
        [x: string]: any;
    };
};
export type ExtendedTypes = TransformerForRuntime_Abstract;

export const transformer_label: z.ZodType<Transformer_label> = z.object({label:z.string().optional()}).strict();
export const transformer_mustacheStringTemplate: z.ZodType<Transformer_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string()}).strict();
export const transformer_constant: z.ZodType<Transformer_constant> = z.object({transformerType:z.literal("constant"), value:z.any()}).strict();
export const transformer_constantListAsExtractor: z.ZodType<Transformer_constantListAsExtractor> = z.object({transformerType:z.literal("constantListAsExtractor"), value:z.array(z.any())}).strict();
export const transformer_constantObject: z.ZodType<Transformer_constantObject> = z.object({transformerType:z.literal("constantObject"), value:z.record(z.string(),z.any())}).strict();
export const transformer_constantString: z.ZodType<Transformer_constantString> = z.object({transformerType:z.literal("constantString"), value:z.string()}).strict();
export const transformer_constantUuid: z.ZodType<Transformer_constantUuid> = z.object({transformerType:z.literal("constantUuid"), value:z.string()}).strict();
export const transformer_newUuid: z.ZodType<Transformer_newUuid> = z.object({transformerType:z.literal("newUuid")}).strict();
export const transformer_contextReference: z.ZodType<Transformer_contextReference> = z.object({transformerType:z.literal("contextReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformer_parameterReference: z.ZodType<Transformer_parameterReference> = z.object({transformerType:z.literal("parameterReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformer_contextOrParameterReference: z.ZodType<Transformer_contextOrParameterReference> = z.union([z.lazy(() =>transformer_contextReference), z.lazy(() =>transformer_parameterReference)]);
export const transformer_objectDynamicAccess: z.ZodType<Transformer_objectDynamicAccess> = z.object({transformerType:z.literal("objectDynamicAccess"), objectAccessPath:z.array(z.union([z.lazy(() =>transformer_contextOrParameterReference), z.lazy(() =>transformer_objectDynamicAccess), z.lazy(() =>transformer_mustacheStringTemplate), z.string()]))}).strict();
export const transformer_extractors: z.ZodType<Transformer_extractors> = z.lazy(() =>transformer_constantListAsExtractor);
export const transformer_InnerReference: z.ZodType<Transformer_InnerReference> = z.union([z.lazy(() =>transformer_mustacheStringTemplate), z.lazy(() =>transformer_constant), z.lazy(() =>transformer_constantUuid), z.lazy(() =>transformer_constantObject), z.lazy(() =>transformer_constantString), z.lazy(() =>transformer_newUuid), z.lazy(() =>transformer_contextOrParameterReference), z.lazy(() =>transformer_objectDynamicAccess)]);
export const transformer_orderBy: z.ZodType<Transformer_orderBy> = z.object({label:z.string().optional(), orderBy:z.string().optional()}).strict();
export const transformerForBuild_count_root: z.ZodType<TransformerForBuild_count_root> = z.object({transformerType:z.literal("count"), attribute:z.string().optional(), groupBy:z.string().optional()}).strict();
export const transformerForBuild_unique_root: z.ZodType<TransformerForBuild_unique_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("unique"), attribute:z.string()}).strict();
export const transformerForBuild_object_fullTemplate_root: z.ZodType<TransformerForBuild_object_fullTemplate_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("object_fullTemplate"), referenceToOuterObject:z.string()}).strict();
export const transformerForBuild_object_listReducerToIndexObject_root: z.ZodType<TransformerForBuild_object_listReducerToIndexObject_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listReducerToIndexObject"), indexAttribute:z.string()}).strict();
export const transformerForBuild_object_listPickElement_root: z.ZodType<TransformerForBuild_object_listPickElement_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listPickElement"), index:z.number()}).strict();
export const transformerForBuild_objectEntries_root: z.ZodType<TransformerForBuild_objectEntries_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectEntries")}).strict();
export const transformerForBuild_objectValues_root: z.ZodType<TransformerForBuild_objectValues_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectValues")}).strict();
export const transformerForRuntime_Abstract: z.ZodType<TransformerForRuntime_Abstract> = z.object({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_orderedTransformer: z.ZodType<TransformerForRuntime_orderedTransformer> = z.object({interpolation:z.literal("runtime"), orderBy:z.string().optional()}).strict();
export const applicationSection: z.ZodType<ApplicationSection> = z.union([z.literal("model"), z.literal("data")]);
export const extractorTemplateRoot: z.ZodType<ExtractorTemplateRoot> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference)}).strict();
export const extractorOrCombinerRoot: z.ZodType<ExtractorOrCombinerRoot> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict();
export const shippingBox: z.ZodType<ShippingBox> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict();
export const extendedTypes = z.lazy(() =>transformerForRuntime_Abstract);
