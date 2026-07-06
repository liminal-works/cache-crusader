import kaboom from "../vendor/kaboom.mjs";
import { loadAssets } from "./sprites.js";
import { unlockAudio } from "./sfx.js";
import { registerTitleScene } from "./scenes/title.js";
import { registerIntroScene } from "./scenes/intro.js";
import { registerGameScene } from "./scenes/game.js";
import { registerWinScene } from "./scenes/win.js";

kaboom({
    root: document.querySelector("#game"),
    width: 256,
    height: 256,
    background: [5, 5, 16],
    crisp: true,
    letterbox: true,
    stretch: false,
});

// mobile browsers gate audio behind a user gesture
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

// selection / zoom guards
document.addEventListener("selectstart", (e) => e.preventDefault());
document.addEventListener("contextmenu", (e) => e.preventDefault(), { passive: false });
let lastTouch = 0;
window.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch < 350) e.preventDefault();
    lastTouch = now;
}, { passive: false });

loadAssets();
registerTitleScene();
registerIntroScene();
registerGameScene();
registerWinScene();

go("title");
