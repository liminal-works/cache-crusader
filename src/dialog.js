// Typewriter dialog boxes. `say()` returns a promise that resolves when the
// player has tapped through every line, so story beats can be awaited.
// Gameplay checks isDialogOpen() to pause movement/AI while a box is up.

import { sfx } from "./sfx.js";

let open = false;
let closedAt = -10;
let chain = Promise.resolve();

export function isDialogOpen() {
    return open;
}

// the tap/keypress that dismisses a dialog also reaches the interact
// handlers in the same frame — give callers a short grace window to ignore it
export function dialogJustClosed() {
    return time() - closedAt < 0.3;
}

// lines: array of { who, text } (or a single one)
export function say(lines) {
    if (!Array.isArray(lines)) lines = [lines];
    chain = chain.then(() => runDialog(lines));
    return chain;
}

function runDialog(lines) {
    return new Promise((resolve) => {
        open = true;

        const H = height();
        const W = width();
        const box = add([
            rect(W - 8, 62),
            pos(4, H - 68),
            color(8, 8, 28),
            outline(2, rgb(230, 230, 240)),
            fixed(),
            z(5000),
        ]);
        const nameTxt = add([
            text("", { size: 8, font: "unscii" }),
            pos(10, H - 62),
            color(255, 216, 74),
            fixed(),
            z(5001),
        ]);
        const bodyTxt = add([
            text("", { size: 8, font: "unscii", width: W - 24, lineSpacing: 3 }),
            pos(10, H - 50),
            color(235, 235, 235),
            fixed(),
            z(5001),
        ]);
        const cue = add([
            text(">", { size: 8, font: "unscii" }),
            pos(W - 16, H - 16),
            color(255, 216, 74),
            fixed(),
            z(5001),
            opacity(0),
        ]);

        let li = 0;
        let shown = 0;
        let full = "";
        let done = false;
        let lastAdvance = time();

        function startLine() {
            const line = lines[li];
            nameTxt.text = line.who ? line.who : "";
            full = line.text;
            shown = 0;
            done = false;
            bodyTxt.text = "";
            cue.opacity = 0;
        }

        const typer = onUpdate(() => {
            if (!done) {
                const before = Math.floor(shown);
                shown = Math.min(full.length, shown + dt() * 45);
                if (Math.floor(shown) !== before) {
                    bodyTxt.text = full.slice(0, Math.floor(shown));
                    if (Math.floor(shown) % 3 === 0) sfx.blip();
                }
                if (shown >= full.length) {
                    bodyTxt.text = full;
                    done = true;
                }
            } else {
                cue.opacity = 0.5 + 0.5 * Math.sin(time() * 6);
            }
        });

        function advance() {
            // debounce so the tap that opened the box doesn't also advance it
            if (time() - lastAdvance < 0.15) return;
            lastAdvance = time();
            if (!done) {
                shown = full.length;
                bodyTxt.text = full;
                done = true;
                return;
            }
            li++;
            if (li < lines.length) {
                startLine();
            } else {
                finish();
            }
        }

        const handlers = [
            onKeyPress("space", advance),
            onKeyPress("enter", advance),
            onKeyPress("e", advance),
            onMousePress(advance),
        ];

        function finish() {
            handlers.forEach((h) => h.cancel());
            typer.cancel();
            [box, nameTxt, bodyTxt, cue].forEach((o) => destroy(o));
            open = false;
            closedAt = time();
            resolve();
        }

        startLine();
    });
}

// Prompt with up to 3 tappable options. Resolves with the chosen index.
// Keyboard: up/down + enter/space/e. Touch/mouse: tap an option row.
export function sayChoice(who, prompt, options) {
    chain = chain.then(() => runChoice(who, prompt, options));
    return chain;
}

function runChoice(who, prompt, options) {
    return new Promise((resolve) => {
        open = true;

        const W = width();
        const H = height();
        const boxH = 46 + options.length * 13;
        const top = H - boxH - 4;
        const objs = [];
        const openedAt = time();

        objs.push(add([
            rect(W - 8, boxH),
            pos(4, top),
            color(8, 8, 28),
            outline(2, rgb(230, 230, 240)),
            fixed(),
            z(5000),
        ]));
        objs.push(add([
            text(who, { size: 8, font: "unscii" }),
            pos(10, top + 6),
            color(255, 216, 74),
            fixed(),
            z(5001),
        ]));
        objs.push(add([
            text(prompt, { size: 8, font: "unscii", width: W - 24, lineSpacing: 2 }),
            pos(10, top + 18),
            color(235, 235, 235),
            fixed(),
            z(5001),
        ]));

        let sel = 0;
        const rows = options.map((opt, i) => {
            const y = top + 42 + i * 13;
            const t = add([
                text("  " + opt, { size: 8, font: "unscii" }),
                pos(16, y),
                color(160, 160, 170),
                fixed(),
                z(5001),
                { rowY: y },
            ]);
            objs.push(t);
            return t;
        });

        function paint() {
            rows.forEach((r, i) => {
                r.text = (i === sel ? "> " : "  ") + options[i];
                r.color = i === sel ? rgb(255, 216, 74) : rgb(160, 160, 170);
            });
        }
        paint();

        function move(d) {
            sel = (sel + d + options.length) % options.length;
            sfx.blip();
            paint();
        }

        function choose(i) {
            handlers.forEach((h) => h.cancel());
            objs.forEach((o) => destroy(o));
            open = false;
            closedAt = time();
            resolve(i);
        }

        const handlers = [
            onKeyPress("up", () => move(-1)),
            onKeyPress("w", () => move(-1)),
            onKeyPress("down", () => move(1)),
            onKeyPress("s", () => move(1)),
            onKeyPress("enter", () => choose(sel)),
            onKeyPress("space", () => choose(sel)),
            onKeyPress("e", () => choose(sel)),
            onMousePress(() => {
                if (time() - openedAt < 0.25) return;
                const p = mousePos();
                const i = rows.findIndex((r) => p.y >= r.rowY - 3 && p.y < r.rowY + 11);
                if (i >= 0) {
                    sel = i;
                    paint();
                    choose(i);
                }
            }),
        ];
    });
}
