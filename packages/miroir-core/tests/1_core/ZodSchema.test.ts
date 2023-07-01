import { AnyZodObject, ZodLazy, ZodObject, ZodTypeAny, z } from "zod";

import * as fs from "fs";
import * as path from "path";

// import * from 'serialize-javascript';
import {
  ResType,
  ZodFunctionSchema,
  ZodEnumSchema,
  ZodLazySchema,
  ZodLiteralSchema,
  ZodSimpleAttributeSchema,
  ZodReferentialElementSet,
  ZodRootSchema,
  ZodReferentialCoreElementSchema,
  ZodReferentialElementSetSchema,
  // ZodSimpleRecordSchema,
  // ZodSimpleArraySchema,
  ZodSimpleBootstrapElementSchema,
  // ZodSimpleObjectSchema,
  // ZodSimpleUnionSchema,
  ZodSimpleElementSchema,
  ZodReferentialElementSchema,
  zodJsonBootstrapSchema,
  ZodReferentialElement,
  ZodSimpleElement,
} from "../../src/0_interfaces/1_core/IZodSchema";
import { _zodToJsonSchema, getDescriptions, getZodSchemaFromJsonZodSchemaSet, referentialElementDependencies } from '../../src/1_core/ZodSchema';
import { circularReplacer } from "../../src/tools";


function convertAndWrite(name:string,zodSchema:ResType,jsonZodSchemaSet:ZodReferentialElementSet,path:string):string {
  const setDependencies = Object.fromEntries(
    Object.entries(jsonZodSchemaSet).map((e: [string, ZodReferentialElement]) => [
      e[0],
      referentialElementDependencies(e[1]),
    ])
  );
  console.log("convertAndWrite",name,'setDependencies',setDependencies);

  // const jsonZodSchemaZodSchema: ResType = getZodSchemaFromJsonZodSchemaSet(jsonZodSchemaSet);
  const setZodSchemaJsonSchema = _zodToJsonSchema(zodSchema,setDependencies,name);
  const setZodSchemaJsonSchemaWithoutBootstrapElement = Object.fromEntries(Object.entries(setZodSchemaJsonSchema).filter(e=>e[0]!=name))
  const setZodSchemaJsonSchemaWithoutBootstrapElementString = JSON.stringify(setZodSchemaJsonSchema,circularReplacer(),2)

  if (fs.existsSync(path)) {
    fs.rmSync(path)
  }
  fs.writeFileSync(path,setZodSchemaJsonSchemaWithoutBootstrapElementString);
  return setZodSchemaJsonSchemaWithoutBootstrapElementString
}

describe(
  'ZodSchema',
  () => {

    // // ###########################################################################################
    // it(
    //   'getZodSimpleType',
    //   () => {
    //      const test2JsonZodSchema:ZodReferentialElementSet = {
    //       "test2": 
    //       {
    //         type: "object",
    //         definition: {
    //           a: { type: "simpleType", definition: "string" },
    //           b: {
    //             type: "object",
    //             definition: { 
    //               b1: { type: "simpleType", definition: "boolean", optional: true },
    //               b2: { type:"simpleArray", definition: {type:"simpleType",definition:"boolean"}}
    //             },
    //           },
    //         },
    //       }
    //      };

        
    //     const test2ZodSchema = {
    //       "test2":z.object({
    //         a: z.string(),
    //         b: z.object({b1:z.boolean().optional(), b2: z.array(z.boolean())})
    //       })

    //     }
        
    //     const logsPath = "C:/Users/nono/Documents/devhome/tmp";
    //     const referenceSchemaFilePath = path.join(logsPath,'test2ZodSchemaJsonSchema.json');
    //     const convertedElementSchemaFilePath = path.join(logsPath,'test2JsonZodSchemaJsonSchema.json');

    //     const test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('test2ZodSchema',test2ZodSchema,test2JsonZodSchema,referenceSchemaFilePath);
    //     const test2ZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('test2ZodSchema',getZodSchemaFromJsonZodSchemaSet(test2JsonZodSchema),test2JsonZodSchema,referenceSchemaFilePath);

    //     expect(test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString).toEqual(test2ZodSchemaJsonSchemaWithoutBootstrapElementString)

    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'recursive json Zod schema',
    //   () => {
    //      const test2JsonZodSchema:ZodReferentialElementSet = {
    //       "test2": 
    //       {
    //         type: "object",
    //         definition: {
    //           a: { type: "referentialElement", definition: "test2", optional: true },
    //         },
    //       }
    //      };

        
    //     const test2ZodSchema:ResType = {
    //       "test2": {
    //         zodSchema:z.object({
    //           a: z.lazy(()=>test2ZodSchema.test2.zodSchema.optional()),
    //         }),
    //         description:""
    //       }
    //     }
        
    //     const logsPath = "C:/Users/nono/Documents/devhome/tmp";
    //     const referenceSchemaFilePath = path.join(logsPath,'test2ZodSchemaJsonSchema.json');
    //     const convertedElementSchemaFilePath = path.join(logsPath,'test2JsonZodSchemaJsonSchema.json');

    //     const convertedJsonZodSchema:ResType = getZodSchemaFromJsonZodSchemaSet(test2JsonZodSchema);
    //     console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$ convertedJsonZodSchema description',convertedJsonZodSchema.test2.description);
        
    //     const test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('test2ZodSchema',test2ZodSchema,test2JsonZodSchema,referenceSchemaFilePath);
    //     const test2ZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('test2JsonZodSchema',convertedJsonZodSchema,test2JsonZodSchema,convertedElementSchemaFilePath);

    //     expect(test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString).toEqual(test2ZodSchemaJsonSchemaWithoutBootstrapElementString)
    //   }
    // )


    // // ###########################################################################################
    // it(
    //   'mutually recursive json Zod schema',
    //   () => {
    //      const testMutuallyRecursiveJsonZodSchema:ZodReferentialElementSet = {
    //       ZodLiteralSchema: {
    //         type: "object",
    //         definition: {
    //           "type": { type: "literal", definition: "literal" },
    //           "definition": { type: "simpleType", definition: "string" },
    //         },
    //       },
    //       ZodObjectWithReferentialSchema: {
    //         type: "object",
    //         definition: {
    //           "optional": { type: "simpleType", definition: "boolean", optional: true },
    //           "type": { type: "literal", definition: "object" },
    //           "definition": {
    //             type: "record",
    //             definition: { type: "schemaReference", definition:"ZodReferentialElementSchema" },
    //           },
    //         },
    //       },
    //       ZodReferentialCoreElementSchema: {
    //         type: "object",
    //         definition: {
    //           "optional": { type: "simpleType", definition: "boolean", optional: true },
    //           "type": { type: "literal", definition: "schemaReference" },
    //           "definition": { type: "simpleType", definition: "string" },
    //         },
    //       },
    //       ZodReferentialElementSchema: {
    //         type: "referentialUnion",
    //         definition: [
    //           // { type: "referentialElement", definition: "ZodEnumSchema"},
    //           // { type: "referentialElement", definition: "ZodFunctionSchema"},
    //           // { type: "referentialElement", definition: "ZodLazySchema"},
    //           { type: "schemaReference", definition: "ZodLiteralSchema"},
    //           // { type: "referentialElement", definition: "ZodSimpleAttributeSchema"},
    //           // { type: "referentialElement", definition: "ZodSimpleArraySchema"},
    //           // { type: "referentialElement", definition: "ZodSimpleBootstrapElementSchema"},
    //           { type: "schemaReference", definition: "ZodObjectWithReferentialSchema"},
    //           { type: "schemaReference", definition: "ZodReferentialCoreElementSchema"},
    //           // { type: "referentialElement", definition: "ZodSimpleRecordSchema"},
    //           // { type: "referentialElement", definition: "ZodSimpleUnionSchema"},
    //           // { type: "referentialElement", definition: "ZodRootSchema"},
    //         ]
    //       },
                
    //      };

        
    //     const test2ZodSchema:ResType = {
    //       "ZodLiteralSchema": {
    //         "zodSchema": ZodLiteralSchema,
    //         description:""
    //       },
    //       "ZodObjectWithReferentialSchema": {
    //         "zodSchema": z.object({
    //           optional: z.boolean().optional(),
    //           type: z.literal('object'),
    //           definition: z.lazy(()=>z.record(z.string(),test2ZodSchema.ZodReferentialElementSchema.zodSchema)),
    //         }),
    //         description:""
    //       },
    //       "ZodReferentialCoreElementSchema": {
    //         zodSchema: ZodReferentialCoreElementSchema,
    //         description:""
    //       },
    //       "ZodReferentialElementSchema": {
    //         "zodSchema": z.union([
    //           // z.lazy(()=>ZodSimpleElementSchema),
    //           // z.lazy(()=>ZodRecordSchema),
    //           z.lazy(()=>test2ZodSchema.ZodLiteralSchema.zodSchema),
    //           z.lazy(()=>test2ZodSchema.ZodObjectWithReferentialSchema.zodSchema),
    //           z.lazy(()=>test2ZodSchema.ZodReferentialCoreElementSchema.zodSchema),
    //           // z.lazy(()=>ZodReferentialElementArraySchema),
    //           // z.lazy(()=>ZodReferentialUnionSchema),
    //         ]),
    //         description:""
    //       },
    //     }
        
    //     const logsPath = "C:/Users/nono/Documents/devhome/tmp";
    //     const referenceSchemaFilePath = path.join(logsPath,'testMutuallyRecursive_reference.json');
    //     const convertedElementSchemaFilePath = path.join(logsPath,'testMutuallyRecursive_converted.json');

    //     const convertedJsonZodSchema:ResType = getZodSchemaFromJsonZodSchemaSet(testMutuallyRecursiveJsonZodSchema);
    //     console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$ convertedJsonZodSchema description',getDescriptions(convertedJsonZodSchema));
        
    //     const test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('testMutuallyRecursive_reference',test2ZodSchema,testMutuallyRecursiveJsonZodSchema,referenceSchemaFilePath);
    //     const test2ZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('testMutuallyRecursive_converted',convertedJsonZodSchema,testMutuallyRecursiveJsonZodSchema,convertedElementSchemaFilePath);

    //     expect(test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString).toEqual(test2ZodSchemaJsonSchemaWithoutBootstrapElementString)
    //   }
    // )



    // ###########################################################################################
    it(
      'json Zod bootstrap',
      () => {
         const jsonZodBootstrapSchema:ZodReferentialElementSet = {
          ZodEnumSchema: {
            type: "object",
            definition: {
              "type": { type: "literal", definition: "enum" },
              "definition": { type: "array", definition: { type: "simpleType", definition: "string" } },
            },
          },
          ZodFunctionSchema: {
            type: "object",
            definition: {
              type: { type: "literal", definition: "function" },
              args: {
                type: "array",
                definition: { type: "schemaReference", definition: "ZodSimpleAttributeSchema" },
              },
              returns: { type: "schemaReference", definition: "ZodSimpleAttributeSchema", optional: true },
            },
          },
          ZodLiteralSchema: {
            type: "object",
            definition: {
              "type": { type: "literal", definition: "literal" },
              "definition": { type: "simpleType", definition: "string" },
            },
          },
          ZodObjectWithReferentialSchema: {
            type: "object",
            definition: {
              "optional": { type: "simpleType", definition: "boolean", optional: true },
              "type": { type: "literal", definition: "object" },
              "definition": {
                type: "record",
                definition: { type: "schemaReference", definition:"ZodReferentialElementSchema" },
              },
            },
          },
          ZodReferentialCoreElementSchema: {
            type: "object",
            definition: {
              "optional": { type: "simpleType", definition: "boolean", optional: true },
              "type": { type: "literal", definition: "schemaReference" },
              "definition": { type: "simpleType", definition: "string" },
            },
          },
          ZodReferentialElementSchema: {
            type: "referentialUnion",
            definition: [
              { type: "schemaReference", definition: "ZodEnumSchema"},
              { type: "schemaReference", definition: "ZodFunctionSchema"},
              // { type: "schemaReference", definition: "ZodLazySchema"},
              { type: "schemaReference", definition: "ZodLiteralSchema"},
              // { type: "schemaReference", definition: "ZodSimpleArraySchema"},
              // { type: "schemaReference", definition: "ZodSimpleBootstrapElementSchema"},
              { type: "schemaReference", definition: "ZodObjectWithReferentialSchema"},
              { type: "schemaReference", definition: "ZodReferentialCoreElementSchema"},
              { type: "schemaReference", definition: "ZodSimpleAttributeSchema"},
              // { type: "schemaReference", definition: "ZodSimpleRecordSchema"},
              // { type: "schemaReference", definition: "ZodSimpleUnionSchema"},
              // { type: "schemaReference", definition: "ZodRootSchema"},
            ]
          },
          ZodSimpleAttributeSchema: {
            type: "object",
            // extend: {type:"referentialElement", definition:"ZodRootSchema"},
            definition: {
              "optional": { type: "simpleType", definition: "boolean", optional: true },
              "type": { type: "literal", definition: "simpleType" },
              "definition": { type: "enum", definition: ['any','boolean','string','number',] },
            },
          },
         };

        
        const test2ZodSchema:ResType = {
          "ZodEnumSchema": {
            "zodSchema": ZodEnumSchema,
            description:""
          },
          "ZodFunctionSchema": {
            "zodSchema": ZodFunctionSchema,
            description:""
          },
          "ZodLiteralSchema": {
            "zodSchema": ZodLiteralSchema,
            description:""
          },
          "ZodObjectWithReferentialSchema": {
            "zodSchema": z.object({
              optional: z.boolean().optional(),
              type: z.literal('object'),
              definition: z.lazy(()=>z.record(z.string(),test2ZodSchema.ZodReferentialElementSchema.zodSchema)),
            }),
            description:""
          },
          "ZodReferentialCoreElementSchema": {
            zodSchema: ZodReferentialCoreElementSchema,
            description:""
          },
          "ZodReferentialElementSchema": {
            "zodSchema": z.union([
              z.lazy(()=>test2ZodSchema.ZodEnumSchema.zodSchema),
              z.lazy(()=>test2ZodSchema.ZodFunctionSchema.zodSchema),
              // z.lazy(()=>ZodLazySchema),
              z.lazy(()=>test2ZodSchema.ZodLiteralSchema.zodSchema),
              // z.lazy(()=>ZodSimpleArraySchema),
              // z.lazy(()=>ZodSimpleBootstrapElementSchema),
              // z.lazy(()=>ZodSimpleObjectSchema),
              // z.lazy(()=>ZodSimpleRecordSchema),
              // z.lazy(()=>ZodSimpleUnionSchema),
                          // z.lazy(()=>ZodSimpleElementSchema),
              // z.lazy(()=>ZodRecordSchema),
              // z.lazy(()=>test2ZodSchema.ZodLiteralSchema.zodSchema),
              z.lazy(()=>test2ZodSchema.ZodObjectWithReferentialSchema.zodSchema),
              z.lazy(()=>test2ZodSchema.ZodReferentialCoreElementSchema.zodSchema),
              z.lazy(()=>test2ZodSchema.ZodSimpleAttributeSchema.zodSchema),
              // z.lazy(()=>ZodReferentialElementArraySchema),
              // z.lazy(()=>ZodReferentialUnionSchema),
            ]),
            description:""
          },
          "ZodSimpleAttributeSchema": {
            zodSchema: ZodSimpleAttributeSchema,
            description:""
          },
        }
        
        const logsPath = "C:/Users/nono/Documents/devhome/tmp";
        const referenceSchemaFilePath = path.join(logsPath,'jsonZodBootstrap_reference.json');
        const convertedElementSchemaFilePath = path.join(logsPath,'jsonZodBootstrap_converted.json');

        const convertedJsonZodSchema:ResType = getZodSchemaFromJsonZodSchemaSet(jsonZodBootstrapSchema);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$ convertedJsonZodSchema description',getDescriptions(convertedJsonZodSchema));
        
        const test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('jsonZodBootstrap_reference',test2ZodSchema,jsonZodBootstrapSchema,referenceSchemaFilePath);
        const test2ZodSchemaJsonSchemaWithoutBootstrapElementString = convertAndWrite('jsonZodBootstrap_converted',convertedJsonZodSchema,jsonZodBootstrapSchema,convertedElementSchemaFilePath);

        expect(test2JsonZodSchemaJsonSchemaWithoutBootstrapElementString).toEqual(test2ZodSchemaJsonSchemaWithoutBootstrapElementString)
      }
    )


    // // ###########################################################################################
    // it(
    //   'zodSelfSchema',
    //   () => {

        
    //     const zodSelfReferenceSchema:ResType = {
    //       // ZodRootSchema,
    //       ZodEnumSchema:{zodSchema:ZodEnumSchema, description: "ZodEnumSchema"},
    //       ZodFunctionSchema:{zodSchema:ZodFunctionSchema, description: "ZodFunctionSchema"},
    //       ZodLazySchema:{zodSchema:ZodLazySchema, description: "ZodLazySchema"},
    //       ZodLiteralSchema:{zodSchema:ZodLiteralSchema, description: "ZodLiteralSchema"},
    //       ZodReferentialCoreElementSchema: {zodSchema:ZodReferentialCoreElementSchema, description: "ZodReferentialCoreElementSchema"},
    //       ZodReferentialElementSchema:{zodSchema:ZodReferentialElementSchema, description: "ZodReferentialElementSchema"},
    //       ZodSimpleAttributeSchema:{zodSchema:ZodSimpleAttributeSchema, description: "ZodSimpleAttributeSchema"},
    //       ZodSimpleBootstrapElementSchema:{zodSchema:ZodSimpleBootstrapElementSchema, description: "ZodSimpleBootstrapElementSchema"},
    //       ZodSimpleElementSchema: {zodSchema:ZodSimpleElementSchema, description: "ZodSimpleElementSchema"},
    //       ZodSimpleArraySchema:{zodSchema:ZodSimpleArraySchema, description: "ZodSimpleArraySchema"},
    //       ZodSimpleObjectSchema:{zodSchema:ZodSimpleObjectSchema, description: "ZodSimpleObjectSchema"},
    //       // ZodSimpleRecordSchema,
    //       // ZodSimpleUnionSchema,
    //       // ZodSimpleTypeSchema,
    //     }
        
    //     const zodJsonBootstrapSchemaDependencies = Object.fromEntries(Object.entries(zodJsonBootstrapSchema).map((e:[string,ZodReferentialElement])=>[e[0],referentialElementDependencies(e[1])]));
    //     console.log('zodJsonBootstrapSchemaDependencies',zodJsonBootstrapSchemaDependencies);
        

    //     const logsPath = "C:/Users/nono/Documents/devhome/tmp";
    //     const referenceSchemaFilePath = path.join(logsPath,'referenceSchema.json');
    //     const convertedElementSchemaFilePath = path.join(logsPath,'convertedElementSchema.json');

    //     const referenceSchemaJsonSchema = _zodToJsonSchema(zodSelfReferenceSchema,zodJsonBootstrapSchemaDependencies,"zodSelfReferenceSchema");
    //     const referenceSchemaJsonSchemaWithoutBootstrapElement = Object.fromEntries(Object.entries(referenceSchemaJsonSchema).filter(e=>e[0]!='ZodSimpleBootstrapElementSchema'))
        
        
    //     const referenceSchemaJsonSchemaWithoutBootstrapElementString = JSON.stringify(referenceSchemaJsonSchemaWithoutBootstrapElement,circularReplacer(),2)


    //     if (fs.existsSync(referenceSchemaFilePath)) {
    //       fs.rmSync(referenceSchemaFilePath)
    //     }
    //     fs.writeFileSync(referenceSchemaFilePath,referenceSchemaJsonSchemaWithoutBootstrapElementString);
    //     // fs.writeFileSync(referenceSchemaFilePath,JSON.stringify(referenceSchemaSerialized,circularReplacer(),2));
    //     // fs.writeFileSync(referenceSchemaFilePath,typeof referenceSchemaSerialized);


    //     const convertedReferentialElement: ResType = getZodSchemaFromJsonZodSchemaSet(zodJsonBootstrapSchema);
    //     console.log('WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW getZodSchemaFromJsonZodSchemaSet convertedReferentialElement',getDescriptions(convertedReferentialElement));
    //     const convertedReferentialElementJsonSchema = _zodToJsonSchema(convertedReferentialElement, zodJsonBootstrapSchemaDependencies,"convertedReferentialElement");
    //     const convertedReferentialElementJsonSchemaWithoutBootstrapElement = Object.fromEntries(Object.entries(convertedReferentialElementJsonSchema).filter(e=>e[0]!='ZodSimpleBootstrapElementSchema'))

    //     const convertedReferentialElementJsonString = JSON.stringify(convertedReferentialElementJsonSchemaWithoutBootstrapElement,circularReplacer(),2)
    //     let simpleBootstrapString = JSON.stringify(referenceSchemaJsonSchema['ZodSimpleBootstrapElementSchema'],circularReplacer(),2).replace(/ +/g, ' ')
    //     const marker = '"additionalProperties": false,'
    //     simpleBootstrapString = simpleBootstrapString
    //       .substring(
    //         0,
    //         simpleBootstrapString.lastIndexOf(marker) + marker.length - 1
    //       )
    //       .substring(simpleBootstrapString.indexOf("{") + 2); 
    //     console.log('simpleBootstrapString',simpleBootstrapString);
        
    //     // const convertedReferentialElementJsonStringWithPlainBootstrapElement = convertedReferentialElementJsonString.replace(/\"\$ref\": \"2\"/g,simpleBootstrapString)
    //     const convertedReferentialElementJsonStringWithPlainBootstrapElement = convertedReferentialElementJsonString

    //     if (fs.existsSync(convertedElementSchemaFilePath)) {
    //       fs.rmSync(convertedElementSchemaFilePath)
    //     }
    //     fs.writeFileSync(convertedElementSchemaFilePath,convertedReferentialElementJsonStringWithPlainBootstrapElement);
    //     // fs.writeFileSync(convertedElementSchemaFilePath,convertedReferentialElementJsonString);


    //     // console.log("getZodSchemaFromJsonZodSchemaSet referenceSchemaTypeTsString", referenceSchemaTypeTsString);
    //     console.log('getZodSchemaFromJsonZodSchemaSet convertedReferentialElementSetTsString',convertedReferentialElementJsonSchemaWithoutBootstrapElement);
    //     // console.log("getZodSchemaFromJsonZodSchemaSet referenceSchemaTypeTsString", typeof referenceSchemaSerialized);
        
    //     expect(convertedReferentialElementJsonStringWithPlainBootstrapElement.replace(/ +/g, ' ')).toEqual(referenceSchemaJsonSchemaWithoutBootstrapElementString.replace(/ +/g, ' '));

    //     // const referenceSchema: { [z: string]: ZodTypeAny } = {
    //     //   test0: z.string().optional(),
    //     //   test1: z.object({ a: z.string() }),
    //     //   test2: z.object({
    //     //     // b: z.lazy(() => referenceSchema.test0),
    //     //     b: withGetType(z.lazy(() => referenceSchema.test0),(ts) => ts.factory.createIdentifier("test0")),
    //     //     // c: z.lazy(() => referenceSchema.test1),
    //     //     c: withGetType(z.lazy(() => referenceSchema.test1),(ts) => ts.factory.createIdentifier("test1")),
    //     //   }),
    //     //   test3: z.enum([
    //     //     'boolean',
    //     //     'string',
    //     //     'number',
    //     //   ]),
    //     //   test4: z.function().args(z.string(),z.number()).returns(z.number()),
    //     //   test5: z.record(z.string(),z.object({"a":z.string()})),
    //     //   test6: z.union([z.object({"a":z.string()}),z.object({"b":z.number()})]),
    //     //   test7: z.array(z.object({"a":z.string()})),
    //     // };
    //     // const referentialElementSetToBeConverted: ZodReferentialElementSet = {
    //     //   test0: { type: "simpleType", definition: "string", optional: true },
    //     //   test1: {
    //     //     type: "object",
    //     //     definition: { a: { type: "simpleType", definition: "string" } },
    //     //   },
    //     //   test2: {
    //     //     type: "object",
    //     //     definition: {
    //     //       //     a: { type: "simpleType", definition: "string" },
    //     //       //     b: {
    //     //       //       type: "simpleObject",
    //     //       //       definition: {
    //     //       //         b1: { type: "simpleType", definition: "boolean", optional: true },
    //     //       //         b2: { type:"simpleArray", definition: {type:"referentialElement",definition:"test2"}},
    //     //       b: { type: "referentialElement", definition: "test0" },
    //     //       c: { type: "referentialElement", definition: "test1" },
    //     //     },
    //     //   },
    //     //   test3: {
    //     //     type: "enum",
    //     //     definition: ["boolean", "string", "number"],
    //     //   },
    //     //   test4: {
    //     //     type: "function",
    //     //     args: [
    //     //       { type: "simpleType", definition: "string" },
    //     //       { type: "simpleType", definition: "number" },
    //     //     ],
    //     //     returns: { type: "simpleType", definition: "number" },
    //     //   },
    //     //   test5: {
    //     //     type: "record",
    //     //     definition: { type: "object", definition: { a: { type: "simpleType", definition: "string" } } },
    //     //   },
    //     //   test6: {
    //     //     type: "simpleUnion",
    //     //     definition: [
    //     //       {
    //     //         type: "object", definition: { a: { type: "simpleType", definition: "string" } },
    //     //       },
    //     //       {
    //     //         type: "object", definition: { b: { type: "simpleType", definition: "number" } },
    //     //       },
    //     //     ],
    //     //   },
    //     //   test7: {
    //     //     type: "simpleArray",
    //     //     definition: {type: "object", definition: { a: { type: "simpleType", definition: "string" } }},
    //     //   },
    //     //   test8: {
    //     //     type: "lazy",
    //     //     definition: {
    //     //       type: "function", args: [ { type: "simpleType", definition: "string" } ], returns: { type: "simpleType", definition: "string" }
    //     //     }
    //     //   },
    //     // };
    //     // expect(ZodReferentialElementSetSchema.safeParse(referentialElementSetToBeConverted).success).toBeTruthy();
    //     // expect(ZodReferentialElementSetSchema.safeParse(zodJsonBootstrapSchema).success).toBeTruthy();

    //     // const referentialElementSetSchema = getZodSchemaFromJsonZodSchemaSet(referentialElementSetToBeConverted);
    //     // const test1_OK = {a:"toto"};
    //     // const test1_KO = {a:1};
    //     // const test2_OK = {c:{a:'test'}};
    //     // const test2_KO = {b:1};
    //     // const test4_OK:(a:string, b:number)=>number = (a:string, b:number):number => b;
    //     // const test4_KO:string = 'not a function';
    //     // const test5_OK = {"e":{a:"test"},"f":{a:"test2"}};
    //     // const test5_KO = {"e":1};
    //     // const test6_OK = {"a":"test"};
    //     // const test6_OK2 = {b:1};
    //     // const test6_KO = {b:"test"};
    //     // const test7_OK = [{"a":"test"},{"a":"test2"}];
    //     // const test7_OK2 = [] as any[];
    //     // const test7_KO = [{"e":1}];
    //     // const test8_OK:(a:string)=>string = (a:string):string => a;
    //     // const test8_KO:string = 'not a function';
    //     // expect(referentialElementSetSchema.test1.safeParse(test1_OK).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test1.safeParse(test1_KO).success).toBeFalsy();
    //     // // #####
    //     // expect(referentialElementSetSchema.test2.safeParse(test2_OK).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test2.safeParse(test2_KO).success).toBeFalsy();
    //     // // #####
    //     // expect(referentialElementSetSchema.test4.safeParse(test4_OK).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test4.safeParse(test4_KO).success).toBeFalsy();
    //     // // #####
    //     // expect(referentialElementSetSchema.test5.safeParse(test5_OK).success).toBeTruthy();
    //     // // expect(referentialElementSetSchema.test5.safeParse(test5_KO).success).toBeFalsy();
    //     // // #####
    //     // expect(referentialElementSetSchema.test6.safeParse(test6_OK).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test6.safeParse(test6_OK2).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test6.safeParse(test6_KO).success).toBeFalsy();
    //     // // #####
    //     // expect(referentialElementSetSchema.test7.safeParse(test7_OK).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test7.safeParse(test7_OK2).success).toBeTruthy();
    //     // expect(referentialElementSetSchema.test7.safeParse(test7_KO).success).toBeFalsy();
    //     // // #####
    //     // expect(referentialElementSetSchema.test8.safeParse(test8_OK).success).toBeTruthy();
    //     // // expect(referentialElementSetSchema.test8.safeParse(test8_KO).success).toBeFalsy();

    //     // // const zodBootstrapSchema = getZodSchemaFromJsonZodSchemaSet(zodJsonBootstrapSchema);
    //     // // expect(zodBootstrapSchema.ZodSimpleElementSchema.safeParse(referentialElementSetToBeConverted).success).toBeTruthy();
    //     // // // expect(zodBootstrapSchema.ZodReferentialElementSchema.safeParse(zodJsonBootstrapSchema).success).toBeTruthy();

    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'test_getZodSchemaFromJsonZodSchemaSet',
    //   () => {
    //     // TODO: use zodToTs for comparison, because properties (eg, the optional() property for simple types) are not dealt in the same way in
    //     // JSON schema. ZodToTs requires handling of recursive types by hand, though.
    //     const referentialElementSetToBeConverted: ZodReferentialElementSet = {
    //       test0: { type: "simpleType", definition: "string", optional: true },
    //       test1: {
    //         type: "object",
    //         definition: { a: { type: "simpleType", definition: "string" } },
    //       },
    //       test2: {
    //         type: "object",
    //         definition: {
    //           //     a: { type: "simpleType", definition: "string" },
    //           //     b: {
    //           //       type: "simpleObject",
    //           //       definition: {
    //           //         b1: { type: "simpleType", definition: "boolean", optional: true },
    //           //         b2: { type:"simpleArray", definition: {type:"referentialElement",definition:"test2"}},
    //           b: { type: "referentialElement", definition: "test0" },
    //           c: { type: "referentialElement", definition: "test1" },
    //         },
    //       },
    //       test3: {
    //         type: "enum",
    //         definition:['boolean', 'string', 'number',]
    //       },
    //       test4: {
    //         type: "function",
    //         args:[{type:"simpleType",definition:"string"},{type:"simpleType",definition:"number"}],
    //         returns: {type:"simpleType",definition:"number"}
    //       }
    //     };

    //     // type Test0 = z.infer<typeof test0>;
    //     // const test0 = z.string().optional();
    //     // const test1 = z.object({ a: z.string() });
    //     // type Test1 = z.infer<typeof test1>;
    //     // interface Test2 {
    //     //   b: Test1;
    //     // }
    //     // const test2: z.ZodSchema<Test2> = z.object({ b: z.lazy(() => test1) });

    //     const referenceSchema: { [z: string]: ZodTypeAny } = {
    //       // test0,
    //       // test1,
    //       // test2,
    //       test0: z.string().optional(),
    //       test1: z.object({ a: z.string() }),
    //       test2: z.object({
    //         // b: z.lazy(() => referenceSchema.test0),
    //         b: withGetType(z.lazy(() => referenceSchema.test0),(ts) => ts.factory.createIdentifier("test0")),
    //         // c: z.lazy(() => referenceSchema.test1),
    //         c: withGetType(z.lazy(() => referenceSchema.test1),(ts) => ts.factory.createIdentifier("test1")),
    //       }),
    //       test3: z.enum([
    //         'boolean',
    //         'string',
    //         'number',
    //       ]),
    //       test4: z.function().args(z.string(),z.number()).returns(z.number())
    //     };
    //     // const dummy = getSchemaReferencesForTs(referenceSchema)
    //     // console.log('getZodSchemaFromJsonZodSchemaSet referenceSchema','test0', printNode(zodToTs(test0,'test0').node),'test1', printNode(zodToTs(test1,'test1').node),'test2', printNode(zodToTs(test2,'test1').node));
    //     // console.log('getZodSchemaFromJsonZodSchemaSet referenceSchema','test0', JSON.stringify(zodToJsonSchema(test0,'test0'),null,2),'test1', zodToJsonSchema(test1,'test1'),'test2', zodToJsonSchema(test2,'test1'));
    //     // console.log(
    //     //   "getZodSchemaFromJsonZodSchemaSet referenceSchema",
    //     //   "test0",
    //     //   JSON.stringify(zodToJsonSchema(referenceSchema.test0, "test0"), null, 2),
    //     //   "test1",
    //     //   zodToJsonSchema(referenceSchema.test1, "test1"),
    //     //   "test2",
    //     //   zodToJsonSchema(referenceSchema.test2, "test1")
    //     // );


    //     const convertedReferentialElement: ResType = getZodSchemaFromJsonZodSchemaSet(referentialElementSetToBeConverted,true);
    //     // console.log('test_getZodSchemaFromJsonZodSchemaSet JSON.stringify(convertedReferentialElement)',JSON.stringify(convertedReferentialElement));
    //     const {node:referentialElementSetToBeConvertedTs} = _zodToTs(convertedReferentialElement, 'referentialElementSetToBeConverted');
    //     // console.log('test_getZodSchemaFromJsonZodSchemaSet JSON.stringify(referentialElementSetToBeConvertedTs)',JSON.stringify(referentialElementSetToBeConvertedTs));
    //     const convertedReferentialElementSetTsString = _printNode(referentialElementSetToBeConvertedTs,true);


    //     console.log("test_getZodSchemaFromJsonZodSchemaSet referenceSchemaTypeTsString", referenceSchemaTypeTsString);
    //     console.log(
    //       "test_getZodSchemaFromJsonZodSchemaSet convertedReferentialElementSetTsString",
    //       convertedReferentialElementSetTsString
    //     );

    //     // // console.log('getZodSchemaFromJsonZodSchemaSet convertedReferentialElement',convertedReferentialElement);
    //     // const test2ReferenceSimpleTypeTsString = JSON.stringify(
    //     //   _zodToJsonSchema(referenceSchema, "referenceSchema"),
    //     //   null,
    //     //   2
    //     // );
    //     // const convertedReferentialElementSetTsString = JSON.stringify(
    //     //   _zodToJsonSchema(convertedReferentialElement, "convertedReferentialElement"),
    //     //   null,
    //     //   2
    //     // );

    //     // console.log("getZodSchemaFromJsonZodSchemaSet zodSelfSchema", JSON.stringify(
    //     //   _zodToJsonSchema(getZodSchemaFromJsonZodSchemaSet(zodSelfSchema), "zodSelfSchema"),
    //     //   null,
    //     //   2
    //     // ));
    //     const test1_OK = {a:"toto"};
    //     const test1_KO = {a:1};
    //     const test2_OK = {c:{a:'test'}};
    //     const test2_KO = {b:1};
    //     const test4_OK:(a:string, b:number)=>number = (a:string, b:number):number => b;
    //     const test4_KO:(a:string, b:number)=>string|undefined = (a:string, b:number):string|undefined => undefined;

    //     console.log('test_getZodSchemaFromJsonZodSchemaSet referenceSchema.test4.safeParse(test4_KO)',serialize(referenceSchema.test4.safeParse(test4_KO)));
        
    //     expect(convertedReferentialElementSetTsString == referenceSchemaTypeTsString).toBeTruthy();
    //     expect(referenceSchema.test1.safeParse(test1_OK).success).toBeTruthy();
    //     expect(referenceSchema.test1.safeParse(test1_KO).success).toBeFalsy();
    //     expect(referenceSchema.test2.safeParse(test2_OK).success).toBeTruthy();
    //     expect(referenceSchema.test2.safeParse(test2_KO).success).toBeFalsy();
    //     expect(referenceSchema.test4.safeParse(test4_OK).success).toBeTruthy();
    //     // expect(referenceSchema.test4.safeParse(test4_KO).success).toBeFalsy();

    //   }
    // )
  }
)
