import { useState, useEffect } from 'react';
import { devRelativePathPrefix } from 'miroir-core';

// Module-level cache so all hook instances share one fetch
let cachedRoot: string | undefined;
let fetchPromise: Promise<string | undefined> | undefined;

async function fetchFilesystemRoot(): Promise<string | undefined> {
  if (cachedRoot !== undefined) return cachedRoot;
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.getDefaultFilesystemFolder) {
        cachedRoot = await (window as any).electronAPI.getDefaultFilesystemFolder();
      } else {
        const resp = await fetch('/api/serverConfig');
        const cfg = await resp.json();
        cachedRoot = cfg.filesystemDeploymentRootDirectory;
      }
    } catch {
      cachedRoot = devRelativePathPrefix;
    }
    return cachedRoot;
  })();
  return fetchPromise;
}

/**
 * Returns the filesystem deployment root directory as configured on the server
 * (or Electron main process). Returns undefined until the value is loaded,
 * then returns the cached value on subsequent calls.
 */
export function useServerFilesystemRoot(): string | undefined {
  const [root, setRoot] = useState<string | undefined>(cachedRoot);
  useEffect(() => {
    if (cachedRoot !== undefined) {
      setRoot(cachedRoot);
      return;
    }
    fetchFilesystemRoot().then(setRoot);
  }, []);
  return root;
}
