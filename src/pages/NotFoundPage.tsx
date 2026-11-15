import { Link } from 'react-router-dom';
import { paths } from '../app/paths';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Not found');
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p>This lesson or page doesn’t exist, or its address has changed.</p>
      <div className="button-row">
        <Link className="button button--primary" to={paths.home}>
          Go to the homepage
        </Link>
        <Link className="button" to={paths.journeys}>
          Browse journeys
        </Link>
      </div>
    </div>
  );
}
