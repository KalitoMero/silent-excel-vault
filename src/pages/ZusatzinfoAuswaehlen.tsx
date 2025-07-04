import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { OrderEntry } from '@/services/api';

interface AdditionalInfo {
  id: string;
  name: string;
  departmentId: string;
}

const ZusatzinfoAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';
  const prioritaet = parseInt(searchParams.get('prioritaet') || '1') as 1 | 2;
  const abteilung = searchParams.get('abteilung') || '';
  const [additionalInfos, setAdditionalInfos] = useState<AdditionalInfo[]>([]);

  useEffect(() => {
    // Load additional infos from localStorage and filter by department
    const savedAdditionalInfos = localStorage.getItem('additionalInfos');
    const savedDepartments = localStorage.getItem('departments');
    
    if (savedAdditionalInfos && savedDepartments) {
      try {
        const allAdditionalInfos = JSON.parse(savedAdditionalInfos);
        const departments = JSON.parse(savedDepartments);
        
        // Find the department ID for the selected department
        const selectedDepartment = departments.find((dept: any) => dept.name === abteilung);
        
        if (selectedDepartment) {
          // Filter additional infos for this department
          const filteredInfos = allAdditionalInfos.filter(
            (info: AdditionalInfo) => info.departmentId === selectedDepartment.id
          );
          setAdditionalInfos(filteredInfos);
        }
      } catch (error) {
        console.error('Error loading additional infos:', error);
        setAdditionalInfos([]);
      }
    }
  }, [abteilung]);

  const handleAdditionalInfoSelect = async (additionalInfo: string) => {
    try {
      // Create new order entry
      const newOrder: OrderEntry = {
        auftragsnummer,
        prioritaet,
        zeitstempel: new Date(),
        abteilung,
        zusatzinfo: additionalInfo,
        zusatzDaten: {}
      };

      // Get Excel data from localStorage to find additional information
      const excelDataStr = localStorage.getItem('excelData');
      if (excelDataStr) {
        try {
          const excelData = JSON.parse(excelDataStr);
          
          // Get Excel settings and column settings from localStorage
          const excelSettingsStr = localStorage.getItem('excelSettings');
          const columnSettingsStr = localStorage.getItem('columnSettings');
          
          if (excelSettingsStr && columnSettingsStr) {
            const excelSettings = JSON.parse(excelSettingsStr);
            const columnSettings = JSON.parse(columnSettingsStr);
            
            // Find the row with the matching Betriebsauftragsnummer
            const auftragsnummerColIndex = (excelSettings.auftragsnummerColumn || 1) - 1;
            
            const foundRow = excelData.data?.find((row: any[]) => 
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
        } catch (error) {
          console.error('Error parsing Excel data from localStorage:', error);
        }
      }

      // Save order to localStorage
      const existingOrdersStr = localStorage.getItem('orders');
      let existingOrders = [];
      
      if (existingOrdersStr) {
        try {
          existingOrders = JSON.parse(existingOrdersStr, (key, value) => {
            if (key === 'zeitstempel') {
              return new Date(value);
            }
            return value;
          });
        } catch (error) {
          console.error('Error parsing existing orders:', error);
        }
      }
      
      existingOrders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(existingOrders));
      
      console.log(`Auftragsnummer ${auftragsnummer} mit Priorität ${prioritaet}, Abteilung ${abteilung} und Zusatzinfo ${additionalInfo} erfolgreich gespeichert`);
      
      // Show success confirmation toast
      toast(`Auftrag erfolgreich gespeichert.`, {
        duration: 2000,
      });
      
      // Navigate to monitor page after 2 seconds
      setTimeout(() => {
        navigate('/monitor?autoReturn=true');
      }, 2000);
      
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
          <Link to={`/abteilung-auswaehlen?auftragsnummer=${encodeURIComponent(auftragsnummer)}&prioritaet=${prioritaet}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Zusatzinformation auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-lg font-medium mb-2">Betriebsauftragsnummer:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{auftragsnummer}</p>
                <p className="text-lg font-medium mb-2">Priorität:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{prioritaet}</p>
                <p className="text-lg font-medium mb-2">Abteilung:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md">{abteilung}</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Verfügbare Zusatzinformationen für {abteilung}:</h3>
                {additionalInfos.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {additionalInfos.map((info) => (
                      <Button
                        key={info.id}
                        onClick={() => handleAdditionalInfoSelect(info.name)}
                        variant="outline"
                        className="h-auto p-4 text-left justify-start"
                      >
                        {info.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Keine Zusatzinformationen für "{abteilung}" konfiguriert.</p>
                    <Button variant="outline" asChild>
                      <Link to="/einstellungen">
                        Zu den Einstellungen
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZusatzinfoAuswaehlen;