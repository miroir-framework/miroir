import {
  CompositeAction,
  CompositeActionDefinition,
  CompositeActionTemplate,
  MetaModel,
  TransformerForBuild,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { transformer_apply, transformer_extended_apply } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"resolveCompositeActionTemplate");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export function resolveCompositeActionTemplate(
  compositeActionTemplate: CompositeActionTemplate,
  actionParamValues: Record<string, any>,
  currentModel: MetaModel
// ): CompositeAction {
): {
  resolvedCompositeActionDefinition: CompositeActionDefinition,
  resolvedCompositeActionTemplates: Record<string,any>
} {
  const localActionParams = { ...actionParamValues };
  let localContext: Record<string, any> = { ...actionParamValues }; 
  const compositeActionLabel = (compositeActionTemplate as any).label??"NO_ACTION_LABEL";

  log.info(
    "resolveCompositeActionTemplate compositeActionTemplate",
    compositeActionLabel,
    compositeActionTemplate,
    "localActionParams",
    localActionParams
  );
  if ((compositeActionTemplate as any).transformerType) {
    throw new Error(
      "resolveCompositeActionTemplate can not deal with compositeActionTemplate " +
        compositeActionLabel +
        " as whole tranformer"
    );
  }
  // const localeCompositeAction = compositeActionTemplate as CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
  const localCompositeAction = compositeActionTemplate as any;


  const resolvedCompositeActionTemplates: any = {}
  // going imperatively to handle inner references
  if (localCompositeAction.templates) {
    log.info("resolveCompositeActionTemplate resolving templates", localCompositeAction.templates);
    for (const t of Object.entries(localCompositeAction.templates)) {
      const newLocalParameters: Record<string,any> = { ...localActionParams, ...resolvedCompositeActionTemplates };
      log.info(
        "resolveCompositeActionTemplate",
        compositeActionLabel,
        "resolving template",
        t[0],
        t[1],
        "newLocalParameters",
        newLocalParameters
      );
      const resolvedTemplate = transformer_extended_apply(
        "build",
        t[0],
        t[1] as any,
        newLocalParameters,
        undefined
      );
      log.info("resolveCompositeActionTemplate", compositeActionLabel, "resolved template", t[0], resolvedTemplate);
      if (resolvedTemplate.elementType == "failure") {
        log.error("resolveCompositeActionTemplate resolved template error", resolvedTemplate);
      } else {
        resolvedCompositeActionTemplates[t[0]] = resolvedTemplate.elementValue;
      }
    }
  }

  const actionParamsAndTemplates = { ...localActionParams, ...resolvedCompositeActionTemplates };
  const resolvedCompositeActionDefinition: CompositeActionDefinition = transformer_extended_apply(
    "build",
    compositeActionLabel,
    (compositeActionTemplate as any).definition as any as TransformerForBuild,
    actionParamsAndTemplates,
    localContext
  ).elementValue;

  // log.info("resolveCompositeActionTemplate", compositeActionLabel, "localActionParams", Object.keys(localActionParams));
  log.info(
    "resolveCompositeActionTemplate", compositeActionLabel, "resolvedCompositeActionDefinition",
    // resolvedCompositeActionDefinition
    JSON.stringify(resolvedCompositeActionDefinition, null, 2)
  );
  return {
    resolvedCompositeActionDefinition,
    resolvedCompositeActionTemplates,
  };

}
