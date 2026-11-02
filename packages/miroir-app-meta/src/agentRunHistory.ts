import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  type MlElement,
} from "@miroir-framework/core";

import agentRunMeasurementEntityJson from "../assets/meta_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/954de789-6350-4f54-a809-5f2b8b91d067.json" with { type: "json" };

// ################################################################################################
// Agent cost benchmark (#550): one AgentRunMeasurement instance per run of a coding agent, written
// in the tracked data section of miroir-app-meta by `npm run agent-run:record` from the run.json
// that `scripts/agent_bench/run.py` writes.
// ################################################################################################

export const ENTITY_AGENT_RUN_MEASUREMENT_UUID = agentRunMeasurementEntityJson.uuid;

/** run.json as `scripts/agent_bench/run.py` writes it (only the fields the instance keeps). */
export type RunSummary = {
  runId: string;
  arm: string;
  feature: string;
  runIndex: number;
  pilot: boolean;
  startedAt: string;
  model: string;
  effort: string;
  turns: number;
  stopReason: string;
  durationMs: number;
  apiDurationMs?: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUsd: number;
  toolCalls?: number;
  uuidCharShare?: number;
  acceptance?: { passed: number; total: number } | null;
  valid: boolean;
  invalidReason?: string | null;
  taskHash: string;
  transcript?: string;
  claudeCodeVersion?: string;
};

export type AgentRunMeasurement = Omit<RunSummary, "acceptance" | "invalidReason"> & {
  uuid: string;
  parentName: "AgentRunMeasurement";
  parentUuid: string;
  acceptancePassed?: boolean;
  acceptanceScenariosPassed?: number;
  acceptanceScenariosTotal?: number;
  invalidReason?: string;
  gitCommit?: string;
  gitBranch?: string;
  miroirVersion?: string;
};

const REQUIRED: (keyof RunSummary)[] = [
  "runId",
  "arm",
  "feature",
  "runIndex",
  "pilot",
  "startedAt",
  "model",
  "effort",
  "turns",
  "stopReason",
  "durationMs",
  "inputTokens",
  "outputTokens",
  "cacheReadTokens",
  "cacheCreationTokens",
  "costUsd",
  "valid",
  "taskHash",
];

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null)) as T;
}

/** The required fields the summary lacks (null counts as missing). */
export function missingFields(summary: Partial<RunSummary>): string[] {
  return REQUIRED.filter((field) => summary[field] === undefined || summary[field] === null);
}

export function measurementFromRun(
  summary: RunSummary,
  context: { gitCommit?: string; gitBranch?: string; miroirVersion?: string },
): AgentRunMeasurement {
  const { acceptance, invalidReason, ...measures } = summary;
  return withoutUndefined({
    uuid: randomUUID(),
    parentName: "AgentRunMeasurement" as const,
    parentUuid: ENTITY_AGENT_RUN_MEASUREMENT_UUID,
    runId: measures.runId,
    arm: measures.arm,
    feature: measures.feature,
    runIndex: measures.runIndex,
    pilot: measures.pilot,
    startedAt: measures.startedAt,
    model: measures.model,
    effort: measures.effort,
    turns: measures.turns,
    stopReason: measures.stopReason,
    durationMs: measures.durationMs,
    apiDurationMs: measures.apiDurationMs,
    inputTokens: measures.inputTokens,
    outputTokens: measures.outputTokens,
    cacheReadTokens: measures.cacheReadTokens,
    cacheCreationTokens: measures.cacheCreationTokens,
    costUsd: measures.costUsd,
    toolCalls: measures.toolCalls,
    uuidCharShare: measures.uuidCharShare,
    acceptancePassed: acceptance ? acceptance.passed === acceptance.total : undefined,
    acceptanceScenariosPassed: acceptance?.passed,
    acceptanceScenariosTotal: acceptance?.total,
    valid: measures.valid,
    invalidReason: invalidReason ?? undefined,
    taskHash: measures.taskHash,
    transcript: measures.transcript,
    claudeCodeVersion: measures.claudeCodeVersion,
    ...context,
  });
}

export function readRuns(dataDir: string): AgentRunMeasurement[] {
  const entityDir = join(dataDir, ENTITY_AGENT_RUN_MEASUREMENT_UUID);
  if (!existsSync(entityDir)) {
    return [];
  }
  return readdirSync(entityDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(entityDir, name), "utf-8")) as AgentRunMeasurement);
}

/** The type check errors of an instance against the AgentRunMeasurement Entity, or undefined when it is valid. */
export function runErrors(instance: AgentRunMeasurement): unknown {
  const check = checkModelValidationInstance(
    agentRunMeasurementEntityJson.mlSchema as MlElement,
    instance,
    instance.uuid,
    defaultMiroirModelEnvironment,
  );
  return check.status === "ok" ? undefined : check.innermostError;
}

/** Writes the instance file; throws, writing nothing, when the Entity rejects the instance. */
export function writeRun(instance: AgentRunMeasurement, dataDir: string): string {
  const errors = runErrors(instance);
  if (errors !== undefined) {
    throw new Error(`the AgentRunMeasurement Entity rejects the instance: ${JSON.stringify(errors)}`);
  }
  const entityDir = join(dataDir, ENTITY_AGENT_RUN_MEASUREMENT_UUID);
  mkdirSync(entityDir, { recursive: true });
  const file = join(entityDir, `${instance.uuid}.json`);
  writeFileSync(file, `${JSON.stringify(instance, null, 2)}\n`);
  return file;
}
