import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Mic, Type, Camera } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MediaInfoAuswaehlen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auftragsnummer = searchParams.get('auftragsnummer') || '';
  const abteilung = searchParams.get('abteilung') || '';
  const zusatzinfo = searchParams.get('zusatzinfo') || '';
  
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textNote, setTextNote] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasStream, setHasStream] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const navigateToPrioSelection = async (mediaInfo?: string, mediaFile?: Blob) => {
    let fileUrl = '';
    
    if (mediaFile) {
      try {
        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${auftragsnummer}_${timestamp}.webm`;
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('order-media')
          .upload(fileName, mediaFile, {
            contentType: 'video/webm'
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast("Fehler beim Speichern der Aufnahme", { duration: 3000 });
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('order-media')
            .getPublicUrl(fileName);
          
          fileUrl = urlData.publicUrl;
          
          // Save media info to database
          await supabase.from('order_media').insert({
            auftragsnummer,
            file_path: fileName,
            file_type: 'video',
            content: mediaInfo || 'Video-Aufnahme'
          });
        }
      } catch (error) {
        console.error('Error saving media:', error);
        toast("Fehler beim Speichern", { duration: 3000 });
      }
    } else if (mediaInfo && textNote) {
      try {
        // Save text note to database
        await supabase.from('order_media').insert({
          auftragsnummer,
          file_path: '',
          file_type: 'text',
          content: textNote
        });
      } catch (error) {
        console.error('Error saving text note:', error);
      }
    }
    
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

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Camera access granted, setting up stream...');
      console.log('Stream tracks:', mediaStream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      setStream(mediaStream);
      setHasStream(true);
      
      // Show video preview immediately with debugging
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Add event listeners for debugging
        video.addEventListener('loadedmetadata', () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        });
        
        video.addEventListener('canplay', () => {
          console.log('Video can play');
        });
        
        video.addEventListener('playing', () => {
          console.log('Video is playing');
        });
        
        video.addEventListener('error', (e) => {
          console.error('Video error:', e);
        });
        
        // Set the stream and explicitly play
        video.srcObject = mediaStream;
        console.log('Video stream assigned to video element');
        
        // Explicitly play the video
        try {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('Video play successful');
          }
        } catch (playError) {
          console.error('Error playing video:', playError);
          // Try to recover by setting autoplay and reloading
          video.autoplay = true;
          video.load();
        }
      }
      
      toast("Kamera aktiviert", { duration: 2000 });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        toast("Kamera-Zugriff verweigert. Bitte erlauben Sie den Zugriff.", { duration: 5000 });
      } else if (error.name === 'NotFoundError') {
        toast("Keine Kamera gefunden", { duration: 3000 });
      } else {
        toast("Fehler beim Zugriff auf die Kamera", { duration: 3000 });
      }
    }
  };

  const startRecording = async () => {
    if (!stream) {
      await startCamera();
      return;
    }

    try {
      console.log('Starting recording...');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        // Store recording info and navigate
        const recordingInfo = `Video-Aufnahme erstellt (${new Date().toLocaleString()})`;
        toast("Aufnahme beendet", { duration: 2000 });
        await navigateToPrioSelection(recordingInfo, blob);
        
        // Stop all tracks and cleanup
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setHasStream(false);
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

  const handleTextSave = async () => {
    if (textNote.trim()) {
      await navigateToPrioSelection(textNote);
    } else {
      toast("Bitte geben Sie eine Notiz ein", { duration: 2000 });
    }
  };

  const handleSkip = async () => {
    await navigateToPrioSelection();
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
                
                {hasStream && (
                  <div className="mb-4">
                    <video 
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg border-2 border-primary"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {isRecording ? "Aufnahme läuft..." : "Live-Vorschau (bereit zur Aufnahme)"}
                    </p>
                  </div>
                )}
                
                {!hasStream && !isRecording && (
                  <div className="mb-4">
                    <Button 
                      onClick={startCamera}
                      variant="outline"
                      size="lg" 
                      className="h-auto p-6 text-xl w-full"
                    >
                      <Camera className="mr-3 h-6 w-6" />
                      Kamera aktivieren
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg" 
                    className="h-auto p-6 text-xl"
                    variant={isRecording ? "destructive" : "default"}
                  >
                    <Camera className="mr-3 h-6 w-6" />
                    {isRecording ? "Aufnahme beenden" : "Video-Aufnahme starten"}
                  </Button>
                  
                  <Button 
                    onClick={() => setShowTextInput(true)}
                    variant="outline"
                    size="lg" 
                    className="h-auto p-6 text-xl"
                    disabled={isRecording}
                  >
                    <Type className="mr-3 h-6 w-6" />
                    Text-Notiz hinzufügen
                  </Button>
                  
                  <Button 
                    onClick={handleSkip}
                    variant="secondary"
                    size="lg" 
                    className="h-auto p-6 text-xl"
                    disabled={isRecording}
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