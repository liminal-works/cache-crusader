// HUD: hearts (top-left), geocoins under them, fragment counter (top-right),
// suspicion meter (top-center, only while muggles are getting curious).

export function createHUD(state) {
    const hearts = [];
    for (let i = 0; i < state.maxHearts / 2; i++) {
        hearts.push(add([
            sprite("health", { frame: 0 }),
            pos(4 + i * 18, 4),
            fixed(),
            z(3000),
        ]));
    }

    add([sprite("coin", { anim: "spin" }), pos(7, 24), fixed(), z(3000)]);
    const coinTxt = add([
        text("0", { size: 8, font: "unscii" }),
        pos(18, 24),
        color(255, 216, 74),
        fixed(),
        z(3000),
    ]);

    add([sprite("can", { frame: 0 }), pos(width() - 52, 2), fixed(), z(3000)]);
    const fragTxt = add([
        text("0/5", { size: 8, font: "unscii" }),
        pos(width() - 32, 8),
        color(140, 255, 140),
        fixed(),
        z(3000),
    ]);

    // suspicion meter
    const susGroup = [];
    const susIcon = add([sprite("skull"), pos(width() / 2 - 42, 2), fixed(), z(3000), opacity(0)]);
    const susBack = add([
        rect(64, 8), pos(width() / 2 - 24, 6), color(20, 20, 30),
        outline(1, rgb(220, 220, 220)), fixed(), z(3000), opacity(0),
    ]);
    const susBar = add([
        rect(62, 6), pos(width() / 2 - 23, 7), color(120, 220, 90), fixed(), z(3001), opacity(0),
    ]);
    susGroup.push(susIcon, susBack, susBar);

    return {
        update() {
            for (let i = 0; i < hearts.length; i++) {
                const hv = state.hearts - i * 2;
                hearts[i].frame = hv >= 2 ? 0 : hv === 1 ? 1 : 2;
            }
            coinTxt.text = String(state.coins);
            fragTxt.text = `${state.fragCount}/5`;

            const s = state.suspicion;
            const vis = s > 0.01 ? 1 : 0;
            susGroup.forEach((o) => o.opacity = vis);
            susBar.width = Math.max(1, 62 * s);
            susBar.color = rgb(
                Math.round(120 + 135 * s),
                Math.round(220 - 150 * s),
                70,
            );
            if (s > 0.75) susIcon.opacity = 0.5 + 0.5 * Math.sin(time() * 10);
        },
    };
}
