
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Home, Download, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from '@/services/api';
import * as XLSX from 'xlsx';

interface ColumnSetting {
  id: string;
  columnNumber: number;
  title: string;
  displayPosition: number;
}

interface ExcelSettings {
  auftragsnummerColumn: number;
}

interface CompletedOrderEntry {
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
  abschlussZeitstempel: Date;
  aufenthaltsZeitInQS: string;
  zusatzDaten?: Record<string, any>;
}

const Einstellungen = () => {
  const { toast } = useToast();
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([]);
  const [excelSettings, setExcelSettings] = useState<ExcelSettings>({
    auftragsnummerColumn: 1
  });
  const [completedOrders, setCompletedOrders] = useState<CompletedOrderEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper functions must be defined before they are used in useMemo
  const formatTimeFromMs = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} Tag${days > 1 ? 'e' : ''}, ${hours} Stunden, ${minutes} Minuten`;
    } else {
      return `${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
    }
  };

  const calculateAverageTime = (orders: CompletedOrderEntry[]) => {
    let totalMilliseconds = 0;
    
    orders.forEach(order => {
      const startTime = order.zeitstempel.getTime();
      const endTime = order.abschlussZeitstempel.getTime();
      totalMilliseconds += (endTime - startTime);
    });
    
    const averageMs = totalMilliseconds / orders.length;
    
    // Convert average milliseconds to formatted string
    return formatTimeFromMs(averageMs);
  };

  // Load settings from API when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Load column settings from API
        const columnResult = await apiService.getColumnSettings();
        if (columnResult.success && columnResult.settings) {
          setColumnSettings(columnResult.settings);
        } else {
          console.error('Failed to load column settings:', columnResult.error);
        }

        // Load Excel settings from API
        const excelResult = await apiService.getExcelSettings();
        if (excelResult.success && excelResult.settings) {
          setExcelSettings(excelResult.settings);
        } else {
          console.error('Failed to load Excel settings:', excelResult.error);
        }

        // Load completed orders from API
        const ordersResult = await apiService.getOrders();
        if (ordersResult.success && ordersResult.orders) {
          // Filter for completed orders and convert date strings to Date objects
          const completed = ordersResult.orders
            .filter(order => order.zusatzDaten?.completed === true)
            .map(order => ({
              ...order,
              zeitstempel: new Date(order.zeitstempel),
              abschlussZeitstempel: new Date(order.zusatzDaten?.abschlussZeitstempel || order.zeitstempel),
              aufenthaltsZeitInQS: order.zusatzDaten?.aufenthaltsZeitInQS || 'Unbekannt'
            }));
          setCompletedOrders(completed);
        } else {
          console.error('Failed to load orders:', ordersResult.error);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Fehler beim Laden",
          description: "Daten konnten nicht von der Datenbank geladen werden.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Calculate statistics for completed orders
  const statistics = useMemo(() => {
    if (!completedOrders.length) {
      return {
        averagePrio1: "Keine Daten",
        averagePrio2: "Keine Daten"
      };
    }

    const prio1Orders = completedOrders.filter(order => order.prioritaet === 1);
    const prio2Orders = completedOrders.filter(order => order.prioritaet === 2);

    // Calculate average time for Prio 1
    const averagePrio1 = prio1Orders.length > 0
      ? calculateAverageTime(prio1Orders)
      : "Keine Daten";

    // Calculate average time for Prio 2
    const averagePrio2 = prio2Orders.length > 0
      ? calculateAverageTime(prio2Orders)
      : "Keine Daten";

    return {
      averagePrio1,
      averagePrio2
    };
  }, [completedOrders]);

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

  const addNewEntry = () => {
    const newId = Date.now().toString();
    const newSetting: ColumnSetting = {
      id: newId,
      columnNumber: 0,
      title: '',
      displayPosition: columnSettings.length + 1
    };
    
    setColumnSettings([...columnSettings, newSetting]);
  };

  const updateSetting = (id: string, field: keyof ColumnSetting, value: string | number) => {
    setColumnSettings(columnSettings.map(setting => 
      setting.id === id ? { ...setting, [field]: value } : setting
    ));
  };

  const removeSetting = (id: string) => {
    setColumnSettings(columnSettings.filter(setting => setting.id !== id));
  };

  const saveSettings = async () => {
    // Validate settings
    const invalidSettings = columnSettings.some(
      setting => setting.columnNumber <= 0 || !setting.title || setting.displayPosition <= 0
    );
    
    if (invalidSettings) {
      toast({
        title: "Ungültige Einstellungen",
        description: "Bitte füllen Sie alle Felder korrekt aus.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Save Excel settings to API
      const excelResult = await apiService.saveExcelSettings(excelSettings);
      if (!excelResult.success) {
        throw new Error(excelResult.error || 'Failed to save Excel settings');
      }

      // Save column settings to API (we'll need to implement this endpoint)
      // For now, we'll store them in the Excel settings as well
      const combinedSettings = {
        ...excelSettings,
        columnSettings: columnSettings
      };
      
      const columnResult = await apiService.saveExcelSettings(combinedSettings);
      if (!columnResult.success) {
        throw new Error(columnResult.error || 'Failed to save column settings');
      }
      
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Einstellungen wurden erfolgreich in der Datenbank gespeichert."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Einstellungen konnten nicht in der Datenbank gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to export completed orders to Excel
  const exportToExcel = () => {
    if (completedOrders.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Es gibt keine archivierten Aufträge zum Exportieren.",
        variant: "destructive"
      });
      return;
    }
    
    // Format data for Excel export
    const dataForExport = completedOrders.map(order => ({
      'Betriebsauftragsnummer': order.auftragsnummer,
      'Priorität': order.prioritaet,
      'Startzeit': formatDate(order.zeitstempel),
      'Endzeit': formatDate(order.abschlussZeitstempel),
      'Aufenthaltszeit in QS': order.aufenthaltsZeitInQS,
      ...order.zusatzDaten // Include additional data if available
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Archivierte Aufträge");
    
    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Archivierte_Auftraege_${currentDate}.xlsx`;
    
    // Write to file and trigger download
    XLSX.writeFile(workbook, filename);
    
    toast({
      title: "Export erfolgreich",
      description: `Die Datei "${filename}" wurde heruntergeladen.`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Daten aus der Datenbank...</p>
        </div>
      </div>
    );
  }

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

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Einstellungen</h1>
        
        <Tabs defaultValue="columns" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="excel">Excel-Einstellungen</TabsTrigger>
            <TabsTrigger value="columns">Spalteneinstellungen</TabsTrigger>
            <TabsTrigger value="archive">Archivierte Aufträge</TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle>Excel-Datei Einstellungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-2">
                    <label htmlFor="auftragsnummerColumn" className="font-medium text-sm">
                      Spaltennummer der Betriebsauftragsnummer
                    </label>
                    <Input 
                      id="auftragsnummerColumn"
                      type="number" 
                      min="1"
                      value={excelSettings.auftragsnummerColumn} 
                      onChange={(e) => setExcelSettings({...excelSettings, auftragsnummerColumn: parseInt(e.target.value) || 1})} 
                      placeholder="z.B. 1 für Spalte A"
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500">
                      Geben Sie an, in welcher Spalte der Excel-Datei die Betriebsauftragsnummer zu finden ist (z.B. 1 für Spalte A)
                    </p>
                  </div>

                  <Button 
                    onClick={saveSettings} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Speichere...' : 'Einstellungen speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="columns">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Spalteneinstellungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Legen Sie hier fest, welche Spalten aus der Excel-Datei angezeigt werden sollen und wie sie benannt werden.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Spaltennummer</TableHead>
                        <TableHead>Titel</TableHead>
                        <TableHead>Position in der Anzeige</TableHead>
                        <TableHead className="w-20">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {columnSettings.map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell>
                            <Input 
                              type="number" 
                              min="1"
                              value={setting.columnNumber || ''} 
                              onChange={(e) => updateSetting(setting.id, 'columnNumber', parseInt(e.target.value) || 0)} 
                              placeholder="z.B. 2 für Spalte B"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="text"
                              value={setting.title} 
                              onChange={(e) => updateSetting(setting.id, 'title', e.target.value)} 
                              placeholder="z.B. Artikelnummer"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              min="1"
                              value={setting.displayPosition || ''} 
                              onChange={(e) => updateSetting(setting.id, 'displayPosition', parseInt(e.target.value) || 0)} 
                              placeholder="z.B. 1 für ganz links"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removeSetting(setting.id)}
                              className="w-full"
                            >
                              Löschen
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {columnSettings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            Noch keine Einträge vorhanden. Fügen Sie einen neuen Eintrag hinzu.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={addNewEntry} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Eintrag hinzufügen
                  </Button>
                  
                  <Button 
                    onClick={saveSettings} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Speichere...' : 'Einstellungen speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Archivierte Aufträge</CardTitle>
                <Button 
                  onClick={exportToExcel} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={completedOrders.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Als Excel exportieren
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Betriebsauftragsnummer</TableHead>
                        <TableHead>Priorität</TableHead>
                        <TableHead>Startzeit</TableHead>
                        <TableHead>Endzeit</TableHead>
                        <TableHead>Aufenthaltszeit in QS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedOrders.length > 0 ? (
                        completedOrders.map((order, index) => (
                          <TableRow key={`${order.auftragsnummer}-${index}`}>
                            <TableCell className="font-medium">{order.auftragsnummer}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.prioritaet === 1 
                                    ? "bg-amber-100 text-amber-800" 
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.prioritaet}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(order.zeitstempel)}</TableCell>
                            <TableCell>{formatDate(order.abschlussZeitstempel)}</TableCell>
                            <TableCell>{order.aufenthaltsZeitInQS}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                            Keine archivierten Aufträge vorhanden.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <Card className="shadow-md">
                    <CardHeader className="bg-amber-100">
                      <CardTitle className="text-lg">Durchschnittliche Aufenthaltszeit - Priorität 1</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-2xl font-bold text-amber-600">{statistics.averagePrio1}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-md">
                    <CardHeader className="bg-gray-100">
                      <CardTitle className="text-lg">Durchschnittliche Aufenthaltszeit - Priorität 2</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-2xl font-bold text-gray-600">{statistics.averagePrio2}</p>
                    </CardContent>
                  </Card>
                </div>

                {completedOrders.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <Button 
                      onClick={exportToExcel} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Als Excel exportieren
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Einstellungen;
