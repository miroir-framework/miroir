import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import {
  createYamlParserStatusStore,
  useYamlParserStatus,
  type YamlParserLoader,
} from "../../src/miroir-fwk/4_view/components/Reports/useYamlParserStatus.js";

// #370: in the browser the YAML parser loads on demand. Node always has it loaded, so these tests use
// a loader whose load the test settles itself.
function deferredLoader(): YamlParserLoader & { resolve: () => void; reject: (error: Error) => void } {
  let loaded = false;
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const loading = new Promise<void>((res, rej) => {
    resolve = () => {
      loaded = true;
      res();
    };
    reject = rej;
  });
  return { isLoaded: () => loaded, load: () => loading, resolve, reject };
}

describe("useYamlParserStatus", () => {
  it("reports loading, then loaded once the parser has loaded", async () => {
    const loader = deferredLoader();
    const store = createYamlParserStatusStore(loader);
    const { result } = renderHook(() => useYamlParserStatus(store));
    expect(result.current).toBe("loading");
    await act(async () => loader.resolve());
    await waitFor(() => expect(result.current).toBe("loaded"));
  });

  it("reports failed when the parser does not load", async () => {
    const loader = deferredLoader();
    const store = createYamlParserStatusStore(loader);
    const { result } = renderHook(() => useYamlParserStatus(store));
    await act(async () => loader.reject(new Error("chunk failed")));
    await waitFor(() => expect(result.current).toBe("failed"));
  });
});
