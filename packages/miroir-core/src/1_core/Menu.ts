import { Menu, MiroirMenuItem } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export function menu_AddItem_T(menu: Menu, item: MiroirMenuItem, index?: number) {
  switch (menu.definition.menuType) {
    case "simpleMenu": {
      menu.definition.definition.push(item);
      // menu.items.push(item);
      break;
    }
    case "complexMenu": {
      // TODO: add new section if no section exists, or index not provided or index is invalid (out of range, ??)
      menu.definition.definition[index??0].items.push(item);
    }
  }
}