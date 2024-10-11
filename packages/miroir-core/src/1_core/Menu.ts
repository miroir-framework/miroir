import { ComplexMenu, DomainElement, Menu, MiroirMenuItem, Transformer_menu_addItem } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { Step } from "../2_domain/Transformers.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"Menu");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export function transformer_menu_AddItem(
  transformers: any,
  step: Step,
  objectName: string,
  transformer: Transformer_menu_addItem,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): DomainElement {
  const menu = typeof transformer.transformerDefinition.menuReference == "string"?transformers.transformer_InnerReference_resolve(
    step,
    { transformerType: "contextReference", referenceName:transformer.transformerDefinition.menuReference },
    queryParams,
    contextResults
  ).elementValue as Menu
  :
  transformers.transformer_InnerReference_resolve(
    step,
    transformer.transformerDefinition.menuReference,
    queryParams,
    contextResults
  ).elementValue as Menu
  ;

  log.debug("transformer_menu_AddItem resolved menu", JSON.stringify(menu, null, 2));

  const menuItem = typeof transformer.transformerDefinition.menuItemReference == "string"?transformers.transformer_InnerReference_resolve(
    step,
    { transformerType: "contextReference", referenceName:transformer.transformerDefinition.menuItemReference },
    queryParams,
    contextResults
  ).elementValue as MiroirMenuItem
  :
  transformers.transformer_InnerReference_resolve(
    step,
    transformer.transformerDefinition.menuItemReference,
    queryParams,
    contextResults
  ).elementValue as MiroirMenuItem
  ;

  log.debug("transformer_menu_AddItem resolved menuItem", JSON.stringify(menuItem, null, 2));

  if (menu.definition.menuType === "simpleMenu") {
    log.error("transformer_menu_AddItem not implemented for simpleMenu yet");
    return {
      elementType: "object",
      elementValue: menu // this is a free object, not a recursive DomainElement object
    } as any;
    
  }
  const sectionIndex = transformer.transformerDefinition.menuSectionInsertionIndex??0;
  const itemIndex = transformer.transformerDefinition.menuSectionItemInsertionIndex??0;

  const updatedMenu: Menu = { ...menu };
  const items = (updatedMenu.definition as ComplexMenu).definition[sectionIndex].items;
  const insertionIndex = itemIndex < 0 ? itemIndex == -1 ? items.length : itemIndex -1 : itemIndex;
  items.splice(insertionIndex, 0, menuItem);

  // log.debug("transformer_menu_AddItem modified menu", JSON.stringify(menu, null, 2));
  // log.debug("transformer_menu_AddItem modified menu", JSON.stringify(updatedMenu, null, 2));
  return {
    elementType: "object",
    elementValue: updatedMenu // this is a free object, not a recursive DomainElement object
  } as any;
}