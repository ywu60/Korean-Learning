/**
 * Collects the raw JSON content files. Any `*.json` file dropped into
 * `lessons/` is picked up automatically; it becomes reachable once its section
 * ID is registered in a module's `sectionIds` in `curriculum.json`.
 */
import type { RawContent } from '../domain/validate';
import curriculum from './curriculum.json';
import vocabulary from './vocabulary.json';
import grammar from './grammar.json';

const lessonModules = import.meta.glob<{ default: unknown }>('./lessons/*.json', { eager: true });

export const rawContent: RawContent = {
  curriculum,
  vocabulary,
  grammar,
  sections: Object.fromEntries(
    Object.entries(lessonModules).map(([path, mod]) => [path.replace('./', 'content/'), mod.default]),
  ),
};
