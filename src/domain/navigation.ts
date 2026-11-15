import type { Section } from './schema';
import type { UserProgress } from './progress';

/** The step to resume a section at: last visited step if still valid, else the first step. */
export function resumeStepId(section: Section, progress: UserProgress): string {
  const saved = progress.sectionPositions[section.id];
  if (saved && section.steps.some((s) => s.id === saved)) return saved;
  return section.steps[0].id;
}
