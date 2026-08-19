/**
 * Stagger progressive placeholder → editor mounts in **document / reading order**
 * (top → bottom). That approximates depth-first for a vertical tree: nested
 * content of the first unfolded branch appears above the next sibling, so it
 * drains before uncle branches — unlike revealing every on-screen sibling at
 * once (breadth-first), which flooded React and left whole subtrees on
 * "Loading…".
 *
 * Folded nodes never enqueue children (they aren't mounted). Unfolded siblings
 * still only mount when IO says they're in the look-ahead; the queue then
 * serializes those mounts by Y position.
 *
 * Visible-in-viewport jobs use a fast lane so on-screen placeholders are not
 * starved when a large unfolded tree enqueues hundreds of look-ahead jobs.
 * Batch size scales with queue depth so deep trees drain in reasonable time.
 */

const REVEAL_IDLE_TIMEOUT_MS = 32;

type RevealJob = {
  documentTop: number;
  seq: number;
  reveal: () => void;
};

const queue: RevealJob[] = [];
const visibleQueue: RevealJob[] = [];
let pumpScheduled = false;
let seqCounter = 0;

function sortQueue(jobs: RevealJob[]): void {
  jobs.sort((a, b) => a.documentTop - b.documentTop || a.seq - b.seq);
}

function maxRevealsPerSlice(totalQueued: number): number {
  if (totalQueued <= 4) {
    return 2;
  }
  if (totalQueued <= 20) {
    return 4;
  }
  if (totalQueued <= 100) {
    return 8;
  }
  return 16;
}

function runPump(): void {
  pumpScheduled = false;
  sortQueue(visibleQueue);
  sortQueue(queue);

  const totalQueued = visibleQueue.length + queue.length;
  const limit = maxRevealsPerSlice(totalQueued);
  let ran = 0;

  while (ran < limit) {
    const job = visibleQueue.shift() ?? queue.shift();
    if (!job) {
      break;
    }
    job.reveal();
    ran++;
  }

  if (visibleQueue.length > 0 || queue.length > 0) {
    schedulePump();
  }
}

function schedulePump(): void {
  if (pumpScheduled) {
    return;
  }
  pumpScheduled = true;
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => runPump(), { timeout: REVEAL_IDLE_TIMEOUT_MS });
  } else {
    setTimeout(runPump, 0);
  }
}

export interface ScheduleProgressiveRevealOptions {
  /** Sentinel is currently on-screen — drain before off-screen look-ahead jobs. */
  visibleInViewport?: boolean;
}

/**
 * Enqueue a reveal. `documentTop` is the sentinel's getBoundingClientRect().top
 * at schedule time (smaller = sooner). Never runs the whole on-screen set
 * synchronously — that caused breadth-first floods.
 */
export function scheduleProgressiveReveal(
  documentTop: number,
  reveal: () => void,
  options: ScheduleProgressiveRevealOptions = {},
): void {
  const job = { documentTop, seq: seqCounter++, reveal };
  if (options.visibleInViewport) {
    visibleQueue.push(job);
  } else {
    queue.push(job);
  }
  schedulePump();
}

/** Test helper — drain without waiting for idle. */
export function flushProgressiveRevealQueueForTests(): void {
  sortQueue(visibleQueue);
  sortQueue(queue);
  while (visibleQueue.length > 0 || queue.length > 0) {
    const job = visibleQueue.shift() ?? queue.shift();
    job?.reveal();
  }
  pumpScheduled = false;
}

export function progressiveRevealQueueSizeForTests(): number {
  return visibleQueue.length + queue.length;
}
