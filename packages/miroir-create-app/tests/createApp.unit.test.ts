// #658 (D6): `create-app <dir>` writes the project of analysis §6.1. vitest, not MiroirTest: the file output of a
// Node program. The bin runs as a child process, as `npm create` runs it.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN = path.join(PACKAGE_ROOT, "bin/create-app.js");
const OWN_VERSION: string = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf-8")).version;

function createApp(...args: string[]) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: "utf-8" });
}

function emptyParent(): string {
  return mkdtempSync(path.join(tmpdir(), "miroir-create-app-"));
}

describe("create-app", () => {
  it("names the project after its folder and pins every Miroir package to its own version", () => {
    const target = path.join(emptyParent(), "My Library");
    expect(createApp(target).status).toBe(0);
    const manifest = JSON.parse(readFileSync(path.join(target, "package.json"), "utf-8"));
    expect(manifest.name).toBe("my-library");
    const miroir = Object.entries({ ...manifest.dependencies, ...manifest.devDependencies }).filter(([name]) =>
      name.startsWith("@miroir-framework/"),
    );
    expect(miroir.map(([name]) => name).sort()).toEqual([
      "@miroir-framework/core",
      "@miroir-framework/env",
      "@miroir-framework/react",
      "@miroir-framework/server",
      "@miroir-framework/store-filesystem",
    ]);
    expect(new Set(miroir.map(([, version]) => version))).toEqual(new Set([OWN_VERSION]));
  });

  it("writes the client, the server, the environment and a .gitignore", () => {
    const target = path.join(emptyParent(), "app");
    expect(createApp(target).status).toBe(0);
    for (const file of [".gitignore", "environments/local.json", "src/server/server.ts", "src/client/index.tsx", "vite.config.ts"]) {
      expect(existsSync(path.join(target, file)), file).toBe(true);
    }
    expect(existsSync(path.join(target, "_gitignore"))).toBe(false);
    expect(readFileSync(path.join(target, ".gitignore"), "utf-8")).toContain(".miroir/");
  });

  it("writes into an existing empty folder", () => {
    const target = emptyParent();
    expect(createApp(target).status).toBe(0);
    expect(existsSync(path.join(target, "package.json"))).toBe(true);
  });

  it("refuses a folder that is not empty, and writes nothing", () => {
    const target = emptyParent();
    writeFileSync(path.join(target, "notes.txt"), "mine");
    const result = createApp(target);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not empty");
    expect(readdirSync(target)).toEqual(["notes.txt"]);
  });

  it("asks for a folder when none is given", () => {
    const result = createApp();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("usage: npm create @miroir-framework/app <directory>");
  });
});
