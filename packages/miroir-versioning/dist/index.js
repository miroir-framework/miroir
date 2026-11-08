// src/freezeApplicationVersion.ts
import {
  Action2Error,
  ACTION_OK,
  getApplicationSection as getApplicationSection2
} from "@miroir-framework/core";
import {
  entityApplicationVersionCrossBlobVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossMenuVersion,
  entityApplicationVersionCrossMiroirTestVersion,
  entityApplicationVersionCrossMlSchemaVersion,
  entityApplicationVersionCrossQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityApplicationVersionCrossTestConfigurationVersion,
  entityApplicationVersionCrossTestVersion,
  entityApplicationVersionCrossThemeVersion,
  entityApplicationVersionCrossTransformerDefinitionVersion,
  entityBlob,
  entityEntityVersion,
  entityHistoricalBlobVersion,
  entityHistoricalEndpointVersion,
  entityHistoricalMenuVersion,
  entityHistoricalMiroirTestVersion,
  entityHistoricalMlSchemaVersion,
  entityHistoricalQueryVersion,
  entityHistoricalReportVersion,
  entityHistoricalRunnerVersion,
  entityHistoricalTestConfigurationVersion,
  entityHistoricalTestVersion,
  entityHistoricalThemeVersion,
  entityHistoricalTransformerDefinitionVersion,
  entitySelfApplicationVersion,
  entityTest,
  entityTestConfiguration
} from "@miroir-framework/core/meta-model";

// src/applicationVersionFreeze.ts
import { v4 as uuidv4 } from "uuid";
import {
  APPLICATION_VERSION_CROSS_BLOB_VERSION_UUID,
  APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID,
  APPLICATION_VERSION_CROSS_MENU_VERSION_UUID,
  APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID,
  APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID,
  APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
  APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID,
  APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID,
  APPLICATION_VERSION_CROSS_TEST_CONFIGURATION_VERSION_UUID,
  APPLICATION_VERSION_CROSS_TEST_VERSION_UUID,
  APPLICATION_VERSION_CROSS_THEME_VERSION_UUID,
  APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
  BLOB_VERSION_ENTITY_UUID,
  ENDPOINT_VERSION_ENTITY_UUID,
  MENU_VERSION_ENTITY_UUID,
  MIROIR_TEST_VERSION_ENTITY_UUID,
  ML_SCHEMA_VERSION_ENTITY_UUID,
  QUERY_VERSION_ENTITY_UUID,
  REPORT_VERSION_ENTITY_UUID,
  RUNNER_VERSION_ENTITY_UUID,
  TEST_CONFIGURATION_VERSION_ENTITY_UUID,
  TEST_VERSION_ENTITY_UUID,
  THEME_VERSION_ENTITY_UUID,
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
  assertApplicationVersioningEnabled,
  getApplicationSection,
  noValue
} from "@miroir-framework/core";
function normalizeOptionalBranchUuid(branch) {
  if (!branch || branch === noValue.uuid) {
    return void 0;
  }
  return branch;
}
var ENTITY_VERSION_ENTITY_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
var APPLICATION_VERSION_ENTITY_UUID = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
var APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID = "8bec933d-6287-4de7-8a88-5c24216de9f4";
function snapshotQueriesAsHistoricalQueryVersions(queries, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return queries.map((query) => {
    if (query.definition === void 0 || query.definition === null) {
      throw new Error(
        `Cannot snapshot Query ${query.uuid} (${query.name}): definition is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: QUERY_VERSION_ENTITY_UUID,
      parentName: "QueryVersion",
      name: query.name,
      queryUuid: query.uuid,
      definition: structuredClone(query.definition),
      ...query.description !== void 0 ? { description: query.description } : {},
      ...query.defaultLabel !== void 0 ? { defaultLabel: query.defaultLabel } : {}
    };
    return snapshot;
  });
}
function snapshotReportsAsHistoricalReportVersions(reports, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return reports.map((report) => {
    if (report.definition === void 0 || report.definition === null) {
      throw new Error(
        `Cannot snapshot Report ${report.uuid} (${report.name}): definition is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: REPORT_VERSION_ENTITY_UUID,
      parentName: "ReportVersion",
      name: report.name,
      reportUuid: report.uuid,
      definition: structuredClone(report.definition),
      ...report.defaultLabel !== void 0 ? { defaultLabel: report.defaultLabel } : {},
      ...report.type !== void 0 ? { type: report.type } : {},
      ...report.description !== void 0 ? { description: report.description } : {}
    };
    return snapshot;
  });
}
function snapshotMenusAsHistoricalMenuVersions(menus, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return menus.map((menu) => {
    if (menu.definition === void 0 || menu.definition === null) {
      throw new Error(
        `Cannot snapshot Menu ${menu.uuid} (${menu.name}): definition is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: MENU_VERSION_ENTITY_UUID,
      parentName: "MenuVersion",
      name: menu.name,
      menuUuid: menu.uuid,
      definition: structuredClone(menu.definition),
      ...menu.defaultLabel !== void 0 ? { defaultLabel: menu.defaultLabel } : {},
      ...menu.description !== void 0 ? { description: menu.description } : {}
    };
    return snapshot;
  });
}
function snapshotEndpointsAsHistoricalEndpointVersions(endpoints, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return endpoints.map((endpoint) => {
    if (endpoint.definition === void 0 || endpoint.definition === null) {
      throw new Error(
        `Cannot snapshot Endpoint ${endpoint.uuid} (${endpoint.name}): definition is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: ENDPOINT_VERSION_ENTITY_UUID,
      parentName: "EndpointVersion",
      name: endpoint.name,
      endpointUuid: endpoint.uuid,
      version: endpoint.version,
      application: endpoint.application,
      definition: structuredClone(endpoint.definition),
      ...endpoint.description !== void 0 ? { description: endpoint.description } : {},
      ...endpoint.transactionalEndpoint !== void 0 ? { transactionalEndpoint: endpoint.transactionalEndpoint } : {}
    };
    return snapshot;
  });
}
function snapshotRunnersAsHistoricalRunnerVersions(runners, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return runners.map((runner) => {
    if (runner.definition === void 0 || runner.definition === null) {
      throw new Error(
        `Cannot snapshot Runner ${runner.uuid} (${runner.name}): definition is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: RUNNER_VERSION_ENTITY_UUID,
      parentName: "RunnerVersion",
      name: runner.name,
      runnerUuid: runner.uuid,
      application: runner.application,
      defaultLabel: runner.defaultLabel,
      definition: structuredClone(runner.definition),
      ...runner.description !== void 0 ? { description: runner.description } : {}
    };
    return snapshot;
  });
}
function snapshotThemesAsHistoricalThemeVersions(themes, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return themes.map((theme) => {
    if (theme.definition === void 0 || theme.definition === null) {
      throw new Error(
        `Cannot snapshot Theme ${theme.uuid} (${theme.name}): definition is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: THEME_VERSION_ENTITY_UUID,
      parentName: "ThemeVersion",
      name: theme.name,
      themeUuid: theme.uuid,
      definition: structuredClone(theme.definition),
      ...theme.defaultLabel !== void 0 ? { defaultLabel: theme.defaultLabel } : {},
      ...theme.description !== void 0 ? { description: theme.description } : {}
    };
    return snapshot;
  });
}
function buildTransformerDefinitionVersionBody(transformer) {
  if (transformer.transformerImplementation === void 0 || transformer.transformerImplementation === null) {
    throw new Error(
      `Cannot snapshot TransformerDefinition ${transformer.uuid} (${transformer.name}): transformerImplementation is missing`
    );
  }
  if (transformer.transformerInterface === void 0 || transformer.transformerInterface === null) {
    throw new Error(
      `Cannot snapshot TransformerDefinition ${transformer.uuid} (${transformer.name}): transformerInterface is missing`
    );
  }
  return {
    transformerInterface: structuredClone(transformer.transformerInterface),
    transformerImplementation: structuredClone(transformer.transformerImplementation),
    ...transformer.classification !== void 0 ? { classification: transformer.classification } : {},
    ...transformer.runnableAsSql !== void 0 ? { runnableAsSql: transformer.runnableAsSql } : {}
  };
}
function snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(transformerDefinitions, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return transformerDefinitions.map((transformer) => {
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
      parentName: "TransformerDefinitionVersion",
      name: transformer.name,
      transformerUuid: transformer.uuid,
      defaultLabel: transformer.defaultLabel,
      definition: buildTransformerDefinitionVersionBody(transformer),
      ...transformer.description !== void 0 ? { description: transformer.description } : {}
    };
    return snapshot;
  });
}
function snapshotMlSchemasAsHistoricalMlSchemaVersions(mlSchemas, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return mlSchemas.map((mlSchema) => ({
    uuid: mintUuid(),
    parentUuid: ML_SCHEMA_VERSION_ENTITY_UUID,
    parentName: "MlSchemaVersion",
    name: mlSchema.name,
    mlSchemaUuid: mlSchema.uuid,
    ...mlSchema.definition !== void 0 ? { definition: structuredClone(mlSchema.definition) } : {},
    ...mlSchema.defaultLabel !== void 0 ? { defaultLabel: mlSchema.defaultLabel } : {},
    ...mlSchema.description !== void 0 ? { description: mlSchema.description } : {}
  }));
}
function snapshotMiroirTestsAsHistoricalMiroirTestVersions(tests, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return tests.map((test) => {
    if (test.definition === void 0 || test.definition === null) {
      throw new Error(
        `Cannot snapshot MiroirTest ${test.uuid} (${test.name ?? "unnamed"}): definition is missing`
      );
    }
    return {
      uuid: mintUuid(),
      parentUuid: MIROIR_TEST_VERSION_ENTITY_UUID,
      parentName: "MiroirTestVersion",
      miroirTestUuid: test.uuid,
      definition: structuredClone(test.definition),
      ...test.name !== void 0 ? { name: test.name } : {},
      ...test.description !== void 0 ? { description: test.description } : {},
      ...test.skip !== void 0 ? { skip: test.skip } : {},
      ...test.tags !== void 0 ? { tags: [...test.tags] } : {},
      ...test.issue !== void 0 ? { issue: test.issue } : {}
    };
  });
}
function snapshotInstancesAsVersions(instances, versionEntityUuid, versionEntityName, liveUuidAttribute, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return instances.map((instance) => {
    const {
      uuid,
      parentUuid: _parentUuid,
      parentName: _parentName,
      parentDefinitionVersionUuid: _parentDefinitionVersionUuid,
      conceptLevel: _conceptLevel,
      ...attributes
    } = instance;
    return {
      ...structuredClone(attributes),
      uuid: mintUuid(),
      parentUuid: versionEntityUuid,
      parentName: versionEntityName,
      [liveUuidAttribute]: uuid
    };
  });
}
function snapshotBlobsAsHistoricalBlobVersions(blobs, options) {
  return snapshotInstancesAsVersions(blobs, BLOB_VERSION_ENTITY_UUID, "BlobVersion", "blobUuid", options);
}
function snapshotTestConfigurationsAsHistoricalTestConfigurationVersions(testConfigurations, options) {
  return snapshotInstancesAsVersions(
    testConfigurations,
    TEST_CONFIGURATION_VERSION_ENTITY_UUID,
    "TestConfigurationVersion",
    "testConfigurationUuid",
    options
  );
}
function snapshotTestsAsHistoricalTestVersions(testInstances, options) {
  return snapshotInstancesAsVersions(testInstances, TEST_VERSION_ENTITY_UUID, "TestVersion", "testUuid", options);
}
function snapshotEntitiesAsHistoricalEntityVersions(entities, options) {
  const mintUuid = options?.newUuid ?? uuidv4;
  return entities.map((entity) => {
    if (!entity.mlSchema) {
      throw new Error(
        `Cannot snapshot Entity ${entity.uuid} (${entity.name}): mlSchema is missing`
      );
    }
    const snapshot = {
      uuid: mintUuid(),
      parentUuid: ENTITY_VERSION_ENTITY_UUID,
      parentName: "EntityVersion",
      name: entity.name,
      entityUuid: entity.uuid,
      conceptLevel: entity.conceptLevel ?? "Model",
      mlSchema: structuredClone(entity.mlSchema),
      ...entity.defaultInstanceDetailsReportUuid !== void 0 ? { defaultInstanceDetailsReportUuid: entity.defaultInstanceDetailsReportUuid } : {},
      ...entity.viewAttributes !== void 0 ? { viewAttributes: structuredClone(entity.viewAttributes) } : {},
      ...entity.icon !== void 0 ? { icon: structuredClone(entity.icon) } : {},
      ...entity.display !== void 0 ? { display: structuredClone(entity.display) } : {},
      ...entity.cache !== void 0 ? { cache: structuredClone(entity.cache) } : {},
      ...entity.idAttribute !== void 0 ? { idAttribute: structuredClone(entity.idAttribute) } : {},
      ...entity.externalDataSource !== void 0 ? { externalDataSource: structuredClone(entity.externalDataSource) } : {}
    };
    return snapshot;
  });
}
function canonicalizeJsonValue(value) {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeJsonValue(item));
  }
  if (typeof value === "object") {
    const record = value;
    const normalized = {};
    for (const key of Object.keys(record).sort()) {
      const child = canonicalizeJsonValue(record[key]);
      if (child !== void 0) {
        normalized[key] = child;
      }
    }
    return normalized;
  }
  return value;
}
function stableJsonEqual(a, b) {
  return JSON.stringify(canonicalizeJsonValue(a)) === JSON.stringify(canonicalizeJsonValue(b));
}
function indexEntityVersionsByLiveUuid(versions) {
  const map = /* @__PURE__ */ new Map();
  for (const ev of versions) {
    map.set(ev.entityUuid, ev);
  }
  return map;
}
function diffEntityVersionSnapshots(previous, next) {
  const prevByUuid = indexEntityVersionsByLiveUuid(previous);
  const nextByUuid = indexEntityVersionsByLiveUuid(next);
  const candidates = [];
  const created = [...nextByUuid.keys()].filter((uuid) => !prevByUuid.has(uuid)).sort();
  for (const entityUuid of created) {
    const ev = nextByUuid.get(entityUuid);
    candidates.push({ kind: "createEntity", entityUuid, name: ev.name });
  }
  const dropped = [...prevByUuid.keys()].filter((uuid) => !nextByUuid.has(uuid)).sort();
  for (const entityUuid of dropped) {
    const ev = prevByUuid.get(entityUuid);
    candidates.push({ kind: "dropEntity", entityUuid, name: ev.name });
  }
  const shared = [...prevByUuid.keys()].filter((uuid) => nextByUuid.has(uuid)).sort();
  for (const entityUuid of shared) {
    const prevEv = prevByUuid.get(entityUuid);
    const nextEv = nextByUuid.get(entityUuid);
    if (prevEv.name !== nextEv.name) {
      candidates.push({
        kind: "renameEntity",
        entityUuid,
        name: prevEv.name,
        targetName: nextEv.name
      });
    }
    const differingFields = ENTITY_PRESENT_MODEL_DEFINITION_FIELDS.filter(
      (field) => !stableJsonEqual(prevEv[field], nextEv[field])
    );
    if (differingFields.length > 0) {
      candidates.push({
        kind: "alterEntityAttribute",
        entityUuid,
        name: nextEv.name,
        differingFields: [...differingFields]
      });
    }
  }
  return candidates;
}
var APPLICATION_VERSION_PLACEHOLDER_NAMES = /* @__PURE__ */ new Set([
  "Initial",
  "TODO: No label was given to this version."
]);
function isApplicationVersionPlaceholder(sav) {
  return APPLICATION_VERSION_PLACEHOLDER_NAMES.has(sav.name);
}
function resolvePreviousApplicationVersion(versions, options) {
  const freezeSet = options.freezeProducedVersionUuids === void 0 ? void 0 : options.freezeProducedVersionUuids instanceof Set ? options.freezeProducedVersionUuids : new Set(options.freezeProducedVersionUuids);
  if (freezeSet !== void 0 && freezeSet.size === 0) {
    return void 0;
  }
  const scoped = versions.filter(
    (sav) => sav.selfApplication === options.selfApplicationUuid && sav.branch === options.branchUuid && !isApplicationVersionPlaceholder(sav) && (freezeSet === void 0 || freezeSet.has(sav.uuid))
  );
  if (scoped.length === 0) {
    return void 0;
  }
  const referencedAsPrevious = new Set(
    scoped.map((sav) => sav.previousVersion).filter((uuid) => typeof uuid === "string" && uuid.length > 0)
  );
  const heads = scoped.filter((sav) => !referencedAsPrevious.has(sav.uuid));
  if (heads.length === 0) {
    return void 0;
  }
  if (heads.length === 1) {
    return heads[0];
  }
  throw new Error(
    `Multiple Application Version chain heads for application ${options.selfApplicationUuid} branch ${options.branchUuid}: ${heads.map((h) => h.name).join(", ")}`
  );
}
function buildFreezeApplicationVersionPlan(input) {
  const mintUuid = input.newUuid ?? uuidv4;
  const existing = input.existingApplicationVersions ?? [];
  const duplicate = existing.find(
    (sav) => sav.selfApplication === input.selfApplicationUuid && sav.branch === input.branchUuid && sav.name === input.versionName
  );
  if (duplicate) {
    throw new Error(
      `Application Version label "${input.versionName}" already exists for this application and branch`
    );
  }
  const previousVersionUuid = input.previousVersionUuid !== void 0 ? input.previousVersionUuid : resolvePreviousApplicationVersion(existing, {
    selfApplicationUuid: input.selfApplicationUuid,
    branchUuid: input.branchUuid,
    freezeProducedVersionUuids: input.freezeProducedVersionUuids
  })?.uuid;
  const selfApplicationVersionUuid = mintUuid();
  const entityVersions = snapshotEntitiesAsHistoricalEntityVersions(input.entities, {
    newUuid: mintUuid
  });
  const queryVersions = snapshotQueriesAsHistoricalQueryVersions(input.storedQueries ?? [], {
    newUuid: mintUuid
  });
  const reportVersions = snapshotReportsAsHistoricalReportVersions(input.reports ?? [], {
    newUuid: mintUuid
  });
  const menuVersions = snapshotMenusAsHistoricalMenuVersions(input.menus ?? [], {
    newUuid: mintUuid
  });
  const endpointVersions = snapshotEndpointsAsHistoricalEndpointVersions(input.endpoints ?? [], {
    newUuid: mintUuid
  });
  const runnerVersions = snapshotRunnersAsHistoricalRunnerVersions(input.runners ?? [], {
    newUuid: mintUuid
  });
  const themeVersions = snapshotThemesAsHistoricalThemeVersions(input.themes ?? [], {
    newUuid: mintUuid
  });
  const transformerDefinitionVersions = snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
    input.transformerDefinitions ?? [],
    { newUuid: mintUuid }
  );
  const mlSchemaVersions = snapshotMlSchemasAsHistoricalMlSchemaVersions(input.mlSchemas ?? [], {
    newUuid: mintUuid
  });
  const miroirTestVersions = snapshotMiroirTestsAsHistoricalMiroirTestVersions(input.tests ?? [], {
    newUuid: mintUuid
  });
  const blobVersions = snapshotBlobsAsHistoricalBlobVersions(input.blobs ?? [], { newUuid: mintUuid });
  const testConfigurationVersions = snapshotTestConfigurationsAsHistoricalTestConfigurationVersions(
    input.testConfigurations ?? [],
    { newUuid: mintUuid }
  );
  const testVersions = snapshotTestsAsHistoricalTestVersions(input.testInstances ?? [], {
    newUuid: mintUuid
  });
  const modelCUDMigration = input.previousEntityVersions !== void 0 ? diffEntityVersionSnapshots(input.previousEntityVersions, entityVersions) : [];
  const selfApplicationVersion = {
    uuid: selfApplicationVersionUuid,
    parentUuid: APPLICATION_VERSION_ENTITY_UUID,
    parentName: "ApplicationVersion",
    name: input.versionName,
    selfApplication: input.selfApplicationUuid,
    branch: input.branchUuid,
    modelStructureMigration: [],
    modelCUDMigration,
    ...input.description !== void 0 ? { description: input.description } : {},
    ...previousVersionUuid !== void 0 ? { previousVersion: previousVersionUuid } : {}
  };
  const crossEntityVersions = entityVersions.map(
    (ev) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID,
      parentName: "ApplicationVersionCrossEntityVersion",
      applicationVersion: selfApplicationVersionUuid,
      entityVersion: ev.uuid
    })
  );
  const crossQueryVersions = queryVersions.map(
    (qv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
      parentName: "ApplicationVersionCrossQueryVersion",
      applicationVersion: selfApplicationVersionUuid,
      queryVersion: qv.uuid
    })
  );
  const crossReportVersions = reportVersions.map(
    (rv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID,
      parentName: "ApplicationVersionCrossReportVersion",
      applicationVersion: selfApplicationVersionUuid,
      reportVersion: rv.uuid
    })
  );
  const crossMenuVersions = menuVersions.map(
    (mv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_MENU_VERSION_UUID,
      parentName: "ApplicationVersionCrossMenuVersion",
      applicationVersion: selfApplicationVersionUuid,
      menuVersion: mv.uuid
    })
  );
  const crossEndpointVersions = endpointVersions.map((ev) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID,
    parentName: "ApplicationVersionCrossEndpointVersion",
    applicationVersion: selfApplicationVersionUuid,
    endpointVersion: ev.uuid
  }));
  const crossRunnerVersions = runnerVersions.map(
    (rv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID,
      parentName: "ApplicationVersionCrossRunnerVersion",
      applicationVersion: selfApplicationVersionUuid,
      runnerVersion: rv.uuid
    })
  );
  const crossThemeVersions = themeVersions.map(
    (tv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_THEME_VERSION_UUID,
      parentName: "ApplicationVersionCrossThemeVersion",
      applicationVersion: selfApplicationVersionUuid,
      themeVersion: tv.uuid
    })
  );
  const crossTransformerDefinitionVersions = transformerDefinitionVersions.map((tdv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
    parentName: "ApplicationVersionCrossTransformerDefinitionVersion",
    applicationVersion: selfApplicationVersionUuid,
    transformerDefinitionVersion: tdv.uuid
  }));
  const crossMlSchemaVersions = mlSchemaVersions.map(
    (msv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID,
      parentName: "ApplicationVersionCrossMlSchemaVersion",
      applicationVersion: selfApplicationVersionUuid,
      mlSchemaVersion: msv.uuid
    })
  );
  const crossMiroirTestVersions = miroirTestVersions.map((mtv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID,
    parentName: "ApplicationVersionCrossMiroirTestVersion",
    applicationVersion: selfApplicationVersionUuid,
    miroirTestVersion: mtv.uuid
  }));
  const crossBlobVersions = blobVersions.map((bv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_BLOB_VERSION_UUID,
    parentName: "ApplicationVersionCrossBlobVersion",
    applicationVersion: selfApplicationVersionUuid,
    blobVersion: bv.uuid
  }));
  const crossTestConfigurationVersions = testConfigurationVersions.map((tcv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_TEST_CONFIGURATION_VERSION_UUID,
    parentName: "ApplicationVersionCrossTestConfigurationVersion",
    applicationVersion: selfApplicationVersionUuid,
    testConfigurationVersion: tcv.uuid
  }));
  const crossTestVersions = testVersions.map((tv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_TEST_VERSION_UUID,
    parentName: "ApplicationVersionCrossTestVersion",
    applicationVersion: selfApplicationVersionUuid,
    testVersion: tv.uuid
  }));
  return {
    selfApplicationVersion,
    entityVersions,
    crossEntityVersions,
    entityVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      ENTITY_VERSION_ENTITY_UUID
    ),
    queryVersions,
    crossQueryVersions,
    queryVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      QUERY_VERSION_ENTITY_UUID
    ),
    reportVersions,
    crossReportVersions,
    reportVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      REPORT_VERSION_ENTITY_UUID
    ),
    menuVersions,
    crossMenuVersions,
    menuVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      MENU_VERSION_ENTITY_UUID
    ),
    endpointVersions,
    crossEndpointVersions,
    endpointVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      ENDPOINT_VERSION_ENTITY_UUID
    ),
    runnerVersions,
    crossRunnerVersions,
    runnerVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      RUNNER_VERSION_ENTITY_UUID
    ),
    themeVersions,
    crossThemeVersions,
    themeVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      THEME_VERSION_ENTITY_UUID
    ),
    transformerDefinitionVersions,
    crossTransformerDefinitionVersions,
    transformerDefinitionVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID
    ),
    mlSchemaVersions,
    crossMlSchemaVersions,
    mlSchemaVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      ML_SCHEMA_VERSION_ENTITY_UUID
    ),
    miroirTestVersions,
    crossMiroirTestVersions,
    miroirTestVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid,
      MIROIR_TEST_VERSION_ENTITY_UUID
    ),
    blobVersions,
    crossBlobVersions,
    testConfigurationVersions,
    crossTestConfigurationVersions,
    testVersions,
    crossTestVersions
  };
}
var MIROIR_SELF_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
function selectEntitiesToFreeze(applicationUuid, entities, metaModelEntityUuids) {
  if (applicationUuid === MIROIR_SELF_APPLICATION_UUID) {
    return entities.filter((entity) => {
      const section = getApplicationSection(applicationUuid, entity.uuid);
      return section !== "modelVersion" && section !== "devData";
    });
  }
  return entities.filter((entity) => !metaModelEntityUuids.has(entity.uuid));
}
function planFreezeApplicationVersion(input) {
  assertApplicationVersioningEnabled(input.selfApplication);
  return buildFreezeApplicationVersionPlan(input);
}
function mergeInstancesByUuid(base, extra) {
  if (!extra?.length) {
    return base;
  }
  const merged = new Map(base.map((item) => [item.uuid, item]));
  for (const item of extra) {
    merged.set(item.uuid, item);
  }
  return [...merged.values()];
}
function mergeVersionHistoryIntoFreezeMetaModel(metaModel, persisted) {
  return {
    ...metaModel,
    applicationVersions: mergeInstancesByUuid(
      metaModel.applicationVersions,
      persisted.applicationVersions
    ),
    entityVersions: mergeInstancesByUuid(metaModel.entityVersions, persisted.entityVersions),
    applicationVersionCrossEntityVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossEntityVersion,
      persisted.applicationVersionCrossEntityVersion
    ),
    applicationVersionCrossQueryVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossQueryVersion ?? [],
      persisted.applicationVersionCrossQueryVersion
    ),
    queryVersions: mergeInstancesByUuid(metaModel.queryVersions ?? [], persisted.queryVersions),
    applicationVersionCrossReportVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossReportVersion ?? [],
      persisted.applicationVersionCrossReportVersion
    ),
    reportVersions: mergeInstancesByUuid(metaModel.reportVersions ?? [], persisted.reportVersions),
    applicationVersionCrossMenuVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossMenuVersion ?? [],
      persisted.applicationVersionCrossMenuVersion
    ),
    menuVersions: mergeInstancesByUuid(metaModel.menuVersions ?? [], persisted.menuVersions),
    applicationVersionCrossEndpointVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossEndpointVersion ?? [],
      persisted.applicationVersionCrossEndpointVersion
    ),
    endpointVersions: mergeInstancesByUuid(
      metaModel.endpointVersions ?? [],
      persisted.endpointVersions
    ),
    applicationVersionCrossRunnerVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossRunnerVersion ?? [],
      persisted.applicationVersionCrossRunnerVersion
    ),
    runnerVersions: mergeInstancesByUuid(metaModel.runnerVersions ?? [], persisted.runnerVersions),
    applicationVersionCrossThemeVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossThemeVersion ?? [],
      persisted.applicationVersionCrossThemeVersion
    ),
    themeVersions: mergeInstancesByUuid(metaModel.themeVersions ?? [], persisted.themeVersions),
    applicationVersionCrossTransformerDefinitionVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossTransformerDefinitionVersion ?? [],
      persisted.applicationVersionCrossTransformerDefinitionVersion
    ),
    transformerDefinitionVersions: mergeInstancesByUuid(
      metaModel.transformerDefinitionVersions ?? [],
      persisted.transformerDefinitionVersions
    ),
    applicationVersionCrossMlSchemaVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossMlSchemaVersion ?? [],
      persisted.applicationVersionCrossMlSchemaVersion
    ),
    mlSchemaVersions: mergeInstancesByUuid(
      metaModel.mlSchemaVersions ?? [],
      persisted.mlSchemaVersions
    ),
    applicationVersionCrossMiroirTestVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossMiroirTestVersion ?? [],
      persisted.applicationVersionCrossMiroirTestVersion
    ),
    miroirTestVersions: mergeInstancesByUuid(
      metaModel.miroirTestVersions ?? [],
      persisted.miroirTestVersions
    )
  };
}
async function loadVersionHistoryFreezeSlice(loadInstances) {
  const load = async (parentUuid) => await loadInstances(parentUuid);
  return {
    applicationVersions: await load(APPLICATION_VERSION_ENTITY_UUID),
    entityVersions: await load(ENTITY_VERSION_ENTITY_UUID),
    applicationVersionCrossEntityVersion: await load(APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID),
    queryVersions: await load(QUERY_VERSION_ENTITY_UUID),
    applicationVersionCrossQueryVersion: await load(APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID),
    reportVersions: await load(REPORT_VERSION_ENTITY_UUID),
    applicationVersionCrossReportVersion: await load(APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID),
    menuVersions: await load(MENU_VERSION_ENTITY_UUID),
    applicationVersionCrossMenuVersion: await load(APPLICATION_VERSION_CROSS_MENU_VERSION_UUID),
    endpointVersions: await load(ENDPOINT_VERSION_ENTITY_UUID),
    applicationVersionCrossEndpointVersion: await load(APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID),
    runnerVersions: await load(RUNNER_VERSION_ENTITY_UUID),
    applicationVersionCrossRunnerVersion: await load(APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID),
    themeVersions: await load(THEME_VERSION_ENTITY_UUID),
    applicationVersionCrossThemeVersion: await load(APPLICATION_VERSION_CROSS_THEME_VERSION_UUID),
    transformerDefinitionVersions: await load(TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID),
    applicationVersionCrossTransformerDefinitionVersion: await load(
      APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID
    ),
    mlSchemaVersions: await load(ML_SCHEMA_VERSION_ENTITY_UUID),
    applicationVersionCrossMlSchemaVersion: await load(
      APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID
    ),
    miroirTestVersions: await load(MIROIR_TEST_VERSION_ENTITY_UUID),
    applicationVersionCrossMiroirTestVersion: await load(
      APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID
    )
  };
}
function planFreezeApplicationVersionFromMetaModel(payload, metaModel, options) {
  const selfApplication = metaModel.applications.find((a) => a.uuid === payload.application);
  if (!selfApplication) {
    throw new Error(
      `freezeApplicationVersion: SelfApplication ${payload.application} not found in current model`
    );
  }
  const freezeProducedVersionUuids = metaModel.applicationVersions.filter(
    (sav) => sav.selfApplication === payload.application && metaModel.applicationVersionCrossEntityVersion.some(
      (c) => c.applicationVersion === sav.uuid
    )
  ).map((sav) => sav.uuid);
  let branchUuid = normalizeOptionalBranchUuid(payload.branch);
  if (!branchUuid) {
    const freezeSet = new Set(freezeProducedVersionUuids);
    const freezeSavs = metaModel.applicationVersions.filter((sav) => freezeSet.has(sav.uuid));
    const referenced = new Set(
      freezeSavs.map((s) => s.previousVersion).filter((u) => typeof u === "string" && u.length > 0)
    );
    const heads = freezeSavs.filter((s) => !referenced.has(s.uuid));
    if (heads.length === 1) {
      branchUuid = normalizeOptionalBranchUuid(heads[0].branch);
    } else if (heads.length > 1) {
      throw new Error(
        "freezeApplicationVersion requires payload.branch when multiple freeze tips exist"
      );
    }
  }
  if (!branchUuid) {
    const existingWithBranch = metaModel.applicationVersions.find(
      (sav) => sav.selfApplication === payload.application && !!normalizeOptionalBranchUuid(sav.branch)
    );
    branchUuid = normalizeOptionalBranchUuid(existingWithBranch?.branch);
  }
  if (!branchUuid) {
    throw new Error(
      "freezeApplicationVersion requires payload.branch on first freeze (no previous freeze tip)"
    );
  }
  const tip = resolvePreviousApplicationVersion(metaModel.applicationVersions, {
    selfApplicationUuid: payload.application,
    branchUuid,
    freezeProducedVersionUuids
  });
  let previousEntityVersions;
  if (tip) {
    const evUuids = new Set(
      metaModel.applicationVersionCrossEntityVersion.filter((c) => c.applicationVersion === tip.uuid).map((c) => c.entityVersion)
    );
    previousEntityVersions = metaModel.entityVersions.filter((ev) => evUuids.has(ev.uuid));
  }
  return planFreezeApplicationVersion({
    selfApplication,
    selfApplicationUuid: payload.application,
    branchUuid,
    versionName: payload.versionName,
    description: payload.description,
    entities: metaModel.entities,
    storedQueries: metaModel.storedQueries,
    reports: metaModel.reports,
    menus: metaModel.menus,
    endpoints: metaModel.endpoints,
    runners: metaModel.runners,
    themes: metaModel.themes,
    transformerDefinitions: metaModel.transformerDefinitions,
    mlSchemas: metaModel.mlSchemas,
    tests: metaModel.tests,
    blobs: metaModel.blobs,
    testConfigurations: metaModel.testConfigurations,
    testInstances: metaModel.testInstances,
    existingApplicationVersions: metaModel.applicationVersions,
    freezeProducedVersionUuids,
    previousEntityVersions,
    newUuid: options?.newUuid
  });
}

// src/freezeApplicationVersion.ts
var MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
var INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";
var HISTORY_ENTITIES = [
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossQueryVersion,
  entityHistoricalQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityHistoricalReportVersion,
  entityApplicationVersionCrossMenuVersion,
  entityHistoricalMenuVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityHistoricalEndpointVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityHistoricalRunnerVersion,
  entityApplicationVersionCrossThemeVersion,
  entityHistoricalThemeVersion,
  entityApplicationVersionCrossTransformerDefinitionVersion,
  entityHistoricalTransformerDefinitionVersion,
  // #230
  entityApplicationVersionCrossMlSchemaVersion,
  entityHistoricalMlSchemaVersion,
  entityApplicationVersionCrossMiroirTestVersion,
  entityHistoricalMiroirTestVersion,
  // #706
  entityApplicationVersionCrossBlobVersion,
  entityHistoricalBlobVersion,
  entityApplicationVersionCrossTestConfigurationVersion,
  entityHistoricalTestConfigurationVersion,
  entityApplicationVersionCrossTestVersion,
  entityHistoricalTestVersion
];
function targetModelEnvironment(host, application, applicationDeploymentMap, modelEnvironment) {
  if (modelEnvironment?.deploymentUuid !== void 0 && modelEnvironment.deploymentUuid === applicationDeploymentMap[application]) {
    return modelEnvironment;
  }
  return host.asDomainControllerInterface().currentModelEnvironment(application, applicationDeploymentMap);
}
async function ensureHistoryEntities(host, application, applicationDeploymentMap, modelEnvironment) {
  const present = new Set(modelEnvironment.currentModel.entities.map((entity) => entity.uuid));
  for (const historyEntity of HISTORY_ENTITIES) {
    if (present.has(historyEntity.uuid)) {
      continue;
    }
    const created = await host.handleModelAction(
      {
        actionType: "createEntity",
        actionLabel: `freezeEnsure${historyEntity.name}Entity`,
        endpoint: MODEL_ENDPOINT_UUID,
        payload: { application, transactional: false, entities: [historyEntity] }
      },
      applicationDeploymentMap,
      modelEnvironment
    );
    if (created instanceof Action2Error) {
      return new Action2Error(
        "FailedToHandleAction",
        `freezeApplicationVersion failed to ensure ${historyEntity.name} Entity exists`,
        [],
        created
      );
    }
  }
  return ACTION_OK;
}
function freezeMetaModelSlice(metaModel) {
  return {
    applications: metaModel.applications,
    entities: metaModel.entities,
    storedQueries: metaModel.storedQueries,
    reports: metaModel.reports,
    menus: metaModel.menus,
    endpoints: metaModel.endpoints,
    runners: metaModel.runners,
    themes: metaModel.themes,
    transformerDefinitions: metaModel.transformerDefinitions,
    applicationVersions: metaModel.applicationVersions,
    entityVersions: metaModel.entityVersions,
    applicationVersionCrossEntityVersion: metaModel.applicationVersionCrossEntityVersion,
    applicationVersionCrossQueryVersion: metaModel.applicationVersionCrossQueryVersion,
    queryVersions: metaModel.queryVersions,
    applicationVersionCrossReportVersion: metaModel.applicationVersionCrossReportVersion,
    reportVersions: metaModel.reportVersions,
    applicationVersionCrossMenuVersion: metaModel.applicationVersionCrossMenuVersion,
    menuVersions: metaModel.menuVersions,
    applicationVersionCrossEndpointVersion: metaModel.applicationVersionCrossEndpointVersion,
    endpointVersions: metaModel.endpointVersions,
    applicationVersionCrossRunnerVersion: metaModel.applicationVersionCrossRunnerVersion,
    runnerVersions: metaModel.runnerVersions,
    applicationVersionCrossThemeVersion: metaModel.applicationVersionCrossThemeVersion,
    themeVersions: metaModel.themeVersions,
    applicationVersionCrossTransformerDefinitionVersion: metaModel.applicationVersionCrossTransformerDefinitionVersion,
    transformerDefinitionVersions: metaModel.transformerDefinitionVersions,
    mlSchemas: metaModel.mlSchemas,
    tests: metaModel.tests,
    applicationVersionCrossMlSchemaVersion: metaModel.applicationVersionCrossMlSchemaVersion,
    mlSchemaVersions: metaModel.mlSchemaVersions,
    applicationVersionCrossMiroirTestVersion: metaModel.applicationVersionCrossMiroirTestVersion,
    miroirTestVersions: metaModel.miroirTestVersions
  };
}
async function loadInstancesToFreeze(host, application, applicationDeploymentMap) {
  const loaded = [];
  for (const entity of [entityBlob, entityTestConfiguration, entityTest]) {
    const section = getApplicationSection2(application, entity.uuid);
    const instances = await host.readSectionInstances(application, applicationDeploymentMap, section, entity.uuid);
    if (instances instanceof Action2Error) {
      return new Action2Error(
        "FailedToHandleAction",
        `freezeApplicationVersion failed to read the ${entity.name} instances of ${application} in section ${section}`,
        [],
        instances
      );
    }
    loaded.push(instances);
  }
  const [blobs, testConfigurations, testInstances] = loaded;
  return { blobs, testConfigurations, testInstances };
}
function planBatches(plan) {
  const historySection = plan.entityVersionApplicationSection;
  return [
    ["freezeSelfApplicationVersion", [plan.selfApplicationVersion], entitySelfApplicationVersion.uuid, historySection],
    ["freezeEntityVersions", plan.entityVersions, entityEntityVersion.uuid, plan.entityVersionApplicationSection],
    ["freezeQueryVersions", plan.queryVersions, entityHistoricalQueryVersion.uuid, plan.queryVersionApplicationSection],
    ["freezeReportVersions", plan.reportVersions, entityHistoricalReportVersion.uuid, plan.reportVersionApplicationSection],
    ["freezeMenuVersions", plan.menuVersions, entityHistoricalMenuVersion.uuid, plan.menuVersionApplicationSection],
    [
      "freezeEndpointVersions",
      plan.endpointVersions,
      entityHistoricalEndpointVersion.uuid,
      plan.endpointVersionApplicationSection
    ],
    ["freezeRunnerVersions", plan.runnerVersions, entityHistoricalRunnerVersion.uuid, plan.runnerVersionApplicationSection],
    ["freezeThemeVersions", plan.themeVersions, entityHistoricalThemeVersion.uuid, plan.themeVersionApplicationSection],
    [
      "freezeTransformerDefinitionVersions",
      plan.transformerDefinitionVersions,
      entityHistoricalTransformerDefinitionVersion.uuid,
      plan.transformerDefinitionVersionApplicationSection
    ],
    [
      "freezeMlSchemaVersions",
      plan.mlSchemaVersions,
      entityHistoricalMlSchemaVersion.uuid,
      plan.mlSchemaVersionApplicationSection
    ],
    [
      "freezeMiroirTestVersions",
      plan.miroirTestVersions,
      entityHistoricalMiroirTestVersion.uuid,
      plan.miroirTestVersionApplicationSection
    ],
    // #706
    ["freezeBlobVersions", plan.blobVersions, entityHistoricalBlobVersion.uuid, historySection],
    [
      "freezeTestConfigurationVersions",
      plan.testConfigurationVersions,
      entityHistoricalTestConfigurationVersion.uuid,
      historySection
    ],
    ["freezeTestVersions", plan.testVersions, entityHistoricalTestVersion.uuid, historySection],
    ["freezeCrossEntityVersions", plan.crossEntityVersions, entityApplicationVersionCrossEntityVersion.uuid, historySection],
    ["freezeCrossQueryVersions", plan.crossQueryVersions, entityApplicationVersionCrossQueryVersion.uuid, historySection],
    ["freezeCrossReportVersions", plan.crossReportVersions, entityApplicationVersionCrossReportVersion.uuid, historySection],
    ["freezeCrossMenuVersions", plan.crossMenuVersions, entityApplicationVersionCrossMenuVersion.uuid, historySection],
    [
      "freezeCrossEndpointVersions",
      plan.crossEndpointVersions,
      entityApplicationVersionCrossEndpointVersion.uuid,
      historySection
    ],
    ["freezeCrossRunnerVersions", plan.crossRunnerVersions, entityApplicationVersionCrossRunnerVersion.uuid, historySection],
    ["freezeCrossThemeVersions", plan.crossThemeVersions, entityApplicationVersionCrossThemeVersion.uuid, historySection],
    [
      "freezeCrossTransformerDefinitionVersions",
      plan.crossTransformerDefinitionVersions,
      entityApplicationVersionCrossTransformerDefinitionVersion.uuid,
      historySection
    ],
    [
      "freezeCrossMlSchemaVersions",
      plan.crossMlSchemaVersions,
      entityApplicationVersionCrossMlSchemaVersion.uuid,
      historySection
    ],
    [
      "freezeCrossMiroirTestVersions",
      plan.crossMiroirTestVersions,
      entityApplicationVersionCrossMiroirTestVersion.uuid,
      historySection
    ],
    ["freezeCrossBlobVersions", plan.crossBlobVersions, entityApplicationVersionCrossBlobVersion.uuid, historySection],
    [
      "freezeCrossTestConfigurationVersions",
      plan.crossTestConfigurationVersions,
      entityApplicationVersionCrossTestConfigurationVersion.uuid,
      historySection
    ],
    ["freezeCrossTestVersions", plan.crossTestVersions, entityApplicationVersionCrossTestVersion.uuid, historySection]
  ];
}
async function persistFreezeApplicationVersionPlan(host, plan, application, applicationDeploymentMap) {
  for (const [actionLabel, objects, , applicationSection] of planBatches(plan)) {
    if (objects.length === 0) {
      continue;
    }
    const result = await host.handleInstanceAction(
      {
        actionType: "createInstance",
        actionLabel,
        endpoint: INSTANCE_ENDPOINT_UUID,
        payload: { application, applicationSection, objects }
      },
      applicationDeploymentMap
    );
    if (result instanceof Action2Error) {
      return new Action2Error("FailedToHandleAction", `freezeApplicationVersion failed to persist ${actionLabel}`, [], result);
    }
  }
  return ACTION_OK;
}
var handleAction_freezeApplicationVersion = async (host, action, context) => {
  const payload = action.payload;
  const { applicationDeploymentMap } = context;
  const modelEnvironment = targetModelEnvironment(host, payload.application, applicationDeploymentMap, context.modelEnvironment);
  const metaModel = modelEnvironment.currentModel;
  const ensured = await ensureHistoryEntities(host, payload.application, applicationDeploymentMap, modelEnvironment);
  if (ensured instanceof Action2Error) {
    return ensured;
  }
  const metaBootstrapUuids = new Set((modelEnvironment.miroirMetaModel?.entities ?? []).map((e) => e.uuid));
  for (const historyEntity of HISTORY_ENTITIES) {
    metaBootstrapUuids.add(historyEntity.uuid);
  }
  const applicationEntities = selectEntitiesToFreeze(payload.application, metaModel.entities, metaBootstrapUuids);
  const instancesToFreeze = await loadInstancesToFreeze(host, payload.application, applicationDeploymentMap);
  if (instancesToFreeze instanceof Action2Error) {
    return instancesToFreeze;
  }
  const persistedHistory = await loadVersionHistoryFreezeSlice(async (parentEntityUuid) => {
    const instances = await host.readSectionInstances(
      payload.application,
      applicationDeploymentMap,
      "modelVersion",
      parentEntityUuid
    );
    return instances instanceof Action2Error ? [] : instances;
  });
  const enrichedMetaModel = mergeVersionHistoryIntoFreezeMetaModel(freezeMetaModelSlice(metaModel), persistedHistory);
  const plan = planFreezeApplicationVersionFromMetaModel(payload, {
    ...enrichedMetaModel,
    entities: applicationEntities,
    storedQueries: enrichedMetaModel.storedQueries,
    ...instancesToFreeze
  });
  return persistFreezeApplicationVersionPlan(host, plan, payload.application, applicationDeploymentMap);
};

// src/index.ts
var actionImplementations = {
  handleAction_freezeApplicationVersion
};
export {
  APPLICATION_VERSION_PLACEHOLDER_NAMES,
  actionImplementations,
  buildFreezeApplicationVersionPlan,
  diffEntityVersionSnapshots,
  handleAction_freezeApplicationVersion,
  isApplicationVersionPlaceholder,
  loadVersionHistoryFreezeSlice,
  mergeVersionHistoryIntoFreezeMetaModel,
  planFreezeApplicationVersion,
  planFreezeApplicationVersionFromMetaModel,
  resolvePreviousApplicationVersion,
  selectEntitiesToFreeze,
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
  snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions
};
