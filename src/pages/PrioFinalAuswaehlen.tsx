import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { apiService, OrderEntry } from '@/services/api';

const PrioFinalAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const auftragsnummer = searchParams.get('auftragsnummer') || '';
  const abteilung = searchParams.get('abteilung') || '';
  const zusatzinfo = searchParams.get('zusatzinfo') || '';
  const mediaInfo = searchParams.get('mediaInfo') || '';

  const handlePrioSelect = async (prio: number) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    if (!auftragsnummer) {
      toast("Fehler: Keine Auftragsnummer gefunden", {
        duration: 2000,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create new order entry
      const newOrder: OrderEntry = {
        auftragsnummer,
        prioritaet: prio as 1 | 2,
        zeitstempel: new Date(),
        abteilung,
        zusatzinfo,
        zusatzDaten: {
          mediaInfo: mediaInfo || null
        }
      };

      // Get Excel data and settings from API to find additional information
      const [excelDataResult, excelSettingsResult, columnSettingsResult] = await Promise.all([
        apiService.getExcelData(),
        apiService.getExcelSettings(),
        apiService.getColumnSettings()
      ]);

      if (excelDataResult.success && excelDataResult.data && 
          excelSettingsResult.success && excelSettingsResult.settings &&
          columnSettingsResult.success && columnSettingsResult.settings) {
        
        // Find the row with the matching Betriebsauftragsnummer
        const auftragsnummerColIndex = (excelSettingsResult.settings.auftragsnummer_column || 1) - 1;
        
        const foundRow = excelDataResult.data.find((row: any[]) => 
          row[auftragsnummerColIndex] && 
          row[auftragsnummerColIndex].toString() === auftragsnummer
        );
        
        if (foundRow) {
          // Extract additional column data
          columnSettingsResult.settings.forEach((setting: any) => {
            const colIndex = setting.column_number - 1;
            if (colIndex >= 0 && colIndex < foundRow.length) {
              newOrder.zusatzDaten[setting.title] = foundRow[colIndex];
            }
          });
          
          console.log(`Auftrag ${auftragsnummer} wurde in Excel-Daten gefunden.`);
        } else {
          console.log(`Auftrag ${auftragsnummer} wurde nicht in Excel-Daten gefunden.`);
        }
      }

      // Save order using API
      const saveResult = await apiService.saveOrder(newOrder);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Fehler beim Speichern des Auftrags');
      }
      
      console.log(`Auftragsnummer ${auftragsnummer} mit Priorität ${prio}, Abteilung ${abteilung} und Erstteilinformation ${zusatzinfo} erfolgreich gespeichert`);
      
      // Navigate to monitor page immediately after saving
      toast(`Auftrag erfolgreich in Prio ${prio} übernommen.`, {
        duration: 1500,
      });
      
      setTimeout(() => {
        navigate('/monitor?autoReturn=true');
      }, 500); // Reduced from 2000ms to 500ms for faster navigation
      
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
          <Link to={`/media-info-auswaehlen?auftragsnummer=${encodeURIComponent(auftragsnummer)}&abteilung=${encodeURIComponent(abteilung)}&zusatzinfo=${encodeURIComponent(zusatzinfo)}`} className="flex items-center">
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
                <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{auftragsnummer}</p>
                <p className="text-lg font-medium mb-2">Abteilung:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{abteilung}</p>
                <p className="text-lg font-medium mb-2">Erstteilinformation:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md">{zusatzinfo}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => handlePrioSelect(1)}
                  disabled={isProcessing}
                  size="lg" 
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-10 py-6 text-xl h-auto"
                >
                  {isProcessing ? "Verarbeitung..." : "Prio 1"}
                </Button>
                <Button 
                  onClick={() => handlePrioSelect(2)}
                  disabled={isProcessing}
                  variant="outline"
                  size="lg" 
                  className="border-slate-400 hover:bg-slate-100 disabled:opacity-50 px-10 py-6 text-xl h-auto"
                >
                  {isProcessing ? "Verarbeitung..." : "Prio 2"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrioFinalAuswaehlen;