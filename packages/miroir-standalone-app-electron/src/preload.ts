import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example API methods that can be used by the renderer process
  platform: process.platform,

  // ── Miroir IPC bridge ─────────────────────────────────────────────────────
  // Routes Miroir persistence / domain-controller calls to the main process
  // instead of going through HTTP.  The payload shape is defined in
  // ipcServerSetup.ts (types: 'rest-call', 'server-action', 'server-query').
  callMiroirIpc: (payload: unknown) => ipcRenderer.invoke('miroir-ipc', payload),

  // Returns the assets base path used by the main process for store path resolution.
  // Dev: absolute path to the monorepo packages/ directory.
  // Prod: <resourcesPath>/miroir-assets/
  getAssetsBasePath: () => ipcRenderer.invoke('get-assets-base-path'),

  // File system operations (if needed)
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content: string) => ipcRenderer.invoke('dialog:saveFile', content),

  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Event listeners
  onWindowEvent: (callback: (event: string) => void) => {
    ipcRenderer.on('window-event', (_event: IpcRendererEvent, eventType: string) => callback(eventType));
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Types for the exposed API
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      /** Routes a Miroir IPC payload to the main process and returns the result. */
      callMiroirIpc: (payload: unknown) => Promise<unknown>;
      /** Returns the assets base path for store directory resolution. */
      getAssetsBasePath: () => Promise<string>;
      openFile: () => Promise<string | null>;
      saveFile: (content: string) => Promise<boolean>;
      getVersion: () => Promise<string>;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      onWindowEvent: (callback: (event: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
