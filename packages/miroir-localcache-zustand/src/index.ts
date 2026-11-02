/**
 * miroir-localcache-zustand
 * 
 * Zustand-based implementation of LocalCache for Miroir Framework.
 * Provides drop-in replacement for miroir-localcache-redux.
 */

// Re-export React hooks for abstraction - allows miroir-standalone-app to not depend directly on react-redux
export {
  useSelector,
  LocalCacheProvider,
  Provider,
  useLocalCacheStore,
  TypedUseSelectorHook,
} from "./react/hooks.js";

export * from "./node.js";
