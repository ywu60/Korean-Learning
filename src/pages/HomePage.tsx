import { Link } from 'react-router-dom';
import { content } from '../content';
import { useProgress } from '../hooks/useProgress';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { learnPath, paths } from '../app/paths';
import { ModuleCard } from '../components/learning/ModuleCard';
import { Icon } from '../components/ui/Icon';

export function HomePage() {
  useDocumentTitle('');
  const { progress } = useProgress();
  const last = progress.lastVisited;
  const lastSection = last ? content.getSection(last.sectionId) : undefined;
  const lastStep = last && lastSection ? content.findStep(last.sectionId, last.stepId) : undefined;
  const lastModule = last ? content.getModule(last.moduleId) : undefined;

  const firstModule = content.modules.find((m) => m.status === 'available' && m.sectionIds.length > 0);
  const firstSection = firstModule ? content.getSectionsForModule(firstModule.id)[0] : undefined;

  return (
    <div className="page">
      <section className="hero">
        <p className="hero__korean" lang="ko" aria-hidden="true">
          한국어 배우기
        </p>
        <h1 className="hero__title">Learn Korean one useful sentence at a time</h1>
        <p className="hero__lead">
          New words appear when you need them: inside a grammar pattern, an example sentence, or a short exercise. Later
          lessons keep reusing them, so vocabulary and grammar grow together.
        </p>
        <div className="button-row">
          {last && lastSection && lastStep && lastModule ? (
            <Link className="button button--primary" to={learnPath(last.moduleId, last.sectionId, last.stepId)}>
              Continue: {lastSection.label}, step {lastStep.index + 1}
              <Icon name="arrowRight" size={18} />
            </Link>
          ) : (
            firstModule &&
            firstSection && (
              <Link className="button button--primary" to={learnPath(firstModule.id, firstSection.id)}>
                Start the first lesson
                <Icon name="arrowRight" size={18} />
              </Link>
            )
          )}
          <Link className="button" to={paths.journeys}>
            Browse journeys
          </Link>
        </div>
        {last && lastSection && lastModule && (
          <p className="muted small">
            Last visited: {lastModule.title} · {lastSection.title}
          </p>
        )}
      </section>

      {content.journeys.map((journey) => {
        const modules = content.getModulesForJourney(journey.id);
        return (
          <section key={journey.id} className="home-journey" aria-labelledby={`journey-${journey.id}`}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  Journey · {journey.level}
                  {journey.status === 'planned' && ' · Planned'}
                </p>
                <h2 id={`journey-${journey.id}`}>
                  {journey.status === 'available' ? <Link to={paths.journey(journey.slug)}>{journey.title}</Link> : journey.title}
                </h2>
              </div>
            </div>
            <p>{journey.description}</p>
            {modules.length > 0 ? (
              <div className="card-grid">
                {modules.map((m) => (
                  <ModuleCard key={m.id} module={m} />
                ))}
              </div>
            ) : (
              <p className="muted">Modules for this journey are being planned.</p>
            )}
          </section>
        );
      })}

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works">How each section works</h2>
        <ol className="how-list">
          <li>
            <strong>Short introduction</strong> to one learning goal.
          </li>
          <li>
            <strong>Contextual vocabulary</strong> that appears in the examples.
          </li>
          <li>
            <strong>Simple grammar explanations</strong> with verb forms and particles broken down.
          </li>
          <li>
            <strong>Korean sentences</strong> with Revised Romanization and English, each one hideable.
          </li>
          <li>
            <strong>Practice and quizzes</strong> with explanations for every answer.
          </li>
          <li>
            <strong>Review</strong> that connects earlier words and concepts to later lessons.
          </li>
        </ol>
      </section>
    </div>
  );
}
