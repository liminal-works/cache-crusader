// Tiny synthesized sound effects — no audio assets needed.
// Everything is a short oscillator envelope through one shared AudioContext.

let ctx = null;

function ac() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

// call once from a user gesture so mobile browsers let audio through
export function unlockAudio() {
    ac();
}

function tone({ freq = 440, end = freq, dur = 0.1, type = "square", vol = 0.14, delay = 0 }) {
    const c = ac();
    if (!c || c.state !== "running") return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

export const sfx = {
    blip: () => tone({ freq: 620, dur: 0.03, vol: 0.05, type: "square" }),
    coin: () => { tone({ freq: 880, dur: 0.06 }); tone({ freq: 1320, dur: 0.12, delay: 0.06 }); },
    open: () => tone({ freq: 220, end: 440, dur: 0.12, type: "triangle" }),
    fragment: () => {
        [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.09, delay: i * 0.08, type: "triangle", vol: 0.16 }));
    },
    hurt: () => tone({ freq: 200, end: 70, dur: 0.2, type: "sawtooth", vol: 0.18 }),
    bite: () => { tone({ freq: 140, end: 60, dur: 0.15, type: "sawtooth", vol: 0.2 }); tone({ freq: 90, end: 50, dur: 0.2, delay: 0.1, type: "square", vol: 0.15 }); },
    lever: () => tone({ freq: 330, end: 160, dur: 0.1, type: "square" }),
    potion: () => { tone({ freq: 440, end: 880, dur: 0.18, type: "sine", vol: 0.18 }); tone({ freq: 660, end: 1100, dur: 0.2, delay: 0.1, type: "sine", vol: 0.12 }); },
    door: () => tone({ freq: 110, end: 180, dur: 0.25, type: "triangle", vol: 0.2 }),
    alarm: () => { tone({ freq: 700, dur: 0.12, type: "square", vol: 0.16 }); tone({ freq: 700, dur: 0.12, delay: 0.18, type: "square", vol: 0.16 }); },
    win: () => {
        [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, dur: 0.16, delay: i * 0.11, type: "triangle", vol: 0.17 }));
    },
};
