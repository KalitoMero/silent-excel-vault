import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Department {
  id: string;
  name: string;
}

const AbteilungAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';
  const prioritaet = searchParams.get('prioritaet') || '';
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    // Load departments from localStorage
    const savedDepartments = localStorage.getItem('departments');
    if (savedDepartments) {
      try {
        setDepartments(JSON.parse(savedDepartments));
      } catch (error) {
        console.error('Error loading departments:', error);
        setDepartments([]);
      }
    }
  }, []);

  const handleDepartmentSelect = (departmentName: string) => {
    navigate(`/zusatzinfo-auswaehlen?auftragsnummer=${encodeURIComponent(auftragsnummer)}&prioritaet=${prioritaet}&abteilung=${encodeURIComponent(departmentName)}`);
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
          <Link to={`/prio-auswaehlen?auftragsnummer=${encodeURIComponent(auftragsnummer)}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Abteilung auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-lg font-medium mb-2">Betriebsauftragsnummer:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{auftragsnummer}</p>
                <p className="text-lg font-medium mb-2">Priorität:</p>
                <p className="text-xl bg-gray-100 p-3 rounded-md">{prioritaet}</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Verfügbare Abteilungen:</h3>
                {departments.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((department) => (
                      <Button
                        key={department.id}
                        onClick={() => handleDepartmentSelect(department.name)}
                        variant="outline"
                        className="h-auto p-4 text-left justify-start"
                      >
                        {department.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Keine Abteilungen konfiguriert.</p>
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

export default AbteilungAuswaehlen;