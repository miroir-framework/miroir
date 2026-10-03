// Module customization hooks for the #409 module-load probe.
// Records every specifier the child process resolves, and resolves agent SDKs to offline stubs.
import { appendFileSync } from "node:fs";

let recordFile;
let stubs = {};

export async function initialize(data) {
  recordFile = data.recordFile;
  stubs = data.stubs ?? {};
}

export async function resolve(specifier, context, nextResolve) {
  appendFileSync(recordFile, `${specifier}\n`);
  const stubUrl = stubs[specifier];
  if (stubUrl) {
    return { url: stubUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
