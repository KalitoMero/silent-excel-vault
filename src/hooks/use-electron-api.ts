
import { useCallback, useState, useEffect } from 'react';

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

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export function useElectronApi() {
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [isElectronError, setIsElectronError] = useState<boolean>(false);

  useEffect(() => {
    try {
      setIsElectron(!!window.electron);
    } catch (error) {
      console.error("Error detecting Electron environment:", error);
      setIsElectronError(true);
    }
  }, []);

  const getAppVersion = useCallback(async (): Promise<string> => {
    if (!window.electron) {
      return 'Not running in Electron';
    }
    try {
      return await window.electron.appVersion();
    } catch (error) {
      console.error('Error getting app version:', error);
      return 'Error getting version';
    }
  }, []);

  const getSystemInfo = useCallback(async () => {
    if (!window.electron) {
      return {
        platform: 'browser',
        arch: 'unknown',
        version: 'unknown',
        electronVersion: 'N/A',
      };
    }
    try {
      return await window.electron.systemInfo();
    } catch (error) {
      console.error('Error getting system info:', error);
      return {
        platform: 'error',
        arch: 'error',
        version: 'error',
        electronVersion: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  return {
    isElectron,
    isElectronError,
    getAppVersion,
    getSystemInfo
  };
}
