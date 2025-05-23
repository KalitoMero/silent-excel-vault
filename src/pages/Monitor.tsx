
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, CheckCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';

export interface OrderEntry {
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
  zusatzDaten?: Record<string, any>;
}

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
    // Load column settings
    const savedColumnSettings = localStorage.getItem('columnSettings');
    if (savedColumnSettings) {
      try {
        const parsedSettings = JSON.parse(savedColumnSettings);
        // Sort by display position
        parsedSettings.sort((a: ColumnSetting, b: ColumnSetting) => 
          a.displayPosition - b.displayPosition
        );
        setColumnSettings(parsedSettings);
      } catch (error) {
        console.error("Failed to parse column settings:", error);
      }
    }

    // Load orders from localStorage on component mount
    const loadOrders = () => {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const parsedOrders: OrderEntry[] = JSON.parse(savedOrders, (key, value) => {
          // Convert ISO string back to Date object for zeitstempel
          if (key === 'zeitstempel') return new Date(value);
          return value;
        });
        
        // Split orders by priority
        const prio1 = parsedOrders.filter(order => order.prioritaet === 1);
        const prio2 = parsedOrders.filter(order => order.prioritaet === 2);
        
        // Sort orders by timestamp (oldest first)
        prio1.sort((a, b) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        prio2.sort((a, b) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        
        setPrio1Orders(prio1);
        setPrio2Orders(prio2);
      }
    };

    loadOrders();
    
    // Set up an interval to update the timers every second
    const intervalId = setInterval(() => {
      forceUpdate({});
    }, 1000);
    
    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

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

  // Function to handle barcode scan completion
  const handleBarcodeScan = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const auftragsnummer = barcodeValue.trim();
      
      if (!auftragsnummer) {
        toast("Bitte geben Sie eine Betriebsauftragsnummer ein");
        return;
      }
      
      // Search for the order in Prio 1 and Prio 2 lists
      const allOrders = [...prio1Orders, ...prio2Orders];
      const orderToComplete = allOrders.find(order => order.auftragsnummer === auftragsnummer);
      
      if (orderToComplete) {
        completeOrder(orderToComplete);
        setBarcodeValue('');
        toast(`Auftrag ${auftragsnummer} wurde als abgeschlossen markiert`, {
          duration: 3000,
        });
      } else {
        toast(`Auftrag ${auftragsnummer} nicht gefunden`, {
          duration: 3000,
        });
        setBarcodeValue('');
      }
    }
  };

  // Function to mark an order as completed
  const completeOrder = (order: OrderEntry) => {
    const now = new Date();
    const completedOrder: CompletedOrderEntry = {
      ...order,
      abschlussZeitstempel: now,
      aufenthaltsZeitInQS: calculateTimeInQS(order.zeitstempel)
    };
    
    // Save to archive
    saveToArchive(completedOrder);
    
    // Remove from active orders
    removeFromActiveOrders(order.auftragsnummer);
  };

  // Save completed order to archive
  const saveToArchive = (completedOrder: CompletedOrderEntry) => {
    const existingArchive = localStorage.getItem('completedOrders');
    let archive: CompletedOrderEntry[] = existingArchive 
      ? JSON.parse(existingArchive)
      : [];
    
    archive.push(completedOrder);
    localStorage.setItem('completedOrders', JSON.stringify(archive));
  };

  // Remove order from active orders
  const removeFromActiveOrders = (auftragsnummer: string) => {
    // Update state
    setPrio1Orders(prev => prev.filter(order => order.auftragsnummer !== auftragsnummer));
    setPrio2Orders(prev => prev.filter(order => order.auftragsnummer !== auftragsnummer));
    
    // Update localStorage
    const existingOrders = localStorage.getItem('orders');
    if (existingOrders) {
      const orders: OrderEntry[] = JSON.parse(existingOrders);
      const updatedOrders = orders.filter(order => order.auftragsnummer !== auftragsnummer);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
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
                Barcode scannen oder Betriebsauftragsnummer eingeben:
              </label>
              <Input
                id="barcode"
                type="text"
                placeholder="Betriebsauftragsnummer scannen..."
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                onKeyDown={handleBarcodeScan}
                className="font-mono text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Scannen Sie den Barcode oder geben Sie die Nummer ein und drücken Sie Enter, um den Auftrag abzuschließen.
              </p>
            </div>
          </CardContent>
        </Card>
        
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
      </div>
    </div>
  );
};

export default Monitor;
