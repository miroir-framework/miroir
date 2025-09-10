import {
  ComplexMenu,
  Menu,
  MiroirMenuItem,
  TransformerForBuild_menu_addItem,
  TransformerForRuntime_menu_addItem
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2QueryReturnType, type TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { defaultTransformers, ResolveBuildTransformersTo, Step } from "../2_domain/TransformersForRuntime";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Menu")
).then((logger: LoggerInterface) => {log = logger});

// export function transformer_mustacheStringTemplate_apply(
//   step: Step,
//   objectName: string | undefined,
//   transformer: TransformerForBuild_mustacheStringTemplate | TransformerForRuntime_mustacheStringTemplate,
//   resolveBuildTransformersTo: ResolveBuildTransformersTo,
//   queryParams: Record<string, any>,
//   contextResults?: Record<string, any>,
// ): Domain2QueryReturnType<any> {

export function handleTransformer_menu_AddItem(
  step: Step,
  transformerPath: string[],
  objectName: string | undefined,
  // transformers: any,
  transformer: TransformerForBuild_menu_addItem | TransformerForRuntime_menu_addItem,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: MiroirModelEnvironment & Record<string, any>,
  contextResults?: Record<string, any>,
): TransformerReturnType<Menu> {
  // TODO: DO A COPY OF THE MENU, DO NOT UPDATE VIA REFERENCE, IT MODIFIES THE "OLD" MENU
  log.info(
    "handleTransformer_menu_AddItem called with",
    "objectName",
    objectName,
    "transformer",
    transformer,
    "resolveBuildTransformersTo",
    resolveBuildTransformersTo,
    // queryParams,
    // Object.keys(contextResults??{}),
    "contextResults",
    contextResults,
  );
  const menu =
    typeof transformer.menuReference == "string"
      ? (defaultTransformers.transformer_InnerReference_resolve(
          step,
          transformerPath,
          {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: transformer.menuReference,
          },
          "value",
          queryParams,
          contextResults
        ) as Menu)
      : (defaultTransformers.transformer_InnerReference_resolve(
          step,
          transformerPath,
          transformer.menuReference,
          "value",
          queryParams,
          contextResults
        ) as Menu);
  ;

  log.debug("transformer_menu_AddItem resolved menu", JSON.stringify(menu, null, 2));

  const menuItem =
    typeof transformer.menuItemReference == "string"
      ? (defaultTransformers.transformer_InnerReference_resolve(
          step,
          transformerPath,
          {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: transformer.menuItemReference,
          },
          "value",
          queryParams,
          contextResults
        ) as MiroirMenuItem)
      : (defaultTransformers.transformer_InnerReference_resolve(
          step,
          transformerPath,
          transformer.menuItemReference,
          "value",
          queryParams,
          contextResults
        ) as MiroirMenuItem);
  ;

  log.debug("transformer_menu_AddItem resolved menuItem", JSON.stringify(menuItem, null, 2));

  if (menu.definition.menuType === "simpleMenu") {
    log.error("transformer_menu_AddItem not implemented for simpleMenu yet");
    return menu; // this is a free object, not a recursive DomainElement object
  }
  const sectionIndex = transformer.menuSectionInsertionIndex??0;
  const itemIndex = transformer.menuSectionItemInsertionIndex??0;

  const updatedMenu: Menu = { ...menu };
  const items = (updatedMenu.definition as ComplexMenu).definition[sectionIndex].items;
  const insertionIndex = itemIndex < 0 ? itemIndex == -1 ? items.length : itemIndex -1 : itemIndex;
  items.splice(insertionIndex, 0, menuItem);

  // log.debug("transformer_menu_AddItem modified menu", JSON.stringify(menu, null, 2));
  // log.debug("transformer_menu_AddItem modified menu", JSON.stringify(updatedMenu, null, 2));
  return updatedMenu; // this is a free object, not a recursive DomainElement object
}