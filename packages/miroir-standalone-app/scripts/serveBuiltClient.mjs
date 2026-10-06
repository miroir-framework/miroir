/**
 * Serving the production build to a browser, shared by the scripts that drive it: the coverage tour
 * (#326) and the self-test driver (#487).
 *
 * `startServer` copies dist/ into the server release and starts it as `npm run run:prod -w
 * miroir-server` does, with authentication off and listening on 127.0.0.1 only, on the selected
 * environment (MIROIR_ENV, as for `npm run miroir-env -- show`). `launchBrowser` opens Chromium
 * through playwright-core.
 */
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import https from "node:https";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium } from "playwright-core";

export const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const root = path.resolve(packageDir, "../..");
export const distDir = path.join(packageDir, "dist");
const serverDir = path.join(root, "packages/miroir-server");

/** A script that cannot run: its message says what to do. The script exits 2. */
export class ScriptError extends Error {}

/** @returns {never} */
export function fail(message) {
  throw new ScriptError(message);
}

/** Fails unless the production build exists. */
export function requireProductionBuild(app) {
  if (!existsSync(path.join(distDir, "index.html"))) {
    fail(`no production build in ${path.relative(process.cwd(), distDir)}: run npm run build -w ${app}`);
  }
}

export async function launchBrowser(executablePath, headed) {
  const launchOptions = {
    headless: !headed,
    // Chromium refuses to start as root with its sandbox (containers, CI); containers often have a
    // small /dev/shm, where a long page run crashes the renderer.
    args: [...(process.getuid?.() === 0 ? ["--no-sandbox"] : []), "--disable-dev-shm-usage"],
  };
  if (executablePath) {
    return chromium.launch({ ...launchOptions, executablePath });
  }
  try {
    return await chromium.launch(launchOptions);
  } catch {
    try {
      return await chromium.launch({ ...launchOptions, channel: "chrome" });
    } catch {
      fail(
        "no browser found: pass --browser <chromium or chrome executable> (or MIROIR_TOUR_BROWSER), " +
          "or install the one playwright-core expects with: npx playwright-core install chromium",
      );
    }
  }
}

/**
 * Starts the server release on the production build, with authentication off and listening on
 * 127.0.0.1 only; returns the function that stops it.
 * @param {{ url: string, name: string }} options `name` names the temporary directory
 * @returns {Promise<() => void>}
 */
export async function startServer({ url, name }) {
  const entry = path.join(serverDir, "release/index.js");
  if (!existsSync(entry)) {
    fail("no server release: run npm run build:release -w miroir-server");
  }
  if (await answers(url)) {
    fail(`a server already answers at ${url}: stop it, or run without --serve to use it`);
  }
  cpSync(distDir, path.join(serverDir, "release/client"), { recursive: true });
  const work = mkdtempSync(path.join(tmpdir(), `miroir-${name}-`));
  const repoCerts = ["localhost.pem", "localhost-key.pem"].every((file) => existsSync(path.join(root, "certs", file)));
  const certsDir = repoCerts ? path.join(root, "certs") : selfSignedCertificate(work);
  const log = path.join(work, "server.log");
  const logFd = openSync(log, "w");
  // Authentication is off, so the server listens on 127.0.0.1 only (scripts/loopback-only.mjs).
  const loopbackOnly = path.join(packageDir, "scripts/loopback-only.mjs");
  const server = spawn(process.execPath, ["--import", pathToFileURL(loopbackOnly).href, "release/index.js", "--certsdir", certsDir, "--disable-auth"], {
    cwd: serverDir,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", logFd, logFd],
  });
  let exited = false;
  server.on("exit", () => (exited = true));
  const stop = () => {
    server.kill();
    rmSync(work, { recursive: true, force: true });
  };
  for (const start = Date.now(); !(await answers(url)); ) {
    if (exited || Date.now() - start > 120_000) {
      const tail = readFileSync(log, "utf-8").split("\n").slice(-20).join("\n");
      stop();
      fail(`the server did not start at ${url}; end of its log:\n${tail}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log(`  server started at ${url} (production mode, authentication off, 127.0.0.1 only)`);
  return stop;
}

/** @returns {string} a directory holding a one-day self-signed certificate for localhost */
function selfSignedCertificate(work) {
  const dir = path.join(work, "certs");
  mkdirSync(dir);
  execFileSync(
    "openssl",
    ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=localhost",
      "-addext", "subjectAltName=DNS:localhost", "-keyout", path.join(dir, "localhost-key.pem"), "-out", path.join(dir, "localhost.pem")],
    { stdio: "ignore" },
  );
  return dir;
}

/** @returns {Promise<boolean>} whether anything answers HTTPS at `url` */
function answers(url) {
  return new Promise((resolve) => {
    const request = https.get(url, { rejectUnauthorized: false, timeout: 5000 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}
