
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, BarChart3, Database } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Datenmanagement System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Importieren, verarbeiten und analysieren Sie Ihre Excel-Daten mit unserem 
            leistungsstarken Datenmanagement-System.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Upload className="h-6 w-6 text-blue-600" />
                Datenimport
              </CardTitle>
              <CardDescription>
                Laden Sie Excel-Dateien hoch und lassen Sie sie automatisch in der Datenbank verarbeiten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link to="/datenimport">
                  Daten importieren
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="h-6 w-6 text-green-600" />
                Auswertung
              </CardTitle>
              <CardDescription>
                Analysieren und visualisieren Sie Ihre importierten Daten mit umfangreichen Tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Bald verfügbar
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Database className="h-6 w-6 text-purple-600" />
                Datenverwaltung
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Datenbestände und überwachen Sie den Import-Status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Bald verfügbar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Funktionen im Überblick
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Import-Features</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Drag & Drop Excel-Upload
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Automatische Spaltenüberschriften-Erkennung
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Hintergrund-Verarbeitung
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Unterstützung für .xlsx und .xls
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Geplante Features</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Interaktive Datenvisualisierung
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Erweiterte Filterfunktionen
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Export in verschiedene Formate
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Automatisierte Berichte
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
