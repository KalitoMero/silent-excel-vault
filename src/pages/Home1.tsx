
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Menu, Settings, Import, Monitor } from 'lucide-react';

const Home1 = () => {
  const [auftragsnummer, setAuftragsnummer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus the input field when the page loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuftragsnummer(e.target.value);
  };

  const handleSubmit = () => {
    if (auftragsnummer.trim()) {
      navigate(`/prio-auswaehlen?auftragsnummer=${encodeURIComponent(auftragsnummer)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
      {/* Top right buttons */}
      <div className="fixed top-6 right-6 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          asChild
        >
          <Link to="/einstellungen">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Einstellungen</span>
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          asChild
        >
          <Link to="/home2">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menü</span>
          </Link>
        </Button>
      </div>

      {/* Bottom navigation buttons */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Button 
          variant="outline"
          asChild
        >
          <Link to="/datenimport" className="flex items-center">
            <Import className="mr-2 h-4 w-4" />
            Daten importieren
          </Link>
        </Button>
        
        <Button 
          variant="outline"
          asChild
        >
          <Link to="/monitor" className="flex items-center">
            <Monitor className="mr-2 h-4 w-4" />
            Auftragsmonitor
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Scanauftrag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="auftragsnummer" className="text-lg font-medium">
                  Betriebsauftragsnummer
                </Label>
                <Input
                  id="auftragsnummer"
                  ref={inputRef}
                  type="text"
                  value={auftragsnummer}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className="text-lg py-6"
                  placeholder="Scannen oder eingeben..."
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home1;
