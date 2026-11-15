import type { Step } from '../../domain/schema';
import type { StepContext } from './StepContext';
import { ComparisonStepView } from './steps/ComparisonStepView';
import { ExampleStepView } from './steps/ExampleStepView';
import { GrammarStepView } from './steps/GrammarStepView';
import { IntroStepView } from './steps/IntroStepView';
import { QuizStepView } from './steps/QuizStepView';
import { RecapStepView } from './steps/RecapStepView';
import { VocabularyStepView } from './steps/VocabularyStepView';

/**
 * Renders one content block. To add a new block type: define its schema in
 * `domain/schema.ts`, add a view component, and add a case here. TypeScript's
 * exhaustiveness check below flags any unhandled type.
 */
export function StepRenderer({ step, context }: { step: Step; context: StepContext }) {
  switch (step.type) {
    case 'intro':
      return <IntroStepView step={step} context={context} />;
    case 'vocabulary':
      return <VocabularyStepView step={step} />;
    case 'grammar':
      return <GrammarStepView step={step} />;
    case 'example':
      return <ExampleStepView step={step} />;
    case 'comparison':
      return <ComparisonStepView step={step} />;
    case 'quiz':
      return <QuizStepView step={step} />;
    case 'recap':
      return <RecapStepView step={step} context={context} />;
    default: {
      const unhandled: never = step;
      return <p>Unsupported content block: {(unhandled as { type: string }).type}</p>;
    }
  }
}

export const STEP_TYPE_LABELS: Record<Step['type'], string> = {
  intro: 'Introduction',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  example: 'Examples',
  comparison: 'Comparison',
  quiz: 'Practice',
  recap: 'Recap',
};
