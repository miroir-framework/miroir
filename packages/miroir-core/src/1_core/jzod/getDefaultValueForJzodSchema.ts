import { JzodElement } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function getDefaultValueForJzodSchema(
  jzodSchema:JzodElement
): any {
  if (jzodSchema.optional) {
    return undefined
  }
  // let result
  switch (jzodSchema.type) {
    case "object": {
      const result = Object.fromEntries(
        Object.entries(jzodSchema.definition).map(
          a => [a[0], getDefaultValueForJzodSchema(a[1])]
      ));
      return result;
    }
    case "simpleType": {
      if (jzodSchema.nullable) {
        return undefined;
      }
      switch (jzodSchema.definition) {
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
          throw new Error("getDefaultValueForJzodSchema can not generate value for schema type " + jzodSchema.type +  " definition " + jzodSchema.definition);
          break;
        }
        default:{
          throw new Error("getDefaultValueForJzodSchema default case, can not generate value for schema type " + JSON.stringify(jzodSchema, null, 2));
          break;
        }
      }
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
      throw new Error("getDefaultValueForJzodSchema does not support schema references, please resolve schema in advance: " + JSON.stringify(jzodSchema, null, 2));
    }
    case "function":
    case "enum":
    case "lazy":
    case "intersection":
    case "promise":
    case "tuple":
    case "union": {
      throw new Error("getDefaultValueForJzodSchema does not handle type: " + jzodSchema.type + " for jzodSchema="  + JSON.stringify(jzodSchema, null, 2));
      break;
    }
    default: {
      throw new Error("getDefaultValueForJzodSchema reached default case for type, this is a bug: " + JSON.stringify(jzodSchema, null, 2));
      break;
    }
  }
}