
import { useCallback, useState, useEffect } from 'react';

// Define the ElectronAPI interface to match our preload script
interface ElectronAPI {
  appVersion: () => Promise<string>;
  systemInfo: () => Promise<{
    platform: string;
    arch: string;
    version: string;
    electronVersion: string;
    error?: string;
  }>;
}

// Extend the Window interface
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export function useElectronApi() {
  const [isElectron, setIsElectron] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're running in Electron environment
    const checkElectron = () => {
      try {
        setIsElectron(!!window.electron);
      } catch (error) {
        console.error('Error checking Electron environment:', error);
        setIsElectron(false);
      }
    };
    
    checkElectron();
  }, []);

  const getAppVersion = useCallback(async () => {
    try {
      if (window.electron) {
        return await window.electron.appVersion();
      }
    } catch (error) {
      console.error('Failed to get app version:', error);
    }
    return 'Not running in Electron';
  }, []);

  const getSystemInfo = useCallback(async () => {
    try {
      if (window.electron) {
        return await window.electron.systemInfo();
      }
    } catch (error) {
      console.error('Failed to get system info:', error);
    }
    return {
      platform: 'browser',
      arch: 'unknown',
      version: 'unknown',
      electronVersion: 'N/A',
      error: 'Not running in Electron environment'
    };
  }, []);

  return {
    isElectron,
    getAppVersion,
    getSystemInfo
  };
}
