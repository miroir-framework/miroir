/**
 * Progressive reveal for object attributes / array items.
 *
 * History:
 * - Idle-callback deferral: cascade with nesting depth → slow one-by-one reveal.
 * - Sibling-count / eager-first-N: still sync-mounts heavy unfolded subtrees
 *   (click freezes of multiple seconds; blank-then-all-at-once for large trees).
 *
 * Current policy: **viewport-gated**. Placeholders mount cheaply; real editors
 * mount only when the sentinel intersects an *expanded* root (viewport +
 * multi-screen prefetch below). Off-screen siblings far below stay cheap
 * placeholders until the scroll approach enters the buffer zone.
 *
 * IntersectionObserver `rootMargin` only accepts `px` / `%` (not `vh`);
 * percentages are relative to the **observation root**. We use the nearest
 * scrollable ancestor (e.g. `ThemedScrollableContent`) as root — not the
 * window — otherwise overflow clipping makes look-ahead a no-op and placeholders
 * only swap when they actually enter the visible scrollport.
 * With that root, `bottom: 200%` ≈ two scrollport heights of look-ahead.
 * Prefetch mounts are staggered in **document order** (top→bottom) so nested
 * content of the first branch fills before sibling branches (depth-first),
 * instead of all same-depth siblings mounting at once (breadth-first).
 */

/** How many viewport heights below the fold to start mounting for real. */
export const PROGRESSIVE_RENDER_BELOW_VIEWPORTS = 2;

/** Small look-behind when scrolling back up (fraction of a viewport). */
export const PROGRESSIVE_RENDER_ABOVE_VIEWPORTS = 0.25;

/**
 * Build IntersectionObserver `rootMargin`: `top right bottom left`.
 * Expands the observation root so placeholders N viewports below count as
 * "intersecting" and get replaced before the user reaches them.
 */
export function buildProgressiveRenderRootMargin(
  belowViewports: number = PROGRESSIVE_RENDER_BELOW_VIEWPORTS,
  aboveViewports: number = PROGRESSIVE_RENDER_ABOVE_VIEWPORTS
): string {
  const top = `${aboveViewports * 100}%`;
  const bottom = `${belowViewports * 100}%`;
  return `${top} 0px ${bottom} 0px`;
}

/** Default rootMargin used by `useViewportReveal`. */
export const PROGRESSIVE_RENDER_ROOT_MARGIN = buildProgressiveRenderRootMargin();

/** Fallback when IntersectionObserver is unavailable. */
export const PROGRESSIVE_RENDER_FALLBACK_TIMEOUT_MS = 0;
