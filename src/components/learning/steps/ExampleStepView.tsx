import type { ExampleStep } from '../../../domain/schema';
import { SentenceCard } from '../SentenceCard';

export function ExampleStepView({ step }: { step: ExampleStep }) {
  return (
    <div>
      {step.intro && <p className="lead">{step.intro}</p>}
      <ol className="sentence-list">
        {step.sentences.map((s) => (
          <li key={s.id}>
            <SentenceCard sentence={s} size="lg" />
          </li>
        ))}
      </ol>
      {step.explanation && (
        <aside className="callout">
          <p>{step.explanation}</p>
        </aside>
      )}
    </div>
  );
}
