import { Link } from 'react-router-dom';
import type { RecapStep } from '../../../domain/schema';
import { content } from '../../../content';
import { findWeakAreas, summarizeScores } from '../../../domain/quiz';
import { useDisplay } from '../../../hooks/useDisplay';
import { useProgress } from '../../../hooks/useProgress';
import { learnPath } from '../../../app/paths';
import type { StepContext } from '../StepContext';

export function RecapStepView({ step, context }: { step: RecapStep; context: StepContext }) {
  const { isStatic } = useDisplay();
  const { progress } = useProgress();
  const sectionQuestions = content.getQuestionsForSection(context.section.id);
  const sectionScore = summarizeScores(
    sectionQuestions.map((q) => q.question.id),
    progress.questionResults,
  );

  return (
    <div className="recap">
      <ul className="checklist">
        {step.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      {step.table && (
        <div className="recap-table-wrap">
          <table className="recap-table">
            <caption>{step.table.caption}</caption>
            <thead>
              <tr>
                {step.table.headers.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) =>
                    j === 0 ? (
                      <th key={j} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={j} data-label={step.table!.headers[j]}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {step.vocabularyIds.length > 0 && (
        <section aria-labelledby={`${step.id}-vocab`}>
          <h3 id={`${step.id}-vocab`} className="section-label">
            Words in this section
          </h3>
          <ul className="word-chips">
            {step.vocabularyIds.map((id) => {
              const v = content.getVocabulary(id);
              return v ? (
                <li key={id} className="word-chip">
                  <span lang="ko">{v.hangul}</span> <span className="muted">{v.gloss}</span>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      {!isStatic && sectionScore.total > 0 && (
        <p className="recap__score">
          Practice in this section: {sectionScore.correctFirstTry} of {sectionScore.answered} answered questions correct on
          the first try{sectionScore.answered < sectionScore.total && ` (${sectionScore.total - sectionScore.answered} unanswered)`}.
        </p>
      )}

      {!isStatic && step.showWeakAreas && <WeakAreas moduleId={context.module.id} />}
    </div>
  );
}

function WeakAreas({ moduleId }: { moduleId: string }) {
  const { progress } = useProgress();
  const questions = content.getQuestionsForModule(moduleId).map((q) => ({
    id: q.question.id,
    conceptIds: q.question.conceptIds,
  }));
  const answered = questions.filter((q) => progress.questionResults[q.id]).length;
  const weak = findWeakAreas(questions, progress.questionResults);

  return (
    <section className="panel" aria-labelledby="weak-areas-title">
      <h3 id="weak-areas-title" className="panel__title">
        Concepts to revisit
      </h3>
      {answered === 0 ? (
        <p>Answer some practice questions and the assessment to see personalized suggestions here.</p>
      ) : weak.length === 0 ? (
        <p>Every question you answered was correct on the first try. Well done!</p>
      ) : (
        <ul className="weak-list">
          {weak.slice(0, 6).map((w) => {
            const concept = content.getGrammar(w.conceptId);
            const source = content.getGrammarSource(w.conceptId);
            if (!concept) return null;
            return (
              <li key={w.conceptId}>
                <span>
                  <strong>{concept.name}</strong>{' '}
                  <span className="muted">
                    ({w.missed} of {w.answered} missed on first try)
                  </span>
                </span>
                {source && (
                  <Link to={learnPath(source.moduleId, source.sectionId, source.stepId)} className="text-link">
                    Review lesson
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
