/**
 * Browser speech synthesis wrapper for Korean pronunciation.
 *
 * Uses the Web Speech API (`speechSynthesis`). Voice availability and quality
 * depend entirely on the learner's browser and operating system; this is
 * synthesized speech, not recorded audio.
 */

export type SpeechStatus = 'unsupported' | 'loading' | 'ready' | 'no-korean-voice';

export interface SpeechVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
}

export const SPEECH_RATES = { normal: 1, slow: 0.7 } as const;

const VOICE_LOAD_TIMEOUT_MS = 2500;

export function isKoreanVoice(voice: Pick<SpeechSynthesisVoice, 'lang'>): boolean {
  return /^ko([-_]|$)/i.test(voice.lang);
}

function getSynth(): SpeechSynthesis | undefined {
  if (typeof window === 'undefined') return undefined;
  if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') return undefined;
  return window.speechSynthesis;
}

export interface SpeechEngine {
  /** Resolves once voices are known (or the wait times out). */
  init(onChange: (status: SpeechStatus, voices: SpeechVoiceOption[]) => void): () => void;
  speak(text: string, options: { rate: number; voiceURI: string | null; onEnd: () => void }): void;
  cancel(): void;
}

export function createBrowserSpeechEngine(): SpeechEngine {
  let koreanVoices: SpeechSynthesisVoice[] = [];

  return {
    init(onChange) {
      const synth = getSynth();
      if (!synth) {
        onChange('unsupported', []);
        return () => {};
      }

      let settled = false;
      const refresh = (final: boolean) => {
        const voices = synth.getVoices();
        koreanVoices = voices.filter(isKoreanVoice);
        const options = koreanVoices.map((v) => ({
          voiceURI: v.voiceURI,
          name: v.name,
          lang: v.lang,
          localService: v.localService,
        }));
        if (koreanVoices.length > 0) {
          settled = true;
          onChange('ready', options);
        } else if (voices.length > 0 || final) {
          // Voices are loaded (or we've waited long enough) and none are Korean.
          // Keep listening: some browsers add voices later.
          settled = true;
          onChange('no-korean-voice', []);
        } else {
          onChange('loading', []);
        }
      };

      refresh(false);
      const handleChange = () => refresh(false);
      synth.addEventListener?.('voiceschanged', handleChange);
      const timer = window.setTimeout(() => {
        if (!settled) refresh(true);
      }, VOICE_LOAD_TIMEOUT_MS);

      return () => {
        synth.removeEventListener?.('voiceschanged', handleChange);
        window.clearTimeout(timer);
      };
    },

    speak(text, { rate, voiceURI, onEnd }) {
      const synth = getSynth();
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      const voice = koreanVoices.find((v) => v.voiceURI === voiceURI) ?? koreanVoices[0];
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
      synth.speak(utterance);
    },

    cancel() {
      getSynth()?.cancel();
    },
  };
}

export function describeSpeechStatus(status: SpeechStatus): string {
  switch (status) {
    case 'unsupported':
      return 'This browser does not support speech synthesis, so pronunciation playback is unavailable.';
    case 'no-korean-voice':
      return 'No Korean (ko-KR) voice is installed in this browser or device, so pronunciation playback is unavailable. Installing a Korean voice in your system settings may enable it.';
    case 'loading':
      return 'Checking for a Korean voice…';
    case 'ready':
      return 'Pronunciation uses your browser’s built-in Korean voice. Quality varies by browser and device.';
  }
}
