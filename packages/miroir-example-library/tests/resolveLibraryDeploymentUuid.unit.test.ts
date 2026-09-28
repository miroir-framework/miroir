import { describe, expect, it } from "vitest";

import type { ApplicationDeploymentMap } from "miroir-core";

import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";
import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
import { resolveLibraryDeploymentUuid } from "../src/resolveLibraryDeploymentUuid.js";

describe("resolveLibraryDeploymentUuid (Feature 198 D6)", () => {
  it("returns deployment uuid keyed by library self-application", () => {
    const map: ApplicationDeploymentMap = {
      [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
    };
    expect(resolveLibraryDeploymentUuid(map)).toBe(deployment_Library_DO_NO_USE.uuid);
  });

  it("supports legacy libraryDeploymentUuid property on the map object", () => {
    const map = {
      libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
    } as ApplicationDeploymentMap;
    expect(resolveLibraryDeploymentUuid(map)).toBe(deployment_Library_DO_NO_USE.uuid);
  });

  it("falls back to deployment_Library_DO_NO_USE when map has no library entry", () => {
    expect(resolveLibraryDeploymentUuid({})).toBe(deployment_Library_DO_NO_USE.uuid);
  });
});
