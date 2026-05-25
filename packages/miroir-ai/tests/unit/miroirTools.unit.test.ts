// Unit tests for miroirTools.ts
// Tests that each tool's handler:
// 1. Generates structurally valid Miroir JSON
// 2. Sets the correct parentUuid/parentName
// 3. Generates UUIDs for new instances
// 4. Handles optional vs required fields correctly

import { describe, it, expect } from "vitest";
import {
  generateMiroirEntityTool,
  generateMiroirQueryTool,
  generateMiroirTransformerTool,
  generateMiroirReportTool,
  getMiroirContextTool,
  miroirTools,
} from "../../src/tools/miroirTools.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Known Miroir meta-entity UUIDs
const ENTITY_PARENT_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_DEF_PARENT_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const REPORT_PARENT_UUID = "952d2c65-4da2-45c2-9394-a0920ceedfb6";
const TRANSFORMER_PARENT_UUID = "54a16d69-c1f0-4dd7-aba4-a2cda883586c";

const TEST_DEPLOYMENT_UUID = "aaaaaaaa-0000-0000-0000-000000000001";
const TEST_ENTITY_UUID = "bbbbbbbb-0000-0000-0000-000000000002";

// ──────────────────────────────────────────────────────────────────────────────
describe("miroirTools — registry", () => {
  it("exports exactly 5 tools", () => {
    expect(miroirTools).toHaveLength(5);
  });

  it("all tools have required fields: name, description, handler", () => {
    for (const tool of miroirTools) {
      expect(tool.name, `tool ${tool.name} missing name`).toBeTruthy();
      expect(tool.description, `tool ${tool.name} missing description`).toBeTruthy();
      expect(typeof tool.handler, `tool ${tool.name} handler not function`).toBe("function");
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("generateMiroirEntity tool", () => {
  const callHandler = (args: Record<string, unknown>) =>
    (generateMiroirEntityTool.handler as Function)(args);

  it("returns an entity record with correct parentUuid and parentName", async () => {
    const result = await callHandler({
      entityName: "Product",
      description: "A product",
      attributes: [],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.entity.parentName).toBe("Entity");
    expect(result.entity.parentUuid).toBe(ENTITY_PARENT_UUID);
    expect(result.entity.name).toBe("Product");
    expect(result.entity.conceptLevel).toBe("Model");
  });

  it("returns an entityDefinition with correct parentUuid, parentName, and entityUuid", async () => {
    const result = await callHandler({
      entityName: "Product",
      description: "A product",
      attributes: [],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.entityDefinition.parentName).toBe("EntityDefinition");
    expect(result.entityDefinition.parentUuid).toBe(ENTITY_DEF_PARENT_UUID);
    expect(result.entityDefinition.entityUuid).toBe(result.entity.uuid);
    expect(UUID_REGEX.test(result.entityDefinition.entityUuid)).toBe(true);
  });

  it("generates distinct UUIDs for entity and entityDefinition", async () => {
    const result = await callHandler({
      entityName: "Order",
      attributes: [],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(UUID_REGEX.test(result.entity.uuid)).toBe(true);
    expect(UUID_REGEX.test(result.entityDefinition.uuid)).toBe(true);
    expect(result.entity.uuid).not.toBe(result.entityDefinition.uuid);
  });

  it("always includes a 'name' field in mlSchema (field id=5)", async () => {
    const result = await callHandler({
      entityName: "Category",
      attributes: [],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const schemaDef = result.entityDefinition.mlSchema.definition;
    expect(schemaDef).toHaveProperty("name");
    expect(schemaDef.name.tag.value.id).toBe(5);
  });

  it("maps provided attributes to mlSchema fields with sequential ids starting at 6", async () => {
    const result = await callHandler({
      entityName: "Book",
      attributes: [
        { name: "title", type: "string", required: true, description: "Book title" },
        { name: "year", type: "number", required: false },
      ],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const schemaDef = result.entityDefinition.mlSchema.definition;
    expect(schemaDef).toHaveProperty("title");
    expect(schemaDef).toHaveProperty("year");
    expect(schemaDef.title.tag.value.id).toBe(6);
    expect(schemaDef.year.tag.value.id).toBe(7);
    expect(schemaDef.year.optional).toBe(true);
    expect(schemaDef.title.optional).toBeUndefined();
  });

  it("maps enum attributes to jzod enum type", async () => {
    const result = await callHandler({
      entityName: "Status",
      attributes: [
        { name: "status", type: "enum", required: true, enumValues: ["active", "inactive"] },
      ],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const schemaDef = result.entityDefinition.mlSchema.definition;
    expect(schemaDef.status.type).toBe("enum");
    expect(schemaDef.status.definition).toEqual(["active", "inactive"]);
  });

  it("mlSchema extends entityDefinitionRoot via schemaReference", async () => {
    const result = await callHandler({
      entityName: "Widget",
      attributes: [],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const extend = result.entityDefinition.mlSchema.extend;
    expect(extend.type).toBe("schemaReference");
    expect(extend.definition.absolutePath).toBe("fe9b7d99-f216-44de-bb6e-60e1a1ebb739");
    expect(extend.definition.relativePath).toBe("entityDefinitionRoot");
    expect(extend.definition.eager).toBe(true);
  });

  it("includes deploymentUuid in the result", async () => {
    const result = await callHandler({
      entityName: "Foo",
      attributes: [],
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.deploymentUuid).toBe(TEST_DEPLOYMENT_UUID);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("generateMiroirQuery tool", () => {
  const callHandler = (args: Record<string, unknown>) =>
    (generateMiroirQueryTool.handler as Function)(args);

  it("returns a query with correct parentName", async () => {
    const result = await callHandler({
      queryName: "getAllBooks",
      entityName: "Book",
      entityUuid: TEST_ENTITY_UUID,
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.query.parentName).toBe("QueryTemplate");
    expect(result.query.name).toBe("getAllBooks");
    expect(UUID_REGEX.test(result.query.uuid)).toBe(true);
  });

  it("query definition references the given entityUuid and entityName", async () => {
    const result = await callHandler({
      queryName: "getAllBooks",
      entityName: "Book",
      entityUuid: TEST_ENTITY_UUID,
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const extractor = result.query.definition.extractors["getAllBooks"];
    expect(extractor.parentUuid).toBe(TEST_ENTITY_UUID);
    expect(extractor.parentName).toBe("Book");
    expect(extractor.extractorOrCombinerType).toBe("extractorForObjectByDirectReference");
  });

  it("query definition has correct queryType", async () => {
    const result = await callHandler({
      queryName: "getAll",
      entityName: "X",
      entityUuid: TEST_ENTITY_UUID,
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.query.definition.queryType).toBe("boxedQueryWithExtractorCombinerTransformer");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("generateMiroirTransformer tool", () => {
  const callHandler = (args: Record<string, unknown>) =>
    (generateMiroirTransformerTool.handler as Function)(args);

  it("returns a transformer with correct parentUuid and name", async () => {
    const result = await callHandler({
      transformerName: "filterActiveItems",
      description: "Filters items where active === true",
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.transformer.parentUuid).toBe(TRANSFORMER_PARENT_UUID);
    expect(result.transformer.parentName).toBe("Transformer");
    expect(result.transformer.name).toBe("filterActiveItems");
    expect(UUID_REGEX.test(result.transformer.uuid)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("generateMiroirReport tool", () => {
  const callHandler = (args: Record<string, unknown>) =>
    (generateMiroirReportTool.handler as Function)(args);

  it("returns a report with correct parentUuid", async () => {
    const result = await callHandler({
      reportName: "BookList",
      entityName: "Book",
      entityUuid: TEST_ENTITY_UUID,
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.report.parentUuid).toBe(REPORT_PARENT_UUID);
    expect(result.report.parentName).toBe("Report");
    expect(result.report.name).toBe("BookList");
    expect(UUID_REGEX.test(result.report.uuid)).toBe(true);
  });

  it("report fetchQuery references the entity", async () => {
    const result = await callHandler({
      reportName: "BookList",
      entityName: "Book",
      entityUuid: TEST_ENTITY_UUID,
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const extractors = result.report.definition.fetchQuery.extractors;
    const key = Object.keys(extractors)[0];
    expect(extractors[key].parentUuid).toBe(TEST_ENTITY_UUID);
    expect(extractors[key].parentName).toBe("Book");
  });

  it("report section references the fetchQuery extractor key", async () => {
    const result = await callHandler({
      reportName: "AuthorList",
      entityName: "Author",
      entityUuid: TEST_ENTITY_UUID,
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    const extractorKey = Object.keys(result.report.definition.fetchQuery.extractors)[0];
    expect(result.report.definition.section.definition.fetchedDataReference).toBe(extractorKey);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe("getMiroirContext tool", () => {
  const callHandler = (args: Record<string, unknown>) =>
    (getMiroirContextTool.handler as Function)(args);

  it("returns the requested deploymentUuid and elementType", async () => {
    const result = await callHandler({
      deploymentUuid: TEST_DEPLOYMENT_UUID,
      elementType: "entity",
    });
    expect(result.deploymentUuid).toBe(TEST_DEPLOYMENT_UUID);
    expect(result.requestedType).toBe("entity");
  });

  it("defaults requestedType to 'all' when not specified", async () => {
    const result = await callHandler({
      deploymentUuid: TEST_DEPLOYMENT_UUID,
    });
    expect(result.requestedType).toBe("all");
  });
});
