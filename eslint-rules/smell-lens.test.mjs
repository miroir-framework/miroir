// #340: each detector of the smell lens (smell-lens.config.mjs) flags its pattern, and leaves the sanctioned form alone.
// Run from the repository root: node --test eslint-rules/smell-lens.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint({ overrideConfigFile: "eslint-rules/smell-lens.config.mjs" });

const smellsIn = async (filePath, code) => {
  const [result] = await eslint.lintText(code, { filePath });
  const fatal = result.messages.filter((m) => m.fatal);
  assert.deepEqual(fatal, [], `${filePath} does not parse`);
  // Custom messages carry the smell id in brackets; other rules are named by their rule id.
  return result.messages.map((m) =>
    m.ruleId?.startsWith("no-restricted-") ? (/\[([a-z][a-z-]+)\]/.exec(m.message)?.[1] ?? m.ruleId) : m.ruleId,
  );
};

const LIB = "packages/miroir-core/src/2_domain/sample.ts";
const VIEW = "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Sample.tsx";
const THEME_VIEW = "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/Sample.tsx";
const ROOT = "packages/miroir-cli/src/startup/setup.ts";
const TEST = "packages/miroir-core/tests/sample.unit.test.ts";

const flags = async (filePath, code, id) => {
  const found = await smellsIn(filePath, code);
  assert.ok(found.includes(id), `${id} not found in ${JSON.stringify(found)}`);
};
const spares = async (filePath, code, id) => {
  const found = await smellsIn(filePath, code);
  assert.ok(!found.includes(id), `${id} found in ${JSON.stringify(found)}`);
};

test("swallowed-error: a catch that only logs, an empty .catch", async () => {
  await flags(LIB, `export function f(g: () => void, log: Console) { try { g(); } catch (e) { log.warn(e); } return 1; }\n`, "swallowed-error");
  await flags(LIB, `export const p = Promise.resolve().catch(() => {});\n`, "swallowed-error");
  await spares(LIB, `export function f(g: () => void) { try { g(); } catch (e) { throw new Error("g failed", { cause: e }); } }\n`, "swallowed-error");
  await spares(LIB, `export function f(g: () => void, setError: (e: unknown) => void) { try { g(); } catch (e) { setError(e); } }\n`, "swallowed-error");
});

test("action-result: throw or `as any` in a function that returns an action result", async () => {
  const types = `declare class Action2Error { constructor(t: string); }\ntype Action2VoidReturnType = Action2Error | { status: "ok" };\n`;
  await flags(LIB, `${types}export async function open(): Promise<Action2VoidReturnType> { throw new Error("Method not implemented."); }\n`, "action-result");
  await flags(LIB, `${types}export function f(r: unknown): Action2VoidReturnType { return r as any; }\n`, "action-result");
  await spares(LIB, `${types}export async function open(): Promise<Action2VoidReturnType> { return new Action2Error("NotImplemented"); }\n`, "action-result");
  await spares(LIB, `export function parse(s: string): number { throw new Error(s); }\n`, "action-result");
});

test("precedence trap: ?? mixed with a comparison", async () => {
  await flags(LIB, `export const f = (a?: string, b?: string) => (a ?? "build" == b);\n`, "no-mixed-operators");
  await spares(LIB, `export const f = (a?: string, b?: string) => (a ?? "build") == b;\n`, "no-mixed-operators");
});

test("module-state: module-level let, collections, static singletons, ForTests resets", async () => {
  await flags(LIB, `let token: string | undefined;\nexport function setToken(t: string) { token = t; }\nexport const get = () => token;\n`, "module-state");
  await flags(LIB, `const cache = new Map<string, number>();\nexport const get = (k: string) => cache.get(k);\n`, "module-state");
  await flags(LIB, `const adapters: Record<string, number> = {};\nexport const get = (k: string) => (adapters[k] ??= 1);\n`, "module-state");
  await spares(LIB, `const levels = { debug: 1, info: 2 };\nexport const level = (k: "debug" | "info") => levels[k];\n`, "module-state");
  await spares(LIB, `const EMPTY_ROWS: string[] = [];\nexport const rows = (r?: string[]) => r ?? EMPTY_ROWS;\n`, "module-state");
  await flags(LIB, `export class Config { public static instance = new Map(); }\n`, "module-state");
  await flags(LIB, `export class Queue { private static instance: Queue | null = null; static getInstance() { return (Queue.instance ??= new Queue()); } }\n`, "module-state");
  await spares(LIB, `export class Limits { static readonly maxRows = 100; static clamp = (n: number) => Math.min(n, Limits.maxRows); }\n`, "module-state");
  await flags(LIB, `const s = new Set<string>();\nexport function clearForTests(): void { s.clear(); }\n`, "module-state");
  await spares(LIB, `let log = console;\nexport const f = () => log.info("x");\n`, "module-state");
});

test("positional-mixup and boolean-flag: parameter lists", async () => {
  await flags(LIB, `export function f(applicationUuid: string, deploymentUuid: string) { return applicationUuid + deploymentUuid; }\n`, "positional-mixup");
  // The transformer handler type: `application` and `deploymentUuid` are both strings, so a call that skips a slot still compiles.
  await flags(LIB, `type Uuid = string;\nexport type Handler = (step: string, application?: Uuid, map?: object, deploymentUuid?: Uuid) => void;\n`, "positional-mixup");
  await spares(LIB, `type Uuid = string;\nexport type Handler = (step: string, application?: Uuid) => void;\n`, "positional-mixup");
  await flags(LIB, `export function f(x: number, verbose: boolean) { return verbose ? x : 0; }\n`, "boolean-flag");
  await flags(LIB, `export const f = (x: number, strict = false) => (strict ? x : 0);\n`, "boolean-flag");
  await spares(LIB, `export function f(options: { verbose: boolean }) { return options.verbose; }\n`, "boolean-flag");
  // A setter's only parameter is the value it sets.
  await spares(LIB, `export const setShowTypes = (showTypes: boolean) => showTypes;\n`, "boolean-flag");
  await flags(LIB, `export function f(a: number, b: number, c: number, d: number, e: number, g: number) { return a + b + c + d + e + g; }\n`, "max-params");
});

test("type-escape and magic-value", async () => {
  await flags(LIB, `export const f = (x: string) => x as unknown as number;\n`, "type-escape");
  await flags(LIB, `export const entityUuid = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";\n`, "magic-value");
  await flags(LIB, `export const f = (x: any) => x;\n`, "@typescript-eslint/no-explicit-any");
});

test("global-environment and wiring: smells in libraries, normal in composition roots", async () => {
  await flags(LIB, `export const mode = () => process.env.MIROIR_SCHEMA_MODE;\n`, "global-environment");
  await spares(ROOT, `export const mode = () => process.env.MIROIR_SCHEMA_MODE;\n`, "global-environment");
  await flags(VIEW, `declare class MiroirContext { constructor(); }\nexport const c = () => new MiroirContext();\n`, "wiring");
  await spares(ROOT, `declare class MiroirContext { constructor(); }\nexport const c = () => new MiroirContext();\n`, "wiring");
});

test("timing: debounce, timers in effects, setTimeout 0", async () => {
  await flags(VIEW, `import { useEffect } from "react";\nexport function C({ v, push }: { v: string; push: (v: string) => void }) { useEffect(() => { const t = setTimeout(() => push(v), 2000); return () => clearTimeout(t); }, [v, push]); return null; }\n`, "timing");
  await flags(LIB, `export const later = (f: () => void) => setTimeout(f, 0);\n`, "timing");
  await flags(LIB, `declare const debounce: (f: () => void, ms: number) => () => void;\nexport const g = debounce(() => undefined, 300);\n`, "timing");
});

test("React: derived state in effects, state from props, unstable deps, service reads, pub-sub, I/O", async () => {
  // The React Compiler rules only analyse functions that return JSX.
  await flags(VIEW, `import { useEffect, useState } from "react";\nexport function C({ items }: { items: string[] }) { const [n, setN] = useState(0); useEffect(() => { setN(items.length); }, [items]); return <div>{n}</div>; }\n`, "react-hooks/set-state-in-effect");
  await flags(VIEW, `import { useState } from "react";\nexport function C(props: { initial: string }) { const [v] = useState(props.initial); return v; }\n`, "state-from-props");
  await flags(VIEW, `import { useMemo, useState } from "react";\nexport function C(props: { open: boolean; initial: string }) { const [v, setV] = useState(""); useMemo(() => { if (props.open) { setV(props.initial); } }, [props.open, props.initial]); return v; }\n`, "effect-derived-state");
  await spares(VIEW, `import { useMemo, useState } from "react";\nexport function C() { const [v, setV] = useState(""); const api = useMemo(() => ({ update: (x: string) => setV(x) }), []); return [v, api]; }\n`, "effect-derived-state");
  await flags(VIEW, `import { useMemo } from "react";\nexport function C({ o }: { o: object }) { return useMemo(() => Object.keys(o), [JSON.stringify(o)]); }\n`, "unstable-deps");
  await flags(VIEW, `import { useMemo } from "react";\ndeclare const errorLogService: { getErrorStats(): number };\nexport function C() { return useMemo(() => errorLogService.getErrorStats(), []); }\n`, "service-read-in-render");
  await spares(VIEW, `import { useMemo } from "react";\nexport function C({ xs }: { xs: string[] }) { return useMemo(() => xs.find((x) => x === "a"), [xs]); }\n`, "service-read-in-render");
  await flags(VIEW, `declare const bus: { subscribe(f: () => void): () => void };\nexport const off = bus.subscribe(() => undefined);\n`, "pub-sub");
  await spares(LIB, `declare const bus: { subscribe(f: () => void): () => void };\nexport const off = bus.subscribe(() => undefined);\n`, "pub-sub");
  await spares(VIEW, `import { useSyncExternalStore } from "react";\ndeclare const store: { subscribe(f: () => void): () => void; getSnapshot(): string };\nexport const useStatus = () => useSyncExternalStore(store.subscribe, store.getSnapshot);\n`, "pub-sub");
  await flags(VIEW, `export async function load() { return fetch("/api/x"); }\n`, "component-io");
});

test("logger: one logger per file", async () => {
  const logger = (name) =>
    `const _${name} = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "${name}");\n`;
  await flags(LIB, `declare const MiroirLoggerFactory: any, packageName: string, cleanLevel: string;\n${logger("a")}${logger("b")}`, "logger");
});

test("mocked-own-module: vi.mock of Miroir code in tests, not of libraries", async () => {
  await flags(TEST, `import { vi } from "vitest";\nvi.mock("../../src/4_services/Store.js", () => ({}));\n`, "mocked-own-module");
  await flags(TEST, `import { vi } from "vitest";\nvi.mock("miroir-localcache-redux", () => ({}));\n`, "mocked-own-module");
  await spares(TEST, `import { vi } from "vitest";\nvi.mock("react-router-dom", () => ({}));\n`, "mocked-own-module");
  await flags(TEST, `import { vi } from "vitest";\nvi.mock("../../src/4_services/Store.js");\n`, "mocked-own-module");
  // A spy keeps the real code; a factory that also stubs an export is a mock.
  const factory = (properties) =>
    `import { vi } from "vitest";\nvi.mock("../../src/tests/index", async (importOriginal) => {\n  const actual = await importOriginal<typeof import("../../src/tests/index")>();\n  return { ...actual, ${properties} };\n});\n`;
  await spares(TEST, factory("register: vi.fn(actual.register)"), "mocked-own-module");
  await flags(TEST, factory("register: vi.fn(actual.register), Grid: () => null"), "mocked-own-module");
});

test("theme-bypass: colors written in components, not in theme definitions nor as a fallback", async () => {
  await flags(VIEW, `export const Badge = () => <span style={{ color: "#2e7d32" }}>ok</span>;\n`, "theme-bypass");
  await flags(VIEW, `export const style = { border: "1px solid #e0e0e0" };\n`, "theme-bypass");
  await flags(VIEW, `export const style = { color: "rgb(51, 51, 51)" };\n`, "theme-bypass");
  await flags(VIEW, `export const style = { backgroundColor: "white" };\n`, "theme-bypass");
  await spares(VIEW, `export const style = { boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" };\n`, "theme-bypass");
  await spares(VIEW, `declare const theme: { colors?: { text?: string } };\nexport const fill = theme.colors?.text || "#000";\n`, "theme-bypass");
  await spares(THEME_VIEW, `export const Badge = () => <span style={{ color: "#2e7d32" }}>ok</span>;\n`, "theme-bypass");
  await spares(LIB, `export const defaultColor = "#2e7d32";\n`, "theme-bypass");
});
