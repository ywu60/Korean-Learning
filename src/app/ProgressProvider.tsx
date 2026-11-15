import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as P from '../domain/progress';
import { createLocalStorageStore, type ProgressStore } from '../services/progressStore';

export interface ProgressContextValue {
  progress: P.UserProgress;
  visitStep(location: { moduleId: string; sectionId: string; stepId: string }): void;
  completeStep(stepId: string): void;
  completeSection(sectionId: string): void;
  recordAnswer(questionId: string, correct: boolean): void;
  updatePreferences(patch: Partial<P.Preferences>): void;
  toggleSavedVocabulary(vocabularyId: string): void;
  resetProgress(): void;
  replaceProgress(progress: P.UserProgress): void;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children, store }: { children: ReactNode; store?: ProgressStore }) {
  const storeRef = useRef<ProgressStore>(store ?? createLocalStorageStore());
  const [progress, setProgress] = useState<P.UserProgress>(() => storeRef.current.load());
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    storeRef.current.save(progress);
  }, [progress]);

  const visitStep = useCallback<ProgressContextValue['visitStep']>((loc) => setProgress((p) => P.visitStep(p, loc)), []);
  const completeStep = useCallback((stepId: string) => setProgress((p) => P.completeStep(p, stepId)), []);
  const completeSection = useCallback((id: string) => setProgress((p) => P.completeSection(p, id)), []);
  const recordAnswer = useCallback(
    (questionId: string, correct: boolean) => setProgress((p) => P.recordAnswer(p, questionId, correct)),
    [],
  );
  const updatePreferences = useCallback(
    (patch: Partial<P.Preferences>) => setProgress((p) => P.updatePreferences(p, patch)),
    [],
  );
  const toggleSavedVocabulary = useCallback((id: string) => setProgress((p) => P.toggleSavedVocabulary(p, id)), []);
  const resetProgress = useCallback(() => setProgress((p) => P.resetLearningProgress(p)), []);
  const replaceProgress = useCallback((next: P.UserProgress) => setProgress(next), []);

  const value = useMemo(
    () => ({
      progress,
      visitStep,
      completeStep,
      completeSection,
      recordAnswer,
      updatePreferences,
      toggleSavedVocabulary,
      resetProgress,
      replaceProgress,
    }),
    [progress, visitStep, completeStep, completeSection, recordAnswer, updatePreferences, toggleSavedVocabulary, resetProgress, replaceProgress],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
