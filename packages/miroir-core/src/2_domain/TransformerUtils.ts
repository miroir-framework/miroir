import {serializeError} from 'serialize-error';
import {
  Action2Error,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  TransformerFailure,
  type TransformerReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import {
  ExtendedTransformerForRuntime,
  TransformerForBuild,
  TransformerForBuildPlusRuntime,
  TransformerForRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerUtils")
).then((logger: LoggerInterface) => {log = logger});

export type Step = "build" | "runtime";
export type ResolveBuildTransformersTo = "value" | "constantTransformer";

// Lazy-loaded transformer_extended_apply function to avoid circular dependency
let transformer_extended_apply_impl: any = null;

async function getTransformerExtendedApply() {
  if (!transformer_extended_apply_impl) {
    const module = await import("./Transformers");
    transformer_extended_apply_impl = (module as any).transformer_extended_apply;
  }
  return transformer_extended_apply_impl;
}

// ################################################################################################
export async function transformer_extended_apply_wrapper(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime | ExtendedTransformerForRuntime | TransformerForBuildPlusRuntime,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  resolveBuildTransformersTo: ResolveBuildTransformersTo = "constantTransformer",
): Promise<TransformerReturnType<any>> {
  try {
    const transformer_extended_apply = await getTransformerExtendedApply();
    const result = transformer_extended_apply(
      step,
      transformerPath,
      label,
      transformer,
      resolveBuildTransformersTo,
      queryParams,
      contextResults
    );
    // log.info(
    //   "transformer_extended_apply_wrapper called for",
    //   label,
    //   "transformer_extended_apply result",
    //   JSON.stringify(result, null, 2),
    // );  

    if (result instanceof TransformerFailure) {
      log.error(
        "transformer_extended_apply_wrapper failed for",
        label??(transformer as any)["transformerType"],
        "step",
        step,
        "transformer",
        JSON.stringify(transformer, null, 2),
        "result",
        JSON.stringify(result, null, 2)
      );
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        // transformerPath,
        failureOrigin: ["transformer_extended_apply"],
        innerError: result,
        queryContext: "failed to transform object attribute",
        queryParameters: transformer as any,
      });
    } else {
      // log.info(
      //   "transformer_extended_apply_wrapper called for",
      //   label,
      //   "transformer_extended_apply result",
      //   JSON.stringify(result, null, 2),
      // );
      return result;
    }
  } catch (e) {
    log.error(
      "transformer_extended_apply_wrapper failed for",
      label,
      "step",
      step,
      "transformer",
      JSON.stringify(transformer, null, 2),
      "error",
      e
    );
    return new Domain2ElementFailed({
      queryFailure: "FailedTransformer",
      // transformerPath,
      failureOrigin: ["transformer_extended_apply"],
      innerError: serializeError(e) as any,
      queryContext: "failed to transform object attribute",
    });
  }
}
