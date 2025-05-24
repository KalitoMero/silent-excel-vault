
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
  const { isElectron, isElectronError, getAppVersion, getSystemInfo } = useElectronApi();
  const [appVersion, setAppVersion] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (isElectron) {
        try {
          const version = await getAppVersion();
          setAppVersion(version);
        } catch (err) {
          console.error('Error getting app version:', err);
          setError('Failed to get app version');
        }
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
    } catch (err) {
      console.error('Error fetching system info:', err);
      setError('Failed to fetch system info');
    } finally {
      setLoading(false);
    }
  };

  if (isElectronError) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Electron Environment Error</CardTitle>
          <CardDescription>
            There was an error detecting the Electron environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Failed to initialize Electron API. This may be due to running in a browser or a configuration issue.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>
          {isElectron ? 'Electron Information' : 'Browser Environment'}
        </CardTitle>
        <CardDescription>
          {isElectron 
            ? 'Information about the Electron environment'
            : 'This app is currently running in the browser, not in Electron.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isElectron && (
          <div>
            <p className="text-sm font-medium">App Version:</p>
            <p className="text-sm">{appVersion || 'Loading...'}</p>
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
            <p className="text-sm font-medium">System Information:</p>
            <ul className="text-sm space-y-1">
              <li>Platform: {systemInfo.platform}</li>
              <li>Architecture: {systemInfo.arch}</li>
              <li>Node.js Version: {systemInfo.version}</li>
              <li>Electron Version: {systemInfo.electronVersion}</li>
              {systemInfo.error && (
                <li className="text-red-600">Error: {systemInfo.error}</li>
              )}
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
            {loading ? 'Loading...' : 'Get System Info'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
