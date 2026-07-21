/**
 * Identity-aware approximate size of LocalCache / undo-redo state.
 *
 * Used by LocalCache monitoring (#211). Does not claim V8-accurate heap size;
 * it approximates retained structure like the historical `roughSizeOfObject`,
 * while never double-counting the same object reference.
 *
 * History sizing (Phase 0 Q1): Immer `changes` / `inverseChanges` are deep-sized;
 * `action` is sized as metadata only (no deep `payload`) to avoid double-counting
 * EntityInstances already retained in `presentModelSnapshot`.
 */

import type {
  LocalCacheSliceState,
  StateChanges,
  StateWithUndoRedo,
} from "../0_interfaces/2_domain/LocalCacheInterface.js";
import {
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexDeploymentUuid,
  getLocalCacheIndexEntityUuid,
} from "./ReduxDeploymentsState.js";

export type LocalCacheMemoryBreakdown = {
  presentSnapshotBytes: number;
  transactionHistoryBytes: number;
  queriesResultsCacheBytes: number;
  effectiveBytes: number;
};

/** Attributed size of one instance under `present.current` (distribution view, not unique heap). */
export type AttributedInstanceSize = {
  deploymentUuid: string;
  applicationSection: string;
  entityUuid: string;
  instanceId: string;
  bytes: number;
};

/** Rolled-up attributed size for one Entity collection under `present.current`. */
export type AttributedEntitySize = {
  deploymentUuid: string;
  applicationSection: string;
  entityUuid: string;
  instanceCount: number;
  attributedBytes: number;
};

/** Cached monitor view when LocalCache monitoring session is ON (#211). */
export type LocalCacheMonitorSnapshot = {
  breakdown: LocalCacheMemoryBreakdown;
  attributedInstances: AttributedInstanceSize[];
};

export function estimateObjectBytes(
  value: unknown,
  visited: Set<object> = new Set()
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const t = typeof value;
  if (t === "boolean") {
    return 4;
  }
  if (t === "string") {
    return (value as string).length * 2;
  }
  if (t === "number") {
    return 8;
  }
  if (t === "bigint") {
    return 8;
  }
  if (t === "symbol" || t === "function") {
    return 0;
  }

  if (t !== "object") {
    return 0;
  }

  const obj = value as object;
  if (visited.has(obj)) {
    return 0;
  }
  visited.add(obj);

  if (Array.isArray(obj)) {
    let bytes = 0;
    for (const item of obj) {
      bytes += estimateObjectBytes(item, visited);
    }
    return bytes;
  }

  if (obj instanceof Date) {
    return 8;
  }

  if (obj instanceof Map) {
    let bytes = 0;
    for (const [k, v] of obj.entries()) {
      bytes += estimateObjectBytes(k, visited);
      bytes += estimateObjectBytes(v, visited);
    }
    return bytes;
  }

  if (obj instanceof Set) {
    let bytes = 0;
    for (const item of obj.values()) {
      bytes += estimateObjectBytes(item, visited);
    }
    return bytes;
  }

  let bytes = 0;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    bytes += key.length * 2;
    bytes += estimateObjectBytes((obj as Record<string, unknown>)[key], visited);
  }
  return bytes;
}

/**
 * Size an undo/redo action as metadata only — never deep-walk `payload`.
 */
function estimateActionMetadataBytes(
  action: StateChanges["action"],
  visited: Set<object>
): number {
  if (action == null || typeof action !== "object") {
    return 0;
  }
  if (visited.has(action)) {
    return 0;
  }
  visited.add(action);

  let bytes = 0;
  const record = action as Record<string, unknown>;
  for (const key of ["actionType", "actionName", "endpoint", "deploymentUuid"]) {
    if (key in record) {
      bytes += key.length * 2;
      bytes += estimateObjectBytes(record[key], visited);
    }
  }
  // Count the string key "payload" presence lightly, but do not walk its value.
  if ("payload" in record) {
    bytes += "payload".length * 2;
  }
  return bytes;
}

function estimateStateChangesBytes(
  patches: StateChanges[],
  visited: Set<object>
): number {
  let bytes = 0;
  for (const entry of patches) {
    if (entry == null || typeof entry !== "object") {
      continue;
    }
    if (visited.has(entry)) {
      continue;
    }
    visited.add(entry);

    bytes += estimateActionMetadataBytes(entry.action, visited);
    bytes += estimateObjectBytes(entry.changes, visited);
    bytes += estimateObjectBytes(entry.inverseChanges, visited);
  }
  return bytes;
}

/**
 * Fair effective-memory breakdown for a LocalCache `StateWithUndoRedo` root.
 * Uses a shared identity set so Immer-shared / commit-aliased structure is not
 * double-counted across present, previous, patch stacks, and query cache.
 */
export function measureLocalCacheMemory(
  state: StateWithUndoRedo
): LocalCacheMemoryBreakdown {
  const visited = new Set<object>();

  const presentSnapshotBytes = estimateObjectBytes(
    state.presentModelSnapshot,
    visited
  );

  let transactionHistoryBytes = 0;
  transactionHistoryBytes += estimateObjectBytes(
    state.previousModelSnapshot,
    visited
  );
  transactionHistoryBytes += estimateStateChangesBytes(
    state.pastModelPatches ?? [],
    visited
  );
  transactionHistoryBytes += estimateStateChangesBytes(
    state.futureModelPatches ?? [],
    visited
  );
  transactionHistoryBytes += estimateObjectBytes(
    state.currentTransaction,
    visited
  );

  const queriesResultsCacheBytes = estimateObjectBytes(
    state.queriesResultsCache,
    visited
  );

  return {
    presentSnapshotBytes,
    transactionHistoryBytes,
    queriesResultsCacheBytes,
    effectiveBytes:
      presentSnapshotBytes +
      transactionHistoryBytes +
      queriesResultsCacheBytes,
  };
}

/**
 * Attribute each instance under `present.current` with an independent size estimate.
 * Does not walk `loading` (v1). This is a distribution / hot-spot view — summing
 * attributed bytes is not required to equal `presentSnapshotBytes` / effective heap.
 */
export function buildAttributedInstanceIndex(
  present: LocalCacheSliceState
): AttributedInstanceSize[] {
  const result: AttributedInstanceSize[] = [];
  const current = present?.current;
  if (!current || typeof current !== "object") {
    return result;
  }

  for (const indexKey of Object.keys(current)) {
    let deploymentUuid: string;
    let applicationSection: string;
    let entityUuid: string;
    try {
      deploymentUuid = getLocalCacheIndexDeploymentUuid(indexKey);
      applicationSection = getLocalCacheIndexDeploymentSection(indexKey);
      entityUuid = getLocalCacheIndexEntityUuid(indexKey);
    } catch {
      continue;
    }

    const collection = current[indexKey] as
      | { entities?: Record<string, unknown>; ids?: string[] }
      | undefined;
    const entities = collection?.entities;
    if (!entities || typeof entities !== "object") {
      continue;
    }

    for (const instanceId of Object.keys(entities)) {
      const instance = entities[instanceId];
      result.push({
        deploymentUuid,
        applicationSection,
        entityUuid,
        instanceId,
        bytes: estimateObjectBytes(instance),
      });
    }
  }

  return result;
}

/** Roll attributed instances up by (deployment, section, entity). */
export function aggregateAttributedByEntity(
  instances: AttributedInstanceSize[]
): AttributedEntitySize[] {
  const map = new Map<string, AttributedEntitySize>();
  for (const row of instances) {
    const key = `${row.deploymentUuid}_${row.applicationSection}_${row.entityUuid}`;
    const existing = map.get(key);
    if (existing) {
      existing.instanceCount += 1;
      existing.attributedBytes += row.bytes;
    } else {
      map.set(key, {
        deploymentUuid: row.deploymentUuid,
        applicationSection: row.applicationSection,
        entityUuid: row.entityUuid,
        instanceCount: 1,
        attributedBytes: row.bytes,
      });
    }
  }
  return [...map.values()];
}

/** Top N instances by attributed bytes, descending. */
export function selectTopLargest(
  instances: AttributedInstanceSize[],
  n: number
): AttributedInstanceSize[] {
  if (n <= 0) {
    return [];
  }
  return [...instances].sort((a, b) => b.bytes - a.bytes).slice(0, n);
}
