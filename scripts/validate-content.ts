/**
 * Build-time content validation. Run with `npm run validate:content`.
 * Exits non-zero if any lesson file is malformed or references broken IDs.
 */
import { rawContent } from '../src/content/rawContent';
import { validateContent } from '../src/domain/validate';

const result = validateContent(rawContent);

for (const warning of result.warnings) console.warn(`warning: ${warning}`);

if (!result.ok) {
  console.error(`\n✗ Content validation failed with ${result.errors.length} error(s):\n`);
  for (const error of result.errors) console.error(`  • ${error}`);
  process.exit(1);
}

const { curriculum, sections, vocabulary, grammar } = result.content;
const steps = sections.reduce((n, s) => n + s.steps.length, 0);
const questions = sections.reduce(
  (n, s) => n + s.steps.reduce((m, step) => m + (step.type === 'quiz' ? step.questions.length : 0), 0),
  0,
);
console.log(
  `✓ Content valid: ${curriculum.journeys.length} journeys, ${curriculum.modules.length} modules, ` +
    `${sections.length} sections, ${steps} steps, ${questions} questions, ` +
    `${vocabulary.length} vocabulary entries, ${grammar.length} grammar concepts.`,
);
