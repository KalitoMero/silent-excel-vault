import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Mic, Type } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useState, useRef } from 'react';

const MediaInfoAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';
  const abteilung = searchParams.get('abteilung') || '';
  const zusatzinfo = searchParams.get('zusatzinfo') || '';
  
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textNote, setTextNote] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const navigateToPrioSelection = (mediaInfo?: string) => {
    const params = new URLSearchParams({
      auftragsnummer,
      abteilung,
      zusatzinfo,
    });
    
    if (mediaInfo) {
      params.set('mediaInfo', mediaInfo);
    }
    
    navigate(`/prio-final-auswaehlen?${params.toString()}`);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Store recording info and navigate
        const recordingInfo = `Video-Aufnahme erstellt (${new Date().toLocaleString()})`;
        toast("Aufnahme beendet", { duration: 2000 });
        navigateToPrioSelection(recordingInfo);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast("Aufnahme gestartet", { duration: 2000 });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast("Fehler beim Starten der Aufnahme", { duration: 3000 });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTextSave = () => {
    if (textNote.trim()) {
      navigateToPrioSelection(textNote);
    } else {
      toast("Bitte geben Sie eine Notiz ein", { duration: 2000 });
    }
  };

  const handleSkip = () => {
    navigateToPrioSelection();
  };

  if (showTextInput) {
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
            onClick={() => setShowTextInput(false)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Notiz hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-lg font-medium mb-2">Betriebsauftragsnummer:</p>
                  <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{auftragsnummer}</p>
                  <p className="text-lg font-medium mb-2">Abteilung:</p>
                  <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{abteilung}</p>
                  <p className="text-lg font-medium mb-2">Erstteilinformation:</p>
                  <p className="text-xl bg-gray-100 p-3 rounded-md mb-4">{zusatzinfo}</p>
                </div>
                
                <div className="space-y-4">
                  <label className="text-lg font-medium">Ihre Notiz:</label>
                  <Textarea
                    value={textNote}
                    onChange={(e) => setTextNote(e.target.value)}
                    placeholder="Geben Sie hier Ihre Notiz ein..."
                    className="min-h-[120px]"
                  />
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleTextSave}
                      size="lg"
                      className="px-8"
                    >
                      Notiz speichern
                    </Button>
                    <Button 
                      onClick={() => setShowTextInput(false)}
                      variant="outline"
                      size="lg"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <Link to={`/abteilung-auswaehlen?auftragsnummer=${encodeURIComponent(auftragsnummer)}&abteilung=${encodeURIComponent(abteilung)}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Zusätzliche Informationen</CardTitle>
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
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Möchten Sie zusätzliche Informationen hinzufügen?</h3>
                
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg" 
                    className="h-auto p-6 text-xl"
                    variant={isRecording ? "destructive" : "default"}
                  >
                    <Mic className="mr-3 h-6 w-6" />
                    {isRecording ? "Aufnahme beenden" : "Video-/Audio-Aufnahme starten"}
                  </Button>
                  
                  <Button 
                    onClick={() => setShowTextInput(true)}
                    variant="outline"
                    size="lg" 
                    className="h-auto p-6 text-xl"
                  >
                    <Type className="mr-3 h-6 w-6" />
                    Text-Notiz hinzufügen
                  </Button>
                  
                  <Button 
                    onClick={handleSkip}
                    variant="secondary"
                    size="lg" 
                    className="h-auto p-6 text-xl"
                  >
                    Ohne Info weiter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaInfoAuswaehlen;