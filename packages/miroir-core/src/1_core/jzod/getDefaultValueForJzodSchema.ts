import {
  JzodElement,
  JzodSchema,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { resolveJzodSchemaReferenceInContext, resolveObjectExtendClauseAndDefinition } from "./JzodUnfoldSchemaForValue";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getDefaultValueForJzodSchema")
).then((logger: LoggerInterface) => {log = logger});


// @deprecated
export function getDefaultValueForJzodSchema(
  jzodSchema:JzodElement
): any {
  log.info("called with jzodSchema", jzodSchema)
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
          a => [a[0], getDefaultValueForJzodSchema(a[1])]
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
    //       throw new Error("getDefaultValueForJzodSchema can not generate value for schema type " + jzodSchema.type +  " definition " + jzodSchema.definition);
    //       break;
    //     }
    //     default:{
    //       throw new Error("getDefaultValueForJzodSchema default case, can not generate value for schema type " + JSON.stringify(jzodSchema, null, 2));
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
        "getDefaultValueForJzodSchema can not generate value for schema type " +
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
        "getDefaultValueForJzodSchema does not support schema references, please resolve schema in advance: " +
          JSON.stringify(jzodSchema, null, 2)
      );
    }
    case "union": {
      // throw new Error("getDefaultValueForJzodSchema does not handle type: " + jzodSchema.type + " for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      // just take the first choice for default value
      if (jzodSchema.definition.length == 0) {
        throw new Error(
          "getDefaultValueForJzodSchema union definition is empty for jzodSchema=" + JSON.stringify(jzodSchema, null, 2)
        );
      }
      return getDefaultValueForJzodSchema(jzodSchema.definition[0])
      break;
    }
    case "function":
    case "enum":
    case "lazy":
    case "intersection":
    case "promise":
    case "tuple": {
      throw new Error(
        "getDefaultValueForJzodSchema does not handle type: " +
          jzodSchema.type +
          " for jzodSchema=" +
          JSON.stringify(jzodSchema, null, 2)
      );
      break;
    }
    default: {
      throw new Error(
        "getDefaultValueForJzodSchema reached default case for type, this is a bug: " +
          JSON.stringify(jzodSchema, null, 2)
      );
      break;
    }
  }
}

export function getDefaultValueForJzodSchemaWithResolution(
  jzodSchema:JzodElement,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): any {
  log.info("getDefaultValueForJzodSchemaWithResolution handleSelectLiteralChange called with jzodSchema", jzodSchema)
  if (jzodSchema.optional) {
    return undefined
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
      )
      log.info("getDefaultValueForJzodSchemaWithResolution handleSelectLiteralChange called with resolvedObjectType", resolvedObjectType)
      const result = Object.fromEntries(
        // Object.entries(jzodSchema.definition)
        Object.entries(resolvedObjectType.definition)
        .filter(
          a => !a[1].optional
        )
        .map(
          a => [a[0], getDefaultValueForJzodSchemaWithResolution(
            a[1],
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext,
          )]
      ));
      log.info("getDefaultValueForJzodSchemaWithResolution handleSelectLiteralChange result", result)
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
    case "uuid":
    case "unknown":
    case "never":
    case "void": {
      throw new Error("getDefaultValueForJzodSchemaWithResolution can not generate value for schema type " + jzodSchema.type);
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
      const resolvedReference = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext,
      )
      return getDefaultValueForJzodSchemaWithResolution(
        resolvedReference,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext,
      );
      throw new Error("getDefaultValueForJzodSchemaWithResolution does not support schema references, please resolve schema in advance: " + JSON.stringify(jzodSchema, null, 2));
    }
    case "union": {
      // throw new Error("getDefaultValueForJzodSchemaWithResolution does not handle type: " + jzodSchema.type + " for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      // just take the first choice for default value
      if (jzodSchema.definition.length == 0) {
        throw new Error("getDefaultValueForJzodSchemaWithResolution union definition is empty for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      }
      if (jzodSchema.tag?.value?.initializeTo) {
        return jzodSchema.tag?.value?.initializeTo
      } else {
        return getDefaultValueForJzodSchemaWithResolution(
          jzodSchema.definition[0],
          miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext,
        )
      }
      break;
    }
    case "function":
    case "enum":
    case "lazy":
    case "intersection":
    case "promise":
    case "tuple": {
      throw new Error("getDefaultValueForJzodSchemaWithResolution does not handle type: " + jzodSchema.type + " for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      break;
    }
    default: {
      throw new Error("getDefaultValueForJzodSchemaWithResolution reached default case for type, this is a bug: " + JSON.stringify(jzodSchema, null, 2));
      break;
    }
  }
}


