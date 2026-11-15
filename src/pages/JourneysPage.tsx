import { Link } from 'react-router-dom';
import { content } from '../content';
import { paths } from '../app/paths';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function JourneysPage() {
  useDocumentTitle('Journeys');
  return (
    <div className="page">
      <h1>Learning journeys</h1>
      <p className="lead">Each journey is a sequence of modules. Start with Korean Foundations; more tracks will follow.</p>
      <div className="card-grid">
        {content.journeys.map((j) => {
          const modules = content.getModulesForJourney(j.id);
          const available = modules.filter((m) => m.status === 'available').length;
          return (
            <article key={j.id} className={`card${j.status === 'planned' ? ' module-card--planned' : ''}`}>
              <p className="eyebrow">{j.level}</p>
              <h2 className="card__title">
                {j.status === 'available' ? <Link to={paths.journey(j.slug)}>{j.title}</Link> : j.title}
              </h2>
              <p>{j.description}</p>
              <p className="muted">
                {j.status === 'planned'
                  ? 'Planned'
                  : `${available} of ${modules.length} module${modules.length === 1 ? '' : 's'} available`}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
