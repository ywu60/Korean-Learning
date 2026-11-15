import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders, AppRoutes } from '../app/App';
import { createMemoryStore, type ProgressStore } from '../services/progressStore';
import type { SpeechEngine, SpeechStatus } from '../services/speech';

export function fakeSpeechEngine(status: SpeechStatus = 'unsupported'): SpeechEngine & { spoken: string[] } {
  const spoken: string[] = [];
  return {
    spoken,
    init(onChange) {
      onChange(status, status === 'ready' ? [{ voiceURI: 'ko', name: 'Test Korean', lang: 'ko-KR', localService: true }] : []);
      return () => {};
    },
    speak(text, { onEnd }) {
      spoken.push(text);
      onEnd();
    },
    cancel() {},
  };
}

export function renderApp(
  route: string,
  { store = createMemoryStore(), speech = fakeSpeechEngine() }: { store?: ProgressStore; speech?: SpeechEngine } = {},
) {
  const utils = render(
    <AppProviders store={store} speechEngine={speech}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
  return { ...utils, store };
}
