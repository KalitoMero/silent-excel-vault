
import { useCallback, useState, useEffect } from 'react';

// Define the ElectronAPI interface to match our preload script
interface ElectronAPI {
  appVersion: () => Promise<string>;
  systemInfo: () => Promise<{
    platform: string;
    arch: string;
    version: string;
    electronVersion: string;
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
    setIsElectron(!!window.electron);
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
      electronVersion: 'N/A'
    };
  }, []);

  return {
    isElectron,
    getAppVersion,
    getSystemInfo
  };
}
