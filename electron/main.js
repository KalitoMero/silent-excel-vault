const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl).catch(err => {
      console.error('Failed to load app:', err);
    });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    createWindow();
  } catch (error) {
    console.error('Error in whenReady:', error);
  }
}).catch(err => {
  console.error('App ready error:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Simple IPC handlers
ipcMain.handle('get-app-version', () => {
  try {
    return app.getVersion();
  } catch (error) {
    console.error('Error getting app version:', error);
    return 'Error getting version';
  }
});

ipcMain.handle('get-system-info', () => {
  try {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      electronVersion: process.versions.electron
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      platform: 'unknown',
      arch: 'unknown',
      version: 'unknown',
      electronVersion: 'unknown',
      error: error.message
    };
  }
});
