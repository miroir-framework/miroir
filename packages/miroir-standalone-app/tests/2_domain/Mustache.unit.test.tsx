import { describe, expect } from 'vitest';

import Mustache from "mustache";

// import process from "process";




// import { refreshAllInstancesTest } from "./DomainController.Data.CRUD.React.functions";




describe.sequential("Mustache.unit", () => {
  // ###########################################################################################
  // it("simple template", async () => {

  //   // function nested_template(template_string: string, translate: any) {
  //   //   return function() {
  //   //     return function(text: string, render: any) {
  //   //       return Mustache.render(template_string, translate(render(text)));
  //   //     };
  //   //   };
  //   // }
  //   const transformer = "found: {{name}}"

  //   const result = Mustache.render(transformer, { name: "Joe" });
  //   expect(result).toBe("found: Joe");
  // }); //  end describe('DomainController.Data.CRUD.React',

  it("nested template", async () => {

    function nested_template(template_string: string, translate: any) {
      return function() {
        return function(text: string, render: any) {
          return Mustache.render(template_string, translate(render(text)));
        };
      };
    }
    const globalTES5Transformer = "{{#func}}{{fieldName}}{{/func}}"
    const globalTransformer = "{{#func}} for field {{tempResult}} found value: {{/func}}"
    const localTransformer = "{{fieldName}}"
    const result = Mustache.render(globalTransformer, {
      // func: (text: string) => "what? " + text,
      // func: () => (text: string, render: any) => "AAAAAAAAAAAAAAAA",
      // func: () => (text: string, render: any) => "A" + render(text),
      func: nested_template(localTransformer, (text: string) => ({ tempResult: text })),
      sourceObject: { firstName: "Joe", lastName: "Pesci" },
      fieldName: "firstName",
    });

    console.log("result", result);
    expect(result).toBe("found: Joe");
  }); //  end describe('DomainController.Data.CRUD.React',
});
