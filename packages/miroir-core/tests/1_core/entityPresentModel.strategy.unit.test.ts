/**
 * Issue #217 §11 test-strategy compliance for Phases 0–4.
 * Locks gaps that phase-local suites did not fully cover.
 */
import { describe, expect, it } from "vitest";

import {
  entityApplicationForAdmin,
  entityDefinitionAdminApplication,
  entityDefinitionDeployment,
  entityDeployment,
} from "miroir-test-app_deployment-admin";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import {
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionMenu,
  entityDefinitionSelfApplication,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entitySelfApplication,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import type {
  Entity,
  EntityVersion,
  SelfApplication,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  assertVersioningEnabledImmutable,
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE
} from "../../src/1_core/entityPresentModel.js";

describe("§11.1 / Phase 0 — UI present-model fields locked", () => {
  it("Library Book exposes viewAttributes and defaultInstanceDetailsReportUuid on Entity", () => {
    const book = defaultLibraryAppModel.entities.find(
      (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    )!;
    const bookDefinition = defaultLibraryAppModel.entityVersions.find(
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

describe("§11.1 / Phase 4 — codegen source Entity.mlSchema ≡ EntityVersion.mlSchema", () => {
  const pairs: Array<{ label: string; entity: Entity; entityVersion: EntityVersion }> = [
    {
      label: "Entity",
      entity: entityEntity as Entity,
      entityVersion: entityDefinitionEntity as EntityVersion,
    },
    {
      label: "EntityVersion",
      entity: entityEntityDefinition as Entity,
      entityVersion: entityDefinitionEntityDefinition as EntityVersion,
    },
    {
      label: "SelfApplication",
      entity: entitySelfApplication as Entity,
      entityVersion: entityDefinitionSelfApplication as EntityVersion,
    },
    {
      label: "Menu",
      entity: entityMenu as Entity,
      entityVersion: entityDefinitionMenu as EntityVersion,
    },
    {
      label: "AdminApplication",
      entity: entityApplicationForAdmin as Entity,
      entityVersion: entityDefinitionAdminApplication as EntityVersion,
    },
    {
      label: "Deployment",
      entity: entityDeployment as Entity,
      entityVersion: entityDefinitionDeployment as EntityVersion,
    },
  ];

  for (const pair of pairs) {
    it(`${pair.label} Entity.mlSchema equals EntityVersion.mlSchema`, () => {
      expect(pair.entity.mlSchema).toEqual(pair.entityVersion.mlSchema);
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
