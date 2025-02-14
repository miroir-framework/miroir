import { ZodType, ZodTypeAny, z } from "zod";

export type JzodBaseObject = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
};
export type JzodArray = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "array";
    definition: JzodElement;
};
export type JzodPlainAttribute = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "any" | "bigint" | "boolean" | "never" | "null" | "uuid" | "undefined" | "unknown" | "void";
    coerce?: boolean | undefined;
};
export type JzodAttributeDateValidations = {
    type: "min" | "max";
    parameter?: any;
};
export type JzodAttributePlainDateWithValidations = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "date";
    coerce?: boolean | undefined;
    validations?: JzodAttributeDateValidations[] | undefined;
};
export type JzodAttributeNumberValidations = {
    type: "gt" | "gte" | "lt" | "lte" | "int" | "positive" | "nonpositive" | "negative" | "nonnegative" | "multipleOf" | "finite" | "safe";
    parameter?: any;
};
export type JzodAttributePlainNumberWithValidations = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "number";
    coerce?: boolean | undefined;
    validations?: JzodAttributeNumberValidations[] | undefined;
};
export type JzodAttributeStringValidations = {
    type: "max" | "min" | "length" | "email" | "url" | "emoji" | "uuid" | "cuid" | "cuid2" | "ulid" | "regex" | "includes" | "startsWith" | "endsWith" | "datetime" | "ip";
    parameter?: any;
};
export type JzodAttributePlainStringWithValidations = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "string";
    coerce?: boolean | undefined;
    validations?: JzodAttributeStringValidations[] | undefined;
};
export type JzodElement = JzodArray | JzodPlainAttribute | JzodAttributePlainDateWithValidations | JzodAttributePlainNumberWithValidations | JzodAttributePlainStringWithValidations | JzodEnum | JzodFunction | JzodLazy | JzodLiteral | JzodIntersection | JzodMap | JzodObject | JzodPromise | JzodRecord | JzodReference | JzodSet | JzodTuple | JzodUnion;
export type JzodEnum = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "enum";
    definition: string[];
};
export type JzodEnumAttributeTypes = "any" | "bigint" | "boolean" | "date" | "never" | "null" | "number" | "string" | "uuid" | "undefined" | "unknown" | "void";
export type JzodEnumElementTypes = "array" | "date" | "enum" | "function" | "lazy" | "literal" | "intersection" | "map" | "number" | "object" | "promise" | "record" | "schemaReference" | "set" | "string" | "tuple" | "union";
export type JzodFunction = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "function";
    definition: {
        args: JzodElement[];
        returns?: JzodElement | undefined;
    };
};
export type JzodLazy = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "lazy";
    definition: JzodFunction;
};
export type JzodLiteral = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "literal";
    definition: string | number | bigint | boolean;
};
export type JzodIntersection = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "intersection";
    definition: {
        left: JzodElement;
        right: JzodElement;
    };
};
export type JzodMap = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "map";
    definition: [
        JzodElement,
        JzodElement
    ];
};
export type JzodObject = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    extend?: JzodReference | undefined;
    type: "object";
    nonStrict?: boolean | undefined;
    partial?: boolean | undefined;
    carryOn?: (JzodObject | JzodUnion) | undefined;
    definition: {
        [x: string]: JzodElement;
    };
};
export type JzodPromise = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "promise";
    definition: JzodElement;
};
export type JzodRecord = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "record";
    definition: JzodElement;
};
export type JzodReference = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "schemaReference";
    context?: {
        [x: string]: JzodElement;
    } | undefined;
    carryOn?: (JzodObject | JzodUnion) | undefined;
    definition: {
        eager?: boolean | undefined;
        partial?: boolean | undefined;
        relativePath?: string | undefined;
        absolutePath?: string | undefined;
    };
};
export type JzodSet = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "set";
    definition: JzodElement;
};
export type JzodTuple = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "tuple";
    definition: JzodElement[];
};
export type JzodUnion = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        value?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            initializeTo?: any | undefined;
            targetEntity?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
    type: "union";
    discriminator?: string | undefined;
    discriminatorNew?: ({
        discriminatorType: "string";
        value: string;
    } | {
        discriminatorType: "array";
        value: string[];
    }) | undefined;
    carryOn?: JzodObject | undefined;
    definition: JzodElement[];
};
export type ______________________________________________transformers_____________________________________________ = never;
export type Transformer_label = {
    label?: string | undefined;
};
export type RecordOfTransformers = {
    transformerType: "recordOfTransformers";
    definition: {
        [x: string]: Transformer;
    };
};
export type Transformer = {
    transformerType: "objectTransformer";
    attributeName: string;
} | RecordOfTransformers;
export type Transformer_mustacheStringTemplate = {
    transformerType: "mustacheStringTemplate";
    definition: string;
};
export type Transformer_constant = {
    transformerType: "constant";
    value?: any;
};
export type Transformer_constantAsExtractor = {
    transformerType: "constantAsExtractor";
    valueType?: ("string" | "number" | "boolean" | "bigint" | "object" | "array") | undefined;
    valueJzodSchema: JzodElement;
    value?: any;
};
export type Transformer_constantListAsExtractor = {
    transformerType: "constantListAsExtractor";
    value: any[];
};
export type Transformer_constantArray = {
    transformerType: "constantArray";
    value: any[];
};
export type Transformer_constantBigint = {
    transformerType: "constantBigint";
    value: number;
};
export type Transformer_constantBoolean = {
    transformerType: "constantBoolean";
    value: boolean;
};
export type Transformer_constantNumber = {
    transformerType: "constantNumber";
    value: number;
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
export type Transformer_constants = Transformer_constant | Transformer_constantAsExtractor | Transformer_constantArray | Transformer_constantBigint | Transformer_constantBoolean | Transformer_constantUuid | Transformer_constantObject | Transformer_constantNumber | Transformer_constantString | Transformer_newUuid;
export type Transformer_extractors = Transformer_constantListAsExtractor;
export type Transformer_InnerReference = Transformer_mustacheStringTemplate | Transformer_constant | Transformer_constantUuid | Transformer_constantObject | Transformer_constantString | Transformer_newUuid | Transformer_contextOrParameterReference | Transformer_objectDynamicAccess;
export type Transformer_orderBy = {
    label?: string | undefined;
    orderBy?: string | undefined;
};
export type TransformerForBuild_reference = {
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_count_root = {
    transformerType: "count";
    attribute?: string | undefined;
    groupBy?: string | undefined;
};
export type TransformerForBuild_count = {
    transformerType: "count";
    attribute?: string | undefined;
    groupBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_unique_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
    transformerType: "unique";
    attribute: string;
};
export type TransformerForBuild_unique = {
    label?: string | undefined;
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
    transformerType: "unique";
    attribute: string;
};
export type TransformerForBuild_innerFullObjectTemplate = {
    label?: string | undefined;
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
    transformerType: "innerFullObjectTemplate";
    referenceToOuterObject: string;
    definition: {
        attributeKey: Transformer_InnerReference;
        attributeValue: TransformerForBuild;
    }[];
};
export type TransformerForBuild_object_fullTemplate_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "object_fullTemplate";
    definition: {
        attributeKey: Transformer_InnerReference;
        attributeValue: TransformerForBuild;
    }[];
};
export type TransformerForBuild_object_fullTemplate = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "object_fullTemplate";
    definition: {
        attributeKey: Transformer_InnerReference;
        attributeValue: TransformerForBuild;
    }[];
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_freeObjectTemplate = {
    transformerType: "freeObjectTemplate";
    definition: {
        [x: string]: TransformerForBuild | {
            [x: string]: TransformerForBuild;
        } | string | number | boolean;
    };
};
export type TransformerForBuild_inner_object_alter = {
    transformerType: "objectAlter";
    referenceToOuterObject: string;
    definition: TransformerForBuild_freeObjectTemplate;
};
export type TransformerForBuild_mustacheStringTemplate = {
    transformerType: "mustacheStringTemplate";
    definition: string;
};
export type TransformerForBuild_list_listMapperToList = {
    label?: string | undefined;
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
    transformerType: "mapperListToList";
    referenceToOuterObject: string;
    elementTransformer: TransformerForBuild;
};
export type TransformerForBuild_object_listReducerToIndexObject_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listReducerToIndexObject";
    indexAttribute: string;
};
export type TransformerForBuild_object_listReducerToIndexObject = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listReducerToIndexObject";
    indexAttribute: string;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_object_listReducerToSpreadObject = {
    label?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
    transformerType: "listReducerToSpreadObject";
};
export type TransformerForBuild_object_listPickElement_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listPickElement";
    index: number;
};
export type TransformerForBuild_object_listPickElement = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listPickElement";
    index: number;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_objectEntries_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectEntries";
};
export type TransformerForBuild_objectEntries = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectEntries";
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_objectValues_root = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectValues";
};
export type TransformerForBuild_objectValues = {
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectValues";
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForBuild;
    };
};
export type TransformerForBuild_list = TransformerForBuild_objectEntries | TransformerForBuild_objectValues | TransformerForBuild_list_listMapperToList;
export type TransformerForBuild_string = TransformerForBuild_mustacheStringTemplate;
export type TransformerForBuild_object = TransformerForBuild_object_fullTemplate | TransformerForBuild_freeObjectTemplate | TransformerForBuild_inner_object_alter | TransformerForBuild_object_listPickElement | TransformerForBuild_object_listReducerToIndexObject;
export type TransformerForBuild_dataflowObject = {
    transformerType: "dataflowObject";
    definition: {
        [x: string]: TransformerForBuild;
    };
};
export type TransformerForBuild = Transformer_constants | Transformer_InnerReference | TransformerForBuild_dataflowObject | TransformerForBuild_freeObjectTemplate | TransformerForBuild_inner_object_alter | TransformerForBuild_object_fullTemplate | TransformerForBuild_objectEntries | TransformerForBuild_objectValues | TransformerForBuild_object_listPickElement | TransformerForBuild_object_listReducerToIndexObject | TransformerForBuild_object_listReducerToSpreadObject | TransformerForBuild_list_listMapperToList | TransformerForBuild_mustacheStringTemplate;
export type TransformerForRuntime_Abstract = {
    interpolation: "runtime";
};
export type TransformerForRuntime_orderedTransformer = {
    interpolation: "runtime";
    orderBy?: string | undefined;
};
export type TransformerForRuntime_reference = {
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
};
export type TransformerForRuntime_constantAsExtractor = {
    transformerType: "constantAsExtractor";
    valueType?: ("string" | "number" | "boolean" | "bigint" | "object" | "array") | undefined;
    valueJzodSchema: JzodElement;
    value?: any;
    interpolation: "runtime";
};
export type TransformerForRuntime_constant = {
    transformerType: "constant";
    value?: any;
    interpolation: "runtime";
};
export type TransformerForRuntime_constantUuid = {
    transformerType: "constantUuid";
    value: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_constantArray = {
    transformerType: "constantArray";
    value: any[];
    interpolation: "runtime";
};
export type TransformerForRuntime_constantBigint = {
    transformerType: "constantBigint";
    value: number;
    interpolation: "runtime";
};
export type TransformerForRuntime_constantBoolean = {
    transformerType: "constantBoolean";
    value: boolean;
    interpolation: "runtime";
};
export type TransformerForRuntime_constantNumber = {
    transformerType: "constantNumber";
    value: number;
    interpolation: "runtime";
};
export type TransformerForRuntime_constantObject = {
    transformerType: "constantObject";
    value: {
        [x: string]: any;
    };
    interpolation: "runtime";
};
export type TransformerForRuntime_constantString = {
    transformerType: "constantString";
    value: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_newUuid = {
    transformerType: "newUuid";
    interpolation: "runtime";
};
export type TransformerForRuntime_contextReference = {
    transformerType: "contextReference";
    referenceName?: string | undefined;
    referencePath?: string[] | undefined;
    interpolation: "runtime";
};
export type TransformerForRuntime_parameterReference = {
    transformerType: "parameterReference";
    referenceName?: string | undefined;
    referencePath?: string[] | undefined;
    interpolation: "runtime";
};
export type TransformerForRuntime_contextOrParameterReference = TransformerForRuntime_contextReference | TransformerForRuntime_parameterReference;
export type TransformerForRuntime_objectDynamicAccess = {
    interpolation: "runtime";
    transformerType: "objectDynamicAccess";
    objectAccessPath: (TransformerForRuntime_contextOrParameterReference | TransformerForRuntime_objectDynamicAccess | TransformerForRuntime_mustacheStringTemplate | string)[];
};
export type TransformerForRuntime_constants = TransformerForRuntime_constant | TransformerForRuntime_constantAsExtractor | TransformerForRuntime_constantArray | TransformerForRuntime_constantBigint | TransformerForRuntime_constantBoolean | TransformerForRuntime_constantNumber | TransformerForRuntime_constantUuid | TransformerForRuntime_constantObject | TransformerForRuntime_constantString | TransformerForRuntime_newUuid;
export type TransformerForRuntime_InnerReference = TransformerForRuntime_mustacheStringTemplate | TransformerForRuntime_contextOrParameterReference | TransformerForRuntime_objectDynamicAccess;
export type TransformerForRuntime_mustacheStringTemplate = {
    transformerType: "mustacheStringTemplate";
    definition: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_count = {
    transformerType: "count";
    attribute?: string | undefined;
    groupBy?: string | undefined;
    interpolation: "runtime";
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
};
export type TransformerForRuntime_unique = {
    label?: string | undefined;
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
    transformerType: "unique";
    attribute: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_objectEntries = {
    interpolation: "runtime";
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectEntries";
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
};
export type TransformerForRuntime_objectValues = {
    interpolation: "runtime";
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "objectValues";
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
};
export type TransformerForRuntime_freeObjectTemplate = {
    interpolation: "runtime";
    transformerType: "freeObjectTemplate";
    definition: {
        [x: string]: TransformerForRuntime | {
            [x: string]: TransformerForRuntime;
        } | string | number;
    };
};
export type TransformerForRuntime_innerFullObjectTemplate = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
    transformerType: "innerFullObjectTemplate";
    definition: {
        attributeKey: TransformerForRuntime;
        attributeValue: TransformerForRuntime;
    }[];
};
export type TransformerForRuntime_object_fullTemplate = {
    interpolation: "runtime";
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
    transformerType: "object_fullTemplate";
    definition: {
        attributeKey: TransformerForRuntime;
        attributeValue: TransformerForRuntime;
    }[];
};
export type TransformerForRuntime_object_alter = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    transformerType: "objectAlter";
    referenceToOuterObject: string;
    definition: TransformerForRuntime_freeObjectTemplate;
};
export type TransformerForRuntime_list_listMapperToList = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
    transformerType: "mapperListToList";
    referenceToOuterObject: string;
    elementTransformer: TransformerForRuntime;
};
export type TransformerForRuntime_mapper_listToObject = {
    interpolation: "runtime";
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listReducerToIndexObject";
    indexAttribute: string;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
};
export type TransformerForRuntime_list_listPickElement = {
    interpolation: "runtime";
    label?: string | undefined;
    orderBy?: string | undefined;
    transformerType: "listPickElement";
    index: number;
    applyTo: {
        referenceType: "referencedExtractor";
        reference: string | Transformer_extractors;
    } | {
        referenceType: "referencedTransformer";
        reference: string | TransformerForRuntime;
    };
};
export type TransformerForRuntime = TransformerForRuntime_constants | TransformerForRuntime_InnerReference | TransformerForRuntime_object_fullTemplate | TransformerForRuntime_freeObjectTemplate | TransformerForRuntime_object_alter | TransformerForRuntime_count | TransformerForRuntime_list_listPickElement | TransformerForRuntime_list_listMapperToList | TransformerForRuntime_mapper_listToObject | TransformerForRuntime_mustacheStringTemplate | TransformerForRuntime_objectValues | TransformerForRuntime_objectEntries | TransformerForRuntime_unique;
export type TransformerForBuildOrRuntime = TransformerForBuild | TransformerForRuntime;
export type ActionHandler = {
    interface: {
        actionJzodObjectSchema: JzodObject;
    };
    implementation: {
        templates?: {
            [x: string]: any;
        } | undefined;
        compositeActionTemplate: CompositeActionTemplate;
    };
};
export type Transformer_menu_addItem = {
    transformerType: "transformer_menu_addItem";
    interpolation: "runtime";
    transformerDefinition: {
        menuReference: string | TransformerForRuntime_InnerReference;
        menuItemReference: string | TransformerForRuntime_InnerReference;
        menuSectionInsertionIndex?: number | undefined;
        menuSectionItemInsertionIndex?: number | undefined;
    };
};
export type ExtendedTransformerForRuntime = TransformerForRuntime | Transformer_menu_addItem;
export type ______________________________________________miroirMetaModel_____________________________________________ = never;
export type EntityAttributeExpandedType = "UUID" | "STRING" | "BOOLEAN" | "OBJECT";
export type EntityAttributeType = EntityInstance | ("ENTITY_INSTANCE_UUID" | "ARRAY");
export type EntityAttributeUntypedCore = {
    id: number;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    editable: boolean;
    nullable: boolean;
};
export type EntityAttributeCore = {
    id: number;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    editable: boolean;
    nullable: boolean;
    type: EntityAttributeExpandedType;
};
export type EntityArrayAttribute = {
    id: number;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    editable: boolean;
    nullable: boolean;
    type: "ARRAY";
    lineFormat: EntityAttributeCore[];
};
export type EntityForeignKeyAttribute = {
    id: number;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    editable: boolean;
    nullable: boolean;
    type: "ENTITY_INSTANCE_UUID";
    applicationSection?: ApplicationSection | undefined;
    entityUuid: string;
};
export type EntityAttribute = EntityForeignKeyAttribute | EntityArrayAttribute;
export type EntityAttributePartial = JzodArray | JzodPlainAttribute | JzodAttributePlainDateWithValidations | JzodAttributePlainNumberWithValidations | JzodAttributePlainStringWithValidations | JzodEnum | JzodFunction | JzodLazy | JzodLiteral | JzodIntersection | JzodMap | JzodObject | JzodPromise | JzodRecord | JzodReference | JzodSet | JzodTuple | JzodUnion;
export type ApplicationSection = "model" | "data";
export type DataStoreApplicationType = "miroir" | "app";
export type StoreBasedConfiguration = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    defaultLabel: string;
    definition: {
        currentApplicationVersion: string;
    };
};
export type EntityInstance = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
};
export type EntityInstanceCollection = {
    parentName?: string | undefined;
    parentUuid: string;
    applicationSection: ApplicationSection;
    instances: EntityInstance[];
};
export type ConceptLevel = "MetaModel" | "Model" | "Data";
export type DataStoreType = "miroir" | "app";
export type EntityInstanceUuid = string;
export type EntityInstancesUuidIndex = {
    [x: string]: EntityInstance;
};
export type EntityInstancesUuidIndexUuidIndex = {
    [x: string]: EntityInstancesUuidIndex;
};
export type ______________________________________________entities_____________________________________________ = never;
export type AdminApplication = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    selfApplication: string;
};
export type SelfApplication = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
};
export type ApplicationVersion = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel?: string | undefined;
    description?: string | undefined;
    type?: string | undefined;
    selfApplication: string;
    branch: string;
    previousVersion?: string | undefined;
    modelStructureMigration?: {
        [x: string]: any;
    }[] | undefined;
    modelCUDMigration?: {
        [x: string]: any;
    }[] | undefined;
};
export type Bundle = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid: string;
    name: string;
    contents: {
        type: "runtime";
    } | {
        type: "development";
        applicationVersion: ApplicationVersion;
    };
};
export type Deployment = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    adminApplication: string;
    bundle: string;
    configuration?: StoreUnitConfiguration | undefined;
    model?: JzodObject | undefined;
    data?: JzodObject | undefined;
};
export type Entity = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    selfApplication?: string | undefined;
    name: string;
    author?: string | undefined;
    description?: string | undefined;
};
export type EntityDefinition = {
    uuid: string;
    parentName: string;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    entityUuid: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    description?: string | undefined;
    defaultInstanceDetailsReportUuid?: string | undefined;
    viewAttributes?: string[] | undefined;
    icon?: string | undefined;
    jzodSchema: JzodObject;
};
export type TestCompositeAction = {
    testType: "testCompositeAction";
    testLabel: string;
    beforeTestSetupAction?: CompositeAction | undefined;
    afterTestCleanupAction?: CompositeAction | undefined;
    compositeAction: CompositeAction;
    testCompositeActionAssertions: CompositeRunTestAssertion[];
};
export type TestCompositeActionSuite = {
    testType: "testCompositeActionSuite";
    testLabel: string;
    beforeAll?: CompositeAction | undefined;
    beforeEach?: CompositeAction | undefined;
    afterEach?: CompositeAction | undefined;
    afterAll?: CompositeAction | undefined;
    testCompositeActions: {
        [x: string]: TestCompositeAction;
    };
};
export type TestCompositeActionTemplate = {
    testType: "testCompositeActionTemplate";
    testLabel: string;
    beforeTestSetupAction?: CompositeActionTemplate | undefined;
    afterTestCleanupAction?: CompositeActionTemplate | undefined;
    compositeActionTemplate: CompositeActionTemplate;
    testCompositeActionAssertions: CompositeRunTestAssertion[];
};
export type TestCompositeActionTemplateSuite = {
    testType: "testCompositeActionTemplateSuite";
    testLabel: string;
    beforeAll?: CompositeActionTemplate | undefined;
    beforeEach?: CompositeActionTemplate | undefined;
    afterEach?: CompositeActionTemplate | undefined;
    afterAll?: CompositeActionTemplate | undefined;
    testCompositeActions: {
        [x: string]: TestCompositeActionTemplate;
    };
};
export type TestAssertion = {
    testType: "testAssertion";
    testLabel: string;
    definition: {
        resultAccessPath?: string[] | undefined;
        resultTransformer?: ExtendedTransformerForRuntime | undefined;
        ignoreAttributes?: string[] | undefined;
        expectedValue?: any;
    };
};
export type Test = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    definition: {
        testType: "testCompositeActionSuite";
        testLabel: string;
        beforeAll?: CompositeAction | undefined;
        beforeEach?: CompositeAction | undefined;
        afterEach?: CompositeAction | undefined;
        afterAll?: CompositeAction | undefined;
        testCompositeActions: {
            [x: string]: TestCompositeAction;
        };
    } | {
        testType: "testCompositeAction";
        testLabel: string;
        beforeTestSetupAction?: CompositeAction | undefined;
        afterTestCleanupAction?: CompositeAction | undefined;
        compositeAction: CompositeAction;
        testCompositeActionAssertions: CompositeRunTestAssertion[];
    } | {
        testType: "testCompositeActionTemplate";
        testLabel: string;
        beforeTestSetupAction?: CompositeActionTemplate | undefined;
        afterTestCleanupAction?: CompositeActionTemplate | undefined;
        compositeActionTemplate: CompositeActionTemplate;
        testCompositeActionAssertions: CompositeRunTestAssertion[];
    } | {
        testType: "testCompositeActionTemplateSuite";
        testLabel: string;
        beforeAll?: CompositeActionTemplate | undefined;
        beforeEach?: CompositeActionTemplate | undefined;
        afterEach?: CompositeActionTemplate | undefined;
        afterAll?: CompositeActionTemplate | undefined;
        testCompositeActions: {
            [x: string]: TestCompositeActionTemplate;
        };
    } | {
        testType: "testAssertion";
        testLabel: string;
        definition: {
            resultAccessPath?: string[] | undefined;
            resultTransformer?: ExtendedTransformerForRuntime | undefined;
            ignoreAttributes?: string[] | undefined;
            expectedValue?: any;
        };
    };
};
export type SelfApplicationDeploymentConfiguration = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    selfApplication: string;
};
export type MiroirMenuItem = {
    label: string;
    section: ApplicationSection;
    selfApplication: string;
    reportUuid: string;
    instanceUuid?: string | undefined;
    icon: string;
};
export type MenuItemArray = MiroirMenuItem[];
export type SectionOfMenu = {
    title: string;
    label: string;
    items: MenuItemArray;
};
export type SimpleMenu = {
    menuType: "simpleMenu";
    definition: MenuItemArray;
};
export type ComplexMenu = {
    menuType: "complexMenu";
    definition: SectionOfMenu[];
};
export type MenuDefinition = SimpleMenu | ComplexMenu;
export type Menu = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    definition: MenuDefinition;
};
export type ObjectInstanceReportSection = {
    type: "objectInstanceReportSection";
    combinerTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    definition: {
        label?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: ExtractorTemplateReturningObject | undefined;
    };
};
export type ObjectListReportSection = {
    type: "objectListReportSection";
    definition: {
        label?: string | undefined;
        parentName?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: ExtractorTemplateReturningObject | undefined;
        sortByAttribute?: string | undefined;
    };
};
export type GridReportSection = {
    type: "grid";
    combinerTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    selectData?: ExtractorOrCombinerTemplateRecord | undefined;
    definition: ReportSection[][];
};
export type ListReportSection = {
    type: "list";
    combinerTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    selectData?: ExtractorOrCombinerTemplateRecord | undefined;
    definition: (ObjectInstanceReportSection | ObjectListReportSection)[];
};
export type ReportSection = GridReportSection | ListReportSection | ObjectListReportSection | ObjectInstanceReportSection;
export type RootReport = {
    reportParametersToFetchQueryParametersTransformer?: {
        [x: string]: string;
    } | undefined;
    reportParameters?: {
        [x: string]: string;
    } | undefined;
    extractorTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    extractors?: ExtractorOrCombinerRecord | undefined;
    combiners?: ExtractorOrCombinerRecord | undefined;
    combinerTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    section: ReportSection;
};
export type JzodObjectOrReference = JzodReference | JzodObject;
export type JzodSchema = {
    uuid: string;
    parentName: string;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    defaultLabel?: string | undefined;
    description?: string | undefined;
    definition?: JzodObjectOrReference | undefined;
};
export type Report = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
    name: string;
    defaultLabel: string;
    type?: ("list" | "grid") | undefined;
    selfApplication?: string | undefined;
    definition: {
        reportParametersToFetchQueryParametersTransformer?: {
            [x: string]: string;
        } | undefined;
        reportParameters?: {
            [x: string]: string;
        } | undefined;
        extractorTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
        extractors?: ExtractorOrCombinerRecord | undefined;
        combiners?: ExtractorOrCombinerRecord | undefined;
        combinerTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
        runtimeTransformers?: {
            [x: string]: TransformerForRuntime;
        } | undefined;
        section: ReportSection;
    };
};
export type MetaModel = {
    applicationVersions: ApplicationVersion[];
    applicationVersionCrossEntityDefinition: {
        uuid: string;
        parentName?: string | undefined;
        parentUuid: string;
        conceptLevel?: ("MetaModel" | "Model" | "Data") | undefined;
        applicationVersion: string;
        entityDefinition: string;
    }[];
    entities: Entity[];
    entityDefinitions: EntityDefinition[];
    jzodSchemas: JzodSchema[];
    menus: Menu[];
    reports: Report[];
};
export type _________________________________configuration_and_bundles_________________________________ = never;
export type IndexedDbStoreSectionConfiguration = {
    emulatedServerType: "indexedDb";
    indexedDbName: string;
};
export type FilesystemDbStoreSectionConfiguration = {
    emulatedServerType: "filesystem";
    directory: string;
};
export type SqlDbStoreSectionConfiguration = {
    emulatedServerType: "sql";
    connectionString: string;
    schema: string;
};
export type StoreSectionConfiguration = IndexedDbStoreSectionConfiguration | FilesystemDbStoreSectionConfiguration | SqlDbStoreSectionConfiguration;
export type StoreUnitConfiguration = {
    admin: StoreSectionConfiguration;
    model: StoreSectionConfiguration;
    data: StoreSectionConfiguration;
};
export type DeploymentStorageConfig = {
    [x: string]: StoreUnitConfiguration;
};
export type ServerConfigForClientConfig = {
    rootApiUrl: string;
    dataflowConfiguration?: any;
    storeSectionConfiguration: {
        [x: string]: StoreUnitConfiguration;
    };
};
export type MiroirConfigForMswClient = {
    emulateServer: true;
    rootApiUrl: string;
    deploymentStorageConfig: DeploymentStorageConfig;
};
export type MiroirConfigForRestClient = {
    emulateServer: false;
    serverConfig: ServerConfigForClientConfig;
};
export type MiroirConfigClient = {
    miroirConfigType: "client";
    client: MiroirConfigForMswClient | MiroirConfigForRestClient;
};
export type MiroirConfigServer = {
    miroirConfigType: "server";
    server: {
        rootApiUrl: string;
    };
};
export type MiroirConfig = "miroirConfigClient" | "miroirConfigServer";
export type Commit = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    date: Date;
    selfApplication?: string | undefined;
    name: string;
    preceding?: string | undefined;
    branch?: string | undefined;
    author?: string | undefined;
    description?: string | undefined;
    actions: {
        endpoint: string;
        actionArguments: ModelAction;
    }[];
    patches: any[];
};
export type MiroirAllFundamentalTypesUnion = ApplicationSection | EntityInstance | EntityInstanceCollection | InstanceAction;
export type ______________________________________________queries_____________________________________________ = never;
export type QueryFailed = {
    queryFailure: "FailedTransformer_objectEntries" | "FailedExtractor" | "QueryNotExecutable" | "DomainStateNotLoaded" | "IncorrectParameters" | "DeploymentNotFound" | "ApplicationSectionNotFound" | "EntityNotFound" | "InstanceNotFound" | "ReferenceNotFound" | "ReferenceFoundButUndefined" | "ReferenceFoundButAttributeUndefinedOnFoundObject";
    query?: string | undefined;
    failureOrigin?: string[] | undefined;
    failureMessage?: string | undefined;
    queryReference?: string | undefined;
    queryParameters?: string | undefined;
    queryContext?: string | undefined;
    deploymentUuid?: string | undefined;
    errorStack?: string[] | undefined;
    innerError?: any | undefined;
    applicationSection?: ApplicationSection | undefined;
    entityUuid?: string | undefined;
    instanceUuid?: string | undefined;
};
export type ExtractorTemplateRoot = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
};
export type ExtractorTemplateCombinerForObjectByRelation = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
    extractorTemplateType: "combinerForObjectByRelation";
    objectReference: TransformerForRuntime_InnerReference;
    AttributeOfObjectToCompareToReferenceUuid: string;
};
export type ExtractorTemplateExtractorForObjectByDirectReference = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
    extractorTemplateType: "extractorForObjectByDirectReference";
    instanceUuid: Transformer_InnerReference;
};
export type ExtractorTemplateReturningObject = ExtractorTemplateCombinerForObjectByRelation | ExtractorTemplateExtractorForObjectByDirectReference;
export type ExtractorTemplateForObjectListByEntity = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
    extractorTemplateType: "extractorTemplateForObjectListByEntity";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    filter?: {
        attributeName: string;
        value: Transformer_constantString;
    } | undefined;
};
export type ExtractorTemplateByRelationReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
    extractorTemplateType: "combinerByRelationReturningObjectList";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    objectReference: TransformerForRuntime_InnerReference;
    objectReferenceAttribute?: string | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string;
};
export type ExtractorTemplateByManyToManyRelationReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: Transformer_InnerReference;
    extractorTemplateType: "combinerByManyToManyRelationReturningObjectList";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    objectListReference: Transformer_contextReference;
    objectListReferenceAttribute?: string | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: string | undefined;
};
export type ExtractorTemplateReturningObjectList = ExtractorTemplateForObjectListByEntity | ExtractorTemplateByRelationReturningObjectList | ExtractorTemplateByManyToManyRelationReturningObjectList;
export type ExtractorTemplateReturningObjectOrObjectList = ExtractorTemplateReturningObject | ExtractorTemplateReturningObjectList;
export type ExtractorTemplateByExtractorCombiner = {
    extractorTemplateType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList";
    rootExtractorOrReference: ExtractorOrCombinerTemplate | string;
    subQueryTemplate: {
        query: ExtractorOrCombinerTemplate;
        rootQueryObjectTransformer: RecordOfTransformers;
    };
};
export type ExtractorTemplateByExtractorWrapperReturningObject = {
    extractorTemplateType: "extractorTemplateByExtractorWrapperReturningObject";
    definition: {
        [x: string]: Transformer_contextOrParameterReference;
    };
};
export type ExtractorTemplateByExtractorWrapperReturningList = {
    extractorTemplateType: "extractorTemplateByExtractorWrapperReturningList";
    definition: Transformer_contextOrParameterReference[];
};
export type ExtractorTemplateByExtractorWrapper = ExtractorTemplateByExtractorWrapperReturningObject | ExtractorTemplateByExtractorWrapperReturningList;
export type ExtractorOrCombinerTemplate = ExtractorTemplateByExtractorWrapper | ExtractorTemplateExtractorForObjectByDirectReference | ExtractorTemplateReturningObjectList | ExtractorTemplateCombinerForObjectByRelation | ExtractorTemplateByRelationReturningObjectList | ExtractorTemplateByManyToManyRelationReturningObjectList | ExtractorTemplateByExtractorCombiner | {
    extractorTemplateType: "literal";
    definition: string;
};
export type ExtractorOrCombinerTemplateRecord = {
    [x: string]: ExtractorOrCombinerTemplate;
};
export type ExtractorOrCombinerRoot = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
};
export type ExtractorOrCombinerContextReference = {
    extractorOrCombinerType: "extractorOrCombinerContextReference";
    extractorOrCombinerContextReference: string;
};
export type CombinerForObjectByRelation = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "combinerForObjectByRelation";
    objectReference: string;
    AttributeOfObjectToCompareToReferenceUuid: string;
};
export type ExtractorForObjectByDirectReference = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "extractorForObjectByDirectReference";
    instanceUuid: string;
};
export type ExtractorOrCombinerReturningObject = ExtractorForObjectByDirectReference | CombinerForObjectByRelation;
export type ExtractorByEntityReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "extractorByEntityReturningObjectList";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    filter?: {
        attributeName: string;
        value?: any;
    } | undefined;
};
export type Extractor = ExtractorForObjectByDirectReference | ExtractorByEntityReturningObjectList;
export type CombinerByRelationReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "combinerByRelationReturningObjectList";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    objectReference: string;
    objectReferenceAttribute?: string | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string;
};
export type CombinerByManyToManyRelationReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "combinerByManyToManyRelationReturningObjectList";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    objectListReference: string;
    objectListReferenceAttribute?: string | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: string | undefined;
};
export type ExtractorOrCombinerReturningObjectList = ExtractorByEntityReturningObjectList | CombinerByRelationReturningObjectList | CombinerByManyToManyRelationReturningObjectList;
export type ExtractorOrCombinerReturningObjectOrObjectList = ExtractorOrCombinerReturningObject | ExtractorOrCombinerReturningObjectList;
export type ExtractorCombinerByHeteronomousManyToManyReturningListOfObjectList = {
    extractorOrCombinerType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList";
    orderBy?: {
        attributeName: string;
        direction?: ("ASC" | "DESC") | undefined;
    } | undefined;
    rootExtractorOrReference: Extractor | string;
    subQueryTemplate: {
        query: ExtractorOrCombinerTemplate;
        rootQueryObjectTransformer: RecordOfTransformers;
    };
};
export type ExtractorWrapperReturningObject = {
    extractorOrCombinerType: "extractorWrapperReturningObject";
    definition: {
        [x: string]: ExtractorOrCombinerContextReference | ExtractorOrCombiner;
    };
};
export type ExtractorWrapperReturningList = {
    extractorOrCombinerType: "extractorWrapperReturningList";
    definition: (ExtractorOrCombinerContextReference | ExtractorOrCombiner)[];
};
export type ExtractorWrapper = ExtractorWrapperReturningObject | ExtractorWrapperReturningList;
export type ExtractorOrCombiner = ExtractorOrCombinerContextReference | ExtractorOrCombinerReturningObject | ExtractorOrCombinerReturningObjectList | ExtractorWrapper | ExtractorCombinerByHeteronomousManyToManyReturningListOfObjectList | {
    extractorOrCombinerType: "literal";
    definition: string;
};
export type ExtractorOrCombinerRecord = {
    [x: string]: ExtractorOrCombiner;
};
export type DomainElementVoid = {
    elementType: "void";
    elementValue?: void | undefined;
};
export type DomainElementAny = {
    elementType: "any";
    elementValue?: any;
};
export type DomainElementFailed = {
    elementType: "failure";
    elementValue: QueryFailed;
};
export type DomainElementObject = {
    elementType: "object";
    elementValue: {
        [x: string]: DomainElement;
    };
};
export type DomainElementArray = {
    elementType: "array";
    elementValue: DomainElement[];
};
export type DomainElementString = {
    elementType: "string";
    elementValue: string;
};
export type DomainElementNumber = {
    elementType: "number";
    elementValue: number;
};
export type DomainElementObjectOrFailed = DomainElementObject | DomainElementFailed;
export type DomainElementInstanceUuidIndex = {
    elementType: "instanceUuidIndex";
    elementValue: EntityInstancesUuidIndex;
};
export type DomainElementInstanceUuidIndexOrFailed = DomainElementInstanceUuidIndex | DomainElementFailed;
export type DomainElementEntityInstance = {
    elementType: "instance";
    elementValue: EntityInstance;
};
export type DomainElementEntityInstanceOrFailed = DomainElementEntityInstance | DomainElementFailed;
export type DomainElementEntityInstanceCollection = {
    elementType: "entityInstanceCollection";
    elementValue: EntityInstanceCollection;
};
export type DomainElementEntityInstanceCollectionOrFailed = DomainElementEntityInstanceCollection | DomainElementFailed;
export type DomainElementInstanceArray = {
    elementType: "instanceArray";
    elementValue: EntityInstance[];
};
export type DomainElementInstanceArrayOrFailed = DomainElementInstanceArray | DomainElementFailed;
export type DomainElementInstanceUuid = {
    elementType: "instanceUuid";
    elementValue: EntityInstanceUuid;
};
export type DomainElementType = "any" | "object" | "instanceUuidIndex" | "entityInstanceCollection" | "instanceArray" | "instance" | "instanceUuid" | "instanceUuidIndexUuidIndex" | "void";
export type DomainElementSuccess = DomainElementVoid | DomainElementAny | DomainElementObject | DomainElementInstanceUuidIndex | DomainElementEntityInstanceCollection | DomainElementInstanceArray | DomainElementEntityInstance | DomainElementInstanceUuid | DomainElementString | DomainElementNumber | DomainElementArray;
export type DomainElement = DomainElementSuccess | DomainElementFailed;
export type LocalCacheExtractor = {
    queryType: "localCacheEntityInstancesExtractor";
    definition: {
        deploymentUuid?: string | undefined;
        applicationSection?: ApplicationSection | undefined;
        entityUuid?: string | undefined;
        instanceUuid?: string | undefined;
    };
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
export type BoxedExtractorOrCombinerReturningObject = {
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
    queryType: "boxedExtractorOrCombinerReturningObject";
    select: ExtractorOrCombinerReturningObject;
};
export type BoxedExtractorOrCombinerReturningObjectList = {
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
    queryType: "boxedExtractorOrCombinerReturningObjectList";
    select: ExtractorOrCombinerReturningObjectList;
};
export type BoxedExtractorOrCombinerReturningObjectOrObjectList = BoxedExtractorOrCombinerReturningObject | BoxedExtractorOrCombinerReturningObjectList;
export type BoxedQueryWithExtractorCombinerTransformer = {
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
    queryType: "boxedQueryWithExtractorCombinerTransformer";
    runAsSql?: boolean | undefined;
    extractors?: ExtractorOrCombinerRecord | undefined;
    combiners?: ExtractorOrCombinerRecord | undefined;
    runtimeTransformers?: {
        [x: string]: ExtendedTransformerForRuntime;
    } | undefined;
};
export type BoxedExtractorTemplateReturningObject = {
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
    queryType: "boxedExtractorTemplateReturningObject";
    select: ExtractorTemplateReturningObject;
};
export type BoxedExtractorTemplateReturningObjectList = {
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
    queryType: "boxedExtractorTemplateReturningObjectList";
    select: ExtractorTemplateReturningObjectList;
};
export type BoxedExtractorTemplateReturningObjectOrObjectList = BoxedExtractorTemplateReturningObject | BoxedExtractorTemplateReturningObjectList;
export type BoxedQueryTemplateWithExtractorCombinerTransformer = {
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
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer";
    runAsSql?: boolean | undefined;
    extractorTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    combinerTemplates?: ExtractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: ExtendedTransformerForRuntime;
    } | undefined;
};
export type QueryByEntityUuidGetEntityDefinition = {
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
    queryType: "getEntityDefinition";
    entityUuid: string;
};
export type QueryByTemplateGetParamJzodSchema = {
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
    queryType: "queryByTemplateGetParamJzodSchema";
    fetchParams: BoxedQueryTemplateWithExtractorCombinerTransformer;
};
export type QueryByQuery2GetParamJzodSchema = {
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
    queryType: "queryByTemplateGetParamJzodSchema";
    fetchParams: BoxedQueryWithExtractorCombinerTransformer;
};
export type QueryByQueryTemplateGetParamJzodSchema = {
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
    queryType: "getQueryJzodSchema";
    select: ExtractorOrCombinerTemplate;
};
export type QueryByQueryGetParamJzodSchema = {
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
    queryType: "getQueryJzodSchema";
    select: ExtractorOrCombiner;
};
export type DomainModelQueryTemplateJzodSchemaParams = QueryByEntityUuidGetEntityDefinition | QueryByTemplateGetParamJzodSchema | QueryByQueryTemplateGetParamJzodSchema;
export type QueryJzodSchemaParams = QueryByEntityUuidGetEntityDefinition | QueryByQuery2GetParamJzodSchema | QueryByQueryGetParamJzodSchema;
export type MiroirQueryTemplate = BoxedExtractorTemplateReturningObjectOrObjectList | BoxedQueryTemplateWithExtractorCombinerTransformer | LocalCacheExtractor | QueryByEntityUuidGetEntityDefinition | QueryByTemplateGetParamJzodSchema | QueryByQueryTemplateGetParamJzodSchema;
export type MiroirQuery = BoxedExtractorOrCombinerReturningObjectOrObjectList | BoxedQueryWithExtractorCombinerTransformer | LocalCacheExtractor | QueryByEntityUuidGetEntityDefinition | QueryByQuery2GetParamJzodSchema | QueryByQueryGetParamJzodSchema;
export type ______________________________________________actions_____________________________________________ = never;
export type ActionError = {
    status: "error";
    errorType: ("FailedToCreateStore" | "FailedToDeployModule") | "FailedToDeleteStore" | "FailedToResetAndInitMiroirAndApplicationDatabase" | "FailedToOpenStore" | "FailedToCloseStore" | "FailedToCreateInstance" | "FailedToDeleteInstance" | "FailedToDeleteInstanceWithCascade" | "FailedToUpdateInstance" | "FailedToLoadNewInstancesInLocalCache" | "FailedToGetInstance" | "FailedToGetInstances" | "FailedToResolveTemplate";
    errorMessage?: string | undefined;
    errorStack?: (string | undefined)[] | undefined;
    innerError?: ActionError | undefined;
};
export type ActionVoidSuccess = {
    status: "ok";
    returnedDomainElement: DomainElementVoid;
};
export type ActionVoidReturnType = ActionError | ActionVoidSuccess;
export type ActionEntityInstanceSuccess = {
    status: "ok";
    returnedDomainElement: DomainElementEntityInstance;
};
export type ActionEntityInstanceReturnType = ActionError | ActionEntityInstanceSuccess;
export type ActionEntityInstanceCollectionSuccess = {
    status: "ok";
    returnedDomainElement: DomainElementEntityInstanceCollection;
};
export type ActionEntityInstanceCollectionReturnType = ActionError | ActionEntityInstanceCollectionSuccess;
export type ActionSuccess = {
    status: "ok";
    returnedDomainElement: DomainElement;
};
export type ActionReturnType = ActionError | ActionSuccess;
export type ModelActionInitModelParams = {
    metaModel: MetaModel;
    dataStoreType: DataStoreType;
    selfApplication: SelfApplication;
    applicationModelBranch: EntityInstance;
    applicationVersion: EntityInstance;
};
export type ModelActionCommit = {
    actionType: "modelAction";
    actionName: "commit";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionRollback = {
    actionType: "modelAction";
    actionName: "rollback";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionInitModel = {
    actionType: "modelAction";
    actionName: "initModel";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
    params: {
        metaModel: MetaModel;
        dataStoreType: DataStoreType;
        selfApplication: SelfApplication;
        applicationModelBranch: EntityInstance;
        applicationVersion: EntityInstance;
    };
};
export type ModelActionResetModel = {
    actionType: "modelAction";
    actionName: "resetModel";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionResetData = {
    actionType: "modelAction";
    actionName: "resetData";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionAlterEntityAttribute = {
    actionType: "modelAction";
    actionName: "alterEntityAttribute";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    transactional?: boolean | undefined;
    deploymentUuid: string;
    entityName: string;
    entityUuid: string;
    entityDefinitionUuid: string;
    addColumns?: {
        name: string;
        definition: JzodElement;
    }[] | undefined;
    removeColumns?: string[] | undefined;
    update?: JzodElement | undefined;
};
export type ModelActionCreateEntity = {
    actionType: "modelAction";
    actionName: "createEntity";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    transactional?: boolean | undefined;
    deploymentUuid: string;
    entities: {
        entity: Entity;
        entityDefinition: EntityDefinition;
    }[];
};
export type ModelActionDropEntity = {
    actionType: "modelAction";
    actionName: "dropEntity";
    actionLabel?: string | undefined;
    transactional?: boolean | undefined;
    deploymentUuid: string;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    entityUuid: string;
    entityDefinitionUuid: string;
};
export type ModelActionRenameEntity = {
    actionType: "modelAction";
    actionName: "renameEntity";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    transactional?: boolean | undefined;
    deploymentUuid: string;
    entityName?: string | undefined;
    entityUuid: string;
    entityDefinitionUuid: string;
    targetValue: string;
};
export type ModelAction = {
    actionType: "modelAction";
    actionName: "initModel";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
    params: {
        metaModel: MetaModel;
        dataStoreType: DataStoreType;
        selfApplication: SelfApplication;
        applicationModelBranch: EntityInstance;
        applicationVersion: EntityInstance;
    };
} | {
    actionType: "modelAction";
    actionName: "commit";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "rollback";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "remoteLocalCacheRollback";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "resetModel";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "resetData";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "alterEntityAttribute";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    transactional?: boolean | undefined;
    deploymentUuid: string;
    entityName: string;
    entityUuid: string;
    entityDefinitionUuid: string;
    addColumns?: {
        name: string;
        definition: JzodElement;
    }[] | undefined;
    removeColumns?: string[] | undefined;
    update?: JzodElement | undefined;
} | {
    actionType: "modelAction";
    actionName: "renameEntity";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    transactional?: boolean | undefined;
    deploymentUuid: string;
    entityName?: string | undefined;
    entityUuid: string;
    entityDefinitionUuid: string;
    targetValue: string;
} | {
    actionType: "modelAction";
    actionName: "createEntity";
    actionLabel?: string | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    transactional?: boolean | undefined;
    deploymentUuid: string;
    entities: {
        entity: Entity;
        entityDefinition: EntityDefinition;
    }[];
} | {
    actionType: "modelAction";
    actionName: "dropEntity";
    actionLabel?: string | undefined;
    transactional?: boolean | undefined;
    deploymentUuid: string;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    entityUuid: string;
    entityDefinitionUuid: string;
};
export type TestAction_runTestCompositeAction = {
    actionType: "testAction";
    actionName: "runTestCompositeAction";
    endpoint: "a9139e2d-a714-4c9c-bdee-c104488e2eaa";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    testToRun: TestCompositeAction;
};
export type TestAction_runTestCase = {
    actionType: "testAction";
    actionName: "runTestCase";
    endpoint: "a9139e2d-a714-4c9c-bdee-c104488e2eaa";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    testToRun: TestAssertion;
};
export type InstanceCUDAction = {
    actionType: "instanceAction";
    actionName: "createInstance";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "deleteInstance";
    actionLabel?: string | undefined;
    deploymentUuid: string;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "updateInstance";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
};
export type InstanceAction = {
    actionType: "instanceAction";
    actionName: "createInstance";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "deleteInstance";
    actionLabel?: string | undefined;
    deploymentUuid: string;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "deleteInstanceWithCascade";
    actionLabel?: string | undefined;
    deploymentUuid: string;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "updateInstance";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "loadNewInstancesInLocalCache";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "getInstance";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    parentUuid: string;
    uuid: string;
} | {
    actionType: "instanceAction";
    actionName: "getInstances";
    actionLabel?: string | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    parentUuid: string;
};
export type UndoRedoAction = {
    actionType: "undoRedoAction";
    actionName: "undo";
    actionLabel?: string | undefined;
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389";
    deploymentUuid: string;
} | {
    actionType: "undoRedoAction";
    actionName: "redo";
    actionLabel?: string | undefined;
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389";
    deploymentUuid: string;
};
export type TransactionalInstanceAction = {
    actionType: "transactionalInstanceAction";
    actionLabel?: string | undefined;
    deploymentUuid?: string | undefined;
    instanceAction: InstanceCUDAction;
};
export type LocalCacheAction = UndoRedoAction | ModelAction | InstanceAction | TransactionalInstanceAction;
export type StoreManagementAction = {
    actionType: "storeManagementAction";
    actionName: "createStore";
    actionLabel?: string | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    configuration: StoreUnitConfiguration;
    deploymentUuid: string;
} | {
    actionType: "storeManagementAction";
    actionName: "deleteStore";
    actionLabel?: string | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deploymentUuid: string;
    configuration: StoreUnitConfiguration;
} | {
    actionType: "storeManagementAction";
    actionName: "resetAndInitApplicationDeployment";
    actionLabel?: string | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deployments: Deployment[];
    deploymentUuid: string;
} | {
    actionType: "storeManagementAction";
    actionName: "openStore";
    actionLabel?: string | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    configuration: {
        [x: string]: StoreUnitConfiguration;
    };
    deploymentUuid: string;
} | {
    actionType: "storeManagementAction";
    actionName: "closeStore";
    actionLabel?: string | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deploymentUuid: string;
};
export type PersistenceAction = {
    actionType: "LocalPersistenceAction";
    actionName: "create" | "read" | "update" | "delete";
    actionLabel?: string | undefined;
    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4";
    section: ApplicationSection;
    deploymentUuid: string;
    parentName?: string | undefined;
    parentUuid?: string | undefined;
    uuid?: string | undefined;
    objects?: (EntityInstance | undefined)[] | undefined;
} | {
    actionType: "RestPersistenceAction";
    actionName: "create" | "read" | "update" | "delete";
    actionLabel?: string | undefined;
    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4";
    section: ApplicationSection;
    deploymentUuid: string;
    parentName?: string | undefined;
    parentUuid?: string | undefined;
    uuid?: string | undefined;
    objects?: (EntityInstance | undefined)[] | undefined;
} | RunBoxedExtractorAction | RunBoxedQueryAction | RunBoxedExtractorOrQueryAction | RunBoxedQueryTemplateAction | RunBoxedExtractorTemplateAction | RunBoxedQueryTemplateOrBoxedExtractorTemplateAction | BundleAction | InstanceAction | ModelAction | StoreManagementAction;
export type LocalPersistenceAction = {
    actionType: "LocalPersistenceAction";
    actionName: "create" | "read" | "update" | "delete";
    actionLabel?: string | undefined;
    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4";
    section: ApplicationSection;
    deploymentUuid: string;
    parentName?: string | undefined;
    parentUuid?: string | undefined;
    uuid?: string | undefined;
    objects?: (EntityInstance | undefined)[] | undefined;
};
export type RestPersistenceAction = {
    actionType: "RestPersistenceAction";
    actionName: "create" | "read" | "update" | "delete";
    actionLabel?: string | undefined;
    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4";
    section: ApplicationSection;
    deploymentUuid: string;
    parentName?: string | undefined;
    parentUuid?: string | undefined;
    uuid?: string | undefined;
    objects?: (EntityInstance | undefined)[] | undefined;
};
export type RunBoxedQueryTemplateOrBoxedExtractorTemplateAction = {
    actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction";
    actionName: "runQuery";
    actionLabel?: string | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: BoxedExtractorTemplateReturningObjectOrObjectList | BoxedQueryTemplateWithExtractorCombinerTransformer;
};
export type RunBoxedExtractorOrQueryAction = {
    actionType: "runBoxedExtractorOrQueryAction";
    actionName: "runQuery";
    actionLabel?: string | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    queryExecutionStrategy?: ("localCacheOrFail" | "localCacheOrFetch" | "ServerCache" | "storage") | undefined;
    query: BoxedExtractorOrCombinerReturningObjectOrObjectList | BoxedQueryWithExtractorCombinerTransformer;
};
export type RunBoxedQueryTemplateAction = {
    actionType: "runBoxedQueryTemplateAction";
    actionName: "runQuery";
    actionLabel?: string | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: BoxedQueryTemplateWithExtractorCombinerTransformer;
};
export type RunBoxedExtractorTemplateAction = {
    actionType: "runBoxedExtractorTemplateAction";
    actionName: "runQuery";
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: BoxedExtractorTemplateReturningObjectOrObjectList;
};
export type RunBoxedQueryAction = {
    actionType: "runBoxedQueryAction";
    actionName: "runQuery";
    actionLabel?: string | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: BoxedQueryWithExtractorCombinerTransformer;
};
export type RunBoxedExtractorAction = {
    actionType: "runBoxedExtractorAction";
    actionName: "runQuery";
    actionLabel?: string | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: BoxedExtractorOrCombinerReturningObjectOrObjectList;
};
export type CompositeActionDefinition = (DomainAction | CompositeAction | {
    actionType: "compositeRunBoxedQueryTemplateAction";
    actionLabel?: string | undefined;
    nameGivenToResult: string;
    queryTemplate: RunBoxedQueryTemplateAction;
} | {
    actionType: "compositeRunBoxedExtractorTemplateAction";
    actionLabel?: string | undefined;
    nameGivenToResult: string;
    queryTemplate: RunBoxedExtractorTemplateAction;
} | {
    actionType: "compositeRunBoxedExtractorOrQueryAction";
    actionLabel?: string | undefined;
    nameGivenToResult: string;
    query: RunBoxedExtractorOrQueryAction;
} | {
    actionType: "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction";
    actionLabel?: string | undefined;
    nameGivenToResult: string;
    queryTemplate: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction;
} | {
    actionType: "compositeRunTestAssertion";
    actionLabel?: string | undefined;
    nameGivenToResult: string;
    testAssertion: TestAssertion;
})[];
export type CompositeAction = {
    actionType: "compositeAction";
    actionName: "sequence";
    actionLabel?: string | undefined;
    deploymentUuid?: string | undefined;
    templates?: {
        [x: string]: any;
    } | undefined;
    definition: (DomainAction | CompositeAction | {
        actionType: "compositeRunBoxedQueryTemplateAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: RunBoxedQueryTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorTemplateAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: RunBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorOrQueryAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        query: RunBoxedExtractorOrQueryAction;
    } | {
        actionType: "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunTestAssertion";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        testAssertion: TestAssertion;
    })[];
};
export type CompositeRunTestAssertion = {
    actionType: "compositeRunTestAssertion";
    actionLabel?: string | undefined;
    nameGivenToResult: string;
    testAssertion: TestAssertion;
};
export type DomainAction = UndoRedoAction | StoreOrBundleAction | ModelAction | InstanceAction | {
    actionType: "transactionalInstanceAction";
    actionLabel?: string | undefined;
    deploymentUuid?: string | undefined;
    instanceAction: InstanceCUDAction;
} | {
    actionType: "compositeAction";
    actionName: "sequence";
    actionLabel?: string | undefined;
    deploymentUuid?: string | undefined;
    templates?: {
        [x: string]: any;
    } | undefined;
    definition: (DomainAction | CompositeAction | {
        actionType: "compositeRunBoxedQueryTemplateAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: RunBoxedQueryTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorTemplateAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: RunBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorOrQueryAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        query: RunBoxedExtractorOrQueryAction;
    } | {
        actionType: "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunTestAssertion";
        actionLabel?: string | undefined;
        nameGivenToResult: string;
        testAssertion: TestAssertion;
    })[];
};
export type ModelActionReplayableAction = ModelActionAlterEntityAttribute | ModelActionCreateEntity | ModelActionDropEntity | ModelActionRenameEntity;
export type BundleAction = {
    actionType: "bundleAction";
    actionName: "createBundle";
    actionLabel?: string | undefined;
    deploymentUuid: string;
} | {
    actionType: "bundleAction";
    actionName: "deleteBundle";
    actionLabel?: string | undefined;
    deploymentUuid: string;
};
export type StoreOrBundleAction = StoreManagementAction | BundleAction;
export type ActionTransformer = {
    transformerType: "actionTransformer";
};
export type DataTransformer = {
    transformerType: "dataTransformer";
};
export type GetBasicApplicationConfigurationParameters = {
    emulatedServerType: "sql";
    connectionString: string;
} | {
    emulatedServerType: "indexedDb";
    rootIndexDbName: string;
} | {
    emulatedServerType: "filesystem";
    rootDirectory: string;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject_extend = {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        value?: {
            id?: ((number | undefined) | CarryOnObject) | undefined;
            defaultLabel?: ((string | undefined) | CarryOnObject) | undefined;
            initializeTo?: ((any | undefined) | CarryOnObject) | undefined;
            targetEntity?: ((string | undefined) | CarryOnObject) | undefined;
            editable?: ((boolean | undefined) | CarryOnObject) | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_shippingBox_extend = {
    deploymentUuid: string | CarryOnObject;
    pageParams: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
    queryParams: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
    contextResults: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_label_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_orderBy_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateRoot_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_reference_extend = {
    applyTo: {
        referenceType: "referencedExtractor" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors | CarryOnObject;
    } | {
        referenceType: "referencedTransformer" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_root_extend = {
    transformerType: "count" | CarryOnObject;
    attribute?: ((string | undefined) | CarryOnObject) | undefined;
    groupBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject_root_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "listReducerToIndexObject" | CarryOnObject;
    indexAttribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate_root_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "object_fullTemplate" | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement_root_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "listPickElement" | CarryOnObject;
    index: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries_root_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "objectEntries" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues_root_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "objectValues" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_root_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    applyTo: {
        referenceType: "referencedExtractor" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors | CarryOnObject;
    } | {
        referenceType: "referencedTransformer" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild | CarryOnObject;
    } | CarryOnObject;
    transformerType: "unique" | CarryOnObject;
    attribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract_extend = {
    interpolation: "runtime" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_reference_extend = {
    applyTo: {
        referenceType: "referencedExtractor" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors | CarryOnObject;
    } | {
        referenceType: "referencedTransformer" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer_extend = {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        value?: {
            id?: ((number | undefined) | CarryOnObject) | undefined;
            defaultLabel?: ((string | undefined) | CarryOnObject) | undefined;
            initializeTo?: ((any | undefined) | CarryOnObject) | undefined;
            targetEntity?: ((string | undefined) | CarryOnObject) | undefined;
            editable?: ((boolean | undefined) | CarryOnObject) | undefined;
        } | undefined;
        schema?: {
            optional?: boolean | undefined;
            metaSchema?: JzodElement | undefined;
            valueSchema?: JzodElement | undefined;
        } | undefined;
        optional?: boolean | undefined;
    } | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray = CarryOnObject | {
    type: "array" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute = CarryOnObject | {
    type: ("any" | "bigint" | "boolean" | "never" | "null" | "uuid" | "undefined" | "unknown" | "void") | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations = CarryOnObject | {
    type: ("min" | "max") | CarryOnObject;
    parameter?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations = CarryOnObject | {
    type: "date" | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
    validations?: ((CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations = CarryOnObject | {
    type: ("gt" | "gte" | "lt" | "lte" | "int" | "positive" | "nonpositive" | "negative" | "nonnegative" | "multipleOf" | "finite" | "safe") | CarryOnObject;
    parameter?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations = CarryOnObject | {
    type: "number" | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
    validations?: ((CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations = CarryOnObject | {
    type: ("max" | "min" | "length" | "email" | "url" | "emoji" | "uuid" | "cuid" | "cuid2" | "ulid" | "regex" | "includes" | "startsWith" | "endsWith" | "datetime" | "ip") | CarryOnObject;
    parameter?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations = CarryOnObject | {
    type: "string" | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
    validations?: ((CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum = CarryOnObject | {
    type: "enum" | CarryOnObject;
    definition: (string | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes = ("any" | "bigint" | "boolean" | "date" | "never" | "null" | "number" | "string" | "uuid" | "undefined" | "unknown" | "void") | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes = ("array" | "date" | "enum" | "function" | "lazy" | "literal" | "intersection" | "map" | "number" | "object" | "promise" | "record" | "schemaReference" | "set" | "string" | "tuple" | "union") | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction = CarryOnObject | {
    type: "function" | CarryOnObject;
    definition: CarryOnObject | {
        args: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement[] | CarryOnObject;
        returns?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy = CarryOnObject | {
    type: "lazy" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral = CarryOnObject | {
    type: "literal" | CarryOnObject;
    definition: string | number | bigint | boolean | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection = CarryOnObject | {
    type: "intersection" | CarryOnObject;
    definition: CarryOnObject | {
        left: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
        right: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap = CarryOnObject | {
    type: "map" | CarryOnObject;
    definition: [
        CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement,
        CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement
    ] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject = CarryOnObject | {
    extend?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference | undefined;
    type: "object" | CarryOnObject;
    nonStrict?: ((boolean | undefined) | CarryOnObject) | undefined;
    partial?: ((boolean | undefined) | CarryOnObject) | undefined;
    carryOn?: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion | CarryOnObject) | undefined;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise = CarryOnObject | {
    type: "promise" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord = CarryOnObject | {
    type: "record" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference = CarryOnObject | {
    type: "schemaReference" | CarryOnObject;
    context?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
    } | undefined) | CarryOnObject) | undefined;
    carryOn?: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion | CarryOnObject) | undefined;
    definition: CarryOnObject | {
        eager?: ((boolean | undefined) | CarryOnObject) | undefined;
        partial?: ((boolean | undefined) | CarryOnObject) | undefined;
        relativePath?: ((string | undefined) | CarryOnObject) | undefined;
        absolutePath?: ((string | undefined) | CarryOnObject) | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet = CarryOnObject | {
    type: "set" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple = CarryOnObject | {
    type: "tuple" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion = CarryOnObject | {
    type: "union" | CarryOnObject;
    discriminator?: ((string | undefined) | CarryOnObject) | undefined;
    discriminatorNew?: ({
        discriminatorType: "string" | CarryOnObject;
        value: string | CarryOnObject;
    } | {
        discriminatorType: "array" | CarryOnObject;
        value: (string | CarryOnObject)[] | CarryOnObject;
    } | CarryOnObject) | undefined;
    carryOn?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | undefined;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType = ("miroir" | "app") | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplication = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel: string | CarryOnObject;
    description?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel?: ((string | undefined) | CarryOnObject) | undefined;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    type?: ((string | undefined) | CarryOnObject) | undefined;
    selfApplication: string | CarryOnObject;
    branch: string | CarryOnObject;
    previousVersion?: ((string | undefined) | CarryOnObject) | undefined;
    modelStructureMigration?: ((({
        [x: string]: any | CarryOnObject;
    } | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
    modelCUDMigration?: ((({
        [x: string]: any | CarryOnObject;
    } | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel: string | CarryOnObject;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
    selfApplication?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    author?: ((string | undefined) | CarryOnObject) | undefined;
    description?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName: string | CarryOnObject;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    entityUuid: string | CarryOnObject;
    conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    defaultInstanceDetailsReportUuid?: ((string | undefined) | CarryOnObject) | undefined;
    viewAttributes?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
    icon?: ((string | undefined) | CarryOnObject) | undefined;
    jzodSchema: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection = "model" | "data" | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid = string | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex = {
    [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel: string | CarryOnObject;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    adminApplication: string | CarryOnObject;
    bundle: string | CarryOnObject;
    configuration?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration | undefined;
    model?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | undefined;
    data?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplicationDeploymentConfiguration = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel: string | CarryOnObject;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    selfApplication: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementSuccess = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementString | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementNumber | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementArray | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid = CarryOnObject | {
    elementType: "void" | CarryOnObject;
    elementValue?: (void | undefined) | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny = CarryOnObject | {
    elementType: "any" | CarryOnObject;
    elementValue?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementArray = CarryOnObject | {
    elementType: "array" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuid = CarryOnObject | {
    elementType: "instanceUuid" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementNumber = CarryOnObject | {
    elementType: "number" | CarryOnObject;
    elementValue: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementString = CarryOnObject | {
    elementType: "string" | CarryOnObject;
    elementValue: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed = CarryOnObject | {
    elementType: "failure" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject = CarryOnObject | {
    elementType: "object" | CarryOnObject;
    elementValue: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObjectOrFailed = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex = CarryOnObject | {
    elementType: "instanceUuidIndex" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndexOrFailed = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection = CarryOnObject | {
    elementType: "entityInstanceCollection" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollectionOrFailed = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray = CarryOnObject | {
    elementType: "instanceArray" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArrayOrFailed = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance = CarryOnObject | {
    elementType: "instance" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceOrFailed = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementSuccess | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection = CarryOnObject | {
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    instances: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName: string | CarryOnObject;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
    defaultLabel?: ((string | undefined) | CarryOnObject) | undefined;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    definition?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem = CarryOnObject | {
    label: string | CarryOnObject;
    section: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    selfApplication: string | CarryOnObject;
    reportUuid: string | CarryOnObject;
    instanceUuid?: ((string | undefined) | CarryOnObject) | undefined;
    icon: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem[] | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu = CarryOnObject | {
    title: string | CarryOnObject;
    label: string | CarryOnObject;
    items: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu = CarryOnObject | {
    menuType: "simpleMenu" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu = CarryOnObject | {
    menuType: "complexMenu" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection = CarryOnObject | {
    type: "objectInstanceReportSection" | CarryOnObject;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    definition: CarryOnObject | {
        label?: ((string | undefined) | CarryOnObject) | undefined;
        parentUuid: string | CarryOnObject;
        fetchedDataReference?: ((string | undefined) | CarryOnObject) | undefined;
        query?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection = CarryOnObject | {
    type: "objectListReportSection" | CarryOnObject;
    definition: CarryOnObject | {
        label?: ((string | undefined) | CarryOnObject) | undefined;
        parentName?: ((string | undefined) | CarryOnObject) | undefined;
        parentUuid: string | CarryOnObject;
        fetchedDataReference?: ((string | undefined) | CarryOnObject) | undefined;
        query?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject | undefined;
        sortByAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection = CarryOnObject | {
    type: "grid" | CarryOnObject;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    selectData?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    definition: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection[] | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection = CarryOnObject | {
    type: "list" | CarryOnObject;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    selectData?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    definition: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport = CarryOnObject | {
    reportParametersToFetchQueryParametersTransformer?: (({
        [x: string]: string | CarryOnObject;
    } | undefined) | CarryOnObject) | undefined;
    reportParameters?: (({
        [x: string]: string | CarryOnObject;
    } | undefined) | CarryOnObject) | undefined;
    extractorTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    extractors?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord | undefined;
    combiners?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord | undefined;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    section: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel: string | CarryOnObject;
    type?: ((("list" | "grid") | undefined) | CarryOnObject) | undefined;
    selfApplication?: ((string | undefined) | CarryOnObject) | undefined;
    definition: CarryOnObject | {
        reportParametersToFetchQueryParametersTransformer?: (({
            [x: string]: string | CarryOnObject;
        } | undefined) | CarryOnObject) | undefined;
        reportParameters?: (({
            [x: string]: string | CarryOnObject;
        } | undefined) | CarryOnObject) | undefined;
        extractorTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
        extractors?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord | undefined;
        combiners?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord | undefined;
        combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
        runtimeTransformers?: (({
            [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
        } | undefined) | CarryOnObject) | undefined;
        section: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer = {
    transformerType: "objectTransformer" | CarryOnObject;
    attributeName: string | CarryOnObject;
} | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers = CarryOnObject | {
    transformerType: "recordOfTransformers" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel = CarryOnObject | {
    applicationVersions: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion[] | CarryOnObject;
    applicationVersionCrossEntityDefinition: (CarryOnObject | {
        uuid: string | CarryOnObject;
        parentName?: ((string | undefined) | CarryOnObject) | undefined;
        parentUuid: string | CarryOnObject;
        conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
        applicationVersion: string | CarryOnObject;
        entityDefinition: string | CarryOnObject;
    })[] | CarryOnObject;
    entities: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity[] | CarryOnObject;
    entityDefinitions: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition[] | CarryOnObject;
    jzodSchemas: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema[] | CarryOnObject;
    menus: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu[] | CarryOnObject;
    reports: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration = CarryOnObject | {
    emulatedServerType: "indexedDb" | CarryOnObject;
    indexedDbName: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration = CarryOnObject | {
    emulatedServerType: "filesystem" | CarryOnObject;
    directory: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration = CarryOnObject | {
    emulatedServerType: "sql" | CarryOnObject;
    connectionString: string | CarryOnObject;
    schema: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    conceptLevel?: ((("MetaModel" | "Model" | "Data") | undefined) | CarryOnObject) | undefined;
    defaultLabel: string | CarryOnObject;
    definition: CarryOnObject | {
        currentApplicationVersion: string | CarryOnObject;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration = CarryOnObject | {
    admin: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration;
    model: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration;
    data: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction = {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "createInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "deleteInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "updateInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction = {
    actionType: "undoRedoAction" | CarryOnObject;
    actionName: "undo" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "undoRedoAction" | CarryOnObject;
    actionName: "redo" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction = {
    actionType: "modelAction" | CarryOnObject;
    actionName: "initModel" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    params: CarryOnObject | {
        metaModel: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel;
        dataStoreType: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType;
        selfApplication: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplication;
        applicationModelBranch: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
        applicationVersion: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
    };
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "commit" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "rollback" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "remoteLocalCacheRollback" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "resetModel" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "resetData" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "alterEntityAttribute" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    transactional?: ((boolean | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    entityName: string | CarryOnObject;
    entityUuid: string | CarryOnObject;
    entityDefinitionUuid: string | CarryOnObject;
    addColumns?: (((CarryOnObject | {
        name: string | CarryOnObject;
        definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
    })[] | undefined) | CarryOnObject) | undefined;
    removeColumns?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
    update?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement | undefined;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "renameEntity" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    transactional?: ((boolean | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    entityName?: ((string | undefined) | CarryOnObject) | undefined;
    entityUuid: string | CarryOnObject;
    entityDefinitionUuid: string | CarryOnObject;
    targetValue: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "createEntity" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    transactional?: ((boolean | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    entities: (CarryOnObject | {
        entity: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity;
        entityDefinition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition;
    })[] | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "dropEntity" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    transactional?: ((boolean | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    entityUuid: string | CarryOnObject;
    entityDefinitionUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction = {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "createInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "deleteInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "deleteInstanceWithCascade" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "updateInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "loadNewInstancesInLocalCache" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "getInstance" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    parentUuid: string | CarryOnObject;
    uuid: string | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "getInstances" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    parentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction = {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "createStore" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    configuration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "deleteStore" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    configuration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "resetAndInitApplicationDeployment" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    deployments: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment[] | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "openStore" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    configuration: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration;
    } | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "closeStore" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction = CarryOnObject | {
    actionType: "transactionalInstanceAction" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    instanceAction: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction = {
    actionType: "bundleAction" | CarryOnObject;
    actionName: "createBundle" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "bundleAction" | CarryOnObject;
    actionName: "deleteBundle" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction | {
    actionType: "transactionalInstanceAction" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    instanceAction: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction;
} | {
    actionType: "compositeAction" | CarryOnObject;
    actionName: "sequence" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    templates?: (({
        [x: string]: any | CarryOnObject;
    } | undefined) | CarryOnObject) | undefined;
    definition: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction | {
        actionType: "compositeRunBoxedQueryTemplateAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorTemplateAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorOrQueryAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction;
    } | {
        actionType: "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunTestAssertion" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        testAssertion: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion;
    } | CarryOnObject)[] | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionDefinition = (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction | {
    actionType: "compositeRunBoxedQueryTemplateAction" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction;
} | {
    actionType: "compositeRunBoxedExtractorTemplateAction" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction;
} | {
    actionType: "compositeRunBoxedExtractorOrQueryAction" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction;
} | {
    actionType: "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction;
} | {
    actionType: "compositeRunTestAssertion" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    testAssertion: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion;
} | CarryOnObject)[] | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction = CarryOnObject | {
    actionType: "compositeAction" | CarryOnObject;
    actionName: "sequence" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    templates?: (({
        [x: string]: any | CarryOnObject;
    } | undefined) | CarryOnObject) | undefined;
    definition: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction | {
        actionType: "compositeRunBoxedQueryTemplateAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorTemplateAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunBoxedExtractorOrQueryAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction;
    } | {
        actionType: "compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction;
    } | {
        actionType: "compositeRunTestAssertion" | CarryOnObject;
        actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        testAssertion: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion;
    } | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion = CarryOnObject | {
    testType: "testAssertion" | CarryOnObject;
    testLabel: string | CarryOnObject;
    definition: CarryOnObject | {
        resultAccessPath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
        resultTransformer?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime | undefined;
        ignoreAttributes?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
        expectedValue?: any | CarryOnObject;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAction_runTestCase = CarryOnObject | {
    actionType: "testAction" | CarryOnObject;
    actionName: "runTestCase" | CarryOnObject;
    endpoint: "a9139e2d-a714-4c9c-bdee-c104488e2eaa" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    testToRun: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_shippingBox = CarryOnObject | {
    deploymentUuid: string | CarryOnObject;
    pageParams: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
    queryParams: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
    contextResults: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObject = CarryOnObject | {
    queryType: "boxedExtractorOrCombinerReturningObject" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectList = CarryOnObject | {
    queryType: "boxedExtractorOrCombinerReturningObjectList" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer = CarryOnObject | {
    queryType: "boxedQueryWithExtractorCombinerTransformer" | CarryOnObject;
    runAsSql?: ((boolean | undefined) | CarryOnObject) | undefined;
    extractors?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord | undefined;
    combiners?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList = CarryOnObject | {
    extractorOrCombinerType: "extractorByEntityReturningObjectList" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    filter?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        value?: any | CarryOnObject;
    }) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList = CarryOnObject | {
    extractorOrCombinerType: "extractorWrapperReturningList" | CarryOnObject;
    definition: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject = CarryOnObject | {
    extractorOrCombinerType: "extractorWrapperReturningObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference = CarryOnObject | {
    extractorOrCombinerType: "extractorForObjectByDirectReference" | CarryOnObject;
    instanceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference = CarryOnObject | {
    extractorOrCombinerType: "extractorOrCombinerContextReference" | CarryOnObject;
    extractorOrCombinerContextReference: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList = CarryOnObject | {
    extractorOrCombinerType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    rootExtractorOrReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor | string | CarryOnObject;
    subQueryTemplate: CarryOnObject | {
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate;
        rootQueryObjectTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList | {
    extractorOrCombinerType: "literal" | CarryOnObject;
    definition: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectOrObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation = CarryOnObject | {
    extractorOrCombinerType: "combinerForObjectByRelation" | CarryOnObject;
    objectReference: string | CarryOnObject;
    AttributeOfObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList = CarryOnObject | {
    extractorOrCombinerType: "combinerByRelationReturningObjectList" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    objectReference: string | CarryOnObject;
    objectReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList = CarryOnObject | {
    extractorOrCombinerType: "combinerByManyToManyRelationReturningObjectList" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    objectListReference: string | CarryOnObject;
    objectListReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord = {
    [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction = CarryOnObject | {
    actionType: "runBoxedExtractorOrQueryAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    queryExecutionStrategy?: ((("localCacheOrFail" | "localCacheOrFetch" | "ServerCache" | "storage") | undefined) | CarryOnObject) | undefined;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction = CarryOnObject | {
    actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryAction = CarryOnObject | {
    actionType: "runBoxedQueryAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction = CarryOnObject | {
    actionType: "runBoxedQueryTemplateAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorAction = CarryOnObject | {
    actionType: "runBoxedExtractorAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction = CarryOnObject | {
    actionType: "runBoxedExtractorTemplateAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_label = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_orderBy = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant = CarryOnObject | {
    transformerType: "constant" | CarryOnObject;
    value?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor = CarryOnObject | {
    transformerType: "constantAsExtractor" | CarryOnObject;
    valueType?: ((("string" | "number" | "boolean" | "bigint" | "object" | "array") | undefined) | CarryOnObject) | undefined;
    valueJzodSchema: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
    value?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray = CarryOnObject | {
    transformerType: "constantArray" | CarryOnObject;
    value: (any | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean = CarryOnObject | {
    transformerType: "constantBoolean" | CarryOnObject;
    value: boolean | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint = CarryOnObject | {
    transformerType: "constantBigint" | CarryOnObject;
    value: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject = CarryOnObject | {
    transformerType: "constantObject" | CarryOnObject;
    value: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber = CarryOnObject | {
    transformerType: "constantNumber" | CarryOnObject;
    value: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString = CarryOnObject | {
    transformerType: "constantString" | CarryOnObject;
    value: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid = CarryOnObject | {
    transformerType: "constantUuid" | CarryOnObject;
    value: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constants = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantListAsExtractor = CarryOnObject | {
    transformerType: "constantListAsExtractor" | CarryOnObject;
    value: (any | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantListAsExtractor;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid = CarryOnObject | {
    transformerType: "newUuid" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference = CarryOnObject | {
    transformerType: "parameterReference" | CarryOnObject;
    referenceName?: ((string | undefined) | CarryOnObject) | undefined;
    referencePath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference = CarryOnObject | {
    transformerType: "contextReference" | CarryOnObject;
    referenceName?: ((string | undefined) | CarryOnObject) | undefined;
    referencePath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess = CarryOnObject | {
    transformerType: "objectDynamicAccess" | CarryOnObject;
    objectAccessPath: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate | string | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate = CarryOnObject | {
    transformerType: "mustacheStringTemplate" | CarryOnObject;
    definition: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateRoot = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed = CarryOnObject | {
    queryFailure: ("FailedTransformer_objectEntries" | "FailedExtractor" | "QueryNotExecutable" | "DomainStateNotLoaded" | "IncorrectParameters" | "DeploymentNotFound" | "ApplicationSectionNotFound" | "EntityNotFound" | "InstanceNotFound" | "ReferenceNotFound" | "ReferenceFoundButUndefined" | "ReferenceFoundButAttributeUndefinedOnFoundObject") | CarryOnObject;
    query?: ((string | undefined) | CarryOnObject) | undefined;
    failureOrigin?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
    failureMessage?: ((string | undefined) | CarryOnObject) | undefined;
    queryReference?: ((string | undefined) | CarryOnObject) | undefined;
    queryParameters?: ((string | undefined) | CarryOnObject) | undefined;
    queryContext?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    errorStack?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
    innerError?: ((any | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    entityUuid?: ((string | undefined) | CarryOnObject) | undefined;
    instanceUuid?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList = CarryOnObject | {
    extractorTemplateType: "combinerByManyToManyRelationReturningObjectList" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    objectListReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference;
    objectListReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity = CarryOnObject | {
    extractorTemplateType: "extractorTemplateForObjectListByEntity" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    filter?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        value: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString;
    }) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList = CarryOnObject | {
    extractorTemplateType: "combinerByRelationReturningObjectList" | CarryOnObject;
    orderBy?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        direction?: ((("ASC" | "DESC") | undefined) | CarryOnObject) | undefined;
    }) | undefined;
    objectReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference;
    objectReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation = CarryOnObject | {
    extractorTemplateType: "combinerForObjectByRelation" | CarryOnObject;
    objectReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference;
    AttributeOfObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference = CarryOnObject | {
    extractorTemplateType: "extractorForObjectByDirectReference" | CarryOnObject;
    instanceUuid: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningObject = CarryOnObject | {
    extractorTemplateType: "extractorTemplateByExtractorWrapperReturningObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningList = CarryOnObject | {
    extractorTemplateType: "extractorTemplateByExtractorWrapperReturningList" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapper = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectOrObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorCombiner = CarryOnObject | {
    extractorTemplateType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" | CarryOnObject;
    rootExtractorOrReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate | string | CarryOnObject;
    subQueryTemplate: CarryOnObject | {
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate;
        rootQueryObjectTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapper | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorCombiner | {
    extractorTemplateType: "literal" | CarryOnObject;
    definition: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord = {
    [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constants | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_dataflowObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToSpreadObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_reference = CarryOnObject | {
    applyTo: {
        referenceType: "referencedExtractor" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors | CarryOnObject;
    } | {
        referenceType: "referencedTransformer" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_root = CarryOnObject | {
    transformerType: "count" | CarryOnObject;
    attribute?: ((string | undefined) | CarryOnObject) | undefined;
    groupBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_dataflowObject = CarryOnObject | {
    transformerType: "dataflowObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate = CarryOnObject | {
    transformerType: "freeObjectTemplate" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild | {
            [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
        } | string | number | boolean | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter = CarryOnObject | {
    transformerType: "objectAlter" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate = CarryOnObject | {
    transformerType: "innerFullObjectTemplate" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate = CarryOnObject | {
    transformerType: "mustacheStringTemplate" | CarryOnObject;
    definition: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList = CarryOnObject | {
    transformerType: "mapperListToList" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    elementTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject_root = CarryOnObject | {
    transformerType: "listReducerToIndexObject" | CarryOnObject;
    indexAttribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToSpreadObject = CarryOnObject | {
    transformerType: "listReducerToSpreadObject" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate_root = CarryOnObject | {
    transformerType: "object_fullTemplate" | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement_root = CarryOnObject | {
    transformerType: "listPickElement" | CarryOnObject;
    index: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries_root = CarryOnObject | {
    transformerType: "objectEntries" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries = CarryOnObject | {
    transformerType: "objectEntries" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues_root = CarryOnObject | {
    transformerType: "objectValues" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_string = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_root = CarryOnObject | {
    transformerType: "unique" | CarryOnObject;
    attribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_reference = CarryOnObject | {
    applyTo: {
        referenceType: "referencedExtractor" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors | CarryOnObject;
    } | {
        referenceType: "referencedTransformer" | CarryOnObject;
        reference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constant = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantAsExtractor = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantArray = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantBigint = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantBoolean = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantNumber = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString = CarryOnObject | {
    transformerType: "constantString" | CarryOnObject;
    value: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextReference = CarryOnObject | {
    transformerType: "contextReference" | CarryOnObject;
    referenceName?: ((string | undefined) | CarryOnObject) | undefined;
    referencePath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constants = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate = CarryOnObject | {
    transformerType: "freeObjectTemplate" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime | {
            [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
        } | string | number | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate = CarryOnObject | {
    transformerType: "innerFullObjectTemplate" | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_fullTemplate = CarryOnObject | {
    transformerType: "object_fullTemplate" | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess = CarryOnObject | {
    transformerType: "objectDynamicAccess" | CarryOnObject;
    objectAccessPath: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate | string | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectEntries = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listPickElement = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter = CarryOnObject | {
    transformerType: "objectAlter" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listMapperToList = CarryOnObject | {
    transformerType: "mapperListToList" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    elementTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate = CarryOnObject | {
    transformerType: "mustacheStringTemplate" | CarryOnObject;
    definition: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid = CarryOnObject | {
    transformerType: "newUuid" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_parameterReference = CarryOnObject | {
    transformerType: "parameterReference" | CarryOnObject;
    referenceName?: ((string | undefined) | CarryOnObject) | undefined;
    referencePath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique = CarryOnObject | {};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constants | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_fullTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listPickElement | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listMapperToList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectEntries | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem = CarryOnObject | {
    transformerType: "transformer_menu_addItem" | CarryOnObject;
    interpolation: "runtime" | CarryOnObject;
    transformerDefinition: CarryOnObject | {
        menuReference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference | CarryOnObject;
        menuItemReference: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference | CarryOnObject;
        menuSectionInsertionIndex?: ((number | undefined) | CarryOnObject) | undefined;
        menuSectionItemInsertionIndex?: ((number | undefined) | CarryOnObject) | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuildOrRuntime = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObject = CarryOnObject | {
    queryType: "boxedExtractorTemplateReturningObject" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectList = CarryOnObject | {
    queryType: "boxedExtractorTemplateReturningObjectList" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer = CarryOnObject | {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer" | CarryOnObject;
    runAsSql?: ((boolean | undefined) | CarryOnObject) | undefined;
    extractorTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
};
export type CarryOnObject = TransformerForBuild | TransformerForRuntime;
export type CompositeActionTemplate = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
export type MiroirFundamentalType = MiroirAllFundamentalTypesUnion;

export const jzodBaseObject: z.ZodType<JzodBaseObject> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional()}).strict();
export const jzodArray: z.ZodType<JzodArray> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("array"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodPlainAttribute: z.ZodType<JzodPlainAttribute> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.enum(["any","bigint","boolean","never","null","uuid","undefined","unknown","void"]), coerce:z.boolean().optional()}).strict();
export const jzodAttributeDateValidations: z.ZodType<JzodAttributeDateValidations> = z.object({type:z.enum(["min","max"]), parameter:z.any()}).strict();
export const jzodAttributePlainDateWithValidations: z.ZodType<JzodAttributePlainDateWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("date"), coerce:z.boolean().optional(), validations:z.array(z.lazy(() =>jzodAttributeDateValidations)).optional()}).strict();
export const jzodAttributeNumberValidations: z.ZodType<JzodAttributeNumberValidations> = z.object({type:z.enum(["gt","gte","lt","lte","int","positive","nonpositive","negative","nonnegative","multipleOf","finite","safe"]), parameter:z.any()}).strict();
export const jzodAttributePlainNumberWithValidations: z.ZodType<JzodAttributePlainNumberWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("number"), coerce:z.boolean().optional(), validations:z.array(z.lazy(() =>jzodAttributeNumberValidations)).optional()}).strict();
export const jzodAttributeStringValidations: z.ZodType<JzodAttributeStringValidations> = z.object({type:z.enum(["max","min","length","email","url","emoji","uuid","cuid","cuid2","ulid","regex","includes","startsWith","endsWith","datetime","ip"]), parameter:z.any()}).strict();
export const jzodAttributePlainStringWithValidations: z.ZodType<JzodAttributePlainStringWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("string"), coerce:z.boolean().optional(), validations:z.array(z.lazy(() =>jzodAttributeStringValidations)).optional()}).strict();
export const jzodElement: z.ZodType<JzodElement> = z.union([z.lazy(() =>jzodArray), z.lazy(() =>jzodPlainAttribute), z.lazy(() =>jzodAttributePlainDateWithValidations), z.lazy(() =>jzodAttributePlainNumberWithValidations), z.lazy(() =>jzodAttributePlainStringWithValidations), z.lazy(() =>jzodEnum), z.lazy(() =>jzodFunction), z.lazy(() =>jzodLazy), z.lazy(() =>jzodLiteral), z.lazy(() =>jzodIntersection), z.lazy(() =>jzodMap), z.lazy(() =>jzodObject), z.lazy(() =>jzodPromise), z.lazy(() =>jzodRecord), z.lazy(() =>jzodReference), z.lazy(() =>jzodSet), z.lazy(() =>jzodTuple), z.lazy(() =>jzodUnion)]);
export const jzodEnum: z.ZodType<JzodEnum> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("enum"), definition:z.array(z.string())}).strict();
export const jzodEnumAttributeTypes: z.ZodType<JzodEnumAttributeTypes> = z.enum(["any","bigint","boolean","date","never","null","number","string","uuid","undefined","unknown","void"]);
export const jzodEnumElementTypes: z.ZodType<JzodEnumElementTypes> = z.enum(["array","date","enum","function","lazy","literal","intersection","map","number","object","promise","record","schemaReference","set","string","tuple","union"]);
export const jzodFunction: z.ZodType<JzodFunction> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("function"), definition:z.object({args:z.array(z.lazy(() =>jzodElement)), returns:z.lazy(() =>jzodElement).optional()}).strict()}).strict();
export const jzodLazy: z.ZodType<JzodLazy> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("lazy"), definition:z.lazy(() =>jzodFunction)}).strict();
export const jzodLiteral: z.ZodType<JzodLiteral> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("literal"), definition:z.union([z.string(), z.number(), z.bigint(), z.boolean()])}).strict();
export const jzodIntersection: z.ZodType<JzodIntersection> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("intersection"), definition:z.object({left:z.lazy(() =>jzodElement), right:z.lazy(() =>jzodElement)}).strict()}).strict();
export const jzodMap: z.ZodType<JzodMap> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("map"), definition:z.tuple([z.lazy(() =>jzodElement), z.lazy(() =>jzodElement)])}).strict();
export const jzodObject: z.ZodType<JzodObject> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), extend:z.lazy(() =>jzodReference).optional(), type:z.literal("object"), nonStrict:z.boolean().optional(), partial:z.boolean().optional(), carryOn:z.union([z.lazy(() =>jzodObject), z.lazy(() =>jzodUnion)]).optional(), definition:z.record(z.string(),z.lazy(() =>jzodElement))}).strict();
export const jzodPromise: z.ZodType<JzodPromise> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("promise"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodRecord: z.ZodType<JzodRecord> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("record"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodReference: z.ZodType<JzodReference> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("schemaReference"), context:z.record(z.string(),z.lazy(() =>jzodElement)).optional(), carryOn:z.union([z.lazy(() =>jzodObject), z.lazy(() =>jzodUnion)]).optional(), definition:z.object({eager:z.boolean().optional(), partial:z.boolean().optional(), relativePath:z.string().optional(), absolutePath:z.string().optional()}).strict()}).strict();
export const jzodSet: z.ZodType<JzodSet> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("set"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodTuple: z.ZodType<JzodTuple> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("tuple"), definition:z.array(z.lazy(() =>jzodElement))}).strict();
export const jzodUnion: z.ZodType<JzodUnion> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional(), type:z.literal("union"), discriminator:z.string().optional(), discriminatorNew:z.union([z.object({discriminatorType:z.literal("string"), value:z.string()}).strict(), z.object({discriminatorType:z.literal("array"), value:z.array(z.string())}).strict()]).optional(), carryOn:z.lazy(() =>jzodObject).optional(), definition:z.array(z.lazy(() =>jzodElement))}).strict();
export const ______________________________________________transformers_____________________________________________: z.ZodType<______________________________________________transformers_____________________________________________> = z.never();
export const transformer_label: z.ZodType<Transformer_label> = z.object({label:z.string().optional()}).strict();
export const recordOfTransformers: z.ZodType<RecordOfTransformers> = z.object({transformerType:z.literal("recordOfTransformers"), definition:z.record(z.string(),z.lazy(() =>transformer))}).strict();
export const transformer: z.ZodType<Transformer> = z.union([z.object({transformerType:z.literal("objectTransformer"), attributeName:z.string()}).strict(), z.lazy(() =>recordOfTransformers)]);
export const transformer_mustacheStringTemplate: z.ZodType<Transformer_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string()}).strict();
export const transformer_constant: z.ZodType<Transformer_constant> = z.object({transformerType:z.literal("constant"), value:z.any()}).strict();
export const transformer_constantAsExtractor: z.ZodType<Transformer_constantAsExtractor> = z.object({transformerType:z.literal("constantAsExtractor"), valueType:z.enum(["string","number","boolean","bigint","object","array"]).optional(), valueJzodSchema:z.lazy(() =>jzodElement), value:z.any()}).strict();
export const transformer_constantListAsExtractor: z.ZodType<Transformer_constantListAsExtractor> = z.object({transformerType:z.literal("constantListAsExtractor"), value:z.array(z.any())}).strict();
export const transformer_constantArray: z.ZodType<Transformer_constantArray> = z.object({transformerType:z.literal("constantArray"), value:z.array(z.any())}).strict();
export const transformer_constantBigint: z.ZodType<Transformer_constantBigint> = z.object({transformerType:z.literal("constantBigint"), value:z.number()}).strict();
export const transformer_constantBoolean: z.ZodType<Transformer_constantBoolean> = z.object({transformerType:z.literal("constantBoolean"), value:z.boolean()}).strict();
export const transformer_constantNumber: z.ZodType<Transformer_constantNumber> = z.object({transformerType:z.literal("constantNumber"), value:z.number()}).strict();
export const transformer_constantObject: z.ZodType<Transformer_constantObject> = z.object({transformerType:z.literal("constantObject"), value:z.record(z.string(),z.any())}).strict();
export const transformer_constantString: z.ZodType<Transformer_constantString> = z.object({transformerType:z.literal("constantString"), value:z.string()}).strict();
export const transformer_constantUuid: z.ZodType<Transformer_constantUuid> = z.object({transformerType:z.literal("constantUuid"), value:z.string()}).strict();
export const transformer_newUuid: z.ZodType<Transformer_newUuid> = z.object({transformerType:z.literal("newUuid")}).strict();
export const transformer_contextReference: z.ZodType<Transformer_contextReference> = z.object({transformerType:z.literal("contextReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformer_parameterReference: z.ZodType<Transformer_parameterReference> = z.object({transformerType:z.literal("parameterReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformer_contextOrParameterReference: z.ZodType<Transformer_contextOrParameterReference> = z.union([z.lazy(() =>transformer_contextReference), z.lazy(() =>transformer_parameterReference)]);
export const transformer_objectDynamicAccess: z.ZodType<Transformer_objectDynamicAccess> = z.object({transformerType:z.literal("objectDynamicAccess"), objectAccessPath:z.array(z.union([z.lazy(() =>transformer_contextOrParameterReference), z.lazy(() =>transformer_objectDynamicAccess), z.lazy(() =>transformer_mustacheStringTemplate), z.string()]))}).strict();
export const transformer_constants: z.ZodType<Transformer_constants> = z.union([z.lazy(() =>transformer_constant), z.lazy(() =>transformer_constantAsExtractor), z.lazy(() =>transformer_constantArray), z.lazy(() =>transformer_constantBigint), z.lazy(() =>transformer_constantBoolean), z.lazy(() =>transformer_constantUuid), z.lazy(() =>transformer_constantObject), z.lazy(() =>transformer_constantNumber), z.lazy(() =>transformer_constantString), z.lazy(() =>transformer_newUuid)]);
export const transformer_extractors: z.ZodType<Transformer_extractors> = z.lazy(() =>transformer_constantListAsExtractor);
export const transformer_InnerReference: z.ZodType<Transformer_InnerReference> = z.union([z.lazy(() =>transformer_mustacheStringTemplate), z.lazy(() =>transformer_constant), z.lazy(() =>transformer_constantUuid), z.lazy(() =>transformer_constantObject), z.lazy(() =>transformer_constantString), z.lazy(() =>transformer_newUuid), z.lazy(() =>transformer_contextOrParameterReference), z.lazy(() =>transformer_objectDynamicAccess)]);
export const transformer_orderBy: z.ZodType<Transformer_orderBy> = z.object({label:z.string().optional(), orderBy:z.string().optional()}).strict();
export const transformerForBuild_reference: z.ZodType<TransformerForBuild_reference> = z.object({applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_count_root: z.ZodType<TransformerForBuild_count_root> = z.object({transformerType:z.literal("count"), attribute:z.string().optional(), groupBy:z.string().optional()}).strict();
export const transformerForBuild_count: z.ZodType<TransformerForBuild_count> = z.object({transformerType:z.literal("count"), attribute:z.string().optional(), groupBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_unique_root: z.ZodType<TransformerForBuild_unique_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()]), transformerType:z.literal("unique"), attribute:z.string()}).strict();
export const transformerForBuild_unique: z.ZodType<TransformerForBuild_unique> = z.object({label:z.string().optional(), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()]), transformerType:z.literal("unique"), attribute:z.string()}).strict();
export const transformerForBuild_innerFullObjectTemplate: z.ZodType<TransformerForBuild_innerFullObjectTemplate> = z.object({label:z.string().optional(), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()]), transformerType:z.literal("innerFullObjectTemplate"), referenceToOuterObject:z.string(), definition:z.array(z.object({attributeKey:z.lazy(() =>transformer_InnerReference), attributeValue:z.lazy(() =>transformerForBuild)}).strict())}).strict();
export const transformerForBuild_object_fullTemplate_root: z.ZodType<TransformerForBuild_object_fullTemplate_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("object_fullTemplate"), definition:z.array(z.object({attributeKey:z.lazy(() =>transformer_InnerReference), attributeValue:z.lazy(() =>transformerForBuild)}).strict())}).strict();
export const transformerForBuild_object_fullTemplate: z.ZodType<TransformerForBuild_object_fullTemplate> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("object_fullTemplate"), definition:z.array(z.object({attributeKey:z.lazy(() =>transformer_InnerReference), attributeValue:z.lazy(() =>transformerForBuild)}).strict()), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_freeObjectTemplate: z.ZodType<TransformerForBuild_freeObjectTemplate> = z.object({transformerType:z.literal("freeObjectTemplate"), definition:z.record(z.string(),z.union([z.lazy(() =>transformerForBuild), z.record(z.string(),z.lazy(() =>transformerForBuild)), z.string(), z.number(), z.boolean()]))}).strict();
export const transformerForBuild_inner_object_alter: z.ZodType<TransformerForBuild_inner_object_alter> = z.object({transformerType:z.literal("objectAlter"), referenceToOuterObject:z.string(), definition:z.lazy(() =>transformerForBuild_freeObjectTemplate)}).strict();
export const transformerForBuild_mustacheStringTemplate: z.ZodType<TransformerForBuild_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string()}).strict();
export const transformerForBuild_list_listMapperToList: z.ZodType<TransformerForBuild_list_listMapperToList> = z.object({label:z.string().optional(), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()]), transformerType:z.literal("mapperListToList"), referenceToOuterObject:z.string(), elementTransformer:z.lazy(() =>transformerForBuild)}).strict();
export const transformerForBuild_object_listReducerToIndexObject_root: z.ZodType<TransformerForBuild_object_listReducerToIndexObject_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listReducerToIndexObject"), indexAttribute:z.string()}).strict();
export const transformerForBuild_object_listReducerToIndexObject: z.ZodType<TransformerForBuild_object_listReducerToIndexObject> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listReducerToIndexObject"), indexAttribute:z.string(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_object_listReducerToSpreadObject: z.ZodType<TransformerForBuild_object_listReducerToSpreadObject> = z.object({label:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()]), transformerType:z.literal("listReducerToSpreadObject")}).strict();
export const transformerForBuild_object_listPickElement_root: z.ZodType<TransformerForBuild_object_listPickElement_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listPickElement"), index:z.number()}).strict();
export const transformerForBuild_object_listPickElement: z.ZodType<TransformerForBuild_object_listPickElement> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listPickElement"), index:z.number(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_objectEntries_root: z.ZodType<TransformerForBuild_objectEntries_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectEntries")}).strict();
export const transformerForBuild_objectEntries: z.ZodType<TransformerForBuild_objectEntries> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectEntries"), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_objectValues_root: z.ZodType<TransformerForBuild_objectValues_root> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectValues")}).strict();
export const transformerForBuild_objectValues: z.ZodType<TransformerForBuild_objectValues> = z.object({label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectValues"), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForBuild)])}).strict()])}).strict();
export const transformerForBuild_list: z.ZodType<TransformerForBuild_list> = z.union([z.lazy(() =>transformerForBuild_objectEntries), z.lazy(() =>transformerForBuild_objectValues), z.lazy(() =>transformerForBuild_list_listMapperToList)]);
export const transformerForBuild_string: z.ZodType<TransformerForBuild_string> = z.lazy(() =>transformerForBuild_mustacheStringTemplate);
export const transformerForBuild_object: z.ZodType<TransformerForBuild_object> = z.union([z.lazy(() =>transformerForBuild_object_fullTemplate), z.lazy(() =>transformerForBuild_freeObjectTemplate), z.lazy(() =>transformerForBuild_inner_object_alter), z.lazy(() =>transformerForBuild_object_listPickElement), z.lazy(() =>transformerForBuild_object_listReducerToIndexObject)]);
export const transformerForBuild_dataflowObject: z.ZodType<TransformerForBuild_dataflowObject> = z.object({transformerType:z.literal("dataflowObject"), definition:z.record(z.string(),z.lazy(() =>transformerForBuild))}).strict();
export const transformerForBuild: z.ZodType<TransformerForBuild> = z.union([z.lazy(() =>transformer_constants), z.lazy(() =>transformer_InnerReference), z.lazy(() =>transformerForBuild_dataflowObject), z.lazy(() =>transformerForBuild_freeObjectTemplate), z.lazy(() =>transformerForBuild_inner_object_alter), z.lazy(() =>transformerForBuild_object_fullTemplate), z.lazy(() =>transformerForBuild_objectEntries), z.lazy(() =>transformerForBuild_objectValues), z.lazy(() =>transformerForBuild_object_listPickElement), z.lazy(() =>transformerForBuild_object_listReducerToIndexObject), z.lazy(() =>transformerForBuild_object_listReducerToSpreadObject), z.lazy(() =>transformerForBuild_list_listMapperToList), z.lazy(() =>transformerForBuild_mustacheStringTemplate)]);
export const transformerForRuntime_Abstract: z.ZodType<TransformerForRuntime_Abstract> = z.object({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_orderedTransformer: z.ZodType<TransformerForRuntime_orderedTransformer> = z.object({interpolation:z.literal("runtime"), orderBy:z.string().optional()}).strict();
export const transformerForRuntime_reference: z.ZodType<TransformerForRuntime_reference> = z.object({applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()])}).strict();
export const transformerForRuntime_constantAsExtractor: z.ZodType<TransformerForRuntime_constantAsExtractor> = z.object({transformerType:z.literal("constantAsExtractor"), valueType:z.enum(["string","number","boolean","bigint","object","array"]).optional(), valueJzodSchema:z.lazy(() =>jzodElement), value:z.any(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constant: z.ZodType<TransformerForRuntime_constant> = z.object({transformerType:z.literal("constant"), value:z.any(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantUuid: z.ZodType<TransformerForRuntime_constantUuid> = z.object({transformerType:z.literal("constantUuid"), value:z.string(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantArray: z.ZodType<TransformerForRuntime_constantArray> = z.object({transformerType:z.literal("constantArray"), value:z.array(z.any()), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantBigint: z.ZodType<TransformerForRuntime_constantBigint> = z.object({transformerType:z.literal("constantBigint"), value:z.number(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantBoolean: z.ZodType<TransformerForRuntime_constantBoolean> = z.object({transformerType:z.literal("constantBoolean"), value:z.boolean(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantNumber: z.ZodType<TransformerForRuntime_constantNumber> = z.object({transformerType:z.literal("constantNumber"), value:z.number(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantObject: z.ZodType<TransformerForRuntime_constantObject> = z.object({transformerType:z.literal("constantObject"), value:z.record(z.string(),z.any()), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantString: z.ZodType<TransformerForRuntime_constantString> = z.object({transformerType:z.literal("constantString"), value:z.string(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_newUuid: z.ZodType<TransformerForRuntime_newUuid> = z.object({transformerType:z.literal("newUuid"), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_contextReference: z.ZodType<TransformerForRuntime_contextReference> = z.object({transformerType:z.literal("contextReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_parameterReference: z.ZodType<TransformerForRuntime_parameterReference> = z.object({transformerType:z.literal("parameterReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_contextOrParameterReference: z.ZodType<TransformerForRuntime_contextOrParameterReference> = z.union([z.lazy(() =>transformerForRuntime_contextReference), z.lazy(() =>transformerForRuntime_parameterReference)]);
export const transformerForRuntime_objectDynamicAccess: z.ZodType<TransformerForRuntime_objectDynamicAccess> = z.object({interpolation:z.literal("runtime"), transformerType:z.literal("objectDynamicAccess"), objectAccessPath:z.array(z.union([z.lazy(() =>transformerForRuntime_contextOrParameterReference), z.lazy(() =>transformerForRuntime_objectDynamicAccess), z.lazy(() =>transformerForRuntime_mustacheStringTemplate), z.string()]))}).strict();
export const transformerForRuntime_constants: z.ZodType<TransformerForRuntime_constants> = z.union([z.lazy(() =>transformerForRuntime_constant), z.lazy(() =>transformerForRuntime_constantAsExtractor), z.lazy(() =>transformerForRuntime_constantArray), z.lazy(() =>transformerForRuntime_constantBigint), z.lazy(() =>transformerForRuntime_constantBoolean), z.lazy(() =>transformerForRuntime_constantNumber), z.lazy(() =>transformerForRuntime_constantUuid), z.lazy(() =>transformerForRuntime_constantObject), z.lazy(() =>transformerForRuntime_constantString), z.lazy(() =>transformerForRuntime_newUuid)]);
export const transformerForRuntime_InnerReference: z.ZodType<TransformerForRuntime_InnerReference> = z.union([z.lazy(() =>transformerForRuntime_mustacheStringTemplate), z.lazy(() =>transformerForRuntime_contextOrParameterReference), z.lazy(() =>transformerForRuntime_objectDynamicAccess)]);
export const transformerForRuntime_mustacheStringTemplate: z.ZodType<TransformerForRuntime_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_count: z.ZodType<TransformerForRuntime_count> = z.object({transformerType:z.literal("count"), attribute:z.string().optional(), groupBy:z.string().optional(), interpolation:z.literal("runtime"), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()])}).strict();
export const transformerForRuntime_unique: z.ZodType<TransformerForRuntime_unique> = z.object({label:z.string().optional(), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()]), transformerType:z.literal("unique"), attribute:z.string(), interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_objectEntries: z.ZodType<TransformerForRuntime_objectEntries> = z.object({interpolation:z.literal("runtime"), label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectEntries"), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()])}).strict();
export const transformerForRuntime_objectValues: z.ZodType<TransformerForRuntime_objectValues> = z.object({interpolation:z.literal("runtime"), label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("objectValues"), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()])}).strict();
export const transformerForRuntime_freeObjectTemplate: z.ZodType<TransformerForRuntime_freeObjectTemplate> = z.object({interpolation:z.literal("runtime"), transformerType:z.literal("freeObjectTemplate"), definition:z.record(z.string(),z.union([z.lazy(() =>transformerForRuntime), z.record(z.string(),z.lazy(() =>transformerForRuntime)), z.string(), z.number()]))}).strict();
export const transformerForRuntime_innerFullObjectTemplate: z.ZodType<TransformerForRuntime_innerFullObjectTemplate> = z.object({interpolation:z.literal("runtime"), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()]), transformerType:z.literal("innerFullObjectTemplate"), definition:z.array(z.object({attributeKey:z.lazy(() =>transformerForRuntime), attributeValue:z.lazy(() =>transformerForRuntime)}).strict())}).strict();
export const transformerForRuntime_object_fullTemplate: z.ZodType<TransformerForRuntime_object_fullTemplate> = z.object({interpolation:z.literal("runtime"), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()]), transformerType:z.literal("object_fullTemplate"), definition:z.array(z.object({attributeKey:z.lazy(() =>transformerForRuntime), attributeValue:z.lazy(() =>transformerForRuntime)}).strict())}).strict();
export const transformerForRuntime_object_alter: z.ZodType<TransformerForRuntime_object_alter> = z.object({interpolation:z.literal("runtime"), orderBy:z.string().optional(), transformerType:z.literal("objectAlter"), referenceToOuterObject:z.string(), definition:z.lazy(() =>transformerForRuntime_freeObjectTemplate)}).strict();
export const transformerForRuntime_list_listMapperToList: z.ZodType<TransformerForRuntime_list_listMapperToList> = z.object({interpolation:z.literal("runtime"), orderBy:z.string().optional(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()]), transformerType:z.literal("mapperListToList"), referenceToOuterObject:z.string(), elementTransformer:z.lazy(() =>transformerForRuntime)}).strict();
export const transformerForRuntime_mapper_listToObject: z.ZodType<TransformerForRuntime_mapper_listToObject> = z.object({interpolation:z.literal("runtime"), label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listReducerToIndexObject"), indexAttribute:z.string(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()])}).strict();
export const transformerForRuntime_list_listPickElement: z.ZodType<TransformerForRuntime_list_listPickElement> = z.object({interpolation:z.literal("runtime"), label:z.string().optional(), orderBy:z.string().optional(), transformerType:z.literal("listPickElement"), index:z.number(), applyTo:z.union([z.object({referenceType:z.literal("referencedExtractor"), reference:z.union([z.string(), z.lazy(() =>transformer_extractors)])}).strict(), z.object({referenceType:z.literal("referencedTransformer"), reference:z.union([z.string(), z.lazy(() =>transformerForRuntime)])}).strict()])}).strict();
export const transformerForRuntime: z.ZodType<TransformerForRuntime> = z.union([z.lazy(() =>transformerForRuntime_constants), z.lazy(() =>transformerForRuntime_InnerReference), z.lazy(() =>transformerForRuntime_object_fullTemplate), z.lazy(() =>transformerForRuntime_freeObjectTemplate), z.lazy(() =>transformerForRuntime_object_alter), z.lazy(() =>transformerForRuntime_count), z.lazy(() =>transformerForRuntime_list_listPickElement), z.lazy(() =>transformerForRuntime_list_listMapperToList), z.lazy(() =>transformerForRuntime_mapper_listToObject), z.lazy(() =>transformerForRuntime_mustacheStringTemplate), z.lazy(() =>transformerForRuntime_objectValues), z.lazy(() =>transformerForRuntime_objectEntries), z.lazy(() =>transformerForRuntime_unique)]);
export const transformerForBuildOrRuntime: z.ZodType<TransformerForBuildOrRuntime> = z.union([z.lazy(() =>transformerForBuild), z.lazy(() =>transformerForRuntime)]);
export const actionHandler: z.ZodType<ActionHandler> = z.object({interface:z.object({actionJzodObjectSchema:z.lazy(() =>jzodObject)}).strict(), implementation:z.object({templates:z.record(z.string(),z.any()).optional(), compositeActionTemplate:z.lazy(() =>compositeActionTemplate)}).strict()}).strict();
export const transformer_menu_addItem: z.ZodType<Transformer_menu_addItem> = z.object({transformerType:z.literal("transformer_menu_addItem"), interpolation:z.literal("runtime"), transformerDefinition:z.object({menuReference:z.union([z.string(), z.lazy(() =>transformerForRuntime_InnerReference)]), menuItemReference:z.union([z.string(), z.lazy(() =>transformerForRuntime_InnerReference)]), menuSectionInsertionIndex:z.number().optional(), menuSectionItemInsertionIndex:z.number().optional()}).strict()}).strict();
export const extendedTransformerForRuntime: z.ZodType<ExtendedTransformerForRuntime> = z.union([z.lazy(() =>transformerForRuntime), z.lazy(() =>transformer_menu_addItem)]);
export const ______________________________________________miroirMetaModel_____________________________________________: z.ZodType<______________________________________________miroirMetaModel_____________________________________________> = z.never();
export const entityAttributeExpandedType: z.ZodType<EntityAttributeExpandedType> = z.enum(["UUID","STRING","BOOLEAN","OBJECT"]);
export const entityAttributeType: z.ZodType<EntityAttributeType> = z.union([z.lazy(() =>entityInstance), z.enum(["ENTITY_INSTANCE_UUID","ARRAY"])]);
export const entityAttributeUntypedCore = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean()}).strict();
export const entityAttributeCore = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean(), type:z.lazy(() =>entityAttributeExpandedType)}).strict();
export const entityArrayAttribute = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean(), type:z.literal("ARRAY"), lineFormat:z.array(z.lazy(() =>entityAttributeCore))}).strict();
export const entityForeignKeyAttribute = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean(), type:z.literal("ENTITY_INSTANCE_UUID"), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().uuid()}).strict();
export const entityAttribute: z.ZodType<EntityAttribute> = z.union([z.lazy(() =>entityForeignKeyAttribute), z.lazy(() =>entityArrayAttribute)]);
export const entityAttributePartial: z.ZodType<EntityAttributePartial> = z.union([z.lazy(() =>jzodArray), z.lazy(() =>jzodPlainAttribute), z.lazy(() =>jzodAttributePlainDateWithValidations), z.lazy(() =>jzodAttributePlainNumberWithValidations), z.lazy(() =>jzodAttributePlainStringWithValidations), z.lazy(() =>jzodEnum), z.lazy(() =>jzodFunction), z.lazy(() =>jzodLazy), z.lazy(() =>jzodLiteral), z.lazy(() =>jzodIntersection), z.lazy(() =>jzodMap), z.lazy(() =>jzodObject), z.lazy(() =>jzodPromise), z.lazy(() =>jzodRecord), z.lazy(() =>jzodReference), z.lazy(() =>jzodSet), z.lazy(() =>jzodTuple), z.lazy(() =>jzodUnion)]);
export const applicationSection: z.ZodType<ApplicationSection> = z.union([z.literal("model"), z.literal("data")]);
export const dataStoreApplicationType: z.ZodType<DataStoreApplicationType> = z.union([z.literal("miroir"), z.literal("app")]);
export const storeBasedConfiguration: z.ZodType<StoreBasedConfiguration> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), defaultLabel:z.string().uuid(), definition:z.object({currentApplicationVersion:z.string().uuid()}).strict()}).strict();
export const entityInstance = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional()});
export const entityInstanceCollection: z.ZodType<EntityInstanceCollection> = z.object({parentName:z.string().optional(), parentUuid:z.string(), applicationSection:z.lazy(() =>applicationSection), instances:z.array(z.lazy(() =>entityInstance))}).strict();
export const conceptLevel: z.ZodType<ConceptLevel> = z.enum(["MetaModel","Model","Data"]);
export const dataStoreType: z.ZodType<DataStoreType> = z.enum(["miroir","app"]);
export const entityInstanceUuid: z.ZodType<EntityInstanceUuid> = z.string();
export const entityInstancesUuidIndex: z.ZodType<EntityInstancesUuidIndex> = z.record(z.string(),z.lazy(() =>entityInstance));
export const entityInstancesUuidIndexUuidIndex: z.ZodType<EntityInstancesUuidIndexUuidIndex> = z.record(z.string(),z.lazy(() =>entityInstancesUuidIndex));
export const ______________________________________________entities_____________________________________________: z.ZodType<______________________________________________entities_____________________________________________> = z.never();
export const adminApplication: z.ZodType<AdminApplication> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), selfApplication:z.string().uuid()}).strict();
export const selfApplication: z.ZodType<SelfApplication> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional()}).strict();
export const applicationVersion: z.ZodType<ApplicationVersion> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string().optional(), description:z.string().optional(), type:z.string().optional(), selfApplication:z.string().uuid(), branch:z.string().uuid(), previousVersion:z.string().uuid().optional(), modelStructureMigration:z.array(z.record(z.string(),z.any())).optional(), modelCUDMigration:z.array(z.record(z.string(),z.any())).optional()}).strict();
export const bundle: z.ZodType<Bundle> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid(), name:z.string(), contents:z.union([z.object({type:z.literal("runtime")}).strict(), z.object({type:z.literal("development"), applicationVersion:z.lazy(() =>applicationVersion)}).strict()])}).strict();
export const deployment: z.ZodType<Deployment> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), adminApplication:z.string().uuid(), bundle:z.string().uuid(), configuration:z.lazy(() =>storeUnitConfiguration).optional(), model:z.lazy(() =>jzodObject).optional(), data:z.lazy(() =>jzodObject).optional()}).strict();
export const entity: z.ZodType<Entity> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), selfApplication:z.string().uuid().optional(), name:z.string(), author:z.string().uuid().optional(), description:z.string().optional()}).strict();
export const entityDefinition: z.ZodType<EntityDefinition> = z.object({uuid:z.string().uuid(), parentName:z.string(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), entityUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), description:z.string().optional(), defaultInstanceDetailsReportUuid:z.string().uuid().optional(), viewAttributes:z.array(z.string()).optional(), icon:z.string().optional(), jzodSchema:z.lazy(() =>jzodObject)}).strict();
export const testCompositeAction: z.ZodType<TestCompositeAction> = z.object({testType:z.literal("testCompositeAction"), testLabel:z.string(), beforeTestSetupAction:z.lazy(() =>compositeAction).optional(), afterTestCleanupAction:z.lazy(() =>compositeAction).optional(), compositeAction:z.lazy(() =>compositeAction), testCompositeActionAssertions:z.array(z.lazy(() =>compositeRunTestAssertion))}).strict();
export const testCompositeActionSuite: z.ZodType<TestCompositeActionSuite> = z.object({testType:z.literal("testCompositeActionSuite"), testLabel:z.string(), beforeAll:z.lazy(() =>compositeAction).optional(), beforeEach:z.lazy(() =>compositeAction).optional(), afterEach:z.lazy(() =>compositeAction).optional(), afterAll:z.lazy(() =>compositeAction).optional(), testCompositeActions:z.record(z.string(),z.lazy(() =>testCompositeAction))}).strict();
export const testCompositeActionTemplate: z.ZodType<TestCompositeActionTemplate> = z.object({testType:z.literal("testCompositeActionTemplate"), testLabel:z.string(), beforeTestSetupAction:z.lazy(() =>compositeActionTemplate).optional(), afterTestCleanupAction:z.lazy(() =>compositeActionTemplate).optional(), compositeActionTemplate:z.lazy(() =>compositeActionTemplate), testCompositeActionAssertions:z.array(z.lazy(() =>compositeRunTestAssertion))}).strict();
export const testCompositeActionTemplateSuite: z.ZodType<TestCompositeActionTemplateSuite> = z.object({testType:z.literal("testCompositeActionTemplateSuite"), testLabel:z.string(), beforeAll:z.lazy(() =>compositeActionTemplate).optional(), beforeEach:z.lazy(() =>compositeActionTemplate).optional(), afterEach:z.lazy(() =>compositeActionTemplate).optional(), afterAll:z.lazy(() =>compositeActionTemplate).optional(), testCompositeActions:z.record(z.string(),z.lazy(() =>testCompositeActionTemplate))}).strict();
export const testAssertion: z.ZodType<TestAssertion> = z.object({testType:z.literal("testAssertion"), testLabel:z.string(), definition:z.object({resultAccessPath:z.array(z.string()).optional(), resultTransformer:z.lazy(() =>extendedTransformerForRuntime).optional(), ignoreAttributes:z.array(z.string()).optional(), expectedValue:z.any()}).strict()}).strict();
export const test: z.ZodType<Test> = z.object({uuid:z.string(), parentName:z.string().optional(), parentUuid:z.string(), definition:z.union([z.object({testType:z.literal("testCompositeActionSuite"), testLabel:z.string(), beforeAll:z.lazy(() =>compositeAction).optional(), beforeEach:z.lazy(() =>compositeAction).optional(), afterEach:z.lazy(() =>compositeAction).optional(), afterAll:z.lazy(() =>compositeAction).optional(), testCompositeActions:z.record(z.string(),z.lazy(() =>testCompositeAction))}).strict(), z.object({testType:z.literal("testCompositeAction"), testLabel:z.string(), beforeTestSetupAction:z.lazy(() =>compositeAction).optional(), afterTestCleanupAction:z.lazy(() =>compositeAction).optional(), compositeAction:z.lazy(() =>compositeAction), testCompositeActionAssertions:z.array(z.lazy(() =>compositeRunTestAssertion))}).strict(), z.object({testType:z.literal("testCompositeActionTemplate"), testLabel:z.string(), beforeTestSetupAction:z.lazy(() =>compositeActionTemplate).optional(), afterTestCleanupAction:z.lazy(() =>compositeActionTemplate).optional(), compositeActionTemplate:z.lazy(() =>compositeActionTemplate), testCompositeActionAssertions:z.array(z.lazy(() =>compositeRunTestAssertion))}).strict(), z.object({testType:z.literal("testCompositeActionTemplateSuite"), testLabel:z.string(), beforeAll:z.lazy(() =>compositeActionTemplate).optional(), beforeEach:z.lazy(() =>compositeActionTemplate).optional(), afterEach:z.lazy(() =>compositeActionTemplate).optional(), afterAll:z.lazy(() =>compositeActionTemplate).optional(), testCompositeActions:z.record(z.string(),z.lazy(() =>testCompositeActionTemplate))}).strict(), z.object({testType:z.literal("testAssertion"), testLabel:z.string(), definition:z.object({resultAccessPath:z.array(z.string()).optional(), resultTransformer:z.lazy(() =>extendedTransformerForRuntime).optional(), ignoreAttributes:z.array(z.string()).optional(), expectedValue:z.any()}).strict()}).strict()])}).strict();
export const selfApplicationDeploymentConfiguration: z.ZodType<SelfApplicationDeploymentConfiguration> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), selfApplication:z.string().uuid()}).strict();
export const miroirMenuItem: z.ZodType<MiroirMenuItem> = z.object({label:z.string(), section:z.lazy(() =>applicationSection), selfApplication:z.string(), reportUuid:z.string(), instanceUuid:z.string().optional(), icon:z.string()}).strict();
export const menuItemArray: z.ZodType<MenuItemArray> = z.array(z.lazy(() =>miroirMenuItem));
export const sectionOfMenu: z.ZodType<SectionOfMenu> = z.object({title:z.string(), label:z.string(), items:z.lazy(() =>menuItemArray)}).strict();
export const simpleMenu: z.ZodType<SimpleMenu> = z.object({menuType:z.literal("simpleMenu"), definition:z.lazy(() =>menuItemArray)}).strict();
export const complexMenu: z.ZodType<ComplexMenu> = z.object({menuType:z.literal("complexMenu"), definition:z.array(z.lazy(() =>sectionOfMenu))}).strict();
export const menuDefinition: z.ZodType<MenuDefinition> = z.union([z.lazy(() =>simpleMenu), z.lazy(() =>complexMenu)]);
export const menu: z.ZodType<Menu> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), definition:z.lazy(() =>menuDefinition)}).strict();
export const objectInstanceReportSection: z.ZodType<ObjectInstanceReportSection> = z.object({type:z.literal("objectInstanceReportSection"), combinerTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), definition:z.object({label:z.string().optional(), parentUuid:z.string(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>extractorTemplateReturningObject).optional()}).strict()}).strict();
export const objectListReportSection: z.ZodType<ObjectListReportSection> = z.object({type:z.literal("objectListReportSection"), definition:z.object({label:z.string().optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>extractorTemplateReturningObject).optional(), sortByAttribute:z.string().optional()}).strict()}).strict();
export const gridReportSection: z.ZodType<GridReportSection> = z.object({type:z.literal("grid"), combinerTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), selectData:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), definition:z.array(z.array(z.lazy(() =>reportSection)))}).strict();
export const listReportSection: z.ZodType<ListReportSection> = z.object({type:z.literal("list"), combinerTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), selectData:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), definition:z.array(z.union([z.lazy(() =>objectInstanceReportSection), z.lazy(() =>objectListReportSection)]))}).strict();
export const reportSection: z.ZodType<ReportSection> = z.union([z.lazy(() =>gridReportSection), z.lazy(() =>listReportSection), z.lazy(() =>objectListReportSection), z.lazy(() =>objectInstanceReportSection)]);
export const rootReport: z.ZodType<RootReport> = z.object({reportParametersToFetchQueryParametersTransformer:z.record(z.string(),z.string()).optional(), reportParameters:z.record(z.string(),z.string()).optional(), extractorTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), extractors:z.lazy(() =>extractorOrCombinerRecord).optional(), combiners:z.lazy(() =>extractorOrCombinerRecord).optional(), combinerTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), section:z.lazy(() =>reportSection)}).strict();
export const jzodObjectOrReference: z.ZodType<JzodObjectOrReference> = z.union([z.lazy(() =>jzodReference), z.lazy(() =>jzodObject)]);
export const jzodSchema: z.ZodType<JzodSchema> = z.object({uuid:z.string().uuid(), parentName:z.string(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), defaultLabel:z.string().optional(), description:z.string().optional(), definition:z.lazy(() =>jzodObjectOrReference).optional()}).strict();
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), name:z.string(), defaultLabel:z.string(), type:z.enum(["list","grid"]).optional(), selfApplication:z.string().uuid().optional(), definition:z.object({reportParametersToFetchQueryParametersTransformer:z.record(z.string(),z.string()).optional(), reportParameters:z.record(z.string(),z.string()).optional(), extractorTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), extractors:z.lazy(() =>extractorOrCombinerRecord).optional(), combiners:z.lazy(() =>extractorOrCombinerRecord).optional(), combinerTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), section:z.lazy(() =>reportSection)}).strict()}).strict();
export const metaModel: z.ZodType<MetaModel> = z.object({applicationVersions:z.array(z.lazy(() =>applicationVersion)), applicationVersionCrossEntityDefinition:z.array(z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), applicationVersion:z.string().uuid(), entityDefinition:z.string().uuid()}).strict()), entities:z.array(z.lazy(() =>entity)), entityDefinitions:z.array(z.lazy(() =>entityDefinition)), jzodSchemas:z.array(z.lazy(() =>jzodSchema)), menus:z.array(z.lazy(() =>menu)), reports:z.array(z.lazy(() =>report))}).strict();
export const _________________________________configuration_and_bundles_________________________________: z.ZodType<_________________________________configuration_and_bundles_________________________________> = z.never();
export const indexedDbStoreSectionConfiguration: z.ZodType<IndexedDbStoreSectionConfiguration> = z.object({emulatedServerType:z.literal("indexedDb"), indexedDbName:z.string()}).strict();
export const filesystemDbStoreSectionConfiguration: z.ZodType<FilesystemDbStoreSectionConfiguration> = z.object({emulatedServerType:z.literal("filesystem"), directory:z.string()}).strict();
export const sqlDbStoreSectionConfiguration: z.ZodType<SqlDbStoreSectionConfiguration> = z.object({emulatedServerType:z.literal("sql"), connectionString:z.string(), schema:z.string()}).strict();
export const storeSectionConfiguration: z.ZodType<StoreSectionConfiguration> = z.union([z.lazy(() =>indexedDbStoreSectionConfiguration), z.lazy(() =>filesystemDbStoreSectionConfiguration), z.lazy(() =>sqlDbStoreSectionConfiguration)]);
export const storeUnitConfiguration: z.ZodType<StoreUnitConfiguration> = z.object({admin:z.lazy(() =>storeSectionConfiguration), model:z.lazy(() =>storeSectionConfiguration), data:z.lazy(() =>storeSectionConfiguration)}).strict();
export const deploymentStorageConfig: z.ZodType<DeploymentStorageConfig> = z.record(z.string(),z.lazy(() =>storeUnitConfiguration));
export const serverConfigForClientConfig: z.ZodType<ServerConfigForClientConfig> = z.object({rootApiUrl:z.string(), dataflowConfiguration:z.any(), storeSectionConfiguration:z.record(z.string(),z.lazy(() =>storeUnitConfiguration))}).strict();
export const miroirConfigForMswClient: z.ZodType<MiroirConfigForMswClient> = z.object({emulateServer:z.literal(true), rootApiUrl:z.string(), deploymentStorageConfig:z.lazy(() =>deploymentStorageConfig)}).strict();
export const miroirConfigForRestClient: z.ZodType<MiroirConfigForRestClient> = z.object({emulateServer:z.literal(false), serverConfig:z.lazy(() =>serverConfigForClientConfig)}).strict();
export const miroirConfigClient: z.ZodType<MiroirConfigClient> = z.object({miroirConfigType:z.literal("client"), client:z.union([z.lazy(() =>miroirConfigForMswClient), z.lazy(() =>miroirConfigForRestClient)])}).strict();
export const miroirConfigServer: z.ZodType<MiroirConfigServer> = z.object({miroirConfigType:z.literal("server"), server:z.object({rootApiUrl:z.string()}).strict()}).strict();
export const miroirConfig: z.ZodType<MiroirConfig> = z.union([z.literal("miroirConfigClient"), z.literal("miroirConfigServer")]);
export const commit: z.ZodType<Commit> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), date:z.date(), selfApplication:z.string().uuid().optional(), name:z.string(), preceding:z.string().uuid().optional(), branch:z.string().uuid().optional(), author:z.string().uuid().optional(), description:z.string().optional(), actions:z.array(z.object({endpoint:z.string().uuid(), actionArguments:z.lazy(() =>modelAction)}).strict()), patches:z.array(z.any())}).strict();
export const miroirAllFundamentalTypesUnion: z.ZodType<MiroirAllFundamentalTypesUnion> = z.union([z.lazy(() =>applicationSection), z.lazy(() =>entityInstance), z.lazy(() =>entityInstanceCollection), z.lazy(() =>instanceAction)]);
export const ______________________________________________queries_____________________________________________: z.ZodType<______________________________________________queries_____________________________________________> = z.never();
export const queryFailed: z.ZodType<QueryFailed> = z.object({queryFailure:z.enum(["FailedTransformer_objectEntries","FailedExtractor","QueryNotExecutable","DomainStateNotLoaded","IncorrectParameters","DeploymentNotFound","ApplicationSectionNotFound","EntityNotFound","InstanceNotFound","ReferenceNotFound","ReferenceFoundButUndefined","ReferenceFoundButAttributeUndefinedOnFoundObject"]), query:z.string().optional(), failureOrigin:z.array(z.string()).optional(), failureMessage:z.string().optional(), queryReference:z.string().optional(), queryParameters:z.string().optional(), queryContext:z.string().optional(), deploymentUuid:z.string().optional(), errorStack:z.array(z.string()).optional(), innerError:z.any().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().optional(), instanceUuid:z.string().optional()}).strict();
export const extractorTemplateRoot: z.ZodType<ExtractorTemplateRoot> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference)}).strict();
export const extractorTemplateCombinerForObjectByRelation: z.ZodType<ExtractorTemplateCombinerForObjectByRelation> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference), extractorTemplateType:z.literal("combinerForObjectByRelation"), objectReference:z.lazy(() =>transformerForRuntime_InnerReference), AttributeOfObjectToCompareToReferenceUuid:z.string()}).strict();
export const extractorTemplateExtractorForObjectByDirectReference: z.ZodType<ExtractorTemplateExtractorForObjectByDirectReference> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference), extractorTemplateType:z.literal("extractorForObjectByDirectReference"), instanceUuid:z.lazy(() =>transformer_InnerReference)}).strict();
export const extractorTemplateReturningObject: z.ZodType<ExtractorTemplateReturningObject> = z.union([z.lazy(() =>extractorTemplateCombinerForObjectByRelation), z.lazy(() =>extractorTemplateExtractorForObjectByDirectReference)]);
export const extractorTemplateForObjectListByEntity: z.ZodType<ExtractorTemplateForObjectListByEntity> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference), extractorTemplateType:z.literal("extractorTemplateForObjectListByEntity"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), filter:z.object({attributeName:z.string(), value:z.lazy(() =>transformer_constantString)}).strict().optional()}).strict();
export const extractorTemplateByRelationReturningObjectList: z.ZodType<ExtractorTemplateByRelationReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference), extractorTemplateType:z.literal("combinerByRelationReturningObjectList"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), objectReference:z.lazy(() =>transformerForRuntime_InnerReference), objectReferenceAttribute:z.string().optional(), AttributeOfListObjectToCompareToReferenceUuid:z.string()}).strict();
export const extractorTemplateByManyToManyRelationReturningObjectList: z.ZodType<ExtractorTemplateByManyToManyRelationReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.lazy(() =>transformer_InnerReference), extractorTemplateType:z.literal("combinerByManyToManyRelationReturningObjectList"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), objectListReference:z.lazy(() =>transformer_contextReference), objectListReferenceAttribute:z.string().optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.string().optional()}).strict();
export const extractorTemplateReturningObjectList: z.ZodType<ExtractorTemplateReturningObjectList> = z.union([z.lazy(() =>extractorTemplateForObjectListByEntity), z.lazy(() =>extractorTemplateByRelationReturningObjectList), z.lazy(() =>extractorTemplateByManyToManyRelationReturningObjectList)]);
export const extractorTemplateReturningObjectOrObjectList: z.ZodType<ExtractorTemplateReturningObjectOrObjectList> = z.union([z.lazy(() =>extractorTemplateReturningObject), z.lazy(() =>extractorTemplateReturningObjectList)]);
export const extractorTemplateByExtractorCombiner: z.ZodType<ExtractorTemplateByExtractorCombiner> = z.object({extractorTemplateType:z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), rootExtractorOrReference:z.union([z.lazy(() =>extractorOrCombinerTemplate), z.string()]), subQueryTemplate:z.object({query:z.lazy(() =>extractorOrCombinerTemplate), rootQueryObjectTransformer:z.lazy(() =>recordOfTransformers)}).strict()}).strict();
export const extractorTemplateByExtractorWrapperReturningObject: z.ZodType<ExtractorTemplateByExtractorWrapperReturningObject> = z.object({extractorTemplateType:z.literal("extractorTemplateByExtractorWrapperReturningObject"), definition:z.record(z.string(),z.lazy(() =>transformer_contextOrParameterReference))}).strict();
export const extractorTemplateByExtractorWrapperReturningList: z.ZodType<ExtractorTemplateByExtractorWrapperReturningList> = z.object({extractorTemplateType:z.literal("extractorTemplateByExtractorWrapperReturningList"), definition:z.array(z.lazy(() =>transformer_contextOrParameterReference))}).strict();
export const extractorTemplateByExtractorWrapper: z.ZodType<ExtractorTemplateByExtractorWrapper> = z.union([z.lazy(() =>extractorTemplateByExtractorWrapperReturningObject), z.lazy(() =>extractorTemplateByExtractorWrapperReturningList)]);
export const extractorOrCombinerTemplate: z.ZodType<ExtractorOrCombinerTemplate> = z.union([z.lazy(() =>extractorTemplateByExtractorWrapper), z.lazy(() =>extractorTemplateExtractorForObjectByDirectReference), z.lazy(() =>extractorTemplateReturningObjectList), z.lazy(() =>extractorTemplateCombinerForObjectByRelation), z.lazy(() =>extractorTemplateByRelationReturningObjectList), z.lazy(() =>extractorTemplateByManyToManyRelationReturningObjectList), z.lazy(() =>extractorTemplateByExtractorCombiner), z.object({extractorTemplateType:z.literal("literal"), definition:z.string()}).strict()]);
export const extractorOrCombinerTemplateRecord: z.ZodType<ExtractorOrCombinerTemplateRecord> = z.record(z.string(),z.lazy(() =>extractorOrCombinerTemplate));
export const extractorOrCombinerRoot: z.ZodType<ExtractorOrCombinerRoot> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict();
export const extractorOrCombinerContextReference: z.ZodType<ExtractorOrCombinerContextReference> = z.object({extractorOrCombinerType:z.literal("extractorOrCombinerContextReference"), extractorOrCombinerContextReference:z.string()}).strict();
export const combinerForObjectByRelation: z.ZodType<CombinerForObjectByRelation> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), extractorOrCombinerType:z.literal("combinerForObjectByRelation"), objectReference:z.string(), AttributeOfObjectToCompareToReferenceUuid:z.string()}).strict();
export const extractorForObjectByDirectReference: z.ZodType<ExtractorForObjectByDirectReference> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), extractorOrCombinerType:z.literal("extractorForObjectByDirectReference"), instanceUuid:z.string().uuid()}).strict();
export const extractorOrCombinerReturningObject: z.ZodType<ExtractorOrCombinerReturningObject> = z.union([z.lazy(() =>extractorForObjectByDirectReference), z.lazy(() =>combinerForObjectByRelation)]);
export const extractorByEntityReturningObjectList: z.ZodType<ExtractorByEntityReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), extractorOrCombinerType:z.literal("extractorByEntityReturningObjectList"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), filter:z.object({attributeName:z.string(), value:z.any()}).strict().optional()}).strict();
export const extractor: z.ZodType<Extractor> = z.union([z.lazy(() =>extractorForObjectByDirectReference), z.lazy(() =>extractorByEntityReturningObjectList)]);
export const combinerByRelationReturningObjectList: z.ZodType<CombinerByRelationReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), extractorOrCombinerType:z.literal("combinerByRelationReturningObjectList"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), objectReference:z.string(), objectReferenceAttribute:z.string().optional(), AttributeOfListObjectToCompareToReferenceUuid:z.string()}).strict();
export const combinerByManyToManyRelationReturningObjectList: z.ZodType<CombinerByManyToManyRelationReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), extractorOrCombinerType:z.literal("combinerByManyToManyRelationReturningObjectList"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), objectListReference:z.string(), objectListReferenceAttribute:z.string().optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.string().optional()}).strict();
export const extractorOrCombinerReturningObjectList: z.ZodType<ExtractorOrCombinerReturningObjectList> = z.union([z.lazy(() =>extractorByEntityReturningObjectList), z.lazy(() =>combinerByRelationReturningObjectList), z.lazy(() =>combinerByManyToManyRelationReturningObjectList)]);
export const extractorOrCombinerReturningObjectOrObjectList: z.ZodType<ExtractorOrCombinerReturningObjectOrObjectList> = z.union([z.lazy(() =>extractorOrCombinerReturningObject), z.lazy(() =>extractorOrCombinerReturningObjectList)]);
export const extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: z.ZodType<ExtractorCombinerByHeteronomousManyToManyReturningListOfObjectList> = z.object({extractorOrCombinerType:z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), orderBy:z.object({attributeName:z.string(), direction:z.enum(["ASC","DESC"]).optional()}).strict().optional(), rootExtractorOrReference:z.union([z.lazy(() =>extractor), z.string()]), subQueryTemplate:z.object({query:z.lazy(() =>extractorOrCombinerTemplate), rootQueryObjectTransformer:z.lazy(() =>recordOfTransformers)}).strict()}).strict();
export const extractorWrapperReturningObject: z.ZodType<ExtractorWrapperReturningObject> = z.object({extractorOrCombinerType:z.literal("extractorWrapperReturningObject"), definition:z.record(z.string(),z.union([z.lazy(() =>extractorOrCombinerContextReference), z.lazy(() =>extractorOrCombiner)]))}).strict();
export const extractorWrapperReturningList: z.ZodType<ExtractorWrapperReturningList> = z.object({extractorOrCombinerType:z.literal("extractorWrapperReturningList"), definition:z.array(z.union([z.lazy(() =>extractorOrCombinerContextReference), z.lazy(() =>extractorOrCombiner)]))}).strict();
export const extractorWrapper: z.ZodType<ExtractorWrapper> = z.union([z.lazy(() =>extractorWrapperReturningObject), z.lazy(() =>extractorWrapperReturningList)]);
export const extractorOrCombiner: z.ZodType<ExtractorOrCombiner> = z.union([z.lazy(() =>extractorOrCombinerContextReference), z.lazy(() =>extractorOrCombinerReturningObject), z.lazy(() =>extractorOrCombinerReturningObjectList), z.lazy(() =>extractorWrapper), z.lazy(() =>extractorCombinerByHeteronomousManyToManyReturningListOfObjectList), z.object({extractorOrCombinerType:z.literal("literal"), definition:z.string()}).strict()]);
export const extractorOrCombinerRecord: z.ZodType<ExtractorOrCombinerRecord> = z.record(z.string(),z.lazy(() =>extractorOrCombiner));
export const domainElementVoid: z.ZodType<DomainElementVoid> = z.object({elementType:z.literal("void"), elementValue:z.void()}).strict();
export const domainElementAny: z.ZodType<DomainElementAny> = z.object({elementType:z.literal("any"), elementValue:z.any()}).strict();
export const domainElementFailed: z.ZodType<DomainElementFailed> = z.object({elementType:z.literal("failure"), elementValue:z.lazy(() =>queryFailed)}).strict();
export const domainElementObject: z.ZodType<DomainElementObject> = z.object({elementType:z.literal("object"), elementValue:z.record(z.string(),z.lazy(() =>domainElement))}).strict();
export const domainElementArray: z.ZodType<DomainElementArray> = z.object({elementType:z.literal("array"), elementValue:z.array(z.lazy(() =>domainElement))}).strict();
export const domainElementString: z.ZodType<DomainElementString> = z.object({elementType:z.literal("string"), elementValue:z.string()}).strict();
export const domainElementNumber: z.ZodType<DomainElementNumber> = z.object({elementType:z.literal("number"), elementValue:z.number()}).strict();
export const domainElementObjectOrFailed: z.ZodType<DomainElementObjectOrFailed> = z.union([z.lazy(() =>domainElementObject), z.lazy(() =>domainElementFailed)]);
export const domainElementInstanceUuidIndex: z.ZodType<DomainElementInstanceUuidIndex> = z.object({elementType:z.literal("instanceUuidIndex"), elementValue:z.lazy(() =>entityInstancesUuidIndex)}).strict();
export const domainElementInstanceUuidIndexOrFailed: z.ZodType<DomainElementInstanceUuidIndexOrFailed> = z.union([z.lazy(() =>domainElementInstanceUuidIndex), z.lazy(() =>domainElementFailed)]);
export const domainElementEntityInstance: z.ZodType<DomainElementEntityInstance> = z.object({elementType:z.literal("instance"), elementValue:z.lazy(() =>entityInstance)}).strict();
export const domainElementEntityInstanceOrFailed: z.ZodType<DomainElementEntityInstanceOrFailed> = z.union([z.lazy(() =>domainElementEntityInstance), z.lazy(() =>domainElementFailed)]);
export const domainElementEntityInstanceCollection: z.ZodType<DomainElementEntityInstanceCollection> = z.object({elementType:z.literal("entityInstanceCollection"), elementValue:z.lazy(() =>entityInstanceCollection)}).strict();
export const domainElementEntityInstanceCollectionOrFailed: z.ZodType<DomainElementEntityInstanceCollectionOrFailed> = z.union([z.lazy(() =>domainElementEntityInstanceCollection), z.lazy(() =>domainElementFailed)]);
export const domainElementInstanceArray: z.ZodType<DomainElementInstanceArray> = z.object({elementType:z.literal("instanceArray"), elementValue:z.array(z.lazy(() =>entityInstance))}).strict();
export const domainElementInstanceArrayOrFailed: z.ZodType<DomainElementInstanceArrayOrFailed> = z.union([z.lazy(() =>domainElementInstanceArray), z.lazy(() =>domainElementFailed)]);
export const domainElementInstanceUuid: z.ZodType<DomainElementInstanceUuid> = z.object({elementType:z.literal("instanceUuid"), elementValue:z.lazy(() =>entityInstanceUuid)}).strict();
export const domainElementType: z.ZodType<DomainElementType> = z.enum(["any","object","instanceUuidIndex","entityInstanceCollection","instanceArray","instance","instanceUuid","instanceUuidIndexUuidIndex","void"]);
export const domainElementSuccess: z.ZodType<DomainElementSuccess> = z.union([z.lazy(() =>domainElementVoid), z.lazy(() =>domainElementAny), z.lazy(() =>domainElementObject), z.lazy(() =>domainElementInstanceUuidIndex), z.lazy(() =>domainElementEntityInstanceCollection), z.lazy(() =>domainElementInstanceArray), z.lazy(() =>domainElementEntityInstance), z.lazy(() =>domainElementInstanceUuid), z.lazy(() =>domainElementString), z.lazy(() =>domainElementNumber), z.lazy(() =>domainElementArray)]);
export const domainElement: z.ZodType<DomainElement> = z.union([z.lazy(() =>domainElementSuccess), z.lazy(() =>domainElementFailed)]);
export const localCacheExtractor: z.ZodType<LocalCacheExtractor> = z.object({queryType:z.literal("localCacheEntityInstancesExtractor"), definition:z.object({deploymentUuid:z.string().uuid().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().uuid().optional(), instanceUuid:z.string().uuid().optional()}).strict()}).strict();
export const shippingBox: z.ZodType<ShippingBox> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict();
export const boxedExtractorOrCombinerReturningObject: z.ZodType<BoxedExtractorOrCombinerReturningObject> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("boxedExtractorOrCombinerReturningObject"), select:z.lazy(() =>extractorOrCombinerReturningObject)}).strict();
export const boxedExtractorOrCombinerReturningObjectList: z.ZodType<BoxedExtractorOrCombinerReturningObjectList> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("boxedExtractorOrCombinerReturningObjectList"), select:z.lazy(() =>extractorOrCombinerReturningObjectList)}).strict();
export const boxedExtractorOrCombinerReturningObjectOrObjectList: z.ZodType<BoxedExtractorOrCombinerReturningObjectOrObjectList> = z.union([z.lazy(() =>boxedExtractorOrCombinerReturningObject), z.lazy(() =>boxedExtractorOrCombinerReturningObjectList)]);
export const boxedQueryWithExtractorCombinerTransformer: z.ZodType<BoxedQueryWithExtractorCombinerTransformer> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("boxedQueryWithExtractorCombinerTransformer"), runAsSql:z.boolean().optional(), extractors:z.lazy(() =>extractorOrCombinerRecord).optional(), combiners:z.lazy(() =>extractorOrCombinerRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>extendedTransformerForRuntime)).optional()}).strict();
export const boxedExtractorTemplateReturningObject: z.ZodType<BoxedExtractorTemplateReturningObject> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("boxedExtractorTemplateReturningObject"), select:z.lazy(() =>extractorTemplateReturningObject)}).strict();
export const boxedExtractorTemplateReturningObjectList: z.ZodType<BoxedExtractorTemplateReturningObjectList> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("boxedExtractorTemplateReturningObjectList"), select:z.lazy(() =>extractorTemplateReturningObjectList)}).strict();
export const boxedExtractorTemplateReturningObjectOrObjectList: z.ZodType<BoxedExtractorTemplateReturningObjectOrObjectList> = z.union([z.lazy(() =>boxedExtractorTemplateReturningObject), z.lazy(() =>boxedExtractorTemplateReturningObjectList)]);
export const boxedQueryTemplateWithExtractorCombinerTransformer: z.ZodType<BoxedQueryTemplateWithExtractorCombinerTransformer> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("boxedQueryTemplateWithExtractorCombinerTransformer"), runAsSql:z.boolean().optional(), extractorTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), combinerTemplates:z.lazy(() =>extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>extendedTransformerForRuntime)).optional()}).strict();
export const queryByEntityUuidGetEntityDefinition: z.ZodType<QueryByEntityUuidGetEntityDefinition> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("getEntityDefinition"), entityUuid:z.string().uuid()}).strict();
export const queryByTemplateGetParamJzodSchema: z.ZodType<QueryByTemplateGetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("queryByTemplateGetParamJzodSchema"), fetchParams:z.lazy(() =>boxedQueryTemplateWithExtractorCombinerTransformer)}).strict();
export const queryByQuery2GetParamJzodSchema: z.ZodType<QueryByQuery2GetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("queryByTemplateGetParamJzodSchema"), fetchParams:z.lazy(() =>boxedQueryWithExtractorCombinerTransformer)}).strict();
export const queryByQueryTemplateGetParamJzodSchema: z.ZodType<QueryByQueryTemplateGetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("getQueryJzodSchema"), select:z.lazy(() =>extractorOrCombinerTemplate)}).strict();
export const queryByQueryGetParamJzodSchema: z.ZodType<QueryByQueryGetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any()), queryType:z.literal("getQueryJzodSchema"), select:z.lazy(() =>extractorOrCombiner)}).strict();
export const domainModelQueryTemplateJzodSchemaParams: z.ZodType<DomainModelQueryTemplateJzodSchemaParams> = z.union([z.lazy(() =>queryByEntityUuidGetEntityDefinition), z.lazy(() =>queryByTemplateGetParamJzodSchema), z.lazy(() =>queryByQueryTemplateGetParamJzodSchema)]);
export const queryJzodSchemaParams: z.ZodType<QueryJzodSchemaParams> = z.union([z.lazy(() =>queryByEntityUuidGetEntityDefinition), z.lazy(() =>queryByQuery2GetParamJzodSchema), z.lazy(() =>queryByQueryGetParamJzodSchema)]);
export const miroirQueryTemplate: z.ZodType<MiroirQueryTemplate> = z.union([z.lazy(() =>boxedExtractorTemplateReturningObjectOrObjectList), z.lazy(() =>boxedQueryTemplateWithExtractorCombinerTransformer), z.lazy(() =>localCacheExtractor), z.lazy(() =>queryByEntityUuidGetEntityDefinition), z.lazy(() =>queryByTemplateGetParamJzodSchema), z.lazy(() =>queryByQueryTemplateGetParamJzodSchema)]);
export const miroirQuery: z.ZodType<MiroirQuery> = z.union([z.lazy(() =>boxedExtractorOrCombinerReturningObjectOrObjectList), z.lazy(() =>boxedQueryWithExtractorCombinerTransformer), z.lazy(() =>localCacheExtractor), z.lazy(() =>queryByEntityUuidGetEntityDefinition), z.lazy(() =>queryByQuery2GetParamJzodSchema), z.lazy(() =>queryByQueryGetParamJzodSchema)]);
export const ______________________________________________actions_____________________________________________: z.ZodType<______________________________________________actions_____________________________________________> = z.never();
export const actionError: z.ZodType<ActionError> = z.object({status:z.literal("error"), errorType:z.union([z.enum(["FailedToCreateStore","FailedToDeployModule"]), z.literal("FailedToDeleteStore"), z.literal("FailedToResetAndInitMiroirAndApplicationDatabase"), z.literal("FailedToOpenStore"), z.literal("FailedToCloseStore"), z.literal("FailedToCreateInstance"), z.literal("FailedToDeleteInstance"), z.literal("FailedToDeleteInstanceWithCascade"), z.literal("FailedToUpdateInstance"), z.literal("FailedToLoadNewInstancesInLocalCache"), z.literal("FailedToGetInstance"), z.literal("FailedToGetInstances"), z.literal("FailedToResolveTemplate")]), errorMessage:z.string().optional(), errorStack:z.array(z.string().optional()).optional(), innerError:z.lazy(() =>actionError).optional()}).strict();
export const actionVoidSuccess: z.ZodType<ActionVoidSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElementVoid)}).strict();
export const actionVoidReturnType: z.ZodType<ActionVoidReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionVoidSuccess)]);
export const actionEntityInstanceSuccess: z.ZodType<ActionEntityInstanceSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElementEntityInstance)}).strict();
export const actionEntityInstanceReturnType: z.ZodType<ActionEntityInstanceReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionEntityInstanceSuccess)]);
export const actionEntityInstanceCollectionSuccess: z.ZodType<ActionEntityInstanceCollectionSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElementEntityInstanceCollection)}).strict();
export const actionEntityInstanceCollectionReturnType: z.ZodType<ActionEntityInstanceCollectionReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionEntityInstanceCollectionSuccess)]);
export const actionSuccess: z.ZodType<ActionSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElement)}).strict();
export const actionReturnType: z.ZodType<ActionReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionSuccess)]);
export const modelActionInitModelParams: z.ZodType<ModelActionInitModelParams> = z.object({metaModel:z.lazy(() =>metaModel), dataStoreType:z.lazy(() =>dataStoreType), selfApplication:z.lazy(() =>selfApplication), applicationModelBranch:z.lazy(() =>entityInstance), applicationVersion:z.lazy(() =>entityInstance)}).strict();
export const modelActionCommit: z.ZodType<ModelActionCommit> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("commit"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionRollback: z.ZodType<ModelActionRollback> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("rollback"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionInitModel: z.ZodType<ModelActionInitModel> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("initModel"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid(), params:z.object({metaModel:z.lazy(() =>metaModel), dataStoreType:z.lazy(() =>dataStoreType), selfApplication:z.lazy(() =>selfApplication), applicationModelBranch:z.lazy(() =>entityInstance), applicationVersion:z.lazy(() =>entityInstance)}).strict()}).strict();
export const modelActionResetModel: z.ZodType<ModelActionResetModel> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetModel"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionResetData: z.ZodType<ModelActionResetData> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetData"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionAlterEntityAttribute: z.ZodType<ModelActionAlterEntityAttribute> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("alterEntityAttribute"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string(), entityUuid:z.string(), entityDefinitionUuid:z.string(), addColumns:z.array(z.object({name:z.string(), definition:z.lazy(() =>jzodElement)}).strict()).optional(), removeColumns:z.array(z.string()).optional(), update:z.lazy(() =>jzodElement).optional()}).strict();
export const modelActionCreateEntity: z.ZodType<ModelActionCreateEntity> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("createEntity"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entities:z.array(z.object({entity:z.lazy(() =>entity), entityDefinition:z.lazy(() =>entityDefinition)}).strict())}).strict();
export const modelActionDropEntity: z.ZodType<ModelActionDropEntity> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("dropEntity"), actionLabel:z.string().optional(), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), entityUuid:z.string(), entityDefinitionUuid:z.string()}).strict();
export const modelActionRenameEntity: z.ZodType<ModelActionRenameEntity> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("renameEntity"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string().optional(), entityUuid:z.string(), entityDefinitionUuid:z.string(), targetValue:z.string()}).strict();
export const modelAction: z.ZodType<ModelAction> = z.union([z.object({actionType:z.literal("modelAction"), actionName:z.literal("initModel"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid(), params:z.object({metaModel:z.lazy(() =>metaModel), dataStoreType:z.lazy(() =>dataStoreType), selfApplication:z.lazy(() =>selfApplication), applicationModelBranch:z.lazy(() =>entityInstance), applicationVersion:z.lazy(() =>entityInstance)}).strict()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("commit"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("rollback"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("remoteLocalCacheRollback"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetModel"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetData"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("alterEntityAttribute"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string(), entityUuid:z.string(), entityDefinitionUuid:z.string(), addColumns:z.array(z.object({name:z.string(), definition:z.lazy(() =>jzodElement)}).strict()).optional(), removeColumns:z.array(z.string()).optional(), update:z.lazy(() =>jzodElement).optional()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("renameEntity"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string().optional(), entityUuid:z.string(), entityDefinitionUuid:z.string(), targetValue:z.string()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("createEntity"), actionLabel:z.string().optional(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entities:z.array(z.object({entity:z.lazy(() =>entity), entityDefinition:z.lazy(() =>entityDefinition)}).strict())}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("dropEntity"), actionLabel:z.string().optional(), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), entityUuid:z.string(), entityDefinitionUuid:z.string()}).strict()]);
export const testAction_runTestCompositeAction: z.ZodType<TestAction_runTestCompositeAction> = z.object({actionType:z.literal("testAction"), actionName:z.literal("runTestCompositeAction"), endpoint:z.literal("a9139e2d-a714-4c9c-bdee-c104488e2eaa"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), testToRun:z.lazy(() =>testCompositeAction)}).strict();
export const testAction_runTestCase: z.ZodType<TestAction_runTestCase> = z.object({actionType:z.literal("testAction"), actionName:z.literal("runTestCase"), endpoint:z.literal("a9139e2d-a714-4c9c-bdee-c104488e2eaa"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), testToRun:z.lazy(() =>testAssertion)}).strict();
export const instanceCUDAction: z.ZodType<InstanceCUDAction> = z.union([z.object({actionType:z.literal("instanceAction"), actionName:z.literal("createInstance"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("deleteInstance"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("updateInstance"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict()]);
export const instanceAction: z.ZodType<InstanceAction> = z.union([z.object({actionType:z.literal("instanceAction"), actionName:z.literal("createInstance"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("deleteInstance"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("deleteInstanceWithCascade"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("updateInstance"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("loadNewInstancesInLocalCache"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("getInstance"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), parentUuid:z.string().uuid(), uuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("getInstances"), actionLabel:z.string().optional(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), parentUuid:z.string().uuid()}).strict()]);
export const undoRedoAction: z.ZodType<UndoRedoAction> = z.union([z.object({actionType:z.literal("undoRedoAction"), actionName:z.literal("undo"), actionLabel:z.string().optional(), endpoint:z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("undoRedoAction"), actionName:z.literal("redo"), actionLabel:z.string().optional(), endpoint:z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), deploymentUuid:z.string().uuid()}).strict()]);
export const transactionalInstanceAction: z.ZodType<TransactionalInstanceAction> = z.object({actionType:z.literal("transactionalInstanceAction"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid().optional(), instanceAction:z.lazy(() =>instanceCUDAction)}).strict();
export const localCacheAction: z.ZodType<LocalCacheAction> = z.union([z.lazy(() =>undoRedoAction), z.lazy(() =>modelAction), z.lazy(() =>instanceAction), z.lazy(() =>transactionalInstanceAction)]);
export const storeManagementAction: z.ZodType<StoreManagementAction> = z.union([z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("createStore"), actionLabel:z.string().optional(), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), configuration:z.lazy(() =>storeUnitConfiguration), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("deleteStore"), actionLabel:z.string().optional(), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deploymentUuid:z.string().uuid(), configuration:z.lazy(() =>storeUnitConfiguration)}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("resetAndInitApplicationDeployment"), actionLabel:z.string().optional(), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deployments:z.array(z.lazy(() =>deployment)), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("openStore"), actionLabel:z.string().optional(), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), configuration:z.record(z.string(),z.lazy(() =>storeUnitConfiguration)), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("closeStore"), actionLabel:z.string().optional(), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deploymentUuid:z.string().uuid()}).strict()]);
export const persistenceAction: z.ZodType<PersistenceAction> = z.union([z.object({actionType:z.literal("LocalPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), actionLabel:z.string().optional(), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict(), z.object({actionType:z.literal("RestPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), actionLabel:z.string().optional(), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict(), z.lazy(() =>runBoxedExtractorAction), z.lazy(() =>runBoxedQueryAction), z.lazy(() =>runBoxedExtractorOrQueryAction), z.lazy(() =>runBoxedQueryTemplateAction), z.lazy(() =>runBoxedExtractorTemplateAction), z.lazy(() =>runBoxedQueryTemplateOrBoxedExtractorTemplateAction), z.lazy(() =>bundleAction), z.lazy(() =>instanceAction), z.lazy(() =>modelAction), z.lazy(() =>storeManagementAction)]);
export const localPersistenceAction: z.ZodType<LocalPersistenceAction> = z.object({actionType:z.literal("LocalPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), actionLabel:z.string().optional(), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict();
export const restPersistenceAction: z.ZodType<RestPersistenceAction> = z.object({actionType:z.literal("RestPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), actionLabel:z.string().optional(), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict();
export const runBoxedQueryTemplateOrBoxedExtractorTemplateAction: z.ZodType<RunBoxedQueryTemplateOrBoxedExtractorTemplateAction> = z.object({actionType:z.literal("runBoxedQueryTemplateOrBoxedExtractorTemplateAction"), actionName:z.literal("runQuery"), actionLabel:z.string().optional(), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.union([z.lazy(() =>boxedExtractorTemplateReturningObjectOrObjectList), z.lazy(() =>boxedQueryTemplateWithExtractorCombinerTransformer)])}).strict();
export const runBoxedExtractorOrQueryAction: z.ZodType<RunBoxedExtractorOrQueryAction> = z.object({actionType:z.literal("runBoxedExtractorOrQueryAction"), actionName:z.literal("runQuery"), actionLabel:z.string().optional(), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), queryExecutionStrategy:z.enum(["localCacheOrFail","localCacheOrFetch","ServerCache","storage"]).optional(), query:z.union([z.lazy(() =>boxedExtractorOrCombinerReturningObjectOrObjectList), z.lazy(() =>boxedQueryWithExtractorCombinerTransformer)])}).strict();
export const runBoxedQueryTemplateAction: z.ZodType<RunBoxedQueryTemplateAction> = z.object({actionType:z.literal("runBoxedQueryTemplateAction"), actionName:z.literal("runQuery"), actionLabel:z.string().optional(), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.lazy(() =>boxedQueryTemplateWithExtractorCombinerTransformer)}).strict();
export const runBoxedExtractorTemplateAction: z.ZodType<RunBoxedExtractorTemplateAction> = z.object({actionType:z.literal("runBoxedExtractorTemplateAction"), actionName:z.literal("runQuery"), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.lazy(() =>boxedExtractorTemplateReturningObjectOrObjectList)}).strict();
export const runBoxedQueryAction: z.ZodType<RunBoxedQueryAction> = z.object({actionType:z.literal("runBoxedQueryAction"), actionName:z.literal("runQuery"), actionLabel:z.string().optional(), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.lazy(() =>boxedQueryWithExtractorCombinerTransformer)}).strict();
export const runBoxedExtractorAction: z.ZodType<RunBoxedExtractorAction> = z.object({actionType:z.literal("runBoxedExtractorAction"), actionName:z.literal("runQuery"), actionLabel:z.string().optional(), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.lazy(() =>boxedExtractorOrCombinerReturningObjectOrObjectList)}).strict();
export const compositeActionDefinition: z.ZodType<CompositeActionDefinition> = z.array(z.union([z.lazy(() =>domainAction), z.lazy(() =>compositeAction), z.object({actionType:z.literal("compositeRunBoxedQueryTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedQueryTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedExtractorTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedExtractorOrQueryAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), query:z.lazy(() =>runBoxedExtractorOrQueryAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedQueryTemplateOrBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunTestAssertion"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), testAssertion:z.lazy(() =>testAssertion)}).strict()]));
export const compositeAction: z.ZodType<CompositeAction> = z.object({actionType:z.literal("compositeAction"), actionName:z.literal("sequence"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid().optional(), templates:z.record(z.string(),z.any()).optional(), definition:z.array(z.union([z.lazy(() =>domainAction), z.lazy(() =>compositeAction), z.object({actionType:z.literal("compositeRunBoxedQueryTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedQueryTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedExtractorTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedExtractorOrQueryAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), query:z.lazy(() =>runBoxedExtractorOrQueryAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedQueryTemplateOrBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunTestAssertion"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), testAssertion:z.lazy(() =>testAssertion)}).strict()]))}).strict();
export const compositeRunTestAssertion: z.ZodType<CompositeRunTestAssertion> = z.object({actionType:z.literal("compositeRunTestAssertion"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), testAssertion:z.lazy(() =>testAssertion)}).strict();
export const domainAction: z.ZodType<DomainAction> = z.union([z.lazy(() =>undoRedoAction), z.lazy(() =>storeOrBundleAction), z.lazy(() =>modelAction), z.lazy(() =>instanceAction), z.object({actionType:z.literal("transactionalInstanceAction"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid().optional(), instanceAction:z.lazy(() =>instanceCUDAction)}).strict(), z.object({actionType:z.literal("compositeAction"), actionName:z.literal("sequence"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid().optional(), templates:z.record(z.string(),z.any()).optional(), definition:z.array(z.union([z.lazy(() =>domainAction), z.lazy(() =>compositeAction), z.object({actionType:z.literal("compositeRunBoxedQueryTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedQueryTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedExtractorTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedExtractorOrQueryAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), query:z.lazy(() =>runBoxedExtractorOrQueryAction)}).strict(), z.object({actionType:z.literal("compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>runBoxedQueryTemplateOrBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.literal("compositeRunTestAssertion"), actionLabel:z.string().optional(), nameGivenToResult:z.string(), testAssertion:z.lazy(() =>testAssertion)}).strict()]))}).strict()]);
export const modelActionReplayableAction: z.ZodType<ModelActionReplayableAction> = z.union([z.lazy(() =>modelActionAlterEntityAttribute), z.lazy(() =>modelActionCreateEntity), z.lazy(() =>modelActionDropEntity), z.lazy(() =>modelActionRenameEntity)]);
export const bundleAction: z.ZodType<BundleAction> = z.union([z.object({actionType:z.literal("bundleAction"), actionName:z.literal("createBundle"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("bundleAction"), actionName:z.literal("deleteBundle"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid()}).strict()]);
export const storeOrBundleAction: z.ZodType<StoreOrBundleAction> = z.union([z.lazy(() =>storeManagementAction), z.lazy(() =>bundleAction)]);
export const actionTransformer: z.ZodType<ActionTransformer> = z.object({transformerType:z.literal("actionTransformer")}).strict();
export const dataTransformer: z.ZodType<DataTransformer> = z.object({transformerType:z.literal("dataTransformer")}).strict();
export const getBasicApplicationConfigurationParameters: z.ZodType<GetBasicApplicationConfigurationParameters> = z.union([z.object({emulatedServerType:z.literal("sql"), connectionString:z.string()}).strict(), z.object({emulatedServerType:z.literal("indexedDb"), rootIndexDbName:z.string()}).strict(), z.object({emulatedServerType:z.literal("filesystem"), rootDirectory:z.string()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject_extend> = z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_shippingBox_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_shippingBox_extend> = z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_label_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_label_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_orderBy_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_orderBy_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateRoot_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateRoot_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference)}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_reference_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_reference_extend> = z.object({applyTo:z.union([z.object({referenceType:z.union([z.literal("referencedExtractor"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors), z.lazy(() =>carryOnObject)])}).strict(), z.object({referenceType:z.union([z.literal("referencedTransformer"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_root_extend> = z.object({transformerType:z.union([z.literal("count"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), groupBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject_root_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), transformerType:z.union([z.literal("listReducerToIndexObject"), z.lazy(() =>carryOnObject)]), indexAttribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate_root_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), transformerType:z.union([z.literal("object_fullTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)}).strict()])), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement_root_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), transformerType:z.union([z.literal("listPickElement"), z.lazy(() =>carryOnObject)]), index:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries_root_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), transformerType:z.union([z.literal("objectEntries"), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues_root_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), transformerType:z.union([z.literal("objectValues"), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_root_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_root_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applyTo:z.union([z.object({referenceType:z.union([z.literal("referencedExtractor"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors), z.lazy(() =>carryOnObject)])}).strict(), z.object({referenceType:z.union([z.literal("referencedTransformer"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]), transformerType:z.union([z.literal("unique"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract_extend> = z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_reference_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_reference_extend> = z.object({applyTo:z.union([z.object({referenceType:z.union([z.literal("referencedExtractor"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors), z.lazy(() =>carryOnObject)])}).strict(), z.object({referenceType:z.union([z.literal("referencedTransformer"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer_extend> = z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional(), optional:z.boolean().optional()}).strict().optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("array"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["any","bigint","boolean","never","null","uuid","undefined","unknown","void"]), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["min","max"]), z.lazy(() =>carryOnObject)]), parameter:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("date"), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), validations:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["gt","gte","lt","lte","int","positive","nonpositive","negative","nonnegative","multipleOf","finite","safe"]), z.lazy(() =>carryOnObject)]), parameter:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("number"), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), validations:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["max","min","length","email","url","emoji","uuid","cuid","cuid2","ulid","regex","includes","startsWith","endsWith","datetime","ip"]), z.lazy(() =>carryOnObject)]), parameter:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("string"), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), validations:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("enum"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes> = z.union([z.enum(["any","bigint","boolean","date","never","null","number","string","uuid","undefined","unknown","void"]), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes> = z.union([z.enum(["array","date","enum","function","lazy","literal","intersection","map","number","object","promise","record","schemaReference","set","string","tuple","union"]), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("function"), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({args:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)]), returns:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("lazy"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("literal"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.number(), z.bigint(), z.boolean(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("intersection"), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({left:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement), right:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("map"), z.lazy(() =>carryOnObject)]), definition:z.union([z.tuple([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)]), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject> = z.union([z.lazy(() =>carryOnObject), z.object({extend:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference).optional(), type:z.union([z.literal("object"), z.lazy(() =>carryOnObject)]), nonStrict:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), partial:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), carryOn:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("promise"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("record"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("schemaReference"), z.lazy(() =>carryOnObject)]), context:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)).optional(), z.lazy(() =>carryOnObject)]).optional(), carryOn:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.lazy(() =>carryOnObject), z.object({eager:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), partial:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), relativePath:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), absolutePath:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("set"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("tuple"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("union"), z.lazy(() =>carryOnObject)]), discriminator:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), discriminatorNew:z.union([z.object({discriminatorType:z.union([z.literal("string"), z.lazy(() =>carryOnObject)]), value:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.object({discriminatorType:z.union([z.literal("array"), z.lazy(() =>carryOnObject)]), value:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]).optional(), carryOn:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject).optional(), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType> = z.union([z.enum(["miroir","app"]), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplication: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplication> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), type:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), selfApplication:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), branch:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), previousVersion:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), modelStructureMigration:z.union([z.array(z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), modelCUDMigration:z.union([z.array(z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), selfApplication:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), author:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string(), z.lazy(() =>carryOnObject)]), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultInstanceDetailsReportUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), viewAttributes:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), icon:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), jzodSchema:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection> = z.union([z.literal("model"), z.literal("data"), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid> = z.union([z.string(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex> = z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), adminApplication:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), bundle:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), configuration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration).optional(), model:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject).optional(), data:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplicationDeploymentConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplicationDeploymentConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), selfApplication:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementSuccess: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementSuccess> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementString), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementNumber), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementArray), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("void"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.void(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("any"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementArray> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("array"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuid> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("instanceUuid"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementNumber: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementNumber> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("number"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementString: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementString> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("string"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("failure"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("object"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObjectOrFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObjectOrFailed> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("instanceUuidIndex"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndexOrFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndexOrFailed> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndex), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("entityInstanceCollection"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollectionOrFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollectionOrFailed> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("instanceArray"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArrayOrFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArrayOrFailed> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArray), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("instance"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceOrFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceOrFailed> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstance), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementSuccess), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection> = z.union([z.lazy(() =>carryOnObject), z.object({parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), instances:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string(), z.lazy(() =>carryOnObject)]), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string(), z.lazy(() =>carryOnObject)]), section:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), selfApplication:z.union([z.string(), z.lazy(() =>carryOnObject)]), reportUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), instanceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), icon:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray> = z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu> = z.union([z.lazy(() =>carryOnObject), z.object({title:z.union([z.string(), z.lazy(() =>carryOnObject)]), label:z.union([z.string(), z.lazy(() =>carryOnObject)]), items:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu> = z.union([z.lazy(() =>carryOnObject), z.object({menuType:z.union([z.literal("simpleMenu"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu> = z.union([z.lazy(() =>carryOnObject), z.object({menuType:z.union([z.literal("complexMenu"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("objectInstanceReportSection"), z.lazy(() =>carryOnObject)]), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), fetchedDataReference:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("objectListReportSection"), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), fetchedDataReference:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject).optional(), sortByAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("grid"), z.lazy(() =>carryOnObject)]), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), selectData:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), definition:z.union([z.array(z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection)), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("list"), z.lazy(() =>carryOnObject)]), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), selectData:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), definition:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport> = z.union([z.lazy(() =>carryOnObject), z.object({reportParametersToFetchQueryParametersTransformer:z.union([z.record(z.string(),z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), reportParameters:z.union([z.record(z.string(),z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), extractorTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), extractors:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord).optional(), combiners:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord).optional(), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), section:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), type:z.union([z.enum(["list","grid"]).optional(), z.lazy(() =>carryOnObject)]).optional(), selfApplication:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.lazy(() =>carryOnObject), z.object({reportParametersToFetchQueryParametersTransformer:z.union([z.record(z.string(),z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), reportParameters:z.union([z.record(z.string(),z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), extractorTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), extractors:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord).optional(), combiners:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord).optional(), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), section:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer> = z.union([z.object({transformerType:z.union([z.literal("objectTransformer"), z.lazy(() =>carryOnObject)]), attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("recordOfTransformers"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel> = z.union([z.lazy(() =>carryOnObject), z.object({applicationVersions:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion)), z.lazy(() =>carryOnObject)]), applicationVersionCrossEntityDefinition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), applicationVersion:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entityDefinition:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()])), z.lazy(() =>carryOnObject)]), entities:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity)), z.lazy(() =>carryOnObject)]), entityDefinitions:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition)), z.lazy(() =>carryOnObject)]), jzodSchemas:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema)), z.lazy(() =>carryOnObject)]), menus:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu)), z.lazy(() =>carryOnObject)]), reports:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({emulatedServerType:z.union([z.literal("indexedDb"), z.lazy(() =>carryOnObject)]), indexedDbName:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({emulatedServerType:z.union([z.literal("filesystem"), z.lazy(() =>carryOnObject)]), directory:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({emulatedServerType:z.union([z.literal("sql"), z.lazy(() =>carryOnObject)]), connectionString:z.union([z.string(), z.lazy(() =>carryOnObject)]), schema:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({currentApplicationVersion:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({admin:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration), model:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration), data:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction> = z.union([z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("updateInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction> = z.union([z.object({actionType:z.union([z.literal("undoRedoAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("undo"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("undoRedoAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("redo"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction> = z.union([z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("initModel"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), params:z.union([z.lazy(() =>carryOnObject), z.object({metaModel:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel), dataStoreType:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType), selfApplication:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_selfApplication), applicationModelBranch:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance), applicationVersion:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)}).strict()])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("commit"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("rollback"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("remoteLocalCacheRollback"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("resetModel"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("resetData"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("alterEntityAttribute"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entityName:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityDefinitionUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), addColumns:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({name:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()])).optional(), z.lazy(() =>carryOnObject)]).optional(), removeColumns:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), update:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement).optional()}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("renameEntity"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entityName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), entityUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityDefinitionUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), targetValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createEntity"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entities:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({entity:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity), entityDefinition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition)}).strict()])), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("dropEntity"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), entityUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityDefinitionUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction> = z.union([z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteInstanceWithCascade"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("updateInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("loadNewInstancesInLocalCache"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("getInstance"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("getInstances"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction> = z.union([z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createStore"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), configuration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteStore"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), configuration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration)}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("resetAndInitApplicationDeployment"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), deployments:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment)), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("openStore"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), configuration:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration)), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("closeStore"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("transactionalInstanceAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), instanceAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction> = z.union([z.object({actionType:z.union([z.literal("bundleAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createBundle"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("bundleAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteBundle"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction), z.object({actionType:z.union([z.literal("transactionalInstanceAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), instanceAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction)}).strict(), z.object({actionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("sequence"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), templates:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction), z.object({actionType:z.union([z.literal("compositeRunBoxedQueryTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedExtractorOrQueryAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunTestAssertion"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), testAssertion:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion)}).strict(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionDefinition: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionDefinition> = z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction), z.object({actionType:z.union([z.literal("compositeRunBoxedQueryTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedExtractorOrQueryAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunTestAssertion"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), testAssertion:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion)}).strict(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("sequence"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), templates:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction), z.object({actionType:z.union([z.literal("compositeRunBoxedQueryTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedExtractorOrQueryAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunBoxedQueryTemplateOrBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction)}).strict(), z.object({actionType:z.union([z.literal("compositeRunTestAssertion"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), testAssertion:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion)}).strict(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion> = z.union([z.lazy(() =>carryOnObject), z.object({testType:z.union([z.literal("testAssertion"), z.lazy(() =>carryOnObject)]), testLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({resultAccessPath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), resultTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime).optional(), ignoreAttributes:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), expectedValue:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAction_runTestCase: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAction_runTestCase> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("testAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runTestCase"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("a9139e2d-a714-4c9c-bdee-c104488e2eaa"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), testToRun:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_testAssertion)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_shippingBox: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_shippingBox> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObject> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("boxedExtractorOrCombinerReturningObject"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("boxedExtractorOrCombinerReturningObjectList"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("boxedQueryWithExtractorCombinerTransformer"), z.lazy(() =>carryOnObject)]), runAsSql:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), extractors:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord).optional(), combiners:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorByEntityReturningObjectList"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), filter:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), value:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorWrapperReturningList"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorWrapperReturningObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorForObjectByDirectReference"), z.lazy(() =>carryOnObject)]), instanceUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorOrCombinerContextReference"), z.lazy(() =>carryOnObject)]), extractorOrCombinerContextReference:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), rootExtractorOrReference:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor), z.string(), z.lazy(() =>carryOnObject)]), subQueryTemplate:z.union([z.lazy(() =>carryOnObject), z.object({query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate), rootQueryObjectTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList), z.object({extractorOrCombinerType:z.union([z.literal("literal"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectOrObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectOrObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("combinerForObjectByRelation"), z.lazy(() =>carryOnObject)]), objectReference:z.union([z.string(), z.lazy(() =>carryOnObject)]), AttributeOfObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("combinerByRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), objectReference:z.union([z.string(), z.lazy(() =>carryOnObject)]), objectReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfListObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("combinerByManyToManyRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), objectListReference:z.union([z.string(), z.lazy(() =>carryOnObject)]), objectListReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRecord> = z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorOrQueryAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("runBoxedExtractorOrQueryAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), queryExecutionStrategy:z.union([z.enum(["localCacheOrFail","localCacheOrFetch","ServerCache","storage"]).optional(), z.lazy(() =>carryOnObject)]).optional(), query:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateOrBoxedExtractorTemplateAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("runBoxedQueryTemplateOrBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("runBoxedQueryAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryWithExtractorCombinerTransformer)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedQueryTemplateAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("runBoxedQueryTemplateAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("runBoxedExtractorAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorOrCombinerReturningObjectOrObjectList)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_runBoxedExtractorTemplateAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("runBoxedExtractorTemplateAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_label: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_label> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_orderBy: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_orderBy> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constant"), z.lazy(() =>carryOnObject)]), value:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantAsExtractor"), z.lazy(() =>carryOnObject)]), valueType:z.union([z.enum(["string","number","boolean","bigint","object","array"]).optional(), z.lazy(() =>carryOnObject)]).optional(), valueJzodSchema:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement), value:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantArray"), z.lazy(() =>carryOnObject)]), value:z.union([z.array(z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantBoolean"), z.lazy(() =>carryOnObject)]), value:z.union([z.boolean(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantBigint"), z.lazy(() =>carryOnObject)]), value:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantObject"), z.lazy(() =>carryOnObject)]), value:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantNumber"), z.lazy(() =>carryOnObject)]), value:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantString"), z.lazy(() =>carryOnObject)]), value:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantUuid"), z.lazy(() =>carryOnObject)]), value:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constants: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constants> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantListAsExtractor: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantListAsExtractor> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantListAsExtractor"), z.lazy(() =>carryOnObject)]), value:z.union([z.array(z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors> = z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantListAsExtractor);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("newUuid"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("parameterReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("contextReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectDynamicAccess"), z.lazy(() =>carryOnObject)]), objectAccessPath:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate), z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mustacheStringTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateRoot: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateRoot> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed> = z.union([z.lazy(() =>carryOnObject), z.object({queryFailure:z.union([z.enum(["FailedTransformer_objectEntries","FailedExtractor","QueryNotExecutable","DomainStateNotLoaded","IncorrectParameters","DeploymentNotFound","ApplicationSectionNotFound","EntityNotFound","InstanceNotFound","ReferenceNotFound","ReferenceFoundButUndefined","ReferenceFoundButAttributeUndefinedOnFoundObject"]), z.lazy(() =>carryOnObject)]), query:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), failureOrigin:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), failureMessage:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), queryReference:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), queryParameters:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), queryContext:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), errorStack:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), innerError:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), entityUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), instanceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("combinerByManyToManyRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), objectListReference:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference), objectListReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("extractorTemplateForObjectListByEntity"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), filter:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), value:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString)}).strict()]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("combinerByRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), orderBy:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), direction:z.union([z.enum(["ASC","DESC"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]).optional(), objectReference:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), objectReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfListObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("combinerForObjectByRelation"), z.lazy(() =>carryOnObject)]), objectReference:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), AttributeOfObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("extractorForObjectByDirectReference"), z.lazy(() =>carryOnObject)]), instanceUuid:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningObject> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("extractorTemplateByExtractorWrapperReturningObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("extractorTemplateByExtractorWrapperReturningList"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapper: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapper> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapperReturningList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectOrObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectOrObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorCombiner: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorCombiner> = z.union([z.lazy(() =>carryOnObject), z.object({extractorTemplateType:z.union([z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), z.lazy(() =>carryOnObject)]), rootExtractorOrReference:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate), z.string(), z.lazy(() =>carryOnObject)]), subQueryTemplate:z.union([z.lazy(() =>carryOnObject), z.object({query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate), rootQueryObjectTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorWrapper), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateExtractorForObjectByDirectReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateCombinerForObjectByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByRelationReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByManyToManyRelationReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateByExtractorCombiner), z.object({extractorTemplateType:z.union([z.literal("literal"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord> = z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplate)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constants), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_dataflowObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToSpreadObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_reference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_reference> = z.union([z.lazy(() =>carryOnObject), z.object({applyTo:z.union([z.object({referenceType:z.union([z.literal("referencedExtractor"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors), z.lazy(() =>carryOnObject)])}).strict(), z.object({referenceType:z.union([z.literal("referencedTransformer"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("count"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), groupBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_dataflowObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_dataflowObject> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("dataflowObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("freeObjectTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)), z.string(), z.number(), z.boolean(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectAlter"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("innerFullObjectTemplate"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mustacheStringTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_listMapperToList> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mapperListToList"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), elementTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("listReducerToIndexObject"), z.lazy(() =>carryOnObject)]), indexAttribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToSpreadObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToSpreadObject> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("listReducerToSpreadObject"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listReducerToIndexObject), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("object_fullTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_fullTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("listPickElement"), z.lazy(() =>carryOnObject)]), index:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_object_listPickElement> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectEntries"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectEntries> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectEntries"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectValues"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_objectValues> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_string: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_string> = z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_root: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_root> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("unique"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_reference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_reference> = z.union([z.lazy(() =>carryOnObject), z.object({applyTo:z.union([z.object({referenceType:z.union([z.literal("referencedExtractor"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_extractors), z.lazy(() =>carryOnObject)])}).strict(), z.object({referenceType:z.union([z.literal("referencedTransformer"), z.lazy(() =>carryOnObject)]), reference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constant: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constant> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantAsExtractor: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantAsExtractor> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantArray> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantBigint: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantBigint> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantBoolean: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantBoolean> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantNumber: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantNumber> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantString"), z.lazy(() =>carryOnObject)]), value:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("contextReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constants: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constants> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constant), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantAsExtractor), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantArray), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBigint), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantBoolean), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantNumber), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("freeObjectTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)), z.string(), z.number(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("innerFullObjectTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_fullTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_fullTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("object_fullTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectDynamicAccess"), z.lazy(() =>carryOnObject)]), objectAccessPath:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate), z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectEntries: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectEntries> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listPickElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listPickElement> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectAlter"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listMapperToList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listMapperToList> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mapperListToList"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), elementTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mustacheStringTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("newUuid"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_parameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_parameterReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("parameterReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique> = z.union([z.lazy(() =>carryOnObject), z.object({}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constants), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_fullTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listPickElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_listMapperToList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectEntries), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("transformer_menu_addItem"), z.lazy(() =>carryOnObject)]), interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)]), transformerDefinition:z.union([z.lazy(() =>carryOnObject), z.object({menuReference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), z.lazy(() =>carryOnObject)]), menuItemReference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), z.lazy(() =>carryOnObject)]), menuSectionInsertionIndex:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), menuSectionItemInsertionIndex:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuildOrRuntime: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuildOrRuntime> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObject> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("boxedExtractorTemplateReturningObject"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObject)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("boxedExtractorTemplateReturningObjectList"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateReturningObjectList)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectOrObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedExtractorTemplateReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_boxedQueryTemplateWithExtractorCombinerTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("boxedQueryTemplateWithExtractorCombinerTransformer"), z.lazy(() =>carryOnObject)]), runAsSql:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), extractorTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOnObject: z.ZodType<CarryOnObject> = z.union([z.lazy(() =>transformerForBuild), z.lazy(() =>transformerForRuntime)]);
export const compositeActionTemplate: z.ZodType<CompositeActionTemplate> = z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction);
export const miroirFundamentalType = z.lazy(() =>miroirAllFundamentalTypesUnion);
