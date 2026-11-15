import type { VocabularyStep } from '../../../domain/schema';
import { content } from '../../../content';
import { VocabularyCard } from '../VocabularyCard';

export function VocabularyStepView({ step }: { step: VocabularyStep }) {
  return (
    <div>
      {step.intro && <p className="lead">{step.intro}</p>}
      <div className="vocab-grid">
        {step.vocabularyIds.map((id) => {
          const entry = content.getVocabulary(id);
          return entry ? <VocabularyCard key={id} entry={entry} /> : null;
        })}
      </div>
    </div>
  );
}
