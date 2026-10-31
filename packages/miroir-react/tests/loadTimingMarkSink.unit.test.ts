/**
 * #633 D6: miroir-react forwards load-timing marks to the sink its host registers; with none, a mark does nothing.
 * Not reachable through MiroirTest: module state of the package, not a model element.
 */
import { afterEach, describe, expect, it } from "vitest";

import { loadTimingMark, setLoadTimingMarkSink } from "../src/loadTimings/loadTimingMarkSink.js";

describe("load-timing mark sink (#633)", () => {
  afterEach(() => setLoadTimingMarkSink(undefined));

  it("does nothing before a sink is registered", () => {
    expect(() => loadTimingMark("configurationsLoaded")).not.toThrow();
  });

  it("forwards each mark to the registered sink once", () => {
    const marks: string[] = [];
    setLoadTimingMarkSink((name) => marks.push(name));
    loadTimingMark("configurationsLoaded");
    expect(marks).toEqual(["configurationsLoaded"]);
  });

  it("stops forwarding once the sink is removed", () => {
    const marks: string[] = [];
    setLoadTimingMarkSink((name) => marks.push(name));
    setLoadTimingMarkSink(undefined);
    loadTimingMark("configurationsLoaded");
    expect(marks).toEqual([]);
  });
});
