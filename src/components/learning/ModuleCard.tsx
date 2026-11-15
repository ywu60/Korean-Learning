import { Link } from 'react-router-dom';
import type { Module } from '../../domain/schema';
import { content } from '../../content';
import { getSectionProgress } from '../../domain/progress';
import { useProgress } from '../../hooks/useProgress';
import { paths } from '../../app/paths';
import { ProgressBar } from '../layout/ProgressBar';

export function ModuleCard({ module }: { module: Module }) {
  const { progress } = useProgress();
  const sections = content.getSectionsForModule(module.id);
  const lessons = sections.filter((s) => s.kind === 'lesson');
  const done = sections.filter((s) => getSectionProgress(progress, s).complete).length;
  const available = module.status === 'available' && sections.length > 0;

  return (
    <article className={`card module-card${available ? '' : ' module-card--planned'}`}>
      <p className="eyebrow">Module {module.number}</p>
      <h3 className="card__title">
        {available ? <Link to={paths.module(module.slug)}>{module.title}</Link> : module.title}
      </h3>
      <p>{module.description}</p>
      {available ? (
        <>
          <p className="muted">
            {lessons.length} sections{sections.length > lessons.length ? ' + module review' : ''}
            {module.estimatedMinutes ? ` · about ${module.estimatedMinutes} minutes` : ''}
          </p>
          <ProgressBar value={done} max={sections.length} label={`${module.title} progress`} />
          <p className="muted small">
            {done} of {sections.length} complete
          </p>
        </>
      ) : (
        <p className="chip chip--quiet">Coming later</p>
      )}
    </article>
  );
}
