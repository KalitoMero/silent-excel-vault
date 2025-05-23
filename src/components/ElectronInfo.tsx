
import React, { useEffect, useState } from 'react';
import { useElectronApi } from '@/hooks/use-electron-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isElectron) {
      fetchAppVersion();
    }
  }, [isElectron]);

  const fetchAppVersion = async () => {
    try {
      const version = await getAppVersion();
      setAppVersion(version);
    } catch (err) {
      setError('Failed to fetch app version');
      console.error(err);
    }
  };

  const fetchSystemInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      setError('Failed to fetch system info');
      console.error('Failed to fetch system info:', err);
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
        
        {error && <p className="text-sm text-red-500">{error}</p>}
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[220px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        ) : systemInfo ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">System-Informationen:</p>
            <ul className="text-sm space-y-1">
              <li>Plattform: {systemInfo.platform}</li>
              <li>Architektur: {systemInfo.arch}</li>
              <li>Node.js-Version: {systemInfo.version}</li>
              <li>Electron-Version: {systemInfo.electronVersion}</li>
            </ul>
          </div>
        ) : null}
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
