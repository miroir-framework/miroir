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
 */

const MAX_REVEALS_PER_SLICE = 2;
const REVEAL_IDLE_TIMEOUT_MS = 32;

type RevealJob = {
  documentTop: number;
  seq: number;
  reveal: () => void;
};

const queue: RevealJob[] = [];
let pumpScheduled = false;
let seqCounter = 0;

function sortQueue(): void {
  queue.sort((a, b) => a.documentTop - b.documentTop || a.seq - b.seq);
}

function runPump(): void {
  pumpScheduled = false;
  sortQueue();
  let ran = 0;
  while (queue.length > 0 && ran < MAX_REVEALS_PER_SLICE) {
    const job = queue.shift();
    if (!job) {
      break;
    }
    job.reveal();
    ran++;
  }
  if (queue.length > 0) {
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

/**
 * Enqueue a reveal. `documentTop` is the sentinel's getBoundingClientRect().top
 * at schedule time (smaller = sooner). Never runs the whole on-screen set
 * synchronously — that caused breadth-first floods.
 */
export function scheduleProgressiveReveal(
  documentTop: number,
  reveal: () => void
): void {
  queue.push({ documentTop, seq: seqCounter++, reveal });
  schedulePump();
}

/** Test helper — drain without waiting for idle. */
export function flushProgressiveRevealQueueForTests(): void {
  sortQueue();
  while (queue.length > 0) {
    const job = queue.shift();
    job?.reveal();
  }
  pumpScheduled = false;
}

export function progressiveRevealQueueSizeForTests(): number {
  return queue.length;
}
