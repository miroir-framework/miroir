/**
 * #281 Slice 2 — unit tests for apiCallReportSection binding / schema lookup.
 * Uses the committed Spotify report JSON, not an inline clone of the extractor.
 */
import { describe, expect, it } from "vitest";

import {
  reportSpotifyPlaylist,
  spotifyServiceEndpoint,
} from "miroir-test-app_deployment-spotify";

import { resolveApiCallReportSectionSchema } from "../../../../src/miroir-fwk/4_view/components/Reports/resolveApiCallReportSectionSchema.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveApiCallReportSectionSchema" ||
  RUN_TEST === "resolveApiCallReportSectionSchema.unit.test" ||
  RUN_TEST === "apiCallReport.281.phase2";

const SPOTIFY_ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const UNKNOWN_ENDPOINT_UUID = "c0ffee00-0000-4000-8000-000000000001";

const listSection = reportSpotifyPlaylist.definition.section as {
  type: "list";
  definition: Array<{ type: string; definition: Record<string, string> }>;
};
const apiCallSection = listSection.definition.find((entry) => entry.type === "apiCallReportSection");

describe.skipIf(!shouldRun)("resolveApiCallReportSectionSchema — real Spotify report JSON", () => {
  it("committed Spotify report binds playlist extractor to get-playlist responseSchema", () => {
    expect(apiCallSection, "Slice 1 committed report must include apiCallReportSection").toBeDefined();
    const result = resolveApiCallReportSectionSchema({
      section: apiCallSection!.definition as {
        fetchedDataReference: string;
        endpointUuid: string;
        operationId: string;
      },
      extractorTemplates: reportSpotifyPlaylist.definition.extractorTemplates as Record<
        string,
        unknown
      >,
      endpointsByUuid: { [SPOTIFY_ENDPOINT_UUID]: spotifyServiceEndpoint },
    });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    if (result.ok) {
      expect(result.schema).toBeDefined();
      expect((result.schema as { type?: string }).type).toBe("object");
    }
  });

  it("operationId mismatch names both section and extractor ids", () => {
    const result = resolveApiCallReportSectionSchema({
      section: {
        fetchedDataReference: "playlist",
        endpointUuid: SPOTIFY_ENDPOINT_UUID,
        operationId: "not-get-playlist",
      },
      extractorTemplates: reportSpotifyPlaylist.definition.extractorTemplates as Record<
        string,
        unknown
      >,
      endpointsByUuid: { [SPOTIFY_ENDPOINT_UUID]: spotifyServiceEndpoint },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not-get-playlist");
      expect(result.error).toMatch(/(?<![A-Za-z0-9-])get-playlist(?![A-Za-z0-9-])/);
    }
  });

  it("unknown section endpointUuid is named", () => {
    const result = resolveApiCallReportSectionSchema({
      section: {
        fetchedDataReference: "playlist",
        endpointUuid: UNKNOWN_ENDPOINT_UUID,
        operationId: "get-playlist",
      },
      extractorTemplates: reportSpotifyPlaylist.definition.extractorTemplates as Record<
        string,
        unknown
      >,
      endpointsByUuid: { [SPOTIFY_ENDPOINT_UUID]: spotifyServiceEndpoint },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(UNKNOWN_ENDPOINT_UUID);
      expect(result.error.toLowerCase()).not.toContain("report target entity not found");
    }
  });

  it("missing fetchedDataReference names the key tracks", () => {
    const result = resolveApiCallReportSectionSchema({
      section: {
        fetchedDataReference: "tracks",
        endpointUuid: SPOTIFY_ENDPOINT_UUID,
        operationId: "get-playlist",
      },
      extractorTemplates: reportSpotifyPlaylist.definition.extractorTemplates as Record<
        string,
        unknown
      >,
      endpointsByUuid: { [SPOTIFY_ENDPOINT_UUID]: spotifyServiceEndpoint },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("tracks");
      expect(result.error).toMatch(/extractor|fetchedDataReference/i);
    }
  });

  it("accepts #272 extractorFromAction alias when endpoint and operation match", () => {
    const result = resolveApiCallReportSectionSchema({
      section: {
        fetchedDataReference: "playlist",
        endpointUuid: SPOTIFY_ENDPOINT_UUID,
        operationId: "get-playlist",
      },
      extractorTemplates: {
        playlist: {
          extractorOrCombinerType: "extractorFromAction",
          endpointUuid: SPOTIFY_ENDPOINT_UUID,
          actionType: "get-playlist",
        },
      },
      endpointsByUuid: { [SPOTIFY_ENDPOINT_UUID]: spotifyServiceEndpoint },
    });
    expect(result.ok, JSON.stringify(result)).toBe(true);
  });
});
