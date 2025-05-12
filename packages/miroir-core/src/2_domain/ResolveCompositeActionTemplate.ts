import {
  CompositeAction,
  CompositeActionTemplate,
  MetaModel,
  TransformerForBuild
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { transformer_extended_apply_wrapper } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "resolveCompositeActionTemplate")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export function resolveCompositeActionTemplate(
  compositeActionTemplate: CompositeActionTemplate,
  actionParamValues: Record<string, any>,
  currentModel?: MetaModel
): {
  resolvedCompositeActionDefinition: CompositeAction,
  resolvedCompositeActionTemplates: Record<string,any>
} {
  if (!compositeActionTemplate || !(compositeActionTemplate as any)["actionType"]) {
    throw new Error("resolveCompositeActionTemplate compositeActionTemplate is undefined");
  }
  const localActionParams = { ...actionParamValues };
  // let localContext: Record<string, any> = { ...actionParamValues }; 
  const compositeActionLabel = (compositeActionTemplate as any).actionLabel??"NO_ACTION_LABEL";

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
    // log.info("resolveCompositeActionTemplate resolving templates", localCompositeAction.templates);
    for (const t of Object.entries(localCompositeAction.templates)) {
      const newLocalParameters: Record<string,any> = { ...localActionParams, ...resolvedCompositeActionTemplates };
      // log.info(
      //   "resolveCompositeActionTemplate",
      //   compositeActionLabel,
      //   "resolving template",
      //   t[0],
      //   t[1],
      //   "newLocalParameters",
      //   newLocalParameters
      // );
      const resolvedTemplate = transformer_extended_apply_wrapper(
        // "build",
        "runtime",
        t[0],
        t[1] as any,
        actionParamValues, // queryParams
        newLocalParameters, // contextResults
        "value",
      );
      if (resolvedTemplate.elementType == "failure") {
        log.error("resolveCompositeActionTemplate resolved template error", resolvedTemplate);
        // throw new Error(
        //   "resolveCompositeActionTemplate error resolving template " +
        //   compositeActionLabel + " " + t[0] + " " + JSON.stringify(resolvedTemplate, null, 2)
        // );
      } else {
        log.info("resolveCompositeActionTemplate", compositeActionLabel, "resolved template", t[0], "has value", resolvedTemplate);
        resolvedCompositeActionTemplates[t[0]] = resolvedTemplate;
      }
    }
  }

  const actionParamsAndTemplates = { ...localActionParams, ...resolvedCompositeActionTemplates };
  const resolvedCompositeActionDefinition: CompositeAction = transformer_extended_apply_wrapper(
    "build",
    compositeActionLabel,
    (compositeActionTemplate as any).definition as any as TransformerForBuild,
    actionParamsAndTemplates,
    undefined,// localContext,
    "value",
  );
  log.info(
    "resolveCompositeActionTemplate", compositeActionLabel,
    "actionParamsAndTemplates",
    JSON.stringify(Object.keys(actionParamsAndTemplates), null, 2),
    "resolvedCompositeActionDefinition",
    // resolvedCompositeActionDefinition
    JSON.stringify(resolvedCompositeActionDefinition, null, 2)
  );

  const resolvedCompositeAction: CompositeAction = {
    actionType: "compositeAction",
    actionName: "sequence",
    actionLabel: compositeActionLabel,
    deploymentUuid: (compositeActionTemplate as CompositeAction).deploymentUuid,
    // templates: resolvedCompositeActionTemplates, // TODO: TEMPLATES IN COMPOSITE ACTION?
    definition: resolvedCompositeActionDefinition as any,
  }
  log.info("resolveCompositeActionTemplate", compositeActionLabel, "resolvedCompositeAction", resolvedCompositeAction);

  // log.info("resolveCompositeActionTemplate", compositeActionLabel, "localActionParams", Object.keys(localActionParams));
  return {
    resolvedCompositeActionDefinition: resolvedCompositeAction,
    resolvedCompositeActionTemplates,
  };

}
