// The payoff: fragments fly together into the real coordinates.
// Everything here is drawn on canvas — nothing coordinate-shaped ever
// touches the DOM.

import { sfx } from "../sfx.js";

export function registerWinScene() {
    scene("win", (stats) => {
        add([rect(width(), height()), pos(0, 0), color(5, 5, 16), fixed(), z(0)]);

        const cherub = add([
            sprite("cherub", { anim: "idle" }),
            pos(width() / 2, 26),
            anchor("center"),
            scale(2),
            fixed(),
            z(2),
        ]);
        onUpdate(() => {
            cherub.pos.y = 26 + Math.sin(time() * 3) * 3;
        });

        const heading = add([
            text("THE FRAGMENTS ASSEMBLE...", { size: 8, font: "unscii" }),
            anchor("center"),
            pos(width() / 2, 52),
            color(255, 216, 74),
            fixed(),
            z(2),
            opacity(0),
        ]);
        tween(0, 1, 0.6, (o) => heading.opacity = o);

        // fragments slide in one by one
        const frags = stats.frags.map((f) => f ?? "???");
        frags.forEach((frag, i) => {
            wait(0.7 + i * 0.55, () => {
                sfx.coin();
                const t = add([
                    text(frag, { size: 12, font: "unscii" }),
                    anchor("center"),
                    pos(width() + 60, 76 + i * 16),
                    color(140, 255, 140),
                    fixed(),
                    z(2),
                ]);
                tween(t.pos.x, width() / 2, 0.4, (x) => t.pos.x = x, easings.easeOutBack);
            });
        });

        wait(0.7 + frags.length * 0.55 + 0.4, () => {
            sfx.win();
            const lines = [
                "Now go sign the log.",
                "For real this time.",
            ];
            lines.forEach((l, i) => {
                const t = add([
                    text(l, { size: 8, font: "unscii" }),
                    anchor("center"),
                    pos(width() / 2, 170 + i * 12),
                    color(235, 235, 235),
                    fixed(),
                    z(2),
                    opacity(0),
                ]);
                tween(0, 1, 0.5, (o) => t.opacity = o);
            });

            const mm = String(Math.floor(stats.seconds / 60));
            const ss = String(stats.seconds % 60).padStart(2, "0");
            const statBits = [
                `time ${mm}:${ss}`,
                `decoy bites ${stats.decoyBites}`,
                `deaths ${stats.deaths}`,
            ];
            if (stats.hasTrackable) statBits.push("trackable: still useless");
            add([
                text(statBits.join("  |  "), { size: 8, font: "unscii", width: width() - 16, align: "center" }),
                anchor("center"),
                pos(width() / 2, 204),
                color(140, 140, 160),
                fixed(),
                z(2),
            ]);

            const again = add([
                text("TFTC! (tap to replay)", { size: 8, font: "unscii" }),
                anchor("center"),
                pos(width() / 2, 236),
                color(255, 216, 74),
                fixed(),
                z(2),
            ]);
            onUpdate(() => {
                again.opacity = 0.55 + 0.45 * Math.sin(time() * 4);
            });

            wait(0.8, () => {
                const restart = () => go("title");
                onMousePress(restart);
                onKeyPress(restart);
                onTouchStart(restart);
            });
        });
    });
}
