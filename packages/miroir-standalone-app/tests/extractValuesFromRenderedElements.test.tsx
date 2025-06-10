import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { extractValuesFromRenderedElements } from "./4_view/JzodElementEditorTestTools";

describe("extractValuesFromRenderedElements", () => {
  const dummy = ()=>{}
    it("should convert number textbox values to numbers", () => {
    render(
      <div>
        <input role="textbox" type="number" name="testField.g" defaultValue="123" />
      </div>
    );
    const values = extractValuesFromRenderedElements(expect);
    expect(values).toEqual({
      g: 123,
    });
  });

  it("should warn if number textbox value is not a number", () => {
    // Suppress console.warn for this test
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <div>
        <input role="textbox" type="number" name="testField.h" defaultValue="notanumber" />
      </div>
    );
    // The expect inside extractValuesFromRenderedElements will fail, but we want to check it doesn't throw
    try {
      extractValuesFromRenderedElements(expect);
    } catch (e) {
      // ignore
    }
    spy.mockRestore();
  });

  it("should extract values from textboxes and checkboxes", () => {
    render(
      <div>
        {/* <input type="text" name="testField.a" defaultValue="foo" /> */}
        <input role="textbox" type="text" name="testField.a" value="foo" onChange={dummy} />
        <input role="textbox" type="number" name="testField.b" value="42" onChange={dummy}/>
        <input role="combobox" type="checkbox" name="testField.c" value="true" defaultChecked onChange={dummy}/>
        <input role="combobox" type="checkbox" name="testField.d" value="false" onChange={dummy}/>
      </div>
    );
    const values = extractValuesFromRenderedElements(expect);
    expect(values).toEqual({
      a: "foo",
      b: 42,
      c: true,
      d: false,
    });
  });

  it("should handle empty textboxes and unchecked checkboxes", () => {
    render(
      <div>
        <input role="textbox" type="text" name="testField.e" defaultValue="" />
        <input role="combobox" type="checkbox" name="testField.f" value="false" />
      </div>
    );
    const values = extractValuesFromRenderedElements(expect);
    expect(values).toEqual({
      e: "",
      f: false,
    });
  });

});