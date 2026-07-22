import { describe, expect, it } from "vitest";

import type {
  ApplicationEvolutionTrace,
  Entity,
  EntityDefinition,
  JzodObject,
  ModelActionAlterEntityAttribute,
  ModelActionCreateEntity,
  ModelActionDropEntity,
  ModelActionRenameEntity,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { applicationEvolutionTraceEvent } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { createTraceEventFromModelAction } from "../../src/2_domain/evolutionTraceWriter.js";

// ── Shared constants ────────────────────────────────────────────────────────
const APP_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ENTITY_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ENTITYDEF_UUID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ENTITY_PARENT_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITYDEF_PARENT_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e" as const;
const TIMESTAMP = "2024-01-02T00:00:00.000Z";

const mockTraceRoot: ApplicationEvolutionTrace = {
  uuid: "11111111-1111-4111-8111-111111111111",
  parentUuid: ENTITY_PARENT_UUID,
  applicationUuid: APP_UUID,
  branchName: "master",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockEntity: Entity = {
  uuid: ENTITY_UUID,
  parentUuid: ENTITY_PARENT_UUID,
  name: "TestEntity",
};

const mockEntityDefinition: EntityDefinition = {
  uuid: ENTITYDEF_UUID,
  parentUuid: ENTITYDEF_PARENT_UUID,
  name: "TestEntity",
  entityUuid: ENTITY_UUID,
  mlSchema: { type: "object", definition: {} } as JzodObject,
};

// ── Action fixtures ─────────────────────────────────────────────────────────
const createEntityAction: ModelActionCreateEntity = {
  actionType: "createEntity",
  endpoint: MODEL_ENDPOINT,
  payload: {
    application: APP_UUID,
    entities: [{ entity: mockEntity, entityDefinition: mockEntityDefinition }],
  },
};

const renameEntityAction: ModelActionRenameEntity = {
  actionType: "renameEntity",
  endpoint: MODEL_ENDPOINT,
  payload: {
    application: APP_UUID,
    entityUuid: ENTITY_UUID,
    entityDefinitionUuid: ENTITYDEF_UUID,
    targetValue: "NewEntityName",
  },
};

const dropEntityAction: ModelActionDropEntity = {
  actionType: "dropEntity",
  endpoint: MODEL_ENDPOINT,
  payload: {
    application: APP_UUID,
    entityUuid: ENTITY_UUID,
    entityDefinitionUuid: ENTITYDEF_UUID,
  },
};

const alterEntityAction: ModelActionAlterEntityAttribute = {
  actionType: "alterEntityAttribute",
  endpoint: MODEL_ENDPOINT,
  payload: {
    application: APP_UUID,
    entityName: "TestEntity",
    entityUuid: ENTITY_UUID,
    entityDefinitionUuid: ENTITYDEF_UUID,
  },
};

// ── Tests ───────────────────────────────────────────────────────────────────
describe("createTraceEventFromModelAction", () => {
  describe("createEntity", () => {
    it("returns operationType = createEntity", () => {
      const event = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      expect(event.operationType).toBe("createEntity");
    });

    it("returns targetEntityUuid matching first entity in payload", () => {
      const event = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      expect(event.targetEntityUuid).toBe(ENTITY_UUID);
    });

    it("returns traceRootUuid = trace root uuid", () => {
      const event = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      expect(event.traceRootUuid).toBe(mockTraceRoot.uuid);
    });

    it("returns compactionLevel = raw", () => {
      const event = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      expect(event.compactionLevel).toBe("raw");
    });

    it("returns applicationSection = model", () => {
      const event = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      expect(event.applicationSection).toBe("model");
    });

    it("passes Zod schema validation", () => {
      const event = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      const result = applicationEvolutionTraceEvent.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe("renameEntity", () => {
    it("returns operationType = renameEntity with correct targetEntityUuid", () => {
      const event = createTraceEventFromModelAction(renameEntityAction, mockTraceRoot, 2, TIMESTAMP);
      expect(event.operationType).toBe("renameEntity");
      expect(event.targetEntityUuid).toBe(ENTITY_UUID);
    });

    it("passes Zod schema validation", () => {
      const event = createTraceEventFromModelAction(renameEntityAction, mockTraceRoot, 2, TIMESTAMP);
      expect(applicationEvolutionTraceEvent.safeParse(event).success).toBe(true);
    });
  });

  describe("dropEntity", () => {
    it("returns operationType = dropEntity with correct targetEntityUuid", () => {
      const event = createTraceEventFromModelAction(dropEntityAction, mockTraceRoot, 3, TIMESTAMP);
      expect(event.operationType).toBe("dropEntity");
      expect(event.targetEntityUuid).toBe(ENTITY_UUID);
    });

    it("passes Zod schema validation", () => {
      const event = createTraceEventFromModelAction(dropEntityAction, mockTraceRoot, 3, TIMESTAMP);
      expect(applicationEvolutionTraceEvent.safeParse(event).success).toBe(true);
    });
  });

  describe("alterEntityAttribute", () => {
    it("returns operationType = alterEntityAttribute with correct targetEntityUuid", () => {
      const event = createTraceEventFromModelAction(alterEntityAction, mockTraceRoot, 4, TIMESTAMP);
      expect(event.operationType).toBe("alterEntityAttribute");
      expect(event.targetEntityUuid).toBe(ENTITY_UUID);
    });

    it("passes Zod schema validation", () => {
      const event = createTraceEventFromModelAction(alterEntityAction, mockTraceRoot, 4, TIMESTAMP);
      expect(applicationEvolutionTraceEvent.safeParse(event).success).toBe(true);
    });
  });

  describe("sequenceNumber", () => {
    it("preserves the provided sequenceNumber in the returned event", () => {
      expect(
        createTraceEventFromModelAction(dropEntityAction, mockTraceRoot, 1, TIMESTAMP).sequenceNumber,
      ).toBe(1);
      expect(
        createTraceEventFromModelAction(dropEntityAction, mockTraceRoot, 7, TIMESTAMP).sequenceNumber,
      ).toBe(7);
    });

    it("supports monotonically increasing sequence numbers when caller supplies them in order", () => {
      const e1 = createTraceEventFromModelAction(createEntityAction, mockTraceRoot, 1, TIMESTAMP);
      const e2 = createTraceEventFromModelAction(renameEntityAction, mockTraceRoot, 2, TIMESTAMP);
      const e3 = createTraceEventFromModelAction(dropEntityAction, mockTraceRoot, 3, TIMESTAMP);
      expect(e2.sequenceNumber).toBeGreaterThan(e1.sequenceNumber);
      expect(e3.sequenceNumber).toBeGreaterThan(e2.sequenceNumber);
    });
  });
});
