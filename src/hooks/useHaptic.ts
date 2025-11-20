type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 50,
    success: [10, 50, 10],
    error: [20, 50, 20, 50, 20],
    warning: [30, 50, 30],
};

export function useHaptic() {
    const vibrate = (pattern: HapticPattern = 'light') => {
        if ('vibrate' in navigator) {
            const vibrationPattern = patterns[pattern];
            navigator.vibrate(vibrationPattern);
            return true;
        }
        return false;
    };

    const stop = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    };

    return { vibrate, stop };
}
