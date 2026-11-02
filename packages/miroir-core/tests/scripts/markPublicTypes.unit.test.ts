// #649: the generator's @public marks on the generated types of core's public API.
// Vitest rather than MiroirTest: a build script's text transformation, not reachable through the ML.
import { describe, expect, it } from "vitest";

import { markPublicTypes, PUBLIC_TAG } from "../../scripts/markPublicTypes";

const generated = [
  "export const entity = z.object({});",
  "export type Entity = {",
  "  uuid: string;",
  "};",
  "export type EntityX = string;",
  "export type Other = number;",
  "",
].join("\n");

describe("markPublicTypes", () => {
  it("puts the tag on the line before each listed type, and nowhere else", () => {
    const marked = markPublicTypes(generated, ["Entity"]);
    expect(marked).toBe(generated.replace("export type Entity = {", `${PUBLIC_TAG}\nexport type Entity = {`));
  });

  it("leaves an already marked type as it is", () => {
    const once = markPublicTypes(generated, ["Entity", "Other"]);
    expect(markPublicTypes(once, ["Entity", "Other"])).toBe(once);
  });

  it("throws when a listed type is not generated, naming it", () => {
    expect(() => markPublicTypes(generated, ["Entity", "Missing"])).toThrow(/export type Missing =.*found 0/);
  });

  it("throws when a listed type is generated twice", () => {
    expect(() => markPublicTypes(`${generated}export type Other = string;\n`, ["Other"])).toThrow(/found 2/);
  });
});
