// @vitest-environment happy-dom
// #656: react's useSelector behaves the same on both local caches. vitest: React rendering of the bindings, not
// reachable through MiroirTest.
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { localCacheKinds, type LocalCacheSliceState } from "@miroir-framework/core";

import { LocalCacheProvider, loadLocalCache, shallowEqual, useSelector } from "../src/index.js";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const snapshot = (deployments: string[]): LocalCacheSliceState => ({
  loading: {},
  current: Object.fromEntries(deployments.map((d) => [`${d}_data_entity`, { ids: [], entities: {} }])) as any,
  status: { initialLoadDone: true },
});

describe.each(localCacheKinds)("useSelector on the %s local cache", (kind) => {
  async function renderCounting(Component: React.FC<{ onRender: () => void }>) {
    const { localCacheBinding, createLocalCacheStateStore } = await loadLocalCache(kind);
    const stateStore = createLocalCacheStateStore(snapshot(["a"]));
    let renders = 0;
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <LocalCacheProvider binding={localCacheBinding} store={stateStore.store}>
          <Component onRender={() => renders++} />
        </LocalCacheProvider>,
      );
    });
    return { container, root, stateStore, renders: () => renders };
  }

  it("renders a selector that builds a new array on each call, once per state (no update loop)", async () => {
    const Keys: React.FC<{ onRender: () => void }> = ({ onRender }) => {
      onRender();
      const keys = useSelector((state) => Object.keys(state.presentModelSnapshot.current));
      return <span id="keys">{keys.join(",")}</span>;
    };
    const { container, root, stateStore, renders } = await renderCounting(Keys);
    expect(container.querySelector("#keys")?.textContent).toBe("a_data_entity");
    const rendersAfterMount = renders();

    await act(async () => stateStore.setPresentModelSnapshot(snapshot(["a", "b"])));
    expect(container.querySelector("#keys")?.textContent).toBe("a_data_entity,b_data_entity");
    expect(renders() - rendersAfterMount).toBeLessThanOrEqual(2);
    act(() => root.unmount());
  });

  it("keeps an equal selection under equalityFn: no re-render when the state changes elsewhere", async () => {
    const Status: React.FC<{ onRender: () => void }> = ({ onRender }) => {
      onRender();
      const status = useSelector((state) => ({ ...state.presentModelSnapshot.status }), shallowEqual);
      return <span id="status">{String(status.initialLoadDone)}</span>;
    };
    const { root, stateStore, renders } = await renderCounting(Status);
    const rendersAfterMount = renders();

    await act(async () => stateStore.setPresentModelSnapshot(snapshot(["a", "b"])));
    expect(renders()).toBe(rendersAfterMount);
    act(() => root.unmount());
  });
});
