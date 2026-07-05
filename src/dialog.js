// Typewriter dialog boxes. `say()` returns a promise that resolves when the
// player has tapped through every line, so story beats can be awaited.
// Gameplay checks isDialogOpen() to pause movement/AI while a box is up.

import { sfx } from "./sfx.js";

let open = false;
let chain = Promise.resolve();

export function isDialogOpen() {
    return open;
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
            resolve();
        }

        startLine();
    });
}
