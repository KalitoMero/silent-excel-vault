
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Datenimport = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );

    if (excelFile) {
      handleFileUpload(excelFile);
    } else {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte laden Sie nur Excel-Dateien (.xlsx oder .xls) hoch.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadedFile(file);

    try {
      // Simuliere Backend-Upload und Verarbeitung
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Hier würde normalerweise die Datei an das Backend gesendet werden
      console.log('Datei wird verarbeitet:', file.name);
      
      setUploadStatus('success');
      toast({
        title: "Upload erfolgreich",
        description: `Die Datei "${file.name}" wurde erfolgreich hochgeladen und wird im Hintergrund verarbeitet.`,
      });
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload-Fehler:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Beim Hochladen der Datei ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Datenimport</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Laden Sie Ihre Excel-Dateien hoch, um sie in unserer internen Datenbank zu verarbeiten. 
            Die Daten werden automatisch importiert und stehen anschließend für die Auswertung zur Verfügung.
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              Excel-Datei hochladen
            </CardTitle>
            <CardDescription>
              Unterstützte Formate: .xlsx, .xls • Die erste Zeile sollte Spaltenüberschriften enthalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadStatus === 'idle' && (
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Excel-Datei hier ablegen
                </h3>
                <p className="text-gray-500 mb-6">
                  oder klicken Sie hier, um eine Datei auszuwählen
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Datei auswählen
                  </label>
                </Button>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="text-center py-12">
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Datei wird hochgeladen...
                </h3>
                <p className="text-gray-500">
                  {uploadedFile?.name} wird verarbeitet
                </p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Upload erfolgreich!
                </h3>
                <p className="text-gray-500 mb-6">
                  {uploadedFile?.name} wurde erfolgreich hochgeladen und wird im Hintergrund verarbeitet.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={resetUpload} variant="outline">
                    Weitere Datei hochladen
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Zur Auswertung
                  </Button>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Upload fehlgeschlagen
                </h3>
                <p className="text-gray-500 mb-6">
                  Beim Hochladen der Datei ist ein Fehler aufgetreten.
                </p>
                <Button onClick={resetUpload} className="bg-red-600 hover:bg-red-700">
                  Erneut versuchen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Upload className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Einfacher Upload</h3>
              <p className="text-sm text-gray-600">
                Drag & Drop oder Datei-Auswahl für schnellen Upload
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Automatische Verarbeitung</h3>
              <p className="text-sm text-gray-600">
                Ihre Daten werden automatisch in der Datenbank gespeichert
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Bereit für Auswertung</h3>
              <p className="text-sm text-gray-600">
                Nach dem Import stehen die Daten für Analysen zur Verfügung
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Datenimport;
