import { ZodType, ZodTypeAny, z } from "zod";

export type JzodBaseObject = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
};
export type JzodArray = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "array";
    definition: JzodElement;
};
export type JzodPlainAttribute = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
    } | undefined;
    type: "lazy";
    definition: JzodFunction;
};
export type JzodLiteral = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "literal";
    definition: string | number | bigint | boolean;
};
export type JzodIntersection = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
    } | undefined;
    type: "promise";
    definition: JzodElement;
};
export type JzodRecord = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "record";
    definition: JzodElement;
};
export type JzodReference = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
        optional?: boolean | undefined;
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
    } | undefined;
    type: "set";
    definition: JzodElement;
};
export type JzodTuple = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "tuple";
    definition: JzodElement[];
};
export type JzodUnion = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    tag?: {
        optional?: boolean | undefined;
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
export type Transformer_constantUuid = {
    transformerType: "constantUuid";
    constantUuidValue: string;
};
export type Transformer_constantObject = {
    transformerType: "constantObject";
    constantObjectValue: {
        [x: string]: any;
    };
};
export type Transformer_constantString = {
    transformerType: "constantString";
    constantStringValue: string;
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
export type Transformer_InnerReference = Transformer_mustacheStringTemplate | Transformer_constantUuid | Transformer_constantObject | Transformer_constantString | Transformer_newUuid | Transformer_contextOrParameterReference | Transformer_objectDynamicAccess;
export type TransformerForBuild_orderBy = {
    orderBy?: string | undefined;
};
export type TransformerForBuild_count = {
    orderBy?: string | undefined;
    transformerType: "count";
    groupBy?: string | undefined;
};
export type TransformerForBuild_unique = {
    orderBy?: string | undefined;
    transformerType: "unique";
    attribute: string;
};
export type TransformerForBuild_innerFullObjectTemplate = {
    orderBy?: string | undefined;
    transformerType: "innerFullObjectTemplate";
    referenceToOuterObject: string;
    definition: {
        attributeKey: Transformer_InnerReference;
        attributeValue: TransformerForBuild;
    }[];
};
export type TransformerForBuild_fullObjectTemplate = {
    orderBy?: string | undefined;
    transformerType: "fullObjectTemplate";
    referencedExtractor: string;
    definition: {
        attributeKey: Transformer_InnerReference;
        attributeValue: TransformerForBuild;
    }[];
};
export type TransformerForBuild_freeObjectTemplate = {
    transformerType: "freeObjectTemplate";
    definition: {
        [x: string]: TransformerForBuild | {
            [x: string]: TransformerForBuild;
        } | string | number;
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
export type TransformerForBuild_mapper_listToList = {
    orderBy?: string | undefined;
    transformerType: "mapperListToList";
    referencedExtractor: string;
    elementTransformer: TransformerForBuild_inner_object_alter | TransformerForBuild_innerFullObjectTemplate;
};
export type TransformerForBuild_mapper_listToObject = {
    orderBy?: string | undefined;
    transformerType: "mapperListToObject";
    referencedExtractor: string;
    indexAttribute: string;
};
export type TransformerForBuild_list_pickElement = {
    orderBy?: string | undefined;
    transformerType: "listPickElement";
    referencedExtractor: string;
    index: number;
};
export type TransformerForBuild_objectValues = {
    orderBy?: string | undefined;
};
export type TransformerForBuild = Transformer_InnerReference | TransformerForBuild_fullObjectTemplate | TransformerForBuild_freeObjectTemplate | TransformerForBuild_inner_object_alter | TransformerForBuild_list_pickElement | TransformerForBuild_mapper_listToList | TransformerForBuild_mapper_listToObject | TransformerForBuild_mustacheStringTemplate;
export type TransformerForRuntime_Abstract = {
    interpolation: "runtime";
};
export type TransformerForRuntime_orderedTransformer = {
    interpolation: "runtime";
    orderBy?: string | undefined;
};
export type TransformerForRuntime_referencingTransformer = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    referencedExtractor: string;
};
export type TransformerForRuntime_constantUuid = {
    transformerType: "constantUuid";
    constantUuidValue: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_constantObject = {
    transformerType: "constantObject";
    constantObjectValue: {
        [x: string]: any;
    };
    interpolation: "runtime";
};
export type TransformerForRuntime_constantString = {
    transformerType: "constantString";
    constantStringValue: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_newUuid = {
    transformerType: "newUuid";
    interpolation: "runtime";
};
export type TransformerForRuntime_contextReference = {
    interpolation: "runtime";
    transformerType: "contextReference";
    referenceName?: string | undefined;
    referencePath?: string[] | undefined;
};
export type TransformerForRuntime_parameterReference = {
    interpolation: "runtime";
    transformerType: "parameterReference";
    referenceName?: string | undefined;
    referencePath?: string[] | undefined;
};
export type TransformerForRuntime_contextOrParameterReference = TransformerForRuntime_contextReference | TransformerForRuntime_parameterReference;
export type TransformerForRuntime_objectDynamicAccess = {
    interpolation: "runtime";
    transformerType: "objectDynamicAccess";
    objectAccessPath: (TransformerForRuntime_contextOrParameterReference | TransformerForRuntime_objectDynamicAccess | TransformerForRuntime_mustacheStringTemplate | string)[];
};
export type TransformerForRuntime_InnerReference = TransformerForRuntime_mustacheStringTemplate | TransformerForRuntime_constantUuid | TransformerForRuntime_constantObject | TransformerForRuntime_constantString | TransformerForRuntime_newUuid | TransformerForRuntime_contextOrParameterReference | TransformerForRuntime_objectDynamicAccess;
export type TransformerForRuntime_mustacheStringTemplate = {
    transformerType: "mustacheStringTemplate";
    definition: string;
    interpolation: "runtime";
};
export type TransformerForRuntime_count = {
    orderBy?: string | undefined;
    transformerType: "count";
    groupBy?: string | undefined;
    interpolation: "runtime";
    referencedExtractor: string;
};
export type TransformerForRuntime_unique = {
    orderBy?: string | undefined;
    transformerType: "unique";
    attribute: string;
    interpolation: "runtime";
    referencedExtractor: string;
};
export type TransformerForRuntime_objectValues = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    referencedExtractor: string;
    transformerType: "objectValues";
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
    transformerType: "innerFullObjectTemplate";
    referenceToOuterObject: string;
    definition: {
        attributeKey: TransformerForRuntime_InnerReference;
        attributeValue: TransformerForRuntime;
    }[];
};
export type TransformerForRuntime_fullObjectTemplate = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    referencedExtractor: string;
    transformerType: "fullObjectTemplate";
    definition: {
        attributeKey: TransformerForRuntime_InnerReference;
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
export type TransformerForRuntime_mapper_listToList = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    referencedExtractor: string;
    transformerType: "mapperListToList";
    elementTransformer: TransformerForRuntime_object_alter | TransformerForRuntime_innerFullObjectTemplate;
};
export type TransformerForRuntime_mapper_listToObject = {
    interpolation: "runtime";
    orderBy?: string | undefined;
    referencedExtractor: string;
    transformerType: "mapperListToObject";
    indexAttribute: string;
};
export type TransformerForRuntime_list_pickElement = {
    orderBy?: string | undefined;
    transformerType: "listPickElement";
    referencedExtractor: string;
    index: number;
    interpolation: "runtime";
};
export type TransformerForRuntime = TransformerForRuntime_InnerReference | TransformerForRuntime_fullObjectTemplate | TransformerForRuntime_freeObjectTemplate | TransformerForRuntime_object_alter | TransformerForRuntime_count | TransformerForRuntime_list_pickElement | TransformerForRuntime_mapper_listToList | TransformerForRuntime_mapper_listToObject | TransformerForRuntime_mustacheStringTemplate | TransformerForRuntime_objectValues | TransformerForRuntime_unique;
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
export type Application = {
    uuid: string;
    parentName?: string | undefined;
    parentUuid: string;
    parentDefinitionVersionUuid?: string | undefined;
    name: string;
    defaultLabel: string;
    description?: string | undefined;
    selfApplication: string;
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
    application: string;
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
    application: string;
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
    application?: string | undefined;
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
    jzodSchema: JzodObject;
};
export type MiroirMenuItem = {
    label: string;
    section: ApplicationSection;
    application: string;
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
    combinerTemplates?: QueryTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    definition: {
        label?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: QueryTemplateSelectObject | undefined;
    };
};
export type ObjectListReportSection = {
    type: "objectListReportSection";
    definition: {
        label?: string | undefined;
        parentName?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: QueryTemplateSelectObject | undefined;
        sortByAttribute?: string | undefined;
    };
};
export type GridReportSection = {
    type: "grid";
    combinerTemplates?: QueryTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    selectData?: QueryTemplateRecord | undefined;
    definition: ReportSection[][];
};
export type ListReportSection = {
    type: "list";
    combinerTemplates?: QueryTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: TransformerForRuntime;
    } | undefined;
    selectData?: QueryTemplateRecord | undefined;
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
    extractorTemplates?: {
        [x: string]: QueryTemplateSelectExtractorWrapper;
    } | undefined;
    extractors?: {
        [x: string]: ExtractorWrapper;
    } | undefined;
    combiners?: QueryRecord | undefined;
    combinerTemplates?: QueryTemplateRecord | undefined;
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
    application?: string | undefined;
    definition: {
        reportParametersToFetchQueryParametersTransformer?: {
            [x: string]: string;
        } | undefined;
        reportParameters?: {
            [x: string]: string;
        } | undefined;
        extractorTemplates?: {
            [x: string]: QueryTemplateSelectExtractorWrapper;
        } | undefined;
        extractors?: {
            [x: string]: ExtractorWrapper;
        } | undefined;
        combiners?: QueryRecord | undefined;
        combinerTemplates?: QueryTemplateRecord | undefined;
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
    configuration: StoreBasedConfiguration[];
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
    client: MiroirConfigForMswClient | MiroirConfigForRestClient;
};
export type MiroirConfigServer = {
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
    application?: string | undefined;
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
    queryFailure: "QueryNotExecutable" | "DomainStateNotLoaded" | "IncorrectParameters" | "DeploymentNotFound" | "ApplicationSectionNotFound" | "EntityNotFound" | "InstanceNotFound" | "ReferenceNotFound" | "ReferenceFoundButUndefined" | "ReferenceFoundButAttributeUndefinedOnFoundObject";
    query?: string | undefined;
    failureOrigin?: string[] | undefined;
    failureMessage?: string | undefined;
    queryReference?: string | undefined;
    queryParameters?: string | undefined;
    queryContext?: string | undefined;
    deploymentUuid?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    entityUuid?: string | undefined;
    instanceUuid?: string | undefined;
};
export type QueryTemplateConstant = {
    queryTemplateType: "constantString";
    definition: string;
} | {
    queryTemplateType: "constantNumber";
    definition: number;
} | {
    queryTemplateType: "constantObject";
    definition: {
        [x: string]: any;
    };
} | {
    queryTemplateType: "constantUuid";
    constantUuidValue: string;
};
export type QueryContextReference = {
    queryType: "queryContextReference";
    queryReference: string;
};
export type QueryTemplateContextReference = {
    queryTemplateType: "queryTemplateContextReference";
    referenceName: string;
};
export type QueryTemplateParameterReference = {
    queryTemplateType: "queryTemplateParameterReference";
    referenceName: string;
};
export type QueryTemplateConstantOrParameterReference = QueryTemplateConstant | QueryTemplateParameterReference;
export type QueryTemplateConstantOrAnyReference = QueryTemplateConstant | QueryTemplateContextReference | QueryTemplateParameterReference;
export type QueryTemplateRoot = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string | Transformer_InnerReference;
};
export type QueryTemplateSelectObjectByRelation = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string | Transformer_InnerReference;
    queryType: "combinerForObjectByRelation";
    objectReference: TransformerForRuntime_InnerReference;
    AttributeOfObjectToCompareToReferenceUuid: string;
};
export type QueryTemplateExtractObjectByDirectReference = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string | Transformer_InnerReference;
    queryType: "extractorForObjectByDirectReference";
    instanceUuid: Transformer_InnerReference;
};
export type QueryTemplateSelectObject = QueryTemplateSelectObjectByRelation | QueryTemplateExtractObjectByDirectReference;
export type ExtractorTemplateForObjectListByEntity = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string | Transformer_InnerReference;
    queryType: "extractorTemplateForObjectListByEntity";
    filter?: {
        attributeName: string;
        value: Transformer_constantString;
    } | undefined;
};
export type QueryTemplateSelectObjectListByRelation = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string | Transformer_InnerReference;
    queryType: "combinerByRelationReturningObjectList";
    objectReference: TransformerForRuntime_InnerReference;
    objectReferenceAttribute?: string | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string;
};
export type QueryTemplateSelectObjectListByManyToManyRelation = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string | Transformer_InnerReference;
    queryType: "combinerByManyToManyRelationReturningObjectList";
    objectListReference: Transformer_contextReference;
    objectListReferenceAttribute?: string | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: string | undefined;
};
export type QueryTemplateSelectObjectList = ExtractorTemplateForObjectListByEntity | QueryTemplateSelectObjectListByRelation | QueryTemplateSelectObjectListByManyToManyRelation;
export type QueryTemplateSelectByQueryCombiner = {
    queryType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList";
    rootExtractorOrReference: QueryTemplate | string;
    subQueryTemplate: {
        query: QueryTemplate;
        rootQueryObjectTransformer: RecordOfTransformers;
    };
};
export type QueryTemplateSelectExtractorWrapperReturningObject = QueryTemplateExtractObjectByDirectReference | {
    queryType: "extractorWrapperReturningObject";
    definition: {
        [x: string]: QueryTemplateSelectExtractorWrapperReturningObject;
    };
};
export type QueryTemplateSelectExtractorWrapperReturningList = ExtractorTemplateForObjectListByEntity | {
    queryType: "extractorWrapperReturningList";
    definition: QueryTemplateSelectExtractorWrapperReturningList[];
};
export type QueryTemplateSelectExtractorWrapper = QueryTemplateSelectExtractorWrapperReturningObject | QueryTemplateSelectExtractorWrapperReturningList;
export type QueryTemplate = QueryTemplateSelectExtractorWrapper | QueryContextReference | {
    queryType: "combiner_wrapperReturningObject";
    definition: {
        [x: string]: QueryTemplate;
    };
} | {
    queryType: "combiner_wrapperReturningList";
    definition: QueryTemplate[];
} | QueryTemplateExtractObjectByDirectReference | QueryTemplateSelectObjectList | QueryTemplateSelectObjectByRelation | QueryTemplateSelectObjectListByRelation | QueryTemplateSelectObjectListByManyToManyRelation | QueryTemplateSelectByQueryCombiner | {
    queryType: "literal";
    definition: string;
};
export type QueryTemplateRecord = {
    [x: string]: QueryTemplate;
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
export type ExtractorOrCombinerReturningObject = CombinerForObjectByRelation | ExtractorForObjectByDirectReference;
export type ExtractorByEntityReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "extractorByEntityReturningObjectList";
    filter?: {
        attributeName: string;
        value?: any;
    } | undefined;
};
export type Extractor = ExtractorOrCombinerReturningObject | ExtractorByEntityReturningObjectList;
export type CombinerByRelationReturningObjectList = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    extractorOrCombinerType: "combinerByRelationReturningObjectList";
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
    objectListReference: string;
    objectListReferenceAttribute?: string | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: string | undefined;
};
export type ExtractorOrCombinerReturningObjectList = ExtractorByEntityReturningObjectList | CombinerByRelationReturningObjectList | CombinerByManyToManyRelationReturningObjectList;
export type ExtractorCombinerByHeteronomousManyToManyReturningListOfObjectList = {
    extractorOrCombinerType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList";
    rootExtractorOrReference: Extractor | string;
    subQueryTemplate: {
        query: QueryTemplate;
        rootQueryObjectTransformer: RecordOfTransformers;
    };
};
export type ExtractorWrapperReturningObject = ExtractorForObjectByDirectReference | {
    extractorOrCombinerType: "extractorWrapperReturningObject";
    definition: {
        [x: string]: ExtractorWrapperReturningObject;
    };
};
export type ExtractorWrapperReturningList = ExtractorByEntityReturningObjectList | {
    extractorOrCombinerType: "extractorWrapperReturningList";
    definition: ExtractorWrapperReturningList[];
};
export type ExtractorWrapper = ExtractorWrapperReturningObject | ExtractorWrapperReturningList;
export type ExtractorOrCombiner = ExtractorWrapper | ExtractorOrCombinerContextReference | {
    extractorOrCombinerType: "combiner_wrapperReturningObject";
    definition: {
        [x: string]: ExtractorOrCombiner;
    };
} | {
    extractorOrCombinerType: "combiner_wrapperReturningList";
    definition: ExtractorOrCombiner[];
} | ExtractorForObjectByDirectReference | CombinerForObjectByRelation | ExtractorOrCombinerReturningObjectList | ExtractorCombinerByHeteronomousManyToManyReturningListOfObjectList | {
    extractorOrCombinerType: "literal";
    definition: string;
};
export type QueryRecord = {
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
export type DomainElementType = "any" | "object" | "instanceUuidIndex" | "entityInstanceCollection" | "instanceArray" | "instance" | "instanceUuid" | "instanceUuidIndexUuidIndex";
export type DomainElement = DomainElementVoid | DomainElementAny | DomainElementFailed | DomainElementObjectOrFailed | DomainElementInstanceUuidIndexOrFailed | DomainElementEntityInstanceCollectionOrFailed | DomainElementInstanceArrayOrFailed | DomainElementEntityInstanceOrFailed | {
    elementType: "instanceUuid";
    elementValue: EntityInstanceUuid;
} | {
    elementType: "instanceUuidIndexUuidIndex";
    elementValue: EntityInstancesUuidIndex;
} | {
    elementType: "string";
    elementValue: string;
} | {
    elementType: "number";
    elementValue: number;
} | {
    elementType: "array";
    elementValue: DomainElement[];
};
export type LocalCacheExtractor = {
    queryType: "localCacheEntityInstancesExtractor";
    definition: {
        deploymentUuid?: string | undefined;
        applicationSection?: ApplicationSection | undefined;
        entityUuid?: string | undefined;
        instanceUuid?: string | undefined;
    };
};
export type QueryRoot2 = {
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
export type QueryForExtractorOrCombinerReturningObject = {
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
    queryType: "queryForExtractorOrCombinerReturningObject";
    select: ExtractorOrCombinerReturningObject;
};
export type QueryForExtractorOrCombinerReturningObjectList = {
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
    queryType: "queryForExtractorOrCombinerReturningObjectList";
    select: ExtractorOrCombinerReturningObjectList;
};
export type QueryForExtractorOrCombinerReturningObjectOrObjectList = QueryForExtractorOrCombinerReturningObject | QueryForExtractorOrCombinerReturningObjectList;
export type QueryWithExtractorCombinerTransformer = {
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
    queryType: "queryWithExtractorCombinerTransformer";
    runAsSql?: boolean | undefined;
    extractors?: {
        [x: string]: ExtractorWrapper;
    } | undefined;
    combiners?: QueryRecord | undefined;
    runtimeTransformers?: {
        [x: string]: ExtendedTransformerForRuntime;
    } | undefined;
};
export type ExtractorTemplateForSingleObject = {
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
    queryType: "extractorTemplateForDomainModelObjects";
    select: QueryTemplateSelectObject;
};
export type ExtractorTemplateForSingleObjectList = {
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
    queryType: "extractorTemplateForDomainModelObjects";
    select: QueryTemplateSelectObjectList;
};
export type ExtractorTemplateForDomainModelObjects = ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList;
export type QueryTemplateWithExtractorCombinerTransformer = {
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
    queryType: "queryTemplateWithExtractorCombinerTransformer";
    runAsSql?: boolean | undefined;
    extractorTemplates?: {
        [x: string]: QueryTemplateSelectExtractorWrapper;
    } | undefined;
    combinerTemplates?: QueryTemplateRecord | undefined;
    runtimeTransformers?: {
        [x: string]: ExtendedTransformerForRuntime;
    } | undefined;
};
export type ExtractorByEntityUuidGetEntityDefinition = {
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
export type ExtractorByTemplateGetParamJzodSchema = {
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
    queryType: "extractorByTemplateGetParamJzodSchema";
    fetchParams: QueryTemplateWithExtractorCombinerTransformer;
};
export type ExtractorByQuery2GetParamJzodSchema = {
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
    queryType: "extractorByTemplateGetParamJzodSchema";
    fetchParams: QueryWithExtractorCombinerTransformer;
};
export type ExtractorByQueryTemplateGetParamJzodSchema = {
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
    select: QueryTemplate;
};
export type ExtractorByQueryGetParamJzodSchema = {
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
export type DomainModelQueryTemplateJzodSchemaParams = ExtractorByEntityUuidGetEntityDefinition | ExtractorByTemplateGetParamJzodSchema | ExtractorByQueryTemplateGetParamJzodSchema;
export type DomainModelQueryJzodSchemaParams = ExtractorByEntityUuidGetEntityDefinition | ExtractorByQuery2GetParamJzodSchema | ExtractorByQueryGetParamJzodSchema;
export type ExtractorTemplateForDomainModelDEFUNCT = ExtractorTemplateForDomainModelObjects | QueryTemplateWithExtractorCombinerTransformer | LocalCacheExtractor | ExtractorByEntityUuidGetEntityDefinition | ExtractorByTemplateGetParamJzodSchema | ExtractorByQueryTemplateGetParamJzodSchema;
export type ExtractorForDomainModelDEFUNCT = QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer | LocalCacheExtractor | ExtractorByEntityUuidGetEntityDefinition | ExtractorByQuery2GetParamJzodSchema | ExtractorByQueryGetParamJzodSchema;
export type ______________________________________________actions_____________________________________________ = never;
export type ActionError = {
    status: "error";
    error: {
        errorType: ("FailedToCreateStore" | "FailedToDeployModule") | "FailedToDeleteStore" | "FailedToResetAndInitMiroirAndApplicationDatabase" | "FailedToOpenStore" | "FailedToCloseStore" | "FailedToCreateInstance" | "FailedToGetInstance" | "FailedToGetInstances";
        errorMessage?: string | undefined;
        error?: {
            errorMessage?: string | undefined;
            stack: (string | undefined)[];
        } | undefined;
    };
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
    application: Application;
    applicationDeploymentConfiguration: EntityInstance;
    applicationModelBranch: EntityInstance;
    applicationVersion: EntityInstance;
    applicationStoreBasedConfiguration: EntityInstance;
};
export type ModelActionCommit = {
    actionType: "modelAction";
    actionName: "commit";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionRollback = {
    actionType: "modelAction";
    actionName: "rollback";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionInitModel = {
    actionType: "modelAction";
    actionName: "initModel";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
    params: {
        metaModel: MetaModel;
        dataStoreType: DataStoreType;
        application: Application;
        applicationDeploymentConfiguration: EntityInstance;
        applicationModelBranch: EntityInstance;
        applicationVersion: EntityInstance;
        applicationStoreBasedConfiguration: EntityInstance;
    };
};
export type ModelActionResetModel = {
    actionType: "modelAction";
    actionName: "resetModel";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionResetData = {
    actionType: "modelAction";
    actionName: "resetData";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
};
export type ModelActionAlterEntityAttribute = {
    actionType: "modelAction";
    actionName: "alterEntityAttribute";
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
    transactional?: boolean | undefined;
    deploymentUuid: string;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    entityUuid: string;
    entityDefinitionUuid: string;
};
export type ModelActionRenameEntity = {
    actionType: "modelAction";
    actionName: "renameEntity";
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
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
    params: {
        metaModel: MetaModel;
        dataStoreType: DataStoreType;
        application: Application;
        applicationDeploymentConfiguration: EntityInstance;
        applicationModelBranch: EntityInstance;
        applicationVersion: EntityInstance;
        applicationStoreBasedConfiguration: EntityInstance;
    };
} | {
    actionType: "modelAction";
    actionName: "commit";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "rollback";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "remoteLocalCacheRollback";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "resetModel";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "resetData";
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    deploymentUuid: string;
} | {
    actionType: "modelAction";
    actionName: "alterEntityAttribute";
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
    transactional?: boolean | undefined;
    deploymentUuid: string;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
    entityUuid: string;
    entityDefinitionUuid: string;
};
export type InstanceCUDAction = {
    actionType: "instanceAction";
    actionName: "createInstance";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "deleteInstance";
    deploymentUuid: string;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "updateInstance";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
};
export type InstanceAction = {
    actionType: "instanceAction";
    actionName: "createInstance";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "deleteInstance";
    deploymentUuid: string;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "deleteInstanceWithCascade";
    deploymentUuid: string;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "updateInstance";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "loadNewInstancesInLocalCache";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    objects: EntityInstanceCollection[];
} | {
    actionType: "instanceAction";
    actionName: "getInstance";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    parentUuid: string;
    uuid: string;
} | {
    actionType: "instanceAction";
    actionName: "getInstances";
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    parentUuid: string;
};
export type UndoRedoAction = {
    actionType: "undoRedoAction";
    actionName: "undo";
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389";
    deploymentUuid: string;
} | {
    actionType: "undoRedoAction";
    actionName: "redo";
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389";
    deploymentUuid: string;
};
export type TransactionalInstanceAction = {
    actionType: "transactionalInstanceAction";
    deploymentUuid?: string | undefined;
    instanceAction: InstanceCUDAction;
};
export type LocalCacheAction = UndoRedoAction | ModelAction | InstanceAction | TransactionalInstanceAction;
export type StoreManagementAction = {
    actionType: "storeManagementAction";
    actionName: "createStore";
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    configuration: StoreUnitConfiguration;
    deploymentUuid: string;
} | {
    actionType: "storeManagementAction";
    actionName: "deleteStore";
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deploymentUuid: string;
    configuration: StoreUnitConfiguration;
} | {
    actionType: "storeManagementAction";
    actionName: "resetAndInitMiroirAndApplicationDatabase";
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deployments: Deployment[];
    deploymentUuid: string;
} | {
    actionType: "storeManagementAction";
    actionName: "openStore";
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    configuration: {
        [x: string]: StoreUnitConfiguration;
    };
    deploymentUuid: string;
} | {
    actionType: "storeManagementAction";
    actionName: "closeStore";
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deploymentUuid: string;
};
export type PersistenceAction = {
    actionType: "LocalPersistenceAction";
    actionName: "create" | "read" | "update" | "delete";
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
    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4";
    section: ApplicationSection;
    deploymentUuid: string;
    parentName?: string | undefined;
    parentUuid?: string | undefined;
    uuid?: string | undefined;
    objects?: (EntityInstance | undefined)[] | undefined;
} | QueryAction | QueryTemplateAction | BundleAction | InstanceAction | ModelAction | StoreManagementAction;
export type LocalPersistenceAction = {
    actionType: "LocalPersistenceAction";
    actionName: "create" | "read" | "update" | "delete";
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
    endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4";
    section: ApplicationSection;
    deploymentUuid: string;
    parentName?: string | undefined;
    parentUuid?: string | undefined;
    uuid?: string | undefined;
    objects?: (EntityInstance | undefined)[] | undefined;
};
export type QueryTemplateAction = {
    actionType: "queryTemplateAction";
    actionName: "runQuery";
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: ExtractorTemplateForDomainModelObjects | QueryTemplateWithExtractorCombinerTransformer;
};
export type QueryAction = {
    actionType: "queryAction";
    actionName: "runQuery";
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e";
    applicationSection?: ApplicationSection | undefined;
    deploymentUuid: string;
    query: QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer;
};
export type CompositeActionDefinition = ({
    compositeActionType: "domainAction";
    compositeActionStepLabel?: string | undefined;
    domainAction: DomainAction;
} | {
    compositeActionType: "compositeAction";
    compositeActionStepLabel?: string | undefined;
    compositeActionTemplate: CompositeAction;
} | {
    compositeActionType: "query";
    compositeActionStepLabel?: string | undefined;
    nameGivenToResult: string;
    query: QueryAction;
} | {
    compositeActionType: "queryTemplate";
    compositeActionStepLabel?: string | undefined;
    nameGivenToResult: string;
    queryTemplate: QueryTemplateAction;
})[];
export type CompositeAction = {
    actionType: "compositeAction";
    actionName: "sequence";
    actionLabel?: string | undefined;
    deploymentUuid?: string | undefined;
    templates?: {
        [x: string]: any;
    } | undefined;
    definition: ({
        compositeActionType: "domainAction";
        compositeActionStepLabel?: string | undefined;
        domainAction: DomainAction;
    } | {
        compositeActionType: "compositeAction";
        compositeActionStepLabel?: string | undefined;
        compositeActionTemplate: CompositeAction;
    } | {
        compositeActionType: "query";
        compositeActionStepLabel?: string | undefined;
        nameGivenToResult: string;
        query: QueryAction;
    } | {
        compositeActionType: "queryTemplate";
        compositeActionStepLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: QueryTemplateAction;
    })[];
};
export type DomainAction = UndoRedoAction | StoreOrBundleAction | ModelAction | InstanceAction | {
    actionType: "transactionalInstanceAction";
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
    definition: ({
        compositeActionType: "domainAction";
        compositeActionStepLabel?: string | undefined;
        domainAction: DomainAction;
    } | {
        compositeActionType: "compositeAction";
        compositeActionStepLabel?: string | undefined;
        compositeActionTemplate: CompositeAction;
    } | {
        compositeActionType: "query";
        compositeActionStepLabel?: string | undefined;
        nameGivenToResult: string;
        query: QueryAction;
    } | {
        compositeActionType: "queryTemplate";
        compositeActionStepLabel?: string | undefined;
        nameGivenToResult: string;
        queryTemplate: QueryTemplateAction;
    })[];
};
export type ModelActionReplayableAction = ModelActionAlterEntityAttribute | ModelActionCreateEntity | ModelActionDropEntity | ModelActionRenameEntity;
export type BundleAction = {
    actionType: "bundleAction";
    actionName: "createBundle";
    deploymentUuid: string;
} | {
    actionType: "bundleAction";
    actionName: "deleteBundle";
    deploymentUuid: string;
};
export type StoreOrBundleAction = StoreManagementAction | BundleAction;
export type ActionTransformer = {
    transformerType: "actionTransformer";
};
export type DataTransformer = {
    transformerType: "dataTransformer";
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject_extend = {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRoot2_extend = {
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
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRoot_extend = {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_orderBy_extend = {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_extend = {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "unique" | CarryOnObject;
    attribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_extend = {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "count" | CarryOnObject;
    groupBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement_extend = {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "listPickElement" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
    index: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract_extend = {
    interpolation: "runtime" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer_extend = {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_referencingTransformer_extend = {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    referencedExtractor: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "array" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: ("any" | "bigint" | "boolean" | "never" | "null" | "uuid" | "undefined" | "unknown" | "void") | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations = CarryOnObject | {
    type: ("min" | "max") | CarryOnObject;
    parameter?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "date" | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
    validations?: ((CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations = CarryOnObject | {
    type: ("gt" | "gte" | "lt" | "lte" | "int" | "positive" | "nonpositive" | "negative" | "nonnegative" | "multipleOf" | "finite" | "safe") | CarryOnObject;
    parameter?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "number" | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
    validations?: ((CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations = CarryOnObject | {
    type: ("max" | "min" | "length" | "email" | "url" | "emoji" | "uuid" | "cuid" | "cuid2" | "ulid" | "regex" | "includes" | "startsWith" | "endsWith" | "datetime" | "ip") | CarryOnObject;
    parameter?: any | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "string" | CarryOnObject;
    coerce?: ((boolean | undefined) | CarryOnObject) | undefined;
    validations?: ((CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "enum" | CarryOnObject;
    definition: (string | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes = ("any" | "bigint" | "boolean" | "date" | "never" | "null" | "number" | "string" | "uuid" | "undefined" | "unknown" | "void") | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes = ("array" | "date" | "enum" | "function" | "lazy" | "literal" | "intersection" | "map" | "number" | "object" | "promise" | "record" | "schemaReference" | "set" | "string" | "tuple" | "union") | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "function" | CarryOnObject;
    definition: CarryOnObject | {
        args: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement[] | CarryOnObject;
        returns?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "lazy" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "literal" | CarryOnObject;
    definition: string | number | bigint | boolean | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "intersection" | CarryOnObject;
    definition: CarryOnObject | {
        left: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
        right: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "map" | CarryOnObject;
    definition: [
        CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement,
        CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement
    ] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
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
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "promise" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "record" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
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
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "set" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
    type: "tuple" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion = CarryOnObject | {
    optional?: ((boolean | undefined) | CarryOnObject) | undefined;
    nullable?: ((boolean | undefined) | CarryOnObject) | undefined;
    tag?: {
        optional?: boolean | undefined;
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
    } | undefined;
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
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application = CarryOnObject | {
    uuid: string | CarryOnObject;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    parentDefinitionVersionUuid?: ((string | undefined) | CarryOnObject) | undefined;
    name: string | CarryOnObject;
    defaultLabel: string | CarryOnObject;
    description?: ((string | undefined) | CarryOnObject) | undefined;
    selfApplication: string | CarryOnObject;
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
    application: string | CarryOnObject;
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
    application?: ((string | undefined) | CarryOnObject) | undefined;
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
    application: string | CarryOnObject;
    bundle: string | CarryOnObject;
    configuration?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration | undefined;
    model?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | undefined;
    data?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid = CarryOnObject | {
    elementType: "void" | CarryOnObject;
    elementValue?: (void | undefined) | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny = CarryOnObject | {
    elementType: "any" | CarryOnObject;
    elementValue?: any | CarryOnObject;
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
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObjectOrFailed | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndexOrFailed | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollectionOrFailed | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArrayOrFailed | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceOrFailed | {
    elementType: "instanceUuid" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid;
} | {
    elementType: "instanceUuidIndexUuidIndex" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex;
} | {
    elementType: "string" | CarryOnObject;
    elementValue: string | CarryOnObject;
} | {
    elementType: "number" | CarryOnObject;
    elementValue: number | CarryOnObject;
} | {
    elementType: "array" | CarryOnObject;
    elementValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement[] | CarryOnObject;
} | CarryOnObject;
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
    application: string | CarryOnObject;
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
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    definition: CarryOnObject | {
        label?: ((string | undefined) | CarryOnObject) | undefined;
        parentUuid: string | CarryOnObject;
        fetchedDataReference?: ((string | undefined) | CarryOnObject) | undefined;
        query?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection = CarryOnObject | {
    type: "objectListReportSection" | CarryOnObject;
    definition: CarryOnObject | {
        label?: ((string | undefined) | CarryOnObject) | undefined;
        parentName?: ((string | undefined) | CarryOnObject) | undefined;
        parentUuid: string | CarryOnObject;
        fetchedDataReference?: ((string | undefined) | CarryOnObject) | undefined;
        query?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject | undefined;
        sortByAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection = CarryOnObject | {
    type: "grid" | CarryOnObject;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    selectData?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
    definition: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection[] | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection = CarryOnObject | {
    type: "list" | CarryOnObject;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
    selectData?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
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
    extractorTemplates?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper;
    } | undefined) | CarryOnObject) | undefined;
    extractors?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper;
    } | undefined) | CarryOnObject) | undefined;
    combiners?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord | undefined;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
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
    application?: ((string | undefined) | CarryOnObject) | undefined;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport;
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
    configuration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration[] | CarryOnObject;
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
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "deleteInstance" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "updateInstance" | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction = {
    actionType: "undoRedoAction" | CarryOnObject;
    actionName: "undo" | CarryOnObject;
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "undoRedoAction" | CarryOnObject;
    actionName: "redo" | CarryOnObject;
    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction = {
    actionType: "modelAction" | CarryOnObject;
    actionName: "initModel" | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    params: CarryOnObject | {
        metaModel: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel;
        dataStoreType: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType;
        application: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application;
        applicationDeploymentConfiguration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
        applicationModelBranch: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
        applicationVersion: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
        applicationStoreBasedConfiguration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance;
    };
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "commit" | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "rollback" | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "remoteLocalCacheRollback" | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "resetModel" | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "resetData" | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "modelAction" | CarryOnObject;
    actionName: "alterEntityAttribute" | CarryOnObject;
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
    transactional?: ((boolean | undefined) | CarryOnObject) | undefined;
    deploymentUuid: string | CarryOnObject;
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" | CarryOnObject;
    entityUuid: string | CarryOnObject;
    entityDefinitionUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction = {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "createInstance" | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "deleteInstance" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "deleteInstanceWithCascade" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "updateInstance" | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    includeInTransaction?: ((boolean | undefined) | CarryOnObject) | undefined;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "loadNewInstancesInLocalCache" | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    objects: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection[] | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "getInstance" | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    parentUuid: string | CarryOnObject;
    uuid: string | CarryOnObject;
} | {
    actionType: "instanceAction" | CarryOnObject;
    actionName: "getInstances" | CarryOnObject;
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    applicationSection: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection;
    parentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction = {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "createStore" | CarryOnObject;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    configuration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "deleteStore" | CarryOnObject;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
    configuration: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "resetAndInitMiroirAndApplicationDatabase" | CarryOnObject;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    deployments: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment[] | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "openStore" | CarryOnObject;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    configuration: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration;
    } | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "storeManagementAction" | CarryOnObject;
    actionName: "closeStore" | CarryOnObject;
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction = CarryOnObject | {
    actionType: "transactionalInstanceAction" | CarryOnObject;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    instanceAction: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction = {
    actionType: "bundleAction" | CarryOnObject;
    actionName: "createBundle" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | {
    actionType: "bundleAction" | CarryOnObject;
    actionName: "deleteBundle" | CarryOnObject;
    deploymentUuid: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction | {
    actionType: "transactionalInstanceAction" | CarryOnObject;
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
    definition: ({
        compositeActionType: "domainAction" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        domainAction: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction;
    } | {
        compositeActionType: "compositeAction" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        compositeActionTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
    } | {
        compositeActionType: "query" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction;
    } | {
        compositeActionType: "queryTemplate" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction;
    } | CarryOnObject)[] | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionDefinition = ({
    compositeActionType: "domainAction" | CarryOnObject;
    compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
    domainAction: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction;
} | {
    compositeActionType: "compositeAction" | CarryOnObject;
    compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
    compositeActionTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
} | {
    compositeActionType: "query" | CarryOnObject;
    compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction;
} | {
    compositeActionType: "queryTemplate" | CarryOnObject;
    compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
    nameGivenToResult: string | CarryOnObject;
    queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction;
} | CarryOnObject)[] | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction = CarryOnObject | {
    actionType: "compositeAction" | CarryOnObject;
    actionName: "sequence" | CarryOnObject;
    actionLabel?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    templates?: (({
        [x: string]: any | CarryOnObject;
    } | undefined) | CarryOnObject) | undefined;
    definition: ({
        compositeActionType: "domainAction" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        domainAction: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction;
    } | {
        compositeActionType: "compositeAction" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        compositeActionTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
    } | {
        compositeActionType: "query" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction;
    } | {
        compositeActionType: "queryTemplate" | CarryOnObject;
        compositeActionStepLabel?: ((string | undefined) | CarryOnObject) | undefined;
        nameGivenToResult: string | CarryOnObject;
        queryTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction;
    } | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRoot2 = CarryOnObject | {
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
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObject = CarryOnObject | {
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
    queryType: "queryForExtractorOrCombinerReturningObject" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectList = CarryOnObject | {
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
    queryType: "queryForExtractorOrCombinerReturningObjectList" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryWithExtractorCombinerTransformer = CarryOnObject | {
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
    queryType: "queryWithExtractorCombinerTransformer" | CarryOnObject;
    runAsSql?: ((boolean | undefined) | CarryOnObject) | undefined;
    extractors?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper;
    } | undefined) | CarryOnObject) | undefined;
    combiners?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectOrObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList | {
    extractorOrCombinerType: "extractorWrapperReturningList" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList[] | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference | {
    extractorOrCombinerType: "extractorWrapperReturningObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject;
    } | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference = CarryOnObject | {
    extractorOrCombinerType: "extractorOrCombinerContextReference" | CarryOnObject;
    extractorOrCombinerContextReference: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    extractorOrCombinerType: "extractorByEntityReturningObjectList" | CarryOnObject;
    filter?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        value?: any | CarryOnObject;
    }) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    extractorOrCombinerType: "extractorForObjectByDirectReference" | CarryOnObject;
    instanceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList = CarryOnObject | {
    extractorOrCombinerType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" | CarryOnObject;
    rootExtractorOrReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor | string | CarryOnObject;
    subQueryTemplate: CarryOnObject | {
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate;
        rootQueryObjectTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference | {
    extractorOrCombinerType: "combiner_wrapperReturningObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner;
    } | CarryOnObject;
} | {
    extractorOrCombinerType: "combiner_wrapperReturningList" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner[] | CarryOnObject;
} | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList | {
    extractorOrCombinerType: "literal" | CarryOnObject;
    definition: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    extractorOrCombinerType: "combinerForObjectByRelation" | CarryOnObject;
    objectReference: string | CarryOnObject;
    AttributeOfObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    extractorOrCombinerType: "combinerByRelationReturningObjectList" | CarryOnObject;
    objectReference: string | CarryOnObject;
    objectReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOnObject;
    extractorOrCombinerType: "combinerByManyToManyRelationReturningObjectList" | CarryOnObject;
    objectListReference: string | CarryOnObject;
    objectListReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord = {
    [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction = CarryOnObject | {
    actionType: "queryAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectOrObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryWithExtractorCombinerTransformer | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryContextReference = CarryOnObject | {
    queryType: "queryContextReference" | CarryOnObject;
    queryReference: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRoot = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant = {
    queryTemplateType: "constantString" | CarryOnObject;
    definition: string | CarryOnObject;
} | {
    queryTemplateType: "constantNumber" | CarryOnObject;
    definition: number | CarryOnObject;
} | {
    queryTemplateType: "constantObject" | CarryOnObject;
    definition: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
} | {
    queryTemplateType: "constantUuid" | CarryOnObject;
    constantUuidValue: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateContextReference = CarryOnObject | {
    queryTemplateType: "queryTemplateContextReference" | CarryOnObject;
    referenceName: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference = CarryOnObject | {
    queryTemplateType: "queryTemplateParameterReference" | CarryOnObject;
    referenceName: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstantOrParameterReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstantOrAnyReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateContextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed = CarryOnObject | {
    queryFailure: ("QueryNotExecutable" | "DomainStateNotLoaded" | "IncorrectParameters" | "DeploymentNotFound" | "ApplicationSectionNotFound" | "EntityNotFound" | "InstanceNotFound" | "ReferenceNotFound" | "ReferenceFoundButUndefined" | "ReferenceFoundButAttributeUndefinedOnFoundObject") | CarryOnObject;
    query?: ((string | undefined) | CarryOnObject) | undefined;
    failureOrigin?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
    failureMessage?: ((string | undefined) | CarryOnObject) | undefined;
    queryReference?: ((string | undefined) | CarryOnObject) | undefined;
    queryParameters?: ((string | undefined) | CarryOnObject) | undefined;
    queryContext?: ((string | undefined) | CarryOnObject) | undefined;
    deploymentUuid?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    entityUuid?: ((string | undefined) | CarryOnObject) | undefined;
    instanceUuid?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
    queryType: "combinerByManyToManyRelationReturningObjectList" | CarryOnObject;
    objectListReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference;
    objectListReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfRootListObjectToCompareToListReferenceUuid?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
    queryType: "extractorTemplateForObjectListByEntity" | CarryOnObject;
    filter?: (CarryOnObject | {
        attributeName: string | CarryOnObject;
        value: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString;
    }) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
    queryType: "combinerByRelationReturningObjectList" | CarryOnObject;
    objectReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference;
    objectReferenceAttribute?: ((string | undefined) | CarryOnObject) | undefined;
    AttributeOfListObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
    queryType: "combinerForObjectByRelation" | CarryOnObject;
    objectReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference;
    AttributeOfObjectToCompareToReferenceUuid: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference = CarryOnObject | {
    label?: ((string | undefined) | CarryOnObject) | undefined;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    parentName?: ((string | undefined) | CarryOnObject) | undefined;
    parentUuid: string | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOnObject;
    queryType: "extractorForObjectByDirectReference" | CarryOnObject;
    instanceUuid: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference | {
    queryType: "extractorWrapperReturningObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject;
    } | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity | {
    queryType: "extractorWrapperReturningList" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList[] | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectByQueryCombiner = CarryOnObject | {
    queryType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" | CarryOnObject;
    rootExtractorOrReference: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate | string | CarryOnObject;
    subQueryTemplate: CarryOnObject | {
        query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate;
        rootQueryObjectTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers;
    };
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryContextReference | {
    queryType: "combiner_wrapperReturningObject" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate;
    } | CarryOnObject;
} | {
    queryType: "combiner_wrapperReturningList" | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate[] | CarryOnObject;
} | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectByQueryCombiner | {
    queryType: "literal" | CarryOnObject;
    definition: string | CarryOnObject;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord = {
    [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate;
} | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate = CarryOnObject | {
    transformerType: "mustacheStringTemplate" | CarryOnObject;
    definition: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid = CarryOnObject | {
    transformerType: "constantUuid" | CarryOnObject;
    constantUuidValue: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject = CarryOnObject | {
    transformerType: "constantObject" | CarryOnObject;
    constantObjectValue: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString = CarryOnObject | {
    transformerType: "constantString" | CarryOnObject;
    constantStringValue: string | CarryOnObject;
};
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
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_fullObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate = CarryOnObject | {
    transformerType: "mustacheStringTemplate" | CarryOnObject;
    definition: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_orderBy = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "unique" | CarryOnObject;
    attribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "count" | CarryOnObject;
    groupBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "listPickElement" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
    index: number | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "innerFullObjectTemplate" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_fullObjectTemplate = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "fullObjectTemplate" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate = CarryOnObject | {
    transformerType: "freeObjectTemplate" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild | {
            [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild;
        } | string | number | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter = CarryOnObject | {
    transformerType: "objectAlter" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToList = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "mapperListToList" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
    elementTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToObject = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "mapperListToObject" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
    indexAttribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate = CarryOnObject | {
    transformerType: "mustacheStringTemplate" | CarryOnObject;
    definition: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid = CarryOnObject | {
    transformerType: "constantUuid" | CarryOnObject;
    constantUuidValue: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject = CarryOnObject | {
    transformerType: "constantObject" | CarryOnObject;
    constantObjectValue: {
        [x: string]: any | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString = CarryOnObject | {
    transformerType: "constantString" | CarryOnObject;
    constantStringValue: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid = CarryOnObject | {
    transformerType: "newUuid" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_parameterReference = CarryOnObject | {
    transformerType: "parameterReference" | CarryOnObject;
    referenceName?: ((string | undefined) | CarryOnObject) | undefined;
    referencePath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextReference = CarryOnObject | {
    transformerType: "contextReference" | CarryOnObject;
    referenceName?: ((string | undefined) | CarryOnObject) | undefined;
    referencePath?: (((string | CarryOnObject)[] | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess = CarryOnObject | {
    transformerType: "objectDynamicAccess" | CarryOnObject;
    objectAccessPath: (CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate | string | CarryOnObject)[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_referencingTransformer = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    referencedExtractor: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "count" | CarryOnObject;
    groupBy?: ((string | undefined) | CarryOnObject) | undefined;
    interpolation: "runtime" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_fullObjectTemplate = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    referencedExtractor: string | CarryOnObject;
    transformerType: "fullObjectTemplate" | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "innerFullObjectTemplate" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: (CarryOnObject | {
        attributeKey: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference;
        attributeValue: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
    })[] | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "unique" | CarryOnObject;
    attribute: string | CarryOnObject;
    interpolation: "runtime" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToList = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    referencedExtractor: string | CarryOnObject;
    transformerType: "mapperListToList" | CarryOnObject;
    elementTransformer: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    referencedExtractor: string | CarryOnObject;
    transformerType: "mapperListToObject" | CarryOnObject;
    indexAttribute: string | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    referencedExtractor: string | CarryOnObject;
    transformerType: "objectValues" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_pickElement = CarryOnObject | {
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "listPickElement" | CarryOnObject;
    referencedExtractor: string | CarryOnObject;
    index: number | CarryOnObject;
    interpolation: "runtime" | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    transformerType: "freeObjectTemplate" | CarryOnObject;
    definition: {
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime | {
            [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime;
        } | string | number | CarryOnObject;
    } | CarryOnObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter = CarryOnObject | {
    interpolation: "runtime" | CarryOnObject;
    orderBy?: ((string | undefined) | CarryOnObject) | undefined;
    transformerType: "objectAlter" | CarryOnObject;
    referenceToOuterObject: string | CarryOnObject;
    definition: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_fullObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_pickElement | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToList | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique | CarryOnObject;
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
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObject = CarryOnObject | {
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
    queryType: "extractorTemplateForDomainModelObjects" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObjectList = CarryOnObject | {
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
    queryType: "extractorTemplateForDomainModelObjects" | CarryOnObject;
    select: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForDomainModelObjects = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObject | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObjectList | CarryOnObject;
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateWithExtractorCombinerTransformer = CarryOnObject | {
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
    queryType: "queryTemplateWithExtractorCombinerTransformer" | CarryOnObject;
    runAsSql?: ((boolean | undefined) | CarryOnObject) | undefined;
    extractorTemplates?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper;
    } | undefined) | CarryOnObject) | undefined;
    combinerTemplates?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord | undefined;
    runtimeTransformers?: (({
        [x: string]: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime;
    } | undefined) | CarryOnObject) | undefined;
};
export type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction = CarryOnObject | {
    actionType: "queryTemplateAction" | CarryOnObject;
    actionName: "runQuery" | CarryOnObject;
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e" | CarryOnObject;
    applicationSection?: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection | undefined;
    deploymentUuid: string | CarryOnObject;
    query: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForDomainModelObjects | CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateWithExtractorCombinerTransformer | CarryOnObject;
};
export type CarryOnObject = TransformerForBuild | TransformerForRuntime;
export type CompositeActionTemplate = CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
export type MiroirFundamentalType = MiroirAllFundamentalTypesUnion;

export const jzodBaseObject: z.ZodType<JzodBaseObject> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict();
export const jzodArray: z.ZodType<JzodArray> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("array"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodPlainAttribute: z.ZodType<JzodPlainAttribute> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.enum(["any","bigint","boolean","never","null","uuid","undefined","unknown","void"]), coerce:z.boolean().optional()}).strict();
export const jzodAttributeDateValidations: z.ZodType<JzodAttributeDateValidations> = z.object({type:z.enum(["min","max"]), parameter:z.any()}).strict();
export const jzodAttributePlainDateWithValidations: z.ZodType<JzodAttributePlainDateWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("date"), coerce:z.boolean().optional(), validations:z.array(z.lazy(() =>jzodAttributeDateValidations)).optional()}).strict();
export const jzodAttributeNumberValidations: z.ZodType<JzodAttributeNumberValidations> = z.object({type:z.enum(["gt","gte","lt","lte","int","positive","nonpositive","negative","nonnegative","multipleOf","finite","safe"]), parameter:z.any()}).strict();
export const jzodAttributePlainNumberWithValidations: z.ZodType<JzodAttributePlainNumberWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("number"), coerce:z.boolean().optional(), validations:z.array(z.lazy(() =>jzodAttributeNumberValidations)).optional()}).strict();
export const jzodAttributeStringValidations: z.ZodType<JzodAttributeStringValidations> = z.object({type:z.enum(["max","min","length","email","url","emoji","uuid","cuid","cuid2","ulid","regex","includes","startsWith","endsWith","datetime","ip"]), parameter:z.any()}).strict();
export const jzodAttributePlainStringWithValidations: z.ZodType<JzodAttributePlainStringWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("string"), coerce:z.boolean().optional(), validations:z.array(z.lazy(() =>jzodAttributeStringValidations)).optional()}).strict();
export const jzodElement: z.ZodType<JzodElement> = z.union([z.lazy(() =>jzodArray), z.lazy(() =>jzodPlainAttribute), z.lazy(() =>jzodAttributePlainDateWithValidations), z.lazy(() =>jzodAttributePlainNumberWithValidations), z.lazy(() =>jzodAttributePlainStringWithValidations), z.lazy(() =>jzodEnum), z.lazy(() =>jzodFunction), z.lazy(() =>jzodLazy), z.lazy(() =>jzodLiteral), z.lazy(() =>jzodIntersection), z.lazy(() =>jzodMap), z.lazy(() =>jzodObject), z.lazy(() =>jzodPromise), z.lazy(() =>jzodRecord), z.lazy(() =>jzodReference), z.lazy(() =>jzodSet), z.lazy(() =>jzodTuple), z.lazy(() =>jzodUnion)]);
export const jzodEnum: z.ZodType<JzodEnum> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("enum"), definition:z.array(z.string())}).strict();
export const jzodEnumAttributeTypes: z.ZodType<JzodEnumAttributeTypes> = z.enum(["any","bigint","boolean","date","never","null","number","string","uuid","undefined","unknown","void"]);
export const jzodEnumElementTypes: z.ZodType<JzodEnumElementTypes> = z.enum(["array","date","enum","function","lazy","literal","intersection","map","number","object","promise","record","schemaReference","set","string","tuple","union"]);
export const jzodFunction: z.ZodType<JzodFunction> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("function"), definition:z.object({args:z.array(z.lazy(() =>jzodElement)), returns:z.lazy(() =>jzodElement).optional()}).strict()}).strict();
export const jzodLazy: z.ZodType<JzodLazy> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("lazy"), definition:z.lazy(() =>jzodFunction)}).strict();
export const jzodLiteral: z.ZodType<JzodLiteral> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("literal"), definition:z.union([z.string(), z.number(), z.bigint(), z.boolean()])}).strict();
export const jzodIntersection: z.ZodType<JzodIntersection> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("intersection"), definition:z.object({left:z.lazy(() =>jzodElement), right:z.lazy(() =>jzodElement)}).strict()}).strict();
export const jzodMap: z.ZodType<JzodMap> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("map"), definition:z.tuple([z.lazy(() =>jzodElement), z.lazy(() =>jzodElement)])}).strict();
export const jzodObject: z.ZodType<JzodObject> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({extend:z.lazy(() =>jzodReference).optional(), type:z.literal("object"), nonStrict:z.boolean().optional(), partial:z.boolean().optional(), carryOn:z.union([z.lazy(() =>jzodObject), z.lazy(() =>jzodUnion)]).optional(), definition:z.record(z.string(),z.lazy(() =>jzodElement))}).strict();
export const jzodPromise: z.ZodType<JzodPromise> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("promise"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodRecord: z.ZodType<JzodRecord> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("record"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodReference: z.ZodType<JzodReference> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("schemaReference"), context:z.record(z.string(),z.lazy(() =>jzodElement)).optional(), carryOn:z.union([z.lazy(() =>jzodObject), z.lazy(() =>jzodUnion)]).optional(), definition:z.object({eager:z.boolean().optional(), partial:z.boolean().optional(), relativePath:z.string().optional(), absolutePath:z.string().optional()}).strict()}).strict();
export const jzodSet: z.ZodType<JzodSet> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("set"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodTuple: z.ZodType<JzodTuple> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("tuple"), definition:z.array(z.lazy(() =>jzodElement))}).strict();
export const jzodUnion: z.ZodType<JzodUnion> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.number().optional(), defaultLabel:z.string().optional(), initializeTo:z.any().optional(), targetEntity:z.string().optional(), editable:z.boolean().optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.literal("union"), discriminator:z.string().optional(), discriminatorNew:z.union([z.object({discriminatorType:z.literal("string"), value:z.string()}).strict(), z.object({discriminatorType:z.literal("array"), value:z.array(z.string())}).strict()]).optional(), carryOn:z.lazy(() =>jzodObject).optional(), definition:z.array(z.lazy(() =>jzodElement))}).strict();
export const ______________________________________________transformers_____________________________________________: z.ZodType<______________________________________________transformers_____________________________________________> = z.never();
export const recordOfTransformers: z.ZodType<RecordOfTransformers> = z.object({transformerType:z.literal("recordOfTransformers"), definition:z.record(z.string(),z.lazy(() =>transformer))}).strict();
export const transformer: z.ZodType<Transformer> = z.union([z.object({transformerType:z.literal("objectTransformer"), attributeName:z.string()}).strict(), z.lazy(() =>recordOfTransformers)]);
export const transformer_mustacheStringTemplate: z.ZodType<Transformer_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string()}).strict();
export const transformer_constantUuid: z.ZodType<Transformer_constantUuid> = z.object({transformerType:z.literal("constantUuid"), constantUuidValue:z.string()}).strict();
export const transformer_constantObject: z.ZodType<Transformer_constantObject> = z.object({transformerType:z.literal("constantObject"), constantObjectValue:z.record(z.string(),z.any())}).strict();
export const transformer_constantString: z.ZodType<Transformer_constantString> = z.object({transformerType:z.literal("constantString"), constantStringValue:z.string()}).strict();
export const transformer_newUuid: z.ZodType<Transformer_newUuid> = z.object({transformerType:z.literal("newUuid")}).strict();
export const transformer_contextReference: z.ZodType<Transformer_contextReference> = z.object({transformerType:z.literal("contextReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformer_parameterReference: z.ZodType<Transformer_parameterReference> = z.object({transformerType:z.literal("parameterReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformer_contextOrParameterReference: z.ZodType<Transformer_contextOrParameterReference> = z.union([z.lazy(() =>transformer_contextReference), z.lazy(() =>transformer_parameterReference)]);
export const transformer_objectDynamicAccess: z.ZodType<Transformer_objectDynamicAccess> = z.object({transformerType:z.literal("objectDynamicAccess"), objectAccessPath:z.array(z.union([z.lazy(() =>transformer_contextOrParameterReference), z.lazy(() =>transformer_objectDynamicAccess), z.lazy(() =>transformer_mustacheStringTemplate), z.string()]))}).strict();
export const transformer_InnerReference: z.ZodType<Transformer_InnerReference> = z.union([z.lazy(() =>transformer_mustacheStringTemplate), z.lazy(() =>transformer_constantUuid), z.lazy(() =>transformer_constantObject), z.lazy(() =>transformer_constantString), z.lazy(() =>transformer_newUuid), z.lazy(() =>transformer_contextOrParameterReference), z.lazy(() =>transformer_objectDynamicAccess)]);
export const transformerForBuild_orderBy: z.ZodType<TransformerForBuild_orderBy> = z.object({orderBy:z.string().optional()}).strict();
export const transformerForBuild_count: z.ZodType<TransformerForBuild_count> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("count"), groupBy:z.string().optional()}).strict();
export const transformerForBuild_unique: z.ZodType<TransformerForBuild_unique> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("unique"), attribute:z.string()}).strict();
export const transformerForBuild_innerFullObjectTemplate: z.ZodType<TransformerForBuild_innerFullObjectTemplate> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("innerFullObjectTemplate"), referenceToOuterObject:z.string(), definition:z.array(z.object({attributeKey:z.lazy(() =>transformer_InnerReference), attributeValue:z.lazy(() =>transformerForBuild)}).strict())}).strict();
export const transformerForBuild_fullObjectTemplate: z.ZodType<TransformerForBuild_fullObjectTemplate> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("fullObjectTemplate"), referencedExtractor:z.string(), definition:z.array(z.object({attributeKey:z.lazy(() =>transformer_InnerReference), attributeValue:z.lazy(() =>transformerForBuild)}).strict())}).strict();
export const transformerForBuild_freeObjectTemplate: z.ZodType<TransformerForBuild_freeObjectTemplate> = z.object({transformerType:z.literal("freeObjectTemplate"), definition:z.record(z.string(),z.union([z.lazy(() =>transformerForBuild), z.record(z.string(),z.lazy(() =>transformerForBuild)), z.string(), z.number()]))}).strict();
export const transformerForBuild_inner_object_alter: z.ZodType<TransformerForBuild_inner_object_alter> = z.object({transformerType:z.literal("objectAlter"), referenceToOuterObject:z.string(), definition:z.lazy(() =>transformerForBuild_freeObjectTemplate)}).strict();
export const transformerForBuild_mustacheStringTemplate: z.ZodType<TransformerForBuild_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string()}).strict();
export const transformerForBuild_mapper_listToList: z.ZodType<TransformerForBuild_mapper_listToList> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("mapperListToList"), referencedExtractor:z.string(), elementTransformer:z.union([z.lazy(() =>transformerForBuild_inner_object_alter), z.lazy(() =>transformerForBuild_innerFullObjectTemplate)])}).strict();
export const transformerForBuild_mapper_listToObject: z.ZodType<TransformerForBuild_mapper_listToObject> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("mapperListToObject"), referencedExtractor:z.string(), indexAttribute:z.string()}).strict();
export const transformerForBuild_list_pickElement: z.ZodType<TransformerForBuild_list_pickElement> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("listPickElement"), referencedExtractor:z.string(), index:z.number()}).strict();
export const transformerForBuild_objectValues: z.ZodType<TransformerForBuild_objectValues> = z.object({orderBy:z.string().optional()}).strict().extend({}).strict();
export const transformerForBuild: z.ZodType<TransformerForBuild> = z.union([z.lazy(() =>transformer_InnerReference), z.lazy(() =>transformerForBuild_fullObjectTemplate), z.lazy(() =>transformerForBuild_freeObjectTemplate), z.lazy(() =>transformerForBuild_inner_object_alter), z.lazy(() =>transformerForBuild_list_pickElement), z.lazy(() =>transformerForBuild_mapper_listToList), z.lazy(() =>transformerForBuild_mapper_listToObject), z.lazy(() =>transformerForBuild_mustacheStringTemplate)]);
export const transformerForRuntime_Abstract: z.ZodType<TransformerForRuntime_Abstract> = z.object({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_orderedTransformer: z.ZodType<TransformerForRuntime_orderedTransformer> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict();
export const transformerForRuntime_referencingTransformer: z.ZodType<TransformerForRuntime_referencingTransformer> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({orderBy:z.string().optional(), referencedExtractor:z.string()}).strict();
export const transformerForRuntime_constantUuid: z.ZodType<TransformerForRuntime_constantUuid> = z.object({transformerType:z.literal("constantUuid"), constantUuidValue:z.string()}).strict().extend({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantObject: z.ZodType<TransformerForRuntime_constantObject> = z.object({transformerType:z.literal("constantObject"), constantObjectValue:z.record(z.string(),z.any())}).strict().extend({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_constantString: z.ZodType<TransformerForRuntime_constantString> = z.object({transformerType:z.literal("constantString"), constantStringValue:z.string()}).strict().extend({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_newUuid: z.ZodType<TransformerForRuntime_newUuid> = z.object({transformerType:z.literal("newUuid")}).strict().extend({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_contextReference: z.ZodType<TransformerForRuntime_contextReference> = z.object({interpolation:z.literal("runtime")}).strict().extend({transformerType:z.literal("contextReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformerForRuntime_parameterReference: z.ZodType<TransformerForRuntime_parameterReference> = z.object({interpolation:z.literal("runtime")}).strict().extend({transformerType:z.literal("parameterReference"), referenceName:z.string().optional(), referencePath:z.array(z.string()).optional()}).strict();
export const transformerForRuntime_contextOrParameterReference: z.ZodType<TransformerForRuntime_contextOrParameterReference> = z.union([z.lazy(() =>transformerForRuntime_contextReference), z.lazy(() =>transformerForRuntime_parameterReference)]);
export const transformerForRuntime_objectDynamicAccess: z.ZodType<TransformerForRuntime_objectDynamicAccess> = z.object({interpolation:z.literal("runtime")}).strict().extend({transformerType:z.literal("objectDynamicAccess"), objectAccessPath:z.array(z.union([z.lazy(() =>transformerForRuntime_contextOrParameterReference), z.lazy(() =>transformerForRuntime_objectDynamicAccess), z.lazy(() =>transformerForRuntime_mustacheStringTemplate), z.string()]))}).strict();
export const transformerForRuntime_InnerReference: z.ZodType<TransformerForRuntime_InnerReference> = z.union([z.lazy(() =>transformerForRuntime_mustacheStringTemplate), z.lazy(() =>transformerForRuntime_constantUuid), z.lazy(() =>transformerForRuntime_constantObject), z.lazy(() =>transformerForRuntime_constantString), z.lazy(() =>transformerForRuntime_newUuid), z.lazy(() =>transformerForRuntime_contextOrParameterReference), z.lazy(() =>transformerForRuntime_objectDynamicAccess)]);
export const transformerForRuntime_mustacheStringTemplate: z.ZodType<TransformerForRuntime_mustacheStringTemplate> = z.object({transformerType:z.literal("mustacheStringTemplate"), definition:z.string()}).strict().extend({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime_count: z.ZodType<TransformerForRuntime_count> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("count"), groupBy:z.string().optional()}).strict().extend({interpolation:z.literal("runtime"), referencedExtractor:z.string()}).strict();
export const transformerForRuntime_unique: z.ZodType<TransformerForRuntime_unique> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("unique"), attribute:z.string()}).strict().extend({interpolation:z.literal("runtime"), referencedExtractor:z.string()}).strict();
export const transformerForRuntime_objectValues: z.ZodType<TransformerForRuntime_objectValues> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({orderBy:z.string().optional(), referencedExtractor:z.string()}).strict().extend({transformerType:z.literal("objectValues")}).strict();
export const transformerForRuntime_freeObjectTemplate: z.ZodType<TransformerForRuntime_freeObjectTemplate> = z.object({interpolation:z.literal("runtime")}).strict().extend({transformerType:z.literal("freeObjectTemplate"), definition:z.record(z.string(),z.union([z.lazy(() =>transformerForRuntime), z.record(z.string(),z.lazy(() =>transformerForRuntime)), z.string(), z.number()]))}).strict();
export const transformerForRuntime_innerFullObjectTemplate: z.ZodType<TransformerForRuntime_innerFullObjectTemplate> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("innerFullObjectTemplate"), referenceToOuterObject:z.string(), definition:z.array(z.object({attributeKey:z.lazy(() =>transformerForRuntime_InnerReference), attributeValue:z.lazy(() =>transformerForRuntime)}).strict())}).strict();
export const transformerForRuntime_fullObjectTemplate: z.ZodType<TransformerForRuntime_fullObjectTemplate> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({orderBy:z.string().optional(), referencedExtractor:z.string()}).strict().extend({transformerType:z.literal("fullObjectTemplate"), definition:z.array(z.object({attributeKey:z.lazy(() =>transformerForRuntime_InnerReference), attributeValue:z.lazy(() =>transformerForRuntime)}).strict())}).strict();
export const transformerForRuntime_object_alter: z.ZodType<TransformerForRuntime_object_alter> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("objectAlter"), referenceToOuterObject:z.string(), definition:z.lazy(() =>transformerForRuntime_freeObjectTemplate)}).strict();
export const transformerForRuntime_mapper_listToList: z.ZodType<TransformerForRuntime_mapper_listToList> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({orderBy:z.string().optional(), referencedExtractor:z.string()}).strict().extend({transformerType:z.literal("mapperListToList"), elementTransformer:z.union([z.lazy(() =>transformerForRuntime_object_alter), z.lazy(() =>transformerForRuntime_innerFullObjectTemplate)])}).strict();
export const transformerForRuntime_mapper_listToObject: z.ZodType<TransformerForRuntime_mapper_listToObject> = z.object({interpolation:z.literal("runtime")}).strict().extend({orderBy:z.string().optional()}).strict().extend({orderBy:z.string().optional(), referencedExtractor:z.string()}).strict().extend({transformerType:z.literal("mapperListToObject"), indexAttribute:z.string()}).strict();
export const transformerForRuntime_list_pickElement: z.ZodType<TransformerForRuntime_list_pickElement> = z.object({orderBy:z.string().optional()}).strict().extend({transformerType:z.literal("listPickElement"), referencedExtractor:z.string(), index:z.number()}).strict().extend({interpolation:z.literal("runtime")}).strict();
export const transformerForRuntime: z.ZodType<TransformerForRuntime> = z.union([z.lazy(() =>transformerForRuntime_InnerReference), z.lazy(() =>transformerForRuntime_fullObjectTemplate), z.lazy(() =>transformerForRuntime_freeObjectTemplate), z.lazy(() =>transformerForRuntime_object_alter), z.lazy(() =>transformerForRuntime_count), z.lazy(() =>transformerForRuntime_list_pickElement), z.lazy(() =>transformerForRuntime_mapper_listToList), z.lazy(() =>transformerForRuntime_mapper_listToObject), z.lazy(() =>transformerForRuntime_mustacheStringTemplate), z.lazy(() =>transformerForRuntime_objectValues), z.lazy(() =>transformerForRuntime_unique)]);
export const transformerForBuildOrRuntime: z.ZodType<TransformerForBuildOrRuntime> = z.union([z.lazy(() =>transformerForBuild), z.lazy(() =>transformerForRuntime)]);
export const actionHandler: z.ZodType<ActionHandler> = z.object({interface:z.object({actionJzodObjectSchema:z.lazy(() =>jzodObject)}).strict(), implementation:z.object({templates:z.record(z.string(),z.any()).optional(), compositeActionTemplate:z.lazy(() =>compositeActionTemplate)}).strict()}).strict();
export const transformer_menu_addItem: z.ZodType<Transformer_menu_addItem> = z.object({transformerType:z.literal("transformer_menu_addItem"), interpolation:z.literal("runtime"), transformerDefinition:z.object({menuReference:z.union([z.string(), z.lazy(() =>transformerForRuntime_InnerReference)]), menuItemReference:z.union([z.string(), z.lazy(() =>transformerForRuntime_InnerReference)]), menuSectionInsertionIndex:z.number().optional(), menuSectionItemInsertionIndex:z.number().optional()}).strict()}).strict();
export const extendedTransformerForRuntime: z.ZodType<ExtendedTransformerForRuntime> = z.union([z.lazy(() =>transformerForRuntime), z.lazy(() =>transformer_menu_addItem)]);
export const ______________________________________________miroirMetaModel_____________________________________________: z.ZodType<______________________________________________miroirMetaModel_____________________________________________> = z.never();
export const entityAttributeExpandedType: z.ZodType<EntityAttributeExpandedType> = z.enum(["UUID","STRING","BOOLEAN","OBJECT"]);
export const entityAttributeType: z.ZodType<EntityAttributeType> = z.union([z.lazy(() =>entityInstance), z.enum(["ENTITY_INSTANCE_UUID","ARRAY"])]);
export const entityAttributeUntypedCore = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean()}).strict();
export const entityAttributeCore = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean()}).strict().extend({type:z.lazy(() =>entityAttributeExpandedType)}).strict();
export const entityArrayAttribute = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean()}).strict().extend({type:z.literal("ARRAY"), lineFormat:z.array(z.lazy(() =>entityAttributeCore))}).strict();
export const entityForeignKeyAttribute = z.object({id:z.number(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), editable:z.boolean(), nullable:z.boolean()}).strict().extend({type:z.literal("ENTITY_INSTANCE_UUID"), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().uuid()}).strict();
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
export const application: z.ZodType<Application> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), selfApplication:z.string().uuid()}).strict();
export const applicationVersion: z.ZodType<ApplicationVersion> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string().optional(), description:z.string().optional(), type:z.string().optional(), application:z.string().uuid(), branch:z.string().uuid(), previousVersion:z.string().uuid().optional(), modelStructureMigration:z.array(z.record(z.string(),z.any())).optional(), modelCUDMigration:z.array(z.record(z.string(),z.any())).optional()}).strict();
export const bundle: z.ZodType<Bundle> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid(), name:z.string(), contents:z.union([z.object({type:z.literal("runtime")}).strict(), z.object({type:z.literal("development"), applicationVersion:z.lazy(() =>applicationVersion)}).strict()])}).strict();
export const deployment: z.ZodType<Deployment> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), application:z.string().uuid(), bundle:z.string().uuid(), configuration:z.lazy(() =>storeUnitConfiguration).optional(), model:z.lazy(() =>jzodObject).optional(), data:z.lazy(() =>jzodObject).optional()}).strict();
export const entity: z.ZodType<Entity> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), application:z.string().uuid().optional(), name:z.string(), author:z.string().uuid().optional(), description:z.string().optional()}).strict();
export const entityDefinition: z.ZodType<EntityDefinition> = z.object({uuid:z.string().uuid(), parentName:z.string(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), entityUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), description:z.string().optional(), defaultInstanceDetailsReportUuid:z.string().uuid().optional(), viewAttributes:z.array(z.string()).optional(), jzodSchema:z.lazy(() =>jzodObject)}).strict();
export const miroirMenuItem: z.ZodType<MiroirMenuItem> = z.object({label:z.string(), section:z.lazy(() =>applicationSection), application:z.string(), reportUuid:z.string(), instanceUuid:z.string().optional(), icon:z.string()}).strict();
export const menuItemArray: z.ZodType<MenuItemArray> = z.array(z.lazy(() =>miroirMenuItem));
export const sectionOfMenu: z.ZodType<SectionOfMenu> = z.object({title:z.string(), label:z.string(), items:z.lazy(() =>menuItemArray)}).strict();
export const simpleMenu: z.ZodType<SimpleMenu> = z.object({menuType:z.literal("simpleMenu"), definition:z.lazy(() =>menuItemArray)}).strict();
export const complexMenu: z.ZodType<ComplexMenu> = z.object({menuType:z.literal("complexMenu"), definition:z.array(z.lazy(() =>sectionOfMenu))}).strict();
export const menuDefinition: z.ZodType<MenuDefinition> = z.union([z.lazy(() =>simpleMenu), z.lazy(() =>complexMenu)]);
export const menu: z.ZodType<Menu> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional(), definition:z.lazy(() =>menuDefinition)}).strict();
export const objectInstanceReportSection: z.ZodType<ObjectInstanceReportSection> = z.object({type:z.literal("objectInstanceReportSection"), combinerTemplates:z.lazy(() =>queryTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), definition:z.object({label:z.string().optional(), parentUuid:z.string(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>queryTemplateSelectObject).optional()}).strict()}).strict();
export const objectListReportSection: z.ZodType<ObjectListReportSection> = z.object({type:z.literal("objectListReportSection"), definition:z.object({label:z.string().optional(), parentName:z.string().optional(), parentUuid:z.string().uuid(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>queryTemplateSelectObject).optional(), sortByAttribute:z.string().optional()}).strict()}).strict();
export const gridReportSection: z.ZodType<GridReportSection> = z.object({type:z.literal("grid"), combinerTemplates:z.lazy(() =>queryTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), selectData:z.lazy(() =>queryTemplateRecord).optional(), definition:z.array(z.array(z.lazy(() =>reportSection)))}).strict();
export const listReportSection: z.ZodType<ListReportSection> = z.object({type:z.literal("list"), combinerTemplates:z.lazy(() =>queryTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), selectData:z.lazy(() =>queryTemplateRecord).optional(), definition:z.array(z.union([z.lazy(() =>objectInstanceReportSection), z.lazy(() =>objectListReportSection)]))}).strict();
export const reportSection: z.ZodType<ReportSection> = z.union([z.lazy(() =>gridReportSection), z.lazy(() =>listReportSection), z.lazy(() =>objectListReportSection), z.lazy(() =>objectInstanceReportSection)]);
export const rootReport: z.ZodType<RootReport> = z.object({reportParametersToFetchQueryParametersTransformer:z.record(z.string(),z.string()).optional(), reportParameters:z.record(z.string(),z.string()).optional(), extractorTemplates:z.record(z.string(),z.lazy(() =>queryTemplateSelectExtractorWrapper)).optional(), extractors:z.record(z.string(),z.lazy(() =>extractorWrapper)).optional(), combiners:z.lazy(() =>queryRecord).optional(), combinerTemplates:z.lazy(() =>queryTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), section:z.lazy(() =>reportSection)}).strict();
export const jzodObjectOrReference: z.ZodType<JzodObjectOrReference> = z.union([z.lazy(() =>jzodReference), z.lazy(() =>jzodObject)]);
export const jzodSchema: z.ZodType<JzodSchema> = z.object({uuid:z.string().uuid(), parentName:z.string(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), defaultLabel:z.string().optional(), description:z.string().optional(), definition:z.lazy(() =>jzodObjectOrReference).optional()}).strict();
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), name:z.string(), defaultLabel:z.string(), type:z.enum(["list","grid"]).optional(), application:z.string().uuid().optional(), definition:z.object({reportParametersToFetchQueryParametersTransformer:z.record(z.string(),z.string()).optional(), reportParameters:z.record(z.string(),z.string()).optional(), extractorTemplates:z.record(z.string(),z.lazy(() =>queryTemplateSelectExtractorWrapper)).optional(), extractors:z.record(z.string(),z.lazy(() =>extractorWrapper)).optional(), combiners:z.lazy(() =>queryRecord).optional(), combinerTemplates:z.lazy(() =>queryTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>transformerForRuntime)).optional(), section:z.lazy(() =>reportSection)}).strict()}).strict();
export const metaModel: z.ZodType<MetaModel> = z.object({applicationVersions:z.array(z.lazy(() =>applicationVersion)), applicationVersionCrossEntityDefinition:z.array(z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), applicationVersion:z.string().uuid(), entityDefinition:z.string().uuid()}).strict()), configuration:z.array(z.lazy(() =>storeBasedConfiguration)), entities:z.array(z.lazy(() =>entity)), entityDefinitions:z.array(z.lazy(() =>entityDefinition)), jzodSchemas:z.array(z.lazy(() =>jzodSchema)), menus:z.array(z.lazy(() =>menu)), reports:z.array(z.lazy(() =>report))}).strict();
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
export const miroirConfigClient: z.ZodType<MiroirConfigClient> = z.object({client:z.union([z.lazy(() =>miroirConfigForMswClient), z.lazy(() =>miroirConfigForRestClient)])}).strict();
export const miroirConfigServer: z.ZodType<MiroirConfigServer> = z.object({server:z.object({rootApiUrl:z.string()}).strict()}).strict();
export const miroirConfig: z.ZodType<MiroirConfig> = z.union([z.literal("miroirConfigClient"), z.literal("miroirConfigServer")]);
export const commit: z.ZodType<Commit> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), date:z.date(), application:z.string().uuid().optional(), name:z.string(), preceding:z.string().uuid().optional(), branch:z.string().uuid().optional(), author:z.string().uuid().optional(), description:z.string().optional(), actions:z.array(z.object({endpoint:z.string().uuid(), actionArguments:z.lazy(() =>modelAction)}).strict()), patches:z.array(z.any())}).strict();
export const miroirAllFundamentalTypesUnion: z.ZodType<MiroirAllFundamentalTypesUnion> = z.union([z.lazy(() =>applicationSection), z.lazy(() =>entityInstance), z.lazy(() =>entityInstanceCollection), z.lazy(() =>instanceAction)]);
export const ______________________________________________queries_____________________________________________: z.ZodType<______________________________________________queries_____________________________________________> = z.never();
export const queryFailed: z.ZodType<QueryFailed> = z.object({queryFailure:z.enum(["QueryNotExecutable","DomainStateNotLoaded","IncorrectParameters","DeploymentNotFound","ApplicationSectionNotFound","EntityNotFound","InstanceNotFound","ReferenceNotFound","ReferenceFoundButUndefined","ReferenceFoundButAttributeUndefinedOnFoundObject"]), query:z.string().optional(), failureOrigin:z.array(z.string()).optional(), failureMessage:z.string().optional(), queryReference:z.string().optional(), queryParameters:z.string().optional(), queryContext:z.string().optional(), deploymentUuid:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().optional(), instanceUuid:z.string().optional()}).strict();
export const queryTemplateConstant: z.ZodType<QueryTemplateConstant> = z.union([z.object({queryTemplateType:z.literal("constantString"), definition:z.string()}).strict(), z.object({queryTemplateType:z.literal("constantNumber"), definition:z.number()}).strict(), z.object({queryTemplateType:z.literal("constantObject"), definition:z.record(z.string(),z.any())}).strict(), z.object({queryTemplateType:z.literal("constantUuid"), constantUuidValue:z.string().uuid()}).strict()]);
export const queryContextReference: z.ZodType<QueryContextReference> = z.object({queryType:z.literal("queryContextReference"), queryReference:z.string()}).strict();
export const queryTemplateContextReference: z.ZodType<QueryTemplateContextReference> = z.object({queryTemplateType:z.literal("queryTemplateContextReference"), referenceName:z.string()}).strict();
export const queryTemplateParameterReference: z.ZodType<QueryTemplateParameterReference> = z.object({queryTemplateType:z.literal("queryTemplateParameterReference"), referenceName:z.string()}).strict();
export const queryTemplateConstantOrParameterReference: z.ZodType<QueryTemplateConstantOrParameterReference> = z.union([z.lazy(() =>queryTemplateConstant), z.lazy(() =>queryTemplateParameterReference)]);
export const queryTemplateConstantOrAnyReference: z.ZodType<QueryTemplateConstantOrAnyReference> = z.union([z.lazy(() =>queryTemplateConstant), z.lazy(() =>queryTemplateContextReference), z.lazy(() =>queryTemplateParameterReference)]);
export const queryTemplateRoot: z.ZodType<QueryTemplateRoot> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.union([z.string(), z.lazy(() =>transformer_InnerReference)])}).strict();
export const queryTemplateSelectObjectByRelation: z.ZodType<QueryTemplateSelectObjectByRelation> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.union([z.string(), z.lazy(() =>transformer_InnerReference)])}).strict().extend({queryType:z.literal("combinerForObjectByRelation"), objectReference:z.lazy(() =>transformerForRuntime_InnerReference), AttributeOfObjectToCompareToReferenceUuid:z.string()}).strict();
export const queryTemplateExtractObjectByDirectReference: z.ZodType<QueryTemplateExtractObjectByDirectReference> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.union([z.string(), z.lazy(() =>transformer_InnerReference)])}).strict().extend({queryType:z.literal("extractorForObjectByDirectReference"), instanceUuid:z.lazy(() =>transformer_InnerReference)}).strict();
export const queryTemplateSelectObject: z.ZodType<QueryTemplateSelectObject> = z.union([z.lazy(() =>queryTemplateSelectObjectByRelation), z.lazy(() =>queryTemplateExtractObjectByDirectReference)]);
export const extractorTemplateForObjectListByEntity: z.ZodType<ExtractorTemplateForObjectListByEntity> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.union([z.string(), z.lazy(() =>transformer_InnerReference)])}).strict().extend({queryType:z.literal("extractorTemplateForObjectListByEntity"), filter:z.object({attributeName:z.string(), value:z.lazy(() =>transformer_constantString)}).strict().optional()}).strict();
export const queryTemplateSelectObjectListByRelation: z.ZodType<QueryTemplateSelectObjectListByRelation> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.union([z.string(), z.lazy(() =>transformer_InnerReference)])}).strict().extend({queryType:z.literal("combinerByRelationReturningObjectList"), objectReference:z.lazy(() =>transformerForRuntime_InnerReference), objectReferenceAttribute:z.string().optional(), AttributeOfListObjectToCompareToReferenceUuid:z.string()}).strict();
export const queryTemplateSelectObjectListByManyToManyRelation: z.ZodType<QueryTemplateSelectObjectListByManyToManyRelation> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.union([z.string(), z.lazy(() =>transformer_InnerReference)])}).strict().extend({queryType:z.literal("combinerByManyToManyRelationReturningObjectList"), objectListReference:z.lazy(() =>transformer_contextReference), objectListReferenceAttribute:z.string().optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.string().optional()}).strict();
export const queryTemplateSelectObjectList: z.ZodType<QueryTemplateSelectObjectList> = z.union([z.lazy(() =>extractorTemplateForObjectListByEntity), z.lazy(() =>queryTemplateSelectObjectListByRelation), z.lazy(() =>queryTemplateSelectObjectListByManyToManyRelation)]);
export const queryTemplateSelectByQueryCombiner: z.ZodType<QueryTemplateSelectByQueryCombiner> = z.object({queryType:z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), rootExtractorOrReference:z.union([z.lazy(() =>queryTemplate), z.string()]), subQueryTemplate:z.object({query:z.lazy(() =>queryTemplate), rootQueryObjectTransformer:z.lazy(() =>recordOfTransformers)}).strict()}).strict();
export const queryTemplateSelectExtractorWrapperReturningObject: z.ZodType<QueryTemplateSelectExtractorWrapperReturningObject> = z.union([z.lazy(() =>queryTemplateExtractObjectByDirectReference), z.object({queryType:z.literal("extractorWrapperReturningObject"), definition:z.record(z.string(),z.lazy(() =>queryTemplateSelectExtractorWrapperReturningObject))}).strict()]);
export const queryTemplateSelectExtractorWrapperReturningList: z.ZodType<QueryTemplateSelectExtractorWrapperReturningList> = z.union([z.lazy(() =>extractorTemplateForObjectListByEntity), z.object({queryType:z.literal("extractorWrapperReturningList"), definition:z.array(z.lazy(() =>queryTemplateSelectExtractorWrapperReturningList))}).strict()]);
export const queryTemplateSelectExtractorWrapper: z.ZodType<QueryTemplateSelectExtractorWrapper> = z.union([z.lazy(() =>queryTemplateSelectExtractorWrapperReturningObject), z.lazy(() =>queryTemplateSelectExtractorWrapperReturningList)]);
export const queryTemplate: z.ZodType<QueryTemplate> = z.union([z.lazy(() =>queryTemplateSelectExtractorWrapper), z.lazy(() =>queryContextReference), z.object({queryType:z.literal("combiner_wrapperReturningObject"), definition:z.record(z.string(),z.lazy(() =>queryTemplate))}).strict(), z.object({queryType:z.literal("combiner_wrapperReturningList"), definition:z.array(z.lazy(() =>queryTemplate))}).strict(), z.lazy(() =>queryTemplateExtractObjectByDirectReference), z.lazy(() =>queryTemplateSelectObjectList), z.lazy(() =>queryTemplateSelectObjectByRelation), z.lazy(() =>queryTemplateSelectObjectListByRelation), z.lazy(() =>queryTemplateSelectObjectListByManyToManyRelation), z.lazy(() =>queryTemplateSelectByQueryCombiner), z.object({queryType:z.literal("literal"), definition:z.string()}).strict()]);
export const queryTemplateRecord: z.ZodType<QueryTemplateRecord> = z.record(z.string(),z.lazy(() =>queryTemplate));
export const extractorOrCombinerRoot: z.ZodType<ExtractorOrCombinerRoot> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict();
export const extractorOrCombinerContextReference: z.ZodType<ExtractorOrCombinerContextReference> = z.object({extractorOrCombinerType:z.literal("extractorOrCombinerContextReference"), extractorOrCombinerContextReference:z.string()}).strict();
export const combinerForObjectByRelation: z.ZodType<CombinerForObjectByRelation> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({extractorOrCombinerType:z.literal("combinerForObjectByRelation"), objectReference:z.string(), AttributeOfObjectToCompareToReferenceUuid:z.string()}).strict();
export const extractorForObjectByDirectReference: z.ZodType<ExtractorForObjectByDirectReference> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({extractorOrCombinerType:z.literal("extractorForObjectByDirectReference"), instanceUuid:z.string().uuid()}).strict();
export const extractorOrCombinerReturningObject: z.ZodType<ExtractorOrCombinerReturningObject> = z.union([z.lazy(() =>combinerForObjectByRelation), z.lazy(() =>extractorForObjectByDirectReference)]);
export const extractorByEntityReturningObjectList: z.ZodType<ExtractorByEntityReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({extractorOrCombinerType:z.literal("extractorByEntityReturningObjectList"), filter:z.object({attributeName:z.string(), value:z.any()}).strict().optional()}).strict();
export const extractor: z.ZodType<Extractor> = z.union([z.lazy(() =>extractorOrCombinerReturningObject), z.lazy(() =>extractorByEntityReturningObjectList)]);
export const combinerByRelationReturningObjectList: z.ZodType<CombinerByRelationReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({extractorOrCombinerType:z.literal("combinerByRelationReturningObjectList"), objectReference:z.string(), objectReferenceAttribute:z.string().optional(), AttributeOfListObjectToCompareToReferenceUuid:z.string()}).strict();
export const combinerByManyToManyRelationReturningObjectList: z.ZodType<CombinerByManyToManyRelationReturningObjectList> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({extractorOrCombinerType:z.literal("combinerByManyToManyRelationReturningObjectList"), objectListReference:z.string(), objectListReferenceAttribute:z.string().optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.string().optional()}).strict();
export const extractorOrCombinerReturningObjectList: z.ZodType<ExtractorOrCombinerReturningObjectList> = z.union([z.lazy(() =>extractorByEntityReturningObjectList), z.lazy(() =>combinerByRelationReturningObjectList), z.lazy(() =>combinerByManyToManyRelationReturningObjectList)]);
export const extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: z.ZodType<ExtractorCombinerByHeteronomousManyToManyReturningListOfObjectList> = z.object({extractorOrCombinerType:z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), rootExtractorOrReference:z.union([z.lazy(() =>extractor), z.string()]), subQueryTemplate:z.object({query:z.lazy(() =>queryTemplate), rootQueryObjectTransformer:z.lazy(() =>recordOfTransformers)}).strict()}).strict();
export const extractorWrapperReturningObject: z.ZodType<ExtractorWrapperReturningObject> = z.union([z.lazy(() =>extractorForObjectByDirectReference), z.object({extractorOrCombinerType:z.literal("extractorWrapperReturningObject"), definition:z.record(z.string(),z.lazy(() =>extractorWrapperReturningObject))}).strict()]);
export const extractorWrapperReturningList: z.ZodType<ExtractorWrapperReturningList> = z.union([z.lazy(() =>extractorByEntityReturningObjectList), z.object({extractorOrCombinerType:z.literal("extractorWrapperReturningList"), definition:z.array(z.lazy(() =>extractorWrapperReturningList))}).strict()]);
export const extractorWrapper: z.ZodType<ExtractorWrapper> = z.union([z.lazy(() =>extractorWrapperReturningObject), z.lazy(() =>extractorWrapperReturningList)]);
export const extractorOrCombiner: z.ZodType<ExtractorOrCombiner> = z.union([z.lazy(() =>extractorWrapper), z.lazy(() =>extractorOrCombinerContextReference), z.object({extractorOrCombinerType:z.literal("combiner_wrapperReturningObject"), definition:z.record(z.string(),z.lazy(() =>extractorOrCombiner))}).strict(), z.object({extractorOrCombinerType:z.literal("combiner_wrapperReturningList"), definition:z.array(z.lazy(() =>extractorOrCombiner))}).strict(), z.lazy(() =>extractorForObjectByDirectReference), z.lazy(() =>combinerForObjectByRelation), z.lazy(() =>extractorOrCombinerReturningObjectList), z.lazy(() =>extractorCombinerByHeteronomousManyToManyReturningListOfObjectList), z.object({extractorOrCombinerType:z.literal("literal"), definition:z.string()}).strict()]);
export const queryRecord: z.ZodType<QueryRecord> = z.record(z.string(),z.lazy(() =>extractorOrCombiner));
export const domainElementVoid: z.ZodType<DomainElementVoid> = z.object({elementType:z.literal("void"), elementValue:z.void()}).strict();
export const domainElementAny: z.ZodType<DomainElementAny> = z.object({elementType:z.literal("any"), elementValue:z.any()}).strict();
export const domainElementFailed: z.ZodType<DomainElementFailed> = z.object({elementType:z.literal("failure"), elementValue:z.lazy(() =>queryFailed)}).strict();
export const domainElementObject: z.ZodType<DomainElementObject> = z.object({elementType:z.literal("object"), elementValue:z.record(z.string(),z.lazy(() =>domainElement))}).strict();
export const domainElementObjectOrFailed: z.ZodType<DomainElementObjectOrFailed> = z.union([z.lazy(() =>domainElementObject), z.lazy(() =>domainElementFailed)]);
export const domainElementInstanceUuidIndex: z.ZodType<DomainElementInstanceUuidIndex> = z.object({elementType:z.literal("instanceUuidIndex"), elementValue:z.lazy(() =>entityInstancesUuidIndex)}).strict();
export const domainElementInstanceUuidIndexOrFailed: z.ZodType<DomainElementInstanceUuidIndexOrFailed> = z.union([z.lazy(() =>domainElementInstanceUuidIndex), z.lazy(() =>domainElementFailed)]);
export const domainElementEntityInstance: z.ZodType<DomainElementEntityInstance> = z.object({elementType:z.literal("instance"), elementValue:z.lazy(() =>entityInstance)}).strict();
export const domainElementEntityInstanceOrFailed: z.ZodType<DomainElementEntityInstanceOrFailed> = z.union([z.lazy(() =>domainElementEntityInstance), z.lazy(() =>domainElementFailed)]);
export const domainElementEntityInstanceCollection: z.ZodType<DomainElementEntityInstanceCollection> = z.object({elementType:z.literal("entityInstanceCollection"), elementValue:z.lazy(() =>entityInstanceCollection)}).strict();
export const domainElementEntityInstanceCollectionOrFailed: z.ZodType<DomainElementEntityInstanceCollectionOrFailed> = z.union([z.lazy(() =>domainElementEntityInstanceCollection), z.lazy(() =>domainElementFailed)]);
export const domainElementInstanceArray: z.ZodType<DomainElementInstanceArray> = z.object({elementType:z.literal("instanceArray"), elementValue:z.array(z.lazy(() =>entityInstance))}).strict();
export const domainElementInstanceArrayOrFailed: z.ZodType<DomainElementInstanceArrayOrFailed> = z.union([z.lazy(() =>domainElementInstanceArray), z.lazy(() =>domainElementFailed)]);
export const domainElementType: z.ZodType<DomainElementType> = z.enum(["any","object","instanceUuidIndex","entityInstanceCollection","instanceArray","instance","instanceUuid","instanceUuidIndexUuidIndex"]);
export const domainElement: z.ZodType<DomainElement> = z.union([z.lazy(() =>domainElementVoid), z.lazy(() =>domainElementAny), z.lazy(() =>domainElementFailed), z.lazy(() =>domainElementObjectOrFailed), z.lazy(() =>domainElementInstanceUuidIndexOrFailed), z.lazy(() =>domainElementEntityInstanceCollectionOrFailed), z.lazy(() =>domainElementInstanceArrayOrFailed), z.lazy(() =>domainElementEntityInstanceOrFailed), z.object({elementType:z.literal("instanceUuid"), elementValue:z.lazy(() =>entityInstanceUuid)}).strict(), z.object({elementType:z.literal("instanceUuidIndexUuidIndex"), elementValue:z.lazy(() =>entityInstancesUuidIndex)}).strict(), z.object({elementType:z.literal("string"), elementValue:z.string()}).strict(), z.object({elementType:z.literal("number"), elementValue:z.number()}).strict(), z.object({elementType:z.literal("array"), elementValue:z.array(z.lazy(() =>domainElement))}).strict()]);
export const localCacheExtractor: z.ZodType<LocalCacheExtractor> = z.object({queryType:z.literal("localCacheEntityInstancesExtractor"), definition:z.object({deploymentUuid:z.string().uuid().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().uuid().optional(), instanceUuid:z.string().uuid().optional()}).strict()}).strict();
export const queryRoot2: z.ZodType<QueryRoot2> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict();
export const queryForExtractorOrCombinerReturningObject: z.ZodType<QueryForExtractorOrCombinerReturningObject> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("queryForExtractorOrCombinerReturningObject"), select:z.lazy(() =>extractorOrCombinerReturningObject)}).strict();
export const queryForExtractorOrCombinerReturningObjectList: z.ZodType<QueryForExtractorOrCombinerReturningObjectList> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("queryForExtractorOrCombinerReturningObjectList"), select:z.lazy(() =>extractorOrCombinerReturningObjectList)}).strict();
export const queryForExtractorOrCombinerReturningObjectOrObjectList: z.ZodType<QueryForExtractorOrCombinerReturningObjectOrObjectList> = z.union([z.lazy(() =>queryForExtractorOrCombinerReturningObject), z.lazy(() =>queryForExtractorOrCombinerReturningObjectList)]);
export const queryWithExtractorCombinerTransformer: z.ZodType<QueryWithExtractorCombinerTransformer> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("queryWithExtractorCombinerTransformer"), runAsSql:z.boolean().optional(), extractors:z.record(z.string(),z.lazy(() =>extractorWrapper)).optional(), combiners:z.lazy(() =>queryRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>extendedTransformerForRuntime)).optional()}).strict();
export const extractorTemplateForSingleObject: z.ZodType<ExtractorTemplateForSingleObject> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("extractorTemplateForDomainModelObjects"), select:z.lazy(() =>queryTemplateSelectObject)}).strict();
export const extractorTemplateForSingleObjectList: z.ZodType<ExtractorTemplateForSingleObjectList> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("extractorTemplateForDomainModelObjects"), select:z.lazy(() =>queryTemplateSelectObjectList)}).strict();
export const extractorTemplateForDomainModelObjects: z.ZodType<ExtractorTemplateForDomainModelObjects> = z.union([z.lazy(() =>extractorTemplateForSingleObject), z.lazy(() =>extractorTemplateForSingleObjectList)]);
export const queryTemplateWithExtractorCombinerTransformer: z.ZodType<QueryTemplateWithExtractorCombinerTransformer> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("queryTemplateWithExtractorCombinerTransformer"), runAsSql:z.boolean().optional(), extractorTemplates:z.record(z.string(),z.lazy(() =>queryTemplateSelectExtractorWrapper)).optional(), combinerTemplates:z.lazy(() =>queryTemplateRecord).optional(), runtimeTransformers:z.record(z.string(),z.lazy(() =>extendedTransformerForRuntime)).optional()}).strict();
export const extractorByEntityUuidGetEntityDefinition: z.ZodType<ExtractorByEntityUuidGetEntityDefinition> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("getEntityDefinition"), deploymentUuid:z.string().uuid(), entityUuid:z.string().uuid()}).strict();
export const extractorByTemplateGetParamJzodSchema: z.ZodType<ExtractorByTemplateGetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("extractorByTemplateGetParamJzodSchema"), fetchParams:z.lazy(() =>queryTemplateWithExtractorCombinerTransformer)}).strict();
export const extractorByQuery2GetParamJzodSchema: z.ZodType<ExtractorByQuery2GetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("extractorByTemplateGetParamJzodSchema"), fetchParams:z.lazy(() =>queryWithExtractorCombinerTransformer)}).strict();
export const extractorByQueryTemplateGetParamJzodSchema: z.ZodType<ExtractorByQueryTemplateGetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("getQueryJzodSchema"), select:z.lazy(() =>queryTemplate)}).strict();
export const extractorByQueryGetParamJzodSchema: z.ZodType<ExtractorByQueryGetParamJzodSchema> = z.object({deploymentUuid:z.string().uuid(), pageParams:z.record(z.string(),z.any()), queryParams:z.record(z.string(),z.any()), contextResults:z.record(z.string(),z.any())}).strict().extend({queryType:z.literal("getQueryJzodSchema"), select:z.lazy(() =>extractorOrCombiner)}).strict();
export const domainModelQueryTemplateJzodSchemaParams: z.ZodType<DomainModelQueryTemplateJzodSchemaParams> = z.union([z.lazy(() =>extractorByEntityUuidGetEntityDefinition), z.lazy(() =>extractorByTemplateGetParamJzodSchema), z.lazy(() =>extractorByQueryTemplateGetParamJzodSchema)]);
export const domainModelQueryJzodSchemaParams: z.ZodType<DomainModelQueryJzodSchemaParams> = z.union([z.lazy(() =>extractorByEntityUuidGetEntityDefinition), z.lazy(() =>extractorByQuery2GetParamJzodSchema), z.lazy(() =>extractorByQueryGetParamJzodSchema)]);
export const extractorTemplateForDomainModelDEFUNCT: z.ZodType<ExtractorTemplateForDomainModelDEFUNCT> = z.union([z.lazy(() =>extractorTemplateForDomainModelObjects), z.lazy(() =>queryTemplateWithExtractorCombinerTransformer), z.lazy(() =>localCacheExtractor), z.lazy(() =>extractorByEntityUuidGetEntityDefinition), z.lazy(() =>extractorByTemplateGetParamJzodSchema), z.lazy(() =>extractorByQueryTemplateGetParamJzodSchema)]);
export const extractorForDomainModelDEFUNCT: z.ZodType<ExtractorForDomainModelDEFUNCT> = z.union([z.lazy(() =>queryForExtractorOrCombinerReturningObjectOrObjectList), z.lazy(() =>queryWithExtractorCombinerTransformer), z.lazy(() =>localCacheExtractor), z.lazy(() =>extractorByEntityUuidGetEntityDefinition), z.lazy(() =>extractorByQuery2GetParamJzodSchema), z.lazy(() =>extractorByQueryGetParamJzodSchema)]);
export const ______________________________________________actions_____________________________________________: z.ZodType<______________________________________________actions_____________________________________________> = z.never();
export const actionError: z.ZodType<ActionError> = z.object({status:z.literal("error"), error:z.object({errorType:z.union([z.enum(["FailedToCreateStore","FailedToDeployModule"]), z.literal("FailedToDeleteStore"), z.literal("FailedToResetAndInitMiroirAndApplicationDatabase"), z.literal("FailedToOpenStore"), z.literal("FailedToCloseStore"), z.literal("FailedToCreateInstance"), z.literal("FailedToGetInstance"), z.literal("FailedToGetInstances")]), errorMessage:z.string().optional(), error:z.object({errorMessage:z.string().optional(), stack:z.array(z.string().optional())}).strict().optional()}).strict()}).strict();
export const actionVoidSuccess: z.ZodType<ActionVoidSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElementVoid)}).strict();
export const actionVoidReturnType: z.ZodType<ActionVoidReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionVoidSuccess)]);
export const actionEntityInstanceSuccess: z.ZodType<ActionEntityInstanceSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElementEntityInstance)}).strict();
export const actionEntityInstanceReturnType: z.ZodType<ActionEntityInstanceReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionEntityInstanceSuccess)]);
export const actionEntityInstanceCollectionSuccess: z.ZodType<ActionEntityInstanceCollectionSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElementEntityInstanceCollection)}).strict();
export const actionEntityInstanceCollectionReturnType: z.ZodType<ActionEntityInstanceCollectionReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionEntityInstanceCollectionSuccess)]);
export const actionSuccess: z.ZodType<ActionSuccess> = z.object({status:z.literal("ok"), returnedDomainElement:z.lazy(() =>domainElement)}).strict();
export const actionReturnType: z.ZodType<ActionReturnType> = z.union([z.lazy(() =>actionError), z.lazy(() =>actionSuccess)]);
export const modelActionInitModelParams: z.ZodType<ModelActionInitModelParams> = z.object({metaModel:z.lazy(() =>metaModel), dataStoreType:z.lazy(() =>dataStoreType), application:z.lazy(() =>application), applicationDeploymentConfiguration:z.lazy(() =>entityInstance), applicationModelBranch:z.lazy(() =>entityInstance), applicationVersion:z.lazy(() =>entityInstance), applicationStoreBasedConfiguration:z.lazy(() =>entityInstance)}).strict();
export const modelActionCommit: z.ZodType<ModelActionCommit> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("commit"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionRollback: z.ZodType<ModelActionRollback> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("rollback"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionInitModel: z.ZodType<ModelActionInitModel> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("initModel"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid(), params:z.object({metaModel:z.lazy(() =>metaModel), dataStoreType:z.lazy(() =>dataStoreType), application:z.lazy(() =>application), applicationDeploymentConfiguration:z.lazy(() =>entityInstance), applicationModelBranch:z.lazy(() =>entityInstance), applicationVersion:z.lazy(() =>entityInstance), applicationStoreBasedConfiguration:z.lazy(() =>entityInstance)}).strict()}).strict();
export const modelActionResetModel: z.ZodType<ModelActionResetModel> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetModel"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionResetData: z.ZodType<ModelActionResetData> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetData"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict();
export const modelActionAlterEntityAttribute: z.ZodType<ModelActionAlterEntityAttribute> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("alterEntityAttribute"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string(), entityUuid:z.string(), entityDefinitionUuid:z.string(), addColumns:z.array(z.object({name:z.string(), definition:z.lazy(() =>jzodElement)}).strict()).optional(), removeColumns:z.array(z.string()).optional(), update:z.lazy(() =>jzodElement).optional()}).strict();
export const modelActionCreateEntity: z.ZodType<ModelActionCreateEntity> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("createEntity"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entities:z.array(z.object({entity:z.lazy(() =>entity), entityDefinition:z.lazy(() =>entityDefinition)}).strict())}).strict();
export const modelActionDropEntity: z.ZodType<ModelActionDropEntity> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("dropEntity"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), entityUuid:z.string(), entityDefinitionUuid:z.string()}).strict();
export const modelActionRenameEntity: z.ZodType<ModelActionRenameEntity> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("renameEntity"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string().optional(), entityUuid:z.string(), entityDefinitionUuid:z.string(), targetValue:z.string()}).strict();
export const modelAction: z.ZodType<ModelAction> = z.union([z.object({actionType:z.literal("modelAction"), actionName:z.literal("initModel"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid(), params:z.object({metaModel:z.lazy(() =>metaModel), dataStoreType:z.lazy(() =>dataStoreType), application:z.lazy(() =>application), applicationDeploymentConfiguration:z.lazy(() =>entityInstance), applicationModelBranch:z.lazy(() =>entityInstance), applicationVersion:z.lazy(() =>entityInstance), applicationStoreBasedConfiguration:z.lazy(() =>entityInstance)}).strict()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("commit"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("rollback"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("remoteLocalCacheRollback"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetModel"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("resetData"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("alterEntityAttribute"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string(), entityUuid:z.string(), entityDefinitionUuid:z.string(), addColumns:z.array(z.object({name:z.string(), definition:z.lazy(() =>jzodElement)}).strict()).optional(), removeColumns:z.array(z.string()).optional(), update:z.lazy(() =>jzodElement).optional()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("renameEntity"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entityName:z.string().optional(), entityUuid:z.string(), entityDefinitionUuid:z.string(), targetValue:z.string()}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("createEntity"), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), entities:z.array(z.object({entity:z.lazy(() =>entity), entityDefinition:z.lazy(() =>entityDefinition)}).strict())}).strict(), z.object({actionType:z.literal("modelAction"), actionName:z.literal("dropEntity"), transactional:z.boolean().optional(), deploymentUuid:z.string().uuid(), endpoint:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), entityUuid:z.string(), entityDefinitionUuid:z.string()}).strict()]);
export const instanceCUDAction: z.ZodType<InstanceCUDAction> = z.union([z.object({actionType:z.literal("instanceAction"), actionName:z.literal("createInstance"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("deleteInstance"), deploymentUuid:z.string().uuid(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("updateInstance"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict()]);
export const instanceAction: z.ZodType<InstanceAction> = z.union([z.object({actionType:z.literal("instanceAction"), actionName:z.literal("createInstance"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("deleteInstance"), deploymentUuid:z.string().uuid(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("deleteInstanceWithCascade"), deploymentUuid:z.string().uuid(), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("updateInstance"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("loadNewInstancesInLocalCache"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("getInstance"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), parentUuid:z.string().uuid(), uuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("instanceAction"), actionName:z.literal("getInstances"), endpoint:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), parentUuid:z.string().uuid()}).strict()]);
export const undoRedoAction: z.ZodType<UndoRedoAction> = z.union([z.object({actionType:z.literal("undoRedoAction"), actionName:z.literal("undo"), endpoint:z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("undoRedoAction"), actionName:z.literal("redo"), endpoint:z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), deploymentUuid:z.string().uuid()}).strict()]);
export const transactionalInstanceAction: z.ZodType<TransactionalInstanceAction> = z.object({actionType:z.literal("transactionalInstanceAction"), deploymentUuid:z.string().uuid().optional(), instanceAction:z.lazy(() =>instanceCUDAction)}).strict();
export const localCacheAction: z.ZodType<LocalCacheAction> = z.union([z.lazy(() =>undoRedoAction), z.lazy(() =>modelAction), z.lazy(() =>instanceAction), z.lazy(() =>transactionalInstanceAction)]);
export const storeManagementAction: z.ZodType<StoreManagementAction> = z.union([z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("createStore"), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), configuration:z.lazy(() =>storeUnitConfiguration), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("deleteStore"), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deploymentUuid:z.string().uuid(), configuration:z.lazy(() =>storeUnitConfiguration)}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("resetAndInitMiroirAndApplicationDatabase"), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deployments:z.array(z.lazy(() =>deployment)), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("openStore"), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), configuration:z.record(z.string(),z.lazy(() =>storeUnitConfiguration)), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("storeManagementAction"), actionName:z.literal("closeStore"), endpoint:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deploymentUuid:z.string().uuid()}).strict()]);
export const persistenceAction: z.ZodType<PersistenceAction> = z.union([z.object({actionType:z.literal("LocalPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict(), z.object({actionType:z.literal("RestPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict(), z.lazy(() =>queryAction), z.lazy(() =>queryTemplateAction), z.lazy(() =>bundleAction), z.lazy(() =>instanceAction), z.lazy(() =>modelAction), z.lazy(() =>storeManagementAction)]);
export const localPersistenceAction: z.ZodType<LocalPersistenceAction> = z.object({actionType:z.literal("LocalPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict();
export const restPersistenceAction: z.ZodType<RestPersistenceAction> = z.object({actionType:z.literal("RestPersistenceAction"), actionName:z.enum(["create","read","update","delete"]), endpoint:z.literal("a93598b3-19b6-42e8-828c-f02042d212d4"), section:z.lazy(() =>applicationSection), deploymentUuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().optional(), uuid:z.string().optional(), objects:z.array(z.lazy(() =>entityInstance).optional()).optional()}).strict();
export const queryTemplateAction: z.ZodType<QueryTemplateAction> = z.object({actionType:z.literal("queryTemplateAction"), actionName:z.literal("runQuery"), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.union([z.lazy(() =>extractorTemplateForDomainModelObjects), z.lazy(() =>queryTemplateWithExtractorCombinerTransformer)])}).strict();
export const queryAction: z.ZodType<QueryAction> = z.object({actionType:z.literal("queryAction"), actionName:z.literal("runQuery"), endpoint:z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), applicationSection:z.lazy(() =>applicationSection).optional(), deploymentUuid:z.string().uuid(), query:z.union([z.lazy(() =>queryForExtractorOrCombinerReturningObjectOrObjectList), z.lazy(() =>queryWithExtractorCombinerTransformer)])}).strict();
export const compositeActionDefinition: z.ZodType<CompositeActionDefinition> = z.array(z.union([z.object({compositeActionType:z.literal("domainAction"), compositeActionStepLabel:z.string().optional(), domainAction:z.lazy(() =>domainAction)}).strict(), z.object({compositeActionType:z.literal("compositeAction"), compositeActionStepLabel:z.string().optional(), compositeActionTemplate:z.lazy(() =>compositeAction)}).strict(), z.object({compositeActionType:z.literal("query"), compositeActionStepLabel:z.string().optional(), nameGivenToResult:z.string(), query:z.lazy(() =>queryAction)}).strict(), z.object({compositeActionType:z.literal("queryTemplate"), compositeActionStepLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>queryTemplateAction)}).strict()]));
export const compositeAction: z.ZodType<CompositeAction> = z.object({actionType:z.literal("compositeAction"), actionName:z.literal("sequence"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid().optional(), templates:z.record(z.string(),z.any()).optional(), definition:z.array(z.union([z.object({compositeActionType:z.literal("domainAction"), compositeActionStepLabel:z.string().optional(), domainAction:z.lazy(() =>domainAction)}).strict(), z.object({compositeActionType:z.literal("compositeAction"), compositeActionStepLabel:z.string().optional(), compositeActionTemplate:z.lazy(() =>compositeAction)}).strict(), z.object({compositeActionType:z.literal("query"), compositeActionStepLabel:z.string().optional(), nameGivenToResult:z.string(), query:z.lazy(() =>queryAction)}).strict(), z.object({compositeActionType:z.literal("queryTemplate"), compositeActionStepLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>queryTemplateAction)}).strict()]))}).strict();
export const domainAction: z.ZodType<DomainAction> = z.union([z.lazy(() =>undoRedoAction), z.lazy(() =>storeOrBundleAction), z.lazy(() =>modelAction), z.lazy(() =>instanceAction), z.object({actionType:z.literal("transactionalInstanceAction"), deploymentUuid:z.string().uuid().optional(), instanceAction:z.lazy(() =>instanceCUDAction)}).strict(), z.object({actionType:z.literal("compositeAction"), actionName:z.literal("sequence"), actionLabel:z.string().optional(), deploymentUuid:z.string().uuid().optional(), templates:z.record(z.string(),z.any()).optional(), definition:z.array(z.union([z.object({compositeActionType:z.literal("domainAction"), compositeActionStepLabel:z.string().optional(), domainAction:z.lazy(() =>domainAction)}).strict(), z.object({compositeActionType:z.literal("compositeAction"), compositeActionStepLabel:z.string().optional(), compositeActionTemplate:z.lazy(() =>compositeAction)}).strict(), z.object({compositeActionType:z.literal("query"), compositeActionStepLabel:z.string().optional(), nameGivenToResult:z.string(), query:z.lazy(() =>queryAction)}).strict(), z.object({compositeActionType:z.literal("queryTemplate"), compositeActionStepLabel:z.string().optional(), nameGivenToResult:z.string(), queryTemplate:z.lazy(() =>queryTemplateAction)}).strict()]))}).strict()]);
export const modelActionReplayableAction: z.ZodType<ModelActionReplayableAction> = z.union([z.lazy(() =>modelActionAlterEntityAttribute), z.lazy(() =>modelActionCreateEntity), z.lazy(() =>modelActionDropEntity), z.lazy(() =>modelActionRenameEntity)]);
export const bundleAction: z.ZodType<BundleAction> = z.union([z.object({actionType:z.literal("bundleAction"), actionName:z.literal("createBundle"), deploymentUuid:z.string().uuid()}).strict(), z.object({actionType:z.literal("bundleAction"), actionName:z.literal("deleteBundle"), deploymentUuid:z.string().uuid()}).strict()]);
export const storeOrBundleAction: z.ZodType<StoreOrBundleAction> = z.union([z.lazy(() =>storeManagementAction), z.lazy(() =>bundleAction)]);
export const actionTransformer: z.ZodType<ActionTransformer> = z.object({transformerType:z.literal("actionTransformer")}).strict();
export const dataTransformer: z.ZodType<DataTransformer> = z.object({transformerType:z.literal("dataTransformer")}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject_extend> = z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRoot2_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRoot2_extend> = z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRoot_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRoot_extend> = z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_orderBy_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_orderBy_extend> = z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique_extend> = z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("unique"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count_extend> = z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("count"), z.lazy(() =>carryOnObject)]), groupBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement_extend> = z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("listPickElement"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)]), index:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract_extend> = z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer_extend> = z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_referencingTransformer_extend: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_referencingTransformer_extend> = z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict();
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodBaseObject> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("array"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.enum(["any","bigint","boolean","never","null","uuid","undefined","unknown","void"]), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["min","max"]), z.lazy(() =>carryOnObject)]), parameter:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("date"), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), validations:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeDateValidations)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["gt","gte","lt","lte","int","positive","nonpositive","negative","nonnegative","multipleOf","finite","safe"]), z.lazy(() =>carryOnObject)]), parameter:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("number"), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), validations:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeNumberValidations)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.enum(["max","min","length","email","url","emoji","uuid","cuid","cuid2","ulid","regex","includes","startsWith","endsWith","datetime","ip"]), z.lazy(() =>carryOnObject)]), parameter:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("string"), z.lazy(() =>carryOnObject)]), coerce:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), validations:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributeStringValidations)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodArray), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPlainAttribute), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainDateWithValidations), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainNumberWithValidations), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodAttributePlainStringWithValidations), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnum> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("enum"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumAttributeTypes> = z.union([z.enum(["any","bigint","boolean","date","never","null","number","string","uuid","undefined","unknown","void"]), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodEnumElementTypes> = z.union([z.enum(["array","date","enum","function","lazy","literal","intersection","map","number","object","promise","record","schemaReference","set","string","tuple","union"]), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("function"), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({args:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)]), returns:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLazy> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("lazy"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodFunction)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodLiteral> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("literal"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.number(), z.bigint(), z.boolean(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodIntersection> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("intersection"), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({left:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement), right:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodMap> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("map"), z.lazy(() =>carryOnObject)]), definition:z.union([z.tuple([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)]), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({extend:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference).optional(), type:z.union([z.literal("object"), z.lazy(() =>carryOnObject)]), nonStrict:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), partial:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), carryOn:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodPromise> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("promise"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodRecord> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("record"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("schemaReference"), z.lazy(() =>carryOnObject)]), context:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)).optional(), z.lazy(() =>carryOnObject)]).optional(), carryOn:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.lazy(() =>carryOnObject), z.object({eager:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), partial:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), relativePath:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), absolutePath:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSet> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("set"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodTuple> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("tuple"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodUnion> = z.union([z.lazy(() =>carryOnObject), z.object({optional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), nullable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), tag:z.object({optional:z.boolean().optional(), value:z.object({id:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), initializeTo:z.union([z.any().optional(), z.lazy(() =>carryOnObject)]).optional(), targetEntity:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), editable:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().optional(), schema:z.object({optional:z.boolean().optional(), metaSchema:z.lazy(() =>jzodElement).optional(), valueSchema:z.lazy(() =>jzodElement).optional()}).strict().optional()}).strict().optional()}).strict().extend({type:z.union([z.literal("union"), z.lazy(() =>carryOnObject)]), discriminator:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), discriminatorNew:z.union([z.object({discriminatorType:z.union([z.literal("string"), z.lazy(() =>carryOnObject)]), value:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.object({discriminatorType:z.union([z.literal("array"), z.lazy(() =>carryOnObject)]), value:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]).optional(), carryOn:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject).optional(), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType> = z.union([z.enum(["miroir","app"]), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), selfApplication:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), type:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), application:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), branch:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), previousVersion:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), modelStructureMigration:z.union([z.array(z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), modelCUDMigration:z.union([z.array(z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuDefinition> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), application:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), author:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string(), z.lazy(() =>carryOnObject)]), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), defaultInstanceDetailsReportUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), viewAttributes:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), jzodSchema:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection> = z.union([z.literal("model"), z.literal("data"), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid> = z.union([z.string(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex> = z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), application:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), bundle:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), configuration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration).optional(), model:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject).optional(), data:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("void"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.void(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny> = z.union([z.lazy(() =>carryOnObject), z.object({elementType:z.union([z.literal("any"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]);
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
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementVoid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementAny), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementFailed), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementObjectOrFailed), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceUuidIndexOrFailed), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceCollectionOrFailed), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementInstanceArrayOrFailed), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElementEntityInstanceOrFailed), z.object({elementType:z.union([z.literal("instanceUuid"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceUuid)}).strict(), z.object({elementType:z.union([z.literal("instanceUuidIndexUuidIndex"), z.lazy(() =>carryOnObject)]), elementValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstancesUuidIndex)}).strict(), z.object({elementType:z.union([z.literal("string"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.object({elementType:z.union([z.literal("number"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict(), z.object({elementType:z.union([z.literal("array"), z.lazy(() =>carryOnObject)]), elementValue:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainElement)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection> = z.union([z.lazy(() =>carryOnObject), z.object({parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), instances:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string(), z.lazy(() =>carryOnObject)]), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), description:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string(), z.lazy(() =>carryOnObject)]), section:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), application:z.union([z.string(), z.lazy(() =>carryOnObject)]), reportUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), instanceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), icon:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray> = z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_miroirMenuItem)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu> = z.union([z.lazy(() =>carryOnObject), z.object({title:z.union([z.string(), z.lazy(() =>carryOnObject)]), label:z.union([z.string(), z.lazy(() =>carryOnObject)]), items:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_simpleMenu> = z.union([z.lazy(() =>carryOnObject), z.object({menuType:z.union([z.literal("simpleMenu"), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menuItemArray)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_complexMenu> = z.union([z.lazy(() =>carryOnObject), z.object({menuType:z.union([z.literal("complexMenu"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sectionOfMenu)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObjectOrReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodObject), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("objectInstanceReportSection"), z.lazy(() =>carryOnObject)]), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), fetchedDataReference:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("objectListReportSection"), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), fetchedDataReference:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject).optional(), sortByAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("grid"), z.lazy(() =>carryOnObject)]), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), selectData:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), definition:z.union([z.array(z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection)), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection> = z.union([z.lazy(() =>carryOnObject), z.object({type:z.union([z.literal("list"), z.lazy(() =>carryOnObject)]), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), selectData:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), definition:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_gridReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_listReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectListReportSection), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_objectInstanceReportSection), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport> = z.union([z.lazy(() =>carryOnObject), z.object({reportParametersToFetchQueryParametersTransformer:z.union([z.record(z.string(),z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), reportParameters:z.union([z.record(z.string(),z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), extractorTemplates:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper)).optional(), z.lazy(() =>carryOnObject)]).optional(), extractors:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper)).optional(), z.lazy(() =>carryOnObject)]).optional(), combiners:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord).optional(), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional(), section:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_reportSection)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentDefinitionVersionUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), name:z.union([z.string(), z.lazy(() =>carryOnObject)]), defaultLabel:z.union([z.string(), z.lazy(() =>carryOnObject)]), type:z.union([z.enum(["list","grid"]).optional(), z.lazy(() =>carryOnObject)]).optional(), application:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_rootReport)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer> = z.union([z.object({transformerType:z.union([z.literal("objectTransformer"), z.lazy(() =>carryOnObject)]), attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("recordOfTransformers"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel> = z.union([z.lazy(() =>carryOnObject), z.object({applicationVersions:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationVersion)), z.lazy(() =>carryOnObject)]), applicationVersionCrossEntityDefinition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), applicationVersion:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entityDefinition:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()])), z.lazy(() =>carryOnObject)]), configuration:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration)), z.lazy(() =>carryOnObject)]), entities:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity)), z.lazy(() =>carryOnObject)]), entityDefinitions:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition)), z.lazy(() =>carryOnObject)]), jzodSchemas:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodSchema)), z.lazy(() =>carryOnObject)]), menus:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_menu)), z.lazy(() =>carryOnObject)]), reports:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_report)), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({emulatedServerType:z.union([z.literal("indexedDb"), z.lazy(() =>carryOnObject)]), indexedDbName:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({emulatedServerType:z.union([z.literal("filesystem"), z.lazy(() =>carryOnObject)]), directory:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({emulatedServerType:z.union([z.literal("sql"), z.lazy(() =>carryOnObject)]), connectionString:z.union([z.string(), z.lazy(() =>carryOnObject)]), schema:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeBasedConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), conceptLevel:z.union([z.enum(["MetaModel","Model","Data"]).optional(), z.lazy(() =>carryOnObject)]).optional(), defaultLabel:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), definition:z.union([z.lazy(() =>carryOnObject), z.object({currentApplicationVersion:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration> = z.union([z.lazy(() =>carryOnObject), z.object({admin:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration), model:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration), data:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeSectionConfiguration> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_indexedDbStoreSectionConfiguration), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_filesystemDbStoreSectionConfiguration), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_sqlDbStoreSectionConfiguration), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction> = z.union([z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createInstance"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteInstance"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("updateInstance"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction> = z.union([z.object({actionType:z.union([z.literal("undoRedoAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("undo"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("undoRedoAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("redo"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("71c04f8e-c687-4ea7-9a19-bc98d796c389"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction> = z.union([z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("initModel"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), params:z.union([z.lazy(() =>carryOnObject), z.object({metaModel:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_metaModel), dataStoreType:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_dataStoreType), application:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_application), applicationDeploymentConfiguration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance), applicationModelBranch:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance), applicationVersion:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance), applicationStoreBasedConfiguration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstance)}).strict()])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("commit"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("rollback"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("remoteLocalCacheRollback"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("resetModel"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("resetData"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("alterEntityAttribute"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entityName:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityDefinitionUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), addColumns:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({name:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement)}).strict()])).optional(), z.lazy(() =>carryOnObject)]).optional(), removeColumns:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), update:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_jzodElement).optional()}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("renameEntity"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entityName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), entityUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityDefinitionUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), targetValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createEntity"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), entities:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({entity:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entity), entityDefinition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityDefinition)}).strict()])), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("modelAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("dropEntity"), z.lazy(() =>carryOnObject)]), transactional:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), z.lazy(() =>carryOnObject)]), entityUuid:z.union([z.string(), z.lazy(() =>carryOnObject)]), entityDefinitionUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction> = z.union([z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createInstance"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteInstance"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteInstanceWithCascade"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("updateInstance"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), includeInTransaction:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("loadNewInstancesInLocalCache"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), objects:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_entityInstanceCollection)), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("getInstance"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), uuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("instanceAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("getInstances"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeManagementAction> = z.union([z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createStore"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), configuration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteStore"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), configuration:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration)}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("resetAndInitMiroirAndApplicationDatabase"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), deployments:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_deployment)), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("openStore"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), configuration:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration)), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("storeManagementAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("closeStore"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transactionalInstanceAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("transactionalInstanceAction"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), instanceAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_bundleAction> = z.union([z.object({actionType:z.union([z.literal("bundleAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("createBundle"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.object({actionType:z.union([z.literal("bundleAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("deleteBundle"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_undoRedoAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeOrBundleAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_modelAction), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction), z.object({actionType:z.union([z.literal("transactionalInstanceAction"), z.lazy(() =>carryOnObject)]), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), instanceAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction)}).strict(), z.object({actionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("sequence"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), templates:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.array(z.union([z.object({compositeActionType:z.union([z.literal("domainAction"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), domainAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction)}).strict(), z.object({compositeActionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), compositeActionTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction)}).strict(), z.object({compositeActionType:z.union([z.literal("query"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction)}).strict(), z.object({compositeActionType:z.union([z.literal("queryTemplate"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction)}).strict(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionDefinition: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeActionDefinition> = z.union([z.array(z.union([z.object({compositeActionType:z.union([z.literal("domainAction"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), domainAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction)}).strict(), z.object({compositeActionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), compositeActionTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction)}).strict(), z.object({compositeActionType:z.union([z.literal("query"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction)}).strict(), z.object({compositeActionType:z.union([z.literal("queryTemplate"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction)}).strict(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("sequence"), z.lazy(() =>carryOnObject)]), actionLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().uuid().optional(), z.lazy(() =>carryOnObject)]).optional(), templates:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), definition:z.union([z.array(z.union([z.object({compositeActionType:z.union([z.literal("domainAction"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), domainAction:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction)}).strict(), z.object({compositeActionType:z.union([z.literal("compositeAction"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), compositeActionTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction)}).strict(), z.object({compositeActionType:z.union([z.literal("query"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction)}).strict(), z.object({compositeActionType:z.union([z.literal("queryTemplate"), z.lazy(() =>carryOnObject)]), compositeActionStepLabel:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), nameGivenToResult:z.union([z.string(), z.lazy(() =>carryOnObject)]), queryTemplate:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction)}).strict(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRoot2: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRoot2> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObject> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("queryForExtractorOrCombinerReturningObject"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("queryForExtractorOrCombinerReturningObjectList"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryWithExtractorCombinerTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryWithExtractorCombinerTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("queryWithExtractorCombinerTransformer"), z.lazy(() =>carryOnObject)]), runAsSql:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), extractors:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper)).optional(), z.lazy(() =>carryOnObject)]).optional(), combiners:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectOrObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectOrObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList), z.object({extractorOrCombinerType:z.union([z.literal("extractorWrapperReturningList"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference), z.object({extractorOrCombinerType:z.union([z.literal("extractorWrapperReturningObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObject> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorOrCombinerContextReference"), z.lazy(() =>carryOnObject)]), extractorOrCombinerContextReference:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict().extend({extractorOrCombinerType:z.union([z.literal("extractorByEntityReturningObjectList"), z.lazy(() =>carryOnObject)]), filter:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), value:z.union([z.any(), z.lazy(() =>carryOnObject)])}).strict()]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict().extend({extractorOrCombinerType:z.union([z.literal("extractorForObjectByDirectReference"), z.lazy(() =>carryOnObject)]), instanceUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapperReturningList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({extractorOrCombinerType:z.union([z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), z.lazy(() =>carryOnObject)]), rootExtractorOrReference:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractor), z.string(), z.lazy(() =>carryOnObject)]), subQueryTemplate:z.union([z.lazy(() =>carryOnObject), z.object({query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate), rootQueryObjectTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorWrapper), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerContextReference), z.object({extractorOrCombinerType:z.union([z.literal("combiner_wrapperReturningObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner)), z.lazy(() =>carryOnObject)])}).strict(), z.object({extractorOrCombinerType:z.union([z.literal("combiner_wrapperReturningList"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorForObjectByDirectReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorCombinerByHeteronomousManyToManyReturningListOfObjectList), z.object({extractorOrCombinerType:z.union([z.literal("literal"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerRoot> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombinerReturningObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorByEntityReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerForObjectByRelation> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict().extend({extractorOrCombinerType:z.union([z.literal("combinerForObjectByRelation"), z.lazy(() =>carryOnObject)]), objectReference:z.union([z.string(), z.lazy(() =>carryOnObject)]), AttributeOfObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByRelationReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict().extend({extractorOrCombinerType:z.union([z.literal("combinerByRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), objectReference:z.union([z.string(), z.lazy(() =>carryOnObject)]), objectReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfListObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_combinerByManyToManyRelationReturningObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict().extend({extractorOrCombinerType:z.union([z.literal("combinerByManyToManyRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), objectListReference:z.union([z.string(), z.lazy(() =>carryOnObject)]), objectListReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryRecord> = z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorOrCombiner)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("queryAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryForExtractorOrCombinerReturningObjectOrObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryWithExtractorCombinerTransformer), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryContextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryContextReference> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("queryContextReference"), z.lazy(() =>carryOnObject)]), queryReference:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRoot: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRoot> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant> = z.union([z.object({queryTemplateType:z.union([z.literal("constantString"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.object({queryTemplateType:z.union([z.literal("constantNumber"), z.lazy(() =>carryOnObject)]), definition:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict(), z.object({queryTemplateType:z.union([z.literal("constantObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict(), z.object({queryTemplateType:z.union([z.literal("constantUuid"), z.lazy(() =>carryOnObject)]), constantUuidValue:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateContextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateContextReference> = z.union([z.lazy(() =>carryOnObject), z.object({queryTemplateType:z.union([z.literal("queryTemplateContextReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference> = z.union([z.lazy(() =>carryOnObject), z.object({queryTemplateType:z.union([z.literal("queryTemplateParameterReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstantOrParameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstantOrParameterReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstantOrAnyReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstantOrAnyReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateConstant), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateContextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateParameterReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryFailed> = z.union([z.lazy(() =>carryOnObject), z.object({queryFailure:z.union([z.enum(["QueryNotExecutable","DomainStateNotLoaded","IncorrectParameters","DeploymentNotFound","ApplicationSectionNotFound","EntityNotFound","InstanceNotFound","ReferenceNotFound","ReferenceFoundButUndefined","ReferenceFoundButAttributeUndefinedOnFoundObject"]), z.lazy(() =>carryOnObject)]), query:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), failureOrigin:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional(), failureMessage:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), queryReference:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), queryParameters:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), queryContext:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), deploymentUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), entityUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), instanceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("combinerByManyToManyRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), objectListReference:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference), objectListReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfRootListObjectToCompareToListReferenceUuid:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("extractorTemplateForObjectListByEntity"), z.lazy(() =>carryOnObject)]), filter:z.union([z.lazy(() =>carryOnObject), z.object({attributeName:z.union([z.string(), z.lazy(() =>carryOnObject)]), value:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString)}).strict()]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("combinerByRelationReturningObjectList"), z.lazy(() =>carryOnObject)]), objectReference:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), objectReferenceAttribute:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), AttributeOfListObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("combinerForObjectByRelation"), z.lazy(() =>carryOnObject)]), objectReference:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), AttributeOfObjectToCompareToReferenceUuid:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference> = z.union([z.lazy(() =>carryOnObject), z.object({label:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), parentName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), parentUuid:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("extractorForObjectByDirectReference"), z.lazy(() =>carryOnObject)]), instanceUuid:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference), z.object({queryType:z.union([z.literal("extractorWrapperReturningObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity), z.object({queryType:z.union([z.literal("extractorWrapperReturningList"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapperReturningList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForObjectListByEntity), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectByQueryCombiner: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectByQueryCombiner> = z.union([z.lazy(() =>carryOnObject), z.object({queryType:z.union([z.literal("extractorCombinerByHeteronomousManyToManyReturningListOfObjectList"), z.lazy(() =>carryOnObject)]), rootExtractorOrReference:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate), z.string(), z.lazy(() =>carryOnObject)]), subQueryTemplate:z.union([z.lazy(() =>carryOnObject), z.object({query:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate), rootQueryObjectTransformer:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_recordOfTransformers)}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryContextReference), z.object({queryType:z.union([z.literal("combiner_wrapperReturningObject"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate)), z.lazy(() =>carryOnObject)])}).strict(), z.object({queryType:z.union([z.literal("combiner_wrapperReturningList"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate)), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateExtractObjectByDirectReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectListByManyToManyRelation), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectByQueryCombiner), z.object({queryType:z.union([z.literal("literal"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict(), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord> = z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplate)), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mustacheStringTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantUuid"), z.lazy(() =>carryOnObject)]), constantUuidValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantObject"), z.lazy(() =>carryOnObject)]), constantObjectValue:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantString"), z.lazy(() =>carryOnObject)]), constantStringValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("newUuid"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("parameterReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("contextReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectDynamicAccess"), z.lazy(() =>carryOnObject)]), objectAccessPath:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate), z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_constantString), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_newUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_fullObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mustacheStringTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mustacheStringTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_orderBy: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_orderBy> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_unique> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("unique"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_count> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("count"), z.lazy(() =>carryOnObject)]), groupBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_list_pickElement> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("listPickElement"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)]), index:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("innerFullObjectTemplate"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_fullObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_fullObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("fullObjectTemplate"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("freeObjectTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild)), z.string(), z.number(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectAlter"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_freeObjectTemplate)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToList> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("mapperListToList"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)]), elementTransformer:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_inner_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_innerFullObjectTemplate), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild_mapper_listToObject> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("mapperListToObject"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)]), indexAttribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_Abstract> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_orderedTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("mustacheStringTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantUuid"), z.lazy(() =>carryOnObject)]), constantUuidValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantObject"), z.lazy(() =>carryOnObject)]), constantObjectValue:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("constantString"), z.lazy(() =>carryOnObject)]), constantStringValue:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("newUuid"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_parameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_parameterReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("parameterReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextReference> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("contextReference"), z.lazy(() =>carryOnObject)]), referenceName:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencePath:z.union([z.array(z.union([z.string(), z.lazy(() =>carryOnObject)])).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_parameterReference), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("objectDynamicAccess"), z.lazy(() =>carryOnObject)]), objectAccessPath:z.union([z.array(z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_objectDynamicAccess), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_mustacheStringTemplate), z.string(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_referencingTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_referencingTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("count"), z.lazy(() =>carryOnObject)]), groupBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_fullObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_fullObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict().extend({transformerType:z.union([z.literal("fullObjectTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("innerFullObjectTemplate"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.union([z.array(z.union([z.lazy(() =>carryOnObject), z.object({attributeKey:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), attributeValue:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)}).strict()])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_constantString), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_newUuid), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_contextOrParameterReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectDynamicAccess), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("unique"), z.lazy(() =>carryOnObject)]), attribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict().extend({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToList> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict().extend({transformerType:z.union([z.literal("mapperListToList"), z.lazy(() =>carryOnObject)]), elementTransformer:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_innerFullObjectTemplate), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict().extend({transformerType:z.union([z.literal("mapperListToObject"), z.lazy(() =>carryOnObject)]), indexAttribute:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional(), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)])}).strict().extend({transformerType:z.union([z.literal("objectValues"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_pickElement: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_pickElement> = z.union([z.lazy(() =>carryOnObject), z.object({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("listPickElement"), z.lazy(() =>carryOnObject)]), referencedExtractor:z.union([z.string(), z.lazy(() =>carryOnObject)]), index:z.union([z.number(), z.lazy(() =>carryOnObject)])}).strict().extend({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({transformerType:z.union([z.literal("freeObjectTemplate"), z.lazy(() =>carryOnObject)]), definition:z.union([z.record(z.string(),z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime)), z.string(), z.number(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter> = z.union([z.lazy(() =>carryOnObject), z.object({interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)])}).strict().extend({orderBy:z.union([z.string().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict().extend({transformerType:z.union([z.literal("objectAlter"), z.lazy(() =>carryOnObject)]), referenceToOuterObject:z.union([z.string(), z.lazy(() =>carryOnObject)]), definition:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_fullObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_freeObjectTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_object_alter), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_count), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_list_pickElement), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToList), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mapper_listToObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_mustacheStringTemplate), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_objectValues), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_unique), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem> = z.union([z.lazy(() =>carryOnObject), z.object({transformerType:z.union([z.literal("transformer_menu_addItem"), z.lazy(() =>carryOnObject)]), interpolation:z.union([z.literal("runtime"), z.lazy(() =>carryOnObject)]), transformerDefinition:z.union([z.lazy(() =>carryOnObject), z.object({menuReference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), z.lazy(() =>carryOnObject)]), menuItemReference:z.union([z.string(), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime_InnerReference), z.lazy(() =>carryOnObject)]), menuSectionInsertionIndex:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional(), menuSectionItemInsertionIndex:z.union([z.number().optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()])}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuildOrRuntime: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuildOrRuntime> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForBuild), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformerForRuntime), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_transformer_menu_addItem), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObject: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObject> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("extractorTemplateForDomainModelObjects"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObject)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObjectList: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObjectList> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("extractorTemplateForDomainModelObjects"), z.lazy(() =>carryOnObject)]), select:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectObjectList)}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForDomainModelObjects: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForDomainModelObjects> = z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObject), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForSingleObjectList), z.lazy(() =>carryOnObject)]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateWithExtractorCombinerTransformer: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateWithExtractorCombinerTransformer> = z.union([z.lazy(() =>carryOnObject), z.object({deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), pageParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), queryParams:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)]), contextResults:z.union([z.record(z.string(),z.union([z.any(), z.lazy(() =>carryOnObject)])), z.lazy(() =>carryOnObject)])}).strict().extend({queryType:z.union([z.literal("queryTemplateWithExtractorCombinerTransformer"), z.lazy(() =>carryOnObject)]), runAsSql:z.union([z.boolean().optional(), z.lazy(() =>carryOnObject)]).optional(), extractorTemplates:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateSelectExtractorWrapper)).optional(), z.lazy(() =>carryOnObject)]).optional(), combinerTemplates:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateRecord).optional(), runtimeTransformers:z.union([z.record(z.string(),z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extendedTransformerForRuntime)).optional(), z.lazy(() =>carryOnObject)]).optional()}).strict()]);
export const carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction: z.ZodType<CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateAction> = z.union([z.lazy(() =>carryOnObject), z.object({actionType:z.union([z.literal("queryTemplateAction"), z.lazy(() =>carryOnObject)]), actionName:z.union([z.literal("runQuery"), z.lazy(() =>carryOnObject)]), endpoint:z.union([z.literal("9e404b3c-368c-40cb-be8b-e3c28550c25e"), z.lazy(() =>carryOnObject)]), applicationSection:z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_applicationSection).optional(), deploymentUuid:z.union([z.string().uuid(), z.lazy(() =>carryOnObject)]), query:z.union([z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_extractorTemplateForDomainModelObjects), z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_queryTemplateWithExtractorCombinerTransformer), z.lazy(() =>carryOnObject)])}).strict()]);
export const carryOnObject: z.ZodType<CarryOnObject> = z.union([z.lazy(() =>transformerForBuild), z.lazy(() =>transformerForRuntime)]);
export const compositeActionTemplate: z.ZodType<CompositeActionTemplate> = z.lazy(() =>carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction);
export const miroirFundamentalType = z.lazy(() =>miroirAllFundamentalTypesUnion);
