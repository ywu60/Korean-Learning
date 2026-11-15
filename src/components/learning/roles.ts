import type { TokenRole } from '../../domain/schema';

/** Human-readable labels for grammatical roles. Shown as text so color is never the only cue. */
export const ROLE_LABELS: Record<TokenRole, string> = {
  topic: 'topic',
  subject: 'subject',
  object: 'object',
  destination: 'destination',
  location: 'action place',
  time: 'time',
  verb: 'verb',
  noun: 'noun',
  determiner: 'determiner',
  other: '',
};
