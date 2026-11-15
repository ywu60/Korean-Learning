import { useState } from 'react';
import type { TokenSelectQuestion } from '../../domain/schema';
import { gradeTokenSelect } from '../../domain/quiz';
import { useDisplay } from '../../hooks/useDisplay';
import { Feedback } from './Feedback';

export function TokenSelect({ question, onAnswer }: { question: TokenSelectQuestion; onAnswer: (correct: boolean) => void }) {
  const { showRomanization, showTranslation } = useDisplay();
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const correct = checked && gradeTokenSelect(question, selected);
  const { tokens } = question.sentence;

  const toggle = (i: number) => {
    if (checked) return;
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };

  const check = () => {
    setChecked(true);
    onAnswer(gradeTokenSelect(question, selected));
  };

  return (
    <>
      <div className="token-select" role="group" aria-label="Words in the sentence">
        {tokens.map((t, i) => {
          const isSelected = selected.includes(i);
          const isAnswer = question.correctTokenIndexes.includes(i);
          const state = checked ? (isAnswer ? ' is-correct' : isSelected ? ' is-incorrect' : '') : isSelected ? ' is-selected' : '';
          return (
            <button
              key={i}
              type="button"
              className={`token-choice${state}`}
              aria-pressed={isSelected}
              aria-disabled={checked}
              onClick={() => toggle(i)}
            >
              <span lang="ko" className="token-choice__text">
                {t.text}
              </span>
              {showRomanization && <span className="token-choice__romanization">{t.romanization}</span>}
              {checked && isAnswer && <span className="token-choice__status">answer</span>}
            </button>
          );
        })}
      </div>
      {showTranslation && <p className="muted">“{question.sentence.english}”</p>}
      {!checked ? (
        <button type="button" className="button" onClick={check} disabled={selected.length === 0}>
          Check answer
        </button>
      ) : (
        <Feedback
          correct={correct}
          onRetry={() => {
            setSelected([]);
            setChecked(false);
          }}
        >
          {!correct && (
            <p>
              The answer is{' '}
              <strong lang="ko">{question.correctTokenIndexes.map((i) => tokens[i].text).join(', ')}</strong>.
            </p>
          )}
          <p>{question.explanation}</p>
        </Feedback>
      )}
    </>
  );
}
