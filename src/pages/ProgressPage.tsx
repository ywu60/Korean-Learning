import { Link } from 'react-router-dom';
import { content } from '../content';
import { getSectionProgress } from '../domain/progress';
import { findWeakAreas, summarizeScores } from '../domain/quiz';
import { useProgress } from '../hooks/useProgress';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { learnPath, paths } from '../app/paths';
import { ProgressBar } from '../components/layout/ProgressBar';

export function ProgressPage() {
  useDocumentTitle('Progress');
  const { progress } = useProgress();
  const modules = content.modules.filter((m) => m.status === 'available' && m.sectionIds.length > 0);
  const answeredTotal = Object.keys(progress.questionResults).length;

  return (
    <div className="page">
      <h1>Your progress</h1>
      <p className="lead">
        Saved only in this browser. Clearing browser data or using another device starts fresh. You can export a backup in{' '}
        <Link to={paths.settings}>Settings</Link>.
      </p>

      <dl className="stat-row">
        <div className="stat">
          <dt>Sections completed</dt>
          <dd>{Object.keys(progress.completedSections).length}</dd>
        </div>
        <div className="stat">
          <dt>Steps completed</dt>
          <dd>{Object.keys(progress.completedSteps).length}</dd>
        </div>
        <div className="stat">
          <dt>Questions answered</dt>
          <dd>{answeredTotal}</dd>
        </div>
        <div className="stat">
          <dt>Saved words</dt>
          <dd>{progress.savedVocabularyIds.length}</dd>
        </div>
      </dl>

      {modules.map((mod) => {
        const sections = content.getSectionsForModule(mod.id);
        const moduleQuestions = content.getQuestionsForModule(mod.id);
        const assessmentIds = moduleQuestions.filter((q) => q.assessment).map((q) => q.question.id);
        const assessment = summarizeScores(assessmentIds, progress.questionResults);
        const weak = findWeakAreas(
          moduleQuestions.map((q) => ({ id: q.question.id, conceptIds: q.question.conceptIds })),
          progress.questionResults,
        );
        return (
          <section key={mod.id} className="card" aria-labelledby={`progress-${mod.id}`}>
            <p className="eyebrow">Module {mod.number}</p>
            <h2 id={`progress-${mod.id}`} className="card__title">
              <Link to={paths.module(mod.slug)}>{mod.title}</Link>
            </h2>
            <table className="progress-table">
              <thead>
                <tr>
                  <th scope="col">Section</th>
                  <th scope="col">Steps</th>
                  <th scope="col">Practice (first try)</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => {
                  const sp = getSectionProgress(progress, s);
                  const score = summarizeScores(
                    content.getQuestionsForSection(s.id).map((q) => q.question.id),
                    progress.questionResults,
                  );
                  return (
                    <tr key={s.id}>
                      <th scope="row">
                        <Link to={learnPath(mod.id, s.id)}>
                          {s.label}: {s.title}
                        </Link>
                        {sp.complete && <span className="chip chip--success small">Completed</span>}
                      </th>
                      <td data-label="Steps">
                        <ProgressBar value={sp.completedSteps} max={sp.totalSteps} label={`${s.title} steps`} />
                        <span className="small muted">
                          {sp.completedSteps}/{sp.totalSteps}
                        </span>
                      </td>
                      <td data-label="Practice">
                        {score.answered === 0
                          ? <span className="muted">Not started</span>
                          : `${score.correctFirstTry}/${score.answered} correct (${score.total} questions)`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {assessmentIds.length > 0 && (
              <p>
                <strong>Module assessment:</strong>{' '}
                {assessment.answered === 0
                  ? 'not taken yet'
                  : `${assessment.correctFirstTry} of ${assessment.total} correct on first try${
                      assessment.answered < assessment.total ? ` (${assessment.total - assessment.answered} unanswered)` : ''
                    }`}
              </p>
            )}
            {weak.length > 0 && (
              <>
                <h3 className="section-label">Concepts to revisit</h3>
                <ul className="weak-list">
                  {weak.slice(0, 5).map((w) => {
                    const g = content.getGrammar(w.conceptId);
                    const src = content.getGrammarSource(w.conceptId);
                    return g ? (
                      <li key={w.conceptId}>
                        <span>
                          {g.name}{' '}
                          <span className="muted">
                            ({w.missed} of {w.answered} missed)
                          </span>
                        </span>
                        {src && (
                          <Link className="text-link" to={learnPath(src.moduleId, src.sectionId, src.stepId)}>
                            Review lesson
                          </Link>
                        )}
                      </li>
                    ) : null;
                  })}
                </ul>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
