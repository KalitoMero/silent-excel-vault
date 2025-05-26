
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { apiService, OrderEntry } from '@/services/api';

const PrioAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';

  const handlePrioSelect = async (prio: number) => {
    if (!auftragsnummer) {
      toast("Fehler: Keine Auftragsnummer gefunden", {
        duration: 2000,
      });
      return;
    }

    try {
      // Create new order entry
      const newOrder: OrderEntry = {
        auftragsnummer,
        prioritaet: prio as 1 | 2,
        zeitstempel: new Date(),
        zusatzDaten: {}
      };

      // Get Excel data to find additional information
      const excelResponse = await apiService.getExcelData();
      
      if (excelResponse.success && excelResponse.data) {
        // Get Excel settings and column settings to match additional data
        const excelSettingsResponse = await apiService.getExcelSettings();
        const columnSettingsResponse = await apiService.getColumnSettings();
        
        if (excelSettingsResponse.success && columnSettingsResponse.success) {
          const excelSettings = excelSettingsResponse.settings || { auftragsnummerColumn: 1 };
          const columnSettings = columnSettingsResponse.settings || [];
          
          // Find the row with the matching Betriebsauftragsnummer
          const auftragsnummerColIndex = excelSettings.auftragsnummerColumn - 1;
          
          const foundRow = excelResponse.data.find((row: any[]) => 
            row[auftragsnummerColIndex] && 
            row[auftragsnummerColIndex].toString() === auftragsnummer
          );
          
          if (foundRow) {
            // Extract additional column data
            columnSettings.forEach((setting: any) => {
              const colIndex = setting.columnNumber - 1;
              if (colIndex >= 0 && colIndex < foundRow.length) {
                newOrder.zusatzDaten[setting.title] = foundRow[colIndex];
              }
            });
            
            console.log(`Auftrag ${auftragsnummer} wurde in Excel-Daten gefunden.`);
          } else {
            console.log(`Auftrag ${auftragsnummer} wurde nicht in Excel-Daten gefunden.`);
          }
        }
      }

      // Save order to database via API
      const saveResponse = await apiService.saveOrder(newOrder);
      
      if (saveResponse.success) {
        console.log(`Auftragsnummer ${auftragsnummer} mit Priorität ${prio} erfolgreich gespeichert`);
        
        // Show success confirmation toast
        toast(`Auftrag erfolgreich in Prio ${prio} übernommen.`, {
          duration: 2000,
        });
        
        // Navigate to monitor page after 2 seconds
        setTimeout(() => {
          navigate('/monitor?autoReturn=true');
        }, 2000);
      } else {
        throw new Error(saveResponse.error || 'Unbekannter Fehler beim Speichern');
      }
      
    } catch (error) {
      console.error('Error saving order:', error);
      toast("Fehler beim Speichern des Auftrags", {
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

      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          asChild 
          className="mb-6"
        >
          <Link to="/home1" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Prio auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-lg font-medium mb-2">Betriebsauftragsnummer:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md">{auftragsnummer}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => handlePrioSelect(1)}
                  size="lg" 
                  className="bg-amber-500 hover:bg-amber-600 px-10 py-6 text-xl h-auto"
                >
                  Prio 1
                </Button>
                <Button 
                  onClick={() => handlePrioSelect(2)}
                  variant="outline"
                  size="lg" 
                  className="border-slate-400 hover:bg-slate-100 px-10 py-6 text-xl h-auto"
                >
                  Prio 2
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrioAuswaehlen;
