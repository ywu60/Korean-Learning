import { describe, expect, it } from 'vitest';
import {
  findWeakAreas,
  gradeMultipleChoice,
  gradeOrdering,
  gradeTokenSelect,
  matchesSelfCheck,
  normalizeAnswer,
  shuffledPieces,
  summarizeScores,
} from './quiz';
import {
  multipleChoiceQuestionSchema,
  orderingQuestionSchema,
  selfCheckQuestionSchema,
  tokenSelectQuestionSchema,
} from './schema';
import { recordAnswer, createDefaultProgress } from './progress';

const mc = multipleChoiceQuestionSchema.parse({
  id: 'q-mc',
  type: 'multipleChoice',
  prompt: 'Past of 먹다?',
  options: [
    { id: 'a', text: '먹어' },
    { id: 'b', text: '먹었어' },
  ],
  correctOptionId: 'b',
  explanation: '먹 + 었어',
});

const ordering = orderingQuestionSchema.parse({
  id: 'q-order',
  type: 'ordering',
  prompt: 'Order',
  pieces: ['나는', '내일', '학교에', '갈 거야'],
  alternativeOrders: [['내일', '나는', '학교에', '갈 거야']],
  sentence: { id: 's-order', korean: '나는 내일 학교에 갈 거야.', romanization: 'Naneun naeil hakgyoe gal geoya.', english: 'I will go to school tomorrow.' },
  explanation: '...',
});

describe('quiz grading', () => {
  it('grades multiple choice', () => {
    expect(gradeMultipleChoice(mc, 'b')).toBe(true);
    expect(gradeMultipleChoice(mc, 'a')).toBe(false);
  });

  it('grades token selection as a set', () => {
    const q = tokenSelectQuestionSchema.parse({
      id: 'q-tok',
      type: 'tokenSelect',
      prompt: 'Tap',
      sentence: {
        id: 's-tok',
        korean: '나는 밥을 먹어.',
        romanization: 'Naneun babeul meogeo.',
        english: 'I eat.',
        tokens: [
          { text: '나는', romanization: 'naneun', meaning: 'I', role: 'topic' },
          { text: '밥을', romanization: 'babeul', meaning: 'meal', role: 'object' },
          { text: '먹어', romanization: 'meogeo', meaning: 'eat', role: 'verb' },
        ],
      },
      correctTokenIndexes: [1],
      explanation: '...',
    });
    expect(gradeTokenSelect(q, [1])).toBe(true);
    expect(gradeTokenSelect(q, [0, 1])).toBe(false);
    expect(gradeTokenSelect(q, [])).toBe(false);
  });

  it('grades ordering against the canonical and alternative orders', () => {
    expect(gradeOrdering(ordering, ['나는', '내일', '학교에', '갈 거야'])).toBe(true);
    expect(gradeOrdering(ordering, ['내일', '나는', '학교에', '갈 거야'])).toBe(true);
    expect(gradeOrdering(ordering, ['학교에', '나는', '내일', '갈 거야'])).toBe(false);
  });

  it('never presents ordering pieces already in a correct order', () => {
    const shuffled = shuffledPieces(ordering);
    expect([...shuffled].sort()).toEqual([...ordering.pieces].sort());
    expect(gradeOrdering(ordering, shuffled)).toBe(false);
    expect(shuffledPieces(ordering)).toEqual(shuffled); // deterministic
  });

  it('matches typed self-check answers ignoring spacing and punctuation', () => {
    const q = selfCheckQuestionSchema.parse({
      id: 'q-self',
      type: 'selfCheck',
      mode: 'translate-to-korean',
      prompt: 'Say it',
      source: 'I eat a meal.',
      answer: { korean: '나는 밥을 먹어.', romanization: 'Naneun babeul meogeo.' },
      acceptedAnswers: ['밥 먹어'],
      explanation: '...',
    });
    expect(normalizeAnswer(' 나는  밥을 먹어! ')).toBe('나는밥을먹어');
    expect(matchesSelfCheck(q, '나는 밥을 먹어')).toBe(true);
    expect(matchesSelfCheck(q, '밥먹어.')).toBe(true);
    expect(matchesSelfCheck(q, '나는 물을 마셔')).toBe(false);
    expect(matchesSelfCheck(q, '   ')).toBe(false);
  });
});

describe('scoring', () => {
  it('counts only the first attempt toward the score', () => {
    let p = createDefaultProgress();
    p = recordAnswer(p, 'q1', false); // wrong first
    p = recordAnswer(p, 'q1', true); // retry correct
    p = recordAnswer(p, 'q2', true);
    const summary = summarizeScores(['q1', 'q2', 'q3'], p.questionResults);
    expect(summary).toEqual({ total: 3, answered: 2, correctFirstTry: 1, percent: 50 });
    expect(p.questionResults.q1).toMatchObject({ attempts: 2, firstAttemptCorrect: false, lastCorrect: true });
  });

  it('reports a null percentage when nothing is answered', () => {
    expect(summarizeScores(['q1'], {}).percent).toBeNull();
  });

  it('ranks weak concepts by miss rate', () => {
    let p = createDefaultProgress();
    p = recordAnswer(p, 'a', false);
    p = recordAnswer(p, 'b', true);
    p = recordAnswer(p, 'c', false);
    const weak = findWeakAreas(
      [
        { id: 'a', conceptIds: ['past'] },
        { id: 'b', conceptIds: ['past', 'future'] },
        { id: 'c', conceptIds: ['particles'] },
        { id: 'd', conceptIds: ['progressive'] },
      ],
      p.questionResults,
    );
    expect(weak.map((w) => w.conceptId)).toEqual(['particles', 'past']);
  });
});
