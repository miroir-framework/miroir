import { ZodType, ZodTypeAny, z } from "zod";

export type  = {
    jzodBasicExtraSchema: {
        id: number;
        defaultLabel: string;
        editable: boolean;
    };
    jzodArraySchema: {
        optional?: boolean | undefined;
        extra?: jzodBasicExtraSchema;
        type: "array";
        definition?: jzodElementSchema;
    };
    jzodAttributeSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            description?: string | undefined;
            editable: boolean;
            targetEntityApplication?: ("currentApplication" | "metaModel") | undefined;
            targetEntityApplicationSection?: ("model" | "data") | undefined;
            targetEntity?: string | undefined;
        } | undefined;
        type: "simpleType";
        definition?: jzodEnumAttributeTypesSchema;
    };
    jzodAttributeStringWithValidationsSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
            targetEntity: string;
        } | undefined;
        type: "simpleType";
        definition: "string";
        validations: jzodAttributeStringValidationsSchema[];
    };
    jzodAttributeStringValidationsSchema: {
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
        } | undefined;
        type: "max" | "min" | "length" | "email" | "url" | "emoji" | "uuid" | "cuid" | "cuid2" | "ulid" | "regex" | "includes" | "startsWith" | "endsWith" | "datetime" | "ip";
        parameter?: any;
    };
    jzodElementSchema?: jzodArraySchema | jzodAttributeSchema | jzodAttributeStringWithValidationsSchema | jzodEnumSchema | jzodFunctionSchema | jzodLazySchema | jzodLiteralSchema | jzodObjectSchema | jzodRecordSchema | jzodReferenceSchema | jzodUnionSchema;
    jzodElementSetSchema: {
        [x: string]: jzodElementSchema;
    };
    jzodEnumSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
        } | undefined;
        type: "enum";
        definition: string[];
    };
    jzodEnumAttributeTypesSchema: "any" | "boolean" | "number" | "string" | "uuid";
    jzodFunctionSchema: {
        type: "function";
        args: jzodAttributeSchema[];
        returns?: jzodAttributeSchema;
    };
    jzodLazySchema: {
        type: "lazy";
        definition?: jzodFunctionSchema;
    };
    jzodLiteralSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
        } | undefined;
        type: "literal";
        definition: string;
    };
    jzodObjectSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
        } | undefined;
        type: "object";
        definition: {
            [x: string]: jzodElementSchema;
        };
    };
    jzodRecordSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
        } | undefined;
        type: "record";
        definition?: jzodElementSchema;
    };
    jzodReferenceSchema: {
        optional?: boolean | undefined;
        extra?: {
            id?: number | undefined;
            defaultLabel?: string | undefined;
            editable?: boolean | undefined;
        } | undefined;
        type: "schemaReference";
        definition: {
            absolutePath?: string | undefined;
            relativePath?: string | undefined;
        };
    };
    jzodUnionSchema: {
        optional?: boolean | undefined;
        extra?: {
            id: number;
            defaultLabel: string;
            editable: boolean;
        } | undefined;
        type: "union";
        discriminant?: string | undefined;
        definition: jzodElementSchema[];
    };
};

export const  = z.object({jzodBasicExtraSchema:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict(),jzodArraySchema:z.object({optional:z.boolean().optional(),extra:z.lazy(() =>jzodBasicExtraSchema),type:z.literal("array"),definition:z.lazy(() =>jzodElementSchema),}).strict(),jzodAttributeSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),description:z.string().optional(),editable:z.boolean(),targetEntityApplication:z.enum(["currentApplication","metaModel"] as any).optional(),targetEntityApplicationSection:z.enum(["model","data"] as any).optional(),targetEntity:z.string().uuid().optional(),}).strict().optional(),type:z.literal("simpleType"),definition:z.lazy(() =>jzodEnumAttributeTypesSchema),}).strict(),jzodAttributeStringWithValidationsSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),targetEntity:z.string().uuid(),}).strict().optional(),type:z.literal("simpleType"),definition:z.literal("string"),validations:z.array(z.lazy(() =>jzodAttributeStringValidationsSchema)),}).strict(),jzodAttributeStringValidationsSchema:z.object({extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict().optional(),type:z.enum(["max","min","length","email","url","emoji","uuid","cuid","cuid2","ulid","regex","includes","startsWith","endsWith","datetime","ip"] as any),parameter:z.any(),}).strict(),jzodElementSchema:z.union([z.lazy(() =>jzodArraySchema),z.lazy(() =>jzodAttributeSchema),z.lazy(() =>jzodAttributeStringWithValidationsSchema),z.lazy(() =>jzodEnumSchema),z.lazy(() =>jzodFunctionSchema),z.lazy(() =>jzodLazySchema),z.lazy(() =>jzodLiteralSchema),z.lazy(() =>jzodObjectSchema),z.lazy(() =>jzodRecordSchema),z.lazy(() =>jzodReferenceSchema),z.lazy(() =>jzodUnionSchema),]),jzodElementSetSchema:z.record(z.string(),z.lazy(() =>jzodElementSchema)),jzodEnumSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict().optional(),type:z.literal("enum"),definition:z.array(z.string()),}).strict(),jzodEnumAttributeTypesSchema:z.enum(["any","boolean","number","string","uuid"] as any),jzodFunctionSchema:z.object({type:z.literal("function"),args:z.array(z.lazy(() =>jzodAttributeSchema)),returns:z.lazy(() =>jzodAttributeSchema).optional(),}).strict(),jzodLazySchema:z.object({type:z.literal("lazy"),definition:z.lazy(() =>jzodFunctionSchema),}).strict(),jzodLiteralSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict().optional(),type:z.literal("literal"),definition:z.string(),}).strict(),jzodObjectSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict().optional(),type:z.literal("object"),definition:z.record(z.string(),z.lazy(() =>jzodElementSchema)),}).strict(),jzodRecordSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict().optional(),type:z.literal("record"),definition:z.lazy(() =>jzodElementSchema),}).strict(),jzodReferenceSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number().optional(),defaultLabel:z.string().optional(),editable:z.boolean().optional(),}).strict().optional(),type:z.literal("schemaReference"),definition:z.object({absolutePath:z.string().uuid().optional(),relativePath:z.string().optional(),}).strict(),}).strict(),jzodUnionSchema:z.object({optional:z.boolean().optional(),extra:z.object({id:z.number(),defaultLabel:z.string(),editable:z.boolean(),}).strict().optional(),type:z.literal("union"),discriminant:z.string().optional(),definition:z.array(z.lazy(() =>jzodElementSchema)),}).strict(),}).strict();
