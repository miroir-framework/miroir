import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * #217 Phase 12 — vocabulary rename gate (EntityDefinition → EntityVersion).
 * Rename-only: no present-model authority change. UI hub remains until a follow-up slice.
 */

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const ENTITY_ENTITY_VERSION_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json",
);

const ENTITY_VERSION_OF_ENTITY_VERSION_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  "bdd7ad43-f0fc-4716-90c1-87454c40dd95.json",
);

const AVCED_ENTITY_ASSET = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model",
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "8bec933d-6287-4de7-8a88-5c24216de9f4.json",
);

const FUNDAMENTAL_TYPE = join(
  REPO_ROOT,
  "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
);

const FUNDAMENTAL_SCHEMA_BUILDER = join(
  REPO_ROOT,
  "packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts",
);

const ENTITY_PRESENT_MODEL = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/entityPresentModel.ts",
);

const INDEX_TS = join(REPO_ROOT, "packages/miroir-core/src/index.ts");

const DEPLOYMENT_INDEX = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/index.ts",
);

const REPORT_ENTITY_VERSION_LIST = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  "f9aff35d-8636-4519-8361-c7648e0ddc68.json",
);

const REPORT_ENTITY_VERSION_DETAILS = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  "acd55b04-84df-427e-b219-cf0e01a6881b.json",
);

const MENU_MIROIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  "eaac459c-6c2b-475c-8ae4-c6c3032dae00.json",
);

describe("217 Phase 12 — EntityDefinition → EntityVersion vocabulary gate", () => {
  it("bootstrap Entity formerly EntityDefinition is named EntityVersion (UUID preserved)", () => {
    const asset = JSON.parse(readFileSync(ENTITY_ENTITY_VERSION_ASSET, "utf8"));
    expect(asset.uuid).toBe("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    expect(asset.name).toBe("EntityVersion");
    expect(asset.name).not.toBe("EntityDefinition");
  });

  it("self-describing EntityVersion instance uses parentName EntityVersion", () => {
    const asset = JSON.parse(readFileSync(ENTITY_VERSION_OF_ENTITY_VERSION_ASSET, "utf8"));
    expect(asset.uuid).toBe("bdd7ad43-f0fc-4716-90c1-87454c40dd95");
    expect(asset.parentUuid).toBe("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    expect(asset.parentName).toBe("EntityVersion");
    expect(asset.name).toBe("EntityVersion");
  });

  it("ApplicationVersionCrossEntityDefinition is renamed ApplicationVersionCrossEntityVersion", () => {
    const asset = JSON.parse(readFileSync(AVCED_ENTITY_ASSET, "utf8"));
    expect(asset.uuid).toBe("8bec933d-6287-4de7-8a88-5c24216de9f4");
    expect(asset.name).toBe("ApplicationVersionCrossEntityVersion");
  });

  it("fundamental schema builder registers entityVersion context key", () => {
    const src = readFileSync(FUNDAMENTAL_SCHEMA_BUILDER, "utf8");
    expect(src).toMatch(/\bentityVersion\s*:/);
    expect(src).toMatch(
      /entityVersion:\s*(entityVersionEntityVersionV1|entityDefinitionEntityDefinitionV1)\.mlSchema/,
    );
  });

  it("generated types export EntityVersion and deprecated EntityDefinition alias", () => {
    const generated = readFileSync(FUNDAMENTAL_TYPE, "utf8");
    expect(generated).toMatch(/export type EntityVersion\s*=/);
    const index = readFileSync(INDEX_TS, "utf8");
    // Public surface keeps EntityDefinition as deprecated alias for one release
    expect(index).toMatch(/EntityDefinition/);
    expect(index).toMatch(/EntityVersion/);
  });

  it("deployment package exports EntityVersion symbols with deprecated EntityDefinition aliases", () => {
    const src = readFileSync(DEPLOYMENT_INDEX, "utf8");
    expect(src).toMatch(/\bas entityEntityVersion\b/);
    expect(src).toMatch(/\bas entityEntityDefinition\b/); // deprecated alias
    expect(src).toMatch(/\bas entityVersionEntityVersion\b/);
    expect(src).toMatch(/\bas entityDefinitionEntityDefinition\b/); // deprecated alias
    expect(src).toMatch(/\bas entityApplicationVersionCrossEntityVersion\b/);
    expect(src).toMatch(/\bas entityApplicationVersionCrossEntityDefinition\b/); // deprecated alias
    expect(src).toMatch(/\bas reportEntityVersionList\b/);
    expect(src).toMatch(/\bas reportEntityDefinitionList\b/); // deprecated alias
  });

  it("non-bootstrap EntityVersion instance exports use entityVersion* with deprecated entityDefinition* aliases", () => {
    const miroir = readFileSync(DEPLOYMENT_INDEX, "utf8");
    for (const [primary, deprecated] of [
      ["entityVersionEntity", "entityDefinitionEntity"],
      ["entityVersionEndpoint", "entityDefinitionEndpoint"],
      ["entityVersionReport", "entityDefinitionReport"],
      ["entityVersionTheme", "entityDefinitionTheme"],
    ] as const) {
      expect(miroir).toMatch(new RegExp(`\\bas ${primary}\\b|export \\{ ${primary} \\}`));
      expect(miroir).toMatch(new RegExp(`@deprecated Use ${primary}`));
      expect(miroir).toMatch(new RegExp(`\\bas ${deprecated}\\b|as ${deprecated}\\b|export \\{[^}]*${deprecated}`));
    }

    const library = readFileSync(
      join(REPO_ROOT, "packages/miroir-test-app_deployment-library/index.ts"),
      "utf8",
    );
    expect(library).toMatch(/\bas entityVersionAuthor\b/);
    expect(library).toMatch(/@deprecated Use entityVersionAuthor/);
    expect(library).toMatch(/\bas entityDefinitionAuthor\b/);

    const admin = readFileSync(
      join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/index.ts"),
      "utf8",
    );
    expect(admin).toMatch(/\bas entityVersionDeployment\b/);
    expect(admin).toMatch(/@deprecated Use entityVersionDeployment/);
    expect(admin).toMatch(/\bas entityDefinitionDeployment\b/);
  });

  it("EntityVersion list/details reports use Entity Version display vocabulary", () => {
    const list = JSON.parse(readFileSync(REPORT_ENTITY_VERSION_LIST, "utf8"));
    expect(list.name).toBe("EntityVersionList");
    expect(list.defaultLabel).toMatch(/Entity Versions?/i);
    expect(list.definition.extractorTemplates.entityDefinitions.parentName).toBe("EntityVersion");
    expect(list.definition.section.definition.parentName).toBe("EntityVersion");
    expect(list.definition.section.definition.label).toMatch(/Entity Versions?/i);

    const details = JSON.parse(readFileSync(REPORT_ENTITY_VERSION_DETAILS, "utf8"));
    expect(details.name).toBe("EntityVersionDetails");
    expect(details.defaultLabel).toMatch(/Entity Version/i);
  });

  it("Miroir menu labels Entity Versions (not Entity Definitions)", () => {
    const menu = JSON.parse(readFileSync(MENU_MIROIR, "utf8"));
    const text = JSON.stringify(menu);
    expect(text).toMatch(/Entity Versions/);
    expect(text).not.toMatch(/Entity Definitions/);
  });

  it("MetaModel uses applicationVersionCrossEntityVersion with entityVersion FK", () => {
    const schemaBuilder = readFileSync(FUNDAMENTAL_SCHEMA_BUILDER, "utf8");
    expect(schemaBuilder).toMatch(/\bapplicationVersionCrossEntityVersion\s*:/);
    expect(schemaBuilder).toMatch(
      /applicationVersionCrossEntityVersion:[\s\S]*?\bentityVersion\s*:/,
    );
    // Old MetaModel collection key must not remain as the live schema key
    expect(schemaBuilder).not.toMatch(
      /^\s*applicationVersionCrossEntityDefinition\s*:/m,
    );

    const generated = readFileSync(FUNDAMENTAL_TYPE, "utf8");
    expect(generated).toMatch(/applicationVersionCrossEntityVersion:/);
    expect(generated).toMatch(
      /applicationVersionCrossEntityVersion:[\s\S]*?entityVersion:\s*string/,
    );
  });

  it("AVCED data instances store entityVersion (not entityDefinition) FK", () => {
    const sample = JSON.parse(
      readFileSync(
        join(
          REPO_ROOT,
          "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
          "8bec933d-6287-4de7-8a88-5c24216de9f4",
          "48644159-66d4-426d-b38d-d083fd455e7b.json",
        ),
        "utf8",
      ),
    );
    expect(sample.entityVersion).toBe("bdd7ad43-f0fc-4716-90c1-87454c40dd95");
    expect(sample.entityDefinition).toBeUndefined();
  });

  it("Action payloads use entityVersionUuid / entityVersion (not entityDefinition*)", () => {
    const endpoint = JSON.parse(
      readFileSync(
        join(
          REPO_ROOT,
          "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
          "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
          "7947ae40-eb34-4149-887b-15a9021e714e.json",
        ),
        "utf8",
      ),
    );
    const generated = readFileSync(FUNDAMENTAL_TYPE, "utf8");
    expect(generated).toContain("entityVersionUuid?: string | undefined");
    expect(generated).toMatch(/entityVersion\?: EntityVersion \| undefined/);
    expect(generated).not.toMatch(/entityDefinitionUuid\?:/);
    expect(generated).toMatch(
      /modelActionAlterEntityAttribute[\s\S]*entityVersionUuid:z\.string\(\)\.optional\(\)/,
    );

    const actions: any[] = [];
    const walk = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (node.actionParameters) actions.push(node.actionParameters);
      if (Array.isArray(node)) node.forEach(walk);
      else Object.values(node).forEach(walk);
    };
    walk(endpoint);
    for (const name of ["alterEntityAttribute", "renameEntity", "dropEntity"]) {
      const ap = actions.find((a) => a.actionType?.definition === name);
      expect(ap?.payload?.definition?.entityVersionUuid?.optional).toBe(true);
      expect(ap?.payload?.definition?.entityDefinitionUuid).toBeUndefined();
    }
    const create = actions.find((a) => a.actionType?.definition === "createEntity");
    expect(
      create?.payload?.definition?.entities?.definition?.definition?.entityVersion?.optional,
    ).toBe(true);
    expect(
      create?.payload?.definition?.entities?.definition?.definition?.entityDefinition,
    ).toBeUndefined();
  });

  it("UI hub presentEntityAsRedundantEntityDefinition remains (deferred off vocabulary slice)", () => {
    const hub = readFileSync(ENTITY_PRESENT_MODEL, "utf8");
    expect(hub).toContain("presentEntityAsRedundantEntityDefinition");
  });

  it("docs and AI prompts use EntityVersion display vocabulary", () => {
    const coreConcepts = readFileSync(
      join(REPO_ROOT, "docs/guides/core-concepts.md"),
      "utf8",
    );
    expect(coreConcepts).toMatch(/## Entity & EntityVersion/);
    expect(coreConcepts).toMatch(/authoritative present-model/i);
    expect(coreConcepts).not.toMatch(/## Entity & EntityDefinition/);

    const entityApi = readFileSync(
      join(REPO_ROOT, "docs/reference/api/entity.md"),
      "utf8",
    );
    expect(entityApi).toMatch(/Entity & EntityVersion API Reference/);
    expect(entityApi).toMatch(/interface EntityVersion/);

    const defining = readFileSync(
      join(REPO_ROOT, "docs/guides/developer/defining-entities.md"),
      "utf8",
    );
    expect(defining).toMatch(/\*\*EntityVersion\*\*/);
    expect(defining).not.toMatch(/\*\*EntityDefinition\*\*/);

    const agents = readFileSync(join(REPO_ROOT, "AGENTS.md"), "utf8");
    expect(agents).toMatch(/EntityVersion/);
    expect(agents).toMatch(/authoritative present-model/);

    const promptAi = readFileSync(
      join(REPO_ROOT, "packages/miroir-ai/src/prompts/miroirSystemPrompt.ts"),
      "utf8",
    );
    const promptUi = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/miroirSystemPrompt.ts",
      ),
      "utf8",
    );
    for (const prompt of [promptAi, promptUi]) {
      expect(prompt).toMatch(/### EntityVersion/);
      expect(prompt).toMatch(/authoritative present-model definition/);
      expect(prompt).toMatch(/AND the EntityVersion/);
      expect(prompt).not.toMatch(/AND the EntityDefinition/);
      expect(prompt).not.toMatch(/corresponding EntityDefinition that holds/);
    }
  });
});
