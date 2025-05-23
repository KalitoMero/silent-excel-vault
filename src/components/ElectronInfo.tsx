
import React, { useEffect, useState } from 'react';
import { useElectronApi } from '@/hooks/use-electron-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  electronVersion: string;
}

export function ElectronInfo() {
  const { isElectron, getAppVersion, getSystemInfo } = useElectronApi();
  const [appVersion, setAppVersion] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isElectron) {
      fetchAppVersion();
    }
  }, [isElectron]);

  const fetchAppVersion = async () => {
    const version = await getAppVersion();
    setAppVersion(version);
  };

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Browserumgebung</CardTitle>
          <CardDescription>Diese App läuft aktuell im Browser, nicht in Electron.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Electron-Informationen</CardTitle>
        <CardDescription>Informationen über die Electron-Umgebung</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">App-Version:</p>
          <p className="text-sm">{appVersion || 'Wird geladen...'}</p>
        </div>
        
        {systemInfo && (
          <div className="space-y-2">
            <p className="text-sm font-medium">System-Informationen:</p>
            <ul className="text-sm space-y-1">
              <li>Plattform: {systemInfo.platform}</li>
              <li>Architektur: {systemInfo.arch}</li>
              <li>Node.js-Version: {systemInfo.version}</li>
              <li>Electron-Version: {systemInfo.electronVersion}</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={fetchSystemInfo} 
          disabled={loading}
        >
          {loading ? 'Wird geladen...' : 'System-Informationen abrufen'}
        </Button>
      </CardFooter>
    </Card>
  );
}
