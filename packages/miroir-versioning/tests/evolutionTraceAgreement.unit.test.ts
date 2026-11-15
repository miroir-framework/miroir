/**
 * #708 part C: where the agreement check starts in an application's chain of evolution trace records.
 */
import { describe, expect, it } from "vitest";

import {
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  selfApplicationRowLocation,
  type EvolutionTraceRecordRow,
} from "@miroir-framework/core";

import {
  agreementStart,
  checkStagedEvolutionTraceAgreement,
  EVOLUTION_TRACE_RECORDS_IGNORED,
  EVOLUTION_TRACES_DISAGREE,
  evolutionTraceFork,
} from "../src/evolutionTraceAgreement.js";

const APPLICATION = "708c0000-0000-4000-8000-000000000001";
const VERSION = "708c0000-0000-4000-8000-000000000002";
const OTHER_VERSION = "708c0000-0000-4000-8000-000000000003";

let sequenceNumber = 0;

function record(kind: "commit" | "version" | "rebaseline", fields: Partial<EvolutionTraceRecordRow> = {}): EvolutionTraceRecordRow {
  sequenceNumber += 1;
  return {
    uuid: `708c0000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    parentName: "EvolutionTraceRecord",
    parentUuid: "c2b1a1f0-0000-4000-8000-000000000000",
    application: APPLICATION,
    sequenceNumber,
    kind,
    timestamp: "2026-11-15T00:00:00.000Z",
    ...fields,
  };
}

/** A recorded write of the application's SelfApplication row, with its traces on or off. */
function tracesWrite(on: boolean) {
  const { section, entityUuid } = selfApplicationRowLocation(APPLICATION);
  return record("commit", {
    complete: true,
    actions: [
      {
        actionType: "updateInstance",
        payload: {
          application: APPLICATION,
          applicationSection: section,
          parentUuid: entityUuid,
          objects: [{ uuid: APPLICATION, parentUuid: entityUuid, versioningMode: "versioned-internal", evolutionTraces: on }],
        },
      },
    ],
  });
}

describe("agreementStart (#708 C)", () => {
  it("starts at the version of the last marker", () => {
    expect(agreementStart(APPLICATION, [record("version", { version: OTHER_VERSION }), record("commit"), record("version", { version: VERSION }), record("commit")])).toBe(VERSION);
  });

  it("starts at the version a rebaseline names", () => {
    expect(agreementStart(APPLICATION, [record("version", { version: OTHER_VERSION }), record("rebaseline", { version: VERSION })])).toBe(VERSION);
  });

  it("has nothing to check with no marker, after a rebaseline naming no version, or once traces were turned off", () => {
    expect([
      agreementStart(APPLICATION, [record("commit")]),
      agreementStart(APPLICATION, [record("version", { version: VERSION }), record("rebaseline")]),
      agreementStart(APPLICATION, [record("version", { version: VERSION }), tracesWrite(false), record("commit")]),
    ]).toEqual([undefined, undefined, undefined]);
  });

  it("still checks after a recorded write that leaves traces on", () => {
    expect(agreementStart(APPLICATION, [record("version", { version: VERSION }), tracesWrite(true)])).toBe(VERSION);
  });
});

describe("evolutionTraceFork (#708 C2)", () => {
  it("finds two records following the same one since the marker, and none in a straight chain", () => {
    const marker = record("version", { version: VERSION });
    const first = record("commit", { previousTrace: marker.uuid });
    const straight = [marker, first, record("commit", { previousTrace: first.uuid })];
    const forked = [marker, first, record("commit", { previousTrace: marker.uuid })];

    expect([evolutionTraceFork(APPLICATION, straight, VERSION), evolutionTraceFork(APPLICATION, forked, VERSION)]).toEqual([
      undefined,
      marker.uuid,
    ]);
  });

  it("ignores a fork before the marker", () => {
    const start = record("commit");
    const before = [start, record("commit", { previousTrace: start.uuid }), record("commit", { previousTrace: start.uuid })];
    const marker = record("version", { version: VERSION, previousTrace: before[2].uuid });

    expect(evolutionTraceFork(APPLICATION, [...before, marker, record("commit", { previousTrace: marker.uuid })], VERSION)).toBeUndefined();
  });
});

describe("checkStagedEvolutionTraceAgreement (#708 C4)", () => {
  const SECTION_FOLDERS = { model: "app_model", modelVersion: "app_modelVersion" };
  const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
  const ENTITY = "708c0000-0000-4000-8000-0000000000e1";
  const { entityUuid: selfApplicationEntity } = selfApplicationRowLocation(APPLICATION);

  function selfApplicationFile(evolutionTraces: boolean): Record<string, string> {
    return {
      [`app_model/${selfApplicationEntity}/${APPLICATION}.json`]: JSON.stringify({
        uuid: APPLICATION,
        parentUuid: selfApplicationEntity,
        name: "App",
        versioningMode: "versioned-git",
        evolutionTraces,
      }),
    };
  }

  function entityFile(description: string): Record<string, string> {
    return {
      [`app_model/${ENTITY_ENTITY}/${ENTITY}.json`]: JSON.stringify({ uuid: ENTITY, parentUuid: ENTITY_ENTITY, name: "Thing", description }),
    };
  }

  function recordFiles(...records: EvolutionTraceRecordRow[]): Record<string, string> {
    return Object.fromEntries(
      records.map((row) => [`app_modelVersion/${EVOLUTION_TRACE_RECORD_ENTITY_UUID}/${row.uuid}.json`, JSON.stringify(row)]),
    );
  }

  function check(head: Record<string, string> | undefined, staged: Record<string, string>) {
    return checkStagedEvolutionTraceAgreement({ application: APPLICATION, sectionFolders: SECTION_FOLDERS, head, staged }, new Set());
  }

  const head = { ...selfApplicationFile(true), ...entityFile("first") };

  it("has nothing to check without HEAD, with traces off at HEAD, or when the commit turns them off", () => {
    expect([
      check(undefined, { ...head, ...entityFile("edited outside Miroir") }),
      check({ ...head, ...selfApplicationFile(false) }, { ...head, ...entityFile("edited outside Miroir") }),
      check(head, { ...head, ...entityFile("edited outside Miroir"), ...recordFiles(tracesWrite(false)) }),
    ]).toEqual([undefined, undefined, undefined]);
  });

  it("refuses an added record that forks the chain of HEAD", () => {
    const first = record("commit");
    const added = record("commit", { previousTrace: first.uuid });
    const other = record("commit", { previousTrace: first.uuid });

    const refused = check({ ...head, ...recordFiles(first, other) }, { ...head, ...recordFiles(first, other, added) });

    expect(refused?.errorContext).toEqual({ reason: EVOLUTION_TRACES_DISAGREE, fork: first.uuid });
  });

  it("refuses a commit whose repository cannot hold the records: their folder is not among the section folders", () => {
    const refused = checkStagedEvolutionTraceAgreement(
      { application: APPLICATION, sectionFolders: { model: "app_model" }, head, staged: head },
      new Set(),
    );

    expect(refused?.errorContext).toEqual({ reason: EVOLUTION_TRACE_RECORDS_IGNORED, section: "modelVersion" });
  });
});
