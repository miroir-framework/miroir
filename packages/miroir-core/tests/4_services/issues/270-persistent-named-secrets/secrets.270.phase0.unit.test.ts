/**
 * #270 Slice 0 — characterize today's SecretStore / CLI / principal-drop / Admin inventory.
 * Not reachable as MiroirTest: no secrets ML concept yet.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  clearSecrets,
  parseServerArgs,
  registerSecrets,
  resolveSecret,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secrets.270" ||
  RUN_TEST.startsWith("secrets.270") ||
  RUN_TEST === "secrets.270.phase0";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const CORE_SRC = join(REPO_ROOT, "packages/miroir-core/src");
const ADMIN_MODEL_ENTITIES = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const EMULATED_ADMIN_MODEL_ENTITIES = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const ADMIN_MENU = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json",
);
const MCP_HANDLERS = join(
  REPO_ROOT,
  "packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts",
);

const MIROIR_SECRET_ENTITY_UUID = "a96856df-2b38-494a-8027-82617e2d64ad";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function listEntityJsonFiles(dir: string): string[] {
  return readdirSync(dir).filter((name) => name.endsWith(".json"));
}

function entityNamesInFolder(dir: string): string[] {
  return listEntityJsonFiles(dir).map((file) => {
    const entity = readJson(join(dir, file));
    return String(entity.name ?? "");
  });
}

afterEach(() => {
  clearSecrets();
});

if (runThis) {
  describe("secrets.270.phase0 consumed-by Slice 1", () => {
    it("real Admin entity folder has exactly 10 entities including MiroirSecret", () => {
      const files = listEntityJsonFiles(ADMIN_MODEL_ENTITIES);
      expect(files).toHaveLength(10);
      expect(entityNamesInFolder(ADMIN_MODEL_ENTITIES)).toContain("MiroirSecret");
      expect(existsSync(join(ADMIN_MODEL_ENTITIES, `${MIROIR_SECRET_ENTITY_UUID}.json`))).toBe(
        true,
      );
      expect(readJson(join(ADMIN_MODEL_ENTITIES, `${MIROIR_SECRET_ENTITY_UUID}.json`)).name).toBe(
        "MiroirSecret",
      );
    });

    it("emulated test-asset Admin entity folder has exactly 6 entities including MiroirSecret", () => {
      const files = listEntityJsonFiles(EMULATED_ADMIN_MODEL_ENTITIES);
      expect(files).toHaveLength(6);
      expect(entityNamesInFolder(EMULATED_ADMIN_MODEL_ENTITIES)).toContain("MiroirSecret");
      expect(
        existsSync(join(EMULATED_ADMIN_MODEL_ENTITIES, `${MIROIR_SECRET_ENTITY_UUID}.json`)),
      ).toBe(true);
    });

    it("parseServerArgs accepts --secrets-master-key", () => {
      const parsed = parseServerArgs(["--secrets-master-key", "W"]);
      expect(parsed.secretsMasterKey).toBe("W");
    });

    it("resolveSecret returns { value, scope, source } via registerSecrets hatch", () => {
      registerSecrets({ k: "v" });
      expect(resolveSecret("k")).toEqual({
        value: "v",
        scope: "process",
        source: "hatch",
      });
    });

    it("ParsedServerArgs exposes secretsMasterKey when the flag or env is set", () => {
      expect("secretsMasterKey" in parseServerArgs(["--secrets-master-key", "W"])).toBe(true);
      expect(
        "secretsMasterKey" in parseServerArgs([], { MIROIR_SECRETS_MASTER_KEY: "env-key" }),
      ).toBe(true);
    });
  });

  describe("secrets.270.phase0 consumed-by Slice 2", () => {
    it("restServerDefaultHandlers still has the 7 CRUD urls and no /secrets", () => {
      const restServerSrc = readFileSync(join(CORE_SRC, "4_services/RestServer.ts"), "utf8");
      const handlerBlock = restServerSrc.slice(
        restServerSrc.indexOf("export const restServerDefaultHandlers"),
      );
      const urls = [...handlerBlock.matchAll(/^\s*url:\s*"([^"]+)"/gm)].map((m) => m[1]);
      expect(urls).toEqual([
        "/CRUD/:deploymentUuid/:section/entity/:parentUuid/all",
        "/CRUD/:deploymentUuid/:section/entity",
        "/CRUD/:deploymentUuid/:section/entity",
        "/CRUD/:deploymentUuid/:section/entity",
        "/action/:actionType",
        "/queryTemplate",
        "/query",
      ]);
      expect(urls.some((url) => url.includes("/secrets"))).toBe(false);
    });

    it("dedicated /secrets handler exists outside restServerDefaultHandlers", () => {
      const secretsHttp = readFileSync(join(CORE_SRC, "4_services/SecretsHttp.ts"), "utf8");
      const stubSrc = readFileSync(join(CORE_SRC, "4_services/RestClientStub.ts"), "utf8");
      const serverSrc = readFileSync(
        join(REPO_ROOT, "packages/miroir-server/src/server.ts"),
        "utf8",
      );
      expect(secretsHttp).toContain("export async function handleSecretsHttpRoute");
      expect(secretsHttp).toContain("/secrets");
      expect(stubSrc).toContain("handleSecretsHttpRoute");
      expect(serverSrc).toContain('app.get("/secrets"');
      expect(serverSrc).toContain('app.post("/secrets"');
      expect(serverSrc).toContain('app.delete("/secrets"');
    });
  });

  describe("secrets.270.phase0 consumed-by Slice 3", () => {
    it("MCP success tool response wraps subObject with redactCredentialSecretsFromValue", () => {
      const src = readFileSync(MCP_HANDLERS, "utf8");
      const successBlock = src.slice(
        src.indexOf('if (result.status === "ok")'),
        src.indexOf("} else {", src.indexOf('if (result.status === "ok")')),
      );
      expect(successBlock).toMatch(/redactCredentialSecretsFromValue\(\s*subObject\s*\)/);
      expect(successBlock).toMatch(/parsed:\s*redactedSubObject/);
      expect(successBlock).toMatch(/JSON\.stringify\(\s*redactedSubObject,\s*null,\s*2\s*\)/);
    });

    it("MCP error context wraps subObject with redactCredentialSecretsFromValue", () => {
      const src = readFileSync(MCP_HANDLERS, "utf8");
      const errorStart = src.indexOf("// Error response");
      const errorBlock = src.slice(errorStart, src.indexOf("} catch (error)", errorStart));
      expect(errorBlock).toContain("context:");
      expect(errorBlock).toMatch(/redactCredentialSecretsFromValue\(\s*subObject\s*\)/);
      expect(errorBlock).toMatch(/parsed:\s*redactedSubObject/);
      expect(errorBlock).toMatch(/JSON\.stringify\(\s*redactedSubObject,\s*null,\s*2\s*\)/);
    });
  });

  describe("secrets.270.phase0 consumed-by Slice 4", () => {
    it("oauth2AuthorizationCodeCacheKey includes principal or process scope", () => {
      const src = readFileSync(join(CORE_SRC, "4_services/ExternalServiceClient.ts"), "utf8");
      const fnStart = src.indexOf("function oauth2AuthorizationCodeCacheKey");
      const fnBlock = src.slice(fnStart, fnStart + 450);
      expect(fnBlock).toContain("tokenUrl");
      expect(fnBlock).toContain("clientIdKey");
      expect(fnBlock).toContain("refreshTokenKey");
      expect(fnBlock).toContain("oauth2PrincipalCacheScope");
      const helperStart = src.indexOf("export function oauth2PrincipalCacheScope");
      const helperBlock = src.slice(helperStart, helperStart + 220);
      expect(helperBlock).toMatch(/miroirUserUuid\s*\?\?\s*"process"/);
    });

    it("queryActionHandler passes authPrincipal into handleBoxedExtractorOrQueryAction", () => {
      const src = readFileSync(join(CORE_SRC, "4_services/RestServer.ts"), "utf8");
      const fnStart = src.indexOf("export async function queryActionHandler");
      const fnEnd = src.indexOf("export async function queryTemplateActionHandler", fnStart);
      const fnBlock = src.slice(fnStart, fnEnd);
      expect(fnBlock).toContain("handleBoxedExtractorOrQueryAction(");
      expect(fnBlock).toContain("params.authPrincipal");
    });

    it("handleApplicationAction has a principal parameter", () => {
      const src = readFileSync(join(CORE_SRC, "3_controllers/DomainController.ts"), "utf8");
      const fnStart = src.indexOf("private async handleApplicationAction(");
      const fnBlock = src.slice(fnStart, fnStart + 450);
      expect(fnBlock).toMatch(/principal\s*\?:/);
    });

    it("handleAction forwards principal to handleApplicationAction and handleActionInternal", () => {
      const src = readFileSync(join(CORE_SRC, "3_controllers/DomainController.ts"), "utf8");
      const fnStart = src.indexOf("async handleAction(");
      const fnEnd = src.indexOf("private async handleApplicationAction(", fnStart);
      const fnBlock = src.slice(fnStart, fnEnd);
      expect(fnBlock).toContain("handleAction principal");
      const applicationCall = fnBlock.match(
        /return this\.handleApplicationAction\([\s\S]*?\);/,
      )?.[0];
      const internalCall = fnBlock.match(/return this\.handleActionInternal\([\s\S]*?\);/)?.[0];
      expect(applicationCall).toBeDefined();
      expect(internalCall).toBeDefined();
      expect(applicationCall!).toContain("principal");
      expect(internalCall!).toContain("principal");
    });
  });

  describe("secrets.270.phase0 survives", () => {
    it("Admin menu has 8 items with no Credentials or Secrets labels", () => {
      const menu = readJson(ADMIN_MENU);
      const definition = menu.definition as {
        definition?: Array<{ title?: string; items?: Array<{ label?: string }> }>;
      };
      const adminSection = definition.definition?.find((section) => section.title === "Admin");
      const items = adminSection?.items ?? [];
      expect(items).toHaveLength(8);
      const labels = items.map((item) => item.label ?? "");
      expect(labels.some((label) => /credentials/i.test(label))).toBe(false);
      expect(labels.some((label) => /secrets/i.test(label))).toBe(false);
    });

    it("parseServerArgs([--secret, a=b]).secrets equals { a: b }", () => {
      expect(parseServerArgs(["--secret", "a=b"]).secrets).toEqual({ a: "b" });
    });

    it("/queryTemplate remains in restServerDefaultHandlers", () => {
      const restServerSrc = readFileSync(join(CORE_SRC, "4_services/RestServer.ts"), "utf8");
      const handlerBlock = restServerSrc.slice(
        restServerSrc.indexOf("export const restServerDefaultHandlers"),
      );
      const urls = [...handlerBlock.matchAll(/^\s*url:\s*"([^"]+)"/gm)].map((m) => m[1]);
      expect(urls).toContain("/queryTemplate");
    });
  });
}
