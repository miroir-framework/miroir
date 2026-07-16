import { describe, expect, it } from "vitest";
import {
  defaultLibraryAppModel,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import type { MetaModel } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  formatRelativePath,
  listSelfApplicationUuidPaths,
  RELATIVE_PATH_JOKER,
  type RelativePath,
} from "../../src/1_core/listSelfApplicationUuidPaths";
import {
  remapApplicationModelAtPaths,
  RemapApplicationModelAtPathsError,
  remapSelfApplicationUuidModel,
} from "../../src/1_core/remapApplicationModelAtPaths";

const LIBRARY_APP_UUID = selfApplicationLibrary.uuid as string;
const LIBRARY_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const LIBRARY_LENDING_ENDPOINT_UUID = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
const NEW_APP_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NEW_DEPLOYMENT_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const J = RELATIVE_PATH_JOKER;

function libraryPaths(
  options?: Parameters<typeof listSelfApplicationUuidPaths>[2],
): RelativePath[] {
  return listSelfApplicationUuidPaths(
    defaultLibraryAppModel as MetaModel,
    LIBRARY_APP_UUID,
    options,
  );
}

function valuesAtPath(root: unknown, pattern: RelativePath): string[] {
  const values: string[] = [];
  walkPattern(root, pattern, 0, (value) => {
    if (typeof value === "string") {
      values.push(value);
    }
  });
  return values;
}

function walkPattern(
  current: unknown,
  pattern: RelativePath,
  depth: number,
  onLeaf: (value: unknown) => void,
): void {
  if (depth === pattern.length - 1) {
    const key = pattern[depth];
    if (typeof key !== "string" && typeof key !== "number") {
      return;
    }
    if (current !== null && typeof current === "object" && !Array.isArray(current)) {
      onLeaf((current as Record<string, unknown>)[key as string]);
    }
    return;
  }
  const segment = pattern[depth];
  if (segment === J) {
    if (!Array.isArray(current)) {
      return;
    }
    for (const item of current) {
      walkPattern(item, pattern, depth + 1, onLeaf);
    }
    return;
  }
  if (typeof segment === "number") {
    if (!Array.isArray(current)) {
      return;
    }
    walkPattern(current[segment], pattern, depth + 1, onLeaf);
    return;
  }
  if (current !== null && typeof current === "object" && !Array.isArray(current)) {
    walkPattern(
      (current as Record<string, unknown>)[segment],
      pattern,
      depth + 1,
      onLeaf,
    );
  }
}

function collectStringsSkippingTransformers(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") {
    out.push(node);
    return out;
  }
  if (typeof node !== "object" || node === null) {
    return out;
  }
  if (
    !Array.isArray(node) &&
    "transformerType" in (node as Record<string, unknown>)
  ) {
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectStringsSkippingTransformers(item, out);
    }
    return out;
  }
  for (const value of Object.values(node)) {
    collectStringsSkippingTransformers(value, out);
  }
  return out;
}

describe("remapApplicationModelAtPaths (T2)", () => {
  describe("T2-a — round-trip T1 → T2", () => {
    it("replaces old application uuid at every T1 path with the new uuid", () => {
      const paths = libraryPaths();
      const remapped = remapApplicationModelAtPaths(
        defaultLibraryAppModel as MetaModel,
        paths,
        {
          oldApplicationUuid: LIBRARY_APP_UUID,
          newApplicationUuid: NEW_APP_UUID,
        },
      );

      expect(remapped.applicationUuid).toBe(NEW_APP_UUID);
      for (const path of paths) {
        for (const value of valuesAtPath(remapped, path)) {
          expect(value).not.toBe(LIBRARY_APP_UUID);
          if (value.includes(LIBRARY_APP_UUID)) {
            throw new Error(
              `Residual old uuid at ${formatRelativePath(path)}: ${value}`,
            );
          }
        }
      }
      expect(valuesAtPath(remapped, ["applicationUuid"])).toEqual([NEW_APP_UUID]);
    });
  });

  describe("T2-b — endpoint nested payload", () => {
    it("remaps lend/return createInstance payload.application literals", () => {
      const paths = libraryPaths();
      const remapped = remapApplicationModelAtPaths(
        defaultLibraryAppModel as MetaModel,
        paths,
        {
          oldApplicationUuid: LIBRARY_APP_UUID,
          newApplicationUuid: NEW_APP_UUID,
        },
      );

      const lendingEndpoint = remapped.endpoints.find(
        (e) => e.uuid === LIBRARY_LENDING_ENDPOINT_UUID,
      );
      expect(lendingEndpoint?.application).toBe(NEW_APP_UUID);

      const nestedPayloadApplications: string[] = [];
      const walkActions = (node: unknown): void => {
        if (node === null || typeof node !== "object") {
          return;
        }
        if (Array.isArray(node)) {
          for (const item of node) {
            walkActions(item);
          }
          return;
        }
        if ("transformerType" in (node as Record<string, unknown>)) {
          return;
        }
        for (const [key, value] of Object.entries(node)) {
          if (key === "application" && typeof value === "string") {
            nestedPayloadApplications.push(value);
          }
          walkActions(value);
        }
      };
      walkActions(lendingEndpoint?.definition);

      expect(nestedPayloadApplications.length).toBeGreaterThan(0);
      expect(
        nestedPayloadApplications.every((value) => value === NEW_APP_UUID),
      ).toBe(true);
    });
  });

  describe("T2-c — full Library MetaModel", () => {
    it("leaves no residual old application uuid outside transformer subtrees", () => {
      const remapped = remapSelfApplicationUuidModel(
        defaultLibraryAppModel as MetaModel,
        {
          oldApplicationUuid: LIBRARY_APP_UUID,
          newApplicationUuid: NEW_APP_UUID,
        },
      );

      const strings = collectStringsSkippingTransformers(remapped);
      expect(strings.some((s) => s === LIBRARY_APP_UUID)).toBe(false);
      expect(strings.some((s) => s.includes(LIBRARY_APP_UUID))).toBe(false);
    });
  });

  describe("T2-d — fixes duplicateApplicationModel gaps", () => {
    it("remaps nested endpoint actionSequence payload.application (duplicateApplicationModel omits these)", () => {
      const remapped = remapSelfApplicationUuidModel(
        defaultLibraryAppModel as MetaModel,
        {
          oldApplicationUuid: LIBRARY_APP_UUID,
          newApplicationUuid: NEW_APP_UUID,
        },
      );

      const lending = remapped.endpoints.find(
        (e) => e.uuid === LIBRARY_LENDING_ENDPOINT_UUID,
      );
      const serialized = JSON.stringify(lending?.definition);
      expect(serialized).toContain(NEW_APP_UUID);
      expect(serialized).not.toContain(LIBRARY_APP_UUID);
    });
  });

  describe("T2-e — missing path / wrong value", () => {
    const OTHER_APP = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    it("throws when a listed path does not exist on the model", () => {
      expect(() =>
        remapApplicationModelAtPaths(
          defaultLibraryAppModel as MetaModel,
          [["nonexistent", "field"]],
          {
            oldApplicationUuid: LIBRARY_APP_UUID,
            newApplicationUuid: NEW_APP_UUID,
          },
        ),
      ).toThrow(RemapApplicationModelAtPathsError);
    });

    it("throws when the value at a path does not contain the old uuid", () => {
      const model: MetaModel = {
        ...(defaultLibraryAppModel as MetaModel),
        applicationUuid: OTHER_APP,
      };

      expect(() =>
        remapApplicationModelAtPaths(model, [["applicationUuid"]], {
          oldApplicationUuid: LIBRARY_APP_UUID,
          newApplicationUuid: NEW_APP_UUID,
        }),
      ).toThrow(RemapApplicationModelAtPathsError);
    });
  });

  describe("T2-f — optional deployment remap", () => {
    it("updates deploymentUuid when deployment ids are provided", () => {
      const model: MetaModel = {
        ...(defaultLibraryAppModel as MetaModel),
        reports: [
          {
            uuid: "9c0cdb97-9537-4ee2-8053-a6ece3e0afe8",
            selfApplication: LIBRARY_APP_UUID,
            definition: {
              value: {
                application: LIBRARY_APP_UUID,
                deploymentUuid: LIBRARY_DEPLOYMENT_UUID,
              },
            },
          } as unknown as MetaModel["reports"][number],
        ],
      };
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID, {
        includeDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
      });

      const remapped = remapApplicationModelAtPaths(model, paths, {
        oldApplicationUuid: LIBRARY_APP_UUID,
        newApplicationUuid: NEW_APP_UUID,
        oldDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
        newDeploymentUuid: NEW_DEPLOYMENT_UUID,
      });

      const report = remapped.reports[0];
      const deploymentUuid = (
        report.definition as unknown as { value: { deploymentUuid: string } }
      ).value.deploymentUuid;
      expect(deploymentUuid).toBe(NEW_DEPLOYMENT_UUID);
    });
  });

  describe("T1∘T2 composition (C-a)", () => {
    it("remapSelfApplicationUuidModel applies T1 discovery then T2 remap", () => {
      const remapped = remapSelfApplicationUuidModel(
        defaultLibraryAppModel as MetaModel,
        {
          oldApplicationUuid: LIBRARY_APP_UUID,
          newApplicationUuid: NEW_APP_UUID,
        },
      );

      const rediscovered = listSelfApplicationUuidPaths(remapped, LIBRARY_APP_UUID);
      expect(rediscovered).toEqual([]);

      const rediscoveredNew = listSelfApplicationUuidPaths(remapped, NEW_APP_UUID);
      expect(rediscoveredNew.length).toBeGreaterThan(0);
    });

    it("does not mutate the source model", () => {
      const source = defaultLibraryAppModel as MetaModel;
      const before = JSON.stringify(source);
      remapSelfApplicationUuidModel(source, {
        oldApplicationUuid: LIBRARY_APP_UUID,
        newApplicationUuid: NEW_APP_UUID,
      });
      expect(JSON.stringify(source)).toBe(before);
    });
  });
});
