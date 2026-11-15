import type { Question } from '../../domain/schema';
import { useProgress } from '../../hooks/useProgress';
import { MultipleChoice } from './MultipleChoice';
import { Ordering } from './Ordering';
import { SelfCheck } from './SelfCheck';
import { TokenSelect } from './TokenSelect';

const TYPE_LABELS: Record<Question['type'], string> = {
  multipleChoice: 'Multiple choice',
  selfCheck: 'Self-check',
  tokenSelect: 'Tap the word',
  ordering: 'Word order',
};

export function QuestionCard({ question, number, total }: { question: Question; number: number; total: number }) {
  const { progress, recordAnswer } = useProgress();
  const previous = progress.questionResults[question.id];
  const onAnswer = (correct: boolean) => recordAnswer(question.id, correct);
  const headingId = `${question.id}-heading`;

  return (
    <article className="question" aria-labelledby={headingId}>
      <header className="question__header">
        <span className="question__number">
          Question {number} of {total}
        </span>
        <span className="chip chip--quiet">{TYPE_LABELS[question.type]}</span>
        {previous && (
          <span className="question__previous">
            Earlier: {previous.firstAttemptCorrect ? 'correct on first try' : 'needed another try'}
          </span>
        )}
      </header>
      <h3 id={headingId} className="question__prompt">
        {question.prompt}
      </h3>
      {question.type === 'multipleChoice' && <MultipleChoice question={question} onAnswer={onAnswer} />}
      {question.type === 'selfCheck' && <SelfCheck question={question} onAnswer={onAnswer} />}
      {question.type === 'tokenSelect' && <TokenSelect question={question} onAnswer={onAnswer} />}
      {question.type === 'ordering' && <Ordering question={question} onAnswer={onAnswer} />}
    </article>
  );
}
