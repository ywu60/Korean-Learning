import type { GrammarStep } from '../../../domain/schema';
import { content } from '../../../content';
import { SentenceCard } from '../SentenceCard';
import { FormLegend, VerbFormList } from '../VerbFormList';

export function GrammarStepView({ step }: { step: GrammarStep }) {
  return (
    <div className="step-grammar">
      {step.grammarConceptIds.length > 0 && (
        <p className="chip-row" aria-label="Grammar in this step">
          {step.grammarConceptIds.map((id) => {
            const g = content.getGrammar(id);
            return g ? (
              <span key={id} className="chip" lang="ko">
                {g.label}
              </span>
            ) : null;
          })}
        </p>
      )}
      {step.body.map((p, i) => (
        <p key={i} className={i === 0 ? 'lead' : undefined}>
          {p}
        </p>
      ))}
      {step.rules.length > 0 && (
        <dl className="rule-list">
          {step.rules.map((r) => (
            <div key={r.pattern} className="rule">
              <dt className="rule__pattern">{r.pattern}</dt>
              <dd className="rule__explanation">{r.explanation}</dd>
            </div>
          ))}
        </dl>
      )}
      {step.forms.length > 0 && (
        <section aria-label="Forms">
          <FormLegend />
          <VerbFormList forms={step.forms} />
        </section>
      )}
      {step.examples.length > 0 && (
        <section className="examples" aria-label="Examples">
          <h3 className="section-label">Example</h3>
          {step.examples.map((s) => (
            <SentenceCard key={s.id} sentence={s} />
          ))}
        </section>
      )}
      {step.callout && (
        <aside className="callout" aria-labelledby={`${step.id}-callout`}>
          <h3 id={`${step.id}-callout`} className="callout__title">
            {step.callout.title}
          </h3>
          {step.callout.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </aside>
      )}
    </div>
  );
}
