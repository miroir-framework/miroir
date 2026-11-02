import { createContext, createElement, useContext, type ComponentType, type ReactNode } from "react";

import type { LocalCacheKind, StateWithUndoRedo } from "@miroir-framework/core";

// #656: the React side of a local cache. The process starts on one local cache (`startMiroirClient`'s
// `localCache` option), whose binding (`./local-cache/redux` or `./local-cache/zustand`) the platform
// carries: `LocalCacheProvider` puts it in a context, and `useSelector` reads the store through it.
// The UI imports no local cache package, so a page holds one.

/** Reads the local cache state, re-rendering when the selected value changes (by `equalityFn`, `Object.is` by default). */
export type LocalCacheSelectorHook = <T>(
  selector: (state: StateWithUndoRedo) => T,
  equalityFn?: (left: T, right: T) => boolean,
) => T;

/** How React reaches the store of a local cache implementation. */
export interface LocalCacheBinding {
  readonly kind: LocalCacheKind;
  /** Puts the store (`LocalCacheInterface.getInnerStore()`) in the implementation's own context. */
  Provider: ComponentType<{ store: any; children?: ReactNode }>;
  useSelector: LocalCacheSelectorHook;
}

const LocalCacheBindingContext = createContext<LocalCacheBinding | null>(null);

export interface LocalCacheProviderProps {
  /** The binding of the local cache `store` belongs to: `MiroirClientPlatform.localCacheBinding`. */
  binding: LocalCacheBinding;
  /** `domainController.getLocalCache().getInnerStore()` */
  store: any;
  children?: ReactNode;
}

/** Provides a local cache store to `useSelector` and the components below. */
export function LocalCacheProvider({ binding, store, children }: LocalCacheProviderProps) {
  return createElement(
    LocalCacheBindingContext.Provider,
    { value: binding },
    createElement(binding.Provider, { store }, children),
  );
}

/** The binding `LocalCacheProvider` put in context. */
export function useLocalCacheBinding(): LocalCacheBinding {
  const binding = useContext(LocalCacheBindingContext);
  if (!binding) {
    throw new Error("useSelector must be used within a LocalCacheProvider, given the binding of its local cache");
  }
  return binding;
}

/**
 * Selects from the local cache state. One binding per page, fixed by `LocalCacheProvider`, so its hook
 * is called on every render in the same order (rules of hooks).
 */
export const useSelector: LocalCacheSelectorHook = (selector, equalityFn) =>
  useLocalCacheBinding().useSelector(selector, equalityFn);

/** Equal when both hold the same keys with `Object.is`-equal values (react-redux's `shallowEqual`). */
export function shallowEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) {
    return false;
  }
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) {
    return false;
  }
  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      Object.is((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
  );
}
