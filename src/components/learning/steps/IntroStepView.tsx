import type { IntroStep } from '../../../domain/schema';
import type { StepContext } from '../StepContext';

export function IntroStepView({ step, context }: { step: IntroStep; context: StepContext }) {
  return (
    <div className="step-intro">
      {step.body.map((p, i) => (
        <p key={i} className={i === 0 ? 'lead' : undefined}>
          {p}
        </p>
      ))}
      <section className="panel" aria-labelledby={`${step.id}-objectives`}>
        <h3 id={`${step.id}-objectives`} className="panel__title">
          In this section you will
        </h3>
        <ul className="checklist">
          {context.section.learningObjectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>
      {step.callout && (
        <aside className="callout" aria-label="Note">
          <p>{step.callout}</p>
        </aside>
      )}
    </div>
  );
}
