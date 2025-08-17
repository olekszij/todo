// Thematic sound sets for TaskFlow

export interface SoundTheme {
    name: string;
    description: string;
    workStart: () => void;
    workEnd: () => void;
    breakStart: () => void;
    breakEnd: () => void;
    tick: () => void;
    notification: () => void;
}

// Base class for creating sounds
class SoundCreator {
    private audioContext: AudioContext | null = null;

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
    }

    protected createSound(frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) {
        this.initAudioContext();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    protected createSequence(sounds: Array<{ freq: number; type: OscillatorType; duration: number; volume: number; delay: number }>) {
        sounds.forEach(sound => {
            setTimeout(() => {
                this.createSound(sound.freq, sound.type, sound.duration, sound.volume);
            }, sound.delay);
        });
    }
}

// Theme 1: Classic (current)
export class ClassicTheme extends SoundCreator implements SoundTheme {
    name = "Classic";
    description = "Traditional productivity sounds";

    workStart = () => {
        this.createSequence([
            { freq: 440, type: 'sine', duration: 0.3, volume: 0.12, delay: 0 },
            { freq: 554, type: 'sine', duration: 0.3, volume: 0.12, delay: 100 },
            { freq: 659, type: 'sine', duration: 0.4, volume: 0.12, delay: 200 }
        ]);
    };

    workEnd = () => {
        this.createSequence([
            { freq: 659, type: 'square', duration: 0.4, volume: 0.15, delay: 0 },
            { freq: 554, type: 'square', duration: 0.4, volume: 0.15, delay: 150 },
            { freq: 440, type: 'square', duration: 0.6, volume: 0.15, delay: 300 }
        ]);
    };

    breakStart = () => {
        this.createSequence([
            { freq: 523, type: 'triangle', duration: 0.5, volume: 0.1, delay: 0 },
            { freq: 659, type: 'triangle', duration: 0.5, volume: 0.1, delay: 200 }
        ]);
    };

    breakEnd = () => {
        this.createSequence([
            { freq: 784, type: 'sawtooth', duration: 0.3, volume: 0.08, delay: 0 },
            { freq: 659, type: 'sawtooth', duration: 0.3, volume: 0.08, delay: 100 },
            { freq: 523, type: 'sawtooth', duration: 0.5, volume: 0.08, delay: 200 }
        ]);
    };

    tick = () => {
        this.createSound(1500, 'sine', 0.08, 0.03);
    };

    notification = () => {
        this.createSequence([
            { freq: 800, type: 'sawtooth', duration: 0.2, volume: 0.1, delay: 0 },
            { freq: 1000, type: 'sawtooth', duration: 0.2, volume: 0.1, delay: 100 },
            { freq: 1200, type: 'sawtooth', duration: 0.3, volume: 0.1, delay: 200 }
        ]);
    };
}

// Theme 2: Nature
export class NatureTheme extends SoundCreator implements SoundTheme {
    name = "Nature";
    description = "Nature sounds for tranquility";

    workStart = () => {
        this.createSequence([
            { freq: 200, type: 'sine', duration: 0.4, volume: 0.08, delay: 0 },
            { freq: 300, type: 'sine', duration: 0.4, volume: 0.08, delay: 200 },
            { freq: 400, type: 'sine', duration: 0.6, volume: 0.08, delay: 400 }
        ]);
    };

    workEnd = () => {
        this.createSequence([
            { freq: 400, type: 'triangle', duration: 0.5, volume: 0.1, delay: 0 },
            { freq: 300, type: 'triangle', duration: 0.5, volume: 0.1, delay: 300 },
            { freq: 200, type: 'triangle', duration: 0.7, volume: 0.1, delay: 600 }
        ]);
    };

    breakStart = () => {
        this.createSequence([
            { freq: 150, type: 'sine', duration: 0.6, volume: 0.06, delay: 0 },
            { freq: 200, type: 'sine', duration: 0.6, volume: 0.06, delay: 300 }
        ]);
    };

    breakEnd = () => {
        this.createSequence([
            { freq: 250, type: 'triangle', duration: 0.4, volume: 0.08, delay: 0 },
            { freq: 200, type: 'triangle', duration: 0.4, volume: 0.08, delay: 200 },
            { freq: 150, type: 'triangle', duration: 0.6, volume: 0.08, delay: 400 }
        ]);
    };

    tick = () => {
        this.createSound(800, 'sine', 0.1, 0.02);
    };

    notification = () => {
        this.createSequence([
            { freq: 300, type: 'triangle', duration: 0.3, volume: 0.08, delay: 0 },
            { freq: 400, type: 'triangle', duration: 0.3, volume: 0.08, delay: 200 }
        ]);
    };
}

// Theme 3: Electronic
export class ElectronicTheme extends SoundCreator implements SoundTheme {
    name = "Electronic";
    description = "Modern digital sounds";

    workStart = () => {
        this.createSequence([
            { freq: 800, type: 'square', duration: 0.2, volume: 0.1, delay: 0 },
            { freq: 1200, type: 'square', duration: 0.2, volume: 0.1, delay: 100 },
            { freq: 1600, type: 'square', duration: 0.3, volume: 0.1, delay: 200 }
        ]);
    };

    workEnd = () => {
        this.createSequence([
            { freq: 1600, type: 'sawtooth', duration: 0.3, volume: 0.12, delay: 0 },
            { freq: 1200, type: 'sawtooth', duration: 0.3, volume: 0.12, delay: 150 },
            { freq: 800, type: 'sawtooth', duration: 0.4, volume: 0.12, delay: 300 }
        ]);
    };

    breakStart = () => {
        this.createSequence([
            { freq: 600, type: 'sine', duration: 0.3, volume: 0.08, delay: 0 },
            { freq: 900, type: 'sine', duration: 0.3, volume: 0.08, delay: 150 }
        ]);
    };

    breakEnd = () => {
        this.createSequence([
            { freq: 1000, type: 'sawtooth', duration: 0.2, volume: 0.1, delay: 0 },
            { freq: 800, type: 'sawtooth', duration: 0.2, volume: 0.1, delay: 100 },
            { freq: 600, type: 'sawtooth', duration: 0.3, volume: 0.1, delay: 200 }
        ]);
    };

    tick = () => {
        this.createSound(2000, 'square', 0.05, 0.04);
    };

    notification = () => {
        this.createSequence([
            { freq: 1000, type: 'sawtooth', duration: 0.15, volume: 0.1, delay: 0 },
            { freq: 1500, type: 'sawtooth', duration: 0.15, volume: 0.1, delay: 100 },
            { freq: 2000, type: 'sawtooth', duration: 0.2, volume: 0.1, delay: 200 }
        ]);
    };
}

// Theme 4: Minimalist
export class MinimalistTheme extends SoundCreator implements SoundTheme {
    name = "Minimalist";
    description = "Simple and quiet sounds";

    workStart = () => {
        this.createSound(600, 'sine', 0.4, 0.06);
    };

    workEnd = () => {
        this.createSound(400, 'sine', 0.5, 0.08);
    };

    breakStart = () => {
        this.createSound(500, 'sine', 0.3, 0.05);
    };

    breakEnd = () => {
        this.createSound(300, 'sine', 0.4, 0.06);
    };

    tick = () => {
        this.createSound(1000, 'sine', 0.05, 0.02);
    };

    notification = () => {
        this.createSound(800, 'sine', 0.2, 0.06);
    };
}

// Export all themes
export const soundThemes = {
    classic: new ClassicTheme(),
    nature: new NatureTheme(),
    electronic: new ElectronicTheme(),
    minimalist: new MinimalistTheme()
};

// Current active theme
export let currentTheme: SoundTheme = soundThemes.classic;

// Function to change theme
export const setTheme = (themeName: keyof typeof soundThemes) => {
    currentTheme = soundThemes[themeName];
    localStorage.setItem('sound-theme', themeName);
};

// Load saved theme
export const loadTheme = () => {
    const savedTheme = localStorage.getItem('sound-theme') as keyof typeof soundThemes;
    if (savedTheme && soundThemes[savedTheme]) {
        currentTheme = soundThemes[savedTheme];
    }
}; 