import { describe, expect, it } from 'vitest';
import { rawContent } from '../content/rawContent';
import { validateContent, type RawContent } from './validate';

const clone = (): RawContent => structuredClone(rawContent);
// eslint-style helper for poking at nested JSON in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const section = (raw: RawContent, file: string): Any => raw.sections[`content/lessons/${file}`];

function expectError(raw: RawContent, pattern: RegExp) {
  const result = validateContent(raw);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.some((e) => pattern.test(e))).toBe(true);
}

describe('content validation', () => {
  it('accepts the shipped curriculum with no errors or warnings', () => {
    const result = validateContent(rawContent);
    if (!result.ok) throw new Error(result.errors.join('\n'));
    expect(result.warnings).toEqual([]);
    expect(result.content.sections.length).toBeGreaterThanOrEqual(4);
  });

  it('the first module has three lesson sections plus a review, each populated', () => {
    const result = validateContent(rawContent);
    if (!result.ok) throw new Error('invalid');
    const mod = result.content.curriculum.modules.find((m) => m.id === 'verb-tenses')!;
    const sections = mod.sectionIds.map((id) => result.content.sections.find((s) => s.id === id)!);
    expect(sections.filter((s) => s.kind === 'lesson')).toHaveLength(3);
    for (const s of sections.filter((s) => s.kind === 'lesson')) {
      const types = new Set(s.steps.map((st) => st.type));
      for (const t of ['intro', 'vocabulary', 'grammar', 'example', 'comparison', 'quiz', 'recap']) expect(types).toContain(t);
    }
    const assessment = sections.flatMap((s) => s.steps).find((st) => st.type === 'quiz' && st.assessment);
    expect(assessment && assessment.type === 'quiz' && assessment.questions.length).toBeGreaterThanOrEqual(8);
  });

  it('rejects duplicate step IDs', () => {
    const raw = clone();
    const s = section(raw, '01-present-past.json');
    s.steps[1].id = s.steps[0].id;
    expectError(raw, /Duplicate step ID "s1-intro"/);
  });

  it('rejects a multiple-choice answer key that points at no option', () => {
    const raw = clone();
    const quiz = section(raw, '01-present-past.json').steps.find((s: Any) => s.type === 'quiz');
    quiz.questions[0].correctOptionId = 'z';
    expectError(raw, /correctOptionId "z" is not one of the options/);
  });

  it('rejects broken vocabulary references', () => {
    const raw = clone();
    section(raw, '02-future.json').newVocabularyIds.push('does-not-exist');
    expectError(raw, /unknown vocabulary ID "does-not-exist"/);
  });

  it('rejects broken curriculum references', () => {
    const raw = clone();
    (raw.curriculum as Any).modules[0].sectionIds.push('section-missing');
    expectError(raw, /unknown section ID "section-missing"/);
  });

  it('rejects missing romanization', () => {
    const raw = clone();
    const example = section(raw, '01-present-past.json').steps.find((s: Any) => s.type === 'example');
    delete example.sentences[0].romanization;
    expectError(raw, /romanization/);
  });

  it('rejects tokens that do not appear in the sentence', () => {
    const raw = clone();
    const example = section(raw, '01-present-past.json').steps.find((s: Any) => s.type === 'example');
    example.sentences[0].tokens[1].text = '물을';
    expectError(raw, /token "물을" not found/);
  });

  it('rejects ordering pieces that do not form the sentence', () => {
    const raw = clone();
    const quiz = section(raw, '01-present-past.json').steps.find((s: Any) => s.id === 's1-practice-translate');
    const ordering = quiz.questions.find((q: Any) => q.type === 'ordering');
    ordering.pieces = ['나는', '너를', '좋아해'];
    expectError(raw, /do not form/);
  });

  it('rejects comparison rows missing a column', () => {
    const raw = clone();
    const cmp = section(raw, '03-progressive.json').steps.find((s: Any) => s.type === 'comparison');
    delete cmp.rows[0].cells.progressive;
    expectError(raw, /missing cells for progressive/);
  });

  it('warns about lesson files that are not registered in the curriculum', () => {
    const raw = clone();
    const extra = structuredClone(section(raw, '01-present-past.json'));
    // Rename every ID so the copy doesn't collide with the original.
    const json = JSON.stringify(extra).replace(/"(s1-[a-z0-9-]+|q-s1-[a-z0-9-]+|section-present-past)"/g, '"x-$1"');
    raw.sections['content/lessons/99-extra.json'] = { ...JSON.parse(json), moduleId: 'verb-tenses' };
    const result = validateContent(raw);
    expect(result.warnings.some((w) => /not registered/.test(w))).toBe(true);
  });
});
