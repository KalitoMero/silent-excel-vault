import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, CheckCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { apiService, OrderEntry } from '@/services/api';

export interface CompletedOrderEntry extends OrderEntry {
  abschlussZeitstempel: Date;
  aufenthaltsZeitInQS: string;
}

interface ColumnSetting {
  id: string;
  columnNumber: number;
  title: string;
  displayPosition: number;
}

const Monitor = () => {
  const [prio1Orders, setPrio1Orders] = useState<OrderEntry[]>([]);
  const [prio2Orders, setPrio2Orders] = useState<OrderEntry[]>([]);
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([]);
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [, forceUpdate] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoReturn = searchParams.get('autoReturn') === 'true';
  
  // Add a ref to store barcode input
  const barcodeInputRef = useRef<string>('');
  // Add a timeout ref for barcode detection
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Auto-return to home page after 15 seconds if autoReturn is true
    if (autoReturn) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [autoReturn, navigate]);

  useEffect(() => {
    // Load column settings and orders from API
    loadColumnSettings();
    loadOrders();
    
    // Set up an interval to update the timers every second and reload orders
    const intervalId = setInterval(() => {
      forceUpdate({});
      loadOrders(); // Reload orders to get fresh data
    }, 5000); // Reload every 5 seconds
    
    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Load orders from API
  const loadOrders = async () => {
    try {
      const response = await apiService.getOrders();
      if (response.success && response.orders) {
        // Convert timestamp strings back to Date objects
        const orders = response.orders.map(order => ({
          ...order,
          zeitstempel: new Date(order.zeitstempel)
        }));
        
        // Split orders by priority
        const prio1 = orders.filter(order => order.prioritaet === 1);
        const prio2 = orders.filter(order => order.prioritaet === 2);
        
        // Sort orders by timestamp (oldest first)
        prio1.sort((a, b) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        prio2.sort((a, b) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        
        setPrio1Orders(prio1);
        setPrio2Orders(prio2);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Load column settings from API
  const loadColumnSettings = async () => {
    try {
      const response = await apiService.getColumnSettings();
      if (response.success && response.settings) {
        // Sort by display position
        const settings = response.settings.sort((a: ColumnSetting, b: ColumnSetting) => 
          a.displayPosition - b.displayPosition
        );
        setColumnSettings(settings);
      }
    } catch (error) {
      console.error('Error loading column settings:', error);
    }
  };

  // Add a new useEffect for capturing barcode scans
  useEffect(() => {
    // Function to handle keyboard events for barcode scanning
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if the user is typing in an input field
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If it's the Enter key and we have collected characters, process as barcode
      if (event.key === 'Enter' && barcodeInputRef.current) {
        const scannedBarcode = barcodeInputRef.current.trim();
        console.log('Barcode scanned:', scannedBarcode);
        processBarcode(scannedBarcode);
        barcodeInputRef.current = ''; // Clear buffer after processing
        return;
      }

      // Reset timeout to detect end of scanning
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
      
      // Set a timeout to clear the buffer if no new characters arrive
      // (typical barcode scanners send characters very quickly)
      barcodeTimeoutRef.current = setTimeout(() => {
        barcodeInputRef.current = '';
      }, 100);

      // Only add printable characters to the buffer
      if (event.key.length === 1) {
        barcodeInputRef.current += event.key;
      }
    };

    // Add and remove the event listener
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, []);  // Empty dependency array means this effect runs once on mount

  // New function to process the barcode
  const processBarcode = async (barcode: string) => {
    if (!barcode) {
      return;
    }
    
    // Search for the order in Prio 1 and Prio 2 lists
    const allOrders = [...prio1Orders, ...prio2Orders];
    const orderToComplete = allOrders.find(order => order.auftragsnummer === barcode);
    
    if (orderToComplete) {
      await completeOrder(orderToComplete);
      setBarcodeValue(''); // Clear any value in the visible input field too
      toast(`Auftrag ${barcode} wurde als abgeschlossen markiert`, {
        duration: 3000,
      });
    } else {
      toast(`Auftrag ${barcode} nicht gefunden`, {
        duration: 3000,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const calculateTimeInQS = (zeitstempel: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - zeitstempel.getTime();
    
    // Convert to seconds, minutes, hours, and days
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format the string based on whether it's more or less than 24 hours
    if (days > 0) {
      return `${days} Tag${days > 1 ? 'e' : ''}, ${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
    } else {
      return `${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
    }
  };

  // Function to handle manual barcode entry (we'll keep this for fallback)
  const handleBarcodeScan = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const auftragsnummer = barcodeValue.trim();
      
      if (!auftragsnummer) {
        toast("Bitte geben Sie eine Betriebsauftragsnummer ein");
        return;
      }
      
      processBarcode(auftragsnummer);
    }
  };

  // Function to mark an order as completed
  const completeOrder = async (order: OrderEntry) => {
    try {
      const response = await apiService.completeOrder(order.auftragsnummer);
      
      if (response.success) {
        // Reload orders after completion
        await loadOrders();
      } else {
        throw new Error(response.error || 'Fehler beim Abschließen des Auftrags');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast("Fehler beim Abschließen des Auftrags", {
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed top-6 left-6" 
        asChild
      >
        <Link to="/">
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          Auftragsmonitor
          {autoReturn && (
            <div className="text-sm text-gray-600 font-normal mt-2">
              Automatische Rückkehr zur Hauptseite in 15 Sekunden
            </div>
          )}
        </h1>
        
        {/* Prio 1 Orders */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-amber-500 text-white">
            <CardTitle>Priorität 1</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {prio1Orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine Aufträge mit Priorität 1 vorhanden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auftragsnummer</TableHead>
                    <TableHead>Zeitstempel</TableHead>
                    <TableHead>Aufenthalt in QS</TableHead>
                    {columnSettings.map((column) => (
                      <TableHead key={column.id}>{column.title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prio1Orders.map((order, index) => (
                    <TableRow key={`${order.auftragsnummer}-${index}`}>
                      <TableCell className="font-medium">{order.auftragsnummer}</TableCell>
                      <TableCell>{formatDate(order.zeitstempel)}</TableCell>
                      <TableCell className="font-medium text-amber-600">
                        {calculateTimeInQS(order.zeitstempel)}
                      </TableCell>
                      {columnSettings.map((column) => (
                        <TableCell key={`${order.auftragsnummer}-${column.id}`}>
                          {order.zusatzDaten && order.zusatzDaten[column.title]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Prio 2 Orders */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gray-500 text-white">
            <CardTitle>Priorität 2</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {prio2Orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine Aufträge mit Priorität 2 vorhanden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auftragsnummer</TableHead>
                    <TableHead>Zeitstempel</TableHead>
                    <TableHead>Aufenthalt in QS</TableHead>
                    {columnSettings.map((column) => (
                      <TableHead key={column.id}>{column.title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prio2Orders.map((order, index) => (
                    <TableRow key={`${order.auftragsnummer}-${index}`}>
                      <TableCell className="font-medium">{order.auftragsnummer}</TableCell>
                      <TableCell>{formatDate(order.zeitstempel)}</TableCell>
                      <TableCell className="font-medium text-gray-600">
                        {calculateTimeInQS(order.zeitstempel)}
                      </TableCell>
                      {columnSettings.map((column) => (
                        <TableCell key={`${order.auftragsnummer}-${column.id}`}>
                          {order.zusatzDaten && order.zusatzDaten[column.title]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Barcode Scanner */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Auftrag abschließen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <label htmlFor="barcode" className="text-sm font-medium">
                Betriebsauftragsnummer manuell eingeben (oder einfach Barcode scannen):
              </label>
              <Input
                id="barcode"
                type="text"
                placeholder="Betriebsauftragsnummer..."
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                onKeyDown={handleBarcodeScan}
                className="font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Sie können jederzeit einen Barcode scannen, ohne dieses Feld vorher zu fokussieren.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitor;
