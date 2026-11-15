import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';

interface FeedbackProps {
  correct: boolean | null;
  title?: string;
  children: ReactNode;
  onRetry?: () => void;
}

/** Quiz feedback. Always states the result in words, never color/icon alone. */
export function Feedback({ correct, title, children, onRetry }: FeedbackProps) {
  const tone = correct === null ? 'neutral' : correct ? 'correct' : 'incorrect';
  const heading = title ?? (correct ? 'Correct!' : correct === false ? 'Not quite.' : 'Answer');
  return (
    <div className={`feedback feedback--${tone}`} role="status">
      <p className="feedback__title">
        {correct !== null && <Icon name={correct ? 'check' : 'cross'} size={18} />}
        <strong>{heading}</strong>
      </p>
      <div className="feedback__body">{children}</div>
      {onRetry && (
        <button type="button" className="button button--quiet" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
