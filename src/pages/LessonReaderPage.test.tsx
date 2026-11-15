import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, fakeSpeechEngine } from '../test/renderApp';
import { createMemoryStore } from '../services/progressStore';

describe('lesson reader', () => {
  it('renders an example step with Korean, romanization, and English', () => {
    renderApp('/learn/verb-tenses/section-present-past/s1-examples-present');
    expect(screen.getByRole('heading', { level: 1, name: 'Present-tense sentences' })).toBeInTheDocument();
    expect(screen.getByText('Naneun babeul meogeo.')).toBeInTheDocument();
    expect(screen.getByText('I eat a meal.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /step 6 of 13/i })).toBeInTheDocument();
  });

  it('hides romanization and translation independently, and the choice persists', async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    const { unmount } = renderApp('/learn/verb-tenses/section-present-past/s1-examples-present', { store });
    const toggles = within(screen.getAllByRole('group', { name: 'Display options' })[0]);

    await user.click(toggles.getByRole('switch', { name: 'Romanization' }));
    expect(screen.queryByText('Naneun babeul meogeo.')).not.toBeInTheDocument();
    expect(screen.getByText('I eat a meal.')).toBeInTheDocument();

    await user.click(toggles.getByRole('switch', { name: 'English' }));
    expect(screen.queryByText('I eat a meal.')).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Show translation' })[0]);
    expect(screen.getByText('I eat a meal.')).toBeInTheDocument();

    unmount();
    renderApp('/learn/verb-tenses/section-present-past/s1-examples-present', { store });
    expect(screen.queryByText('Naneun babeul meogeo.')).not.toBeInTheDocument();
    expect(store.load().preferences).toMatchObject({ showRomanization: false, showTranslation: false });
  });

  it('shows a word breakdown when a token is selected', async () => {
    const user = userEvent.setup();
    renderApp('/learn/verb-tenses/section-present-past/s1-examples-present');
    const token = screen.getAllByRole('button', { name: /밥을/ })[0];
    await user.click(token);
    expect(token).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('meal (object)')).toBeInTheDocument();
  });

  it('navigates with Next and saves position and completion by stable ID', async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    renderApp('/learn/verb-tenses/section-present-past/s1-intro', { store });
    await user.click(screen.getByRole('button', { name: /^Next/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'New words: five verbs' })).toBeInTheDocument();
    const saved = store.load();
    expect(saved.completedSteps['s1-intro']).toBeDefined();
    expect(saved.lastVisited).toMatchObject({ sectionId: 'section-present-past', stepId: 's1-vocab-verbs' });
  });

  it('resumes at the saved step when opening a section without a step', () => {
    const store = createMemoryStore();
    store.save({
      ...store.load(),
      sectionPositions: { 'section-future': 's2-grammar-future' },
    });
    renderApp('/learn/verb-tenses/section-future', { store });
    expect(screen.getByRole('heading', { level: 1, name: 'Future: -(으)ㄹ 거야' })).toBeInTheDocument();
  });

  it('gives feedback on a multiple-choice answer and allows retry', async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    renderApp('/learn/verb-tenses/section-present-past/s1-check-present', { store });
    const question = screen.getByRole('article', { name: /casual present form of 마시다/ });
    await user.click(within(question).getByRole('button', { name: /마셨어/ }));
    expect(within(question).getByRole('status')).toHaveTextContent(/Not quite/);
    expect(within(question).getByRole('status')).toHaveTextContent(/마시 \+ 어 contracts to 마셔/);
    await user.click(within(question).getByRole('button', { name: 'Try again' }));
    await user.click(within(question).getByRole('button', { name: /마셔/ }));
    expect(within(question).getByRole('status')).toHaveTextContent(/Correct/);
    expect(store.load().questionResults['q-s1-present-drink']).toMatchObject({
      attempts: 2,
      firstAttemptCorrect: false,
      lastCorrect: true,
    });
  });

  it('does not reveal self-check answers before the learner tries', async () => {
    const user = userEvent.setup();
    renderApp('/learn/verb-tenses/section-present-past/s1-practice-translate');
    const question = screen.getAllByRole('article', { name: /Say it in Korean/ })[0];
    expect(within(question).queryByText('Naneun babeul meogeo.')).not.toBeInTheDocument();
    await user.type(within(question).getByRole('textbox'), '밥 먹어');
    await user.click(within(question).getByRole('button', { name: 'Reveal answer' }));
    expect(within(question).getByText(/matches an accepted answer/)).toBeInTheDocument();
    await user.click(within(question).getByRole('button', { name: 'I got it' }));
    expect(within(question).getByText('Marked as correct.')).toBeInTheDocument();
  });

  it('disables pronunciation with an explanation when speech is unsupported', () => {
    renderApp('/learn/verb-tenses/section-present-past/s1-vocab-verbs', { speech: fakeSpeechEngine('unsupported') });
    const buttons = screen.getAllByRole('button', { name: /Pronunciation unavailable for 먹다/ });
    expect(buttons[0]).toBeDisabled();
  });

  it('speaks Hangul (not romanization) when a Korean voice is available', async () => {
    const user = userEvent.setup();
    const speech = fakeSpeechEngine('ready');
    renderApp('/learn/verb-tenses/section-present-past/s1-vocab-verbs', { speech });
    await user.click(screen.getByRole('button', { name: 'Play pronunciation of 먹다' }));
    expect(speech.spoken).toEqual(['먹다']);
  });

  it('shows a not-found page for unknown steps', () => {
    renderApp('/learn/verb-tenses/section-present-past/nope');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
