
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  appVersion: () => ipcRenderer.invoke('get-app-version'),
  systemInfo: () => ipcRenderer.invoke('get-system-info'),
  // Add more methods as needed for your application
});
