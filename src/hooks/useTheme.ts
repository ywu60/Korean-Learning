import { useEffect } from 'react';
import { usePreferences } from './useProgress';

/** Applies the theme preference to <html data-theme>. "system" follows the OS. */
export function useTheme() {
  const { theme } = usePreferences();
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}
