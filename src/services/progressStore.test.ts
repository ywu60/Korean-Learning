import { describe, expect, it } from 'vitest';
import { completeStep, createDefaultProgress, recordAnswer, updatePreferences, visitStep } from '../domain/progress';
import {
  STORAGE_KEY,
  createLocalStorageStore,
  migrateEnvelope,
  parseProgressJson,
  serializeProgress,
} from './progressStore';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('progress persistence', () => {
  it('round-trips progress through localStorage', () => {
    const storage = memoryStorage();
    const store = createLocalStorageStore(storage);
    let p = createDefaultProgress();
    p = visitStep(p, { moduleId: 'verb-tenses', sectionId: 'section-future', stepId: 's2-intro' });
    p = completeStep(p, 's1-intro');
    p = recordAnswer(p, 'q-s1-past-eat', true);
    p = updatePreferences(p, { showRomanization: false });
    store.save(p);

    const reloaded = createLocalStorageStore(storage).load();
    expect(reloaded).toEqual(p);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it('falls back to defaults for missing or corrupted data', () => {
    const storage = memoryStorage();
    expect(createLocalStorageStore(storage).load()).toEqual(createDefaultProgress());
    storage.setItem(STORAGE_KEY, '{not json');
    expect(createLocalStorageStore(storage).load()).toEqual(createDefaultProgress());
  });

  it('keeps valid fields when other fields are corrupted', () => {
    const p = migrateEnvelope({
      version: 1,
      data: {
        completedSteps: { 's1-intro': '2026-01-01T00:00:00.000Z' },
        preferences: { showRomanization: false, theme: 'neon' },
        questionResults: 'garbage',
      },
    });
    expect(p.completedSteps).toEqual({ 's1-intro': '2026-01-01T00:00:00.000Z' });
    expect(p.preferences.showRomanization).toBe(false);
    expect(p.preferences.theme).toBe('system');
    expect(p.questionResults).toEqual({});
  });

  it('runs migrations from older versions in order', () => {
    const migrations = {
      0: (data: unknown) => ({ ...(data as object), completedSteps: (data as { done: Record<string, string> }).done }),
    };
    const p = migrateEnvelope({ version: 0, data: { done: { 's1-intro': 'x' } } }, migrations, 1);
    expect(p.completedSteps).toEqual({ 's1-intro': 'x' });
  });

  it('refuses data from a newer, unknown version instead of misreading it', () => {
    const p = migrateEnvelope({ version: 99, data: { completedSteps: { a: 'x' } } });
    expect(p).toEqual(createDefaultProgress());
  });

  it('exports and imports JSON', () => {
    const p = recordAnswer(createDefaultProgress(), 'q1', true);
    expect(parseProgressJson(serializeProgress(p))).toEqual(p);
    expect(parseProgressJson('nonsense')).toBeNull();
    expect(parseProgressJson('{"foo": 1}')).toBeNull();
  });
});
