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
  ZodSimpleRecordSchema,
  ZodSimpleArraySchema,
  ZodSimpleBootstrapElementSchema,
  ZodSimpleObjectSchema,
  ZodSimpleUnionSchema,
  ZodSimpleElementSchema,
  ZodReferentialElementSchema,
  zodJsonBootstrapSchema,
  ZodReferentialElement,
} from "../../src/0_interfaces/1_core/IZodSchema";
import { _zodToJsonSchema, getZodReferentialSetType, referentialElementDependencies } from '../../src/1_core/ZodSchema';
import { circularReplacer } from "../../src/tools";

describe(
  'ZodSchema',
  () => {

    // // ###########################################################################################
    // it(
    //   'getZodSimpleType',
    //   () => {
    //      const Test2: ZodSimpleElement = {
    //       type: "simpleObject",
    //       definition: {
    //         a: { type: "simpleType", definition: "string" },
    //         b: {
    //           type: "simpleObject",
    //           definition: { 
    //             b1: { type: "simpleType", definition: "boolean", optional: true },
    //             b2: { type:"simpleArray", definition: {type:"simpleType",definition:"boolean"}}
    //           },
    //         },
    //       },
    //     };
        
    //     const test2Schema = z.object({
    //       a: z.string(),
    //       b: z.object({b1:z.boolean().optional(), b2: z.array(z.boolean())})
    //     })
        
    //     const {node:test2SchemaTs} = zodToTs(test2Schema, 'test2Schema');
    //     const test2SchemaTsString = printNode(test2SchemaTs);
      
    //     const {node:test2SimpleTypeTs} = zodToTs(getZodSimpleType(Test2),'test2Schema')
    //     const test2SimpleTypeTsString = printNode(test2SimpleTypeTs);
      
    //     expect(test2SchemaTsString == test2SimpleTypeTsString).toBeTruthy() // The Bride Wore Black

    //   }
    // )
    // ###########################################################################################
    it(
      'zodSelfSchema',
      () => {

        
        const zodSelfReferenceSchema:ResType = {
          // ZodSimpleBootstrapElementSchema,
          // ZodRootSchema,
          ZodEnumSchema,
          // ZodFunctionSchema,
          // ZodLazySchema,
          ZodLiteralSchema,
          ZodReferentialCoreElementSchema,
          // ZodSimpleArraySchema,
          ZodSimpleAttributeSchema,
          ZodSimpleElementSchema,
          // ZodSimpleObjectSchema,
          // ZodSimpleRecordSchema,
          // ZodSimpleUnionSchema,
          // ZodSimpleTypeSchema,
        }
        
        // const serializableSchemaNode = (s:ZodTypeAny):any => {
        //   if ( s instanceof Object && Object.keys(s).includes('_def')) {
        //     return Object.fromEntries(
        //       Object.entries(
        //         s
        //       )
        //       // .filter(s=>!['parse','safeParse','safeParseAsync'].includes(s[0]))
        //       .filter(n=>['_def','spa'].includes(n[0]))
        //       .map(n=>[n[0],serializableSchemaNode(n[1])])
        //     );
        //   } else {
        //     return s;
        //   }
        // }

        // const zodSelfReferenceSchemaSerializable = Object.fromEntries(
        //   Object.entries(zodSelfReferenceSchema).map(
        //     e=>[
        //       e[0],
        //       serializableSchemaNode(e[1])
        //     ]
        //   )
        // )
        // console.log('getZodReferentialSetType referenceSchema',serialize(zodSelfReferenceSchemaSerializable));

        // const {node:referenceSchemaTypeTs} = {node: Object.fromEntries(Object.entries(zodSelfReferenceSchema).map(e=>[e[0],zodToTs(e[1],e[0]).node]))}
        // // console.log('getZodReferentialSetType calling printNode on referenceSchema',referenceSchemaTypeTs);
        // const referenceSchemaTypeTsString = _printNode(referenceSchemaTypeTs,true);
        

        // // console.log('getZodReferentialSetType JSON.stringify(convertedReferentialElement)',JSON.stringify(convertedReferentialElement));
        // const {node:referentialElementSetToBeConvertedTs} = _zodToTs(convertedReferentialElement, 'referentialElementSetToBeConverted');
        // // // console.log('getZodReferentialSetType JSON.stringify(referentialElementSetToBeConvertedTs)',JSON.stringify(referentialElementSetToBeConvertedTs));
        // const convertedReferentialElementSetTsString = _printNode(referentialElementSetToBeConvertedTs,true);
        // const referenceSchemaSerialized = Object.fromEntries(Object.entries(zodSelfReferenceSchema).map((e:[string,ZodTypeAny])=>{const a = zerialize(e[1]);return [e[0],typeof a]}));

        // console.log('getZodReferentialSetType referenceSchema',);


        const zodJsonBootstrapSchemaDependencies = Object.fromEntries(Object.entries(zodJsonBootstrapSchema).map((e:[string,ZodReferentialElement])=>[e[0],referentialElementDependencies(e[1])]));
        console.log('zodJsonBootstrapSchemaDependencies',zodJsonBootstrapSchemaDependencies);
        

        const logsPath = "C:/Users/nono/Documents/devhome/tmp";
        const referenceSchemaFilePath = path.join(logsPath,'referenceSchema.json');
        const convertedElementSchemaFilePath = path.join(logsPath,'convertedElementSchema.json');

        const referenceSchemaTypeTsString = _zodToJsonSchema(zodSelfReferenceSchema,zodJsonBootstrapSchemaDependencies,"zodSelfReferenceSchema");

        if (fs.existsSync(referenceSchemaFilePath)) {
          fs.rmSync(referenceSchemaFilePath)
        }
        fs.writeFileSync(referenceSchemaFilePath,JSON.stringify(referenceSchemaTypeTsString,circularReplacer(),2));
        // fs.writeFileSync(referenceSchemaFilePath,JSON.stringify(referenceSchemaSerialized,circularReplacer(),2));
        // fs.writeFileSync(referenceSchemaFilePath,typeof referenceSchemaSerialized);


        const convertedReferentialElement: ResType = getZodReferentialSetType(zodJsonBootstrapSchema);
        const convertedReferentialElementSetTsString = _zodToJsonSchema(convertedReferentialElement, zodJsonBootstrapSchemaDependencies,"convertedReferentialElement");
        // console.log('getZodReferentialSetType convertedReferentialElement',convertedReferentialElement);

        if (fs.existsSync(convertedElementSchemaFilePath)) {
          fs.rmSync(convertedElementSchemaFilePath)
        }
        fs.writeFileSync(convertedElementSchemaFilePath,JSON.stringify(convertedReferentialElementSetTsString,circularReplacer(),2));
        // console.log("getZodReferentialSetType zodSelfSchema", JSON.stringify(
        //   _zodToJsonSchema(getZodReferentialSetType(zodSelfSchema), "zodSelfSchema"),
        //   null,
        //   2
        // ));


        // console.log("getZodReferentialSetType referenceSchemaTypeTsString", referenceSchemaTypeTsString);
        console.log('getZodReferentialSetType convertedReferentialElementSetTsString',convertedReferentialElementSetTsString);
        // console.log("getZodReferentialSetType referenceSchemaTypeTsString", typeof referenceSchemaSerialized);
        
        expect(convertedReferentialElementSetTsString).toEqual(referenceSchemaTypeTsString);

        // const referenceSchema: { [z: string]: ZodTypeAny } = {
        //   test0: z.string().optional(),
        //   test1: z.object({ a: z.string() }),
        //   test2: z.object({
        //     // b: z.lazy(() => referenceSchema.test0),
        //     b: withGetType(z.lazy(() => referenceSchema.test0),(ts) => ts.factory.createIdentifier("test0")),
        //     // c: z.lazy(() => referenceSchema.test1),
        //     c: withGetType(z.lazy(() => referenceSchema.test1),(ts) => ts.factory.createIdentifier("test1")),
        //   }),
        //   test3: z.enum([
        //     'boolean',
        //     'string',
        //     'number',
        //   ]),
        //   test4: z.function().args(z.string(),z.number()).returns(z.number()),
        //   test5: z.record(z.string(),z.object({"a":z.string()})),
        //   test6: z.union([z.object({"a":z.string()}),z.object({"b":z.number()})]),
        //   test7: z.array(z.object({"a":z.string()})),
        // };
        // const referentialElementSetToBeConverted: ZodReferentialElementSet = {
        //   test0: { type: "simpleType", definition: "string", optional: true },
        //   test1: {
        //     type: "object",
        //     definition: { a: { type: "simpleType", definition: "string" } },
        //   },
        //   test2: {
        //     type: "object",
        //     definition: {
        //       //     a: { type: "simpleType", definition: "string" },
        //       //     b: {
        //       //       type: "simpleObject",
        //       //       definition: {
        //       //         b1: { type: "simpleType", definition: "boolean", optional: true },
        //       //         b2: { type:"simpleArray", definition: {type:"referentialElement",definition:"test2"}},
        //       b: { type: "referentialElement", definition: "test0" },
        //       c: { type: "referentialElement", definition: "test1" },
        //     },
        //   },
        //   test3: {
        //     type: "enum",
        //     definition: ["boolean", "string", "number"],
        //   },
        //   test4: {
        //     type: "function",
        //     args: [
        //       { type: "simpleType", definition: "string" },
        //       { type: "simpleType", definition: "number" },
        //     ],
        //     returns: { type: "simpleType", definition: "number" },
        //   },
        //   test5: {
        //     type: "record",
        //     definition: { type: "object", definition: { a: { type: "simpleType", definition: "string" } } },
        //   },
        //   test6: {
        //     type: "simpleUnion",
        //     definition: [
        //       {
        //         type: "object", definition: { a: { type: "simpleType", definition: "string" } },
        //       },
        //       {
        //         type: "object", definition: { b: { type: "simpleType", definition: "number" } },
        //       },
        //     ],
        //   },
        //   test7: {
        //     type: "simpleArray",
        //     definition: {type: "object", definition: { a: { type: "simpleType", definition: "string" } }},
        //   },
        //   test8: {
        //     type: "lazy",
        //     definition: {
        //       type: "function", args: [ { type: "simpleType", definition: "string" } ], returns: { type: "simpleType", definition: "string" }
        //     }
        //   },
        // };
        // expect(ZodReferentialElementSetSchema.safeParse(referentialElementSetToBeConverted).success).toBeTruthy();
        // expect(ZodReferentialElementSetSchema.safeParse(zodJsonBootstrapSchema).success).toBeTruthy();

        // const referentialElementSetSchema = getZodReferentialSetType(referentialElementSetToBeConverted);
        // const test1_OK = {a:"toto"};
        // const test1_KO = {a:1};
        // const test2_OK = {c:{a:'test'}};
        // const test2_KO = {b:1};
        // const test4_OK:(a:string, b:number)=>number = (a:string, b:number):number => b;
        // const test4_KO:string = 'not a function';
        // const test5_OK = {"e":{a:"test"},"f":{a:"test2"}};
        // const test5_KO = {"e":1};
        // const test6_OK = {"a":"test"};
        // const test6_OK2 = {b:1};
        // const test6_KO = {b:"test"};
        // const test7_OK = [{"a":"test"},{"a":"test2"}];
        // const test7_OK2 = [] as any[];
        // const test7_KO = [{"e":1}];
        // const test8_OK:(a:string)=>string = (a:string):string => a;
        // const test8_KO:string = 'not a function';
        // expect(referentialElementSetSchema.test1.safeParse(test1_OK).success).toBeTruthy();
        // expect(referentialElementSetSchema.test1.safeParse(test1_KO).success).toBeFalsy();
        // // #####
        // expect(referentialElementSetSchema.test2.safeParse(test2_OK).success).toBeTruthy();
        // expect(referentialElementSetSchema.test2.safeParse(test2_KO).success).toBeFalsy();
        // // #####
        // expect(referentialElementSetSchema.test4.safeParse(test4_OK).success).toBeTruthy();
        // expect(referentialElementSetSchema.test4.safeParse(test4_KO).success).toBeFalsy();
        // // #####
        // expect(referentialElementSetSchema.test5.safeParse(test5_OK).success).toBeTruthy();
        // // expect(referentialElementSetSchema.test5.safeParse(test5_KO).success).toBeFalsy();
        // // #####
        // expect(referentialElementSetSchema.test6.safeParse(test6_OK).success).toBeTruthy();
        // expect(referentialElementSetSchema.test6.safeParse(test6_OK2).success).toBeTruthy();
        // expect(referentialElementSetSchema.test6.safeParse(test6_KO).success).toBeFalsy();
        // // #####
        // expect(referentialElementSetSchema.test7.safeParse(test7_OK).success).toBeTruthy();
        // expect(referentialElementSetSchema.test7.safeParse(test7_OK2).success).toBeTruthy();
        // expect(referentialElementSetSchema.test7.safeParse(test7_KO).success).toBeFalsy();
        // // #####
        // expect(referentialElementSetSchema.test8.safeParse(test8_OK).success).toBeTruthy();
        // // expect(referentialElementSetSchema.test8.safeParse(test8_KO).success).toBeFalsy();

        // // const zodBootstrapSchema = getZodReferentialSetType(zodJsonBootstrapSchema);
        // // expect(zodBootstrapSchema.ZodSimpleElementSchema.safeParse(referentialElementSetToBeConverted).success).toBeTruthy();
        // // // expect(zodBootstrapSchema.ZodReferentialElementSchema.safeParse(zodJsonBootstrapSchema).success).toBeTruthy();

      }
    )

    // // ###########################################################################################
    // it(
    //   'test_getZodReferentialSetType',
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
    //     // console.log('getZodReferentialSetType referenceSchema','test0', printNode(zodToTs(test0,'test0').node),'test1', printNode(zodToTs(test1,'test1').node),'test2', printNode(zodToTs(test2,'test1').node));
    //     // console.log('getZodReferentialSetType referenceSchema','test0', JSON.stringify(zodToJsonSchema(test0,'test0'),null,2),'test1', zodToJsonSchema(test1,'test1'),'test2', zodToJsonSchema(test2,'test1'));
    //     // console.log(
    //     //   "getZodReferentialSetType referenceSchema",
    //     //   "test0",
    //     //   JSON.stringify(zodToJsonSchema(referenceSchema.test0, "test0"), null, 2),
    //     //   "test1",
    //     //   zodToJsonSchema(referenceSchema.test1, "test1"),
    //     //   "test2",
    //     //   zodToJsonSchema(referenceSchema.test2, "test1")
    //     // );


    //     const {node:referenceSchemaTypeTs} = {node: Object.fromEntries(Object.entries(referenceSchema).map(e=>[e[0],zodToTs(e[1],e[0]).node]))}
    //     // console.log('test_getZodReferentialSetType calling printNode on referenceSchema',referenceSchemaTypeTs);
    //     const referenceSchemaTypeTsString = _printNode(referenceSchemaTypeTs,true);
    //     // console.log("test_getZodReferentialSetType referenceSchemaTypeTsString", referenceSchemaTypeTsString);


    //     const convertedReferentialElement: ResType = getZodReferentialSetType(referentialElementSetToBeConverted,true);
    //     // console.log('test_getZodReferentialSetType JSON.stringify(convertedReferentialElement)',JSON.stringify(convertedReferentialElement));
    //     const {node:referentialElementSetToBeConvertedTs} = _zodToTs(convertedReferentialElement, 'referentialElementSetToBeConverted');
    //     // console.log('test_getZodReferentialSetType JSON.stringify(referentialElementSetToBeConvertedTs)',JSON.stringify(referentialElementSetToBeConvertedTs));
    //     const convertedReferentialElementSetTsString = _printNode(referentialElementSetToBeConvertedTs,true);


    //     console.log("test_getZodReferentialSetType referenceSchemaTypeTsString", referenceSchemaTypeTsString);
    //     console.log(
    //       "test_getZodReferentialSetType convertedReferentialElementSetTsString",
    //       convertedReferentialElementSetTsString
    //     );

    //     // // console.log('getZodReferentialSetType convertedReferentialElement',convertedReferentialElement);
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

    //     // console.log("getZodReferentialSetType zodSelfSchema", JSON.stringify(
    //     //   _zodToJsonSchema(getZodReferentialSetType(zodSelfSchema), "zodSelfSchema"),
    //     //   null,
    //     //   2
    //     // ));
    //     const test1_OK = {a:"toto"};
    //     const test1_KO = {a:1};
    //     const test2_OK = {c:{a:'test'}};
    //     const test2_KO = {b:1};
    //     const test4_OK:(a:string, b:number)=>number = (a:string, b:number):number => b;
    //     const test4_KO:(a:string, b:number)=>string|undefined = (a:string, b:number):string|undefined => undefined;

    //     console.log('test_getZodReferentialSetType referenceSchema.test4.safeParse(test4_KO)',serialize(referenceSchema.test4.safeParse(test4_KO)));
        
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
