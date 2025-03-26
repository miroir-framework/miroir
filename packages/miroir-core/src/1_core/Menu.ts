import {
  ComplexMenu,
  DomainElement,
  Menu,
  MiroirMenuItem,
  Transformer_menu_addItem,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { Step } from "../2_domain/TransformersForRuntime";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Menu")
).then((logger: LoggerInterface) => {log = logger});


export function transformer_menu_AddItem(
  transformers: any,
  step: Step,
  objectName: string | undefined,
  transformer: Transformer_menu_addItem,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<Menu> {
// ): Domain2QueryReturnType<DomainElementSuccess> {
  const menu =
    typeof transformer.transformerDefinition.menuReference == "string"
      ? (transformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformer.transformerDefinition.menuReference },
          queryParams,
          contextResults
        ) as Menu)
      : (transformers.transformer_InnerReference_resolve(
          step,
          transformer.transformerDefinition.menuReference,
          queryParams,
          contextResults
        ) as Menu);
  ;

  log.debug("transformer_menu_AddItem resolved menu", JSON.stringify(menu, null, 2));

  const menuItem =
    typeof transformer.transformerDefinition.menuItemReference == "string"
      ? (transformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformer.transformerDefinition.menuItemReference },
          queryParams,
          contextResults
        ) as MiroirMenuItem)
      : (transformers.transformer_InnerReference_resolve(
          step,
          transformer.transformerDefinition.menuItemReference,
          queryParams,
          contextResults
        ) as MiroirMenuItem);
  ;

  log.debug("transformer_menu_AddItem resolved menuItem", JSON.stringify(menuItem, null, 2));

  if (menu.definition.menuType === "simpleMenu") {
    log.error("transformer_menu_AddItem not implemented for simpleMenu yet");
    return menu; // this is a free object, not a recursive DomainElement object
  }
  const sectionIndex = transformer.transformerDefinition.menuSectionInsertionIndex??0;
  const itemIndex = transformer.transformerDefinition.menuSectionItemInsertionIndex??0;

  const updatedMenu: Menu = { ...menu };
  const items = (updatedMenu.definition as ComplexMenu).definition[sectionIndex].items;
  const insertionIndex = itemIndex < 0 ? itemIndex == -1 ? items.length : itemIndex -1 : itemIndex;
  items.splice(insertionIndex, 0, menuItem);

  // log.debug("transformer_menu_AddItem modified menu", JSON.stringify(menu, null, 2));
  // log.debug("transformer_menu_AddItem modified menu", JSON.stringify(updatedMenu, null, 2));
  return updatedMenu; // this is a free object, not a recursive DomainElement object
}