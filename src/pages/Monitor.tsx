import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, CheckCircle, Trash2, Play, FileText } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { apiService, OrderEntry } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [orderMedia, setOrderMedia] = useState<{[key: string]: any[]}>({});
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
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
    // Load column settings and orders from localStorage
    loadColumnSettings();
    loadOrders();
    loadOrderMedia();
    
    // Set up an interval to update the timers every second
    const intervalId = setInterval(() => {
      forceUpdate({});
    }, 1000); // Update every second for time display
    
    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Load orders from PostgreSQL
  const loadOrders = async () => {
    try {
      const response = await apiService.getOrders();
      if (response.success && response.orders) {
        const orders = response.orders.map(order => ({
          ...order,
          zeitstempel: new Date(order.zeitstempel)
        }));
        
        // Split orders by priority
        const prio1 = orders.filter((order: OrderEntry) => order.prioritaet === 1);
        const prio2 = orders.filter((order: OrderEntry) => order.prioritaet === 2);
        
        // Sort orders by timestamp (oldest first)
        prio1.sort((a: OrderEntry, b: OrderEntry) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        prio2.sort((a: OrderEntry, b: OrderEntry) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        
        setPrio1Orders(prio1);
        setPrio2Orders(prio2);
      } else {
        setPrio1Orders([]);
        setPrio2Orders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setPrio1Orders([]);
      setPrio2Orders([]);
    }
  };

  // Load column settings from localStorage
  const loadColumnSettings = () => {
    try {
      const settingsStr = localStorage.getItem('columnSettings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        // Sort by display position
        settings.sort((a: ColumnSetting, b: ColumnSetting) => 
          a.displayPosition - b.displayPosition
        );
        setColumnSettings(settings);
      } else {
        setColumnSettings([]);
      }
    } catch (error) {
      console.error('Error loading column settings:', error);
      setColumnSettings([]);
    }
  };

  // Load order media from PostgreSQL
  const loadOrderMedia = async () => {
    try {
      const response = await apiService.getMedia();
      if (response.success && response.media) {
        // Group media by order number
        const mediaByOrder: {[key: string]: any[]} = {};
        response.media.forEach(media => {
          if (!mediaByOrder[media.auftragsnummer]) {
            mediaByOrder[media.auftragsnummer] = [];
          }
          mediaByOrder[media.auftragsnummer].push(media);
        });

        setOrderMedia(mediaByOrder);
      }
    } catch (error) {
      console.error('Error loading order media:', error);
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
      // Clear the input field when order is not found
      setBarcodeValue('');
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
    
    // Convert to minutes, hours, and days
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format the string based on whether it's more or less than 24 hours
    if (days > 0) {
      return `${days} Tag${days > 1 ? 'e' : ''}, ${hours} Stunden, ${minutes} Minuten`;
    } else {
      return `${hours} Stunden, ${minutes} Minuten`;
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
      // Mark order as complete in PostgreSQL
      const response = await apiService.completeOrder(order.auftragsnummer);
      if (response.success) {
        // Reload orders after completion
        await loadOrders();
        toast(`Auftrag ${order.auftragsnummer} wurde abgeschlossen`, { duration: 3000 });
      } else {
        toast(`Fehler beim Abschließen: ${response.error}`, { duration: 3000 });
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast("Fehler beim Abschließen des Auftrags", {
        duration: 3000,
      });
    }
  };

  // Function to delete an order (mark as canceled)
  const deleteOrder = (order: OrderEntry) => {
    try {
      // Get current orders from localStorage
      const ordersStr = localStorage.getItem('orders');
      if (!ordersStr) return;
      
      const orders = JSON.parse(ordersStr, (key, value) => {
        if (key === 'zeitstempel') {
          return new Date(value);
        }
        return value;
      });
      
      // Remove the specific order by matching multiple criteria to ensure uniqueness
      const updatedOrders = orders.filter((o: OrderEntry) => 
        !(o.auftragsnummer === order.auftragsnummer && 
          o.prioritaet === order.prioritaet && 
          o.zeitstempel.getTime() === order.zeitstempel.getTime())
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      // Add to completed orders with "abgebrochen" status
      const canceledOrder: CompletedOrderEntry = {
        ...order,
        abschlussZeitstempel: new Date(),
        aufenthaltsZeitInQS: "abgebrochen"
      };
      
      const completedOrdersStr = localStorage.getItem('completedOrders');
      let completedOrders = [];
      
      if (completedOrdersStr) {
        try {
          completedOrders = JSON.parse(completedOrdersStr, (key, value) => {
            if (key === 'zeitstempel' || key === 'abschlussZeitstempel') {
              return new Date(value);
            }
            return value;
          });
        } catch (error) {
          console.error('Error parsing completed orders:', error);
        }
      }
      
      completedOrders.push(canceledOrder);
      localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
      
      // Reload orders after deletion
      loadOrders();
      
      toast(`Auftrag ${order.auftragsnummer} wurde gelöscht`, {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast("Fehler beim Löschen des Auftrags", {
        duration: 3000,
      });
    }
  };

  // Function to open video player
  const openVideoPlayer = (videoUrl: string, auftragsnummer: string) => {
    setCurrentVideoUrl(videoUrl);
    setCurrentVideoTitle(`Video für Auftrag ${auftragsnummer}`);
    setVideoPlayerOpen(true);
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
                    <TableHead>Abteilung</TableHead>
                    <TableHead>Erstteilinformation</TableHead>
                    {columnSettings.map((column) => (
                      <TableHead key={column.id}>{column.title}</TableHead>
                    ))}
                    <TableHead>Medien</TableHead>
                    <TableHead className="w-16">Aktionen</TableHead>
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
                      <TableCell>{order.abteilung || '-'}</TableCell>
                      <TableCell>{order.zusatzinfo || '-'}</TableCell>
                      {columnSettings.map((column) => (
                        <TableCell key={`${order.auftragsnummer}-${column.id}`}>
                          {order.zusatzDaten && order.zusatzDaten[column.title]}
                        </TableCell>
                      ))}
                      <TableCell>
                        {orderMedia[order.auftragsnummer] && (
                          <div className="flex gap-1">
                            {orderMedia[order.auftragsnummer].map((media, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (media.file_type === 'video') {
                                    openVideoPlayer(media.file_path, order.auftragsnummer);
                                  } else if (media.file_type === 'text') {
                                    toast(media.content, { duration: 5000 });
                                  }
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {media.file_type === 'video' ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {media.file_type === 'video' ? 'Video abspielen' : 'Text anzeigen'}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOrder(order)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Auftrag löschen</span>
                        </Button>
                      </TableCell>
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
                    <TableHead>Abteilung</TableHead>
                    <TableHead>Erstteilinformation</TableHead>
                    {columnSettings.map((column) => (
                      <TableHead key={column.id}>{column.title}</TableHead>
                    ))}
                    <TableHead>Medien</TableHead>
                    <TableHead className="w-16">Aktionen</TableHead>
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
                      <TableCell>{order.abteilung || '-'}</TableCell>
                      <TableCell>{order.zusatzinfo || '-'}</TableCell>
                      {columnSettings.map((column) => (
                        <TableCell key={`${order.auftragsnummer}-${column.id}`}>
                          {order.zusatzDaten && order.zusatzDaten[column.title]}
                        </TableCell>
                      ))}
                      <TableCell>
                        {orderMedia[order.auftragsnummer] && (
                          <div className="flex gap-1">
                            {orderMedia[order.auftragsnummer].map((media, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (media.file_type === 'video') {
                                    openVideoPlayer(media.file_path, order.auftragsnummer);
                                  } else if (media.file_type === 'text') {
                                    toast(media.content, { duration: 5000 });
                                  }
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {media.file_type === 'video' ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {media.file_type === 'video' ? 'Video abspielen' : 'Text anzeigen'}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOrder(order)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Auftrag löschen</span>
                        </Button>
                      </TableCell>
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

      {/* Video Player Dialog */}
      <Dialog open={videoPlayerOpen} onOpenChange={setVideoPlayerOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>{currentVideoTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            {currentVideoUrl && (
              <video
                src={currentVideoUrl}
                controls
                className="max-w-full max-h-full rounded-lg"
                autoPlay
              >
                Ihr Browser unterstützt das Video-Element nicht.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Monitor;
