# Korean Learning Journey

A growing, interactive Korean learning platform designed to teach the language **one concept and one useful sentence at a time**.

Instead of memorizing long, disconnected vocabulary lists, this project introduces new words when they are needed to understand a grammar rule, sentence, or conversation. Later lessons reuse those words so vocabulary and grammar develop together.

**Live site:** https://ywu60.github.io/Korean-Learning/ (once GitHub Pages is enabled; see [Deployment](#deployment))

## What you can learn

The first module, **Verb Tenses in Everyday Sentences**, introduces:

- **Present and past:** common verb endings and everyday activities.
- **Future:** plans, intentions, and predictions with `-(으)ㄹ 거야`.
- **Progressive:** ongoing actions with `-고 있어`.
- **Sentence structure and particles:** essential uses of `은/는`, `이/가`, `을/를`, `에`, and `에서`.

It contains three lesson sections plus a module review: 33 vocabulary words, 10 grammar concepts, 49 steps, and 64 practice questions, including a 12-question mixed assessment.

This is just the beginning. The platform is intended to grow into a much broader Korean learning journey, with future modules for questions, negation, politeness, conversations, listening, and more.

## Learning approach

Each section combines:

1. **A short introduction** to one learning goal.
2. **Contextual vocabulary** that appears in the examples.
3. **Simple grammar explanations** with verb forms and particles broken down.
4. **Korean sentences** paired with Revised Romanization and English translations.
5. **Interactive practice and quizzes** with feedback.
6. **Review** that connects earlier words and concepts to later lessons.

The aim is steady understanding through repeated, meaningful use—not simply memorizing lists of words.

## Features

- Step-by-step Korean lessons with a section overview and progress indicator.
- Independently toggleable romanization and English translations (hidden English can be revealed per sentence).
- Pronunciation playback when a Korean (`ko-KR`) browser voice is available, with normal and slow speeds. This is browser text-to-speech, so quality depends on your device; when no Korean voice exists, audio buttons are disabled with an explanation.
- Tap-a-word sentence breakdowns with grammatical roles shown by color *and* text label.
- Side-by-side tense comparisons that become stacked cards on phones.
- Quizzes: multiple choice, self-check translation, tap-the-word particle identification, and word ordering, each with explanations and retry.
- Module assessment with score and "concepts to revisit" links back to lessons.
- Review page with search and filters for all vocabulary and grammar, linked to where each item is taught; star words to save them.
- Locally saved progress, current step, quiz results, and preferences; export/import as JSON.
- Printable section view with an answer key.
- Light/dark mode following your system, keyboard accessible, mobile friendly.

> Progress is stored in your browser in the initial version. Clearing browser data or switching devices may reset it. Use **Settings → Export progress** to keep a backup.

## Getting started

Requires Node.js 20 or newer (CI uses Node 22).

```bash
npm install
npm run dev
```

Open the local address shown by Vite.

For production:

```bash
npm run build     # validates content, type-checks, builds to dist/
npm run preview
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the Vitest suite (content validation, grading, persistence, UI) |
| `npm run validate:content` | Validates all lesson JSON and cross-references |
| `npm run typecheck` | TypeScript check only |

## Project structure

```text
src/
  app/          App shell, routing, providers (progress, speech)
  components/   Reusable learning and quiz interfaces
  pages/        Page-level views
  content/      Curriculum, vocabulary, grammar, and lessons (JSON)
  domain/       Data schemas, validation, quiz/progress rules
  services/     Speech and local persistence
  hooks/        Shared React hooks
  styles/       Design tokens, responsive and print styling
scripts/        Build-time content validation
docs/           Content authoring, architecture, roadmap
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the pieces fit together.

## Adding new lessons

The curriculum is content-driven. New lessons are added as structured JSON, with stable IDs and references to reusable vocabulary/grammar entries. Adding a module requires no changes to rendering components.

See [`docs/CONTENT_AUTHORING.md`](docs/CONTENT_AUTHORING.md) for step-by-step instructions and content validation rules.

## Deployment

The app is a static site deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which runs tests, validates content, builds, and publishes `dist/` on every push to `main`.

One-time setup:

1. Push the repository to GitHub (it must be public for free GitHub Pages).
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).

The site uses hash-based URLs (e.g. `/#/review`) and a relative asset base, so deep links survive refreshes and the build works under any repository name or static host without configuration.

## Roadmap

- [x] Initial verb-tense learning module
- [ ] Additional grammar and particle modules
- [ ] Vocabulary spaced repetition
- [ ] Listening and dictation exercises
- [ ] Conversation-based learning modules
- [x] Progress export/import (JSON)
- [ ] Optional cross-device sync

More detail in [`docs/CURRICULUM_ROADMAP.md`](docs/CURRICULUM_ROADMAP.md).


## Contributing

Contributions that improve Korean accuracy, accessibility, learning design, and technical quality are welcome. Please verify Hangul spelling, Revised Romanization, English translations, and register before proposing new lesson content, and run `npm test` and `npm run build` before opening a pull request.

