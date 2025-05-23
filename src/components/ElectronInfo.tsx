
import React, { useEffect, useState } from 'react';
import { useElectronApi } from '@/hooks/use-electron-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  electronVersion: string;
  error?: string;
}

export function ElectronInfo() {
  const { isElectron, getAppVersion, getSystemInfo } = useElectronApi();
  const [appVersion, setAppVersion] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (isElectron) {
          const version = await getAppVersion();
          setAppVersion(version);
        }
      } catch (err) {
        console.error('Failed to initialize ElectronInfo:', err);
        setError(err instanceof Error ? err.message : 'Unknown error during initialization');
      }
    };
    
    init();
  }, [isElectron, getAppVersion]);

  const fetchSystemInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
      if (info.error) {
        setError(info.error);
      }
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching system info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>
          {isElectron ? 'Electron-Informationen' : 'Browserumgebung'}
        </CardTitle>
        <CardDescription>
          {isElectron 
            ? 'Informationen über die Electron-Umgebung'
            : 'Diese App läuft aktuell im Browser, nicht in Electron.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isElectron && (
          <div>
            <p className="text-sm font-medium">App-Version:</p>
            <p className="text-sm">{appVersion || 'Wird geladen...'}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
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
      
      {isElectron && (
        <CardFooter>
          <Button 
            onClick={fetchSystemInfo} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Wird geladen...' : 'System-Informationen abrufen'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
