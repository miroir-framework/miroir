/**
 * Issue #217 §11 test-strategy compliance for Phases 0–4.
 * Locks gaps that phase-local suites did not fully cover.
 */
import { describe, expect, it } from "vitest";

import {
  entityApplicationForAdmin,
  entityDeployment,
  entityDefinitionAdminApplication,
  entityDefinitionDeployment,
} from "miroir-test-app_deployment-admin";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import {
  entityEntity,
  entityEntityDefinition,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityMenu,
  entityDefinitionMenu,
  entitySelfApplication,
  entityDefinitionSelfApplication,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import type {
  Entity,
  EntityDefinition,
  SelfApplication,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  alignEntityDefinitionToPresentEntity,
  assertVersioningEnabledImmutable,
  compareEntityPresentModelDefinitions,
  projectEntityPresentModelDefinition,
  resolveCurrentEntityModel,
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE,
} from "../../src/1_core/entityPresentModel.js";
import { getEntityPrimaryKeyAttribute } from "../../src/1_core/EntityPrimaryKey.js";
import { shouldCacheAllInstancesOnRefresh } from "../../src/1_core/cacheRefreshPolicy.js";

describe("§11.1 / Phase 0 — UI present-model fields locked", () => {
  it("Library Book exposes viewAttributes and defaultInstanceDetailsReportUuid on Entity", () => {
    const book = defaultLibraryAppModel.entities.find(
      (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    )!;
    const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
      (definition) => definition.entityUuid === book.uuid,
    )!;
    expect(book.viewAttributes).toEqual(bookDefinition.viewAttributes);
    expect(book.viewAttributes?.length).toBeGreaterThan(0);
    expect(book.defaultInstanceDetailsReportUuid).toBe(
      bookDefinition.defaultInstanceDetailsReportUuid,
    );
    expect(book.defaultInstanceDetailsReportUuid).toBeTruthy();
  });
});

describe("§11.3 / Phase 3–4 — migrated deployment behavioral equivalence", () => {
  it("Entity-first resolution is a no-op identity for complete Library Entities", () => {
    for (const entity of defaultLibraryAppModel.entities) {
      const entityDefinition = defaultLibraryAppModel.entityDefinitions.find(
        (definition) => definition.entityUuid === entity.uuid,
      )!;
      expect(resolveCurrentEntityModel(entity, [entityDefinition])).toBe(entity);
      expect(getEntityPrimaryKeyAttribute(entity)).toEqual(
        getEntityPrimaryKeyAttribute(entityDefinition),
      );
      expect(shouldCacheAllInstancesOnRefresh(entity)).toBe(
        shouldCacheAllInstancesOnRefresh(entityDefinition),
      );
    }
  });
});

describe("§11.3 / Phase 4 — dual-write projection equality", () => {
  it("alignEntityDefinitionToPresentEntity satisfies project(Entity) == project(ED copy)", () => {
    for (const entity of defaultLibraryAppModel.entities) {
      const entityDefinition = defaultLibraryAppModel.entityDefinitions.find(
        (definition) => definition.entityUuid === entity.uuid,
      )!;
      const aligned = alignEntityDefinitionToPresentEntity(entity, entityDefinition);
      expect(compareEntityPresentModelDefinitions(entity, aligned)).toEqual({
        equal: true,
        differingFields: [],
      });
    }
  });

  it("keeps Entity authoritative when Entity diverges before align", () => {
    const book = defaultLibraryAppModel.entities.find(
      (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    )!;
    const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
      (definition) => definition.entityUuid === book.uuid,
    )!;
    const diverged: Entity = { ...book, viewAttributes: ["onlyEntity"] };
    const aligned = alignEntityDefinitionToPresentEntity(diverged, bookDefinition);
    expect(projectEntityPresentModelDefinition(aligned).viewAttributes).toEqual([
      "onlyEntity",
    ]);
    expect(compareEntityPresentModelDefinitions(diverged, aligned).equal).toBe(true);
  });
});

describe("§11.1 / Phase 4 — codegen source Entity.mlSchema ≡ EntityDefinition.mlSchema", () => {
  const pairs: Array<{ label: string; entity: Entity; entityDefinition: EntityDefinition }> = [
    {
      label: "Entity",
      entity: entityEntity as Entity,
      entityDefinition: entityDefinitionEntity as EntityDefinition,
    },
    {
      label: "EntityDefinition",
      entity: entityEntityDefinition as Entity,
      entityDefinition: entityDefinitionEntityDefinition as EntityDefinition,
    },
    {
      label: "SelfApplication",
      entity: entitySelfApplication as Entity,
      entityDefinition: entityDefinitionSelfApplication as EntityDefinition,
    },
    {
      label: "Menu",
      entity: entityMenu as Entity,
      entityDefinition: entityDefinitionMenu as EntityDefinition,
    },
    {
      label: "AdminApplication",
      entity: entityApplicationForAdmin as Entity,
      entityDefinition: entityDefinitionAdminApplication as EntityDefinition,
    },
    {
      label: "Deployment",
      entity: entityDeployment as Entity,
      entityDefinition: entityDefinitionDeployment as EntityDefinition,
    },
  ];

  for (const pair of pairs) {
    it(`${pair.label} Entity.mlSchema equals EntityDefinition.mlSchema`, () => {
      expect(pair.entity.mlSchema).toEqual(pair.entityDefinition.mlSchema);
    });
  }
});

describe("§11.1 — versioningEnabled immutability policy", () => {
  it("allows updates that preserve versioningEnabled", () => {
    expect(() =>
      assertVersioningEnabledImmutable(VERSIONED_APPLICATION_FIXTURE, {
        versioningEnabled: true,
      }),
    ).not.toThrow();
    expect(() =>
      assertVersioningEnabledImmutable(UNVERSIONED_APPLICATION_FIXTURE, {
        versioningEnabled: false,
      }),
    ).not.toThrow();
    expect(() =>
      assertVersioningEnabledImmutable(selfApplicationMiroir as SelfApplication, {
        ...(selfApplicationMiroir as SelfApplication),
        defaultLabel: "Miroir renamed",
      }),
    ).not.toThrow();
  });

  it("rejects flipping versioningEnabled after creation", () => {
    expect(() =>
      assertVersioningEnabledImmutable(VERSIONED_APPLICATION_FIXTURE, UNVERSIONED_APPLICATION_FIXTURE),
    ).toThrow(/immutable/);
    expect(() =>
      assertVersioningEnabledImmutable(
        selfApplicationMiroir as SelfApplication,
        { ...(selfApplicationMiroir as SelfApplication), versioningEnabled: false },
      ),
    ).toThrow(/immutable/);
  });
});
