
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

const PrioAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';

  const handlePrioSelect = (prio: number) => {
    // Here you could add logic to handle the priority selection
    console.log(`Auftragsnummer ${auftragsnummer} mit Priorität ${prio} ausgewählt`);
    // For now, we'll just log the selection
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
          <Link to="/scanauftrag" className="flex items-center">
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
