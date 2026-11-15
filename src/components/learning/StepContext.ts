import type { Module, Section } from '../../domain/schema';

/** Where a step is being rendered. Passed to every step renderer. */
export interface StepContext {
  module: Module;
  section: Section;
}
