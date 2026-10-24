/**
 * #503: the fields that get the Blocks / Form / JSON switch, on the key map of a real type check
 * (the fn.blockView.fields cases build their key-map entries by hand). A template hole holding a
 * transformer is reached through a union, so its type path has no `ref:` segment of the
 * transformer: the transformers inside it are found nested through the key map.
 */
import { describe, expect, it } from "vitest";

import {
  defaultMiroirModelEnvironment,
  isBlockViewRoot,
  mlsTypeCheck,
  type MlElement,
  type MiroirModelEnvironment,
} from "miroir-core";

import runnerDetailsReport from "../../../miroir-app-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/032fde52-9171-4313-be77-7e06d9c35240.json" with { type: "json" };

const reportSchema = {
  type: "schemaReference",
  definition: { absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", relativePath: "report" },
} as MlElement;

const ELEMENT_TO_DISPLAY = "definition.extractorTemplates.elementToDisplay";

function blockViewRootsUnder(report: unknown, prefix: string): string[] {
  const result = mlsTypeCheck(
    reportSchema,
    report,
    [],
    [],
    defaultMiroirModelEnvironment as MiroirModelEnvironment,
    {},
    report,
    {} as any, // reduxDeploymentsState, as the value editor runs it
    undefined,
    report,
  );
  expect(result.status).toBe("ok");
  if (result.status !== "ok") {
    return [];
  }
  return Object.keys(result.keyMap)
    .filter((key) => key.startsWith(prefix) && isBlockViewRoot(result.keyMap[key], result.keyMap))
    .sort();
}

describe("block view roots on a type-checked Report", () => {
  it("a template hole holding a plain value has no switch, one holding a transformer has one", () => {
    expect(blockViewRootsUnder(runnerDetailsReport, ELEMENT_TO_DISPLAY)).toEqual([`${ELEMENT_TO_DISPLAY}.instanceUuid`]);
  });

  it("the transformers inside a template hole holding a transformer have no switch of their own", () => {
    const report = structuredClone(runnerDetailsReport) as any;
    report.definition.extractorTemplates.elementToDisplay.parentName = {
      transformerType: "aggregate",
      interpolation: "runtime",
      applyTo: { transformerType: "getFromParameters", interpolation: "runtime", referenceName: "runners" },
      groupBy: ["name"],
    };
    expect(blockViewRootsUnder(report, ELEMENT_TO_DISPLAY)).toEqual([
      `${ELEMENT_TO_DISPLAY}.instanceUuid`,
      `${ELEMENT_TO_DISPLAY}.parentName`,
    ]);
  });
});
