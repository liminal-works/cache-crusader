import { CACHE_CONFIG } from "../../config.js";

export function registerTitleScene() {
    scene("title", () => {
        add([
            sprite("title"),
            scale(0.6),
            pos(0, 0),
            anchor("topleft"),
            fixed(),
            z(0),
        ]);

        // dark strip so text pops over the splash art
        add([
            rect(width(), 96),
            pos(0, height() / 3 - 40),
            color(0, 0, 0),
            opacity(0.35),
            fixed(),
            z(1),
        ]);

        add([
            text("CACHE\nCRUSADER", { size: 24, font: "unscii", align: "center" }),
            color(0, 0, 0),
            anchor("center"),
            pos(width() / 2 + 2, height() / 3 + 2),
            fixed(),
            z(2),
        ]);
        add([
            text("CACHE\nCRUSADER", { size: 24, font: "unscii", align: "center" }),
            color(255, 216, 0),
            anchor("center"),
            pos(width() / 2, height() / 3),
            fixed(),
            z(3),
        ]);

        add([
            text(`a "${CACHE_CONFIG.cacheName}" production`, { size: 8, font: "unscii" }),
            color(220, 220, 220),
            anchor("center"),
            pos(width() / 2, height() / 3 + 34),
            fixed(),
            z(3),
        ]);

        const prompt = add([
            text("press to start", { size: 12, font: "unscii" }),
            color(255, 255, 255),
            anchor("center"),
            pos(width() / 2, height() * 0.72),
            fixed(),
            z(3),
        ]);
        onUpdate(() => {
            prompt.opacity = 0.55 + 0.45 * Math.sin(time() * 4);
        });

        const start = () => go("game");
        onMousePress(start);
        onKeyPress(start);
        onTouchStart(start);
    });
}
