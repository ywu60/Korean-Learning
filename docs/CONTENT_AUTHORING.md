# Content authoring guide

All lesson content lives in `src/content/` as JSON. Components never contain lesson text. Content is validated by Zod schemas (`src/domain/schema.ts`) plus cross-reference checks (`src/domain/validate.ts`), and `npm run build` fails if anything is wrong.

```text
src/content/
  curriculum.json      Journeys and modules, and which sections each module contains (in order)
  vocabulary.json      Shared word list, referenced by ID everywhere
  grammar.json         Shared grammar concepts, referenced by ID everywhere
  lessons/*.json       One file per section (picked up automatically)
```

## Adding a new module (checklist)

1. **Add any new words** to `vocabulary.json` and **new grammar concepts** to `grammar.json`. Reuse existing IDs wherever possible.
2. **Create one lesson file per section** in `src/content/lessons/`, e.g. `05-questions.json`. The file name only controls sorting; the `id` inside is what matters.
3. **Register the module** in `curriculum.json`: add a module object with `status: "available"` and list the section IDs in `sectionIds` (order = learning order). Make sure the module's ID is in its journey's `moduleIds`.
4. Run `npm run validate:content`, fix any errors, then `npm test` and `npm run dev` to read through it.

No component changes are needed unless you introduce a brand-new step type (see the end of this guide).

## IDs

- Lowercase kebab-case: `a-z`, `0-9`, `-`.
- **Stable forever.** Progress is stored by ID, so renaming a step, question, or section resets learners' progress for it. Reordering is safe.
- Step, sentence, and question IDs must be **unique across all lessons**. A short prefix per section helps (`s2-…`, `q-s2-…`).

## Section file shape

```jsonc
{
  "id": "section-future",
  "moduleId": "verb-tenses",          // must match the module that lists it
  "label": "Section 2",
  "title": "Future",
  "kind": "lesson",                   // or "review" for a module review/assessment
  "summary": "One-sentence description shown on the module page.",
  "learningObjectives": ["…"],
  "newVocabularyIds": ["go", "come"], // each must appear in a vocabulary step of this section
  "reviewVocabularyIds": ["eat"],     // earlier words reused here (optional)
  "grammarConceptIds": ["future-eul-geoya"],
  "estimatedMinutes": 25,
  "steps": [ /* see below */ ]
}
```

## Step types

Every step has `id`, `type`, and `title`. Steps may appear in any order and any number; a conversation module doesn't need a comparison step.

| `type` | Key fields |
| --- | --- |
| `intro` | `body` (paragraphs), optional `callout` |
| `vocabulary` | `vocabularyIds` (1–16), optional `intro` |
| `grammar` | `body`, `grammarConceptIds`, `rules` (`pattern` + `explanation`), `forms` (verb forms with stem/ending `parts`), `examples` (≤3 sentences), optional `callout` (`title` + `body`) |
| `example` | `sentences` (1–6), optional `intro`, `explanation` |
| `comparison` | `columns` (2–5, each `id`, `label`, optional `pattern`), `rows` (each with `cells` keyed by column ID; every column must be filled), optional `highlight` per cell, `takeaway` |
| `quiz` | `questions`, optional `intro`, `assessment: true` for a scored assessment |
| `recap` | `points`, optional `vocabularyIds`, `grammarConceptIds`, `table` (`caption`, `headers`, `rows`), `showWeakAreas` |

### Sentences

```json
{
  "id": "s2-go-future",
  "korean": "나는 내일 학교에 갈 거야.",
  "romanization": "Naneun naeil hakgyoe gal geoya.",
  "english": "I will go to school tomorrow.",
  "literal": "I (topic) · tomorrow · to school · will go",
  "pronunciationNote": "Optional: when speech differs from spelling.",
  "note": "Optional usage note.",
  "tokens": [
    { "text": "나는", "romanization": "naneun", "meaning": "I (topic)", "role": "topic", "marker": "는",
      "vocabularyId": "i-me", "grammarConceptId": "topic-eun-neun" }
  ]
}
```

- `tokens` are optional but power the tap-a-word breakdown. Each `text` must appear in `korean`, in order.
- `role` is one of `topic`, `subject`, `object`, `destination`, `location`, `time`, `verb`, `noun`, `determiner`, `other`.
- `marker` is the particle or ending at the end of the token; it's shown in bold.

### Verb forms (grammar steps)

```json
{ "dictionary": "먹다", "vocabularyId": "eat", "form": "먹었어", "romanization": "meogeosseo", "english": "ate",
  "parts": [{ "text": "먹", "kind": "stem" }, { "text": "었어", "kind": "ending" }] }
```

`parts` must join to `form` (spaces ignored). For contractions, use one `"kind": "contracted"` part and explain it in `derivation` (e.g. `"마시 + 어 → 마셔"`).

### Questions

All questions have `id`, `type`, `prompt`, `explanation`, and optionally `hint`, `difficulty` (`easy`/`medium`/`hard`), `conceptIds`, `vocabularyIds`. **Tag `conceptIds` carefully:** they drive the "concepts to revisit" suggestions.

| `type` | Fields |
| --- | --- |
| `multipleChoice` | `options` (2–6, each `id` + `text`), `correctOptionId`, optional `sentence` (its English stays hidden until answered) |
| `selfCheck` | `mode` (`translate-to-korean`, `translate-to-english`, `transform`, `produce`), `source`, `answer` (`korean` + `romanization` and/or `english`), `acceptedAnswers` |
| `tokenSelect` | `sentence` with ≥2 `tokens`, `correctTokenIndexes` |
| `ordering` | `pieces` (in correct order; the UI shuffles them), `sentence`, `alternativeOrders` (other acceptable permutations) |

Self-check questions are graded by the learner ("I got it" / "Not yet"). `acceptedAnswers` only tells them whether their typed answer matches a known variant, ignoring spaces and punctuation, so list common natural variants (with/without 나는, with/without particles).

## Korean content conventions

- **Revised Romanization, consistently.** RR follows standard pronunciation for liaison and assimilation (한국어 → *hangugeo*, 좋아해 → *joahae*, 읽어 → *ilgeo*) but does **not** mark tensification (갈 거야 → *gal geoya*, not *gal kkeoya*).
- **Separate romanization from pronunciation.** When speech differs noticeably, keep the standard romanization and add `pronunciationNote` (e.g. 읽고 [일꼬]).
- **Never generate romanization or Korean at runtime.** Write it, then verify it.
- **Register:** Module 1 uses casual 반말 (`해`, `했어`, `할 거야`, `하고 있어`). Say so when introducing a new register.
- **Natural English:** translate meaning, not word by word; put word order in `literal`. Avoid unnatural progressives such as "I am liking you."
- **Don't conflate aspect and tense:** `-고 있어` is ongoing action, not future.
- **If unsure, don't ship it.** Mark it for review with a native speaker or reliable reference instead of guessing.

### Documented content decisions

- **읽고 있어 → *ilgo isseo*** (the original spec suggested *ilkgo isseo*). *ilkgo* is RR's letter-by-letter *transliteration* mode; the standard pronunciation-based RR used everywhere else in the course gives *ilgo* (읽고 is pronounced [일꼬]). The pronunciation is noted alongside.
- **Section 1 comparison** drops 나는 (`밥을 먹어.`) to show natural subject omission, and avoids duplicating the example sentences.
- **Section 2 present-tense** examples with 지원해 and 오늘 … 가 are glossed "I'm applying" / "I'm going," because the Korean present often covers near-future plans.

## Adding a new step or question type

1. Add a Zod schema in `src/domain/schema.ts` and include it in `stepSchema` (or `questionSchema`).
2. Add any cross-reference checks to `src/domain/validate.ts`.
3. Create a view in `src/components/learning/steps/` (or `src/components/quizzes/`) and add a `case` to `StepRenderer.tsx` (or `QuestionCard.tsx`). TypeScript flags any missing case.
4. Add a label in `STEP_TYPE_LABELS`, and a static rendering for the print view if relevant.

Existing lessons don't need to change.
