/**
 * Content schemas.
 *
 * Every piece of lesson content is validated against these Zod schemas, both
 * at build time (`npm run validate:content`) and in the test suite. TypeScript
 * types are inferred from the schemas so content and code cannot drift apart.
 *
 * Steps and questions are discriminated unions keyed on `type`. To introduce a
 * new kind of block, add a schema here, add it to the union, and register a
 * renderer in `src/components/learning/StepRenderer.tsx`. Existing lessons do
 * not need to change.
 */
import { z } from 'zod';

const id = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'IDs must be lowercase kebab-case (a-z, 0-9, -)');
const text = z.string().trim().min(1);
const hangulText = text.regex(/[가-힣]/, 'Expected Korean (Hangul) text');

/* ------------------------------------------------------------------ */
/* Sentences and tokens                                                */
/* ------------------------------------------------------------------ */

export const tokenRoleSchema = z.enum([
  'topic',
  'subject',
  'object',
  'destination',
  'location',
  'time',
  'verb',
  'noun',
  'determiner',
  'other',
]);

export const tokenSchema = z.object({
  /** The written span, exactly as it appears in the sentence. */
  text: hangulText,
  romanization: text,
  /** Short English meaning of this span, e.g. "meal (object)". */
  meaning: text,
  role: tokenRoleSchema,
  /** If the span ends with a particle or verb ending, which part it is (e.g. "을"). */
  marker: text.optional(),
  vocabularyId: id.optional(),
  grammarConceptId: id.optional(),
});

export const sentenceSchema = z.object({
  id,
  korean: hangulText,
  romanization: text,
  english: text,
  /** Optional literal word-order gloss, shown separately from the natural translation. */
  literal: text.optional(),
  /** Optional pronunciation note when the spoken form differs from the spelling. */
  pronunciationNote: text.optional(),
  note: text.optional(),
  tokens: z.array(tokenSchema).min(1).optional(),
  /** Optional path to an owned/licensed audio file under public/assets. */
  audio: text.optional(),
});

/* ------------------------------------------------------------------ */
/* Shared vocabulary and grammar                                       */
/* ------------------------------------------------------------------ */

export const partOfSpeechSchema = z.enum([
  'verb',
  'noun',
  'pronoun',
  'adverb',
  'determiner',
  'particle',
  'expression',
]);

export const vocabularyEntrySchema = z.object({
  id,
  hangul: hangulText,
  romanization: text,
  gloss: text,
  partOfSpeech: partOfSpeechSchema.optional(),
  notes: text.optional(),
  exampleSentenceIds: z.array(id).default([]),
  tags: z.array(text).default([]),
  audio: text.optional(),
});

export const grammarRuleSchema = z.object({
  /** Short pattern, e.g. "stem + 았어" */
  pattern: text,
  explanation: text,
});

export const grammarConceptSchema = z.object({
  id,
  name: text,
  /** Short label used in chips, e.g. "-았어/었어/했어". */
  label: text,
  category: z.enum(['tense', 'particle', 'sentence-structure', 'other']),
  description: text,
  rules: z.array(grammarRuleSchema).min(1),
  pitfalls: z.array(text).default([]),
  references: z.array(text).default([]),
});

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

const questionBase = {
  id,
  prompt: text,
  explanation: text,
  hint: text.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  conceptIds: z.array(id).default([]),
  vocabularyIds: z.array(id).default([]),
};

export const multipleChoiceQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('multipleChoice'),
  /** Optional Korean sentence shown with the prompt. */
  sentence: sentenceSchema.optional(),
  options: z
    .array(z.object({ id: z.string().min(1), text }))
    .min(2)
    .max(6),
  correctOptionId: z.string().min(1),
});

export const selfCheckQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('selfCheck'),
  /** What the learner is asked to do. */
  mode: z.enum(['translate-to-korean', 'translate-to-english', 'transform', 'produce']),
  /** Source text to work from (English or Korean depending on mode). */
  source: text.optional(),
  /** Model answer revealed after the learner tries. */
  answer: z.object({
    korean: hangulText.optional(),
    romanization: text.optional(),
    english: text.optional(),
  }),
  /**
   * Typed answers that should be recognized as matching (Korean or English).
   * Comparison ignores spacing and punctuation. Self-assessment remains the
   * final word, since many correct variants exist.
   */
  acceptedAnswers: z.array(text).default([]),
});

export const tokenSelectQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('tokenSelect'),
  sentence: sentenceSchema.extend({ tokens: z.array(tokenSchema).min(2) }),
  /** Indexes into sentence.tokens that make up the correct selection. */
  correctTokenIndexes: z.array(z.number().int().nonnegative()).min(1),
});

export const orderingQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('ordering'),
  /** The pieces in their correct order. The UI shuffles them. */
  pieces: z.array(hangulText).min(2).max(8),
  /**
   * Other natural orders that should also be accepted, each a permutation of
   * `pieces`. Korean word order before the verb is flexible.
   */
  alternativeOrders: z.array(z.array(hangulText)).default([]),
  /** Sentence the pieces form, for feedback and audio. */
  sentence: sentenceSchema,
});

export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema,
  selfCheckQuestionSchema,
  tokenSelectQuestionSchema,
  orderingQuestionSchema,
]);

/* ------------------------------------------------------------------ */
/* Steps (content blocks)                                              */
/* ------------------------------------------------------------------ */

const stepBase = {
  id,
  title: text,
};

export const introStepSchema = z.object({
  ...stepBase,
  type: z.literal('intro'),
  body: z.array(text).min(1),
  /** Optional register / usage callout. */
  callout: text.optional(),
});

export const vocabularyStepSchema = z.object({
  ...stepBase,
  type: z.literal('vocabulary'),
  intro: text.optional(),
  vocabularyIds: z.array(id).min(1).max(16),
});

export const verbFormSchema = z.object({
  /** Dictionary form, e.g. 마시다 */
  dictionary: hangulText,
  vocabularyId: id.optional(),
  /** The resulting form, e.g. 마셔 */
  form: hangulText,
  romanization: text,
  /**
   * Visual split of the form into stem and ending. For contracted forms
   * (마시 + 어 → 마셔) the split may be a single "contracted" part with a
   * `derivation` explaining it.
   */
  parts: z
    .array(z.object({ text: hangulText, kind: z.enum(['stem', 'ending', 'contracted']) }))
    .min(1),
  derivation: text.optional(),
  english: text.optional(),
});

export const grammarStepSchema = z.object({
  ...stepBase,
  type: z.literal('grammar'),
  grammarConceptIds: z.array(id).default([]),
  body: z.array(text).min(1),
  rules: z.array(grammarRuleSchema).default([]),
  forms: z.array(verbFormSchema).default([]),
  examples: z.array(sentenceSchema).max(3).default([]),
  callout: z.object({ title: text, body: z.array(text).min(1) }).optional(),
});

export const exampleStepSchema = z.object({
  ...stepBase,
  type: z.literal('example'),
  intro: text.optional(),
  sentences: z.array(sentenceSchema).min(1).max(6),
  explanation: text.optional(),
});

export const comparisonCellSchema = sentenceSchema.extend({
  /** The ending/substring to highlight inside `korean`, e.g. "었어". */
  highlight: hangulText.optional(),
});

export const comparisonStepSchema = z.object({
  ...stepBase,
  type: z.literal('comparison'),
  intro: text.optional(),
  columns: z
    .array(z.object({ id, label: text, pattern: text.optional() }))
    .min(2)
    .max(5),
  rows: z
    .array(
      z.object({
        id,
        label: text,
        vocabularyId: id.optional(),
        cells: z.record(z.string(), comparisonCellSchema),
      }),
    )
    .min(1),
  takeaway: text.optional(),
});

export const quizStepSchema = z.object({
  ...stepBase,
  type: z.literal('quiz'),
  intro: text.optional(),
  /** Marks a quiz as an assessment whose score is highlighted. */
  assessment: z.boolean().default(false),
  questions: z.array(questionSchema).min(1),
});

export const recapStepSchema = z.object({
  ...stepBase,
  type: z.literal('recap'),
  points: z.array(text).min(1),
  vocabularyIds: z.array(id).default([]),
  grammarConceptIds: z.array(id).default([]),
  /** Show a "concepts to revisit" panel computed from the learner's quiz results in this module. */
  showWeakAreas: z.boolean().default(false),
  /** Summary table rows, e.g. a four-form overview. */
  table: z
    .object({
      caption: text,
      headers: z.array(text).min(2),
      rows: z.array(z.array(text).min(2)).min(1),
    })
    .optional(),
});

export const stepSchema = z.discriminatedUnion('type', [
  introStepSchema,
  vocabularyStepSchema,
  grammarStepSchema,
  exampleStepSchema,
  comparisonStepSchema,
  quizStepSchema,
  recapStepSchema,
]);

/* ------------------------------------------------------------------ */
/* Curriculum                                                          */
/* ------------------------------------------------------------------ */

export const sectionSchema = z.object({
  id,
  moduleId: id,
  title: text,
  /** Short label such as "Section 1". */
  label: text,
  kind: z.enum(['lesson', 'review']).default('lesson'),
  summary: text,
  learningObjectives: z.array(text).min(1),
  newVocabularyIds: z.array(id).default([]),
  reviewVocabularyIds: z.array(id).default([]),
  grammarConceptIds: z.array(id).default([]),
  estimatedMinutes: z.number().int().positive().optional(),
  steps: z.array(stepSchema).min(1),
});

export const moduleSchema = z.object({
  id,
  slug: id,
  journeyId: id,
  number: z.number().int().positive(),
  title: text,
  description: text,
  introduction: z.array(text).default([]),
  status: z.enum(['available', 'planned']),
  sectionIds: z.array(id).default([]),
  estimatedMinutes: z.number().int().positive().optional(),
  prerequisiteIds: z.array(id).default([]),
});

export const journeySchema = z.object({
  id,
  slug: id,
  title: text,
  description: text,
  level: text,
  status: z.enum(['available', 'planned']),
  moduleIds: z.array(id).default([]),
});

export const curriculumSchema = z.object({
  journeys: z.array(journeySchema).min(1),
  modules: z.array(moduleSchema),
});

export type Token = z.infer<typeof tokenSchema>;
export type TokenRole = z.infer<typeof tokenRoleSchema>;
export type Sentence = z.infer<typeof sentenceSchema>;
export type VocabularyEntry = z.infer<typeof vocabularyEntrySchema>;
export type GrammarRule = z.infer<typeof grammarRuleSchema>;
export type GrammarConcept = z.infer<typeof grammarConceptSchema>;
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
export type SelfCheckQuestion = z.infer<typeof selfCheckQuestionSchema>;
export type TokenSelectQuestion = z.infer<typeof tokenSelectQuestionSchema>;
export type OrderingQuestion = z.infer<typeof orderingQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type VerbForm = z.infer<typeof verbFormSchema>;
export type IntroStep = z.infer<typeof introStepSchema>;
export type VocabularyStep = z.infer<typeof vocabularyStepSchema>;
export type GrammarStep = z.infer<typeof grammarStepSchema>;
export type ExampleStep = z.infer<typeof exampleStepSchema>;
export type ComparisonCell = z.infer<typeof comparisonCellSchema>;
export type ComparisonStep = z.infer<typeof comparisonStepSchema>;
export type QuizStep = z.infer<typeof quizStepSchema>;
export type RecapStep = z.infer<typeof recapStepSchema>;
export type Step = z.infer<typeof stepSchema>;
export type StepType = Step['type'];
export type Section = z.infer<typeof sectionSchema>;
export type Module = z.infer<typeof moduleSchema>;
export type Journey = z.infer<typeof journeySchema>;
export type Curriculum = z.infer<typeof curriculumSchema>;
