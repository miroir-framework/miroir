import { v4 as uuidv4 } from 'uuid';

import {
  JzodElement,
  JzodSchema,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import { resolveObjectExtendClauseAndDefinition } from "./jzodTypeCheck";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getDefaultValueForJzodSchemaDEFUNCT")
).then((logger: LoggerInterface) => {log = logger});


// @deprecated
export function getDefaultValueForJzodSchemaDEFUNCT(
  jzodSchema:JzodElement
): any {
  // log.info("getDefaultValueForJzodSchemaDEFUNCT called with jzodSchema", jzodSchema)
  if (jzodSchema.optional) {
    return undefined
  }
  // let result
  switch (jzodSchema.type) {
    case "object": {
      const result = Object.fromEntries(
        Object.entries(jzodSchema.definition)
        .filter(
          a => !a[1].optional
        )
        .map(
          a => [a[0], getDefaultValueForJzodSchemaDEFUNCT(a[1])]
      ));
      return result;
    }
    // case "simpleType": {
    //   if (jzodSchema.nullable) {
    //     return undefined;
    //   }
    //   switch (jzodSchema.definition) {
    //     case "string": {
    //       return "";
    //     }
    //     case "number":
    //     case "bigint": {
    //       return 0;
    //     }
    //     case "boolean": {
    //       return false;
    //     }
    //     case "date": {
    //       return new Date();
    //     }
    //     case "any": 
    //     case "undefined":
    //     case "null": {
    //       return undefined;
    //     }
    //     case "uuid":
    //     case "unknown":
    //     case "never":
    //     case "void": {
    //       throw new Error("getDefaultValueForJzodSchemaDEFUNCT can not generate value for schema type " + jzodSchema.type +  " definition " + jzodSchema.definition);
    //       break;
    //     }
    //     default:{
    //       throw new Error("getDefaultValueForJzodSchemaDEFUNCT default case, can not generate value for schema type " + JSON.stringify(jzodSchema, null, 2));
    //       break;
    //     }
    //   }
    // }
    case "string": {
      return "";
    }
    case "number":
    case "bigint": {
      return 0;
    }
    case "boolean": {
      return false;
    }
    case "date": {
      return new Date();
    }
    case "any": 
    case "undefined":
    case "null": {
      return undefined;
    }
    case "uuid":
    case "unknown":
    case "never":
    case "void": {
      throw new Error(
        "getDefaultValueForJzodSchemaDEFUNCT can not generate value for schema type " +
          jzodSchema.type
      );
      break;
    }
    case "literal": {
      return jzodSchema.definition
    }
    case "array": {
      return []
    }
    case "map": {
      return new Map();
    }
    case "set": {
      return new Set();
    }
    case "record": {
      return {}
    }
    case "schemaReference": {
      throw new Error(
        "getDefaultValueForJzodSchemaDEFUNCT does not support schema references, please resolve schema in advance: " +
          JSON.stringify(jzodSchema, null, 2)
      );
    }
    case "union": {
      // throw new Error("getDefaultValueForJzodSchemaDEFUNCT does not handle type: " + jzodSchema.type + " for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      // just take the first choice for default value
      if (jzodSchema.definition.length == 0) {
        throw new Error(
          "getDefaultValueForJzodSchemaDEFUNCT union definition is empty for jzodSchema=" + JSON.stringify(jzodSchema, null, 2)
        );
      }
      return getDefaultValueForJzodSchemaDEFUNCT(jzodSchema.definition[0])
      break;
    }
    case "function":
    case "enum":
    case "lazy":
    case "intersection":
    case "promise":
    case "tuple": {
      throw new Error(
        "getDefaultValueForJzodSchemaDEFUNCT does not handle type: " +
          jzodSchema.type +
          " for jzodSchema=" +
          JSON.stringify(jzodSchema, null, 2)
      );
      break;
    }
    default: {
      throw new Error(
        "getDefaultValueForJzodSchemaDEFUNCT reached default case for type, this is a bug: " +
          JSON.stringify(jzodSchema, null, 2)
      );
      break;
    }
  }
}

// ################################################################################################
export function getDefaultValueForJzodSchemaWithResolution(
  jzodSchema: JzodElement,
  forceOptional: boolean = false,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
): any {
  log.info(
    "getDefaultValueForJzodSchemaWithResolution called with jzodSchema",
    jzodSchema,
    "forceOptional",
    forceOptional,
  );
  if (jzodSchema.optional && !forceOptional) {
    return undefined;
  }
  // let result
  switch (jzodSchema.type) {
    case "object": {
      const resolvedObjectType = resolveObjectExtendClauseAndDefinition(
        jzodSchema,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolution called with resolvedObjectType",
      //   resolvedObjectType
      // );
      const result = Object.fromEntries(
        // Object.entries(jzodSchema.definition)
        Object.entries(resolvedObjectType.definition)
          .filter((a) => !a[1].optional)
          .map((a) => [
            a[0],
            getDefaultValueForJzodSchemaWithResolution(
              a[1],
              forceOptional,
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            ),
          ])
      );
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolution result",
      //   result
      // );
      return result;
    }
    case "string": {
      return "";
    }
    case "number":
    case "bigint": {
      return 0;
    }
    case "boolean": {
      return false;
    }
    case "date": {
      return new Date();
    }
    case "any":
    case "undefined":
    case "null": {
      return undefined;
    }
    case "uuid": {
      // return "00000000-0000-0000-0000-000000000000"; // default UUID value
      return uuidv4(); // default UUID value
    }
    case "unknown":
    case "never":
    case "void": {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution can not generate value for schema type " +
          jzodSchema.type
      );
      break;
    }
    // case "simpleType": {
    //   if (jzodSchema.nullable) {
    //     return undefined;
    //   }
    //   switch (jzodSchema.definition) {
    //     case "string": {
    //       return "";
    //     }
    //     case "number":
    //     case "bigint": {
    //       return 0;
    //     }
    //     case "boolean": {
    //       return false;
    //     }
    //     case "date": {
    //       return new Date();
    //     }
    //     case "any":
    //     case "undefined":
    //     case "null": {
    //       return undefined;
    //     }
    //     case "uuid":
    //     case "unknown":
    //     case "never":
    //     case "void": {
    //       throw new Error("getDefaultValueForJzodSchemaWithResolution can not generate value for schema type " + jzodSchema.type +  " definition " + jzodSchema.definition);
    //       break;
    //     }
    //     default:{
    //       throw new Error("getDefaultValueForJzodSchemaWithResolution default case, can not generate value for schema type " + JSON.stringify(jzodSchema, null, 2));
    //       break;
    //     }
    //   }
    // }
    case "literal": {
      return jzodSchema.definition;
    }
    case "array": {
      return [];
    }
    case "map": {
      return new Map();
    }
    case "set": {
      return new Set();
    }
    case "record": {
      return {};
    }
    case "schemaReference": {
      const resolvedReference = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      return getDefaultValueForJzodSchemaWithResolution(
        resolvedReference,
        forceOptional,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution does not support schema references, please resolve schema in advance: " +
          JSON.stringify(jzodSchema, null, 2)
      );
    }
    case "union": {
      // throw new Error("getDefaultValueForJzodSchemaWithResolution does not handle type: " + jzodSchema.type + " for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      // just take the first choice for default value
      if (jzodSchema.definition.length == 0) {
        throw new Error(
          "getDefaultValueForJzodSchemaWithResolution union definition is empty for jzodSchema=" +
            JSON.stringify(jzodSchema, null, 2)
        );
      }
      if (jzodSchema.tag?.value?.initializeTo) {
        return jzodSchema.tag?.value?.initializeTo;
      } else {
        return getDefaultValueForJzodSchemaWithResolution(
          jzodSchema.definition[0],
          forceOptional,
          miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        );
      }
      break;
    }
    case "enum": {
      if (jzodSchema.tag?.value?.initializeTo) {
        return jzodSchema.tag?.value?.initializeTo;
      // } else if (jzodSchema.definition.length > 0) {
      //   return jzodSchema.definition[0];
      } else {
        throw new Error(
          "getDefaultValueForJzodSchemaWithResolution enum definition does not have 'tag.value.initalizeTo' for jzodSchema=" +
            JSON.stringify(jzodSchema, null, 2)
        );
      }
      break;
    }
    case "function":
    case "lazy":
    case "intersection":
    case "promise":
    case "tuple": {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution does not handle type: " +
          jzodSchema.type +
          " for jzodSchema=" +
          JSON.stringify(jzodSchema, null, 2)
      );
      break;
    }
    default: {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution reached default case for type, this is a bug: " +
          JSON.stringify(jzodSchema, null, 2)
      );
      break;
    }
  }
}


