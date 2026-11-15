import { useId, useState } from 'react';
import type { SelfCheckQuestion } from '../../domain/schema';
import { matchesSelfCheck } from '../../domain/quiz';
import { useDisplay } from '../../hooks/useDisplay';
import { AudioButton } from '../learning/AudioButton';
import { Feedback } from './Feedback';

const SOURCE_LABELS: Record<SelfCheckQuestion['mode'], string> = {
  'translate-to-korean': 'English',
  'translate-to-english': 'Korean',
  transform: 'Original sentence',
  produce: 'Verb',
};

export function SelfCheck({ question, onAnswer }: { question: SelfCheckQuestion; onAnswer: (correct: boolean) => void }) {
  const { showRomanization } = useDisplay();
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [assessment, setAssessment] = useState<boolean | null>(null);
  const inputId = useId();
  const sourceIsKorean = question.source ? /[가-힣]/.test(question.source) : false;
  const answerIsEnglish = question.mode === 'translate-to-english';
  const matched = revealed && typed.trim() !== '' && matchesSelfCheck(question, typed);

  const assess = (gotIt: boolean) => {
    setAssessment(gotIt);
    onAnswer(gotIt);
  };

  const reset = () => {
    setTyped('');
    setRevealed(false);
    setAssessment(null);
  };

  return (
    <>
      {question.source && (
        <div className="selfcheck__source">
          <span className="selfcheck__source-label">{SOURCE_LABELS[question.mode]}</span>
          <p className="selfcheck__source-text" lang={sourceIsKorean ? 'ko' : 'en'}>
            {question.source}
          </p>
          {sourceIsKorean && <AudioButton text={question.source} label={question.source} size="sm" />}
        </div>
      )}
      <label htmlFor={inputId} className="field-label">
        Your answer <span className="muted">(optional: you can also say it out loud)</span>
      </label>
      <textarea
        id={inputId}
        className="text-input"
        rows={2}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={revealed}
        lang={answerIsEnglish ? 'en' : 'ko'}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {!revealed ? (
        <div className="button-row">
          <button type="button" className="button" onClick={() => setRevealed(true)}>
            Reveal answer
          </button>
          {question.hint && (
            <details className="hint">
              <summary>Show a hint</summary>
              <p>{question.hint}</p>
            </details>
          )}
        </div>
      ) : (
        <Feedback correct={assessment} title={assessment === null ? 'Model answer' : undefined} onRetry={assessment !== null ? reset : undefined}>
          <div className="model-answer">
            {question.answer.korean && (
              <p className="model-answer__korean" lang="ko">
                {question.answer.korean} <AudioButton text={question.answer.korean.replace(/ · | \/ /g, ', ')} label="model answer" size="sm" />
              </p>
            )}
            {question.answer.romanization && showRomanization && (
              <p className="model-answer__romanization">{question.answer.romanization}</p>
            )}
            {question.answer.english && <p className="model-answer__english">{question.answer.english}</p>}
          </div>
          {typed.trim() !== '' && (
            <p className="selfcheck__match">
              {matched
                ? 'Your typed answer matches an accepted answer.'
                : 'Your typed answer differs from the listed answers. It may still be correct; compare carefully.'}
            </p>
          )}
          <p>{question.explanation}</p>
          {assessment === null ? (
            <fieldset className="selfcheck__assess">
              <legend>How did you do?</legend>
              <div className="button-row">
                <button type="button" className="button" onClick={() => assess(true)}>
                  I got it
                </button>
                <button type="button" className="button button--quiet" onClick={() => assess(false)}>
                  Not yet
                </button>
              </div>
            </fieldset>
          ) : (
            <p className="muted">{assessment ? 'Marked as correct.' : 'Marked for more practice.'}</p>
          )}
        </Feedback>
      )}
    </>
  );
}
