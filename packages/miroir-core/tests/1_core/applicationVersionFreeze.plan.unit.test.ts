/**
 * #216 Phase 2 — buildFreezeApplicationVersionPlan / planFreezeApplicationVersion.
 */
import { describe, expect, it } from "vitest";

import {
  buildFreezeApplicationVersionPlan,
  planFreezeApplicationVersion,
  type FreezeApplicationVersionPlan,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function sequentialUuid() {
  let n = 0;
  return () => {
    n += 1;
    return `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
  };
}

describe("216 Phase 2 — first freeze plan", () => {
  it("assembles SAV + EntityVersions + Cross without previousVersion", () => {
    const entities = [
      makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book"),
      makeEntity("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Author"),
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities,
      newUuid: sequentialUuid(),
    });

    expect(plan.selfApplicationVersion.name).toBe("V1");
    expect(plan.selfApplicationVersion.selfApplication).toBe(APP_UUID);
    expect(plan.selfApplicationVersion.branch).toBe(BRANCH_UUID);
    expect(plan.selfApplicationVersion.previousVersion).toBeUndefined();
    expect(plan.selfApplicationVersion.modelCUDMigration).toEqual([]);
    expect(plan.selfApplicationVersion.parentUuid).toBe(
      "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
    );
    expect(plan.selfApplicationVersion.parentName).toBe("ApplicationVersion");

    expect(plan.entityVersions).toHaveLength(2);
    const snapshotUuids = new Set(plan.entityVersions.map((ev) => ev.uuid));
    expect(snapshotUuids.size).toBe(2);
    for (const ev of plan.entityVersions) {
      expect(ev.uuid).not.toBe(ev.entityUuid);
    }
    expect(plan.entityVersions.map((ev) => ev.entityUuid).sort()).toEqual(
      entities.map((e) => e.uuid).sort(),
    );

    expect(plan.crossEntityVersions).toHaveLength(2);
    for (const cross of plan.crossEntityVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(snapshotUuids.has(cross.entityVersion)).toBe(true);
      expect(entities.map((e) => e.uuid)).not.toContain(cross.entityVersion);
      expect(cross.parentUuid).toBe("8bec933d-6287-4de7-8a88-5c24216de9f4");
      expect(cross.parentName).toBe("ApplicationVersionCrossEntityVersion");
    }
    expect(plan.queryVersions).toEqual([]);
    expect(plan.crossQueryVersions).toEqual([]);
    expect(plan.reportVersions).toEqual([]);
    expect(plan.crossReportVersions).toEqual([]);
    expect(plan.menuVersions).toEqual([]);
    expect(plan.crossMenuVersions).toEqual([]);
    expect(plan.endpointVersions).toEqual([]);
    expect(plan.crossEndpointVersions).toEqual([]);
    expect(plan.runnerVersions).toEqual([]);
    expect(plan.crossRunnerVersions).toEqual([]);
    expect(plan.themeVersions).toEqual([]);
    expect(plan.crossThemeVersions).toEqual([]);
    expect(plan.transformerDefinitionVersions).toEqual([]);
    expect(plan.crossTransformerDefinitionVersions).toEqual([]);
    const coveredLive = plan.entityVersions.map((ev) => ev.entityUuid).sort();
    expect(coveredLive).toEqual(entities.map((e) => e.uuid).sort());
  });

  it("rejects duplicate versionName for same app+branch", () => {
    expect(() =>
      buildFreezeApplicationVersionPlan({
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        versionName: "V1",
        entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
        existingApplicationVersions: [
          {
            uuid: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
            name: "V1",
            selfApplication: APP_UUID,
            branch: BRANCH_UUID,
          },
        ],
      }),
    ).toThrow(/already exists/);
  });

  it("allows same versionName on a different branch", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      existingApplicationVersions: [
        {
          uuid: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          name: "V1",
          selfApplication: APP_UUID,
          branch: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        },
      ],
      newUuid: sequentialUuid(),
    });
    expect(plan.selfApplicationVersion.name).toBe("V1");
  });
});

describe("216 Phase 2 — planFreezeApplicationVersion gate wrapper", () => {
  it("rejects unversioned selfApplication", () => {
    expect(() =>
      planFreezeApplicationVersion({
        selfApplication: { versioningEnabled: false },
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        versionName: "V1",
        entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      }),
    ).toThrow(/versioning enabled/);
  });

  it("builds plan when versioningEnabled is true", () => {
    const plan = planFreezeApplicationVersion({
      selfApplication: { versioningEnabled: true },
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      newUuid: sequentialUuid(),
    });
    expect(plan.selfApplicationVersion.name).toBe("V1");
    expect(plan.entityVersions).toHaveLength(1);
    expect(plan.crossEntityVersions).toHaveLength(1);
  });
});

type PlanElementCase = {
  element: string;
  inputKey: string;
  versionsKey: keyof FreezeApplicationVersionPlan;
  crossVersionsKey: keyof FreezeApplicationVersionPlan;
  crossLinkKey: string;
  items: unknown[];
};

const planElementCases: PlanElementCase[] = [
  {
    element: "Endpoint",
    inputKey: "endpoints",
    versionsKey: "endpointVersions",
    crossVersionsKey: "crossEndpointVersions",
    crossLinkKey: "endpointVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Books",
        version: "1",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        definition: { actions: [] },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "Lend",
        version: "1",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        definition: { actions: [{ actionType: "lend" }] },
        transactionalEndpoint: true,
      },
    ],
  },
  {
    element: "Menu",
    inputKey: "menus",
    versionsKey: "menuVersions",
    crossVersionsKey: "crossMenuVersions",
    crossLinkKey: "menuVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "LibraryMenu",
        defaultLabel: "Library Menu",
        definition: { menuType: "simpleMenu", definition: [] },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "AltMenu",
        definition: { menuType: "complexMenu", definition: [] },
      },
    ],
  },
  {
    element: "Query",
    inputKey: "storedQueries",
    versionsKey: "queryVersions",
    crossVersionsKey: "crossQueryVersions",
    crossLinkKey: "queryVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "BookCount",
        definition: {
          runtimeTransformers: { main: { transformerType: "returnValue", value: [] } },
        },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "AuthorList",
        definition: {
          runtimeTransformers: { main: { transformerType: "returnValue", value: [] } },
        },
      },
    ],
  },
  {
    element: "Report",
    inputKey: "reports",
    versionsKey: "reportVersions",
    crossVersionsKey: "crossReportVersions",
    crossLinkKey: "reportVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "CountryList",
        defaultLabel: "Countries",
        definition: { reportParameters: {}, section: { type: "list", definition: [] } },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "BookList",
        defaultLabel: "Books",
        definition: { reportParameters: {}, section: { type: "list", definition: [] } },
      },
    ],
  },
  {
    element: "Runner",
    inputKey: "runners",
    versionsKey: "runnerVersions",
    crossVersionsKey: "crossRunnerVersions",
    crossLinkKey: "runnerVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "returnDocument",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        defaultLabel: "Return Document",
        definition: {
          runnerType: "actionRunner",
          endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
          action: "returnDocument",
        },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "lendDocument",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        defaultLabel: "Lend Document",
        definition: {
          runnerType: "actionRunner",
          endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
          action: "lendDocument",
        },
      },
    ],
  },
  {
    element: "Theme",
    inputKey: "themes",
    versionsKey: "themeVersions",
    crossVersionsKey: "crossThemeVersions",
    crossLinkKey: "themeVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "defaultMiroirTheme",
        defaultLabel: "Default Miroir Theme",
        definition: { id: "default", name: "Default Light", colors: { primary: "#7c67bcff" } },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "darkTheme",
        defaultLabel: "Dark Theme",
        definition: { id: "dark", name: "Dark", colors: { primary: "#111111" } },
      },
    ],
  },
  {
    element: "TransformerDefinition",
    inputKey: "transformerDefinitions",
    versionsKey: "transformerDefinitionVersions",
    crossVersionsKey: "crossTransformerDefinitionVersions",
    crossLinkKey: "transformerDefinitionVersion",
    items: [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "transformer_menu_addItem",
        defaultLabel: "Add menu item",
        transformerInterface: {
          transformerParameterSchema: {
            transformerType: { type: "literal", definition: "transformer_menu_addItem" },
            transformerDefinition: { type: "object", definition: {} },
          },
          transformerResultSchema: {
            returns: "mlSchema",
            definition: { type: "string" },
          },
        },
        transformerImplementation: {
          transformerImplementationType: "libraryImplementation",
          inMemoryImplementationFunctionName: "handleTransformer_menu_AddItem",
        },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "transformer_copy",
        defaultLabel: "Copy transformer",
        transformerInterface: {
          transformerParameterSchema: {
            transformerType: { type: "literal", definition: "transformer_menu_addItem" },
            transformerDefinition: { type: "object", definition: {} },
          },
          transformerResultSchema: {
            returns: "mlSchema",
            definition: { type: "string" },
          },
        },
        transformerImplementation: {
          transformerImplementationType: "libraryImplementation",
          inMemoryImplementationFunctionName: "handleTransformer_menu_AddItem",
        },
      },
    ],
  },
];

describe("freeze plan — non-Entity model elements", () => {
  for (const testCase of planElementCases) {
    describe(testCase.element, () => {
      it(`assembles ${testCase.element}Versions and Cross rows alongside the Entity freeze`, () => {
        const input: Record<string, unknown> = {
          selfApplicationUuid: APP_UUID,
          branchUuid: BRANCH_UUID,
          versionName: `V1-${testCase.element}s`,
          entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
          newUuid: sequentialUuid(),
        };
        input[testCase.inputKey] = testCase.items;
        const plan = buildFreezeApplicationVersionPlan(input as any);

        const versions = plan[testCase.versionsKey] as unknown as { uuid: string }[];
        const crosses = plan[testCase.crossVersionsKey] as unknown as Record<string, string>[];
        expect(versions).toHaveLength(2);
        expect(crosses).toHaveLength(2);
        const versionUuids = new Set(versions.map((v) => v.uuid));
        expect(versionUuids.size).toBe(2);
        for (const cross of crosses) {
          expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
          expect(versionUuids.has(cross[testCase.crossLinkKey])).toBe(true);
        }
      });

      it(`omits ${testCase.element}Version rows when no ${testCase.element} is provided`, () => {
        const input: Record<string, unknown> = {
          selfApplicationUuid: APP_UUID,
          branchUuid: BRANCH_UUID,
          versionName: `V1-No${testCase.element}s`,
          entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
          newUuid: sequentialUuid(),
        };
        input[testCase.inputKey] = [];
        const plan = buildFreezeApplicationVersionPlan(input as any);
        expect(plan[testCase.versionsKey]).toEqual([]);
        expect(plan[testCase.crossVersionsKey]).toEqual([]);
      });
    });
  }
});
