import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'click' | 'notification' | 'success' | 'error' | 'warning';

interface SoundOptions {
  volume?: number;
  enabled?: boolean;
}

const SOUND_ENABLED_KEY = 'sts-sound-enabled';

const hasUserActivatedAudio = () => {
  if (typeof navigator === 'undefined') return false;
  const userActivation = (navigator as any)?.userActivation;
  return Boolean(userActivation?.isActive || userActivation?.hasBeenActive);
};

export function useSound(options: SoundOptions = {}) {
  const { volume = 0.3, enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(enabled);

  useEffect(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    if (stored !== null) {
      isEnabledRef.current = stored === 'true';
    }
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!hasUserActivatedAudio()) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    attackTime = 0.01,
    releaseTime = 0.1
  ) => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - releaseTime);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, [getAudioContext, volume]);

  const playClick = useCallback(() => {
    playTone(800, 0.05, 'sine', 0.001, 0.03);
  }, [playTone]);

  const playNotification = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const startTime = now + i * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.15);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {
      console.warn('Notification sound failed:', e);
    }
  }, [getAudioContext, volume]);

  const playSuccess = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const frequencies = [440, 554.37, 659.25];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {
      console.warn('Success sound failed:', e);
    }
  }, [getAudioContext, volume]);

  const playError = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const frequencies = [200, 180];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const startTime = now + i * 0.15;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.12);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch (e) {
      console.warn('Error sound failed:', e);
    }
  }, [getAudioContext, volume]);

  const playWarning = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(380, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Warning sound failed:', e);
    }
  }, [getAudioContext, volume]);

  const play = useCallback((type: SoundType) => {
    switch (type) {
      case 'click':
        playClick();
        break;
      case 'notification':
        playNotification();
        break;
      case 'success':
        playSuccess();
        break;
      case 'error':
        playError();
        break;
      case 'warning':
        playWarning();
        break;
    }
  }, [playClick, playNotification, playSuccess, playError, playWarning]);

  const setEnabled = useCallback((value: boolean) => {
    isEnabledRef.current = value;
    localStorage.setItem(SOUND_ENABLED_KEY, String(value));
  }, []);

  const isEnabled = useCallback(() => isEnabledRef.current, []);

  return {
    play,
    playClick,
    playNotification,
    playSuccess,
    playError,
    playWarning,
    setEnabled,
    isEnabled,
  };
}

let globalSoundInstance: ReturnType<typeof useSound> | null = null;

export function getGlobalSound() {
  if (!globalSoundInstance) {
    let audioContext: AudioContext | null = null;

    const ensureAudioContext = () => {
      if (!hasUserActivatedAudio()) {
        return null;
      }
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      return audioContext;
    };
    
    const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) => {
      try {
        const ctx = ensureAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        console.warn('Sound failed:', e);
      }
    };

    const isSoundEnabled = () => localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';

    globalSoundInstance = {
      play: (type: SoundType) => {
        if (!isSoundEnabled()) return;
        
        switch (type) {
          case 'click':
            playTone(800, 0.05, 'sine', 0.2);
            break;
          case 'notification':
            playTone(523.25, 0.15, 'sine', 0.3);
            setTimeout(() => { if (isSoundEnabled()) playTone(659.25, 0.15, 'sine', 0.3); }, 100);
            setTimeout(() => { if (isSoundEnabled()) playTone(783.99, 0.2, 'sine', 0.3); }, 200);
            break;
          case 'success':
            playTone(440, 0.15, 'triangle', 0.25);
            setTimeout(() => { if (isSoundEnabled()) playTone(554.37, 0.15, 'triangle', 0.25); }, 80);
            setTimeout(() => { if (isSoundEnabled()) playTone(659.25, 0.2, 'triangle', 0.25); }, 160);
            break;
          case 'error':
            playTone(200, 0.12, 'sawtooth', 0.2);
            setTimeout(() => { if (isSoundEnabled()) playTone(180, 0.12, 'sawtooth', 0.2); }, 150);
            break;
          case 'warning':
            playTone(440, 0.1, 'triangle', 0.25);
            setTimeout(() => { if (isSoundEnabled()) playTone(380, 0.15, 'triangle', 0.25); }, 100);
            break;
        }
      },
      playClick: () => {
        if (!isSoundEnabled()) return;
        playTone(800, 0.05, 'sine', 0.2);
      },
      playNotification: () => {
        if (!isSoundEnabled()) return;
        playTone(523.25, 0.15, 'sine', 0.3);
        setTimeout(() => { if (isSoundEnabled()) playTone(659.25, 0.15, 'sine', 0.3); }, 100);
        setTimeout(() => { if (isSoundEnabled()) playTone(783.99, 0.2, 'sine', 0.3); }, 200);
      },
      playSuccess: () => {
        if (!isSoundEnabled()) return;
        playTone(440, 0.15, 'triangle', 0.25);
        setTimeout(() => { if (isSoundEnabled()) playTone(554.37, 0.15, 'triangle', 0.25); }, 80);
        setTimeout(() => { if (isSoundEnabled()) playTone(659.25, 0.2, 'triangle', 0.25); }, 160);
      },
      playError: () => {
        if (!isSoundEnabled()) return;
        playTone(200, 0.12, 'sawtooth', 0.2);
        setTimeout(() => { if (isSoundEnabled()) playTone(180, 0.12, 'sawtooth', 0.2); }, 150);
      },
      playWarning: () => {
        if (!isSoundEnabled()) return;
        playTone(440, 0.1, 'triangle', 0.25);
        setTimeout(() => { if (isSoundEnabled()) playTone(380, 0.15, 'triangle', 0.25); }, 100);
      },
      setEnabled: (value: boolean) => localStorage.setItem(SOUND_ENABLED_KEY, String(value)),
      isEnabled: isSoundEnabled,
    };
  }
  return globalSoundInstance;
}
