import { useState } from 'react';
import type { VocabularyEntry } from '../../domain/schema';
import { useDisplay } from '../../hooks/useDisplay';
import { useProgress } from '../../hooks/useProgress';
import { AudioButton } from './AudioButton';
import { Icon } from '../ui/Icon';

const POS_LABELS: Record<string, string> = {
  verb: 'verb',
  noun: 'noun',
  pronoun: 'pronoun',
  adverb: 'adverb',
  determiner: 'determiner',
  particle: 'particle',
  expression: 'expression',
};

export function VocabularyCard({ entry, children }: { entry: VocabularyEntry; children?: React.ReactNode }) {
  const { showRomanization, showTranslation, isStatic } = useDisplay();
  const { progress, toggleSavedVocabulary } = useProgress();
  const saved = progress.savedVocabularyIds.includes(entry.id);
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="vocab-card" aria-label={`${entry.hangul}: ${entry.gloss}`}>
      <div className="vocab-card__head">
        <p className="vocab-card__hangul" lang="ko">
          {entry.hangul}
        </p>
        <AudioButton text={entry.hangul} label={entry.hangul} />
        {!isStatic && (
          <button
            type="button"
            className={`icon-button vocab-card__save${saved ? ' is-saved' : ''}`}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${entry.hangul} from saved words` : `Save ${entry.hangul} for review`}
            onClick={() => toggleSavedVocabulary(entry.id)}
            title={saved ? 'Saved for review' : 'Save for review'}
          >
            <Icon name="star" size={18} filled={saved} />
          </button>
        )}
      </div>
      {showRomanization && <p className="vocab-card__romanization">{entry.romanization}</p>}
      <p className="vocab-card__gloss">
        {showTranslation || revealed ? (
          entry.gloss
        ) : (
          <button type="button" className="link-button" onClick={() => setRevealed(true)}>
            Show meaning
          </button>
        )}
        {entry.partOfSpeech && <span className="chip chip--quiet">{POS_LABELS[entry.partOfSpeech]}</span>}
      </p>
      {entry.notes && <p className="vocab-card__notes">{entry.notes}</p>}
      {children}
    </article>
  );
}
