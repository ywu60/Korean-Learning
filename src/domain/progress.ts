/**
 * Learner progress model and pure update functions.
 *
 * Everything is keyed by stable content IDs (step, section, question), never
 * by array position, so reordering lessons cannot corrupt saved progress.
 */
import { z } from 'zod';

export const PROGRESS_VERSION = 1;

const timestamp = z.string();

export const preferencesSchema = z.object({
  showRomanization: z.boolean().catch(true),
  showTranslation: z.boolean().catch(true),
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
  speechRate: z.enum(['normal', 'slow']).catch('normal'),
  voiceURI: z.string().nullable().catch(null),
});

export const questionResultSchema = z.object({
  attempts: z.number().int().nonnegative(),
  firstAttemptCorrect: z.boolean(),
  lastCorrect: z.boolean(),
  lastAnsweredAt: timestamp,
});

const locationSchema = z.object({
  moduleId: z.string(),
  sectionId: z.string(),
  stepId: z.string(),
  at: timestamp,
});

/**
 * Each field falls back to a safe default independently (`.catch`), so one
 * corrupted field does not wipe the rest of a learner's progress.
 */
export const userProgressSchema = z.object({
  version: z.literal(PROGRESS_VERSION).catch(PROGRESS_VERSION),
  preferences: preferencesSchema.catch(() => preferencesSchema.parse({})),
  completedSteps: z.record(z.string(), timestamp).catch({}),
  completedSections: z.record(z.string(), timestamp).catch({}),
  /** Last step visited in each section, for resuming. */
  sectionPositions: z.record(z.string(), z.string()).catch({}),
  lastVisited: locationSchema.nullable().catch(null),
  questionResults: z.record(z.string(), questionResultSchema).catch({}),
  savedVocabularyIds: z.array(z.string()).catch([]),
});

export type Preferences = z.infer<typeof preferencesSchema>;
export type QuestionResult = z.infer<typeof questionResultSchema>;
export type UserProgress = z.infer<typeof userProgressSchema>;
export type LastVisited = z.infer<typeof locationSchema>;

export function createDefaultProgress(): UserProgress {
  return userProgressSchema.parse({});
}

const now = () => new Date().toISOString();

export function visitStep(
  progress: UserProgress,
  location: { moduleId: string; sectionId: string; stepId: string },
  at: string = now(),
): UserProgress {
  return {
    ...progress,
    sectionPositions: { ...progress.sectionPositions, [location.sectionId]: location.stepId },
    lastVisited: { ...location, at },
  };
}

export function completeStep(progress: UserProgress, stepId: string, at: string = now()): UserProgress {
  if (progress.completedSteps[stepId]) return progress;
  return { ...progress, completedSteps: { ...progress.completedSteps, [stepId]: at } };
}

export function completeSection(progress: UserProgress, sectionId: string, at: string = now()): UserProgress {
  if (progress.completedSections[sectionId]) return progress;
  return { ...progress, completedSections: { ...progress.completedSections, [sectionId]: at } };
}

/**
 * Record an answer. The first attempt is what scores count; later attempts
 * (retries) update `lastCorrect` and the attempt count only.
 */
export function recordAnswer(
  progress: UserProgress,
  questionId: string,
  correct: boolean,
  at: string = now(),
): UserProgress {
  const existing = progress.questionResults[questionId];
  const next: QuestionResult = existing
    ? { ...existing, attempts: existing.attempts + 1, lastCorrect: correct, lastAnsweredAt: at }
    : { attempts: 1, firstAttemptCorrect: correct, lastCorrect: correct, lastAnsweredAt: at };
  return { ...progress, questionResults: { ...progress.questionResults, [questionId]: next } };
}

export function updatePreferences(progress: UserProgress, patch: Partial<Preferences>): UserProgress {
  return { ...progress, preferences: { ...progress.preferences, ...patch } };
}

export function toggleSavedVocabulary(progress: UserProgress, vocabularyId: string): UserProgress {
  const saved = new Set(progress.savedVocabularyIds);
  if (saved.has(vocabularyId)) saved.delete(vocabularyId);
  else saved.add(vocabularyId);
  return { ...progress, savedVocabularyIds: [...saved] };
}

/** Reset learning data while keeping display preferences. */
export function resetLearningProgress(progress: UserProgress): UserProgress {
  return { ...createDefaultProgress(), preferences: progress.preferences };
}

export interface SectionProgress {
  completedSteps: number;
  totalSteps: number;
  percent: number;
  complete: boolean;
  started: boolean;
}

export function getSectionProgress(
  progress: UserProgress,
  section: { id: string; steps: { id: string }[] },
): SectionProgress {
  const totalSteps = section.steps.length;
  const completedSteps = section.steps.filter((s) => progress.completedSteps[s.id]).length;
  const complete = !!progress.completedSections[section.id];
  return {
    completedSteps,
    totalSteps,
    percent: complete ? 100 : Math.round((completedSteps / Math.max(totalSteps, 1)) * 100),
    complete,
    started: complete || completedSteps > 0 || !!progress.sectionPositions[section.id],
  };
}
