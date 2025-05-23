
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object to avoid
// automatic garbage collection
let mainWindow;

function createWindow() {
  try {
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
      ? 'http://localhost:8080' // Development server from Vite
      : `file://${path.join(__dirname, '../dist/index.html')}`; // Production build
    
    console.log('Loading URL:', startUrl);
    
    mainWindow.loadURL(startUrl).catch(err => {
      console.error('Failed to load app:', err);
    });

    // Open DevTools in development mode
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  try {
    createWindow();
  } catch (error) {
    console.error('Error in whenReady:', error);
  }
}).catch(err => {
  console.error('App ready error:', err);
});

// Quit when all windows are closed
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

// IPC handlers
ipcMain.handle('get-app-version', () => {
  try {
    return app.getVersion();
  } catch (error) {
    console.error('Error getting app version:', error);
    return 'Error getting version';
  }
});

// Example IPC handler for data operations
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
