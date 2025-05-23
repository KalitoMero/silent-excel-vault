
import { useState, useEffect } from 'react';
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
import { Plus, Save, Home } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ColumnSetting {
  id: string;
  columnNumber: number;
  title: string;
  displayPosition: number;
}

interface ExcelSettings {
  auftragsnummerColumn: number;
}

const Einstellungen = () => {
  const { toast } = useToast();
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([]);
  const [excelSettings, setExcelSettings] = useState<ExcelSettings>({
    auftragsnummerColumn: 1
  });

  // Load saved settings from localStorage when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('columnSettings');
    if (savedSettings) {
      try {
        setColumnSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }

    const savedExcelSettings = localStorage.getItem('excelSettings');
    if (savedExcelSettings) {
      try {
        setExcelSettings(JSON.parse(savedExcelSettings));
      } catch (error) {
        console.error("Failed to parse Excel settings:", error);
      }
    }
  }, []);

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

  const saveSettings = () => {
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
    
    // Save column settings to localStorage
    localStorage.setItem('columnSettings', JSON.stringify(columnSettings));
    
    // Save excel settings to localStorage
    localStorage.setItem('excelSettings', JSON.stringify(excelSettings));
    
    toast({
      title: "Einstellungen gespeichert",
      description: "Ihre Einstellungen wurden erfolgreich gespeichert."
    });
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

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Einstellungen</h1>
        
        <Tabs defaultValue="columns" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="excel">Excel-Einstellungen</TabsTrigger>
            <TabsTrigger value="columns">Spalteneinstellungen</TabsTrigger>
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
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Einstellungen speichern
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
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Einstellungen speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Einstellungen;
