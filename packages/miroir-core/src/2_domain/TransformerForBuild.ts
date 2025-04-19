import { v4 as uuidv4 } from 'uuid';
import {
  Transformer_constants,
  TransformerForBuild,
  TransformerForRuntime,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import { defaultTransformers } from './TransformersForRuntime';

export function transformerBuildToValue(
  transformerForBuild: TransformerForBuild,
  queryParams: Record<string, any>
): Domain2QueryReturnType<any> {
  switch (transformerForBuild.transformerType) {
    case "constant":
    case "constantAsExtractor":
    case "constantArray":
    case "constantBigint":
    case "constantBoolean":
    case "constantUuid":
    case "constantObject":
    case "constantNumber":
    case "constantString": {
      return transformerForBuild.value
    }
    case "newUuid": {
      return uuidv4();
    }
    case "mustacheStringTemplate": {
      return defaultTransformers.transformer_mustacheStringTemplate_apply(
        "build",
        transformerForBuild,
        queryParams,
        {}
      );
    }
    // case "contextReference": {
    //   throw new Error(
    //     "Context reference is not supported in build transformer. Use 'parameterReference' instead."
    //   );
    // }
    case "parameterReference":
    case "objectDynamicAccess":
    case "dataflowObject":
    case "dataflowSequence":
    case "freeObjectTemplate":
    case "objectAlter":
    case "object_fullTemplate":
    case "listReducerToSpreadObject":
    case "objectEntries":
    case "objectValues":
    case "listPickElement":
    case "listReducerToIndexObject":
    case "mapperListToList":
      break;
  
    default:
      break;
  }
  return {
    transformerType: "constant",
    value: undefined,
  };
}
