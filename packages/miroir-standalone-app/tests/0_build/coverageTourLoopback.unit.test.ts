/**
 * scripts/loopback-only.mjs (#326): the coverage tour preloads it into the server it starts with
 * authentication off, so that server listens on 127.0.0.1 only.
 *
 * Not reachable through MiroirTest: it tests the build tooling. Runs real Node processes with the
 * preload and asks their servers where they listen.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const preload = resolve(dirname(fileURLToPath(import.meta.url)), "../../scripts/loopback-only.mjs");

/** @returns the address each `listen(...)` call of `calls` (JS source of argument lists) ends up on */
function listenAddresses(calls: string[]): unknown[] {
  const script = `
    const http = require("node:http");
    const listens = [${calls.map((call) => `(done) => { const server = http.createServer(); server.listen(${call}); server.on("listening", () => { done(server.address()); server.close(); }); }`).join(",")}];
    Promise.all(listens.map((listen) => new Promise(listen))).then((addresses) => console.log(JSON.stringify(addresses)));
  `;
  return JSON.parse(execFileSync(process.execPath, ["--import", preload, "-e", script], { encoding: "utf-8" }));
}

describe("loopback-only preload", () => {
  it("binds every TCP listener to 127.0.0.1, whatever host the caller asks for", () => {
    const addresses = listenAddresses([
      "0, () => {}",
      "0",
      "",
      "'0'",
      "0, '0.0.0.0', 511, () => {}",
      "{ port: 0 }",
      "{ port: 0, host: '::' }, () => {}",
    ]);
    expect(addresses.map((address: any) => address.address)).toEqual(Array(7).fill("127.0.0.1"));
  });

  it("calls the listen callback", () => {
    const script = `require("node:http").createServer().listen(0, function () { console.log("called"); this.close(); });`;
    expect(execFileSync(process.execPath, ["--import", preload, "-e", script], { encoding: "utf-8" }).trim()).toBe("called");
  });

  it("leaves a Unix socket alone", () => {
    const work = mkdtempSync(join(tmpdir(), "loopback-only-test-"));
    try {
      const socket = join(work, "server.sock");
      expect(listenAddresses([JSON.stringify(socket)])).toEqual([socket]);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });
});
