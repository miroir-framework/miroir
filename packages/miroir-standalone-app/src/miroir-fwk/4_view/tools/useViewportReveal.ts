/**
 * Reveal content once the sentinel enters (or nears) the scrollport.
 * Until then callers should render a cheap placeholder — not the real editor tree.
 *
 * Observation root = nearest scrollable ancestor (`ThemedScrollableContent`),
 * with rootMargin look-ahead. Reveals are **serialized in document order**
 * (top → bottom) via progressiveRevealScheduler so nested content of the first
 * visible branch mounts before sibling branches (depth-first / reading order),
 * instead of all same-depth siblings mounting at once (breadth-first).
 */

import { useEffect, useRef, useState } from "react";
import {
  PROGRESSIVE_RENDER_FALLBACK_TIMEOUT_MS,
  PROGRESSIVE_RENDER_ROOT_MARGIN,
} from "./progressiveRenderConfig.js";
import { scheduleProgressiveReveal } from "./progressiveRevealScheduler.js";

export interface UseViewportRevealOptions {
  /** Skip observation and reveal immediately (e.g. unit tests). */
  disabled?: boolean;
  rootMargin?: string;
}

export interface UseViewportRevealResult {
  /** Attach to the placeholder / wrapper element. */
  ref: React.RefObject<HTMLDivElement>;
  /** True once the node has intersected (sticky — stays true after first reveal). */
  revealed: boolean;
}

/** Nearest ancestor that scrolls (overflow auto/scroll/overlay), else null (= viewport). */
export function findScrollParent(element: Element | null): Element | null {
  let current: Element | null = element?.parentElement ?? null;
  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScrollY =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    if (canScrollY && current.scrollHeight > current.clientHeight) {
      return current;
    }
    if (canScrollY) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function useViewportReveal(
  options: UseViewportRevealOptions = {}
): UseViewportRevealResult {
  const isTestMode = process.env.VITE_TEST_MODE === "true";
  const disabled = options.disabled === true || isTestMode;
  const rootMargin = options.rootMargin ?? PROGRESSIVE_RENDER_ROOT_MARGIN;
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(disabled);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  useEffect(() => {
    if (disabled || revealed) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }

    const doReveal = () => {
      if (!revealedRef.current) {
        setRevealed(true);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => {
        scheduleProgressiveReveal(node.getBoundingClientRect().top, doReveal);
      }, PROGRESSIVE_RENDER_FALLBACK_TIMEOUT_MS);
      return () => clearTimeout(t);
    }

    const scrollRoot = findScrollParent(node);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((e) => e.isIntersecting);
        if (!entry) {
          return;
        }
        // Document order: smaller top mounts first → depth-first for vertical trees
        scheduleProgressiveReveal(entry.boundingClientRect.top, doReveal);
        observer.disconnect();
      },
      { root: scrollRoot, rootMargin, threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, revealed, rootMargin]);

  return { ref, revealed };
}
