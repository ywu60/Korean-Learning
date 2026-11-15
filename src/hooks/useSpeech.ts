import { useContext } from 'react';
import { SpeechContext } from '../app/SpeechProvider';

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error('useSpeech must be used inside <SpeechProvider>');
  return ctx;
}
