/**
 * Issue #217 §11 test-strategy compliance.
 * Locks gaps that phase-local suites did not fully cover.
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import {
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import type {
  SelfApplication,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  assertVersioningEnabledImmutable,
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE
} from "../../src/1_core/versioning/applicationVersioning.js";

describe("§11.1 / Phase 0 — UI present-model fields locked", () => {
  it("Library Book exposes viewAttributes and defaultInstanceDetailsReportUuid on Entity", () => {
    const book = defaultLibraryAppModel.entities.find(
      (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    )!;
    expect(book.viewAttributes?.length).toBeGreaterThan(0);
    expect(book.defaultInstanceDetailsReportUuid).toBeTruthy();
    expect(book.mlSchema).toBeTruthy();
  });
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
