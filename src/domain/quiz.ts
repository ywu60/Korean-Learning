/**
 * Quiz grading and scoring. Pure functions with no UI or storage concerns.
 */
import type {
  MultipleChoiceQuestion,
  OrderingQuestion,
  SelfCheckQuestion,
  TokenSelectQuestion,
} from './schema';
import type { QuestionResult } from './progress';

/** Normalize a typed answer: Unicode NFC, lowercase, no whitespace or punctuation. */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s.,!?'"“”‘’…~·/()-]/g, '');
}

export function gradeMultipleChoice(question: MultipleChoiceQuestion, optionId: string): boolean {
  return question.correctOptionId === optionId;
}

export function gradeTokenSelect(question: TokenSelectQuestion, selected: number[]): boolean {
  const expected = new Set(question.correctTokenIndexes);
  const chosen = new Set(selected);
  return expected.size === chosen.size && [...expected].every((i) => chosen.has(i));
}

export function gradeOrdering(question: OrderingQuestion, attempt: string[]): boolean {
  const candidates = [question.pieces, ...question.alternativeOrders];
  return candidates.some(
    (order) => order.length === attempt.length && order.every((piece, i) => piece === attempt[i]),
  );
}

/**
 * Whether a typed answer matches one of the accepted answers or the model
 * answer. Used only as a hint; self-check questions are ultimately
 * self-assessed because many correct variants exist.
 */
export function matchesSelfCheck(question: SelfCheckQuestion, typed: string): boolean {
  const attempt = normalizeAnswer(typed);
  if (!attempt) return false;
  const candidates = [
    ...question.acceptedAnswers,
    question.mode === 'translate-to-english' ? question.answer.english : question.answer.korean,
  ].filter((c): c is string => !!c);
  return candidates.some((c) => normalizeAnswer(c) === attempt);
}

/** Small deterministic PRNG (mulberry32) so shuffles are stable per question. */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle ordering pieces deterministically by question ID, guaranteeing the
 * result is not already a correct order (when that's possible).
 */
export function shuffledPieces(question: OrderingQuestion): string[] {
  const random = seededRandom(question.id);
  const pieces = [...question.pieces];
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    if (!gradeOrdering(question, pieces)) return pieces;
  }
  // Fallback: reverse is never a correct order for 2+ distinct pieces unless an alternative says so.
  return [...question.pieces].reverse();
}

export interface ScoreSummary {
  total: number;
  answered: number;
  /** Questions answered correctly on the first attempt. */
  correctFirstTry: number;
  /** Percentage of answered questions correct on first try (0-100), or null if none answered. */
  percent: number | null;
}

export function summarizeScores(
  questionIds: string[],
  results: Record<string, QuestionResult | undefined>,
): ScoreSummary {
  let answered = 0;
  let correctFirstTry = 0;
  for (const id of questionIds) {
    const r = results[id];
    if (!r) continue;
    answered += 1;
    if (r.firstAttemptCorrect) correctFirstTry += 1;
  }
  return {
    total: questionIds.length,
    answered,
    correctFirstTry,
    percent: answered === 0 ? null : Math.round((correctFirstTry / answered) * 100),
  };
}

export interface WeakArea {
  conceptId: string;
  missed: number;
  answered: number;
}

/** Concepts with at least one question missed on the first attempt, most-missed first. */
export function findWeakAreas(
  questions: { id: string; conceptIds: string[] }[],
  results: Record<string, QuestionResult | undefined>,
): WeakArea[] {
  const byConcept = new Map<string, WeakArea>();
  for (const q of questions) {
    const r = results[q.id];
    if (!r) continue;
    for (const conceptId of q.conceptIds) {
      const entry = byConcept.get(conceptId) ?? { conceptId, missed: 0, answered: 0 };
      entry.answered += 1;
      if (!r.firstAttemptCorrect) entry.missed += 1;
      byConcept.set(conceptId, entry);
    }
  }
  return [...byConcept.values()]
    .filter((w) => w.missed > 0)
    .sort((a, b) => b.missed / b.answered - a.missed / a.answered || b.missed - a.missed);
}
