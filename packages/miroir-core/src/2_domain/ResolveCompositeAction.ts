import {
  CompositeAction,
  CompositeActionTemplate,
  MetaModel,
  TransformerForBuild,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { transformer_apply, transformer_extended_apply } from "./Transformers";

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
  resolvedCompositeActionDefinition: any,
  resolvedCompositeActionTemplates: any  
} {
  const localActionParams = { ...actionParamValues };
  let localContext: Record<string, any> = { ...actionParamValues }; 

  log.info("resolveCompositeActionTemplate compositeActionTemplate",compositeActionTemplate,"localActionParams", localActionParams);
  if ((compositeActionTemplate as any).transformerType) {
    throw new Error("resolveCompositeActionTemplate can not deal with compositeActionTemplate as whole tranformer");
  }
  // const localeCompositeAction = compositeActionTemplate as CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction;
  const localeCompositeAction = compositeActionTemplate as any;


  const resolvedCompositeActionTemplates: any = {}
  // going imperatively to handle inner references
  if (localeCompositeAction.templates) {
    log.info("resolveCompositeActionTemplate resolving templates", localeCompositeAction.templates);
    for (const t of Object.entries(localeCompositeAction.templates)) {
      const newLocalParameters: Record<string,any> = { ...localActionParams, ...resolvedCompositeActionTemplates };
      log.info("resolveCompositeActionTemplate resolving template", t[0], t[1], "newLocalParameters", newLocalParameters);
      const resolvedTemplate = transformer_extended_apply(
        "build",
        t[0],
        t[1] as any,
        newLocalParameters,
        undefined
      );
      log.info("resolveCompositeActionTemplate resolved template", t[0], resolvedTemplate)
      if (resolvedTemplate.elementType == "failure") {
        log.error("resolveCompositeActionTemplate resolved template error", resolvedTemplate);
      } else {
        resolvedCompositeActionTemplates[t[0]] = resolvedTemplate.elementValue;
      }
    }
  }

  const actionParamsAndTemplates = { ...localActionParams, ...resolvedCompositeActionTemplates };
  const resolvedCompositeActionDefinition: CompositeAction = transformer_extended_apply(
    "build",
    "NO NAME",
    (compositeActionTemplate as any).definition as any as TransformerForBuild,
    actionParamsAndTemplates,
    localContext
  ).elementValue;

  log.info("resolveCompositeActionTemplate compositeInstanceAction localActionParams", localActionParams);
  log.info(
    "resolveCompositeActionTemplate compositeInstanceAction resolvedCompositeActionDefinition",
    JSON.stringify(resolvedCompositeActionDefinition, null, 2)
  );
  return {
    resolvedCompositeActionDefinition,
    resolvedCompositeActionTemplates,
  };

}
