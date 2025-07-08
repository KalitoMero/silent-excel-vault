import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Mic, Type, Camera } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useState, useRef } from 'react';
import { apiService } from '@/services/api';

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
    if (mediaFile) {
      try {
        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${auftragsnummer}_${timestamp}.webm`;
        
        // Create FormData to upload the actual video file
        const formData = new FormData();
        formData.append('file', mediaFile, fileName);
        formData.append('auftragsnummer', auftragsnummer);
        formData.append('file_type', 'video');
        formData.append('content', mediaInfo || 'Video-Aufnahme');
        
        // Upload video file to backend
        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        toast("Aufnahme gespeichert", { duration: 2000 });
      } catch (error) {
        console.error('Error saving media:', error);
        toast("Fehler beim Speichern", { duration: 3000 });
      }
    } else if (mediaInfo && textNote) {
      try {
        // Save text note to PostgreSQL API
        await apiService.saveMedia({
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
      // Stop any existing stream first
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => track.stop());
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure cleanup
      }

      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Camera access granted, setting up stream...');
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
      
      
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        toast("Kamera-Zugriff verweigert. Bitte erlauben Sie den Zugriff.", { duration: 5000 });
      } else if (error.name === 'NotFoundError') {
        toast("Keine Kamera gefunden", { duration: 3000 });
      } else if (error.name === 'NotReadableError') {
        toast("Kamera ist bereits in Verwendung. Bitte schließen Sie andere Apps die die Kamera verwenden.", { duration: 5000 });
      } else {
        toast("Fehler beim Zugriff auf die Kamera", { duration: 3000 });
      }
    }
  };

  const startRecording = async () => {
    try {
      // Stop any existing streams completely
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind, track.readyState);
        });
        setStream(null);
        setHasStream(false);
        // Wait a bit longer for complete cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Also stop any other potential video streams
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        if (oldStream) {
          oldStream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped old video track:', track.kind);
          });
        }
        videoRef.current.srcObject = null;
      }

      // Request fresh camera access
      console.log('Starting fresh camera stream for recording...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Fresh stream obtained, tracks:', mediaStream.getTracks().map(track => ({
        kind: track.kind,
        readyState: track.readyState
      })));
      
      setStream(mediaStream);
      setHasStream(true);
      
      // Set up video preview with event-based display
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // Ensure video plays immediately
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        // Wait for video to be ready before applying refresh logic
        const applyRefreshLogic = async () => {
          console.log('Applying refresh logic for immediate visibility');
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased wait time
          video.srcObject = null;
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased wait time
          video.srcObject = mediaStream;
          await video.play();
          console.log('Video refreshed for immediate visibility');
        };
        
        // Event-based approach: wait for video to be ready
        const onVideoReady = async () => {
          console.log('Video metadata loaded, applying refresh logic');
          await applyRefreshLogic();
        };
        
        // Add event listeners
        video.addEventListener('loadedmetadata', onVideoReady, { once: true });
        
        try {
          await video.play();
          console.log('Video preview started successfully');
        } catch (playError) {
          console.error('Error starting video preview:', playError);
          // Force video to play and apply refresh
          video.load();
          await video.play();
          await applyRefreshLogic();
        }
        
        // Fallback mechanism: if video is still not visible after 2 seconds, apply refresh logic
        setTimeout(async () => {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.log('Video still not visible after 2s, applying fallback refresh');
            await applyRefreshLogic();
          }
        }, 2000);
      }
      
      // Start recording with the new stream
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordingInfo = `Video-Aufnahme erstellt (${new Date().toLocaleString()})`;
        toast("Aufnahme beendet", { duration: 2000 });
        await navigateToPrioSelection(recordingInfo, blob);
        
        // Cleanup
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
        setHasStream(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast("Aufnahme gestartet", { duration: 2000 });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        toast("Kamera-Zugriff verweigert. Bitte erlauben Sie den Zugriff.", { duration: 5000 });
      } else if (error.name === 'NotReadableError') {
        toast("Kamera ist bereits in Verwendung. Bitte schließen Sie andere Apps/Tabs die die Kamera verwenden und versuchen Sie es erneut.", { duration: 5000 });
      } else {
        toast("Fehler beim Starten der Aufnahme", { duration: 3000 });
      }
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
                      className="w-full max-w-md mx-auto rounded-lg border-2 border-primary bg-gray-200"
                      style={{ 
                        transform: 'scaleX(-1)',
                        minWidth: '320px',
                        minHeight: '240px',
                        objectFit: 'cover'
                      }}
                      onClick={async () => {
                        // Ensure video plays on user interaction
                        if (videoRef.current) {
                          try {
                            await videoRef.current.play();
                            console.log('Video play triggered by user click');
                          } catch (e) {
                            console.error('Manual play failed:', e);
                          }
                        }
                      }}
                    />
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {isRecording ? "Aufnahme läuft..." : "Live-Vorschau (klicken zum Aktivieren)"}
                    </p>
                    <button 
                      onClick={async () => {
                        if (videoRef.current && stream) {
                          // Force refresh the video stream
                          videoRef.current.srcObject = null;
                          await new Promise(resolve => setTimeout(resolve, 100));
                          videoRef.current.srcObject = stream;
                          try {
                            await videoRef.current.play();
                            console.log('Video manually restarted');
                          } catch (e) {
                            console.error('Manual restart failed:', e);
                          }
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded text-sm"
                    >
                      Kamera starten
                    </button>
                  </div>
                )}
                
                
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg" 
                    className={`h-auto p-6 text-xl ${isRecording ? 'animate-pulse' : ''}`}
                    variant={isRecording ? "destructive" : "default"}
                  >
                    <Camera className="mr-3 h-6 w-6" />
                    {isRecording ? "Aufnahme beenden" : "Aufnahme starten"}
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