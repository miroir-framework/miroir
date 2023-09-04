import * as fs from "fs";
import * as path from "path";
import { AnyZodObject, ZodTypeAny, z } from "zod";
import {
  // ZodSchemaAndDescriptionRecord,
  ZodSchemaAndDescription, jzodElementSchemaToZodSchemaAndDescription,
  // getJsCodeCorrespondingToZodSchemaAndDescription,
  // jzodBootstrapSetSchema,
  // jzodObjectSchemaToZodSchemaAndDescription,
  // jzodSchemaObjectToZodSchemaAndDescriptionRecord,
  // jzodSchemaSetToZodSchemaAndDescriptionRecord,
  // jzodElementSchemaToZodSchemaAndDescription
} from "@miroir-framework/jzod";
import {
  JzodObject, jzodToTsCode,
  // ZodSchemaAndDescriptionRecord,
  // ZodSchemaAndDescription,
  // getJsCodeCorrespondingToZodSchemaAndDescription,
  // jzodBootstrapSetSchema,
  // jzodObjectSchemaToZodSchemaAndDescription,
  // jzodSchemaObjectToZodSchemaAndDescriptionRecord,
  // jzodSchemaSetToZodSchemaAndDescriptionRecord,
  // jzodElementSchemaToZodSchemaAndDescription
} from "@miroir-framework/jzod-ts";

// import { miroirJzodSchemaBootstrapZodSchema } from "../../src/0_interfaces/1_core/EntityDefinition";
import { miroirJzodSchemaBootstrapZodSchema } from "miroir-core";

import entityDefinitionEntityDefinition from '../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import miroirJzodSchemaBootstrap from '../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json';

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

    //     const jzodBootstrapZodSchema:ZodSchemaAndDescriptionRecord<ZodTypeAny> = jzodSchemaSetToZodSchemaAndDescriptionRecord(jzodBootstrapSchema);

    //     const entityDefinitionEntityDefinitionZodSchema: ZodSchemaAndDescription<ZodTypeAny> = jzodSchemaObjectToZodSchemaAndDescriptionRecord (
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

    //     const convertedAttributesNewJzodZodSchema:ZodSchemaAndDescription<ZodTypeAny> = jzodElementSchemaToZodSchemaAndDescription("attributesNew",attributesNewAttribute.type,()=>jzodBootstrapZodSchema);
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

        // const jzodBootstrapZodSchema:ZodSchemaAndDescriptionRecord<ZodTypeAny> = jzodSchemaSetToZodSchemaAndDescriptionRecord(jzodBootstrapSchema);

        // export const miroirJzodSchemaBootstrapZodSchema:ZodSchemaAndDescriptionRecord<ZodTypeAny> = jzodSchemaObjectToZodSchemaAndDescriptionRecord(miroirJzodSchemaBootstrap.definition as JzodObject);
        const globalReferences = ()=>({
          "1e8dab4b-65a3-4686-922e-ce89a2d62aa9": jzodElementSchemaToZodSchemaAndDescription (

            miroirJzodSchemaBootstrap.definition as JzodObject,
            miroirJzodSchemaBootstrapZodSchema,
          )
        });

        console.log("miroir entity definition TS type generation","globalReferences",globalReferences);
        
        const entityDefinitionEntityDefinitionZodSchema: ZodSchemaAndDescription = jzodElementSchemaToZodSchemaAndDescription(
          entityDefinitionEntityDefinitionLocal.jzodSchema,
          miroirJzodSchemaBootstrapZodSchema,
          globalReferences
        );

        console.log("miroir entity definition TS type generation","globalReferences 1e8dab4b-65a3-4686-922e-ce89a2d62aa9",(globalReferences["1e8dab4b-65a3-4686-922e-ce89a2d62aa9"].zodSchema as AnyZodObject).shape);

        console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema.zodText);

        const generatedZodSchemasFile = "C://Users/nono/Documents/devhome/miroir-app/packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/convertedJzodSchemas.ts";

        if (generatedZodSchemasFile) {
          if (fs.existsSync(generatedZodSchemasFile)) {
            // fs.rmSync(path)
            fs.writeFileSync(
              generatedZodSchemasFile,
              jzodToTsCode(
                miroirJzodSchemaBootstrap.definition as JzodObject,
                true
                // "entityDefinitionEntityDefinition",
                // entityDefinitionEntityDefinitionLocal.jzodSchema,
                // entityDefinitionEntityDefinitionZodSchema
              )
            );
          } else {
            throw new Error("could not find file " + generatedZodSchemasFile);
            
          }
        }

        // expect(entityDefinitionEntityDefinitionZodSchema.zodSchema.parse(entityDefinitionEntityDefinition)).toBeTruthy();

        // const attributesNewAttribute: any = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew");
        // // const attributesNewType = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew").type;
        // console.log("attributesNewAttribute",JSON.stringify(attributesNewAttribute));

        // const convertedAttributesNewJzodZodSchema:ZodSchemaAndDescription<ZodTypeAny> = jzodElementSchemaToZodSchemaAndDescription("attributesNew",attributesNewAttribute.type,()=>jzodBootstrapZodSchema);
        // console.log("convertedAttributesNewJzodZodSchema",convertedAttributesNewJzodZodSchema.description);

        // expect(convertedAttributesNewJzodZodSchema.zodSchema.parse(entityDefinitionEntityDefinition.attributesNew)).toBeTruthy();

        // // type entityDefinitionTsType = z.infer<typeof entityDefinitionEntityDefinitionZodSchema.zodSchema>;
        // // const toto:entityDefinitionTsType = entityDefinitionEntityDefinition;
      }
    )
  }
)
