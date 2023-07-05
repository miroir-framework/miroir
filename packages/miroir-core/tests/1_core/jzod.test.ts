import { z } from "zod";
import {
  JzodObject,
  JzodToZodResult,
  ZodSchemaAndDescription,
  jzodBootstrapSchema,
  jzodSchemaObjectToZodSchemaSet,
  jzodSchemaSetToZodSchemaSet,
  jzodSchemaToZodSchema
} from "@miroir-framework/jzod";




describe(
  'Jzod',
  () => {

    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {

        const entityDefinitionEntityDefinition:{
          jzodSchema: JzodObject,
          [k:string]:any
        } = {
          "uuid":"bdd7ad43-f0fc-4716-90c1-87454c40dd95",
          "parentName":"EntityDefinition",
          "parentUuid":"54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          "entityUuid": "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          "name":"EntityDefinition",
          "conceptLevel":"MetaModel",
          "description": "definition of an entity",
          "jzodSchema": {
            "type": "object",
            "definition": {
              "uuid": { "type": "simpleType", "definition": "string", "validations":[{"type":"uuid"}]},
              "parentName": { "type": "simpleType", "definition": "string"},
              "parentUuid": { "type": "simpleType", "definition": "string", "validations":[{"type":"uuid"}]},
              "name": { "type": "simpleType", "definition": "string"},
              "conceptLevel": { "type": "enum", "definition": ["MetaModel","Model","Data"], "optional": true},
              "description": { "type": "simpleType", "definition": "string"},
              "jzodSchema": { "type": "schemaReference", "definition": "JzodObjectSchema"},
              "attributes": { 
                "type":"array",
                "definition": {
                  "type": "object",
                  "definition": {
                    "id": {"type": "simpleType", "definition": "number"},
                    "name": { "type": "simpleType", "definition": "string"},
                    "defaultLabel": { "type": "simpleType", "definition": "string"},
                    "type": { "type": "simpleType", "definition": "string"},
                    "nullable": { "type": "simpleType", "definition": "boolean"},
                    "editable": { "type": "simpleType", "definition": "boolean"},
                    "lineFormat": { "type": "simpleType", "definition": "any", "optional": true},
                  }
                },
              },
              "attributesNew": { 
                "type": "array",
                "optional": true,
                "definition": {
                  "type": "object",
                  "definition": {
                    "id": { "type": "simpleType", "definition": "number" },
                    "name": { "type": "simpleType", "definition": "string" },
                    "defaultLabel": { "type": "simpleType", "definition": "string" },
                    "type": { "type": "schemaReference", "definition": "JzodElementSchema" },
                    "entityUuid": { "type": "simpleType", "definition": "string", "optional": true, "validations":[{"type":"uuid"}] },
                    "nullable": { "type": "simpleType", "definition": "boolean", "optional": true },
                    "editable": { "type": "simpleType", "definition": "boolean", "optional": true },
                  }
                },
              },
            }
          },
          "attributesNew": [
            {
              "id": 1,
              "name": "uuid",
              "defaultLabel": "Uuid",
              "type": { "type": "simpleType", "definition": "string", "validations":[{"type":"uuid"}]},
              "nullable": false,
              "editable": false
            },
            {
              "id": 2,
              "name": "parentUuid",
              "defaultLabel": "Parent Class",
              "type": { "type": "simpleType", "definition": "string", "validations":[{"type":"uuid"}]},
              "nullable": false,
              "editable": false
            },
            {
              "id": 3,
              "name": "parentName",
              "defaultLabel": "Parent MetaClass Name",
              "type": { "type": "simpleType", "definition": "string", "optional": true, },
              "nullable": true,
              "editable": true
            },
            {
              "id": 4,
              "name": "conceptLevel",
              "defaultLabel": "Concept Level",
              "type": { "type": "enum", "definition": ["MetaModel","Model","Data"], "optional": true},
              "nullable": true,
              "editable": false
            },
            {
              "id": 5,
              "name": "entityUuid",
              "defaultLabel": "Entity of the definition",
              "type": { "type": "simpleType", "definition": "string", "validations":[{"type":"uuid"}]},
              "entityUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              "nullable": false,
              "editable": false
            },
            {
              "id": 6,
              "name": "name",
              "defaultLabel": "Name",
              "type": { "type": "simpleType", "definition": "string"},
              "nullable": false,
              "editable": true
            },
            {
              "id": 7,
              "name": "description",
              "defaultLabel": "Description",
              "type": { "type": "simpleType", "definition": "string", },
              "nullable": true,
              "editable": true
            },
            {
              "id": 8,
              "name": "attributesNew",
              "defaultLabel": "Entity Definition Attributes",
              "type": { 
                "type": "array",
                "optional": true,
                "definition": {
                  "type": "object",
                  "definition": {
                    "id": {"type": "simpleType", "definition": "number"},
                    "name": { "type": "simpleType", "definition": "string"},
                    "defaultLabel": { "type": "simpleType", "definition": "string"},
                    "type": { "type": "schemaReference", "definition": "JzodElementSchema"},
                    "entityUuid": { "type": "simpleType", "definition": "string", "optional": true, "validations":[{"type":"uuid"}]},
                    "nullable": { "type": "simpleType", "definition": "boolean", "optional": true},
                    "editable": { "type": "simpleType", "definition": "boolean", "optional": true},
                  }
                },
              },
              "nullable": false,
              "editable": true,
            }
          ],
          "attributes": [
            {
              "id": 1,
              "name": "uuid",
              "defaultLabel": "Uuid",
              "type": "UUID",
              "nullable": false,
              "editable": false
            },
            {
              "id": 2,
              "name": "parentUuid",
              "defaultLabel": "Parent Class",
              "type": "STRING",
              "nullable": false,
              "editable": false
            },
            {
              "id": 3,
              "name": "parentName",
              "defaultLabel": "Parent MetaClass Name",
              "type": "STRING",
              "nullable": true,
              "editable": true
            },
            {
              "id": 4,
              "name": "conceptLevel",
              "defaultLabel": "Concept Level",
              "type": "STRING",
              "nullable": true,
              "editable": false
            },
            {
              "id": 5,
              "name": "entityUuid",
              "defaultLabel": "Entity of the definition",
              "type": "ENTITY_INSTANCE_UUID",
              "entityUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
              "nullable": false,
              "editable": false
            },
            {
              "id": 6,
              "name": "name",
              "defaultLabel": "Name",
              "type": "STRING",
              "nullable": false,
              "editable": true
            },
            {
              "id": 7,
              "name": "description",
              "defaultLabel": "Description",
              "type": "STRING",
              "nullable": true,
              "editable": true
            },
            {
              "id": 8,
              "name": "attributes",
              "defaultLabel": "Entity Definition Attributes",
              "type": "ARRAY",
              "nullable": false,
              "editable": true,
              "lineFormat": [
                {
                  "id": 1,
                  "name": "id",
                  "defaultLabel": "Id",
                  "type": "NUMBER",
                  "nullable": false,
                  "editable": false
                },
                {
                  "id": 2,
                  "name": "name",
                  "defaultLabel": "Name",
                  "type": "STRING",
                  "nullable": false,
                  "editable": false
                },
                {
                  "id": 3,
                  "name": "defaultLabel",
                  "defaultLabel": "Default Label",
                  "type": "STRING",
                  "nullable": false,
                  "editable": true
                },
                {
                  "id": 4,
                  "name": "type",
                  "defaultLabel": "Type",
                  "type": "STRING",
                  "nullable": false,
                  "editable": true
                },
                {
                  "id": 5,
                  "name": "entityUuid",
                  "defaultLabel": "Entity Uuid",
                  "type": "STRING",
                  "nullable": true,
                  "editable": true
                }
              ]
            }
          ]
        }

        const jzodBootstrapZodSchema:JzodToZodResult = jzodSchemaSetToZodSchemaSet(jzodBootstrapSchema);

        const entityDefinitionEntityDefinitionZodSchema: ZodSchemaAndDescription = jzodSchemaObjectToZodSchemaSet (
          // "entityDefinitionEntityDefinitionJzodSchema",
          entityDefinitionEntityDefinition.jzodSchema,
          jzodBootstrapZodSchema
        );

        console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema.description);
        // console.log("entityDefinitionEntityDefinitionZodSchema",entityDefinitionEntityDefinitionZodSchema);
        
        expect(entityDefinitionEntityDefinitionZodSchema.zodSchema.parse(entityDefinitionEntityDefinition)).toBeTruthy();

        const attributesNewAttribute = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew");
        // const attributesNewType = entityDefinitionEntityDefinition.attributesNew.find((e:any)=>e.name == "attributesNew").type;
        console.log("attributesNewAttribute",JSON.stringify(attributesNewAttribute));

        const convertedAttributesNewJzodZodSchema:ZodSchemaAndDescription = jzodSchemaToZodSchema("attributesNew",attributesNewAttribute.type,()=>jzodBootstrapZodSchema);
        console.log("convertedAttributesNewJzodZodSchema",convertedAttributesNewJzodZodSchema.description);

        expect(convertedAttributesNewJzodZodSchema.zodSchema.parse(entityDefinitionEntityDefinition.attributesNew)).toBeTruthy();

        // type entityDefinitionTsType = z.infer<typeof entityDefinitionEntityDefinitionZodSchema.zodSchema>;
        // const toto:entityDefinitionTsType = entityDefinitionEntityDefinition;
      }
    )
  }
)
