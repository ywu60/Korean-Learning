import { Link, useParams } from 'react-router-dom';
import { content } from '../content';
import { getSectionProgress } from '../domain/progress';
import { resumeStepId } from '../domain/navigation';
import { summarizeScores } from '../domain/quiz';
import { useProgress } from '../hooks/useProgress';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { learnPath, paths, printPath } from '../app/paths';
import { ProgressBar } from '../components/layout/ProgressBar';
import { Icon } from '../components/ui/Icon';
import { NotFoundPage } from './NotFoundPage';

export function ModulePage() {
  const { moduleSlug = '' } = useParams();
  const mod = content.getModule(moduleSlug);
  const { progress } = useProgress();
  useDocumentTitle(mod?.title ?? 'Not found');
  if (!mod) return <NotFoundPage />;
  const journey = content.getJourney(mod.journeyId);
  const sections = content.getSectionsForModule(mod.id);

  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to={paths.journeys}>Journeys</Link> <span aria-hidden="true">/</span>{' '}
        {journey && <Link to={paths.journey(journey.slug)}>{journey.title}</Link>} <span aria-hidden="true">/</span>{' '}
        <span>Module {mod.number}</span>
      </nav>
      <p className="eyebrow">Module {mod.number}</p>
      <h1>{mod.title}</h1>
      {mod.introduction.length > 0 ? (
        mod.introduction.map((p, i) => (
          <p key={i} className={i === 0 ? 'lead' : undefined}>
            {p}
          </p>
        ))
      ) : (
        <p className="lead">{mod.description}</p>
      )}

      {sections.length === 0 ? (
        <p className="panel">This module is planned and doesn’t have lessons yet.</p>
      ) : (
        <ol className="section-list">
          {sections.map((section) => {
            const sp = getSectionProgress(progress, section);
            const score = summarizeScores(
              content.getQuestionsForSection(section.id).map((q) => q.question.id),
              progress.questionResults,
            );
            const action = sp.complete ? 'Review' : sp.started ? 'Continue' : 'Start';
            const target = sp.complete ? section.steps[0].id : resumeStepId(section, progress);
            return (
              <li key={section.id} className="card section-card">
                <div className="section-card__head">
                  <p className="eyebrow">{section.label}</p>
                  {sp.complete && (
                    <span className="chip chip--success">
                      <Icon name="check" size={14} /> Completed
                    </span>
                  )}
                </div>
                <h2 className="card__title">{section.title}</h2>
                <p>{section.summary}</p>
                <ul className="objective-list">
                  {section.learningObjectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <ProgressBar value={sp.completedSteps} max={sp.totalSteps} label={`${section.title} progress`} />
                <p className="muted small">
                  {sp.completedSteps} of {sp.totalSteps} steps
                  {section.estimatedMinutes ? ` · about ${section.estimatedMinutes} min` : ''}
                  {score.answered > 0 && ` · practice ${score.correctFirstTry}/${score.answered} first try`}
                </p>
                <div className="button-row">
                  <Link
                    className={`button${sp.complete ? '' : ' button--primary'}`}
                    to={learnPath(mod.id, section.id, target)}
                    aria-label={`${action} ${section.title}`}
                  >
                    {action}
                  </Link>
                  <Link
                    className="button button--quiet"
                    to={printPath(mod.id, section.id)}
                    aria-label={`Printable version of ${section.title}`}
                  >
                    <Icon name="printer" size={16} /> Printable version
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
