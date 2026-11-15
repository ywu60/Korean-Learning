import { Link, useParams } from 'react-router-dom';
import { content } from '../content';
import { DisplayContext } from '../hooks/useDisplay';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { learnPath, paths } from '../app/paths';
import { StepRenderer } from '../components/learning/StepRenderer';
import { answerKeyText } from '../components/quizzes/StaticQuestion';
import { Icon } from '../components/ui/Icon';
import { NotFoundPage } from './NotFoundPage';

/** A static, print-friendly rendering of a whole section with an answer key. */
export function PrintSectionPage() {
  const { moduleId = '', sectionId = '' } = useParams();
  const mod = content.getModule(moduleId);
  const section = content.getSection(sectionId);
  useDocumentTitle(section ? `${section.title} (printable)` : 'Not found');
  if (!mod || !section || !mod.sectionIds.includes(section.id)) return <NotFoundPage />;

  const quizSteps = section.steps.filter((s) => s.type === 'quiz');

  return (
    <DisplayContext.Provider value={{ mode: 'static' }}>
      <div className="page print-page">
        <div className="no-print print-page__toolbar">
          <Link className="button" to={paths.module(mod.slug)}>
            <Icon name="arrowLeft" size={16} /> Back to module
          </Link>
          <Link className="button" to={learnPath(mod.id, section.id)}>
            Open interactive lesson
          </Link>
          <button type="button" className="button button--primary" onClick={() => window.print()}>
            <Icon name="printer" size={16} /> Print
          </button>
        </div>
        <header>
          <p className="eyebrow">
            {mod.title} · {section.label}
          </p>
          <h1>{section.title}</h1>
          <p>{section.summary}</p>
        </header>
        {section.steps.map((step) => (
          <section key={step.id} className="print-step">
            <h2>{step.title}</h2>
            <StepRenderer step={step} context={{ module: mod, section }} />
          </section>
        ))}
        {quizSteps.length > 0 && (
          <section className="print-step answer-key">
            <h2>Answer key</h2>
            {quizSteps.map((step) =>
              step.type === 'quiz' ? (
                <div key={step.id}>
                  <h3>{step.title}</h3>
                  <ol>
                    {step.questions.map((q) => (
                      <li key={q.id}>
                        <span lang="ko">{answerKeyText(q)}</span>
                        <br />
                        <span className="muted small">{q.explanation}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null,
            )}
          </section>
        )}
      </div>
    </DisplayContext.Provider>
  );
}
