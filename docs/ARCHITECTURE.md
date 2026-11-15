# Architecture

A static, single-user, local-first React application. No backend, accounts, analytics, or external APIs.

## Layers

```text
content/ (JSON)  ──►  domain/validate.ts  ──►  domain/registry.ts  ──►  content/index.ts
                        schema + cross-refs      lookups by ID/slug        the only import UI uses
                                                                                  │
services/ (storage, speech)  ──►  app/ providers (Progress, Speech)  ──►  pages/ + components/
```

| Folder | Responsibility | React? |
| --- | --- | --- |
| `src/content/` | Lesson data, plus `rawContent.ts` (gathers files via `import.meta.glob`) and `index.ts` (validated registry) | No |
| `src/domain/` | Zod schemas and inferred types, validation, registry, quiz grading/scoring, progress model and pure update functions | No |
| `src/services/` | `progressStore.ts` (versioned persistence behind a `ProgressStore` interface), `speech.ts` (Web Speech API wrapper behind a `SpeechEngine` interface) | No |
| `src/app/` | Routes, `ProgressProvider`, `SpeechProvider`, route builders | Yes |
| `src/components/` | `layout/` (shell, toggles, progress bar), `learning/` (sentence, vocab, forms, step views, `StepRenderer`), `quizzes/` | Yes |
| `src/pages/` | One component per route | Yes |
| `src/styles/` | `tokens.css` (design tokens, light/dark), `global.css`, `components.css`, `print.css` | — |

Domain and services are framework-free and unit tested directly.

## Content pipeline

1. `rawContent.ts` imports `curriculum.json`, `vocabulary.json`, `grammar.json`, and every `lessons/*.json`.
2. `validateContent()` parses each with Zod, then checks: unique IDs (steps, sentences, questions are global), curriculum graph integrity, vocabulary/grammar references, token spans present in their sentence, verb-form parts, comparison cells per column, highlight substrings, answer keys, ordering pieces forming the sentence, and that each section's new words are actually shown.
3. `buildRegistry()` produces lookups (`getModule`, `getSection`, `findStep`, `getVocabularySource`, `getQuestionsForModule`, …). "Where was this first taught" is computed by walking modules in curriculum order.
4. The same validation runs at build time (`scripts/validate-content.ts`, part of `npm run build`), in tests, and at app start, which throws loudly if content is invalid.

## Rendering

Steps and questions are discriminated unions on `type`. `StepRenderer` switches on `step.type` with an exhaustive `never` check, so adding a type to the schema without a renderer is a compile error. Lessons can mix step types freely; nothing assumes the tense-lesson sequence.

A `DisplayContext` switches renderers between `interactive` (the reader) and `static` (the print view: no buttons, romanization and English always shown, quizzes as plain questions with a separate answer key).

## Routing

`HashRouter`, so URLs look like `/#/learn/verb-tenses/section-future/s2-intro`. GitHub Pages can't rewrite unknown paths to `index.html`, and hash routing makes deep links survive refresh with no 404 workaround. Vite's `base: './'` makes asset paths relative, so the same build works at any repository path.

| Route | Page |
| --- | --- |
| `/` | Home: continue entry, journeys and modules |
| `/journeys`, `/journeys/:slug` | Journey list and detail |
| `/modules/:slug` | Module overview with section progress |
| `/learn/:moduleId/:sectionId[/:stepId]` | Lesson reader (without a step it resumes at the saved step) |
| `/review`, `/progress`, `/settings` | Review, progress, settings |
| `/print/:moduleId/:sectionId` | Printable section with answer key |

## Progress and persistence

`UserProgress` (`domain/progress.ts`) holds preferences, completed steps and sections (ID → timestamp), last step per section, last visited location, question results (attempts, first-attempt correctness, last correctness), and saved word IDs. Everything is keyed by stable content IDs.

- Updates are pure functions (`visitStep`, `completeStep`, `recordAnswer`, …) used by `ProgressProvider`, which saves after every change.
- Storage format: `{ version, savedAt, data }` under `localStorage["korean-learning-journey:progress"]`.
- `migrateEnvelope()` runs registered migrations from older versions, rejects newer unknown versions, and parses with per-field `.catch()` defaults, so a corrupted field doesn't wipe everything else.
- Scores count the **first attempt** per question; retries update `lastCorrect` only.
- To move to IndexedDB or add sync, implement `ProgressStore` and pass it to `ProgressProvider`.

## Speech

`createBrowserSpeechEngine()` waits for voices (`voiceschanged`, 2.5 s timeout) and exposes status `unsupported | loading | ready | no-korean-voice`. It speaks Hangul with `lang = ko-KR`, prefers the user-selected Korean voice, and cancels any current utterance before speaking. `AudioButton` renders a disabled button with an explanation unless the status is `ready`. Nothing auto-plays.

## Accessibility

Semantic landmarks and headings, a skip link, focus moved to the step heading on navigation, visible focus rings, `role="switch"` toggles, `role="status"` quiz feedback stated in words, grammatical roles shown by text label and underline style as well as color, `prefers-reduced-motion` respected, `lang="ko"` on Korean text.

## Testing

`npm test` (Vitest + React Testing Library, jsdom):

- `domain/validate.test.ts`: shipped content is valid; specific breakages are caught.
- `domain/quiz.test.ts`: grading, normalization, shuffling, scoring, weak areas.
- `services/progressStore.test.ts`: round trip, corruption, partial data, migrations, import/export.
- `pages/LessonReaderPage.test.tsx`: rendering, toggles persisting, breakdowns, navigation and saving, resume, quiz feedback and retry, speech states.
- `app/navigation.test.tsx`: home → module → lesson, review search → source lesson, planned modules without dead links, print view.

Tests inject an in-memory `ProgressStore` and a fake `SpeechEngine`.
