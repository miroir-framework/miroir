// #340 D7: the smells that graduated from the lens fail `npm run lint`, and stay warnings in the lens, so a whole-file
// review still lists the violations that eslint-suppressions.json counts (bulk suppressions count errors only).
// Run from the repository root: node --test eslint-rules/graduated-smells.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const lint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
const lens = new ESLint({ overrideConfigFile: "eslint-rules/smell-lens.config.mjs" });

const LIB = "packages/miroir-core/src/2_domain/sample.ts";
const VIEW = "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Sample.tsx";
// The hooks and components of the 4-tests folder are views, though the folder is a composition root.
const SESSION_HOOK = "packages/miroir-standalone-app/src/miroir-fwk/4-tests/useSample.ts";
const ENTRY = "packages/miroir-standalone-app/src/index.tsx";

const reports = async (eslint, filePath, code, ruleId) => {
  const [result] = await eslint.lintText(code, { filePath });
  assert.deepEqual(result.messages.filter((m) => m.fatal), [], `${filePath} does not parse`);
  return result.messages.filter((m) => m.ruleId === ruleId);
};

// An error in `npm run lint`, a warning in the lens. A rule of the miroir plugin is named after its smell, and its
// messages carry the smell id in brackets, as the smell runner reads it, so the lint output names the skill entry.
// (no-restricted-globals puts "Unexpected use of 'fetch'." before the custom message.)
const graduated = async (filePath, code, ruleId) => {
  const errors = await reports(lint, filePath, code, ruleId);
  assert.ok(errors.length > 0 && errors.every((m) => m.severity === 2), `${ruleId} is not an error: ${JSON.stringify(errors)}`);
  const warnings = await reports(lens, filePath, code, ruleId);
  assert.ok(warnings.length > 0 && warnings.every((m) => m.severity === 1), `${ruleId} is not a lens warning: ${JSON.stringify(warnings)}`);
  if (ruleId.startsWith("miroir/")) {
    const smell = ruleId.slice("miroir/".length);
    assert.ok(errors.every((m) => /\[([a-z][a-z-]+)\]/.exec(m.message)?.[1] === smell), `${ruleId} messages: ${JSON.stringify(errors)}`);
  }
};
const spared = async (filePath, code, ruleId) => {
  assert.deepEqual(await reports(lint, filePath, code, ruleId), []);
};

test("action-result: a throw, or an `as any` result, in a function that returns an action result", async () => {
  const types = `declare class Action2Error { constructor(t: string); }\ntype Action2VoidReturnType = Action2Error | { status: "ok" };\n`;
  await graduated(LIB, `${types}export async function open(): Promise<Action2VoidReturnType> { throw new Error("Method not implemented."); }\n`, "miroir/action-result");
  await graduated(LIB, `${types}export function f(r: unknown): Action2VoidReturnType { return r as any; }\n`, "miroir/action-result");
  await spared(LIB, `${types}export async function open(): Promise<Action2VoidReturnType> { return new Action2Error("NotImplemented"); }\n`, "miroir/action-result");
});

test("type-escape: a double cast through unknown or any", async () => {
  await graduated(LIB, `export const f = (x: number) => x as unknown as string;\n`, "miroir/type-escape");
  await graduated(LIB, `export const f = (x: number) => x as any as string;\n`, "miroir/type-escape");
  await spared(LIB, `export const f = (x: unknown) => x as string;\n`, "miroir/type-escape");
});

test("global-environment: process.env read outside a composition root", async () => {
  const read = `export const port = () => process.env.PORT;\n`;
  await graduated(LIB, read, "miroir/global-environment");
  await spared("packages/miroir-core/src/5_setup/sample.ts", read, "miroir/global-environment");
  await spared("packages/miroir-server/src/server.ts", read, "miroir/global-environment");
  await spared("packages/miroir-standalone-app/src/miroir-fwk/4-tests/sample.ts", read, "miroir/global-environment");
  await spared("packages/miroir-core/tests/sample.unit.test.ts", read, "miroir/global-environment");
});

test("pub-sub: a subscription in a component or hook", async () => {
  const subscribe = `declare const bus: { subscribe(f: () => void): () => void };\nexport const off = bus.subscribe(() => undefined);\n`;
  await graduated(VIEW, subscribe, "miroir/pub-sub");
  await graduated(SESSION_HOOK, subscribe, "miroir/pub-sub");
  await spared(LIB, subscribe, "miroir/pub-sub");
  await spared(
    VIEW,
    `import { useSyncExternalStore } from "react";\ndeclare const store: { subscribe(f: () => void): () => void; getSnapshot(): string };\nexport const useStatus = () => useSyncExternalStore(store.subscribe, store.getSnapshot);\n`,
    "miroir/pub-sub",
  );
});

test("component-io: fetch in a component or hook", async () => {
  const load = `export async function useLoad() { return fetch("/api/x"); }\n`;
  await graduated(VIEW, load, "miroir/component-io");
  await graduated(SESSION_HOOK, load, "miroir/component-io");
  await spared(LIB, load, "miroir/component-io");
  await spared(ENTRY, load, "miroir/component-io");
  await spared(VIEW, `export function useLoad(fetch: (u: string) => Promise<unknown>) { return fetch("/api/x"); }\n`, "miroir/component-io");
});
