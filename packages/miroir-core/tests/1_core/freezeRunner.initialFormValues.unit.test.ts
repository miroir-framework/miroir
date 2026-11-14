/**
 * #225: the freeze Runner defaults its application to the sidebar application when that
 * application is versioned-internal, and to no value otherwise.
 */
import { describe, expect, it } from "vitest";

import { runnerFreezeApplicationVersion } from "miroir-app-miroir";

import { defaultMiroirModelEnvironment } from "../../src/1_core/Model.js";
import { noValue } from "../../src/1_core/Instance.js";
import { transformer_extended_apply_wrapper } from "../../src/2_domain/TransformersForRuntime.js";

const LIBRARY = "5af03c98-fe5e-490b-b08f-e1230971c57f";

function initialFormValues(transformerParams: Record<string, any>) {
  return transformer_extended_apply_wrapper(
    undefined,
    "runtime",
    [],
    "freezeRunner initialFormValues",
    (runnerFreezeApplicationVersion as any).definition.formMLSchema.initialFormValues,
    "value",
    defaultMiroirModelEnvironment,
    { viewParams: {}, ...transformerParams },
    {},
  );
}

describe("freeze Runner initialFormValues (#225)", () => {
  it("defaults to the sidebar application when it is versioned-internal", () => {
    expect(
      initialFormValues({ sidebarApplication: { uuid: LIBRARY, versioningMode: "versioned-internal" } }),
    ).toEqual({
      application: LIBRARY,
      versionName: "",
      description: "",
      branch: noValue.uuid,
    });
  });

  it("leaves the application empty when the sidebar application is not versioned-internal", () => {
    for (const versioningMode of ["unversioned", "versioned-git", "versioned-external", undefined]) {
      expect(
        initialFormValues({ sidebarApplication: { uuid: LIBRARY, versioningMode } }).application,
      ).toBe(noValue.uuid);
    }
  });

  it("leaves the application empty when no application is selected in the sidebar", () => {
    expect(initialFormValues({ sidebarApplication: {} }).application).toBe(noValue.uuid);
  });

  it("greys out applications that cannot be frozen", () => {
    expect(
      (runnerFreezeApplicationVersion as any).definition.formMLSchema.transformer.definition.application
        .tag.value.display.uuid.optionAvailability,
    ).toBe("freezeTarget");
  });
});
