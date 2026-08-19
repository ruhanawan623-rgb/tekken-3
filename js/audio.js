/**
 * TEKKEN 3 - High Fidelity Web Audio Synthesizer & Arcade Audio Engine
 * Pro-grade procedural audio: Meaty multi-layer combat hits, EWGF electric sparks,
 * dynamic character voice grunts (Dorya, Jaguar roars, Martial shouts),
 * authentic 90s Big Beat / Breakbeat BGM synthesizer, and arcade announcer.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.sfxGain = null;
        this.bgmGain = null;
        this.voiceGain = null;
        this.isMuted = false;
        
        // BGM Sequencer State
        this.bgmRunning = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.bgmBpm = 144;
        this.stageTheme = 'dojo'; // 'title', 'select', 'dojo', 'cyber', 'shrine'
        
        // Announcer setup
        this.speechAvailable = ('speechSynthesis' in window);
        this.announcerVoice = null;
        this.initVoiceLoader();
    }

    initVoiceLoader() {
        if (this.speechAvailable) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // Pick punchiest masculine/deep English voice for arcade announcer
                this.announcerVoice = voices.find(v => 
                    v.lang.startsWith('en') && (
                        v.name.includes('David') || 
                        v.name.includes('Daniel') || 
                        v.name.includes('Male') || 
                        v.name.includes('Google') ||
                        v.name.includes('Natural')
                    )
                ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
            };
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();

            // Studio-grade Master Dynamics Compressor & Limiter (prevents clipping, adds arcade punch)
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.95;

            // Sub-buses
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 1.0;

            this.voiceGain = this.ctx.createGain();
            this.voiceGain.gain.value = 0.9;

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.55;

            // Route audio graph
            this.sfxGain.connect(this.compressor);
            this.voiceGain.connect(this.compressor);
            this.bgmGain.connect(this.compressor);

            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API could not initialize:', e);
        }
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // =========================================================================
    // 💥 COMBAT SOUND EFFECTS (Heavy Multi-Layered Impact Engine)
    // =========================================================================

    /**
     * Heavy arcade martial arts hit impact with sub-bass compression,
     * mid-range chest punch snap, and high-frequency friction crack.
     */
    playHit(intensity = 'medium', isCounter = false) {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const dur = intensity === 'heavy' ? 0.32 : intensity === 'light' ? 0.12 : 0.22;

        // LAYER 1: Deep Sub-Bass Thud (Chest-vibrating impact)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = isCounter ? 'sawtooth' : (intensity === 'heavy' ? 'triangle' : 'sine');

        const startFreq = intensity === 'heavy' ? 180 : intensity === 'light' ? 240 : 210;
        const endFreq = isCounter ? 30 : 42;
        subOsc.frequency.setValueAtTime(startFreq, now);
        subOsc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

        const subVol = isCounter ? 0.95 : (intensity === 'heavy' ? 0.85 : 0.55);
        subGain.gain.setValueAtTime(subVol, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + dur);

        // LAYER 2: Resonant Mid-Range Punch Crack
        const midOsc = this.ctx.createOscillator();
        const midGain = this.ctx.createGain();
        const midFilter = this.ctx.createBiquadFilter();

        midOsc.type = 'sawtooth';
        midOsc.frequency.setValueAtTime(320, now);
        midOsc.frequency.exponentialRampToValueAtTime(80, now + dur * 0.5);

        midFilter.type = 'bandpass';
        midFilter.frequency.setValueAtTime(intensity === 'heavy' ? 750 : 1100, now);
        midFilter.Q.setValueAtTime(3.5, now);

        midGain.gain.setValueAtTime(0.65, now);
        midGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6);

        midOsc.connect(midFilter);
        midFilter.connect(midGain);
        midGain.connect(this.sfxGain);
        midOsc.start(now);
        midOsc.stop(now + dur * 0.6);

        // LAYER 3: High-Frequency Snap Noise Burst
        const noiseDur = intensity === 'heavy' ? 0.09 : 0.045;
        const bufSize = Math.floor(this.ctx.sampleRate * noiseDur);
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.28));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(intensity === 'heavy' ? 800 : 1600, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(intensity === 'heavy' ? 0.75 : 0.45, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);

        // Extra Counter Hit Sonic Shockwave
        if (isCounter) {
            this.playCounterBoom();
        }
    }

    /**
     * Counter Hit Shockwave Boom (Dramatic arcade bass distortion)
     */
    playCounterBoom() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Low bell/gong sub drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(24, now + 0.55);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.55);
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    /**
     * Mishima Electric Wind God Fist (Authentic high voltage lightning surge)
     */
    playElectricSparks() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        // Rapid multi-tone lightning crackle
        const frequencies = [1800, 2400, 3100, 1400, 2800, 950];
        frequencies.forEach((freq, idx) => {
            const delay = idx * 0.024;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.linearRampToValueAtTime(freq * 0.25, now + delay + 0.11);

            // Ring-modulator style frequency modulation
            const modOsc = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            modOsc.type = 'square';
            modOsc.frequency.value = 110;
            modGain.gain.value = 400;
            modOsc.connect(osc.frequency);
            modOsc.start(now + delay);
            modOsc.stop(now + delay + 0.11);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(freq * 0.85, now + delay);
            filter.Q.value = 6.0;

            gain.gain.setValueAtTime(0.4, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.11);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + delay);
            osc.stop(now + delay + 0.12);
        });
    }

    /**
     * Solid martial arts guard / block deflection
     */
    playBlock() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        // 1. Forearm block thud
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(260, now);
        thudOsc.frequency.exponentialRampToValueAtTime(75, now + 0.14);

        thudGain.gain.setValueAtTime(0.7, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        thudOsc.connect(thudGain);
        thudGain.connect(this.sfxGain);
        thudOsc.start(now);
        thudOsc.stop(now + 0.14);

        // 2. Metallic guard chime deflection
        const clinkOsc = this.ctx.createOscillator();
        const clinkGain = this.ctx.createGain();
        clinkOsc.type = 'sine';
        clinkOsc.frequency.setValueAtTime(1400, now);
        clinkOsc.frequency.exponentialRampToValueAtTime(600, now + 0.09);

        clinkGain.gain.setValueAtTime(0.45, now);
        clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        clinkOsc.connect(clinkGain);
        clinkGain.connect(this.sfxGain);
        clinkOsc.start(now);
        clinkOsc.stop(now + 0.09);
    }

    /**
     * Aerodynamic swing & attack whoosh
     */
    playWhoosh(type = 'medium') {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const dur = type === 'heavy' ? 0.28 : type === 'fast' ? 0.12 : 0.18;

        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        const startFreq = type === 'heavy' ? 450 : type === 'fast' ? 1200 : 750;
        const endFreq = type === 'heavy' ? 140 : type === 'fast' ? 350 : 220;

        filter.frequency.setValueAtTime(startFreq, now);
        filter.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
        filter.Q.setValueAtTime(2.8, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.48, now + dur * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    /**
     * Heavy ground slam / knockdown seismic shake
     */
    playGroundSlam() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.42);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(45, now + 0.42);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.42);
    }

    /**
     * Character Martial Arts Vocal Shouts & Kiais
     * Formant synthesized speech acoustics for authentic fighter shouts
     */
    playVoiceGrunt(characterId = 'jin', action = 'attack') {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        if (characterId === 'king') {
            // Authentic Jaguar Growl / Roar
            this.synthJaguarRoar(now, action === 'ko' ? 0.7 : 0.35);
            return;
        }

        // Human Fighter Shouts (Jin "Dorya!", Paul "Yeah!", etc.)
        let basePitch = 140; // Jin/Heihachi deep voice
        if (characterId === 'eddy') basePitch = 165;
        if (characterId === 'paul') basePitch = 150;
        if (characterId === 'yoshimitsu') basePitch = 110; // Cyber metallic

        let dur = 0.22;
        let formant1 = 800; // 'Ah' / 'Oh' vowel formant
        let formant2 = 1200;

        if (action === 'special' || action === 'electric') {
            // "DORYA!" / "YEAH!" shout
            dur = 0.35;
            basePitch *= 1.35;
            formant1 = 950;
            formant2 = 1450;
        } else if (action === 'hit') {
            dur = 0.16;
            basePitch *= 0.9;
            formant1 = 500;
            formant2 = 900;
        } else if (action === 'ko') {
            dur = 0.65;
            basePitch *= 1.1;
            formant1 = 700;
            formant2 = 1100;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const f1 = this.ctx.createBiquadFilter();
        const f2 = this.ctx.createBiquadFilter();

        osc.type = characterId === 'yoshimitsu' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(basePitch, now);
        osc.frequency.exponentialRampToValueAtTime(basePitch * (action === 'ko' ? 0.4 : 0.75), now + dur);

        f1.type = 'bandpass';
        f1.frequency.setValueAtTime(formant1, now);
        f1.Q.value = 4.0;

        f2.type = 'bandpass';
        f2.frequency.setValueAtTime(formant2, now);
        f2.Q.value = 4.5;

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(f1);
        osc.connect(f2);
        f1.connect(gain);
        f2.connect(gain);
        gain.connect(this.voiceGain);

        osc.start(now);
        osc.stop(now + dur);
    }

    synthJaguarRoar(now, dur = 0.4) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Modulate with rapid rough vibrato
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sawtooth';
        lfo.frequency.value = 32;
        lfoGain.gain.value = 45;
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + dur);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(115, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + dur);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(480, now);
        filter.Q.value = 3.0;

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.voiceGain);

        osc.start(now);
        osc.stop(now + dur);
    }

    // =========================================================================
    // 🔔 UI SOUND EFFECTS
    // =========================================================================

    playMenuSelect() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    playMenuMove() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playKOJingle() {
        this.ensureContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;

        // Dramatic sub gong
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 1.6);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 1.6);

        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 1.6);
    }

    // =========================================================================
    // 🎙️ ARCADE ANNOUNCER & MATCH CALLS
    // =========================================================================

    speak(phrase, pitch = 0.82, rate = 1.05) {
        if (this.isMuted) return;

        if (this.speechAvailable) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(phrase);
                utterance.pitch = pitch;
                utterance.rate = rate;
                utterance.volume = 1.0;
                if (this.announcerVoice) {
                    utterance.voice = this.announcerVoice;
                }
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.warn('Speech synthesis notice:', e);
            }
        }
    }

    announceGetReady() {
        this.playMenuSelect();
        setTimeout(() => {
            this.speak("Get Ready For The Next Battle!", 0.8, 1.05);
        }, 100);
    }

    announceRound(roundNum, isFinal = false) {
        // Dramatic Round Start Chime
        this.playRoundFanfare();
        setTimeout(() => {
            if (isFinal) {
                this.speak("Final Round! Fight!", 0.78, 1.15);
            } else {
                this.speak(`Round ${roundNum}... Fight!`, 0.8, 1.15);
            }
        }, 200);
    }

    playRoundFanfare() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const chords = [220, 277.18, 329.63, 440];
        chords.forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.35);
        });
    }

    announceKO() {
        this.playKOJingle();
        setTimeout(() => {
            this.speak("K. O.!", 0.72, 0.95);
        }, 150);
    }

    announceDoubleKO() {
        this.playKOJingle();
        setTimeout(() => {
            this.speak("Double K. O.!", 0.72, 0.95);
        }, 150);
    }

    announceWinner(fighterName, isPerfect = false) {
        setTimeout(() => {
            if (isPerfect) {
                this.speak(`Perfect! ${fighterName} Wins!`, 0.85, 1.05);
            } else {
                this.speak(`${fighterName} Wins!`, 0.85, 1.05);
            }
        }, 900);
    }

    announceDraw() {
        setTimeout(() => {
            this.speak("Draw Game!", 0.8, 1.0);
        }, 600);
    }

    // =========================================================================
    // 🎧 HIGH-OCTANE 90s BIG BEAT / BREAKBEAT ARCADE SOUNDTRACK
    // =========================================================================

    startBGM(theme = 'dojo') {
        this.ensureContext();
        if (!this.ctx) return;
        this.stageTheme = theme;
        this.stopBGM();
        this.bgmRunning = true;
        this.bgmStep = 0;

        // Authentic Tekken 3 Musical Scales & Tempos
        const themes = {
            dojo: {
                bpm: 148,
                root: 110, // A2 (Jin Kazama High Octane Theme)
                scale: [0, 3, 5, 7, 10, 12, 15, 17],
                kickPattern: [1, 0, 0, 1,  0, 0, 1, 0,  1, 0, 0, 1,  0, 1, 0, 0],
                snarePattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 1],
                bassPattern: [0, 0, 3, 0,  5, 0, 7, 5,  0, 0, 10, 0, 7, 5, 3, 2]
            },
            cyber: {
                bpm: 152,
                root: 123.47, // B2 (Paul / Law Acid Breakbeat)
                scale: [0, 2, 3, 7, 8, 12, 14, 15],
                kickPattern: [1, 0, 1, 0,  0, 1, 0, 0,  1, 0, 1, 0,  0, 0, 1, 0],
                snarePattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
                bassPattern: [0, 2, 0, 7,  8, 7, 0, 2,  0, 3, 0, 7,  12, 8, 7, 3]
            },
            shrine: {
                bpm: 142,
                root: 98.0, // G2 (Forest / Yoshimitsu Mystic Breakbeat)
                scale: [0, 4, 7, 9, 12, 16, 19, 21],
                kickPattern: [1, 0, 0, 0,  1, 0, 0, 1,  1, 0, 0, 0,  1, 0, 1, 0],
                snarePattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
                bassPattern: [0, 4, 7, 4,  0, 7, 9, 7,  0, 4, 12, 9, 7, 4, 2, 0]
            }
        };

        const currentTheme = themes[theme] || themes.dojo;
        this.bgmBpm = currentTheme.bpm;
        const stepTime = (60 / this.bgmBpm) / 4;

        const scheduleStep = () => {
            if (!this.bgmRunning || !this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;
            const s = this.bgmStep % 16;
            const bar = Math.floor(this.bgmStep / 16) % 4;

            // 1. Heavy 909 Kick Drum
            if (currentTheme.kickPattern[s]) {
                this.synthDrumKick(now);
            }

            // 2. Snappy 90s Layered Breakbeat Snare
            if (currentTheme.snarePattern[s]) {
                this.synthDrumSnare(now);
            }

            // 3. Crisp Hi-Hats
            const isOpenHat = (s === 2 || s === 6 || s === 10 || s === 14);
            this.synthHiHat(now, isOpenHat ? 0.12 : 0.06, isOpenHat);

            // 4. Acid TB-303 Resonant Bassline
            const noteIdx = currentTheme.bassPattern[s];
            const semitone = currentTheme.scale[noteIdx % currentTheme.scale.length];
            const bassFreq = currentTheme.root * Math.pow(2, (semitone - 12) / 12);
            const cutoffMod = 600 + Math.sin(this.bgmStep * 0.4) * 800;
            this.synthAcidBass(now, bassFreq, stepTime * 0.9, cutoffMod);

            // 5. High Octane Lead Synth Riff
            if (s % 2 === 0 && (bar === 1 || bar === 3 || Math.random() > 0.4)) {
                const leadIdx = (s * 3 + bar * 2) % currentTheme.scale.length;
                const leadSemi = currentTheme.scale[leadIdx];
                const leadFreq = currentTheme.root * 2 * Math.pow(2, leadSemi / 12);
                this.synthRaveLead(now, leadFreq, stepTime * 1.4);
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(scheduleStep, stepTime * 1000);
        };

        scheduleStep();
    }

    stopBGM() {
        this.bgmRunning = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    synthDrumKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);
        gain.gain.setValueAtTime(0.85, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    synthDrumSnare(time) {
        const dur = 0.16;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 950;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        noise.start(time);

        // Snare body tone
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, time);
        osc.frequency.exponentialRampToValueAtTime(110, time + dur * 0.6);
        oscGain.gain.setValueAtTime(0.4, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.6);
        osc.connect(oscGain);
        oscGain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + dur * 0.6);
    }

    synthHiHat(time, vol = 0.08, isOpen = false) {
        const dur = isOpen ? 0.11 : 0.038;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 9200;
        filter.Q.value = 3.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        noise.start(time);
    }

    synthAcidBass(time, freq, dur, cutoff = 1200) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // Roland TB-303 Resonant Filter Sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, time);
        filter.frequency.exponentialRampToValueAtTime(180, time + dur);
        filter.Q.value = 7.5; // Acid resonance

        gain.gain.setValueAtTime(0.42, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + dur);
    }

    synthRaveLead(time, freq, dur) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(freq * 1.008, time); // Subtle detune for wide supersaw feel

        filter.type = 'bandpass';
        filter.frequency.value = 2200;
        filter.Q.value = 2.0;

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + dur);
        osc2.stop(time + dur);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.95;
        }
        return this.isMuted;
    }
}

window.soundEngine = new SoundEngine();
