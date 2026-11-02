/**
 * React hooks for Zustand-based local cache.
 * Provides useSelector and LocalCacheProvider for React integration.
 */
import { createContext, useContext, createElement, ReactNode, useRef, useMemo } from "react";
import type { StoreApi } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

import { LocalCacheStore } from "../4_services/localCache/UndoRedoStore.js";
import { ZustandStateWithUndoRedo } from "../4_services/localCache/localCacheZustandInterface.js";

// ###############################################################################
// Create context for the store
// ###############################################################################
const LocalCacheContext = createContext<StoreApi<LocalCacheStore> | null>(null);

// ###############################################################################
// Provider component
// ###############################################################################
export interface LocalCacheProviderProps {
  store: StoreApi<LocalCacheStore>;
  children: ReactNode;
}

export function LocalCacheProvider({ store, children }: LocalCacheProviderProps) {
  return createElement(LocalCacheContext.Provider, { value: store }, children);
}

// ###############################################################################
// useSelector hook - compatible with React-Redux API
// ###############################################################################
export function useSelector<T>(
  selector: (state: ZustandStateWithUndoRedo) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  const store = useContext(LocalCacheContext);
  
  if (!store) {
    throw new Error(
      "useSelector must be used within a LocalCacheProvider. " +
      "Make sure you have wrapped your component tree with <LocalCacheProvider store={...}>."
    );
  }

  // One hook call whatever the arguments (rules of hooks); without equalityFn, Object.is as useStore
  return useStoreWithEqualityFn(store, selector, equalityFn);
}

// ###############################################################################
// useStore hook - direct access to store
// ###############################################################################
export function useLocalCacheStore(): StoreApi<LocalCacheStore> {
  const store = useContext(LocalCacheContext);
  
  if (!store) {
    throw new Error(
      "useLocalCacheStore must be used within a LocalCacheProvider."
    );
  }

  return store;
}

// ###############################################################################
// Typed useSelector hook for better TypeScript inference
// ###############################################################################
export type TypedUseSelectorHook = typeof useSelector;

// ###############################################################################
// Re-export for compatibility with Redux patterns
// ###############################################################################
export { LocalCacheProvider as Provider };
