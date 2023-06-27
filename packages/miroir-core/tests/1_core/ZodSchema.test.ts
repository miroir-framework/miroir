import { ZodTypeAny, string, z } from "zod";
import { printNode, zodToTs } from 'zod-to-ts'
import { zodToJsonSchema } from "zod-to-json-schema";
import { ZodReferentialElementSet, ZodReferentialElementSetSchema, ZodSimpleElement, _printNode, _zodToJsonSchema, _zodToTs } from '../../src/0_interfaces/1_core/ZodSchema'
import { ResType, getZodReferentialSetType, getZodReferentialType, getZodSimpleType } from '../../src/1_core/ZodSchema'
describe(
  'ZodSchema',
  () => {

    // ###########################################################################################
    it(
      'getZodSimpleType',
      () => {
         const Test2: ZodSimpleElement = {
          type: "simpleObject",
          definition: {
            a: { type: "simpleType", definition: "string" },
            b: {
              type: "simpleObject",
              definition: { 
                b1: { type: "simpleType", definition: "boolean", optional: true },
                b2: { type:"simpleArray", definition: {type:"simpleType",definition:"boolean"}}
              },
            },
          },
        };
        
        const test2Schema = z.object({
          a: z.string(),
          b: z.object({b1:z.boolean().optional(), b2: z.array(z.boolean())})
        })
        
        const {node:test2SchemaTs} = zodToTs(test2Schema, 'test2Schema');
        const test2SchemaTsString = printNode(test2SchemaTs);
      
        const {node:test2SimpleTypeTs} = zodToTs(getZodSimpleType(Test2),'test2Schema')
        const test2SimpleTypeTsString = printNode(test2SimpleTypeTs);
      
        expect(test2SchemaTsString == test2SimpleTypeTsString).toBeTruthy() // The Bride Wore Black

      }
    )

    // ###########################################################################################
    it(
      'getZodReferentialSetType',
      () => {
        // TODO: use zodToTs for comparison, because properties (eg, the optional() property for simple types) are not dealt in the same way in
        // JSON schema. ZodToTs requires handling of recursive types by hand, though.
        const referentialElementSetToBeConverted: ZodReferentialElementSet = {
          // test1: { type:"simpleArray", definition: {type:"referentialElement",definition:"number"}},
          test0: { type: "simpleType", definition: "string", optional: true },
          test1: {
            type: "simpleObject",
            definition: { a: { type: "simpleType", definition: "string" } },
          },
          test2: {
            type: "simpleObject",
            definition: {
              //     a: { type: "simpleType", definition: "string" },
              //     b: {
              //       type: "simpleObject",
              //       definition: {
              //         b1: { type: "simpleType", definition: "boolean", optional: true },
              //         b2: { type:"simpleArray", definition: {type:"referentialElement",definition:"test2"}},
              b: { type: "referentialElement", definition: "test0" },
              c: { type: "referentialElement", definition: "test1" },
            },
          },
          // },
          // }
        };

        const test0 = z.string().optional();
        type Test0 = z.infer<typeof test0>;
        const test1 = z.object({ a: z.string() });
        type Test1 = z.infer<typeof test1>;
        interface Test2 {
          b: Test1;
        }
        const test2: z.ZodSchema<Test2> = z.object({ b: z.lazy(() => test1) });

        const referenceSchema: { [z: string]: ZodTypeAny } = {
          // test0,
          // test1,
          // test2,
          test0: z.string().optional(),
          test1: z.object({ a: z.string() }),
          test2: z.object({
            b: z.lazy(() => referenceSchema.test0),
            c: z.lazy(() => referenceSchema.test1),
          }),
        };
        // console.log('getZodReferentialSetType referenceSchema','test0', printNode(zodToTs(test0,'test0').node),'test1', printNode(zodToTs(test1,'test1').node),'test2', printNode(zodToTs(test2,'test1').node));
        // console.log('getZodReferentialSetType referenceSchema','test0', JSON.stringify(zodToJsonSchema(test0,'test0'),null,2),'test1', zodToJsonSchema(test1,'test1'),'test2', zodToJsonSchema(test2,'test1'));
        console.log(
          "getZodReferentialSetType referenceSchema",
          "test0",
          JSON.stringify(zodToJsonSchema(referenceSchema.test0, "test0"), null, 2),
          "test1",
          zodToJsonSchema(referenceSchema.test1, "test1"),
          "test2",
          zodToJsonSchema(referenceSchema.test2, "test1")
        );

        // z.object({
        // b: z.object({b1:z.boolean().optional(), b2: z.array(z.boolean())})
        // })

        // const {node:test2ReferenceSimpleTypeTs} = {node: Object.fromEntries(Object.entries(referenceSchema).map(e=>[e[0],zodToTs(e[1],e[0]).node])) }
        // console.log('getZodReferentialSetType calling printNode on referenceSchema',test2SimpleTypeTs);
        // const test2ReferenceSimpleTypeTsString = _printNode(test2ReferenceSimpleTypeTs,true);

        const test2ReferenceSimpleTypeTsString = JSON.stringify(
          _zodToJsonSchema(referenceSchema, "referenceSchema"),
          null,
          2
        );

        const convertedReferentialElement: ResType = getZodReferentialSetType(referentialElementSetToBeConverted);
        // const {node:referentialElementSetToBeConvertedTs} = _zodToTs(convertedReferentialElement, 'referentialElementSetToBeConverted');
        // console.log('getZodReferentialSetType convertedReferentialElement',convertedReferentialElement);
        // console.log('getZodReferentialSetType calling _printNode on referentialElementSetToBeConvertedTs',referentialElementSetToBeConvertedTs);
        // const convertedReferentialElementSetTsString = _printNode(referentialElementSetToBeConvertedTs,true);
        const convertedReferentialElementSetTsString = JSON.stringify(
          _zodToJsonSchema(convertedReferentialElement, "convertedReferentialElement"),
          null,
          2
        );

        // console.log('getZodReferentialSetType convertedReferentialElement',convertedReferentialElement);
        console.log(
          "getZodReferentialSetType convertedReferentialElementSetTsString",
          convertedReferentialElementSetTsString
        );
        console.log("getZodReferentialSetType test2ReferenceSimpleTypeTsString", test2ReferenceSimpleTypeTsString);
        expect(convertedReferentialElementSetTsString == test2ReferenceSimpleTypeTsString).toBeTruthy();
        // expect(referenceSchema).toEqual(convertedReferentialElement);
      }
    )
  }
)
