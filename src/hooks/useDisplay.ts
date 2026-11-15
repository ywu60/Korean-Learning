import { createContext, useContext } from 'react';
import { usePreferences } from './useProgress';

/**
 * Display mode for content renderers. "interactive" is the normal reader;
 * "static" is used for the print view (no buttons, everything visible).
 */
export interface DisplayOverride {
  mode: 'interactive' | 'static';
}

export const DisplayContext = createContext<DisplayOverride>({ mode: 'interactive' });

export function useDisplay() {
  const prefs = usePreferences();
  const { mode } = useContext(DisplayContext);
  const isStatic = mode === 'static';
  return {
    isStatic,
    showRomanization: isStatic || prefs.showRomanization,
    showTranslation: isStatic || prefs.showTranslation,
  };
}
