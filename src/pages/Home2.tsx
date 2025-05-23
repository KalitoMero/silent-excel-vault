
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ScanLine, Monitor } from 'lucide-react';

const Home2 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed top-6 left-6" 
        asChild
      >
        <Link to="/home1">
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>
      </Button>

      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                asChild 
                size="lg" 
                className="w-full py-6 text-lg h-auto"
              >
                <Link to="/home1" className="flex items-center justify-center">
                  <ScanLine className="mr-2 h-5 w-5" />
                  Scanauftrag starten
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline"
                size="lg" 
                className="w-full py-6 text-lg h-auto"
              >
                <Link to="/monitor" className="flex items-center justify-center">
                  <Monitor className="mr-2 h-5 w-5" />
                  Zur Übersicht
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home2;
