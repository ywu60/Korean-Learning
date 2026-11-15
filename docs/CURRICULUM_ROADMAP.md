# Curriculum roadmap

## Journey: Korean Foundations (beginner)

| # | Module | Status | Builds on |
| --- | --- | --- | --- |
| 1 | **Verb Tenses in Everyday Sentences**: present, past, future, progressive (casual); 은/는, 이/가, 을/를, 에, 에서; 33 words | ✅ Available | — |
| 2 | **Questions and Negation**: yes/no questions by intonation, question words (뭐, 어디, 언제, 누구), 안 and 못, -지 않아 | Planned | Module 1 verbs and tenses |
| 3 | **Particles and Sentence Building**: 은/는 vs 이/가 in depth, 도, 와/과 and 하고, 에게/한테, 에 for time, connecting with -고 | Planned | Module 1 particles |
| 4 | **Polite Speech and Honorifics**: -아요/어요 and past/future/progressive in polite style, when to use 반말 vs 존댓말, -(으)세요 | Planned | Every Module 1 form, re-taught politely |

Candidate later modules: irregular verbs (ㅂ, ㄷ, 르, ㅎ, ㄹ-final stems such as 살다 and 놀다), Sino-Korean and native numbers, time and dates, adjectives (descriptive verbs), wanting and ability (-고 싶어, -(으)ㄹ 수 있어), and reading practice.

## Journey: Everyday Conversations (planned)

Dialogue-centered modules (greetings, ordering food, making plans, directions, shopping) built on the Foundations patterns. These will likely need new step types, e.g. `dialogue`, `listening`, and `comprehension`, added to the schema as described in `CONTENT_AUTHORING.md`.

## Platform features (Phase 2)

- [x] Progress export/import as JSON
- [x] Saved ("starred") vocabulary
- [x] Weak-area suggestions from quiz results
- [ ] Spaced repetition (SM-2-style) review queue over vocabulary and questions
- [ ] Question types: matching, cloze, dictation, listening identification
- [ ] Section prerequisites and placement check
- [ ] Recorded or licensed high-quality audio (`audio` fields already exist on sentences and vocabulary)
- [ ] Search across all lessons; personal notes
- [ ] Offline/PWA install
- [ ] Optional cross-device sync (via the `ProgressStore` interface)

## Reuse principle

Each new module should list earlier words in `reviewVocabularyIds` and reuse them in examples, so earlier vocabulary keeps appearing in new grammar. Module 2's questions and negation, for instance, should be practiced with Module 1's verbs (먹다, 가다, 공부하다, 읽다) before introducing many new ones.
