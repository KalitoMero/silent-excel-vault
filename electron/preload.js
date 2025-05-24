
const { contextBridge, ipcRenderer } = require('electron');

// Simple preload without native dependencies
contextBridge.exposeInMainWorld('electron', {
  appVersion: () => ipcRenderer.invoke('get-app-version'),
  systemInfo: () => ipcRenderer.invoke('get-system-info')
});
