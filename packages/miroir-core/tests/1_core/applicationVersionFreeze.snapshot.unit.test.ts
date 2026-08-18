/**
 * Application version freeze — snapshotting present-model elements as historical versions.
 *
 * Parametrized coverage of the snapshot step for Entity and the non-Entity model
 * elements (Endpoint, Menu, Query, Report, Runner, Theme, TransformerDefinition):
 * each historical row mints a fresh UUID, links back to the live element uuid, is
 * parented to its historical version Entity, copies the present-model fields,
 * is deep-isolated from later source mutation, and rejects incomplete elements.
 */
import { describe, expect, it } from "vitest";

import {
  ENDPOINT_VERSION_ENTITY_UUID,
  MENU_VERSION_ENTITY_UUID,
  QUERY_VERSION_ENTITY_UUID,
  REPORT_VERSION_ENTITY_UUID,
  RUNNER_VERSION_ENTITY_UUID,
  THEME_VERSION_ENTITY_UUID,
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  snapshotEndpointsAsHistoricalEndpointVersions,
  snapshotEntitiesAsHistoricalEntityVersions,
  snapshotMenusAsHistoricalMenuVersions,
  snapshotQueriesAsHistoricalQueryVersions,
  snapshotReportsAsHistoricalReportVersions,
  snapshotRunnersAsHistoricalRunnerVersions,
  snapshotThemesAsHistoricalThemeVersions,
  snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
  type EndpointVersionSnapshot,
  type MenuVersionSnapshot,
  type QueryVersionSnapshot,
  type ReportVersionSnapshot,
  type RunnerVersionSnapshot,
  type SnapshotOptions,
  type StoredEndpointForFreeze,
  type StoredMenuForFreeze,
  type StoredQueryForFreeze,
  type StoredReportForFreeze,
  type StoredRunnerForFreeze,
  type StoredThemeForFreeze,
  type StoredTransformerDefinitionForFreeze,
  type ThemeVersionSnapshot,
  type TransformerDefinitionVersionSnapshot,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const ENTITY_VERSION_ENTITY_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const INCOMPLETE_UUID = "11111111-1111-4111-8111-111111111111";

function deterministicUuid() {
  let counter = 0;
  return () => `eeeeeeee-eeee-4eee-8eee-${String(++counter).padStart(12, "0")}`;
}

type SnapshotCase<Live, Snap> = {
  element: string;
  snapshot: (items: Live[], options?: SnapshotOptions) => Snap[];
  versionEntityUuid: string;
  versionEntityName: string;
  linkAttribute: string;
  makeLive: (uuid: string, name: string) => Live;
  makeIncomplete: () => Live;
  requiredFieldPattern: RegExp;
  assertCopiedFields: (live: Live, snapshot: Snap) => void;
  mutateLive: (live: Live) => void;
  assertDeepIsolation: (snapshot: Snap) => void;
};

function defineCase<Live, Snap>(testCase: SnapshotCase<Live, Snap>): SnapshotCase<Live, Snap> {
  return testCase;
}

const entitySnapshotCase = defineCase<Entity, EntityVersion>({
  element: "Entity",
  snapshot: snapshotEntitiesAsHistoricalEntityVersions,
  versionEntityUuid: ENTITY_VERSION_ENTITY_UUID,
  versionEntityName: "EntityVersion",
  linkAttribute: "entityUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    parentUuid: ENTITY_ENTITY_UUID,
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  }),
  makeIncomplete: () => ({
    uuid: INCOMPLETE_UUID,
    name: "Incomplete",
    parentUuid: ENTITY_ENTITY_UUID,
    parentName: "Entity",
  }),
  requiredFieldPattern: /mlSchema/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
  },
  mutateLive: (live) => {
    (live.mlSchema as any).definition.newField = { type: "number" };
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.mlSchema as any).definition.newField).toBeUndefined();
  },
});

const endpointSnapshotCase = defineCase<StoredEndpointForFreeze, EndpointVersionSnapshot>({
  element: "Endpoint",
  snapshot: snapshotEndpointsAsHistoricalEndpointVersions,
  versionEntityUuid: ENDPOINT_VERSION_ENTITY_UUID,
  versionEntityName: "EndpointVersion",
  linkAttribute: "endpointUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    version: "1",
    application: APPLICATION_UUID,
    definition: { actions: [] },
    description: `${name} description`,
    transactionalEndpoint: false,
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
      version: "1",
      application: APPLICATION_UUID,
    }) as StoredEndpointForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.version).toBe(live.version);
    expect(snapshot.application).toBe(live.application);
    expect(snapshot.definition).toEqual(live.definition);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.transactionalEndpoint).toBe(live.transactionalEndpoint);
  },
  mutateLive: (live) => {
    (live.definition as any).actions = [{ actionType: "mutated" }];
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).actions).toEqual([]);
  },
});

const menuSnapshotCase = defineCase<StoredMenuForFreeze, MenuVersionSnapshot>({
  element: "Menu",
  snapshot: snapshotMenusAsHistoricalMenuVersions,
  versionEntityUuid: MENU_VERSION_ENTITY_UUID,
  versionEntityName: "MenuVersion",
  linkAttribute: "menuUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    defaultLabel: `${name} Label`,
    description: `${name} description`,
    definition: {
      menuType: "simpleMenu",
      definition: [
        {
          miroirMenuItemType: "miroirMenuReportLink",
          label: "Home",
          section: "model",
          selfApplication: APPLICATION_UUID,
        },
      ],
    },
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
    }) as StoredMenuForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.definition).toEqual(live.definition);
    expect(snapshot.defaultLabel).toBe(live.defaultLabel);
    expect(snapshot.description).toBe(live.description);
  },
  mutateLive: (live) => {
    (live.definition as any).menuType = "complexMenu";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).menuType).toBe("simpleMenu");
  },
});

const querySnapshotCase = defineCase<StoredQueryForFreeze, QueryVersionSnapshot>({
  element: "Query",
  snapshot: snapshotQueriesAsHistoricalQueryVersions,
  versionEntityUuid: QUERY_VERSION_ENTITY_UUID,
  versionEntityName: "QueryVersion",
  linkAttribute: "queryUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    definition: {
      extractorTemplates: {
        items: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        },
      },
    },
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
    }) as StoredQueryForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.definition).toEqual(live.definition);
  },
  mutateLive: (live) => {
    (live.definition as any).extractorTemplates.newKey = { x: 1 };
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).extractorTemplates.newKey).toBeUndefined();
  },
});

const reportSnapshotCase = defineCase<StoredReportForFreeze, ReportVersionSnapshot>({
  element: "Report",
  snapshot: snapshotReportsAsHistoricalReportVersions,
  versionEntityUuid: REPORT_VERSION_ENTITY_UUID,
  versionEntityName: "ReportVersion",
  linkAttribute: "reportUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    defaultLabel: `${name} Label`,
    definition: {
      reportParameters: {},
      section: {
        type: "list",
        definition: [{ type: "objectListReportSection", definition: { label: "Items" } }],
      },
    },
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
    }) as StoredReportForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.definition).toEqual(live.definition);
    expect(snapshot.defaultLabel).toBe(live.defaultLabel);
  },
  mutateLive: (live) => {
    (live.definition as any).reportParameters.afterFreeze = true;
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).reportParameters.afterFreeze).toBeUndefined();
  },
});

const runnerSnapshotCase = defineCase<StoredRunnerForFreeze, RunnerVersionSnapshot>({
  element: "Runner",
  snapshot: snapshotRunnersAsHistoricalRunnerVersions,
  versionEntityUuid: RUNNER_VERSION_ENTITY_UUID,
  versionEntityName: "RunnerVersion",
  linkAttribute: "runnerUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    application: APPLICATION_UUID,
    defaultLabel: `${name} Label`,
    definition: {
      runnerType: "actionRunner",
      endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
      action: name,
    },
    description: `${name} description`,
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
      application: APPLICATION_UUID,
      defaultLabel: "Incomplete",
    }) as StoredRunnerForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.application).toBe(live.application);
    expect(snapshot.defaultLabel).toBe(live.defaultLabel);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.definition).toEqual(live.definition);
  },
  mutateLive: (live) => {
    (live.definition as any).action = "mutated";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).action).toBe("Mutable");
  },
});

const themeSnapshotCase = defineCase<StoredThemeForFreeze, ThemeVersionSnapshot>({
  element: "Theme",
  snapshot: snapshotThemesAsHistoricalThemeVersions,
  versionEntityUuid: THEME_VERSION_ENTITY_UUID,
  versionEntityName: "ThemeVersion",
  linkAttribute: "themeUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    defaultLabel: `${name} Label`,
    definition: {
      id: name.toLowerCase(),
      name: `${name} Theme`,
      colors: { primary: "#7c67bcff" },
    },
    description: `${name} description`,
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
      defaultLabel: "Incomplete",
    }) as StoredThemeForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.defaultLabel).toBe(live.defaultLabel);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.definition).toEqual(live.definition);
  },
  mutateLive: (live) => {
    (live.definition as { name?: string }).name = "mutated";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as { name?: string }).name).toBe("Mutable Theme");
  },
});

function makeTransformerDefinitionFixture(
  uuid: string,
  name: string,
): StoredTransformerDefinitionForFreeze {
  return {
    uuid,
    name,
    defaultLabel: `${name} Label`,
    classification: "basic",
    transformerInterface: {
      transformerParameterSchema: {
        transformerType: { type: "literal", definition: name },
        transformerDefinition: { type: "object", definition: {} },
      },
      transformerResultSchema: {
        returns: "mlSchema",
        definition: { type: "string" },
      },
    },
    transformerImplementation: {
      transformerImplementationType: "libraryImplementation",
      inMemoryImplementationFunctionName: `handle_${name}`,
    },
    description: `${name} description`,
  };
}

const transformerDefinitionSnapshotCase = defineCase<
  StoredTransformerDefinitionForFreeze,
  TransformerDefinitionVersionSnapshot
>({
  element: "TransformerDefinition",
  snapshot: snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
  versionEntityUuid: TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  versionEntityName: "TransformerDefinitionVersion",
  linkAttribute: "transformerUuid",
  makeLive: makeTransformerDefinitionFixture,
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
      defaultLabel: "Incomplete",
      transformerInterface: makeTransformerDefinitionFixture(INCOMPLETE_UUID, "Incomplete")
        .transformerInterface,
    }) as StoredTransformerDefinitionForFreeze,
  requiredFieldPattern: /transformerImplementation/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.defaultLabel).toBe(live.defaultLabel);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.definition.transformerInterface).toEqual(live.transformerInterface);
    expect(snapshot.definition.transformerImplementation).toEqual(live.transformerImplementation);
    expect(snapshot.definition.classification).toBe("basic");
  },
  mutateLive: (live) => {
    if (live.transformerImplementation.transformerImplementationType === "libraryImplementation") {
      live.transformerImplementation.inMemoryImplementationFunctionName = "mutated";
    }
  },
  assertDeepIsolation: (snapshot) => {
    expect(
      (snapshot.definition.transformerImplementation as { inMemoryImplementationFunctionName?: string })
        .inMemoryImplementationFunctionName,
    ).toBe("handle_Mutable");
  },
});

const snapshotCases: SnapshotCase<any, any>[] = [
  entitySnapshotCase,
  endpointSnapshotCase,
  menuSnapshotCase,
  querySnapshotCase,
  reportSnapshotCase,
  runnerSnapshotCase,
  themeSnapshotCase,
  transformerDefinitionSnapshotCase,
];

describe("application version freeze — historical version snapshots", () => {
  for (const testCase of snapshotCases) {
    describe(`${testCase.element} snapshot`, () => {
      it("mints a fresh snapshot UUID distinct from the live uuid", () => {
        const live = testCase.makeLive("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "First");
        const [snapshot] = testCase.snapshot([live], { newUuid: deterministicUuid() });
        expect(snapshot.uuid).not.toBe(live.uuid);
      });

      it("links the snapshot to the live element uuid", () => {
        const live = testCase.makeLive("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Second");
        const [snapshot] = testCase.snapshot([live], { newUuid: deterministicUuid() });
        expect((snapshot as any)[testCase.linkAttribute]).toBe(live.uuid);
      });

      it("parents the snapshot to the historical version entity", () => {
        const live = testCase.makeLive("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Third");
        const [snapshot] = testCase.snapshot([live], { newUuid: deterministicUuid() });
        expect(snapshot.parentUuid).toBe(testCase.versionEntityUuid);
        expect(snapshot.parentName).toBe(testCase.versionEntityName);
      });

      it("copies the present-model fields onto the snapshot", () => {
        const live = testCase.makeLive("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Sample");
        const [snapshot] = testCase.snapshot([live], { newUuid: deterministicUuid() });
        testCase.assertCopiedFields(live, snapshot);
      });

      it("deep-isolates the snapshot from later source mutation", () => {
        const live = testCase.makeLive("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
        const [snapshot] = testCase.snapshot([live], { newUuid: deterministicUuid() });
        testCase.mutateLive(live);
        testCase.assertDeepIsolation(snapshot);
      });

      it("returns an empty result for an empty element list", () => {
        expect(testCase.snapshot([])).toEqual([]);
      });

      it("throws when the required definition body is missing", () => {
        expect(() => testCase.snapshot([testCase.makeIncomplete()])).toThrow(
          testCase.requiredFieldPattern,
        );
      });
    });
  }
});
