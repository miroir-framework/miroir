import { ZodType, ZodTypeAny, z } from "zod";

export type JzodBaseObject = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
};
export type JzodArray = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "array";
    definition: JzodElement;
};
export type JzodAttribute = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "simpleType";
    coerce?: boolean | undefined;
    definition: JzodEnumAttributeTypes;
};
export type JzodAttributeDateValidations = {
    extra?: {
        [x: string]: any;
    } | undefined;
    type: "min" | "max";
    parameter?: any;
};
export type JzodAttributeDateWithValidations = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "simpleType";
    definition: "date";
    validations?: JzodAttributeDateValidations[] | undefined;
};
export type JzodAttributeNumberValidations = {
    extra?: {
        [x: string]: any;
    } | undefined;
    type: "gt" | "gte" | "lt" | "lte" | "int" | "positive" | "nonpositive" | "negative" | "nonnegative" | "multipleOf" | "finite" | "safe";
    parameter?: any;
};
export type JzodAttributeNumberWithValidations = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "simpleType";
    definition: "number";
    validations?: JzodAttributeNumberValidations[] | undefined;
};
export type JzodAttributeStringValidations = {
    extra?: {
        [x: string]: any;
    } | undefined;
    type: "max" | "min" | "length" | "email" | "url" | "emoji" | "uuid" | "cuid" | "cuid2" | "ulid" | "regex" | "includes" | "startsWith" | "endsWith" | "datetime" | "ip";
    parameter?: any;
};
export type JzodAttributeStringWithValidations = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "simpleType";
    definition: "string";
    validations?: JzodAttributeStringValidations[] | undefined;
};
export type JzodElement = JzodArray | JzodAttribute | JzodAttributeDateWithValidations | JzodAttributeNumberWithValidations | JzodAttributeStringWithValidations | JzodEnum | JzodFunction | JzodLazy | JzodLiteral | JzodIntersection | JzodMap | JzodObject | JzodPromise | JzodRecord | JzodReference | JzodSet | JzodTuple | JzodUnion;
export type JzodEnum = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "enum";
    definition: string[];
};
export type JzodEnumAttributeTypes = "any" | "bigint" | "boolean" | "date" | "never" | "null" | "number" | "string" | "uuid" | "undefined" | "unknown" | "void";
export type JzodEnumElementTypes = "array" | "enum" | "function" | "lazy" | "literal" | "intersection" | "map" | "object" | "promise" | "record" | "schemaReference" | "set" | "simpleType" | "tuple" | "union";
export type JzodFunction = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
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
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "lazy";
    definition: JzodFunction;
};
export type JzodLiteral = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "literal";
    definition: string;
};
export type JzodIntersection = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
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
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
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
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    extend?: JzodReference | undefined;
    type: "object";
    nonStrict?: boolean | undefined;
    definition: {
        [x: string]: JzodElement;
    };
};
export type JzodPromise = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "promise";
    definition: JzodElement;
};
export type JzodRecord = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "record";
    definition: JzodElement;
};
export type JzodReference = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "schemaReference";
    context?: {
        [x: string]: JzodElement;
    } | undefined;
    definition: {
        eager?: boolean | undefined;
        relativePath?: string | undefined;
        absolutePath?: string | undefined;
    };
};
export type JzodSet = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "set";
    definition: JzodElement;
};
export type JzodTuple = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "tuple";
    definition: JzodElement[];
};
export type JzodUnion = {
    optional?: boolean | undefined;
    nullable?: boolean | undefined;
    extra?: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    } | undefined;
    type: "union";
    discriminator?: string | undefined;
    definition: JzodElement[];
};
export type ApplicationSection = "model" | "data";
export type DataStoreApplicationType = "miroir" | "app";
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
export type EntityInstancesUuidIndex = {
    [x: string]: EntityInstance;
};
export type _____________entities__________ = never;
export type Application = {
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
    application: string;
    branch: string;
    previousVersion: string;
    modelStructureMigration?: JzodObject | undefined;
    modelCUDMigration?: JzodObject | undefined;
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
    jzodSchema: JzodObject;
};
export type ObjectInstanceReportSection = {
    type: "objectInstanceReportSection";
    fetchQuery?: MiroirFetchQuery | undefined;
    definition: {
        label?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: SelectObjectQuery | undefined;
    };
};
export type ObjectListReportSection = {
    type: "objectListReportSection";
    definition: {
        label?: string | undefined;
        parentUuid: string;
        fetchedDataReference?: string | undefined;
        query?: SelectObjectQuery | undefined;
    };
};
export type GridReportSection = {
    type: "grid";
    fetchQuery?: MiroirFetchQuery | undefined;
    selectData?: MiroirSelectQueriesRecord | undefined;
    combineData?: MiroirCrossJoinQuery | undefined;
    definition: ReportSection[][];
};
export type ListReportSection = {
    type: "list";
    fetchQuery?: MiroirFetchQuery | undefined;
    selectData?: MiroirSelectQueriesRecord | undefined;
    combineData?: MiroirCrossJoinQuery | undefined;
    definition: ObjectListReportSection[];
};
export type ReportSection = GridReportSection | ListReportSection | ObjectListReportSection | ObjectInstanceReportSection;
export type RootReportSection = {
    reportParametersToFetchQueryParametersTransformer?: {
        [x: string]: any;
    } | undefined;
    reportParameters?: {
        [x: string]: any;
    } | undefined;
    fetchQuery: MiroirFetchQuery;
    section: ReportSection;
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
            [x: string]: any;
        } | undefined;
        reportParameters?: {
            [x: string]: any;
        } | undefined;
        fetchQuery: MiroirFetchQuery;
        section: ReportSection;
    };
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
    model: StoreSectionConfiguration;
    data: StoreSectionConfiguration;
};
export type ServerConfigForClientConfig = {
    rootApiUrl: string;
    dataflowConfiguration?: any;
    storeSectionConfiguration: {
        miroirServerConfig: StoreUnitConfiguration;
        appServerConfig: StoreUnitConfiguration;
    };
};
export type MiroirConfigForMswClient = {
    emulateServer: true;
    rootApiUrl: string;
    miroirServerConfig: StoreUnitConfiguration;
    appServerConfig: StoreUnitConfiguration;
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
        miroirAdminConfig: StoreUnitConfiguration;
    };
};
export type MiroirConfig = "miroirConfigClient" | "miroirConfigServer";
export type StoreConfiguration = {
    [x: string]: {
        model: StoreSectionConfiguration;
        data: StoreSectionConfiguration;
    };
};
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
        endpointVersion: string;
        actionArguments: ModelAction;
    }[];
    patches: any[];
};
export type MiroirAllFundamentalTypesUnion = ApplicationSection | EntityInstance | EntityInstanceCollection | InstanceCUDAction;
export type ______________________________________________queries_____________________________________________ = never;
export type QueryFailed = {
    queryFailure: "QueryNotExecutable" | "DomainStateNotLoaded" | "IncorrectParameters" | "DeploymentNotFound" | "ApplicationSectionNotFound" | "EntityNotFound" | "InstanceNotFound" | "ReferenceNotFound" | "ReferenceFoundButUndefined" | "ReferenceFoundButAttributeUndefinedOnFoundObject";
    query?: any | undefined;
    queryParameters?: any | undefined;
    queryContext?: any | undefined;
    deploymentUuid?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    entityUuid?: string | undefined;
    instanceUuid?: string | undefined;
};
export type SelectRootQuery = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
};
export type QueryObjectReference = {
    referenceType: "constant";
    referenceUuid: string;
} | {
    referenceType: "queryContextReference";
    referenceName: string;
} | {
    referenceType: "queryParameterReference";
    referenceName: string;
};
export type SelectObjectByUuidQuery = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    queryType: "selectObjectByUuid";
    instanceUuid: string;
};
export type SelectObjectByRelationQuery = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    queryType: "selectObjectByRelation";
    objectReference: QueryObjectReference;
    AttributeOfObjectToCompareToReferenceUuid: string;
};
export type SelectObjectByDirectReferenceQuery = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    queryType: "selectObjectByDirectReference";
    objectReference: QueryObjectReference;
};
export type SelectObjectQuery = SelectObjectByUuidQuery | SelectObjectByRelationQuery | SelectObjectByDirectReferenceQuery;
export type SelectObjectListByEntityQuery = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    queryType: "selectObjectListByEntity";
};
export type SelectObjectListByRelationQuery = {
    label?: string | undefined;
    applicationSection?: ApplicationSection | undefined;
    parentName?: string | undefined;
    parentUuid: string;
    queryType: "selectObjectListByRelation";
    objectReference: QueryObjectReference;
    AttributeOfListObjectToCompareToReferenceUuid: string;
};
export type SelectObjectListQuery = SelectObjectListByEntityQuery | SelectObjectListByRelationQuery;
export type MiroirSelectQuery = SelectObjectListQuery | SelectObjectQuery | {
    queryType: "literal";
    definition: string;
} | {
    queryType: "queryContextReference";
    referenceName: string;
} | {
    queryType: "wrapperReturningObject";
    definition: {
        [x: string]: MiroirSelectQuery;
    };
} | {
    queryType: "wrapperReturningList";
    definition: MiroirSelectQuery[];
};
export type MiroirSelectQueriesRecord = {
    [x: string]: MiroirSelectQuery;
};
export type MiroirCrossJoinQuery = {
    queryType: "combineQuery";
    a: string;
    b: string;
};
export type MiroirFetchQuery = {
    parameterSchema?: JzodObject | undefined;
    select: MiroirSelectQueriesRecord;
    crossJoin?: MiroirCrossJoinQuery | undefined;
};
export type ResultsFromQueryObject = {
    resultType: "object";
    resultValue: {
        [x: string]: ResultsFromQuery;
    };
};
export type ResultsFromQuery = ResultsFromQueryObject | {
    resultType: "instance";
    resultValue: EntityInstance;
} | {
    resultType: "instanceUuidIndex";
    resultValue: EntityInstancesUuidIndex;
} | {
    resultType: "failure";
    resultValue: QueryFailed;
} | {
    resultType: "string";
    resultValue: string;
} | {
    resultType: "array";
    resultValue: ResultsFromQuery[];
};
export type MiroirCustomQueryParams = {
    queryType: "custom";
    name: "jsonata";
    definition: string;
};
export type ______________________________________________actions_____________________________________________ = never;
export type ModelAction = {
    actionType: "modelAction";
    actionName: "createEntity";
    endpointVersion: "7947ae40-eb34-4149-887b-15a9021e714e";
    entity: Entity;
    entityDefinition: EntityDefinition;
};
export type InstanceAction = {
    actionType: "instanceAction";
    actionName: "createInstance";
    endpointVersion: "ed520de4-55a9-4550-ac50-b1b713b72a89";
    deploymentUuid: string;
    applicationSection: ApplicationSection;
    objects: EntityInstanceCollection[];
};
export type InstanceCUDAction = {
    actionType: "InstanceCUDAction";
    actionName: "create";
    includeInTransaction?: boolean | undefined;
    applicationSection: ApplicationSection;
    objects: EntityInstanceCollection[];
} | {
    actionType: "InstanceCUDAction";
    actionName: "update";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "InstanceCUDAction";
    actionName: "delete";
    applicationSection: ApplicationSection;
    includeInTransaction?: boolean | undefined;
    objects: EntityInstanceCollection[];
} | {
    actionType: "InstanceCUDAction";
    actionName: "replaceLocalCache";
    objects: EntityInstanceCollection[];
};
export type LocalCacheAction = {
    actionType: "InstanceCUDAction";
    actionName: "replaceLocalCache";
    objects: EntityInstanceCollection[];
};
export type StoreAction = {
    actionType: "storeAction";
    actionName: "openStore";
    endpointVersion: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    configuration: StoreConfiguration;
    deploymentUuid?: string | undefined;
} | {
    actionType: "storeAction";
    actionName: "closeStore";
    endpointVersion: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
    deploymentUuid: string;
};
export type BundleAction = {
    actionType: "bundleAction";
    actionName: "createBundle";
} | {
    actionType: "bundleAction";
    actionName: "deleteBundle";
};
export type MiroirAction = StoreAction | BundleAction;
export type ActionTransformer = {
    transformerType: "actionTransformer";
};
export type DataTransformer = {
    transformerType: "dataTransformer";
};
export type MiroirFundamentalType = MiroirAllFundamentalTypesUnion;

export const jzodBaseObject: z.ZodType<JzodBaseObject> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict();
export const jzodArray: z.ZodType<JzodArray> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("array"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodAttribute: z.ZodType<JzodAttribute> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("simpleType"), coerce:z.boolean().optional(), definition:z.lazy(() =>jzodEnumAttributeTypes)}).strict();
export const jzodAttributeDateValidations: z.ZodType<JzodAttributeDateValidations> = z.object({extra:z.record(z.string(),z.any()).optional(), type:z.enum(["min","max"]), parameter:z.any()}).strict();
export const jzodAttributeDateWithValidations: z.ZodType<JzodAttributeDateWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("simpleType"), definition:z.literal("date"), validations:z.array(z.lazy(() =>jzodAttributeDateValidations)).optional()}).strict();
export const jzodAttributeNumberValidations: z.ZodType<JzodAttributeNumberValidations> = z.object({extra:z.record(z.string(),z.any()).optional(), type:z.enum(["gt","gte","lt","lte","int","positive","nonpositive","negative","nonnegative","multipleOf","finite","safe"]), parameter:z.any()}).strict();
export const jzodAttributeNumberWithValidations: z.ZodType<JzodAttributeNumberWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("simpleType"), definition:z.literal("number"), validations:z.array(z.lazy(() =>jzodAttributeNumberValidations)).optional()}).strict();
export const jzodAttributeStringValidations: z.ZodType<JzodAttributeStringValidations> = z.object({extra:z.record(z.string(),z.any()).optional(), type:z.enum(["max","min","length","email","url","emoji","uuid","cuid","cuid2","ulid","regex","includes","startsWith","endsWith","datetime","ip"]), parameter:z.any()}).strict();
export const jzodAttributeStringWithValidations: z.ZodType<JzodAttributeStringWithValidations> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("simpleType"), definition:z.literal("string"), validations:z.array(z.lazy(() =>jzodAttributeStringValidations)).optional()}).strict();
export const jzodElement: z.ZodType<JzodElement> = z.union([z.lazy(() =>jzodArray), z.lazy(() =>jzodAttribute), z.lazy(() =>jzodAttributeDateWithValidations), z.lazy(() =>jzodAttributeNumberWithValidations), z.lazy(() =>jzodAttributeStringWithValidations), z.lazy(() =>jzodEnum), z.lazy(() =>jzodFunction), z.lazy(() =>jzodLazy), z.lazy(() =>jzodLiteral), z.lazy(() =>jzodIntersection), z.lazy(() =>jzodMap), z.lazy(() =>jzodObject), z.lazy(() =>jzodPromise), z.lazy(() =>jzodRecord), z.lazy(() =>jzodReference), z.lazy(() =>jzodSet), z.lazy(() =>jzodTuple), z.lazy(() =>jzodUnion)]);
export const jzodEnum: z.ZodType<JzodEnum> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("enum"), definition:z.array(z.string())}).strict();
export const jzodEnumAttributeTypes: z.ZodType<JzodEnumAttributeTypes> = z.enum(["any","bigint","boolean","date","never","null","number","string","uuid","undefined","unknown","void"]);
export const jzodEnumElementTypes: z.ZodType<JzodEnumElementTypes> = z.enum(["array","enum","function","lazy","literal","intersection","map","object","promise","record","schemaReference","set","simpleType","tuple","union"]);
export const jzodFunction: z.ZodType<JzodFunction> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("function"), definition:z.object({args:z.array(z.lazy(() =>jzodElement)), returns:z.lazy(() =>jzodElement).optional()}).strict()}).strict();
export const jzodLazy: z.ZodType<JzodLazy> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("lazy"), definition:z.lazy(() =>jzodFunction)}).strict();
export const jzodLiteral: z.ZodType<JzodLiteral> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("literal"), definition:z.string()}).strict();
export const jzodIntersection: z.ZodType<JzodIntersection> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("intersection"), definition:z.object({left:z.lazy(() =>jzodElement), right:z.lazy(() =>jzodElement)}).strict()}).strict();
export const jzodMap: z.ZodType<JzodMap> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("map"), definition:z.tuple([z.lazy(() =>jzodElement), z.lazy(() =>jzodElement)])}).strict();
export const jzodObject = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({extend:z.lazy(() =>jzodReference).optional(), type:z.literal("object"), nonStrict:z.boolean().optional(), definition:z.record(z.string(),z.lazy(() =>jzodElement))}).strict();
export const jzodPromise: z.ZodType<JzodPromise> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("promise"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodRecord: z.ZodType<JzodRecord> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("record"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodReference: z.ZodType<JzodReference> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("schemaReference"), context:z.record(z.string(),z.lazy(() =>jzodElement)).optional(), definition:z.object({eager:z.boolean().optional(), relativePath:z.string().optional(), absolutePath:z.string().optional()}).strict()}).strict();
export const jzodSet: z.ZodType<JzodSet> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("set"), definition:z.lazy(() =>jzodElement)}).strict();
export const jzodTuple: z.ZodType<JzodTuple> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("tuple"), definition:z.array(z.lazy(() =>jzodElement))}).strict();
export const jzodUnion: z.ZodType<JzodUnion> = z.object({optional:z.boolean().optional(), nullable:z.boolean().optional(), extra:z.object({id:z.number(), defaultLabel:z.string(), editable:z.boolean()}).strict().optional()}).strict().extend({type:z.literal("union"), discriminator:z.string().optional(), definition:z.array(z.lazy(() =>jzodElement))}).strict();
export const applicationSection: z.ZodType<ApplicationSection> = z.union([z.literal("model"), z.literal("data")]);
export const dataStoreApplicationType: z.ZodType<DataStoreApplicationType> = z.union([z.literal("miroir"), z.literal("app")]);
export const entityInstance = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional()});
export const entityInstanceCollection: z.ZodType<EntityInstanceCollection> = z.object({parentName:z.string().optional(), parentUuid:z.string(), applicationSection:z.lazy(() =>applicationSection), instances:z.array(z.lazy(() =>entityInstance))}).strict();
export const conceptLevel: z.ZodType<ConceptLevel> = z.enum(["MetaModel","Model","Data"]);
export const entityInstancesUuidIndex: z.ZodType<EntityInstancesUuidIndex> = z.record(z.string(),z.lazy(() =>entityInstance));
export const _____________entities__________: z.ZodType<_____________entities__________> = z.never();
export const application: z.ZodType<Application> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string(), description:z.string().optional()}).strict();
export const applicationVersion: z.ZodType<ApplicationVersion> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), defaultLabel:z.string().optional(), description:z.string().optional(), type:z.string().optional(), application:z.string().uuid(), branch:z.string().uuid(), previousVersion:z.string().uuid(), modelStructureMigration:z.lazy(() =>jzodObject).optional(), modelCUDMigration:z.lazy(() =>jzodObject).optional()}).strict();
export const bundle: z.ZodType<Bundle> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid(), name:z.string(), contents:z.union([z.object({type:z.literal("runtime")}).strict(), z.object({type:z.literal("development"), applicationVersion:z.lazy(() =>applicationVersion)}).strict()])}).strict();
export const entity: z.ZodType<Entity> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), application:z.string().uuid().optional(), name:z.string(), author:z.string().uuid().optional(), description:z.string().optional()}).strict();
export const entityDefinition: z.ZodType<EntityDefinition> = z.object({uuid:z.string().uuid(), parentName:z.string(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), name:z.string(), entityUuid:z.string().uuid(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), description:z.string().optional(), jzodSchema:z.lazy(() =>jzodObject)}).strict();
export const objectInstanceReportSection: z.ZodType<ObjectInstanceReportSection> = z.object({type:z.literal("objectInstanceReportSection"), fetchQuery:z.lazy(() =>miroirFetchQuery).optional(), definition:z.object({label:z.string().optional(), parentUuid:z.string().uuid(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>selectObjectQuery).optional()}).strict()}).strict();
export const objectListReportSection: z.ZodType<ObjectListReportSection> = z.object({type:z.literal("objectListReportSection"), definition:z.object({label:z.string().optional(), parentUuid:z.string().uuid(), fetchedDataReference:z.string().optional(), query:z.lazy(() =>selectObjectQuery).optional()}).strict()}).strict();
export const gridReportSection: z.ZodType<GridReportSection> = z.object({type:z.literal("grid"), fetchQuery:z.lazy(() =>miroirFetchQuery).optional(), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCrossJoinQuery).optional(), definition:z.array(z.array(z.lazy(() =>reportSection)))}).strict();
export const listReportSection: z.ZodType<ListReportSection> = z.object({type:z.literal("list"), fetchQuery:z.lazy(() =>miroirFetchQuery).optional(), selectData:z.lazy(() =>miroirSelectQueriesRecord).optional(), combineData:z.lazy(() =>miroirCrossJoinQuery).optional(), definition:z.array(z.lazy(() =>objectListReportSection))}).strict();
export const reportSection: z.ZodType<ReportSection> = z.union([z.lazy(() =>gridReportSection), z.lazy(() =>listReportSection), z.lazy(() =>objectListReportSection), z.lazy(() =>objectInstanceReportSection)]);
export const rootReportSection: z.ZodType<RootReportSection> = z.object({reportParametersToFetchQueryParametersTransformer:z.record(z.string(),z.any()).optional(), reportParameters:z.record(z.string(),z.any()).optional(), fetchQuery:z.lazy(() =>miroirFetchQuery), section:z.lazy(() =>reportSection)}).strict();
export const report: z.ZodType<Report> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), conceptLevel:z.enum(["MetaModel","Model","Data"]).optional(), name:z.string(), defaultLabel:z.string(), type:z.enum(["list","grid"]).optional(), application:z.string().uuid().optional(), definition:z.object({reportParametersToFetchQueryParametersTransformer:z.record(z.string(),z.any()).optional(), reportParameters:z.record(z.string(),z.any()).optional(), fetchQuery:z.lazy(() =>miroirFetchQuery), section:z.lazy(() =>reportSection)}).strict()}).strict();
export const _________________________________configuration_and_bundles_________________________________: z.ZodType<_________________________________configuration_and_bundles_________________________________> = z.never();
export const indexedDbStoreSectionConfiguration: z.ZodType<IndexedDbStoreSectionConfiguration> = z.object({emulatedServerType:z.literal("indexedDb"), indexedDbName:z.string()}).strict();
export const filesystemDbStoreSectionConfiguration: z.ZodType<FilesystemDbStoreSectionConfiguration> = z.object({emulatedServerType:z.literal("filesystem"), directory:z.string()}).strict();
export const sqlDbStoreSectionConfiguration: z.ZodType<SqlDbStoreSectionConfiguration> = z.object({emulatedServerType:z.literal("sql"), connectionString:z.string(), schema:z.string()}).strict();
export const storeSectionConfiguration: z.ZodType<StoreSectionConfiguration> = z.union([z.lazy(() =>indexedDbStoreSectionConfiguration), z.lazy(() =>filesystemDbStoreSectionConfiguration), z.lazy(() =>sqlDbStoreSectionConfiguration)]);
export const storeUnitConfiguration: z.ZodType<StoreUnitConfiguration> = z.object({model:z.lazy(() =>storeSectionConfiguration), data:z.lazy(() =>storeSectionConfiguration)}).strict();
export const serverConfigForClientConfig: z.ZodType<ServerConfigForClientConfig> = z.object({rootApiUrl:z.string(), dataflowConfiguration:z.any(), storeSectionConfiguration:z.object({miroirServerConfig:z.lazy(() =>storeUnitConfiguration), appServerConfig:z.lazy(() =>storeUnitConfiguration)}).strict()}).strict();
export const miroirConfigForMswClient: z.ZodType<MiroirConfigForMswClient> = z.object({emulateServer:z.literal(true), rootApiUrl:z.string(), miroirServerConfig:z.lazy(() =>storeUnitConfiguration), appServerConfig:z.lazy(() =>storeUnitConfiguration)}).strict();
export const miroirConfigForRestClient: z.ZodType<MiroirConfigForRestClient> = z.object({emulateServer:z.literal(false), serverConfig:z.lazy(() =>serverConfigForClientConfig)}).strict();
export const miroirConfigClient: z.ZodType<MiroirConfigClient> = z.object({client:z.union([z.lazy(() =>miroirConfigForMswClient), z.lazy(() =>miroirConfigForRestClient)])}).strict();
export const miroirConfigServer: z.ZodType<MiroirConfigServer> = z.object({server:z.object({rootApiUrl:z.string(), miroirAdminConfig:z.lazy(() =>storeUnitConfiguration)}).strict()}).strict();
export const miroirConfig: z.ZodType<MiroirConfig> = z.union([z.literal("miroirConfigClient"), z.literal("miroirConfigServer")]);
export const storeConfiguration: z.ZodType<StoreConfiguration> = z.record(z.string(),z.object({model:z.lazy(() =>storeSectionConfiguration), data:z.lazy(() =>storeSectionConfiguration)}).strict());
export const commit: z.ZodType<Commit> = z.object({uuid:z.string().uuid(), parentName:z.string().optional(), parentUuid:z.string().uuid(), parentDefinitionVersionUuid:z.string().uuid().optional(), date:z.date(), application:z.string().uuid().optional(), name:z.string(), preceding:z.string().uuid().optional(), branch:z.string().uuid().optional(), author:z.string().uuid().optional(), description:z.string().optional(), actions:z.array(z.object({endpointVersion:z.string().uuid(), actionArguments:z.lazy(() =>modelAction)}).strict()), patches:z.array(z.any())}).strict();
export const miroirAllFundamentalTypesUnion: z.ZodType<MiroirAllFundamentalTypesUnion> = z.union([z.lazy(() =>applicationSection), z.lazy(() =>entityInstance), z.lazy(() =>entityInstanceCollection), z.lazy(() =>instanceCUDAction)]);
export const ______________________________________________queries_____________________________________________: z.ZodType<______________________________________________queries_____________________________________________> = z.never();
export const queryFailed: z.ZodType<QueryFailed> = z.object({queryFailure:z.enum(["QueryNotExecutable","DomainStateNotLoaded","IncorrectParameters","DeploymentNotFound","ApplicationSectionNotFound","EntityNotFound","InstanceNotFound","ReferenceNotFound","ReferenceFoundButUndefined","ReferenceFoundButAttributeUndefinedOnFoundObject"]), query:z.any().optional(), queryParameters:z.any().optional(), queryContext:z.any().optional(), deploymentUuid:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), entityUuid:z.string().optional(), instanceUuid:z.string().optional()}).strict();
export const selectRootQuery: z.ZodType<SelectRootQuery> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict();
export const queryObjectReference: z.ZodType<QueryObjectReference> = z.union([z.object({referenceType:z.literal("constant"), referenceUuid:z.string()}).strict(), z.object({referenceType:z.literal("queryContextReference"), referenceName:z.string()}).strict(), z.object({referenceType:z.literal("queryParameterReference"), referenceName:z.string()}).strict()]);
export const selectObjectByUuidQuery: z.ZodType<SelectObjectByUuidQuery> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({queryType:z.literal("selectObjectByUuid"), instanceUuid:z.string().uuid()}).strict();
export const selectObjectByRelationQuery: z.ZodType<SelectObjectByRelationQuery> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({queryType:z.literal("selectObjectByRelation"), objectReference:z.lazy(() =>queryObjectReference), AttributeOfObjectToCompareToReferenceUuid:z.string()}).strict();
export const selectObjectByDirectReferenceQuery: z.ZodType<SelectObjectByDirectReferenceQuery> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({queryType:z.literal("selectObjectByDirectReference"), objectReference:z.lazy(() =>queryObjectReference)}).strict();
export const selectObjectQuery: z.ZodType<SelectObjectQuery> = z.union([z.lazy(() =>selectObjectByUuidQuery), z.lazy(() =>selectObjectByRelationQuery), z.lazy(() =>selectObjectByDirectReferenceQuery)]);
export const selectObjectListByEntityQuery: z.ZodType<SelectObjectListByEntityQuery> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({queryType:z.literal("selectObjectListByEntity")}).strict();
export const selectObjectListByRelationQuery: z.ZodType<SelectObjectListByRelationQuery> = z.object({label:z.string().optional(), applicationSection:z.lazy(() =>applicationSection).optional(), parentName:z.string().optional(), parentUuid:z.string().uuid()}).strict().extend({queryType:z.literal("selectObjectListByRelation"), objectReference:z.lazy(() =>queryObjectReference), AttributeOfListObjectToCompareToReferenceUuid:z.string()}).strict();
export const selectObjectListQuery: z.ZodType<SelectObjectListQuery> = z.union([z.lazy(() =>selectObjectListByEntityQuery), z.lazy(() =>selectObjectListByRelationQuery)]);
export const miroirSelectQuery: z.ZodType<MiroirSelectQuery> = z.union([z.lazy(() =>selectObjectListQuery), z.lazy(() =>selectObjectQuery), z.object({queryType:z.literal("literal"), definition:z.string()}).strict(), z.object({queryType:z.literal("queryContextReference"), referenceName:z.string()}).strict(), z.object({queryType:z.literal("wrapperReturningObject"), definition:z.record(z.string(),z.lazy(() =>miroirSelectQuery))}).strict(), z.object({queryType:z.literal("wrapperReturningList"), definition:z.array(z.lazy(() =>miroirSelectQuery))}).strict()]);
export const miroirSelectQueriesRecord: z.ZodType<MiroirSelectQueriesRecord> = z.record(z.string(),z.lazy(() =>miroirSelectQuery));
export const miroirCrossJoinQuery: z.ZodType<MiroirCrossJoinQuery> = z.object({queryType:z.literal("combineQuery"), a:z.string(), b:z.string()}).strict();
export const miroirFetchQuery: z.ZodType<MiroirFetchQuery> = z.object({parameterSchema:z.lazy(() =>jzodObject).optional(), select:z.lazy(() =>miroirSelectQueriesRecord), crossJoin:z.lazy(() =>miroirCrossJoinQuery).optional()}).strict();
export const resultsFromQueryObject: z.ZodType<ResultsFromQueryObject> = z.object({resultType:z.literal("object"), resultValue:z.record(z.string(),z.lazy(() =>resultsFromQuery))}).strict();
export const resultsFromQuery: z.ZodType<ResultsFromQuery> = z.union([z.lazy(() =>resultsFromQueryObject), z.object({resultType:z.literal("instance"), resultValue:z.lazy(() =>entityInstance)}).strict(), z.object({resultType:z.literal("instanceUuidIndex"), resultValue:z.lazy(() =>entityInstancesUuidIndex)}).strict(), z.object({resultType:z.literal("failure"), resultValue:z.lazy(() =>queryFailed)}).strict(), z.object({resultType:z.literal("string"), resultValue:z.string()}).strict(), z.object({resultType:z.literal("array"), resultValue:z.array(z.lazy(() =>resultsFromQuery))}).strict()]);
export const miroirCustomQueryParams: z.ZodType<MiroirCustomQueryParams> = z.object({queryType:z.literal("custom"), name:z.literal("jsonata"), definition:z.string()}).strict();
export const ______________________________________________actions_____________________________________________: z.ZodType<______________________________________________actions_____________________________________________> = z.never();
export const modelAction: z.ZodType<ModelAction> = z.object({actionType:z.literal("modelAction"), actionName:z.literal("createEntity"), endpointVersion:z.literal("7947ae40-eb34-4149-887b-15a9021e714e"), entity:z.lazy(() =>entity), entityDefinition:z.lazy(() =>entityDefinition)}).strict();
export const instanceAction: z.ZodType<InstanceAction> = z.object({actionType:z.literal("instanceAction"), actionName:z.literal("createInstance"), endpointVersion:z.literal("ed520de4-55a9-4550-ac50-b1b713b72a89"), deploymentUuid:z.string().uuid(), applicationSection:z.lazy(() =>applicationSection), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict();
export const instanceCUDAction: z.ZodType<InstanceCUDAction> = z.union([z.object({actionType:z.literal("InstanceCUDAction"), actionName:z.literal("create"), includeInTransaction:z.boolean().optional(), applicationSection:z.lazy(() =>applicationSection), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("InstanceCUDAction"), actionName:z.literal("update"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("InstanceCUDAction"), actionName:z.literal("delete"), applicationSection:z.lazy(() =>applicationSection), includeInTransaction:z.boolean().optional(), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict(), z.object({actionType:z.literal("InstanceCUDAction"), actionName:z.literal("replaceLocalCache"), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict()]);
export const localCacheAction: z.ZodType<LocalCacheAction> = z.object({actionType:z.literal("InstanceCUDAction"), actionName:z.literal("replaceLocalCache"), objects:z.array(z.lazy(() =>entityInstanceCollection))}).strict();
export const storeAction: z.ZodType<StoreAction> = z.union([z.object({actionType:z.literal("storeAction"), actionName:z.literal("openStore"), endpointVersion:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), configuration:z.lazy(() =>storeConfiguration), deploymentUuid:z.string().uuid().optional()}).strict(), z.object({actionType:z.literal("storeAction"), actionName:z.literal("closeStore"), endpointVersion:z.literal("bbd08cbb-79ff-4539-b91f-7a14f15ac55f"), deploymentUuid:z.string().uuid()}).strict()]);
export const bundleAction: z.ZodType<BundleAction> = z.union([z.object({actionType:z.literal("bundleAction"), actionName:z.literal("createBundle")}).strict(), z.object({actionType:z.literal("bundleAction"), actionName:z.literal("deleteBundle")}).strict()]);
export const miroirAction: z.ZodType<MiroirAction> = z.union([z.lazy(() =>storeAction), z.lazy(() =>bundleAction)]);
export const actionTransformer: z.ZodType<ActionTransformer> = z.object({transformerType:z.literal("actionTransformer")}).strict();
export const dataTransformer: z.ZodType<DataTransformer> = z.object({transformerType:z.literal("dataTransformer")}).strict();
export const miroirFundamentalType = z.lazy(() =>miroirAllFundamentalTypesUnion);
