import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  action,
  transformerDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// #507: the presentation hints are optional in the schemas of TransformerDefinition and Endpoint
// actions; every stored instance stays valid, with or without hints.

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../../../miroir-app-miroir/assets");
const TRANSFORMER_DEFINITIONS = join(assetsDir, "miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8");
const ENDPOINTS = join(assetsDir, "miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c");

/** Assets that did not parse before #507, by file: each still fails, so a fix asks to drop its entry. */
const KNOWN_INVALID: Record<string, string> = {
  "e44300e8-ed02-40fb-a9ee-d83d08cb1f25.json": "#525: spreadSheetToMlSchema, a mergeIntoObject definition given as a transformer",
};

function assets(dir: string): [string, any][] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => [file, JSON.parse(readFileSync(join(dir, file), "utf8"))]);
}

const hints = {
  labelTemplate: "map [applyTo] with [elementTransformer]",
  icon: "repeat",
  category: "control",
  colorByTheme: { dark: "#3355aa" },
};

describe("presentation hints (#507)", () => {
  it.each(assets(TRANSFORMER_DEFINITIONS))("the TransformerDefinition %s is valid", (file, definition) => {
    if (KNOWN_INVALID[file]) {
      expect(transformerDefinition.safeParse(definition).success, KNOWN_INVALID[file]).toBe(false);
      return;
    }
    expect(transformerDefinition.safeParse(definition).error).toBeUndefined();
  });

  it.each(
    assets(ENDPOINTS).flatMap(([file, endpoint]) =>
      ((endpoint.definition?.actions ?? []) as any[]).map(
        (endpointAction) => [`${file} ${endpointAction.actionParameters.actionType.definition}`, endpointAction] as [string, any],
      ),
    ),
  )("the Endpoint action %s is valid", (_name, endpointAction) => {
    expect(action.safeParse(endpointAction).error).toBeUndefined();
  });

  it("a TransformerDefinition and an Endpoint action take hints", () => {
    const [, mapList] = assets(TRANSFORMER_DEFINITIONS).find(([, definition]) => definition.name === "mapList")!;
    expect(transformerDefinition.safeParse({ ...mapList, presentation: hints }).error).toBeUndefined();
    const [, endpoint] = assets(ENDPOINTS).find(([, candidate]) => candidate.definition?.actions?.length > 0)!;
    expect(action.safeParse({ ...endpoint.definition.actions[0], presentation: { icon: "add" } }).error).toBeUndefined();
  });

  it("a raw color is not a hint: colors come from the Theme", () => {
    const [, mapList] = assets(TRANSFORMER_DEFINITIONS).find(([, definition]) => definition.name === "mapList")!;
    expect(transformerDefinition.safeParse({ ...mapList, presentation: { color: "#ff0000" } }).success).toBe(false);
  });
});
