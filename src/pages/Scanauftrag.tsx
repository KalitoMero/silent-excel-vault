
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const Scanauftrag = () => {
  const [auftragsnummer, setAuftragsnummer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus the input field when the page loads and maintain focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Smart focus management - event-based instead of aggressive intervals
  useEffect(() => {
    const isInteractiveElement = (element: Element | null): boolean => {
      if (!element) return false;
      const tagName = element.tagName.toLowerCase();
      return ['button', 'a', 'select', 'textarea'].includes(tagName) || 
             element.getAttribute('role') === 'button' ||
             element.getAttribute('tabindex') !== null;
    };

    const handleFocusLoss = () => {
      // Only refocus if user is not interacting with other elements
      setTimeout(() => {
        if (inputRef.current && 
            !isInteractiveElement(document.activeElement) &&
            document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    };

    const handleWindowFocus = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Event-based focus management
    document.addEventListener('blur', handleFocusLoss, true);
    document.addEventListener('focusout', handleFocusLoss);
    document.addEventListener('click', handleFocusLoss);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('blur', handleFocusLoss, true);
      document.removeEventListener('focusout', handleFocusLoss);
      document.removeEventListener('click', handleFocusLoss);
      window.removeEventListener('focus', handleWindowFocus);
    };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
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
                  className="text-lg py-6"
                  placeholder="Scannen oder eingeben..."
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-form-type="other"
                  inputMode="text"
                  role="textbox"
                  form="non-existent-form"
                  style={{
                    WebkitAppearance: 'none',
                    WebkitUserSelect: 'text'
                  }}
                  data-webkit-speech=""
                  data-ms-editor="false"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scanauftrag;
