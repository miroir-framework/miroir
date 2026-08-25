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
  PROGRESSIVE_RENDER_VISIBLE_STUCK_TIMEOUT_MS,
  isVitestTestMode,
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

function isRectVisibleInViewport(rect: DOMRectReadOnly): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return rect.top < window.innerHeight && rect.bottom > 0;
}

export function useViewportReveal(
  options: UseViewportRevealOptions = {}
): UseViewportRevealResult {
  const isTestMode = isVitestTestMode();
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

    const queuedRef = { current: false };

    const doReveal = () => {
      queuedRef.current = false;
      if (!revealedRef.current) {
        setRevealed(true);
      }
    };

    const enqueueReveal = (rect: DOMRectReadOnly | DOMRect) => {
      if (queuedRef.current || revealedRef.current) {
        return;
      }
      queuedRef.current = true;
      scheduleProgressiveReveal(rect.top, doReveal, {
        visibleInViewport: isRectVisibleInViewport(rect),
      });
    };

    let stuckTimeout: ReturnType<typeof setTimeout> | undefined;

    const scheduleVisibleStuckFallback = (rect: DOMRectReadOnly | DOMRect) => {
      if (!isRectVisibleInViewport(rect)) {
        return;
      }
      stuckTimeout = setTimeout(() => {
        if (revealedRef.current || !ref.current) {
          return;
        }
        const currentRect = ref.current.getBoundingClientRect();
        if (isRectVisibleInViewport(currentRect)) {
          doReveal();
        }
      }, PROGRESSIVE_RENDER_VISIBLE_STUCK_TIMEOUT_MS);
    };

    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => {
        const rect = node.getBoundingClientRect();
        enqueueReveal(rect);
        scheduleVisibleStuckFallback(rect);
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
        enqueueReveal(entry.boundingClientRect);
        scheduleVisibleStuckFallback(entry.boundingClientRect);
        observer.disconnect();
      },
      { root: scrollRoot, rootMargin, threshold: 0 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (stuckTimeout) {
        clearTimeout(stuckTimeout);
      }
    };
  }, [disabled, revealed, rootMargin]);

  return { ref, revealed };
}
