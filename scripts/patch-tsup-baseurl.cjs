#!/usr/bin/env node
// Patch tsup 8.5.x so DTS builds do not inject deprecated baseUrl.
// Upstream: https://github.com/egoist/tsup/issues/1388
// Idempotent — safe to run on every install.
// Use .cjs because root package.json has "type": "module".

const fs = require("fs");
const path = require("path");

const ROLLUP = path.resolve(__dirname, "../node_modules/tsup/dist/rollup.js");
const OLD = 'baseUrl: compilerOptions.baseUrl || ".",';
const NEW = "...(compilerOptions.baseUrl ? { baseUrl: compilerOptions.baseUrl } : {}),";

if (!fs.existsSync(ROLLUP)) {
  console.log("patch-tsup-baseurl: tsup not installed, skipping");
  process.exit(0);
}

const text = fs.readFileSync(ROLLUP, "utf8");

if (text.includes(NEW) || text.includes("compilerOptions.baseUrl ?")) {
  console.log("patch-tsup-baseurl: already applied");
  process.exit(0);
}

if (!text.includes(OLD)) {
  console.log("patch-tsup-baseurl: unexpected tsup rollup.js (pattern missing); skip");
  process.exit(0);
}

fs.writeFileSync(ROLLUP, text.replace(OLD, NEW), "utf8");
console.log("patch-tsup-baseurl: patched node_modules/tsup/dist/rollup.js");
