import { describe, expect, it } from "vitest";
import type { ApplicationEvolutionTrace, ApplicationEvolutionTraceEvent } from "../../src/index.js";

// UUIDs chosen for the WP1 trace entities
const TRACE_ROOT_ENTITY_UUID = "de089f57-5fa5-4c0e-a43e-20f1a6df5a37";
const TRACE_EVENT_ENTITY_UUID = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";
const TRACE_ROOT_ENTITYDEF_UUID = "a8b9c0d1-2e3f-4a5b-6c7d-8e9f0a1b2c3d";
const TRACE_EVENT_ENTITYDEF_UUID = "b1c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e";

const ENTITY_PARENT_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITYDEF_PARENT_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const ENTITYDEF_VERSION_UUID = "bdd7ad43-f0fc-4716-90c1-87454c40dd95";

describe("ApplicationEvolutionTrace entity assets", () => {
  describe("Entity assets are importable from deployment package", () => {
    it("exports entityApplicationEvolutionTrace with correct uuid and shape", async () => {
      const { entityApplicationEvolutionTrace } = await import("miroir-test-app_deployment-miroir");
      const e = entityApplicationEvolutionTrace as any;
      expect(e.uuid).toBe(TRACE_ROOT_ENTITY_UUID);
      expect(e.name).toBe("ApplicationEvolutionTrace");
      expect(e.parentUuid).toBe(ENTITY_PARENT_UUID);
    });

    it("exports entityApplicationEvolutionTraceEvent with correct uuid and shape", async () => {
      const { entityApplicationEvolutionTraceEvent } = await import("miroir-test-app_deployment-miroir");
      const e = entityApplicationEvolutionTraceEvent as any;
      expect(e.uuid).toBe(TRACE_EVENT_ENTITY_UUID);
      expect(e.name).toBe("ApplicationEvolutionTraceEvent");
      expect(e.parentUuid).toBe(ENTITY_PARENT_UUID);
    });

    it("exports entityDefinitionApplicationEvolutionTrace with correct shape", async () => {
      const { entityDefinitionApplicationEvolutionTrace } = await import("miroir-test-app_deployment-miroir");
      const ed = entityDefinitionApplicationEvolutionTrace as any;
      expect(ed.uuid).toBe(TRACE_ROOT_ENTITYDEF_UUID);
      expect(ed.entityUuid).toBe(TRACE_ROOT_ENTITY_UUID);
      expect(ed.parentUuid).toBe(ENTITYDEF_PARENT_UUID);
      expect(ed.parentDefinitionVersionUuid).toBe(ENTITYDEF_VERSION_UUID);
      expect(ed.mlSchema).toBeDefined();
      expect(ed.mlSchema.type).toBe("object");
    });

    it("exports entityDefinitionApplicationEvolutionTraceEvent with correct shape", async () => {
      const { entityDefinitionApplicationEvolutionTraceEvent } = await import("miroir-test-app_deployment-miroir");
      const ed = entityDefinitionApplicationEvolutionTraceEvent as any;
      expect(ed.uuid).toBe(TRACE_EVENT_ENTITYDEF_UUID);
      expect(ed.entityUuid).toBe(TRACE_EVENT_ENTITY_UUID);
      expect(ed.parentUuid).toBe(ENTITYDEF_PARENT_UUID);
      expect(ed.parentDefinitionVersionUuid).toBe(ENTITYDEF_VERSION_UUID);
      expect(ed.mlSchema).toBeDefined();
      expect(ed.mlSchema.type).toBe("object");
    });
  });

  describe("defaultMiroirMetaModel includes the new entities", () => {
    it("defaultMiroirMetaModel.entities contains ApplicationEvolutionTrace", async () => {
      const { defaultMiroirMetaModel } = await import("miroir-test-app_deployment-miroir");
      const found = defaultMiroirMetaModel.entities.find((e: any) => e.uuid === TRACE_ROOT_ENTITY_UUID);
      expect(found).toBeDefined();
      expect(found!.name).toBe("ApplicationEvolutionTrace");
    });

    it("defaultMiroirMetaModel.entities contains ApplicationEvolutionTraceEvent", async () => {
      const { defaultMiroirMetaModel } = await import("miroir-test-app_deployment-miroir");
      const found = defaultMiroirMetaModel.entities.find((e: any) => e.uuid === TRACE_EVENT_ENTITY_UUID);
      expect(found).toBeDefined();
      expect(found!.name).toBe("ApplicationEvolutionTraceEvent");
    });

    it("defaultMiroirMetaModel.entityDefinitions contains entityDefinitionApplicationEvolutionTrace", async () => {
      const { defaultMiroirMetaModel } = await import("miroir-test-app_deployment-miroir");
      const found = defaultMiroirMetaModel.entityDefinitions.find((ed: any) => ed.uuid === TRACE_ROOT_ENTITYDEF_UUID);
      expect(found).toBeDefined();
      expect(found!.entityUuid).toBe(TRACE_ROOT_ENTITY_UUID);
    });

    it("defaultMiroirMetaModel.entityDefinitions contains entityDefinitionApplicationEvolutionTraceEvent", async () => {
      const { defaultMiroirMetaModel } = await import("miroir-test-app_deployment-miroir");
      const found = defaultMiroirMetaModel.entityDefinitions.find((ed: any) => ed.uuid === TRACE_EVENT_ENTITYDEF_UUID);
      expect(found).toBeDefined();
      expect(found!.entityUuid).toBe(TRACE_EVENT_ENTITY_UUID);
    });
  });

  describe("Generated TypeScript types exist in miroir-core", () => {
    it("ApplicationEvolutionTrace type is exported from miroir-core and has required fields", () => {
      const trace: ApplicationEvolutionTrace = {
        uuid: "de089f57-5fa5-4c0e-a43e-20f1a6df5a37",
        parentUuid: ENTITY_PARENT_UUID,
        applicationUuid: "some-app-uuid",
        branchName: "master",
        createdAt: new Date().toISOString(),
      };
      expect(trace.uuid).toBeDefined();
      expect(trace.applicationUuid).toBeDefined();
      expect(trace.branchName).toBe("master");
    });

    it("ApplicationEvolutionTraceEvent type is exported from miroir-core and has required fields", () => {
      const event: ApplicationEvolutionTraceEvent = {
        uuid: "b1c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
        parentUuid: ENTITYDEF_PARENT_UUID,
        traceRootUuid: "de089f57-5fa5-4c0e-a43e-20f1a6df5a37",
        sequenceNumber: 1,
        operationType: "squashedBaseline",
        applicationSection: "model",
        compactionLevel: "raw",
        timestamp: new Date().toISOString(),
      };
      expect(event.traceRootUuid).toBeDefined();
      expect(event.operationType).toBe("squashedBaseline");
      expect(event.compactionLevel).toBe("raw");
    });
  });
});
