/**
 * Validated content registry. Pages and components read curriculum data only
 * through this module, never by importing JSON directly.
 */
import { rawContent } from './rawContent';
import { buildRegistry } from '../domain/registry';
import { validateContent } from '../domain/validate';

const result = validateContent(rawContent);

if (!result.ok) {
  // Fail loudly in development; the build script prevents this from shipping.
  const message = `Lesson content failed validation:\n${result.errors.join('\n')}`;
  console.error(message);
  throw new Error(message);
}

export const content = buildRegistry(result.content);
