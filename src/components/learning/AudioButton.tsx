import { useId } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import { useDisplay } from '../../hooks/useDisplay';
import { describeSpeechStatus } from '../../services/speech';
import { Icon } from '../ui/Icon';

interface AudioButtonProps {
  /** Hangul text to speak (never romanization). */
  text: string;
  /** Short description for screen readers, e.g. the word itself. */
  label?: string;
  /** Also render a slow-playback button. */
  showSlow?: boolean;
  size?: 'sm' | 'md';
}

export function AudioButton({ text, label, showSlow = false, size = 'md' }: AudioButtonProps) {
  const { status, speakingId, speak, stop } = useSpeech();
  const { isStatic } = useDisplay();
  const id = useId();
  if (isStatic) return null;

  const what = label ?? text;
  if (status !== 'ready') {
    const reason = describeSpeechStatus(status);
    return (
      <span className={`audio-group audio-group--${size}`}>
        <button
          type="button"
          className="icon-button audio-button"
          disabled
          aria-label={`Pronunciation unavailable for ${what}. ${reason}`}
          title={reason}
        >
          <Icon name="speakerOff" size={size === 'sm' ? 16 : 20} />
        </button>
      </span>
    );
  }

  const normalId = `${id}-normal`;
  const slowId = `${id}-slow`;
  const playing = speakingId === normalId || speakingId === slowId;

  return (
    <span className={`audio-group audio-group--${size}`}>
      <button
        type="button"
        className={`icon-button audio-button${speakingId === normalId ? ' is-playing' : ''}`}
        aria-label={speakingId === normalId ? `Stop pronunciation of ${what}` : `Play pronunciation of ${what}`}
        aria-pressed={speakingId === normalId}
        onClick={() => (speakingId === normalId ? stop() : speak(normalId, text))}
        title="Play (browser voice)"
      >
        <Icon name={speakingId === normalId ? 'stop' : 'speaker'} size={size === 'sm' ? 16 : 20} />
      </button>
      {showSlow && (
        <button
          type="button"
          className={`icon-button audio-button${speakingId === slowId ? ' is-playing' : ''}`}
          aria-label={speakingId === slowId ? `Stop slow pronunciation of ${what}` : `Play ${what} slowly`}
          aria-pressed={speakingId === slowId}
          onClick={() => (speakingId === slowId ? stop() : speak(slowId, text, 'slow'))}
          title="Play slowly"
        >
          <Icon name={speakingId === slowId ? 'stop' : 'turtle'} size={size === 'sm' ? 16 : 20} />
        </button>
      )}
      <span className="visually-hidden" aria-live="polite">
        {playing ? `Playing ${what}` : ''}
      </span>
    </span>
  );
}
