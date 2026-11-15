/**
 * Builds fast lookups over validated content: by slug, by ID, and "where was
 * this word/concept first introduced". Pure and framework-free.
 */
import type {
  GrammarConcept,
  Journey,
  Module,
  Question,
  Section,
  Step,
  VocabularyEntry,
} from './schema';
import type { ValidatedContent } from './validate';

export interface ContentLocation {
  moduleId: string;
  sectionId: string;
  stepId: string;
}

export interface QuestionLocation extends ContentLocation {
  question: Question;
  assessment: boolean;
}

export interface Registry {
  journeys: Journey[];
  modules: Module[];
  vocabulary: VocabularyEntry[];
  grammar: GrammarConcept[];
  getJourney(slugOrId: string): Journey | undefined;
  getModule(slugOrId: string): Module | undefined;
  getSection(id: string): Section | undefined;
  getModulesForJourney(journeyId: string): Module[];
  getSectionsForModule(moduleId: string): Section[];
  getVocabulary(id: string): VocabularyEntry | undefined;
  getGrammar(id: string): GrammarConcept | undefined;
  /** Where a word is first introduced (the vocabulary step that presents it as new). */
  getVocabularySource(id: string): ContentLocation | undefined;
  /** Where a grammar concept is first taught (the first grammar step that lists it). */
  getGrammarSource(id: string): ContentLocation | undefined;
  getQuestion(id: string): QuestionLocation | undefined;
  getQuestionsForSection(sectionId: string): QuestionLocation[];
  getQuestionsForModule(moduleId: string): QuestionLocation[];
  findStep(sectionId: string, stepId: string): { step: Step; index: number } | undefined;
}

export function buildRegistry(content: ValidatedContent): Registry {
  const { curriculum, vocabulary, grammar, sections } = content;

  const journeyBy = new Map<string, Journey>();
  for (const j of curriculum.journeys) {
    journeyBy.set(j.id, j);
    journeyBy.set(j.slug, j);
  }
  const moduleBy = new Map<string, Module>();
  for (const m of curriculum.modules) {
    moduleBy.set(m.id, m);
    moduleBy.set(m.slug, m);
  }
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const vocabById = new Map(vocabulary.map((v) => [v.id, v]));
  const grammarById = new Map(grammar.map((g) => [g.id, g]));

  const vocabSource = new Map<string, ContentLocation>();
  const grammarSource = new Map<string, ContentLocation>();
  const questionById = new Map<string, QuestionLocation>();
  const questionsBySection = new Map<string, QuestionLocation[]>();

  // Walk modules in curriculum order so "first introduced" is well defined.
  for (const mod of curriculum.modules) {
    for (const sectionId of mod.sectionIds) {
      const section = sectionById.get(sectionId);
      if (!section) continue;
      const newWords = new Set(section.newVocabularyIds);
      const list: QuestionLocation[] = [];
      for (const step of section.steps) {
        const loc = { moduleId: mod.id, sectionId, stepId: step.id };
        if (step.type === 'vocabulary') {
          for (const v of step.vocabularyIds) {
            if (newWords.has(v) && !vocabSource.has(v)) vocabSource.set(v, loc);
          }
        }
        if (step.type === 'grammar') {
          for (const g of step.grammarConceptIds) if (!grammarSource.has(g)) grammarSource.set(g, loc);
        }
        if (step.type === 'quiz') {
          for (const question of step.questions) {
            const q = { ...loc, question, assessment: step.assessment };
            questionById.set(question.id, q);
            list.push(q);
          }
        }
      }
      questionsBySection.set(sectionId, list);
      // Concepts only listed at section level fall back to the section's first step.
      for (const g of section.grammarConceptIds) {
        if (!grammarSource.has(g)) grammarSource.set(g, { moduleId: mod.id, sectionId, stepId: section.steps[0].id });
      }
    }
  }

  return {
    journeys: curriculum.journeys,
    modules: curriculum.modules,
    vocabulary,
    grammar,
    getJourney: (key) => journeyBy.get(key),
    getModule: (key) => moduleBy.get(key),
    getSection: (key) => sectionById.get(key),
    getModulesForJourney: (journeyId) =>
      (journeyBy.get(journeyId)?.moduleIds ?? []).map((id) => moduleBy.get(id)).filter((m): m is Module => !!m),
    getSectionsForModule: (moduleId) =>
      (moduleBy.get(moduleId)?.sectionIds ?? []).map((id) => sectionById.get(id)).filter((s): s is Section => !!s),
    getVocabulary: (key) => vocabById.get(key),
    getGrammar: (key) => grammarById.get(key),
    getVocabularySource: (key) => vocabSource.get(key),
    getGrammarSource: (key) => grammarSource.get(key),
    getQuestion: (key) => questionById.get(key),
    getQuestionsForSection: (sectionId) => questionsBySection.get(sectionId) ?? [],
    getQuestionsForModule: (moduleId) =>
      (moduleBy.get(moduleId)?.sectionIds ?? []).flatMap((sid) => questionsBySection.get(sid) ?? []),
    findStep: (sectionId, stepId) => {
      const section = sectionById.get(sectionId);
      if (!section) return undefined;
      const index = section.steps.findIndex((s) => s.id === stepId);
      return index === -1 ? undefined : { step: section.steps[index], index };
    },
  };
}
