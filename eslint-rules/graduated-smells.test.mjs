// #340 D7: the smells that graduated from the lens fail `npm run lint`, and stay warnings in the lens, so a whole-file
// review still lists the violations that eslint-suppressions.json counts (bulk suppressions count errors only).
// Run from the repository root: node --test eslint-rules/graduated-smells.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const lint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
const lens = new ESLint({ overrideConfigFile: "eslint-rules/smell-lens.config.mjs" });

const LIB = "packages/miroir-core/src/2_domain/sample.ts";

const reports = async (eslint, filePath, code, ruleId) => {
  const [result] = await eslint.lintText(code, { filePath });
  assert.deepEqual(result.messages.filter((m) => m.fatal), [], `${filePath} does not parse`);
  return result.messages.filter((m) => m.ruleId === ruleId);
};

// An error in `npm run lint`, a warning in the lens. A rule of the miroir plugin is named after its smell, and its
// messages start with the smell id, so the lint output names the skill entry to read.
const graduated = async (filePath, code, ruleId) => {
  const errors = await reports(lint, filePath, code, ruleId);
  assert.ok(errors.length > 0 && errors.every((m) => m.severity === 2), `${ruleId} is not an error: ${JSON.stringify(errors)}`);
  const warnings = await reports(lens, filePath, code, ruleId);
  assert.ok(warnings.length > 0 && warnings.every((m) => m.severity === 1), `${ruleId} is not a lens warning: ${JSON.stringify(warnings)}`);
  if (ruleId.startsWith("miroir/")) {
    const smell = ruleId.slice("miroir/".length);
    assert.ok(errors.every((m) => m.message.startsWith(`[${smell}] `)), `${ruleId} messages: ${JSON.stringify(errors)}`);
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
