import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import { SELF_TEST_RESULT_CHANNEL } from './selfTestMain.js';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example API methods that can be used by the renderer process
  platform: process.platform,

  // ── Miroir IPC bridge ─────────────────────────────────────────────────────
  // Routes Miroir persistence / domain-controller calls to the main process
  // instead of going through HTTP.  The payload shape is defined in
  // ipcServerSetup.ts (types: 'rest-call', 'server-action', 'server-query',
  // 'get-client-config').
  callMiroirIpc: (payload: unknown) => ipcRenderer.invoke('miroir-ipc', payload),

  // Returns the root of the environment the main process runs (#345), for diagnostics.
  // Dev: the repository root. Packaged: <userData>/miroir.
  getAssetsBasePath: () => ipcRenderer.invoke('get-assets-base-path'),

  // #487: the final self-test result, for the main process run with --self-test.
  reportSelfTestResult: (result: unknown) => ipcRenderer.send(SELF_TEST_RESULT_CHANNEL, result),

  // // Returns the platform-appropriate default filesystem folder (os.homedir()).
  // // Used by Runner_CreateApplication / Runner_InstallApplication to pre-populate
  // // the default target directory for filesystem / indexedDb deployments.
  // getDefaultFilesystemFolder: () => ipcRenderer.invoke('get-default-filesystem-folder'),

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
      /** #487: sends the final self-test result to the main process. */
      reportSelfTestResult: (result: unknown) => void;
      /** Returns the platform home directory as default for filesystem/indexedDb deployment paths. */
      getDefaultFilesystemFolder: () => Promise<string>;
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
