/**
 * #232 Slice 4.1 — Postgres opens a distinct modelVersion schema from live model.
 */
import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import type { StoreUnitConfiguration } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../../../src/1_core/constants.js";
import { ConfigurationService } from "../../../../src/3_controllers/ConfigurationService.js";
import { PersistenceStoreControllerManager } from "../../../../src/4_services/PersistenceStoreControllerManager.js";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

const DEPLOYMENT_UUID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PARENT_ENTITY_UUID = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
const HISTORY_INSTANCE = {
  uuid: randomUUID(),
  parentUuid: PARENT_ENTITY_UUID,
  parentName: "SelfApplicationVersion",
  name: "232-sql-startup-test",
};

const postgresHost = process.env.MIROIR_TEST_POSTGRES_HOST ?? "localhost";
const connectionString = `postgres://postgres:postgres@${postgresHost}:5432/postgres`;

let postgresAvailable = false;

function buildSqlConfig(runId: string): StoreUnitConfiguration {
  return {
    admin: {
      emulatedServerType: "sql",
      connectionString,
      schema: `232_admin_${runId}`,
      forceNullOptionalAttributeToUndefined: true,
    },
    model: {
      emulatedServerType: "sql",
      connectionString,
      schema: `232_library_${runId}`,
      forceNullOptionalAttributeToUndefined: true,
    },
    data: {
      emulatedServerType: "sql",
      connectionString,
      schema: `232_library_${runId}`,
      forceNullOptionalAttributeToUndefined: true,
    },
    modelVersion: {
      emulatedServerType: "sql",
      connectionString,
      schema: `232_library_mv_${runId}`,
      forceNullOptionalAttributeToUndefined: true,
    },
  };
}

describe("232 Slice 4.1 — PersistenceStoreControllerManager SQL modelVersion startup", () => {
  beforeAll(async () => {
    try {
      const { Client } = await import("pg");
      const client = new Client({ connectionString });
      await client.connect();
      await client.end();
      postgresAvailable = true;
    } catch {
      postgresAvailable = false;
    }
  });

  afterEach(() => {
    ConfigurationService.configurationService.adminStoreFactoryRegister.clear();
    ConfigurationService.configurationService.StoreSectionFactoryRegister.clear();
  });

  it.skipIf(!postgresAvailable)(
    "4.1 — versioned SQL deployment opens distinct modelVersion schema and isolates history rows",
    async () => {
      miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);

      const runId = randomUUID().replace(/-/g, "").slice(0, 12);
      const config = buildSqlConfig(runId);
      expect(config.modelVersion!.schema).not.toBe(config.model.schema);

      const manager = new PersistenceStoreControllerManager(
        ConfigurationService.configurationService.adminStoreFactoryRegister,
        ConfigurationService.configurationService.StoreSectionFactoryRegister,
        "/tmp",
      );

      const addResult = await manager.addPersistenceStoreController(DEPLOYMENT_UUID, config);
      expect(addResult).toBe(ACTION_OK);

      const controller = manager.getPersistenceStoreController(DEPLOYMENT_UUID);
      expect(controller).toBeDefined();
      await controller!.open();

      const historyStoreName = controller!.getStoreName();
      expect(historyStoreName).toContain(`232_library_${runId}`);

      const upsertResult = await controller!.upsertInstance("modelVersion", HISTORY_INSTANCE as any);
      expect(upsertResult).toBe(ACTION_OK);

      const historyRead = await controller!.getInstances("modelVersion", PARENT_ENTITY_UUID);
      expect(historyRead instanceof Action2Error).toBe(false);
      if (historyRead instanceof Action2Error) return;
      const historyItems = (historyRead.returnedDomainElement as any).instances ?? [];
      expect(historyItems.some((row: any) => row.uuid === HISTORY_INSTANCE.uuid)).toBe(true);

      const modelSectionRead = await controller!.getInstances("model", PARENT_ENTITY_UUID);
      expect(modelSectionRead instanceof Action2Error).toBe(false);
      if (modelSectionRead instanceof Action2Error) return;
      const modelItems = (modelSectionRead.returnedDomainElement as any).instances ?? [];
      expect(modelItems.some((row: any) => row.uuid === HISTORY_INSTANCE.uuid)).toBe(false);

      await controller!.close();
    },
    120000,
  );
});
