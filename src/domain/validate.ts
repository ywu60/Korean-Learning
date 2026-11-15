/**
 * Content validation: schema parsing plus cross-reference integrity checks.
 *
 * Pure function — no file system or bundler access — so it can run in the
 * browser, in tests, and in the build-time validation script.
 */
import { z } from 'zod';
import {
  curriculumSchema,
  grammarConceptSchema,
  sectionSchema,
  vocabularyEntrySchema,
  type Curriculum,
  type GrammarConcept,
  type Question,
  type Section,
  type Sentence,
  type VocabularyEntry,
} from './schema';

export interface RawContent {
  curriculum: unknown;
  vocabulary: unknown;
  grammar: unknown;
  /** Lesson files keyed by their source path (used in error messages). */
  sections: Record<string, unknown>;
}

export interface ValidatedContent {
  curriculum: Curriculum;
  vocabulary: VocabularyEntry[];
  grammar: GrammarConcept[];
  sections: Section[];
}

export type ValidationResult =
  | { ok: true; content: ValidatedContent; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

function formatZodError(source: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    return `${source}: ${path}: ${issue.message}`;
  });
}

/** Strip whitespace and sentence punctuation for loose text comparison. */
export function compact(s: string): string {
  return s.replace(/[\s.,!?'"“”‘’…~·]/g, '');
}

export function validateContent(raw: RawContent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const curriculumResult = curriculumSchema.safeParse(raw.curriculum);
  if (!curriculumResult.success) errors.push(...formatZodError('curriculum.json', curriculumResult.error));

  const vocabResult = z.array(vocabularyEntrySchema).safeParse(raw.vocabulary);
  if (!vocabResult.success) errors.push(...formatZodError('vocabulary.json', vocabResult.error));

  const grammarResult = z.array(grammarConceptSchema).safeParse(raw.grammar);
  if (!grammarResult.success) errors.push(...formatZodError('grammar.json', grammarResult.error));

  const sections: { source: string; section: Section }[] = [];
  for (const [source, data] of Object.entries(raw.sections)) {
    const result = sectionSchema.safeParse(data);
    if (result.success) sections.push({ source, section: result.data });
    else errors.push(...formatZodError(source, result.error));
  }

  if (!curriculumResult.success || !vocabResult.success || !grammarResult.success || errors.length) {
    return { ok: false, errors, warnings };
  }

  const curriculum = curriculumResult.data;
  const vocabulary = vocabResult.data;
  const grammar = grammarResult.data;

  /* ---------- duplicate IDs ---------- */
  const checkUnique = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const value of ids) {
      if (seen.has(value)) errors.push(`Duplicate ${kind} ID "${value}"`);
      seen.add(value);
    }
    return seen;
  };

  const journeyIds = checkUnique('journey', curriculum.journeys.map((j) => j.id));
  checkUnique('journey slug', curriculum.journeys.map((j) => j.slug));
  const moduleIds = checkUnique('module', curriculum.modules.map((m) => m.id));
  checkUnique('module slug', curriculum.modules.map((m) => m.slug));
  checkUnique('section', sections.map((s) => s.section.id));
  const vocabIds = checkUnique('vocabulary', vocabulary.map((v) => v.id));
  const grammarIds = checkUnique('grammar concept', grammar.map((g) => g.id));

  const allSteps = sections.flatMap(({ source, section }) => section.steps.map((step) => ({ source, section, step })));
  checkUnique('step', allSteps.map((s) => s.step.id));

  const sentences: { source: string; sentence: Sentence }[] = [];
  const questions: { source: string; question: Question }[] = [];
  for (const { source, step } of allSteps) {
    switch (step.type) {
      case 'grammar':
        step.examples.forEach((sentence) => sentences.push({ source, sentence }));
        break;
      case 'example':
        step.sentences.forEach((sentence) => sentences.push({ source, sentence }));
        break;
      case 'comparison':
        step.rows.forEach((row) => Object.values(row.cells).forEach((sentence) => sentences.push({ source, sentence })));
        break;
      case 'quiz':
        step.questions.forEach((question) => {
          questions.push({ source, question });
          if ('sentence' in question && question.sentence) sentences.push({ source, sentence: question.sentence });
        });
        break;
      default:
        break;
    }
  }
  const sentenceIds = checkUnique('sentence', sentences.map((s) => s.sentence.id));
  checkUnique('question', questions.map((q) => q.question.id));

  /* ---------- reference helpers ---------- */
  const refVocab = (where: string, idValue: string | undefined) => {
    if (idValue && !vocabIds.has(idValue)) errors.push(`${where}: unknown vocabulary ID "${idValue}"`);
  };
  const refGrammar = (where: string, idValue: string | undefined) => {
    if (idValue && !grammarIds.has(idValue)) errors.push(`${where}: unknown grammar concept ID "${idValue}"`);
  };

  /* ---------- curriculum graph ---------- */
  for (const journey of curriculum.journeys) {
    for (const moduleId of journey.moduleIds) {
      if (!moduleIds.has(moduleId)) {
        errors.push(`Journey "${journey.id}": unknown module ID "${moduleId}"`);
        continue;
      }
      const mod = curriculum.modules.find((m) => m.id === moduleId)!;
      if (mod.journeyId !== journey.id) {
        errors.push(`Module "${mod.id}" is listed in journey "${journey.id}" but has journeyId "${mod.journeyId}"`);
      }
    }
  }
  for (const mod of curriculum.modules) {
    if (!journeyIds.has(mod.journeyId)) errors.push(`Module "${mod.id}": unknown journey ID "${mod.journeyId}"`);
    if (mod.status === 'available' && mod.sectionIds.length === 0) {
      errors.push(`Module "${mod.id}" is marked available but has no sections`);
    }
    for (const prereq of mod.prerequisiteIds) {
      if (!moduleIds.has(prereq)) errors.push(`Module "${mod.id}": unknown prerequisite module "${prereq}"`);
    }
    for (const sectionId of mod.sectionIds) {
      const entry = sections.find((s) => s.section.id === sectionId);
      if (!entry) {
        errors.push(`Module "${mod.id}": unknown section ID "${sectionId}"`);
      } else if (entry.section.moduleId !== mod.id) {
        errors.push(`Section "${sectionId}" is listed in module "${mod.id}" but has moduleId "${entry.section.moduleId}"`);
      }
    }
  }
  const registered = new Set(curriculum.modules.flatMap((m) => m.sectionIds));
  for (const { source, section } of sections) {
    if (!registered.has(section.id)) warnings.push(`${source}: section "${section.id}" is not registered in curriculum.json`);
  }

  /* ---------- vocabulary & grammar ---------- */
  for (const entry of vocabulary) {
    for (const sid of entry.exampleSentenceIds) {
      if (!sentenceIds.has(sid)) errors.push(`Vocabulary "${entry.id}": unknown example sentence ID "${sid}"`);
    }
  }

  /* ---------- sentences ---------- */
  for (const { source, sentence } of sentences) {
    const where = `${source}: sentence "${sentence.id}"`;
    if (!sentence.tokens) continue;
    let cursor = 0;
    for (const token of sentence.tokens) {
      const found = sentence.korean.indexOf(token.text, cursor);
      if (found === -1) {
        errors.push(`${where}: token "${token.text}" not found (in order) in "${sentence.korean}"`);
        break;
      }
      cursor = found + token.text.length;
      if (token.marker && !token.text.endsWith(token.marker) && !token.text.includes(token.marker)) {
        errors.push(`${where}: token "${token.text}" does not contain marker "${token.marker}"`);
      }
      refVocab(where, token.vocabularyId);
      refGrammar(where, token.grammarConceptId);
    }
  }

  /* ---------- sections & steps ---------- */
  for (const { source, section } of sections) {
    const where = `${source}`;
    section.newVocabularyIds.forEach((v) => refVocab(where, v));
    section.reviewVocabularyIds.forEach((v) => refVocab(where, v));
    section.grammarConceptIds.forEach((g) => refGrammar(where, g));

    const introducedInSteps = new Set<string>();
    for (const step of section.steps) {
      const stepWhere = `${source}: step "${step.id}"`;
      switch (step.type) {
        case 'vocabulary':
          step.vocabularyIds.forEach((v) => {
            refVocab(stepWhere, v);
            introducedInSteps.add(v);
          });
          break;
        case 'grammar':
          step.grammarConceptIds.forEach((g) => refGrammar(stepWhere, g));
          step.forms.forEach((form) => {
            refVocab(stepWhere, form.vocabularyId);
            const joined = form.parts.map((p) => p.text).join('');
            if (joined.replace(/\s/g, '') !== form.form.replace(/\s/g, '')) {
              errors.push(`${stepWhere}: form "${form.form}" parts join to "${joined}"`);
            }
          });
          break;
        case 'comparison': {
          const columnIds = step.columns.map((c) => c.id);
          for (const row of step.rows) {
            refVocab(stepWhere, row.vocabularyId);
            const cellIds = Object.keys(row.cells);
            const missing = columnIds.filter((c) => !cellIds.includes(c));
            const extra = cellIds.filter((c) => !columnIds.includes(c));
            if (missing.length) errors.push(`${stepWhere}: row "${row.id}" missing cells for ${missing.join(', ')}`);
            if (extra.length) errors.push(`${stepWhere}: row "${row.id}" has unknown columns ${extra.join(', ')}`);
            for (const cell of Object.values(row.cells)) {
              if (cell.highlight && !cell.korean.includes(cell.highlight)) {
                errors.push(`${stepWhere}: highlight "${cell.highlight}" not in "${cell.korean}"`);
              }
            }
          }
          break;
        }
        case 'recap':
          step.vocabularyIds.forEach((v) => refVocab(stepWhere, v));
          step.grammarConceptIds.forEach((g) => refGrammar(stepWhere, g));
          step.table?.rows.forEach((row, i) => {
            if (row.length !== step.table!.headers.length) {
              errors.push(`${stepWhere}: table row ${i} has ${row.length} cells, expected ${step.table!.headers.length}`);
            }
          });
          break;
        case 'quiz':
          step.questions.forEach((q) => validateQuestion(`${stepWhere}: question "${q.id}"`, q));
          break;
        default:
          break;
      }
    }
    for (const v of section.newVocabularyIds) {
      if (!introducedInSteps.has(v)) errors.push(`${where}: new vocabulary "${v}" is not shown in any vocabulary step`);
    }
    const allowed = new Set([...section.newVocabularyIds, ...section.reviewVocabularyIds]);
    for (const v of introducedInSteps) {
      if (!allowed.has(v)) errors.push(`${where}: vocabulary step shows "${v}" but it is not in newVocabularyIds/reviewVocabularyIds`);
    }
  }

  function validateQuestion(where: string, q: Question) {
    q.conceptIds.forEach((g) => refGrammar(where, g));
    q.vocabularyIds.forEach((v) => refVocab(where, v));
    switch (q.type) {
      case 'multipleChoice': {
        const optionIds = q.options.map((o) => o.id);
        if (new Set(optionIds).size !== optionIds.length) errors.push(`${where}: duplicate option IDs`);
        if (!optionIds.includes(q.correctOptionId)) {
          errors.push(`${where}: correctOptionId "${q.correctOptionId}" is not one of the options`);
        }
        const texts = q.options.map((o) => o.text);
        if (new Set(texts).size !== texts.length) errors.push(`${where}: duplicate option texts`);
        break;
      }
      case 'tokenSelect': {
        const max = q.sentence.tokens.length;
        for (const i of q.correctTokenIndexes) {
          if (i >= max) errors.push(`${where}: correct token index ${i} out of range (0-${max - 1})`);
        }
        break;
      }
      case 'ordering': {
        if (compact(q.pieces.join('')) !== compact(q.sentence.korean)) {
          errors.push(`${where}: pieces "${q.pieces.join(' ')}" do not form "${q.sentence.korean}"`);
        }
        if (new Set(q.pieces).size !== q.pieces.length) errors.push(`${where}: ordering pieces must be unique`);
        const sorted = [...q.pieces].sort().join('|');
        for (const alt of q.alternativeOrders) {
          if ([...alt].sort().join('|') !== sorted) {
            errors.push(`${where}: alternative order "${alt.join(' ')}" is not a permutation of the pieces`);
          }
        }
        break;
      }
      case 'selfCheck': {
        const { korean, english } = q.answer;
        if (!korean && !english) errors.push(`${where}: self-check answer needs korean or english`);
        if (korean && !q.answer.romanization) errors.push(`${where}: Korean answer is missing romanization`);
        break;
      }
    }
  }

  if (errors.length) return { ok: false, errors, warnings };

  return {
    ok: true,
    warnings,
    content: { curriculum, vocabulary, grammar, sections: sections.map((s) => s.section) },
  };
}
