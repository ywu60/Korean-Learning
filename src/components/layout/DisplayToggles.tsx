import { usePreferences, useProgress } from '../../hooks/useProgress';

/** Independent romanization / English switches. Persisted with progress. */
export function DisplayToggles({ compact = false }: { compact?: boolean }) {
  const { showRomanization, showTranslation } = usePreferences();
  const { updatePreferences } = useProgress();
  return (
    <div className={`display-toggles${compact ? ' display-toggles--compact' : ''}`} role="group" aria-label="Display options">
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={showRomanization}
          onChange={(e) => updatePreferences({ showRomanization: e.target.checked })}
        />
        <span className="switch__track" aria-hidden="true" />
        <span className="switch__label">Romanization</span>
      </label>
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={showTranslation}
          onChange={(e) => updatePreferences({ showTranslation: e.target.checked })}
        />
        <span className="switch__track" aria-hidden="true" />
        <span className="switch__label">English</span>
      </label>
    </div>
  );
}
