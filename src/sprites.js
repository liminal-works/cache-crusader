// All art comes from two sheets shipped with the original prototype:
//   assets/dungeon.png  — 0x72's DungeonTilesetII (CC0)
//   assets/unscii_8x8.png — unscii bitmap font (public domain)
// Coordinates below index into the 512x512 dungeon sheet.

const heroAnims = {
    idle: { from: 0, to: 3, speed: 5, loop: true },
    run: { from: 4, to: 7, speed: 10, loop: true },
    hit: 8,
};

// 16x28 tall characters laid out idle(4) + run(4) + hit(1) in a row
function tallChar(x, y) {
    return { x, y, width: 144, height: 28, sliceX: 9, anims: heroAnims };
}

// 16x16 critters laid out idle(4) + run(4) in a row
function smallChar(x, y) {
    return {
        x, y, width: 128, height: 16, sliceX: 8,
        anims: {
            idle: { from: 0, to: 3, speed: 5, loop: true },
            run: { from: 4, to: 7, speed: 10, loop: true },
        },
    };
}

export function loadAssets() {
    loadBitmapFont("unscii", "assets/unscii_8x8.png", 8, 8);
    loadSprite("title", "assets/title.png");

    loadSpriteAtlas("assets/dungeon.png", {
        // ---- characters ----
        hero: tallChar(128, 100),        // knight, our crusader
        wizard: tallChar(128, 164),      // white-bearded potion merchant
        cachesaur: tallChar(128, 196),   // teal lizard, the Cache-asaur
        muggle_f: tallChar(128, 4),      // regular folks, dangerously observant
        muggle_m: tallChar(128, 36),
        ogre: {
            x: 16, y: 320, width: 256, height: 32, sliceX: 8,
            anims: {
                idle: { from: 0, to: 3, speed: 3, loop: true },
                run: { from: 4, to: 7, speed: 10, loop: true },
            },
        },
        cherub: smallChar(368, 368),     // the narrator
        trackable: smallChar(368, 48),   // little imp; completely useless

        // ---- containers ----
        can: {                           // green ammo-can chest: the real deal
            x: 304, y: 304, width: 48, height: 16, sliceX: 3,
            anims: {
                open: { from: 0, to: 2, speed: 14, loop: false },
                close: { from: 2, to: 0, speed: 14, loop: false },
            },
        },
        chest: {                         // gold chest: geocoins inside
            x: 304, y: 288, width: 48, height: 16, sliceX: 3,
            anims: { open: { from: 0, to: 2, speed: 14, loop: false } },
        },
        mimic: {                         // DECOY. it has teeth
            x: 304, y: 320, width: 48, height: 16, sliceX: 3,
            anims: { bite: { from: 0, to: 2, speed: 18, loop: false } },
        },

        // ---- items / hud ----
        coin: {
            x: 288, y: 272, width: 32, height: 8, sliceX: 4,
            anims: { spin: { from: 0, to: 3, speed: 8, loop: true } },
        },
        health: { x: 288, y: 256, width: 48, height: 16, sliceX: 3 },
        flask_red: { x: 288, y: 224, width: 16, height: 16 },
        skull: { x: 288, y: 320, width: 16, height: 16 },
        arrow_button: { x: 288, y: 336, width: 64, height: 16, sliceX: 4 },
        arrow_button_action: { x: 288, y: 352, width: 64, height: 16, sliceX: 4 },
        interact_button: { x: 288, y: 368, width: 32, height: 16, sliceX: 2 },

        // ---- fixtures ----
        spikes: { x: 16, y: 176, width: 64, height: 16, sliceX: 4 },
        lever: { x: 80, y: 192, width: 32, height: 16, sliceX: 2 },
        lava_fountain: {
            x: 64, y: 0, width: 48, height: 48, sliceX: 3,
            anims: { flow: { from: 0, to: 2, speed: 7, loop: true } },
        },
        door: {
            x: 32, y: 208, width: 64, height: 48, sliceX: 2,
            anims: { open: { from: 0, to: 1, loop: false }, close: { from: 1, to: 0, loop: false } },
        },
        banner_red: { x: 16, y: 32, width: 16, height: 16 },
        banner_blue: { x: 32, y: 32, width: 16, height: 16 },
        banner_green: { x: 16, y: 48, width: 16, height: 16 },
        banner_yellow: { x: 32, y: 48, width: 16, height: 16 },

        // ---- tiles ----
        floor: { x: 16, y: 64, width: 48, height: 48, sliceX: 3, sliceY: 3 },
        wall: { x: 16, y: 16, width: 16, height: 16 },
        wall_top: { x: 16, y: 0, width: 16, height: 16 },
        wall_left: { x: 16, y: 128, width: 16, height: 16 },
        wall_right: { x: 0, y: 128, width: 16, height: 16 },
        wall_topleft: { x: 32, y: 128, width: 16, height: 16 },
        wall_topright: { x: 48, y: 128, width: 16, height: 16 },
        wall_botleft: { x: 32, y: 144, width: 16, height: 16 },
        wall_botright: { x: 48, y: 144, width: 16, height: 16 },
    });
}
