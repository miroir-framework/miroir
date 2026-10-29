/**
 * Serving the production build to a browser, shared by the scripts that drive it: the coverage tour
 * (#326) and the self-test driver (#487).
 *
 * `startServer` copies dist/ into the server release and starts it as `npm run run:prod -w
 * miroir-server` does, with authentication off and listening on 127.0.0.1 only, on the selected
 * environment (MIROIR_ENV, as for `npm run miroir-env -- show`). With `devClient` (#583), it starts
 * the server for its API only and the Vite dev server in front of it, as `npm run dev` does.
 * `launchBrowser` opens Chromium through playwright-core.
 */
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
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
 * 127.0.0.1 only; returns the function that stops it, which resolves once the server exited.
 *
 * With `devClient`, the server runs in development mode (it serves its API, not the client: no
 * production build needed) and the Vite dev server serves the client at `devClient.url`, over HTTPS
 * with the server's certificate, so the client calls the server over HTTPS.
 * @param {{ url: string, name: string, devClient?: { url: string } }} options `url` is the server's,
 *   `name` names the temporary directory
 * @returns {Promise<() => Promise<void>>}
 */
export async function startServer({ url, name, devClient }) {
  const entry = path.join(serverDir, "release/index.js");
  if (!existsSync(entry)) {
    fail("no server release: run npm run build:release -w miroir-server");
  }
  for (const used of [url, devClient?.url].filter(Boolean)) {
    if (await answers(used)) {
      fail(`a server already answers at ${used}: stop it, or run without --serve to use it`);
    }
  }
  if (!devClient) {
    cpSync(distDir, path.join(serverDir, "release/client"), { recursive: true });
  }
  const work = mkdtempSync(path.join(tmpdir(), `miroir-${name}-`));
  const repoCerts = ["localhost.pem", "localhost-key.pem"].every((file) => existsSync(path.join(root, "certs", file)));
  const certsDir = repoCerts ? path.join(root, "certs") : selfSignedCertificate(work);
  // Authentication is off, so the server listens on 127.0.0.1 only (scripts/loopback-only.mjs).
  const loopbackOnly = path.join(packageDir, "scripts/loopback-only.mjs");
  const children = [];
  const stop = async () => {
    // the dev server first: it proxies to the server
    for (const child of children.reverse()) {
      await child.stop();
    }
    rmSync(work, { recursive: true, force: true });
  };
  const server = startProcess({
    args: ["--import", pathToFileURL(loopbackOnly).href, "release/index.js", "--certsdir", certsDir, "--disable-auth"],
    cwd: serverDir,
    // development: the server does not look for a client of its own (miroir-server/src/server.ts)
    env: { ...process.env, NODE_ENV: devClient ? "development" : "production" },
    log: path.join(work, "server.log"),
  });
  children.push(server);
  await waitUntilAnswers(url, server, stop, "the server");
  console.log(
    `  server started at ${url} (${devClient ? "development mode, API only" : "production mode"}, authentication off, 127.0.0.1 only)`,
  );
  if (devClient) {
    const vite = startProcess({
      // as the package's build script runs Vite; without --host, Vite listens on localhost only
      args: [
        "--max-old-space-size=8192",
        path.join(root, "node_modules/vite/bin/vite.js"),
        "--port",
        new URL(devClient.url).port,
        "--strictPort",
      ],
      cwd: packageDir,
      env: viteDevEnv(certsDir),
      log: path.join(work, "vite.log"),
    });
    children.push(vite);
    await waitUntilAnswers(devClient.url, vite, stop, "the Vite dev server");
    console.log(`  Vite dev server started at ${devClient.url}`);
  }
  return stop;
}

/**
 * The environment of the Vite dev server: the caller's, without what a test run sets (VITE_TEST_MODE
 * would reach the client through import.meta.env and turn the load timing measurement off), with
 * the server's certificate.
 */
function viteDevEnv(certsDir) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith("VITE_") && key !== "MIROIR_TEST_PROFILE" && key !== "MIROIR_TEST_STORAGE",
    ),
  );
  return {
    ...env,
    NODE_ENV: "development",
    MIROIR_TLS_CERT: path.join(certsDir, "localhost.pem"),
    MIROIR_TLS_KEY: path.join(certsDir, "localhost-key.pem"),
  };
}

/** Starts `node <args>`, its output in `log`; `stop` resolves once the process exited. */
function startProcess({ args, cwd, env, log }) {
  const logFd = openSync(log, "w");
  const child = spawn(process.execPath, args, { cwd, env, stdio: ["ignore", logFd, logFd] });
  const exited = new Promise((resolve) => child.on("exit", resolve));
  let hasExited = false;
  exited.then(() => (hasExited = true));
  return {
    log,
    hasExited: () => hasExited,
    stop: async () => {
      if (!hasExited) {
        child.kill();
        await exited;
      }
    },
  };
}

/** Waits until `url` answers; on a failure, stops everything and fails with the end of the log. */
async function waitUntilAnswers(url, child, stop, what) {
  for (const start = Date.now(); !(await answers(url)); ) {
    if (child.hasExited() || Date.now() - start > 120_000) {
      const tail = readFileSync(child.log, "utf-8").split("\n").slice(-20).join("\n");
      await stop();
      fail(`${what} did not start at ${url}; end of its log:\n${tail}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
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

/** @returns {Promise<boolean>} whether anything answers at `url` (http or https) */
function answers(url) {
  const client = url.startsWith("https:") ? https : http;
  return new Promise((resolve) => {
    const request = client.get(url, { rejectUnauthorized: false, timeout: 5000 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}
