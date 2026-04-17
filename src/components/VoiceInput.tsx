import { useState, useRef, useEffect } from 'react';
import CharCounter from './CharCounter';

interface VoiceInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  fieldHint: string;
  minChars?: number;
}

export default function VoiceInput({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  fieldHint,
  minChars,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isTidying, setIsTidying] = useState(false);

  const isListeningRef = useRef(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  // Keep a ref to the current value so the speech callback always appends to latest text
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  function createAndStart() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();

    // continuous:false prevents duplicate-result bug on Android Chrome.
    // We restart manually after each utterance for a continuous feel.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-NZ';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        const current = valueRef.current;
        onChange(current.trim() ? current.trim() + ' ' + final.trim() : final.trim());
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      setInterimText('');
      if (isListeningRef.current) {
        createAndStart();
      } else {
        setIsListening(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setInterimText('');
      if (event.error === 'no-speech' && isListeningRef.current) {
        createAndStart();
      } else {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function startListening() {
    isListeningRef.current = true;
    setIsListening(true);
    createAndStart();
  }

  function stopListening() {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }

  async function handleTidy() {
    if (!value.trim()) return;
    setIsTidying(true);
    try {
      const response = await fetch('/.netlify/functions/tidy-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, fieldHint }),
      });
      if (response.ok) {
        const data = await response.json() as { tidied: string };
        onChange(data.tidied);
      }
    } catch {
      // Tidy failed silently — user keeps original text
    }
    setIsTidying(false);
  }

  return (
    <div>
      {/* Mic button */}
      {speechSupported && (
        <div className="mb-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isTidying}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isListening
                ? 'bg-danger text-white animate-pulse'
                : 'bg-paper border-2 border-primary text-primary hover:bg-brand-green-soft'
            } disabled:opacity-40`}
          >
            <span className="text-base">{isListening ? '⏹' : '🎙️'}</span>
            {isListening ? 'Stop recording' : 'Record answer'}
          </button>
        </div>
      )}

      {/* Live interim transcript */}
      {interimText && (
        <p className="text-xs text-ink-soft italic mb-1 px-1">{interimText}…</p>
      )}

      {/* Textarea */}
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={
          speechSupported
            ? 'Tap the mic to speak, or type here…'
            : (placeholder ?? 'Type your answer here…')
        }
        className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green resize-y"
      />

      {/* Char counter */}
      {minChars !== undefined && (
        <CharCounter current={value.trim().length} minimum={minChars} />
      )}

      {/* Tidy with AI */}
      {value.trim().length > 20 && (
        <button
          type="button"
          onClick={handleTidy}
          disabled={isTidying || isListening}
          className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium disabled:opacity-40 transition-colors"
        >
          {isTidying ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Tidying…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Tidy with AI
            </>
          )}
        </button>
      )}
    </div>
  );
}
