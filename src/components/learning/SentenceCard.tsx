import { useId, useState } from 'react';
import type { Sentence, Token } from '../../domain/schema';
import { content } from '../../content';
import { useDisplay } from '../../hooks/useDisplay';
import { AudioButton } from './AudioButton';
import { ROLE_LABELS } from './roles';

interface SentenceCardProps {
  sentence: Sentence;
  size?: 'lg' | 'md';
  /** Hide the English line entirely (e.g. while it is the answer to a question). */
  suppressTranslation?: boolean;
  showTokens?: boolean;
}

/** Split the sentence text into token spans and the gaps between them. */
function segment(korean: string, tokens: Token[]) {
  const parts: ({ kind: 'gap'; text: string } | { kind: 'token'; token: Token; index: number })[] = [];
  let cursor = 0;
  tokens.forEach((token, index) => {
    const at = korean.indexOf(token.text, cursor);
    if (at === -1) return;
    if (at > cursor) parts.push({ kind: 'gap', text: korean.slice(cursor, at) });
    parts.push({ kind: 'token', token, index });
    cursor = at + token.text.length;
  });
  if (cursor < korean.length) parts.push({ kind: 'gap', text: korean.slice(cursor) });
  return parts;
}

function MarkedToken({ token }: { token: Token }) {
  if (!token.marker || !token.text.endsWith(token.marker)) return <>{token.text}</>;
  const base = token.text.slice(0, token.text.length - token.marker.length);
  return (
    <>
      {base}
      <span className="token__marker">{token.marker}</span>
    </>
  );
}

export function SentenceCard({ sentence, size = 'md', suppressTranslation = false, showTokens = true }: SentenceCardProps) {
  const { showRomanization, showTranslation, isStatic } = useDisplay();
  const [revealed, setRevealed] = useState(false);
  const [openToken, setOpenToken] = useState<number | null>(null);
  const panelId = useId();
  const tokens = showTokens ? sentence.tokens : undefined;
  const active = openToken !== null && tokens ? tokens[openToken] : null;

  return (
    <div className={`sentence sentence--${size}`} lang="ko">
      <div className="sentence__main">
        <p className="sentence__korean">
          {tokens
            ? segment(sentence.korean, tokens).map((part, i) =>
                part.kind === 'gap' ? (
                  <span key={i}>{part.text}</span>
                ) : isStatic ? (
                  <span key={i} className={`token token--${part.token.role}`}>
                    <span className="token__text">
                      <MarkedToken token={part.token} />
                    </span>
                    {ROLE_LABELS[part.token.role] && (
                      <span className="token__role" lang="en">
                        {ROLE_LABELS[part.token.role]}
                      </span>
                    )}
                  </span>
                ) : (
                  <button
                    key={i}
                    type="button"
                    className={`token token--${part.token.role}${openToken === part.index ? ' is-open' : ''}`}
                    aria-expanded={openToken === part.index}
                    aria-controls={panelId}
                    onClick={() => setOpenToken(openToken === part.index ? null : part.index)}
                  >
                    <span className="token__text">
                      <MarkedToken token={part.token} />
                    </span>
                    {ROLE_LABELS[part.token.role] && (
                      <span className="token__role" lang="en">
                        {ROLE_LABELS[part.token.role]}
                      </span>
                    )}
                  </button>
                ),
              )
            : sentence.korean}
        </p>
        <AudioButton text={sentence.korean} label={sentence.korean} showSlow={size === 'lg'} />
      </div>

      {showRomanization && (
        <p className="sentence__romanization" lang="ko-Latn">
          {sentence.romanization}
        </p>
      )}

      {!suppressTranslation &&
        (showTranslation || revealed ? (
          <p className="sentence__english" lang="en">
            {sentence.english}
          </p>
        ) : (
          <button type="button" className="link-button sentence__reveal" onClick={() => setRevealed(true)} lang="en">
            Show translation
          </button>
        ))}

      {tokens && !isStatic && (
        <div id={panelId} className="token-panel" aria-live="polite" lang="en">
          {active && (
            <dl className="token-panel__grid">
              <div>
                <dt>Word</dt>
                <dd lang="ko">{active.text}</dd>
              </div>
              <div>
                <dt>Romanization</dt>
                <dd>{active.romanization}</dd>
              </div>
              <div>
                <dt>Meaning</dt>
                <dd>{active.meaning}</dd>
              </div>
              {ROLE_LABELS[active.role] && (
                <div>
                  <dt>Role</dt>
                  <dd>
                    {ROLE_LABELS[active.role]}
                    {active.marker && (
                      <>
                        {' '}
                        (marked by <span lang="ko">{active.marker}</span>)
                      </>
                    )}
                  </dd>
                </div>
              )}
              {active.vocabularyId && content.getVocabulary(active.vocabularyId) && (
                <div>
                  <dt>Dictionary form</dt>
                  <dd>
                    <span lang="ko">{content.getVocabulary(active.vocabularyId)!.hangul}</span> ·{' '}
                    {content.getVocabulary(active.vocabularyId)!.gloss}
                  </dd>
                </div>
              )}
              {active.grammarConceptId && content.getGrammar(active.grammarConceptId) && (
                <div>
                  <dt>Grammar</dt>
                  <dd>{content.getGrammar(active.grammarConceptId)!.name}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}

      {(sentence.literal || sentence.pronunciationNote || sentence.note) && (
        <div className="sentence__notes" lang="en">
          {sentence.literal && showTranslation && (
            <p>
              <span className="note-label">Word by word:</span> {sentence.literal}
            </p>
          )}
          {sentence.pronunciationNote && (
            <p>
              <span className="note-label">Pronunciation:</span> {sentence.pronunciationNote}
            </p>
          )}
          {sentence.note && (
            <p>
              <span className="note-label">Note:</span> {sentence.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Korean text with one substring (usually the verb ending) highlighted. */
export function HighlightedKorean({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;
  const at = text.lastIndexOf(highlight);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="ending-highlight">{highlight}</mark>
      {text.slice(at + highlight.length)}
    </>
  );
}
