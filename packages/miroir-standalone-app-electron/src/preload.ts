import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example API methods that can be used by the renderer process
  platform: process.platform,
  
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
