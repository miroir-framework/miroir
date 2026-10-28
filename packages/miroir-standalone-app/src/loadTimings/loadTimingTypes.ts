// ################################################################################################
// #580: one measured load step, as the recorder produces it and the Meta app's
// PageLoadMeasurement Entity stores it (without uuid, parentName, parentUuid). No imports: the
// recorder is loaded with the page.
// ################################################################################################

export type LoadTimingChunk = {
  /** Path of the file, without origin or query. */
  file: string;
  /** From the step start, in ms. */
  startMs: number;
  durationMs: number;
  /** 0 when the file came from the browser cache. */
  transferBytes: number;
  encodedBytes: number;
};

export type LoadTimingStep = {
  pageLoad: string;
  measuredAt: string;
  step: string;
  page: string;
  url: string;
  durationMs: number;
  settled: boolean;
  overlapsWrite?: boolean;
  milestones?: Record<string, number>;
  chunkCount: number;
  chunkTransferBytes: number;
  chunkEncodedBytes: number;
  chunks: LoadTimingChunk[];
  dataRequestCount: number;
  dataTransferBytes: number;
  environment?: string;
  client: "webApp" | "electron";
  buildMode: "production" | "development";
  miroirVersion?: string;
};

/** Writes finished steps; resolves to an error message when the write failed. */
export type LoadTimingWrite = (steps: LoadTimingStep[]) => Promise<{ ok: true } | { ok: false; error: string }>;
