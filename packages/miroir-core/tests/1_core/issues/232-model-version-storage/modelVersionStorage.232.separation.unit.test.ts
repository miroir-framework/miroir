/**
 * #232 Slice 5.3 — Regression locks for the modelVersion separation invariant.
 */
import { describe, expect, it } from "vitest";

import {
  entityEntity,
  entityEntityVersion,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { getApplicationSection, versionHistoryEntityUuids } from "../../../../src/1_core/Model.js";
import {
  buildFreezeApplicationVersionPlan,
  planFreezeApplicationVersionFromMetaModel,
  type FreezeMetaModelSlice,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";
import { PersistenceStoreController } from "../../../../src/4_services/PersistenceStoreController.js";
import type { Entity } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../../../src/1_core/constants.js";
import type {
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
} from "../../../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: entityEntity.uuid!,
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

class EmptyDataSection implements PersistenceStoreDataSectionInterface {
  constructor(public readonly section: "data" | "modelVersion", public readonly name: string) {}
  getStoreName() {
    return this.name;
  }
  async open() {
    return ACTION_OK;
  }
  async close() {
    return ACTION_OK;
  }
  async bootFromPersistedState() {
    return ACTION_OK;
  }
  getEntityUuids() {
    return [];
  }
  getEntityIdAttribute() {
    return "uuid";
  }
  async clear() {
    return ACTION_OK;
  }
  async getInstance() {
    return { returnedDomainElement: { elementType: "void", elementValue: {} as any } } as any;
  }
  async getInstances() {
    return {
      returnedDomainElement: {
        elementType: "entityInstanceCollection",
        elementValue: { parentUuid: "", applicationSection: this.section, instances: [] },
      },
    } as any;
  }
  async handleQueryTemplateActionForServerONLY() {
    return { returnedDomainElement: { elementType: "void", elementValue: undefined } } as any;
  }
  async handleBoxedQueryAction() {
    return { returnedDomainElement: { elementType: "void", elementValue: undefined } } as any;
  }
  async upsertInstance() {
    return ACTION_OK;
  }
  async deleteInstance() {
    return ACTION_OK;
  }
  async deleteInstances() {
    return ACTION_OK;
  }
  async dropStorageSpaceForInstancesOfEntity() {
    return ACTION_OK;
  }
  async createStorageSpaceForInstancesOfEntity() {
    return ACTION_OK;
  }
  async renameStorageSpaceForInstancesOfEntity() {
    return ACTION_OK;
  }
  async getState() {
    return {};
  }
}

class EmptyModelSection extends EmptyDataSection implements PersistenceStoreModelSectionInterface {
  constructor(name: string) {
    super("data", name);
  }
  existsEntity() {
    return false;
  }
  async createEntity() {
    return ACTION_OK;
  }
  async createEntities() {
    return ACTION_OK;
  }
  async renameEntityClean() {
    return ACTION_OK;
  }
  async alterEntityAttribute() {
    return ACTION_OK;
  }
  async dropEntity() {
    return ACTION_OK;
  }
  async dropEntities() {
    return ACTION_OK;
  }
}

function makeAdminStub(): PersistenceStoreAdminSectionInterface {
  return {
    getStoreName: () => "admin",
    open: async () => ACTION_OK,
    close: async () => ACTION_OK,
    createStore: async () => ACTION_OK,
    deleteStore: async () => ACTION_OK,
  };
}

describe("232 Slice 5.3 — modelVersion separation matrix", () => {
  it("unversioned controller rejects modelVersion without falling back to model or data", async () => {
    const controller = new PersistenceStoreController(
      makeAdminStub(),
      new EmptyModelSection("model"),
      new EmptyDataSection("data", "data"),
    );
    const result = await controller.getInstances("modelVersion", entitySelfApplicationVersion.uuid!);
    expect(result instanceof Action2Error).toBe(true);
    if (result instanceof Action2Error) {
      expect(result.errorMessage).toMatch(/modelVersion/i);
      expect(result.errorMessage).not.toMatch(/fall/i);
    }
  });

  it("live Entity rows stay in model; version-history rows stay in modelVersion", () => {
    expect(getApplicationSection(selfApplicationLibrary.uuid, entityEntity.uuid!)).toBe("model");
    expect(getApplicationSection(selfApplicationLibrary.uuid, entityEntityVersion.uuid!)).toBe(
      "modelVersion",
    );
    expect(getApplicationSection(selfApplicationLibrary.uuid, "00000000-0000-0000-0000-000000000001")).toBe(
      "data",
    );
  });

  it("freeze plan never targets model or data for history batches", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: selfApplicationLibrary.uuid,
      branchUuid: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
      versionName: "V1",
      entities: [makeEntity("7395d1e5-6a44-49d8-91cb-452302b41162", "Book")],
      newUuid: (() => {
        let n = 0;
        return () => `aaaaaaaa-aaaa-4aaa-8aaa-${String(++n).padStart(12, "0")}`;
      })(),
    });
    const historySections = [
      plan.entityVersionApplicationSection,
      plan.queryVersionApplicationSection,
      plan.reportVersionApplicationSection,
      plan.menuVersionApplicationSection,
      plan.endpointVersionApplicationSection,
      plan.runnerVersionApplicationSection,
      plan.themeVersionApplicationSection,
      plan.transformerDefinitionVersionApplicationSection,
    ];
    for (const section of historySections) {
      expect(section).toBe("modelVersion");
    }
  });

  it("active-model freeze planning does not require persisted history rows in the live slice", () => {
    const live: FreezeMetaModelSlice = {
      applications: [{ uuid: selfApplicationLibrary.uuid, versioningEnabled: true }],
      entities: [makeEntity("7395d1e5-6a44-49d8-91cb-452302b41162", "Book")],
      applicationVersions: [],
      entityVersions: [],
      applicationVersionCrossEntityVersion: [],
    };
    const plan = planFreezeApplicationVersionFromMetaModel(
      {
        application: selfApplicationLibrary.uuid,
        versionName: "Bootstrap-Only-Live",
        branch: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
      },
      live,
    );
    expect(plan.selfApplicationVersion.name).toBe("Bootstrap-Only-Live");
    expect(versionHistoryEntityUuids.has(entitySelfApplicationVersion.uuid!)).toBe(true);
    expect(getApplicationSection(selfApplicationMiroir.uuid, entitySelfApplicationVersion.uuid!)).toBe(
      "modelVersion",
    );
  });
});
