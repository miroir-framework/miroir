import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  findScrollParent,
  useViewportReveal,
} from "../../src/miroir-fwk/4_view/tools/useViewportReveal.js";
import {
  flushProgressiveRevealQueueForTests,
  progressiveRevealQueueSizeForTests,
  scheduleProgressiveReveal,
} from "../../src/miroir-fwk/4_view/tools/progressiveRevealScheduler.js";

describe("useViewportReveal", () => {
  it("reveals immediately when disabled", () => {
    const { result } = renderHook(() => useViewportReveal({ disabled: true }));
    expect(result.current.revealed).toBe(true);
  });
});

describe("findScrollParent", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("returns the nearest overflow scroll/auto ancestor", () => {
    const outer = document.createElement("div");
    const scroll = document.createElement("div");
    const inner = document.createElement("div");
    const target = document.createElement("div");
    scroll.appendChild(inner);
    inner.appendChild(target);
    outer.appendChild(scroll);
    document.body.appendChild(outer);

    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      if (el === scroll) {
        return { overflowY: "scroll" } as CSSStyleDeclaration;
      }
      return { overflowY: "visible" } as CSSStyleDeclaration;
    });

    expect(findScrollParent(target)).toBe(scroll);
  });

  it("returns null when there is no scrollable ancestor", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      overflowY: "visible",
    } as CSSStyleDeclaration);
    expect(findScrollParent(target)).toBeNull();
  });
});

describe("progressiveRevealScheduler (document order / depth-first)", () => {
  afterEach(() => {
    flushProgressiveRevealQueueForTests();
  });

  it("does not run reveals synchronously (avoids breadth-first flood)", () => {
    const spy = vi.fn();
    scheduleProgressiveReveal(10, spy);
    expect(spy).not.toHaveBeenCalled();
    expect(progressiveRevealQueueSizeForTests()).toBe(1);
    flushProgressiveRevealQueueForTests();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("drains top-to-bottom (smaller documentTop first)", () => {
    const order: number[] = [];
    scheduleProgressiveReveal(200, () => order.push(200));
    scheduleProgressiveReveal(50, () => order.push(50));
    scheduleProgressiveReveal(100, () => order.push(100));
    flushProgressiveRevealQueueForTests();
    expect(order).toEqual([50, 100, 200]);
  });

  it("uses seq as tie-breaker when tops are equal", () => {
    const order: string[] = [];
    scheduleProgressiveReveal(0, () => order.push("a"));
    scheduleProgressiveReveal(0, () => order.push("b"));
    scheduleProgressiveReveal(0, () => order.push("c"));
    flushProgressiveRevealQueueForTests();
    expect(order).toEqual(["a", "b", "c"]);
  });
});
