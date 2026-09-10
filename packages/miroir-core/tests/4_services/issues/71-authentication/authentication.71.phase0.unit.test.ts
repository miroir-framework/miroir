/**
 * #71 Slice 0 — characterize today's open API and unread auth stub.
 * Not reachable as MiroirTest: no auth ML concept yet.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "authentication.71" ||
  RUN_TEST.startsWith("authentication.71");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const CORE_SRC = join(REPO_ROOT, "packages/miroir-core/src");
const ADMIN_MODEL_ENTITIES = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const ADMIN_USER_DATA = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_data/d20d09e5-0685-4fc7-b9bd-fcfa3845127a",
);
const MIROIR_USER_ENTITY_UUID = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";
const CREDENTIAL_ENTITY_UUID = "6c3ab489-1a36-4981-b5d0-bb3e02cfceed";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const BOB_UUID = "95fa298f-79f8-428c-8980-3443d486c1d8";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "preprocessor-generated") continue;
      collectTsFiles(full, acc);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

if (runThis) {
  describe("authentication.71.phase0 current open API", () => {
    it("restServerDefaultHandlers is the seven CRUD/action/query routes and has no /auth path", () => {
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
      expect(urls.some((url) => url.includes("/auth"))).toBe(false);
    });

    it("handleAction accepts an optional principal as the last argument", () => {
      const iface = readFileSync(
        join(CORE_SRC, "0_interfaces/2_domain/DomainControllerInterface.ts"),
        "utf8",
      );
      const start = iface.indexOf("  handleAction(");
      const handleActionBlock = iface.slice(start, start + 450);
      expect(handleActionBlock).toContain("principal?: { miroirUserUuid: string; username: string }");
    });

    it("monoUserAutentification is declared and never read in miroir-core src", () => {
      const config = readFileSync(
        join(CORE_SRC, "0_interfaces/1_core/MiroirConfig.ts"),
        "utf8",
      );
      expect(config).toContain("monoUserAutentification: boolean");

      const readers: string[] = [];
      for (const file of collectTsFiles(CORE_SRC)) {
        if (file.endsWith("MiroirConfig.ts")) continue;
        const text = readFileSync(file, "utf8");
        if (text.includes("monoUserAutentification")) {
          readers.push(file);
        }
      }
      expect(readers).toEqual([]);
    });
  });

  describe("authentication.71.phase0 Admin users have no login secret", () => {
    it("MiroirUser mlSchema fields include name, username, status, description", () => {
      const entity = readJson(join(ADMIN_MODEL_ENTITIES, `${MIROIR_USER_ENTITY_UUID}.json`));
      const definition = (entity.mlSchema as { definition?: Record<string, unknown> } | undefined)
        ?.definition;
      expect(Object.keys(definition ?? {})).toEqual(["name", "username", "status", "description"]);
    });

    it("Alice and Bob seeds have usernames alice and bob", () => {
      const alice = readJson(join(ADMIN_USER_DATA, `${ALICE_UUID}.json`));
      const bob = readJson(join(ADMIN_USER_DATA, `${BOB_UUID}.json`));
      expect(alice.username).toBe("alice");
      expect(bob.username).toBe("bob");
    });

    it("MiroirUserCredential entity file exists", () => {
      expect(existsSync(join(ADMIN_MODEL_ENTITIES, `${CREDENTIAL_ENTITY_UUID}.json`))).toBe(true);
    });
  });
}
