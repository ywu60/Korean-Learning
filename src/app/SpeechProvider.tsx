import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  SPEECH_RATES,
  createBrowserSpeechEngine,
  type SpeechEngine,
  type SpeechStatus,
  type SpeechVoiceOption,
} from '../services/speech';
import { usePreferences } from '../hooks/useProgress';

export interface SpeechContextValue {
  status: SpeechStatus;
  voices: SpeechVoiceOption[];
  /** ID of the audio button currently speaking, if any. */
  speakingId: string | null;
  speak(id: string, text: string, rate?: 'normal' | 'slow'): void;
  stop(): void;
}

export const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ children, engine }: { children: ReactNode; engine?: SpeechEngine }) {
  const engineRef = useRef<SpeechEngine>(engine ?? createBrowserSpeechEngine());
  const [status, setStatus] = useState<SpeechStatus>('loading');
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { speechRate, voiceURI } = usePreferences();

  useEffect(() => {
    const cleanup = engineRef.current.init((nextStatus, nextVoices) => {
      setStatus(nextStatus);
      setVoices(nextVoices);
    });
    return () => {
      cleanup();
      engineRef.current.cancel();
    };
  }, []);

  const speak = useCallback(
    (id: string, text: string, rate?: 'normal' | 'slow') => {
      if (status !== 'ready') return;
      setSpeakingId(id);
      engineRef.current.speak(text, {
        rate: SPEECH_RATES[rate ?? speechRate],
        voiceURI,
        onEnd: () => setSpeakingId((current) => (current === id ? null : current)),
      });
    },
    [status, speechRate, voiceURI],
  );

  const stop = useCallback(() => {
    engineRef.current.cancel();
    setSpeakingId(null);
  }, []);

  const value = useMemo(() => ({ status, voices, speakingId, speak, stop }), [status, voices, speakingId, speak, stop]);
  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}
