/**
 * Issue #333 Slice 1: UI steps of a `reportTest` reference stored values with `getFromContext`;
 * `resolveReportTestStepReferences` replaces each reference by its value before the step runs.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- storedValueReferences.333.slice1
 * ```
 */
import { describe, expect, it } from "vitest";

import type { ReactComponentTestStep } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { resolveReportTestStepReferences } from "../../../../src/5_tests/ReportTestTools";

const storedValues: Record<string, unknown> = {
  testApplicationUuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  otherBook: {
    book: { uuid: "03ffcae1-b83f-4970-b3d9-04780d3d0780", name: "Ubik", year: 1969 },
  },
};

const otherBookName = {
  transformerType: "getFromContext",
  interpolation: "runtime",
  referencePath: ["otherBook", "book", "name"],
} as const;

describe("resolveReportTestStepReferences (#333)", () => {
  it("leaves a step without references as it is", () => {
    const step: ReactComponentTestStep = { step: "type", target: { ref: "nameField" }, text: "Ubik" };
    expect(resolveReportTestStepReferences(step, storedValues)).toEqual(step);
  });

  it("replaces a referenceName by the stored value", () => {
    const step: ReactComponentTestStep = {
      step: "type",
      target: { ref: "applicationField" },
      text: { transformerType: "getFromContext", referenceName: "testApplicationUuid" },
    };
    expect(resolveReportTestStepReferences(step, storedValues)).toEqual({
      step: "type",
      target: { ref: "applicationField" },
      text: "5af03c98-fe5e-490b-b08f-e1230971c57f",
    });
  });

  it("follows a referencePath into a stored value", () => {
    const step: ReactComponentTestStep = {
      step: "change",
      target: { ref: "yearField" },
      value: { transformerType: "getFromContext", referencePath: ["otherBook", "book", "year"] },
    };
    expect(resolveReportTestStepReferences(step, storedValues)).toEqual({
      step: "change",
      target: { ref: "yearField" },
      value: 1969,
    });
  });

  it("gives a stored number as text to a field that takes a string only", () => {
    const year = { transformerType: "getFromContext", referencePath: ["otherBook", "book", "year"] } as const;
    const typeStep: ReactComponentTestStep = { step: "type", target: { byTestId: year }, text: year };
    const waitStep: ReactComponentTestStep = {
      step: "waitForAttribute",
      target: { ref: "yearField" },
      attribute: "value",
      value: year,
    };
    expect(resolveReportTestStepReferences(typeStep, storedValues)).toEqual({
      step: "type",
      target: { byTestId: "1969" },
      text: "1969",
    });
    expect(resolveReportTestStepReferences(waitStep, storedValues)).toEqual({
      step: "waitForAttribute",
      target: { ref: "yearField" },
      attribute: "value",
      value: "1969",
    });
  });

  it("resolves references in the locators of a target and in the values of expectElement", () => {
    const step: ReactComponentTestStep = {
      step: "expectElement",
      target: { byDisplayValue: otherBookName },
      values: [otherBookName, "literal"],
    };
    const byTestId: ReactComponentTestStep = {
      step: "click",
      target: {
        byTestId: { transformerType: "getFromContext", referencePath: ["otherBook", "book", "uuid"] },
      },
    };
    expect(resolveReportTestStepReferences(step, storedValues)).toEqual({
      step: "expectElement",
      target: { byDisplayValue: "Ubik" },
      values: ["Ubik", "literal"],
    });
    expect(resolveReportTestStepReferences(byTestId, storedValues)).toEqual({
      step: "click",
      target: { byTestId: "03ffcae1-b83f-4970-b3d9-04780d3d0780" },
    });
  });

  it("resolves a reference to an object inside the expected value of expectRenderedValues", () => {
    const step: ReactComponentTestStep = {
      step: "expectRenderedValues",
      label: "the other Book",
      expectedValue: {
        book: { transformerType: "getFromContext", referencePath: ["otherBook", "book"] },
      },
    };
    expect(resolveReportTestStepReferences(step, storedValues)).toEqual({
      step: "expectRenderedValues",
      label: "the other Book",
      expectedValue: {
        book: { uuid: "03ffcae1-b83f-4970-b3d9-04780d3d0780", name: "Ubik", year: 1969 },
      },
    });
  });

  it("fails on an unknown name, listing the stored names", () => {
    const step: ReactComponentTestStep = {
      step: "type",
      target: { ref: "nameField" },
      text: { transformerType: "getFromContext", referenceName: "anotherBook" },
    };
    expect(() => resolveReportTestStepReferences(step, storedValues)).toThrow(
      'text: no stored value "anotherBook" (stored: otherBook, testApplicationUuid)',
    );
  });

  it("fails on a missing path segment, naming the path and the keys found there", () => {
    const step: ReactComponentTestStep = {
      step: "type",
      target: { ref: "nameField" },
      text: { transformerType: "getFromContext", referencePath: ["otherBook", "book", "title"] },
    };
    expect(() => resolveReportTestStepReferences(step, storedValues)).toThrow(
      'text: no stored value at "otherBook.book.title": "otherBook.book" has no "title" (has: name, uuid, year)',
    );
  });

  it("fails when a reference outside an expected value resolves to an object", () => {
    const step: ReactComponentTestStep = {
      step: "type",
      target: { ref: "nameField" },
      text: { transformerType: "getFromContext", referencePath: ["otherBook", "book"] },
    };
    expect(() => resolveReportTestStepReferences(step, storedValues)).toThrow(
      'text: the stored value "otherBook.book" is an object, expected a string, a number or a boolean',
    );
  });

  it("fails on a reference with neither referenceName nor referencePath", () => {
    const step: ReactComponentTestStep = {
      step: "type",
      target: { ref: "nameField" },
      text: { transformerType: "getFromContext" },
    };
    expect(() => resolveReportTestStepReferences(step, storedValues)).toThrow(
      "text: a getFromContext reference needs referenceName or referencePath",
    );
  });

  it("names the field of a reference in a target", () => {
    const step: ReactComponentTestStep = {
      step: "click",
      target: { byText: { transformerType: "getFromContext", referenceName: "missing" } },
    };
    expect(() => resolveReportTestStepReferences(step, {})).toThrow(
      'target.byText: no stored value "missing" (stored: none)',
    );
  });
});
