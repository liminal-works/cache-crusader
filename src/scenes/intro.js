// Intro cutscene: the cherub narrator sets up the twist — the tin you just
// found in the real world was only the beginning.

import { say } from "../dialog.js";

export function registerIntroScene() {
    scene("intro", async () => {
        add([rect(width(), height()), pos(0, 0), color(6, 6, 26), fixed(), z(0)]);

        // faint stars so the void isn't dead flat
        for (let i = 0; i < 24; i++) {
            const star = add([
                rect(1, 1),
                pos(rand(4, width() - 4), rand(4, height() - 90)),
                color(200, 200, 230),
                fixed(),
                z(1),
                opacity(rand(0.2, 0.7)),
                { tw: rand(2, 5) },
            ]);
            star.onUpdate(() => {
                star.opacity = 0.25 + 0.35 * (1 + Math.sin(time() * star.tw)) / 2;
            });
        }

        const cherub = add([
            sprite("cherub", { anim: "idle" }),
            pos(width() / 2, 46),
            anchor("center"),
            scale(2.5),
            fixed(),
            z(3),
        ]);
        cherub.onUpdate(() => {
            cherub.pos.y = 46 + Math.sin(time() * 2.5) * 4;
        });

        // the ancient relic (a pixelated tin sign), bobbing reverently
        const tin = add([
            sprite("tin"),
            pos(width() / 2, 124),
            anchor("center"),
            scale(1.2),
            fixed(),
            z(3),
            opacity(0),
            { baseY: 124 },
        ]);
        tin.onUpdate(() => {
            tin.pos.y = tin.baseY + Math.sin(time() * 2) * 5;
        });
        tween(0, 1, 0.8, (o) => tin.opacity = o);

        // sparkles around the relic
        loop(0.5, () => {
            if (tin.opacity < 0.5) return;
            const sp = add([
                text("*", { size: 8, font: "unscii" }),
                pos(tin.pos.add(rand(-58, 58), rand(-32, 32))),
                anchor("center"),
                color(255, 240, 150),
                fixed(),
                z(4),
                opacity(1),
            ]);
            tween(1, 0, 0.8, (o) => sp.opacity = o).then(() => destroy(sp));
        });

        await say([
            { who: "CHERUB", text: "Congratulations, adventurer! You've found the ANCIENT RELIC!" },
            { who: "CHERUB", text: "...What? You thought this was JUST ANOTHER TIN?" },
            { who: "CHERUB", text: "Oh no no no. It's not over yet." },
            { who: "CHERUB", text: "The TRUE cache, and its log, waits at the end of this dungeon." },
            { who: "CHERUB", text: "FIVE coordinate fragments lie hidden in its halls. Decoys with teeth. Muggles with questions." },
            { who: "CHERUB", text: "Find the fragments. Open the final door. Sign the log." },
            { who: "CHERUB", text: "Go forth, brave CACHEASAUR!" },
        ]);

        go("game");
    });
}
