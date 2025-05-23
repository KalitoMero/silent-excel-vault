
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { OrderEntry } from './Monitor';
import { toast } from '@/components/ui/sonner';

const PrioAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';

  const handlePrioSelect = (prio: number) => {
    if (!auftragsnummer) {
      toast("Fehler: Keine Auftragsnummer gefunden", {
        duration: 2000,
      });
      return;
    }

    // Create new order entry
    const newOrder: OrderEntry = {
      auftragsnummer,
      prioritaet: prio as 1 | 2,
      zeitstempel: new Date(),
      zusatzDaten: {}
    };

    // Try to find the order in the Excel data
    const excelData = localStorage.getItem('excelData');
    if (excelData) {
      try {
        const data = JSON.parse(excelData);
        const excelSettings = JSON.parse(localStorage.getItem('excelSettings') || '{"auftragsnummerColumn": 1}');
        const columnSettings = JSON.parse(localStorage.getItem('columnSettings') || '[]');
        
        // Find the row with the matching Betriebsauftragsnummer
        const auftragsnummerColIndex = excelSettings.auftragsnummerColumn - 1; // Convert to 0-based index
        
        const foundRow = data.find((row: any[]) => 
          row[auftragsnummerColIndex] && 
          row[auftragsnummerColIndex].toString() === auftragsnummer
        );
        
        if (foundRow) {
          // We found the row, now extract the additional column data
          columnSettings.forEach((setting: any) => {
            const colIndex = setting.columnNumber - 1; // Convert to 0-based index
            if (colIndex >= 0 && colIndex < foundRow.length) {
              newOrder.zusatzDaten[setting.title] = foundRow[colIndex];
            }
          });
          
          console.log(`Auftrag ${auftragsnummer} wurde in Excel-Daten gefunden.`);
        } else {
          console.log(`Auftrag ${auftragsnummer} wurde nicht in Excel-Daten gefunden.`);
        }
      } catch (error) {
        console.error("Fehler beim Parsen der Excel-Daten:", error);
      }
    }

    // Get existing orders from localStorage
    const existingOrdersJson = localStorage.getItem('orders');
    let orders: OrderEntry[] = existingOrdersJson 
      ? JSON.parse(existingOrdersJson) 
      : [];
    
    // Add the new order
    orders.push(newOrder);
    
    // Save to localStorage
    localStorage.setItem('orders', JSON.stringify(orders));
    
    console.log(`Auftragsnummer ${auftragsnummer} mit Priorität ${prio} ausgewählt`);
    
    // Show success confirmation toast
    toast(`Auftrag erfolgreich in Prio ${prio} übernommen.`, {
      duration: 2000,
    });
    
    // Navigate to monitor page after 2 seconds
    setTimeout(() => {
      navigate('/monitor?autoReturn=true');
    }, 2000);
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
