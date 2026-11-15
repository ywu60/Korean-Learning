import { useMemo, useState } from 'react';
import type { OrderingQuestion } from '../../domain/schema';
import { gradeOrdering, shuffledPieces } from '../../domain/quiz';
import { useDisplay } from '../../hooks/useDisplay';
import { AudioButton } from '../learning/AudioButton';
import { Feedback } from './Feedback';

export function Ordering({ question, onAnswer }: { question: OrderingQuestion; onAnswer: (correct: boolean) => void }) {
  const { showRomanization } = useDisplay();
  const initial = useMemo(() => shuffledPieces(question), [question]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const remaining = initial.filter((p) => !placed.includes(p));
  const correct = checked && gradeOrdering(question, placed);

  const check = () => {
    setChecked(true);
    onAnswer(gradeOrdering(question, placed));
  };

  return (
    <>
      <p className="field-label" id={`${question.id}-answer-label`}>
        Your sentence
      </p>
      <div className="ordering__answer" aria-labelledby={`${question.id}-answer-label`} role="group" lang="ko">
        {placed.length === 0 && (
          <span className="muted" lang="en">
            Select words below in order.
          </span>
        )}
        {placed.map((p) => (
          <button
            key={p}
            type="button"
            className="piece piece--placed"
            onClick={() => !checked && setPlaced(placed.filter((x) => x !== p))}
            aria-disabled={checked}
            aria-label={checked ? p : `${p} (remove)`}
          >
            {p}
          </button>
        ))}
      </div>
      <p className="field-label" id={`${question.id}-bank-label`}>
        Word bank
      </p>
      <div className="ordering__bank" role="group" aria-labelledby={`${question.id}-bank-label`} lang="ko">
        {remaining.map((p) => (
          <button key={p} type="button" className="piece" onClick={() => !checked && setPlaced([...placed, p])} aria-disabled={checked}>
            {p}
          </button>
        ))}
        {remaining.length === 0 && (
          <span className="muted" lang="en">
            All words placed.
          </span>
        )}
      </div>
      {!checked ? (
        <div className="button-row">
          <button type="button" className="button" onClick={check} disabled={remaining.length > 0}>
            Check answer
          </button>
          <button type="button" className="button button--quiet" onClick={() => setPlaced([])} disabled={placed.length === 0}>
            Clear
          </button>
        </div>
      ) : (
        <Feedback
          correct={correct}
          onRetry={() => {
            setPlaced([]);
            setChecked(false);
          }}
        >
          <p className="model-answer__korean" lang="ko">
            {question.sentence.korean} <AudioButton text={question.sentence.korean} label={question.sentence.korean} size="sm" />
          </p>
          {showRomanization && <p className="model-answer__romanization">{question.sentence.romanization}</p>}
          <p>{question.explanation}</p>
        </Feedback>
      )}
    </>
  );
}
