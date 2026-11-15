import type { VerbForm } from '../../domain/schema';
import { useDisplay } from '../../hooks/useDisplay';
import { AudioButton } from './AudioButton';

const PART_LABELS = { stem: 'stem', ending: 'ending', contracted: 'contracted form' } as const;

export function VerbFormList({ forms }: { forms: VerbForm[] }) {
  const { showRomanization, showTranslation } = useDisplay();
  if (forms.length === 0) return null;
  return (
    <ul className="form-list" aria-label="Verb forms">
      {forms.map((f) => (
        <li key={`${f.dictionary}-${f.form}`} className="form-row">
          <span className="form-row__dictionary" lang="ko">
            {f.dictionary}
          </span>
          <span className="form-row__arrow" aria-hidden="true">
            →
          </span>
          <span className="form-row__result">
            <span className="form-row__form" lang="ko" aria-label={`${f.form}: ${f.parts.map((p) => `${p.text} (${PART_LABELS[p.kind]})`).join(', ')}`}>
              {f.parts.map((p, i) => (
                <span key={i} className={`form-part form-part--${p.kind}`} title={PART_LABELS[p.kind]}>
                  {p.text}
                </span>
              ))}
            </span>
            <AudioButton text={f.form} label={f.form} size="sm" />
          </span>
          <span className="form-row__meta">
            {showRomanization && <span className="form-row__romanization">{f.romanization}</span>}
            {showTranslation && f.english && <span className="form-row__english">{f.english}</span>}
            {f.derivation && <span className="form-row__derivation">{f.derivation}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function FormLegend() {
  return (
    <p className="form-legend" aria-hidden="true">
      <span className="form-part form-part--stem">stem</span>
      <span className="form-part form-part--ending">ending</span>
      <span className="form-part form-part--contracted">contracted</span>
    </p>
  );
}
