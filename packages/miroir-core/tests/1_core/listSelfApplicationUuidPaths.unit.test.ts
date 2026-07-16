import { describe, expect, it } from "vitest";
import {
  defaultLibraryAppModel,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import type { MetaModel } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMiroirMetaModel } from "../../src/1_core/Model";
import {
  formatRelativePath,
  formatRelativePaths,
  listSelfApplicationUuidPaths,
  RELATIVE_PATH_JOKER,
  type RelativePath,
} from "../../src/1_core/listSelfApplicationUuidPaths";

/** Canonical Library SelfApplication — primary T1/T2 design corpus. */
const LIBRARY_APP_UUID = selfApplicationLibrary.uuid as string;
const LIBRARY_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
/** Library Lending endpoint (lendDocument / returnDocument). */
const LIBRARY_LENDING_ENDPOINT_UUID = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
/** Library menu with report links. */
const LIBRARY_MENU_UUID = "dd168e5a-2a21-4d2d-a443-032c6d15eb22";

const OTHER_APP = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

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

function expectPathsInclude(paths: RelativePath[], expected: RelativePath): void {
  expect(formatRelativePaths(paths)).toContain(formatRelativePath(expected));
}

function expectPathsExclude(paths: RelativePath[], expected: RelativePath): void {
  expect(formatRelativePaths(paths)).not.toContain(formatRelativePath(expected));
}

describe("listSelfApplicationUuidPaths (T1)", () => {
  describe("Library application (canonical corpus)", () => {
    it("discovers compact joker paths on defaultLibraryAppModel", () => {
      const formatted = formatRelativePaths(libraryPaths());

      expect(LIBRARY_APP_UUID).toBe("5af03c98-fe5e-490b-b08f-e1230971c57f");
      expectPathsInclude(libraryPaths(), ["applicationUuid"]);
      expect(formatted).toContain("applications.*.uuid");
      expect(formatted).toContain("applications.*.homePageUrl.selfApplication");
      expect(formatted).toContain("entities.*.selfApplication");
      expect(formatted).toContain("endpoints.*.application");
      expect(formatted).toContain("reports.*.selfApplication");
      expect(formatted).toContain("runners.*.application");
      // Menu: many items collapse to one pattern
      expect(formatted).toContain(
        "menus.*.definition.definition.*.items.*.selfApplication",
      );
      // Nested lend/return createInstance payloads (T2 remap targets)
      expect(
        formatted.some(
          (p) =>
            p.includes("endpoints") &&
            p.includes("actionImplementation") &&
            p.endsWith("payload.application"),
        ),
      ).toBe(true);
      // Compact: 6 entity rows → one joker path, not six
      expect(formatted.filter((p) => p === "entities.*.selfApplication")).toHaveLength(1);
      expect(formatted.length).toBeLessThan(20);
      expect(formatted).toMatchSnapshot();
    });

    it("includes Lending endpoint top-level and nested payload patterns", () => {
      const lendingEndpoint = (defaultLibraryAppModel as MetaModel).endpoints.find(
        (e) => e.uuid === LIBRARY_LENDING_ENDPOINT_UUID,
      );
      expect(lendingEndpoint?.name).toBe("Lending");

      const paths = libraryPaths();
      expectPathsInclude(paths, ["endpoints", J, "application"]);
      expectPathsInclude(paths, [
        "endpoints",
        J,
        "definition",
        "actions",
        J,
        "actionImplementation",
        "definition",
        "payload",
        "actionSequence",
        J,
        "payload",
        "application",
      ]);
    });

    it("optional includeDeploymentUuid scans deployment literals (synthetic Library-shaped report)", () => {
      // defaultLibraryAppModel reports do not embed deploymentUuid today; T2 will add
      // deployment remap when report display sections do.
      const model: MetaModel = {
        ...defaultLibraryAppModel,
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
      const withDeployment = formatRelativePaths(
        listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID, {
          includeDeploymentUuid: LIBRARY_DEPLOYMENT_UUID,
        }),
      );
      expect(withDeployment.some((p) => p.endsWith("deploymentUuid"))).toBe(true);
    });

    it("does not match Library uuid when scanning Miroir meta model", () => {
      const libraryHitsOnMiroir = listSelfApplicationUuidPaths(
        defaultMiroirMetaModel as MetaModel,
        LIBRARY_APP_UUID,
      );
      expect(libraryHitsOnMiroir).toEqual([]);
    });
  });

  describe("Miroir application (secondary corpus)", () => {
    it("finds Miroir self-uuid paths only", () => {
      const miroirUuid = selfApplicationMiroir.uuid as string;
      const paths = listSelfApplicationUuidPaths(
        defaultMiroirMetaModel as MetaModel,
        miroirUuid,
      );
      expect(paths.length).toBeGreaterThan(0);
      expectPathsInclude(paths, ["applicationUuid"]);
    });
  });

  describe("minimal synthetic models (edge cases)", () => {
    function emptyMetaModel(overrides: Partial<MetaModel> = {}): MetaModel {
      return {
        applicationUuid: LIBRARY_APP_UUID,
        applicationName: "Library",
        applicationVersions: [],
        applicationVersionCrossEntityDefinition: [],
        applications: [],
        entities: [],
        entityDefinitions: [],
        endpoints: [],
        jzodSchemas: [],
        menus: [],
        storedQueries: [],
        reports: [],
        runners: [],
        themes: [],
        ...overrides,
      };
    }

    it("collapses multiple entity selfApplication rows to entities.*.selfApplication", () => {
      const model = emptyMetaModel({
        entities: [
          { uuid: "e1", selfApplication: LIBRARY_APP_UUID },
          { uuid: "e2", selfApplication: LIBRARY_APP_UUID },
        ] as MetaModel["entities"],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID);
      expectPathsInclude(paths, ["entities", J, "selfApplication"]);
      expect(formatRelativePaths(paths).filter((p) => p.startsWith("entities."))).toHaveLength(
        1,
      );
    });

    it("Endpoint without nested payload — only endpoints.*.application", () => {
      const model = emptyMetaModel({
        endpoints: [
          {
            uuid: LIBRARY_LENDING_ENDPOINT_UUID,
            application: LIBRARY_APP_UUID,
            definition: { actions: [] },
          } as unknown as MetaModel["endpoints"][number],
        ],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID);
      expectPathsInclude(paths, ["endpoints", J, "application"]);
      expect(
        formatRelativePaths(paths).filter((p) => p.includes("actionImplementation")),
      ).toEqual([]);
    });

    it("Menu report-link selfApplication and instanceUuid share joker item path", () => {
      const model = emptyMetaModel({
        menus: [
          {
            uuid: LIBRARY_MENU_UUID,
            definition: {
              menuType: "complexMenu",
              definition: [
                {
                  label: "section",
                  items: [
                    {
                      selfApplication: LIBRARY_APP_UUID,
                      instanceUuid: LIBRARY_APP_UUID,
                    },
                    { selfApplication: LIBRARY_APP_UUID },
                  ],
                },
              ],
            },
          } as MetaModel["menus"][number],
        ],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID);
      expectPathsInclude(paths, [
        "menus",
        J,
        "definition",
        "definition",
        J,
        "items",
        J,
        "selfApplication",
      ]);
      expectPathsInclude(paths, [
        "menus",
        J,
        "definition",
        "definition",
        J,
        "items",
        J,
        "instanceUuid",
      ]);
    });

    it("skips getFromParameters transformer subtrees (param bank binding)", () => {
      const model = emptyMetaModel({
        endpoints: [
          {
            uuid: LIBRARY_LENDING_ENDPOINT_UUID,
            application: LIBRARY_APP_UUID,
            definition: {
              actions: [
                {
                  actionImplementation: {
                    definition: {
                      payload: {
                        actionSequence: [
                          {
                            payload: {
                              application: {
                                transformerType: "getFromParameters",
                                referenceName: "testApplicationUuid",
                                unused: LIBRARY_APP_UUID,
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          } as unknown as MetaModel["endpoints"][number],
        ],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID);
      expectPathsInclude(paths, ["endpoints", J, "application"]);
      expect(
        formatRelativePaths(paths).filter((p) => p.includes("actionSequence")),
      ).toEqual([]);
    });

    it("does not report foreign application selfApplication", () => {
      const model = emptyMetaModel({
        entities: [{ uuid: "e1", selfApplication: OTHER_APP } as MetaModel["entities"][number]],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID);
      expectPathsExclude(paths, ["entities", J, "selfApplication"]);
    });

    it("detects substring embed in string homePageUrl", () => {
      const model = emptyMetaModel({
        applications: [
          {
            uuid: LIBRARY_APP_UUID,
            homePageUrl: `/report/${LIBRARY_APP_UUID}/dep/data/report/x`,
          } as MetaModel["applications"][number],
        ],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID);
      expectPathsInclude(paths, ["applications", J, "homePageUrl"]);
    });

    it("useJokerForArrayIndices: false preserves concrete indices", () => {
      const model = emptyMetaModel({
        entities: [
          { uuid: "e1", selfApplication: LIBRARY_APP_UUID },
          { uuid: "e2", selfApplication: LIBRARY_APP_UUID },
        ] as MetaModel["entities"],
      });
      const paths = listSelfApplicationUuidPaths(model, LIBRARY_APP_UUID, {
        useJokerForArrayIndices: false,
      });
      expect(formatRelativePaths(paths)).toContain("entities.[0].selfApplication");
      expect(formatRelativePaths(paths)).toContain("entities.[1].selfApplication");
      expect(formatRelativePaths(paths)).not.toContain("entities.*.selfApplication");
    });
  });
});
