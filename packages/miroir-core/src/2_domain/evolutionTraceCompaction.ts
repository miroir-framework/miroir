import type { ApplicationEvolutionTraceEvent } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type EvolutionHistoryCompactionLevel = "raw" | "commit" | "version";

export type EvolutionHistoryCommitBlock = {
  commitId: string;
  eventCount: number;
  /** First sequenceNumber in the block — used for ascending ordering. */
  sequenceNumber: number;
  timestamp: string;
};

export type EvolutionHistoryVersionBlock = {
  fromVersion: string;
  toVersion: string;
  totalEvents: number;
};

export type EvolutionHistoryItem =
  | ApplicationEvolutionTraceEvent
  | EvolutionHistoryCommitBlock
  | EvolutionHistoryVersionBlock;

export type FetchEvolutionHistoryOptions = {
  compactionLevel: EvolutionHistoryCompactionLevel;
  fromVersion?: string;
  toVersion?: string;
};

function bySequenceAscending(
  a: { sequenceNumber: number },
  b: { sequenceNumber: number },
): number {
  return a.sequenceNumber - b.sequenceNumber;
}

/**
 * Read-side compaction cursor over raw ApplicationEvolutionTraceEvent records.
 * Storage stays raw; this function only projects bird’s-eye views.
 */
export function fetchEvolutionHistory(
  events: ApplicationEvolutionTraceEvent[],
  options: FetchEvolutionHistoryOptions,
): EvolutionHistoryItem[] {
  const sorted = [...events].sort(bySequenceAscending);

  if (options.compactionLevel === "raw") {
    return sorted;
  }

  if (options.compactionLevel === "commit") {
    const blocks: EvolutionHistoryCommitBlock[] = [];
    const indexByCommitId = new Map<string, number>();

    for (const event of sorted) {
      const commitId = event.commitUuid;
      if (!commitId) {
        continue;
      }
      const existingIndex = indexByCommitId.get(commitId);
      if (existingIndex === undefined) {
        indexByCommitId.set(commitId, blocks.length);
        blocks.push({
          commitId,
          eventCount: 1,
          sequenceNumber: event.sequenceNumber,
          timestamp: event.timestamp,
        });
      } else {
        blocks[existingIndex].eventCount += 1;
      }
    }

    return blocks;
  }

  // compactionLevel === "version"
  const fromVersion = options.fromVersion;
  const toVersion = options.toVersion;
  if (!fromVersion || !toVersion) {
    return [];
  }

  const inRange = sorted.filter(
    (event) =>
      event.fromVersionUuid === fromVersion && event.toVersionUuid === toVersion,
  );

  if (inRange.length === 0) {
    return [];
  }

  return [
    {
      fromVersion,
      toVersion,
      totalEvents: inRange.length,
    },
  ];
}
