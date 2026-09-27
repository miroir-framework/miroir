// #318: vitest runner that records, inside the test worker, where each test file spends time:
// collect (module load, including top-level awaits), beforeAll / afterAll per suite, and
// beforeEach / body / afterEach per test. Writes one JSON per test file into
// $MIROIR_TEST_TIMING_DIR. Loaded only through miroirTestTimingConfig() (MIROIR_TEST_TIMING=1).
//
// Code under test may add named phases (for example a session init hidden in collect) with
// `globalThis.__miroirTestTiming?.phase(name, ms)`; it is a no-op when this runner is absent.
import importedFs from "node:fs";
import importedPath from "node:path";
const { performance } = globalThis;

import { getFn } from "@vitest/runner";
import { VitestTestRunner } from "vitest/runners";

// Packages using vite-plugin-node-polyfills resolve `node:fs` to an empty stub inside the test
// worker; the real modules come from the Node runtime itself.
const fs = process.getBuiltinModule?.("node:fs") ?? importedFs;
const path = process.getBuiltinModule?.("node:path") ?? importedPath;

const round = (ms) => (ms === undefined ? undefined : Math.round(ms * 10) / 10);

function fullName(task) {
  const names = [];
  for (let current = task; current && !("filepath" in current); current = current.suite) {
    names.unshift(current.name);
  }
  return names.join(" > ");
}

export default class MiroirTimingRunner extends VitestTestRunner {
  constructor(config) {
    super(config);
    this.timingMarks = new Map();
    this.timingPhases = [];
    globalThis.__miroirTestTiming = {
      phase: (name, ms) => this.timingPhases.push({ name, ms: round(ms) }),
    };
  }

  mark(task, key) {
    let marks = this.timingMarks.get(task.id);
    if (!marks) {
      marks = {};
      this.timingMarks.set(task.id, marks);
    }
    marks[key] = performance.now();
  }

  async onBeforeRunSuite(suite) {
    this.mark(suite, "start");
    return super.onBeforeRunSuite(suite);
  }

  async onBeforeRunTask(test) {
    this.mark(test, "start");
    return super.onBeforeRunTask(test);
  }

  onBeforeTryTask(test, options) {
    this.mark(test, "try");
    return super.onBeforeTryTask(test, options);
  }

  async runTask(test) {
    const fn = getFn(test);
    if (!fn) {
      throw new Error("Test function is not found. Did you add it using `setFn`?");
    }
    this.mark(test, "fnStart");
    try {
      await fn();
    } finally {
      this.mark(test, "fnEnd");
    }
  }

  onAfterRunTask(test) {
    this.mark(test, "end");
    return super.onAfterRunTask(test);
  }

  async onAfterRunSuite(suite) {
    this.mark(suite, "end");
    await super.onAfterRunSuite(suite);
    if ("filepath" in suite) {
      this.writeFileTimings(suite);
    }
  }

  testTiming(test) {
    const m = this.timingMarks.get(test.id) ?? {};
    const ranBody = m.fnStart !== undefined;
    return {
      name: fullName(test),
      state: test.result?.state ?? test.mode,
      total_ms: round(m.end !== undefined && m.start !== undefined ? m.end - m.start : undefined),
      before_each_ms: round(
        m.try !== undefined ? (ranBody ? m.fnStart : m.end) - m.try : undefined,
      ),
      body_ms: round(ranBody ? m.fnEnd - m.fnStart : undefined),
      after_each_ms: round(ranBody && m.end !== undefined ? m.end - m.fnEnd : undefined),
    };
  }

  suiteTiming(suite) {
    const m = this.timingMarks.get(suite.id) ?? {};
    const childMarks = (suite.tasks ?? [])
      .map((child) => this.timingMarks.get(child.id))
      .filter((marks) => marks?.start !== undefined && marks?.end !== undefined);
    const firstChildStart = childMarks.length ? Math.min(...childMarks.map((c) => c.start)) : m.end;
    const lastChildEnd = childMarks.length ? Math.max(...childMarks.map((c) => c.end)) : m.end;
    return {
      name: fullName(suite) || "(file)",
      total_ms: round(m.end - m.start),
      before_all_ms: round(firstChildStart - m.start),
      after_all_ms: round(m.end - lastChildEnd),
    };
  }

  writeFileTimings(file) {
    const dir = process.env.MIROIR_TEST_TIMING_DIR;
    if (!dir) {
      return;
    }
    const suites = [];
    const tests = [];
    const walk = (task) => {
      if (task.type === "test") {
        tests.push(this.testTiming(task));
        return;
      }
      suites.push(this.suiteTiming(task));
      for (const child of task.tasks ?? []) {
        walk(child);
      }
    };
    walk(file);
    const record = {
      file: path.relative(process.cwd(), file.filepath).replace(/\\/g, "/"),
      filepath: file.filepath,
      pid: process.pid,
      collect_ms: round(file.collectDuration),
      setup_ms: round(file.setupDuration),
      prepare_ms: round(file.prepareDuration),
      environment_ms: round(file.environmentLoad),
      phases: this.timingPhases.splice(0),
      suites,
      tests,
    };
    fs.mkdirSync(dir, { recursive: true });
    const base = path.basename(file.filepath).replace(/[^A-Za-z0-9._-]/g, "_");
    fs.writeFileSync(
      path.join(dir, `${base}.${process.pid}.${Date.now()}.json`),
      JSON.stringify(record, null, 2) + "\n",
      "utf-8",
    );
  }
}
