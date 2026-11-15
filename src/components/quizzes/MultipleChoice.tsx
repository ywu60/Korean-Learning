import { useState } from 'react';
import type { MultipleChoiceQuestion } from '../../domain/schema';
import { gradeMultipleChoice } from '../../domain/quiz';
import { SentenceCard } from '../learning/SentenceCard';
import { Feedback } from './Feedback';
import { Icon } from '../ui/Icon';

export function MultipleChoice({
  question,
  onAnswer,
}: {
  question: MultipleChoiceQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct = answered && gradeMultipleChoice(question, selected);
  const correctText = question.options.find((o) => o.id === question.correctOptionId)?.text;

  const choose = (optionId: string) => {
    if (answered) return;
    setSelected(optionId);
    onAnswer(gradeMultipleChoice(question, optionId));
  };

  return (
    <>
      {question.sentence && <SentenceCard sentence={question.sentence} suppressTranslation={!answered} showTokens={false} />}
      <ul className="options" role="list">
        {question.options.map((o, i) => {
          const isSelected = selected === o.id;
          const isCorrect = o.id === question.correctOptionId;
          const state = !answered ? '' : isCorrect ? ' is-correct' : isSelected ? ' is-incorrect' : ' is-dimmed';
          return (
            <li key={o.id}>
              <button
                type="button"
                className={`option${state}`}
                onClick={() => choose(o.id)}
                aria-disabled={answered}
                aria-pressed={isSelected}
              >
                <span className="option__letter" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="option__text" lang={/[가-힣]/.test(o.text) ? 'ko' : 'en'}>
                  {o.text}
                </span>
                {answered && isCorrect && (
                  <span className="option__status">
                    <Icon name="check" size={16} /> Correct answer
                  </span>
                )}
                {answered && isSelected && !isCorrect && (
                  <span className="option__status">
                    <Icon name="cross" size={16} /> Your answer
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {!answered && question.hint && (
        <details className="hint">
          <summary>Show a hint</summary>
          <p>{question.hint}</p>
        </details>
      )}
      {answered && (
        <Feedback correct={correct} onRetry={() => setSelected(null)}>
          {!correct && (
            <p>
              The answer is <strong lang="ko">{correctText}</strong>.
            </p>
          )}
          <p>{question.explanation}</p>
        </Feedback>
      )}
    </>
  );
}
