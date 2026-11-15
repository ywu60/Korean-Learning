import type { QuizStep } from '../../../domain/schema';
import { summarizeScores } from '../../../domain/quiz';
import { useDisplay } from '../../../hooks/useDisplay';
import { useProgress } from '../../../hooks/useProgress';
import { QuestionCard } from '../../quizzes/QuestionCard';
import { StaticQuestion } from '../../quizzes/StaticQuestion';

export function QuizStepView({ step }: { step: QuizStep }) {
  const { isStatic } = useDisplay();
  const { progress } = useProgress();
  const ids = step.questions.map((q) => q.id);
  const score = summarizeScores(ids, progress.questionResults);

  if (isStatic) {
    return (
      <div>
        {step.intro && <p>{step.intro}</p>}
        <ol className="static-question-list">
          {step.questions.map((q, i) => (
            <StaticQuestion key={q.id} question={q} number={i + 1} />
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="quiz">
      {step.intro && <p className="lead">{step.intro}</p>}
      <div className="question-list">
        {step.questions.map((q, i) => (
          <QuestionCard key={q.id} question={q} number={i + 1} total={step.questions.length} />
        ))}
      </div>
      <div className={`score-summary${step.assessment ? ' score-summary--assessment' : ''}`} aria-live="polite">
        <p className="score-summary__label">{step.assessment ? 'Assessment score' : 'Your score'}</p>
        <p className="score-summary__value">
          {score.correctFirstTry} / {score.total}
          <span className="score-summary__detail">
            {score.answered < score.total
              ? ` correct on first try · ${score.total - score.answered} not yet answered`
              : ` correct on first try${score.percent !== null ? ` (${score.percent}%)` : ''}`}
          </span>
        </p>
      </div>
    </div>
  );
}
