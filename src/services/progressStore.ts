/**
 * Progress persistence.
 *
 * `ProgressStore` is the seam for swapping storage later (IndexedDB, optional
 * sync). The default implementation uses localStorage with a versioned
 * envelope and safe migrations; invalid or unreadable data falls back to
 * defaults instead of crashing the app.
 */
import {
  PROGRESS_VERSION,
  createDefaultProgress,
  userProgressSchema,
  type UserProgress,
} from '../domain/progress';

export interface ProgressStore {
  load(): UserProgress;
  save(progress: UserProgress): void;
  clear(): void;
}

export const STORAGE_KEY = 'korean-learning-journey:progress';

export interface ProgressEnvelope {
  version: number;
  savedAt: string;
  data: unknown;
}

/**
 * Migrations keyed by the version they upgrade *from*. Each receives data in
 * the old shape and returns data in the next version's shape. Add an entry
 * here whenever PROGRESS_VERSION is bumped.
 */
export type Migration = (data: unknown) => unknown;
export const MIGRATIONS: Record<number, Migration> = {};

/** Parse any stored value into a valid, current-version UserProgress. */
export function migrateEnvelope(
  raw: unknown,
  migrations: Record<number, Migration> = MIGRATIONS,
  currentVersion: number = PROGRESS_VERSION,
): UserProgress {
  if (!raw || typeof raw !== 'object' || !('data' in raw)) return createDefaultProgress();
  const envelope = raw as Partial<ProgressEnvelope>;
  let version = typeof envelope.version === 'number' ? envelope.version : 0;
  let data: unknown = envelope.data;

  // Data from a newer app version can't be safely interpreted.
  if (version > currentVersion) return createDefaultProgress();

  while (version < currentVersion) {
    const migrate = migrations[version];
    if (!migrate) return createDefaultProgress();
    data = migrate(data);
    version += 1;
  }

  const parsed = userProgressSchema.safeParse(data);
  return parsed.success ? parsed.data : createDefaultProgress();
}

export function serializeProgress(progress: UserProgress): string {
  const envelope: ProgressEnvelope = { version: PROGRESS_VERSION, savedAt: new Date().toISOString(), data: progress };
  return JSON.stringify(envelope, null, 2);
}

export function parseProgressJson(json: string): UserProgress | null {
  try {
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object' || !('data' in raw)) return null;
    return migrateEnvelope(raw);
  } catch {
    return null;
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function createLocalStorageStore(storage: Storage | undefined = safeLocalStorage()): ProgressStore {
  return {
    load() {
      if (!storage) return createDefaultProgress();
      try {
        const json = storage.getItem(STORAGE_KEY);
        if (!json) return createDefaultProgress();
        return migrateEnvelope(JSON.parse(json));
      } catch {
        return createDefaultProgress();
      }
    },
    save(progress) {
      try {
        storage?.setItem(STORAGE_KEY, serializeProgress(progress));
      } catch {
        // Storage full or blocked (private mode). Progress stays in memory for this session.
      }
    },
    clear() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  };
}

/** In-memory store for tests and environments without storage. */
export function createMemoryStore(initial?: UserProgress): ProgressStore {
  let current = initial ?? createDefaultProgress();
  return {
    load: () => current,
    save: (p) => {
      current = p;
    },
    clear: () => {
      current = createDefaultProgress();
    },
  };
}
