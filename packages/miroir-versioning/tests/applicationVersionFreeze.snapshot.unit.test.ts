/**
 * Application version freeze — snapshotting present-model elements as historical versions.
 *
 * Parametrized coverage of the snapshot step for Entity and the non-Entity model
 * elements (Endpoint, Menu, Query, Report, Runner, Theme, TransformerDefinition, and
 * since #230 MlSchema and MiroirTest, since #706 Blob, TestConfiguration and Test):
 * each historical row mints a fresh UUID, links back to the live element uuid, is
 * parented to its historical version Entity, copies the present-model fields,
 * is deep-isolated from later source mutation, and rejects incomplete elements
 * (MlSchema excepted: its live definition is optional, so is the snapshot's).
 */
import { describe, expect, it } from "vitest";

import {
  snapshotBlobsAsHistoricalBlobVersions,
  snapshotEndpointsAsHistoricalEndpointVersions,
  snapshotEntitiesAsHistoricalEntityVersions,
  snapshotMenusAsHistoricalMenuVersions,
  snapshotMiroirTestsAsHistoricalMiroirTestVersions,
  snapshotMlSchemasAsHistoricalMlSchemaVersions,
  snapshotQueriesAsHistoricalQueryVersions,
  snapshotReportsAsHistoricalReportVersions,
  snapshotRunnersAsHistoricalRunnerVersions,
  snapshotTestConfigurationsAsHistoricalTestConfigurationVersions,
  snapshotTestsAsHistoricalTestVersions,
  snapshotThemesAsHistoricalThemeVersions,
  snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions,
  type BlobVersionSnapshot,
  type EndpointVersionSnapshot,
  type StoredInstanceForFreeze,
  type TestConfigurationVersionSnapshot,
  type TestVersionSnapshot,
  type MenuVersionSnapshot,
  type MiroirTestVersionSnapshot,
  type MlSchemaVersionSnapshot,
  type QueryVersionSnapshot,
  type ReportVersionSnapshot,
  type RunnerVersionSnapshot,
  type SnapshotOptions,
  type StoredEndpointForFreeze,
  type StoredMenuForFreeze,
  type StoredMiroirTestForFreeze,
  type StoredMlSchemaForFreeze,
  type StoredQueryForFreeze,
  type StoredReportForFreeze,
  type StoredRunnerForFreeze,
  type StoredThemeForFreeze,
  type StoredTransformerDefinitionForFreeze,
  type ThemeVersionSnapshot,
  type TransformerDefinitionVersionSnapshot,
} from "../src/applicationVersionFreeze.js";
import {
  BLOB_VERSION_ENTITY_UUID,
  ENDPOINT_VERSION_ENTITY_UUID,
  MENU_VERSION_ENTITY_UUID,
  MIROIR_TEST_VERSION_ENTITY_UUID,
  ML_SCHEMA_VERSION_ENTITY_UUID,
  QUERY_VERSION_ENTITY_UUID,
  REPORT_VERSION_ENTITY_UUID,
  RUNNER_VERSION_ENTITY_UUID,
  THEME_VERSION_ENTITY_UUID,
  TEST_CONFIGURATION_VERSION_ENTITY_UUID,
  TEST_VERSION_ENTITY_UUID,
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
} from "@miroir-framework/core";
import type {
  Entity,
  EntityVersion,
} from "@miroir-framework/core";

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
  /** Omitted when the live element has no required body (MlSchema). */
  makeIncomplete?: () => Live;
  requiredFieldPattern?: RegExp;
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
    type: "multistep",
    description: `${name} multistep description`,
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
    expect(snapshot.type).toBe(live.type);
    expect(snapshot.description).toBe(live.description);
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

const mlSchemaSnapshotCase = defineCase<StoredMlSchemaForFreeze, MlSchemaVersionSnapshot>({
  element: "MlSchema",
  snapshot: snapshotMlSchemasAsHistoricalMlSchemaVersions,
  versionEntityUuid: ML_SCHEMA_VERSION_ENTITY_UUID,
  versionEntityName: "MlSchemaVersion",
  linkAttribute: "mlSchemaUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    defaultLabel: `${name} Label`,
    description: `${name} description`,
    definition: {
      type: "object",
      definition: { title: { type: "string", tag: { value: { defaultLabel: name } } } },
    },
  }),
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.defaultLabel).toBe(live.defaultLabel);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.definition).toEqual(live.definition);
  },
  mutateLive: (live) => {
    (live.definition as any).definition.title.tag.value.defaultLabel = "mutated";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).definition.title.tag.value.defaultLabel).toBe("Mutable");
  },
});

const miroirTestSnapshotCase = defineCase<StoredMiroirTestForFreeze, MiroirTestVersionSnapshot>({
  element: "MiroirTest",
  snapshot: snapshotMiroirTestsAsHistoricalMiroirTestVersions,
  versionEntityUuid: MIROIR_TEST_VERSION_ENTITY_UUID,
  versionEntityName: "MiroirTestVersion",
  linkAttribute: "miroirTestUuid",
  makeLive: (uuid, name) => ({
    uuid,
    name,
    description: `${name} description`,
    skip: true,
    tags: ["versioning", "unit"],
    issue: "#230",
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: name,
      miroirTests: {},
    } as any,
  }),
  makeIncomplete: () =>
    ({
      uuid: INCOMPLETE_UUID,
      name: "Incomplete",
    }) as StoredMiroirTestForFreeze,
  requiredFieldPattern: /definition/,
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.skip).toBe(true);
    expect(snapshot.tags).toEqual(["versioning", "unit"]);
    expect(snapshot.issue).toBe("#230");
    expect(snapshot.definition).toEqual(live.definition);
  },
  mutateLive: (live) => {
    (live.definition as any).miroirTestLabel = "mutated";
    live.tags!.push("ui");
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).miroirTestLabel).toBe("Mutable");
    expect(snapshot.tags).toEqual(["versioning", "unit"]);
  },
});

const blobSnapshotCase = defineCase<StoredInstanceForFreeze, BlobVersionSnapshot>({
  element: "Blob",
  snapshot: snapshotBlobsAsHistoricalBlobVersions,
  versionEntityUuid: BLOB_VERSION_ENTITY_UUID,
  versionEntityName: "BlobVersion",
  linkAttribute: "blobUuid",
  makeLive: (uuid, name) => ({
    uuid,
    parentUuid: "62209e4a-e429-4d7d-9b28-dcc1da6b51a2",
    parentName: "Blob",
    name,
    filename: `${name}.png`,
    description: `${name} description`,
    contents: { encoding: "base64", mimeType: "image/png", data: "iVBORw0KGgo=" },
  }),
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.filename).toBe(live.filename);
    expect(snapshot.description).toBe(live.description);
    expect(snapshot.contents).toEqual(live.contents);
  },
  mutateLive: (live) => {
    (live.contents as any).data = "mutated";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.contents as any).data).toBe("iVBORw0KGgo=");
  },
});

const testConfigurationSnapshotCase = defineCase<StoredInstanceForFreeze, TestConfigurationVersionSnapshot>({
  element: "TestConfiguration",
  snapshot: snapshotTestConfigurationsAsHistoricalTestConfigurationVersions,
  versionEntityUuid: TEST_CONFIGURATION_VERSION_ENTITY_UUID,
  versionEntityName: "TestConfigurationVersion",
  linkAttribute: "testConfigurationUuid",
  makeLive: (uuid, name) => ({
    uuid,
    parentUuid: "675ccd46-7dd3-400b-a2bd-1319c39e11da",
    selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    name,
    testbedModel: { entities: [{ name }] },
  }),
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.selfApplication).toBe(live.selfApplication);
    expect(snapshot.testbedModel).toEqual(live.testbedModel);
  },
  mutateLive: (live) => {
    (live.testbedModel as any).entities[0].name = "mutated";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.testbedModel as any).entities[0].name).toBe("Mutable");
  },
});

const testSnapshotCase = defineCase<StoredInstanceForFreeze, TestVersionSnapshot>({
  element: "Test",
  snapshot: snapshotTestsAsHistoricalTestVersions,
  versionEntityUuid: TEST_VERSION_ENTITY_UUID,
  versionEntityName: "TestVersion",
  linkAttribute: "testUuid",
  makeLive: (uuid, name) => ({
    uuid,
    parentUuid: "c37625c7-0b35-4d6a-811d-8181eb978301",
    selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
    name,
    definition: { testCompositeActions: { first: { label: name } } },
  }),
  assertCopiedFields: (live, snapshot) => {
    expect(snapshot.name).toBe(live.name);
    expect(snapshot.branch).toBe(live.branch);
    expect(snapshot.definition).toEqual(live.definition);
  },
  mutateLive: (live) => {
    (live.definition as any).testCompositeActions.first.label = "mutated";
  },
  assertDeepIsolation: (snapshot) => {
    expect((snapshot.definition as any).testCompositeActions.first.label).toBe("Mutable");
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
  mlSchemaSnapshotCase,
  miroirTestSnapshotCase,
  blobSnapshotCase,
  testConfigurationSnapshotCase,
  testSnapshotCase,
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

      if (testCase.makeIncomplete) {
        const makeIncomplete = testCase.makeIncomplete;
        it("throws when the required definition body is missing", () => {
          expect(() => testCase.snapshot([makeIncomplete()])).toThrow(
            testCase.requiredFieldPattern,
          );
        });
      }
    });
  }

  it("snapshots an MlSchema that has no definition, without one (#230)", () => {
    const [snapshot] = snapshotMlSchemasAsHistoricalMlSchemaVersions(
      [{ uuid: INCOMPLETE_UUID, name: "Bare" }],
      { newUuid: deterministicUuid() },
    );
    expect(snapshot.mlSchemaUuid).toBe(INCOMPLETE_UUID);
    expect("definition" in snapshot).toBe(false);
  });

  it("snapshots a MiroirTest that has no name, without one (#230)", () => {
    const [snapshot] = snapshotMiroirTestsAsHistoricalMiroirTestVersions(
      [{ uuid: INCOMPLETE_UUID, definition: { miroirTestType: "miroirTestSuite" } as any }],
      { newUuid: deterministicUuid() },
    );
    expect(snapshot.miroirTestUuid).toBe(INCOMPLETE_UUID);
    expect("name" in snapshot).toBe(false);
  });

  it("keeps the identity of the live instance out of a Blob, TestConfiguration or Test snapshot (#706)", () => {
    const [snapshot] = snapshotBlobsAsHistoricalBlobVersions(
      [
        {
          uuid: INCOMPLETE_UUID,
          parentUuid: "62209e4a-e429-4d7d-9b28-dcc1da6b51a2",
          parentName: "Blob",
          parentDefinitionVersionUuid: "c3179f1d-10bd-4b0f-9a6b-f118d8eb2312",
          conceptLevel: "Data",
          name: "bare",
        },
      ],
      { newUuid: deterministicUuid() },
    );
    expect(snapshot).toEqual({
      uuid: snapshot.uuid,
      parentUuid: BLOB_VERSION_ENTITY_UUID,
      parentName: "BlobVersion",
      blobUuid: INCOMPLETE_UUID,
      name: "bare",
    });
  });
});
