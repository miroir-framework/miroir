import * as fs from "fs";
import * as path from "path";
import { ZodTypeAny, z } from "zod";
import {
  JzodObject,
  JzodToZodResult,
  ZodSchemaAndDescription,
  getJsCodeCorrespondingToZodSchemaAndDescription,
  jzodBootstrapSchema,
  jzodSchemaObjectToZodSchemaAndDescription,
  jzodSchemaObjectToZodSchemaSet,
  jzodSchemaSetToZodSchemaSet,
  jzodSchemaToZodSchema
} from "@miroir-framework/jzod";


import entityDefinitionEntityDefinition from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';

const entityDefinitionEntityDefinitionLocal:{
    jzodSchema: JzodObject,
    [k:string]:any
} = entityDefinitionEntityDefinition as {
  jzodSchema: JzodObject,
  [k:string]:any
};

describe(
  'Jzod',
  () => {

    // // ###########################################################################################
    // it(
    //   'miroir entity definition object format',
    //   () => {

    //     const jzodBootstrapZodSchema:JzodToZodResult<ZodTypeAny> = jzodSchemaSetToZodSchemaSet(jzodBootstrapSchema);

    //     const entityDefinitionEntityDefinitionZodSchema: ZodSchemaAndDescription<ZodTypeAny> = jzodSchemaObjectToZodSchemaSet (
    //       // "entityDefinitionEntityDefinitionJzodSchema",
    //       // entityDefinitionEntityDefinition.jzodSchema,
    //       entityDefinitionEntityDefinitionLocal.jzodSchema,
    //       jzodBootstrapZodSchema
    //     );

    //     console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema.description);
    //     // console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema);
        
    //     expect(entityDefinitionEntityDefinitionZodSchema.zodSchema.parse(entityDefinitionEntityDefinition)).toBeTruthy();

    //     const attributesNewAttribute: any = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew");
    //     // const attributesNewType = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew").type;
    //     console.log("attributesNewAttribute",JSON.stringify(attributesNewAttribute));

    //     const convertedAttributesNewJzodZodSchema:ZodSchemaAndDescription<ZodTypeAny> = jzodSchemaToZodSchema("attributesNew",attributesNewAttribute.type,()=>jzodBootstrapZodSchema);
    //     console.log("convertedAttributesNewJzodZodSchema",convertedAttributesNewJzodZodSchema.description);

    //     expect(convertedAttributesNewJzodZodSchema.zodSchema.parse(entityDefinitionEntityDefinition.attributesNew)).toBeTruthy();

    //     // type entityDefinitionTsType = z.infer<typeof entityDefinitionEntityDefinitionZodSchema.zodSchema>;
    //     // const toto:entityDefinitionTsType = entityDefinitionEntityDefinition;
    //   }
    // )

    // ###########################################################################################
    it(
      'miroir entity definition TS type generation',
      () => {

        const jzodBootstrapZodSchema:JzodToZodResult<ZodTypeAny> = jzodSchemaSetToZodSchemaSet(jzodBootstrapSchema);

        const entityDefinitionEntityDefinitionZodSchema: ZodSchemaAndDescription<ZodTypeAny> = jzodSchemaObjectToZodSchemaAndDescription (
        // const entityDefinitionEntityDefinitionZodSchema: JzodToZodResult<ZodTypeAny> = jzodSchemaObjectToZodSchemaSet (
          // "entityDefinitionEntityDefinitionJzodSchema",
          // entityDefinitionEntityDefinition.jzodSchema,
          entityDefinitionEntityDefinitionLocal.jzodSchema,
          jzodBootstrapZodSchema
        );

        console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema.description);
        // console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema);

        const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-standalone-app/src/miroir-fwk/convertedJzodSchemas.ts";

        // const typeName = 'entityDefinitionEntityDefinition';
//         const jsCode = `export const ${typeName}ZodSchema = z.object(${entityDefinitionEntityDefinitionZodSchema.description});` 
//         console.log('convertedJsonZodSchema',jsCode);
//         // const constDeclarations = objectToJsString(convertedJsonZodSchema);
//         // console.log('constDeclarations',constDeclarations);
 
//         // const definitions = Object.entries(convertedJsonZodSchema).map(a=>`export const ${a[0]} = ${a[1].description};`).reduce((acc:string,curr:string)=>acc + '\n' + curr)

//         const header = 
// `import { ZodType, ZodTypeAny, z } from "zod";
// import { jzodElementSchema, jzodObjectSchema } from "@miroir-framework/jzod";

// `;
//         const footer = 
// `
// export type ${typeName} = z.infer<typeof ${typeName}ZodSchema>
// `
        if (generatedZodSchemasFile) {
          if (fs.existsSync(generatedZodSchemasFile)) {
            // fs.rmSync(path)
            fs.writeFileSync(generatedZodSchemasFile,getJsCodeCorrespondingToZodSchemaAndDescription('entityDefinitionEntityDefinition',entityDefinitionEntityDefinitionZodSchema));
          } else {
            throw new Error("could not find file " + generatedZodSchemasFile);
            
          }
        }

        // expect(entityDefinitionEntityDefinitionZodSchema.zodSchema.parse(entityDefinitionEntityDefinition)).toBeTruthy();

        // const attributesNewAttribute: any = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew");
        // // const attributesNewType = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew").type;
        // console.log("attributesNewAttribute",JSON.stringify(attributesNewAttribute));

        // const convertedAttributesNewJzodZodSchema:ZodSchemaAndDescription<ZodTypeAny> = jzodSchemaToZodSchema("attributesNew",attributesNewAttribute.type,()=>jzodBootstrapZodSchema);
        // console.log("convertedAttributesNewJzodZodSchema",convertedAttributesNewJzodZodSchema.description);

        // expect(convertedAttributesNewJzodZodSchema.zodSchema.parse(entityDefinitionEntityDefinition.attributesNew)).toBeTruthy();

        // // type entityDefinitionTsType = z.infer<typeof entityDefinitionEntityDefinitionZodSchema.zodSchema>;
        // // const toto:entityDefinitionTsType = entityDefinitionEntityDefinition;
      }
    )
  }
)
