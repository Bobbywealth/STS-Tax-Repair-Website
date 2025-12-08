type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  selection: 5,
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [30, 50, 30, 50, 30],
};

export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined') return;

  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(vibrationPatterns[style]);
    } catch (e) {
    }
  }
}

export function hapticFeedback(style: HapticStyle = 'light') {
  return () => triggerHaptic(style);
}

export function withHaptic<T extends (...args: any[]) => any>(
  fn: T,
  style: HapticStyle = 'light'
): T {
  return ((...args: Parameters<T>) => {
    triggerHaptic(style);
    return fn(...args);
  }) as T;
}
