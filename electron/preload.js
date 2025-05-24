
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  appVersion: () => ipcRenderer.invoke('get-app-version'),
  systemInfo: () => ipcRenderer.invoke('get-system-info')
});
