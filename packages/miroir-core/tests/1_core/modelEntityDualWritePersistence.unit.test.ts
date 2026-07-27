/**
 * #217 Phase 6 — persistEntityThenEntityDefinition.
 * #220 compat suite — dual-write persistence (not present-model authority).
 */
import { describe, expect, it, vi } from "vitest";

import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../src/1_core/constants.js";
import type {
  Entity,
  EntityDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import {
  detectEntityEntityDefinitionInconsistencies,
  persistEntityThenEntityDefinition,
} from "../../src/1_core/modelEntityDualWritePersistence.js";
import { applyAlterEntityAttributePair } from "../../src/1_core/modelEntityDualWrite.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

describe("217 Phase 6 — persistEntityThenEntityDefinition", () => {
  it("writes Entity then EntityDefinition in order", async () => {
    const order: string[] = [];
    const result = await persistEntityThenEntityDefinition(
      { entity: bookEntity, entityDefinition: bookDefinition },
      {
        writeEntity: async () => {
          order.push("entity");
          return ACTION_OK;
        },
        writeEntityDefinition: async () => {
          order.push("entityDefinition");
          return ACTION_OK;
        },
      },
      { failurePolicy: { kind: "compensate" } },
    );
    expect(result).toEqual(ACTION_OK);
    expect(order).toEqual(["entity", "entityDefinition"]);
  });

  it("does not write EntityDefinition when Entity write fails", async () => {
    const writeEntityDefinition = vi.fn(async () => ACTION_OK);
    const result = await persistEntityThenEntityDefinition(
      { entity: bookEntity, entityDefinition: bookDefinition },
      {
        writeEntity: async () =>
          new Action2Error("FailedToHandleAction", "entity write failed"),
        writeEntityDefinition,
      },
      { failurePolicy: { kind: "compensate" } },
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect(writeEntityDefinition).not.toHaveBeenCalled();
  });

  it("compensate create: deletes Entity when EntityDefinition write fails", async () => {
    const deleted: string[] = [];
    const result = await persistEntityThenEntityDefinition(
      { entity: bookEntity, entityDefinition: bookDefinition },
      {
        writeEntity: async () => ACTION_OK,
        writeEntityDefinition: async () =>
          new Action2Error("FailedToHandleAction", "ed write failed"),
        deleteEntity: async (entity) => {
          deleted.push(entity.uuid);
          return ACTION_OK;
        },
      },
      { failurePolicy: { kind: "compensate" } },
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect(deleted).toEqual([bookEntity.uuid]);
  });

  it("compensate update: restores previous Entity when EntityDefinition write fails", async () => {
    const restored: Entity[] = [];
    const previousEntity = { ...bookEntity, name: "BookBefore" };
    const result = await persistEntityThenEntityDefinition(
      { entity: bookEntity, entityDefinition: bookDefinition },
      {
        writeEntity: async () => ACTION_OK,
        writeEntityDefinition: async () =>
          new Action2Error("FailedToHandleAction", "ed write failed"),
        restoreEntity: async (entity) => {
          restored.push(entity);
          return ACTION_OK;
        },
      },
      { failurePolicy: { kind: "compensate" }, previousEntity },
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect(restored).toEqual([previousEntity]);
  });

  it("bestEffortDetect: reports inconsistency and leaves Entity written", async () => {
    const reports: unknown[] = [];
    const deleted: string[] = [];
    const result = await persistEntityThenEntityDefinition(
      { entity: bookEntity, entityDefinition: bookDefinition },
      {
        writeEntity: async () => ACTION_OK,
        writeEntityDefinition: async () =>
          new Action2Error("FailedToHandleAction", "ed write failed"),
        deleteEntity: async (entity) => {
          deleted.push(entity.uuid);
          return ACTION_OK;
        },
      },
      {
        failurePolicy: {
          kind: "bestEffortDetect",
          reportInconsistency: (report) => reports.push(report),
        },
      },
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect(deleted).toEqual([]);
    expect(reports).toHaveLength(1);
  });
});

describe("217 Phase 6 — detectEntityEntityDefinitionInconsistencies", () => {
  it("reports no inconsistencies for clean Library model", () => {
    expect(
      detectEntityEntityDefinitionInconsistencies(
        defaultLibraryAppModel.entities as Entity[],
        defaultLibraryAppModel.entityDefinitions as EntityDefinition[],
      ),
    ).toEqual([]);
  });

  it("reports present-model field divergence after alter of Entity only", () => {
    const pair = applyAlterEntityAttributePair(bookEntity, bookDefinition, {
      addColumns: [{ name: "isbn", definition: { type: "string" } }],
    });
    const inconsistencies = detectEntityEntityDefinitionInconsistencies(
      [pair.entity],
      [bookDefinition],
    );
    expect(inconsistencies).toHaveLength(1);
    expect(inconsistencies[0]?.entityUuid).toBe(bookEntity.uuid);
    expect(inconsistencies[0]?.differingFields).toContain("mlSchema");
  });
});
