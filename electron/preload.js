
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  appVersion: async () => {
    try {
      return await ipcRenderer.invoke('get-app-version');
    } catch (error) {
      console.error('Error in appVersion:', error);
      return 'Error: ' + error.message;
    }
  },
  systemInfo: async () => {
    try {
      return await ipcRenderer.invoke('get-system-info');
    } catch (error) {
      console.error('Error in systemInfo:', error);
      return {
        platform: 'error',
        arch: 'error',
        version: 'error',
        electronVersion: 'error',
        error: error.message
      };
    }
  },
});
