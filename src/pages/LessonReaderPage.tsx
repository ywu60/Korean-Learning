import { useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { content } from '../content';
import { resumeStepId } from '../domain/navigation';
import { useProgress } from '../hooks/useProgress';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { learnPath, paths, printPath } from '../app/paths';
import { StepRenderer, STEP_TYPE_LABELS } from '../components/learning/StepRenderer';
import { ProgressBar } from '../components/layout/ProgressBar';
import { DisplayToggles } from '../components/layout/DisplayToggles';
import { Icon } from '../components/ui/Icon';
import { NotFoundPage } from './NotFoundPage';

export function LessonReaderPage() {
  const { moduleId = '', sectionId = '', stepId } = useParams();
  const navigate = useNavigate();
  const { progress, visitStep, completeStep, completeSection } = useProgress();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const mod = content.getModule(moduleId);
  const section = content.getSection(sectionId);
  const validSection = !!mod && !!section && mod.sectionIds.includes(section.id);
  const found = validSection && stepId ? content.findStep(sectionId, stepId) : undefined;

  useDocumentTitle(found && section ? `${found.step.title} · ${section.title}` : section?.title ?? 'Lesson');

  // Persist the position whenever the visible step changes.
  useEffect(() => {
    if (mod && section && found) {
      visitStep({ moduleId: mod.id, sectionId: section.id, stepId: found.step.id });
    }
  }, [mod?.id, section?.id, found?.step.id]);

  // Move focus to the step heading on navigation so screen readers announce it.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo?.({ top: 0 });
  }, [found?.step.id]);

  if (!validSection || !mod || !section) return <NotFoundPage />;
  if (!stepId) return <Navigate replace to={learnPath(mod.id, section.id, resumeStepId(section, progress))} />;
  if (!found) return <NotFoundPage />;

  const { step, index } = found;
  const total = section.steps.length;
  const isLast = index === total - 1;
  const prevStep = index > 0 ? section.steps[index - 1] : undefined;
  const nextStep = !isLast ? section.steps[index + 1] : undefined;

  const sectionIndex = mod.sectionIds.indexOf(section.id);
  const prevSection = sectionIndex > 0 ? content.getSection(mod.sectionIds[sectionIndex - 1]) : undefined;
  const nextSection = content.getSection(mod.sectionIds[sectionIndex + 1] ?? '');

  const goNext = () => {
    completeStep(step.id);
    if (nextStep) {
      navigate(learnPath(mod.id, section.id, nextStep.id));
      return;
    }
    completeSection(section.id);
    navigate(nextSection ? learnPath(mod.id, nextSection.id, nextSection.steps[0].id) : paths.module(mod.slug));
  };

  const goPrev = () => {
    if (prevStep) navigate(learnPath(mod.id, section.id, prevStep.id));
    else if (prevSection) navigate(learnPath(mod.id, prevSection.id, prevSection.steps[prevSection.steps.length - 1].id));
  };

  const nextLabel = nextStep
    ? 'Next'
    : nextSection
      ? `Finish and start ${nextSection.label}`
      : 'Finish module';

  return (
    <div className="page reader">
      <div className="reader__top">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link to={paths.module(mod.slug)}>
            <Icon name="arrowLeft" size={16} /> {mod.title}
          </Link>
        </nav>
        <div className="reader__section-heading">
          <p className="eyebrow">{section.label}</p>
          <p className="reader__section-title">{section.title}</p>
        </div>
        <div className="reader__progress">
          <ProgressBar value={index + 1} max={total} label={`${section.title}: step ${index + 1} of ${total}`} />
          <p className="small muted" aria-hidden="true">
            Step {index + 1} of {total} · {STEP_TYPE_LABELS[step.type]}
          </p>
        </div>
        <details className="outline no-print">
          <summary>Section overview</summary>
          <ol className="outline__list">
            {section.steps.map((s, i) => {
              const done = !!progress.completedSteps[s.id];
              const current = s.id === step.id;
              return (
                <li key={s.id} className={current ? 'is-current' : undefined}>
                  <Link to={learnPath(mod.id, section.id, s.id)} aria-current={current ? 'step' : undefined}>
                    <span className="outline__status" aria-hidden="true">
                      {done ? <Icon name="check" size={14} /> : i + 1}
                    </span>
                    <span>
                      {s.title}
                      <span className="visually-hidden">{done ? ' (completed)' : ''}</span>
                      <span className="outline__type"> · {STEP_TYPE_LABELS[s.type]}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link className="text-link small" to={printPath(mod.id, section.id)}>
            <Icon name="printer" size={14} /> Printable version of this section
          </Link>
        </details>
        <div className="reader__toggles no-print">
          <DisplayToggles />
        </div>
      </div>

      <article className="step" aria-labelledby="step-title">
        <p className="eyebrow">{STEP_TYPE_LABELS[step.type]}</p>
        <h1 id="step-title" ref={headingRef} tabIndex={-1} className="step__title">
          {step.title}
        </h1>
        <StepRenderer key={step.id} step={step} context={{ module: mod, section }} />

        {isLast && (
          <aside className="panel next-panel no-print" aria-label="What's next">
            {nextSection ? (
              <>
                <p className="eyebrow">Up next</p>
                <p className="next-panel__title">
                  {nextSection.label}: {nextSection.title}
                </p>
                <p>{nextSection.summary}</p>
              </>
            ) : (
              <p>You’ve reached the end of this module. Finishing returns you to the module overview.</p>
            )}
          </aside>
        )}
      </article>

      <nav className="step-nav no-print" aria-label="Lesson steps">
        <button type="button" className="button" onClick={goPrev} disabled={!prevStep && !prevSection}>
          <Icon name="arrowLeft" size={18} /> {prevStep ? 'Back' : prevSection ? `Back to ${prevSection.label}` : 'Back'}
        </button>
        <button type="button" className="button button--primary" onClick={goNext}>
          {nextLabel} <Icon name="arrowRight" size={18} />
        </button>
      </nav>
    </div>
  );
}
