import { useContext } from 'react';
import { ProgressContext } from '../app/ProgressProvider';

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}

export function usePreferences() {
  return useProgress().progress.preferences;
}
