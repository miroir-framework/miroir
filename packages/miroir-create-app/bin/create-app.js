#!/usr/bin/env node
// #658: `npm create @miroir-framework/app <dir>` writes a Miroir project into <dir>: a Vite client and a Node server
// on the filesystem store, configured by environments/local.json. No prompts. Every @miroir-framework/* dependency
// of the project is pinned to this package's own version (the published set is released in lockstep).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(PACKAGE_ROOT, "template");
const MIROIR_SCOPE = "@miroir-framework/";
// npm drops .gitignore files from tarballs: the template ships them under this name
const GITIGNORE_IN_TEMPLATE = "_gitignore";

/**
 * The npm package name of a project created in `directory`: its base name, lower case, npm-safe.
 * @param {string} directory
 */
export function projectName(directory) {
  return path
    .basename(path.resolve(directory))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+/, "");
}

/**
 * Writes the project into `directory`; returns the project's package.json. Throws on a non-empty directory.
 * @param {string} directory
 * @param {{ version?: string }} [options] the version pinned for @miroir-framework/* (default: this package's)
 */
export function createApp(directory, { version } = {}) {
  const target = path.resolve(directory);
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`${target} is not empty`);
  }
  const miroirVersion = version ?? JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf-8")).version;
  mkdirSync(target, { recursive: true });
  cpSync(TEMPLATE, target, { recursive: true });
  renameSync(path.join(target, GITIGNORE_IN_TEMPLATE), path.join(target, ".gitignore"));

  const manifestPath = path.join(target, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  manifest.name = projectName(target) || "miroir-app";
  for (const field of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (name.startsWith(MIROIR_SCOPE)) {
        manifest[field][name] = miroirVersion;
      }
    }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

/** @param {string[]} argv */
function main(argv) {
  const [directory] = argv;
  if (!directory) {
    console.error("usage: npm create @miroir-framework/app <directory>");
    return 1;
  }
  try {
    createApp(directory);
  } catch (error) {
    console.error(`create-app: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
  console.log(`Created a Miroir project in ${path.resolve(directory)}. Next:`);
  console.log(`  cd ${directory}`);
  console.log("  npm install");
  console.log("  npm run build");
  console.log("  npm start          # then open http://localhost:3080");
  return 0;
}

// run only as a program (npm create, npx, node bin/create-app.js: argv[1] may be a .bin symlink), not when imported
function invokedAsProgram() {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (invokedAsProgram()) {
  process.exitCode = main(process.argv.slice(2));
}
