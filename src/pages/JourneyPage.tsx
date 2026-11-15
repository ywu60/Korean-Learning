import { Link, useParams } from 'react-router-dom';
import { content } from '../content';
import { paths } from '../app/paths';
import { ModuleCard } from '../components/learning/ModuleCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { NotFoundPage } from './NotFoundPage';

export function JourneyPage() {
  const { journeySlug = '' } = useParams();
  const journey = content.getJourney(journeySlug);
  useDocumentTitle(journey?.title ?? 'Not found');
  if (!journey) return <NotFoundPage />;
  const modules = content.getModulesForJourney(journey.id);

  return (
    <div className="page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to={paths.journeys}>Journeys</Link> <span aria-hidden="true">/</span> <span>{journey.title}</span>
      </nav>
      <p className="eyebrow">{journey.level}</p>
      <h1>{journey.title}</h1>
      <p className="lead">{journey.description}</p>
      {modules.length === 0 ? (
        <p className="muted">Modules for this journey are being planned.</p>
      ) : (
        <div className="card-grid">
          {modules.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      )}
    </div>
  );
}
