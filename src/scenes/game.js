// The dungeon. Everything the QR code promised: decoys, muggles, a cocky
// wizard, a useless trackable, and five coordinate fragments.

import { CACHE_CONFIG } from "../../config.js";
import { decodeCoords } from "../coords.js";
import { buildGrids, ROOMS, TILE, at, roomBoundsPx, MAP_W, MAP_H } from "../map.js";
import { say, isDialogOpen } from "../dialog.js";
import { createControls } from "../controls.js";
import { createHUD } from "../hud.js";
import { sfx } from "../sfx.js";

const SPEED = 90;
const SUS_RADIUS = 42;

let seenIntro = false;

const WIZARD_HINTS = [
    "Try looking where it is, not where it isn't.",
    "It's at eye level. Whose eyes? Great question.",
    "You won't need a flashlight. You'll need to BELIEVE.",
    "It's under a pile of sticks. Everything is under a pile of sticks.",
    "The final is near some trees. Or was it rocks.",
    "I rate this hint one star. The difficulty, five.",
    "Check the obvious spot. No, the OTHER obvious spot.",
    "It's magnetic. Wait, no, that was the tin you came from.",
];

const FRAG_FLAVOR = [
    "One down. Not just another tin after all, huh.",
    "Hidden among the decoys. Sneaky CO.",
    "Snagged in broad daylight. The muggles suspect nothing.",
    "Worth every spike.",
    "The vault yields. The final door awaits.",
];

export function registerGameScene() {
    scene("game", () => {
        // ---------- run state ----------
        const state = {
            coins: 0,
            hearts: 6,
            maxHearts: 6,
            frags: [null, null, null, null, null],
            fragCount: 0,
            suspicion: 0,
            hasTrackable: false,
            decoyBites: 0,
            deaths: 0,
            startTime: time(),
            metMuggle: false,
            metDecoy: false,
        };

        // ---------- world ----------
        const { floorRows, wallRows } = buildGrids();

        addLevel(floorRows, {
            tileWidth: TILE,
            tileHeight: TILE,
            tiles: { ".": () => [sprite("floor", { frame: ~~rand(0, 8) }), z(-100)] },
        });

        const solid = () => [body({ isStatic: true }), tile({ isObstacle: true })];
        addLevel(wallRows, {
            tileWidth: TILE,
            tileHeight: TILE,
            tiles: {
                "w": (p) => [sprite("wall"), area(), ...solid(), z(p ? p.y * TILE : 0)],
                "t": () => [sprite("wall_top"), area({ shape: new Rect(vec2(0, 12), 16, 4) }), ...solid(), z(1)],
                "l": () => [sprite("wall_left"), area({ shape: new Rect(vec2(0, 0), 6, 16) }), ...solid(), z(1)],
                "r": () => [sprite("wall_right"), area({ shape: new Rect(vec2(10, 0), 6, 16) }), ...solid(), z(1)],
                "c": () => [sprite("wall_topleft"), area(), ...solid(), z(1)],
                "d": () => [sprite("wall_topright"), area(), ...solid(), z(1)],
                "a": () => [sprite("wall_botleft"), area(), ...solid(), z(1)],
                "b": () => [sprite("wall_botright"), area(), ...solid(), z(1)],
            },
        });

        // ---------- player ----------
        const spawnPoint = at(5, 33);
        const player = add([
            sprite("hero", { anim: "idle" }),
            pos(spawnPoint),
            area({ shape: new Rect(vec2(0, 6), 12, 12) }),
            body(),
            anchor("center"),
            z(5),
            "player",
            { invuln: false },
        ]);

        const controls = createControls();
        const hud = createHUD(state);

        // ---------- interaction registry ----------
        const interactables = [];
        function makeInteract(obj, fn, opts = {}) {
            interactables.push({
                obj,
                fn,
                radius: opts.radius ?? 22,
                point: opts.point ?? (() => obj.pos),
                enabled: opts.enabled ?? (() => true),
            });
        }

        function nearestInteractable() {
            let best = null;
            let bestD = Infinity;
            for (const it of interactables) {
                if (!it.obj.exists() || !it.enabled()) continue;
                const d = player.pos.dist(it.point());
                if (d < it.radius && d < bestD) {
                    best = it;
                    bestD = d;
                }
            }
            return best;
        }

        controls.onInteract(() => {
            const it = nearestInteractable();
            if (it) it.fn();
        });

        // ---------- damage / death ----------
        function damage(n) {
            if (player.invuln) return;
            player.invuln = true;
            state.hearts = Math.max(0, state.hearts - n);
            sfx.hurt();
            shake(4);
            player.play("hit");
            let blinks = 0;
            const blinker = loop(0.1, () => {
                player.opacity = player.opacity === 1 ? 0.3 : 1;
                if (++blinks >= 10) {
                    blinker.cancel();
                    player.opacity = 1;
                    player.invuln = false;
                }
            });
            wait(0.25, () => { if (player.exists()) player.play("idle"); });
            if (state.hearts <= 0) die();
        }

        function die() {
            state.deaths++;
            state.hearts = state.maxHearts;
            state.suspicion = 0;
            player.pos = spawnPoint.clone();
            say({
                who: "CHERUB",
                text: "Ouch. Back to the entrance with you. Your fragments are safe -- the muggles only take hearts.",
            });
        }

        // ---------- fragments ----------
        function collectFragment(idx) {
            const frag = decodeCoords(CACHE_CONFIG.encodedCoords)[idx] ?? "???";
            state.frags[idx] = frag;
            state.fragCount++;
            sfx.fragment();
            say([
                { who: `FRAGMENT ${state.fragCount}/5`, text: `"${frag}"` },
                { who: "CHERUB", text: FRAG_FLAVOR[idx] },
            ]);
        }

        // real fragment container (green ammo can)
        function addFragmentCan(idx, tx, ty) {
            const can = add([
                sprite("can"),
                pos(at(tx, ty)),
                anchor("center"),
                area(),
                body({ isStatic: true }),
                z(ty * TILE),
                { opened: false },
            ]);
            makeInteract(can, () => {
                if (can.opened) return;
                can.opened = true;
                can.play("open");
                sfx.open();
                bumpSuspicionForInteract();
                wait(0.3, () => collectFragment(idx));
            });
            return can;
        }

        // decoy container: looks identical until it bites
        function addDecoyCan(tx, ty) {
            const can = add([
                sprite("can"),
                pos(at(tx, ty)),
                anchor("center"),
                area(),
                body({ isStatic: true }),
                z(ty * TILE),
                { revealed: false },
            ]);
            makeInteract(can, () => {
                can.use(sprite("mimic"));
                can.play("bite");
                sfx.bite();
                state.decoyBites++;
                damage(1);
                bumpSuspicionForInteract();
                if (!state.metDecoy) {
                    state.metDecoy = true;
                    say([
                        { who: "???", text: "CHOMP." },
                        { who: "CHERUB", text: "A DECOY! The oldest trick in the book. The real container is around here somewhere. Probably." },
                    ]);
                } else {
                    floatText(can.pos.add(0, -14), "DECOY!", rgb(255, 90, 90));
                }
                can.revealed = true;
            });
            return can;
        }

        // gold chest with geocoins
        function addCoinChest(tx, ty, amount = 5) {
            const chest = add([
                sprite("chest"),
                pos(at(tx, ty)),
                anchor("center"),
                area(),
                body({ isStatic: true }),
                z(ty * TILE),
                { opened: false },
            ]);
            makeInteract(chest, () => {
                if (chest.opened) return;
                chest.opened = true;
                chest.play("open");
                sfx.open();
                bumpSuspicionForInteract();
                for (let i = 0; i < amount; i++) {
                    wait(0.1 + i * 0.09, () => {
                        const c = add([
                            sprite("coin", { anim: "spin" }),
                            pos(chest.pos.add(rand(-10, 10), rand(-14, -4))),
                            anchor("center"),
                            z(500),
                        ]);
                        tween(c.pos, player.pos, 0.35, (p) => c.pos = p, easings.easeInQuad).then(() => {
                            destroy(c);
                            state.coins++;
                            sfx.coin();
                        });
                    });
                }
            });
        }

        function addCoin(tx, ty) {
            const c = add([
                sprite("coin", { anim: "spin" }),
                pos(at(tx, ty)),
                anchor("center"),
                area({ shape: new Rect(vec2(-5, -5), 10, 10) }),
                z(2),
                "coin",
            ]);
            c.onCollide("player", () => {
                destroy(c);
                state.coins++;
                sfx.coin();
            });
        }

        function floatText(p, str, col = rgb(255, 255, 255)) {
            const t = add([
                text(str, { size: 8, font: "unscii" }),
                pos(p),
                anchor("center"),
                color(col),
                z(2000),
                opacity(1),
            ]);
            tween(p.y, p.y - 18, 0.9, (y) => t.pos.y = y);
            tween(1, 0, 0.9, (o) => t.opacity = o).then(() => destroy(t));
        }

        // ---------- doors ----------
        function addDoor(tx, ty, opts = {}) {
            // the sprite is just scenery — an invisible blocker on the
            // throat row does the actual blocking, and opening the door
            // simply removes it
            const blocker = add([
                rect(32, TILE),
                pos(tx * TILE, (ty - 1) * TILE),
                area(),
                body({ isStatic: true }),
                opacity(0),
            ]);
            const door = add([
                sprite("door", { frame: 0 }),
                pos(tx * TILE, ty * TILE),
                anchor("botleft"),
                z(ty * TILE),
                "door",
                {
                    opened: false,
                    locked: opts.locked ?? false,
                    setOpen(state_) {
                        this.opened = state_;
                        this.play(state_ ? "open" : "close");
                        if (state_ && blocker.exists()) destroy(blocker);
                    },
                },
            ]);
            if (opts.interactive ?? true) {
                makeInteract(door, () => {
                    if (door.locked) {
                        if (opts.onLocked) opts.onLocked(door);
                        return;
                    }
                    if (!door.opened) {
                        door.setOpen(true);
                        sfx.door();
                    }
                }, {
                    radius: 26,
                    point: () => door.pos.add(16, -8),
                });
            }
            return door;
        }

        // ---------- fixtures ----------
        function addSpikes(tx, ty, phase = 0) {
            const s = add([
                sprite("spikes", { frame: 0 }),
                pos(tx * TILE, ty * TILE),
                z(-50),
            ]);
            s.onUpdate(() => {
                const t = (time() + phase) % 2.1;
                s.frame = t < 1.2 ? 0 : t < 1.45 ? 1 : t < 1.85 ? 3 : 1;
                if (s.frame === 3 && !player.invuln) {
                    const c = s.pos.add(8, 8);
                    if (Math.abs(player.pos.x - c.x) < 9 && Math.abs(player.pos.y + 6 - c.y) < 9) {
                        damage(1);
                    }
                }
            });
        }

        function addFountain(tx, ty) {
            add([
                sprite("lava_fountain", { anim: "flow" }),
                pos(tx * TILE, ty * TILE),
                area({ shape: new Rect(vec2(0, 32), 16, 16) }),
                body({ isStatic: true }),
                z(ty * TILE + 32),
            ]);
        }

        function addBanner(kind, tx, ty) {
            add([sprite(kind), pos(tx * TILE, ty * TILE), z(2)]);
        }

        // ---------- muggles ----------
        const muggles = [];
        function addMuggle(kind, room, tx, ty, speed = 26) {
            const big = kind === "ogre";
            const m = add([
                sprite(kind, { anim: "idle" }),
                pos(at(tx, ty)),
                anchor("center"),
                area({ shape: new Rect(vec2(0, big ? 8 : 6), big ? 16 : 12, 10) }),
                body(),
                z(5),
                "muggle",
                { wanderVel: vec2(0, 0), wanderT: rand(0.5, 1.5) },
            ]);
            m.add([
                text("muggle", { size: 8, font: "unscii" }),
                anchor("center"),
                pos(0, big ? -26 : -22),
                color(200, 200, 210),
                opacity(0.7),
            ]);
            const mark = m.add([
                text("!", { size: 8, font: "unscii" }),
                anchor("center"),
                pos(0, big ? -36 : -32),
                color(255, 90, 90),
                opacity(0),
            ]);
            const b = roomBoundsPx(room);
            m.onUpdate(() => {
                if (isDialogOpen()) return;
                m.wanderT -= dt();
                if (m.wanderT <= 0) {
                    if (m.wanderVel.len() > 0) {
                        m.wanderVel = vec2(0, 0);
                        m.wanderT = rand(0.6, 1.8);
                        m.play("idle");
                    } else {
                        const dir = choose([vec2(1, 0), vec2(-1, 0), vec2(0, 1), vec2(0, -1), vec2(1, 1).unit(), vec2(-1, -1).unit()]);
                        m.wanderVel = dir.scale(speed);
                        m.wanderT = rand(0.7, 1.6);
                        m.play("run");
                        m.flipX = dir.x < 0;
                    }
                }
                if (m.wanderVel.len() > 0) {
                    m.move(m.wanderVel);
                    m.pos.x = clamp(m.pos.x, b.x0 + 14, b.x1 - 14);
                    m.pos.y = clamp(m.pos.y, b.y0 + 14, b.y1 - 10);
                }
                mark.opacity = player.pos.dist(m.pos) < SUS_RADIUS ? 1 : 0;
            });
            muggles.push(m);
        }

        function muggleNearby() {
            return muggles.some((m) => m.exists() && player.pos.dist(m.pos) < SUS_RADIUS);
        }

        function bumpSuspicionForInteract() {
            if (muggleNearby()) {
                state.suspicion = Math.min(1, state.suspicion + 0.34);
                floatText(player.pos.add(0, -20), "so sus...", rgb(255, 160, 80));
            }
        }

        onUpdate(() => {
            if (isDialogOpen()) return;
            if (muggleNearby()) {
                state.suspicion = Math.min(1, state.suspicion + dt() * 0.15);
            } else {
                state.suspicion = Math.max(0, state.suspicion - dt() * 0.12);
            }
            if (state.suspicion >= 1) {
                state.suspicion = 0.35;
                sfx.alarm();
                damage(1);
                if (!state.metMuggle) {
                    state.metMuggle = true;
                    say([
                        { who: "MUGGLE", text: "Whatcha lookin' for? A geo-what? Is it treasure? Can I help? What's in the can?" },
                        { who: "CHERUB", text: "You were COMPROMISED! Muggles cost you a heart. Keep your distance and don't open containers in front of them." },
                    ]);
                } else {
                    floatText(player.pos.add(0, -20), "COMPROMISED!", rgb(255, 90, 90));
                }
            }
        });

        // ---------- wizard ----------
        let hintDeck = [];
        function nextHint() {
            if (hintDeck.length === 0) {
                hintDeck = [...WIZARD_HINTS];
                for (let i = hintDeck.length - 1; i > 0; i--) {
                    const j = ~~rand(0, i + 1);
                    [hintDeck[i], hintDeck[j]] = [hintDeck[j], hintDeck[i]];
                }
            }
            return hintDeck.pop();
        }

        function addWizard(tx, ty) {
            const w = add([
                sprite("wizard", { anim: "idle" }),
                pos(at(tx, ty)),
                anchor("center"),
                area({ shape: new Rect(vec2(0, 6), 12, 12) }),
                body({ isStatic: true }),
                z(5),
            ]);
            w.add([
                text("wizard", { size: 8, font: "unscii" }),
                anchor("center"),
                pos(0, -22),
                color(160, 160, 255),
                opacity(0.8),
            ]);
            makeInteract(w, () => {
                w.flipX = player.pos.x < w.pos.x;
                const lines = [];
                if (state.hearts >= state.maxHearts) {
                    lines.push({ who: "WIZARD", text: "You're at full health. Save your geocoins for the gift shop." });
                } else if (state.coins >= 5) {
                    state.coins -= 5;
                    state.hearts = state.maxHearts;
                    sfx.potion();
                    const flask = add([
                        sprite("flask_red"),
                        pos(player.pos.add(0, -18)),
                        anchor("center"),
                        z(2000),
                    ]);
                    tween(flask.pos.y, flask.pos.y - 14, 0.7, (y) => flask.pos.y = y).then(() => destroy(flask));
                    lines.push({ who: "WIZARD", text: "One healing potion, five geocoins. *poof* Pleasure doing business. You looked terrible, by the way." });
                } else {
                    lines.push({ who: "WIZARD", text: "Potions cost 5 geocoins. I don't do IOUs. Or refunds." });
                }
                lines.push({ who: "WIZARD", text: "HINT: " + nextHint() });
                say(lines);
            }, { radius: 24 });
        }

        // ---------- cache-asaur ----------
        const SAUR_LINES = [
            "Lifeline?",
            "Lifeline?? ...The wizard. He sells potions. THAT'S the lifeline.",
            "I've DNF'd this dungeon four times. It's rated 1.5/1.5. Allegedly.",
            "You found the tin and thought it was over? Classic.",
            "If a green can has teeth, that's not a can. Learned that the hard way.",
        ];
        function addCachesaur(tx, ty) {
            const c = add([
                sprite("cachesaur", { anim: "idle" }),
                pos(at(tx, ty)),
                anchor("center"),
                area({ shape: new Rect(vec2(0, 6), 12, 12) }),
                body({ isStatic: true }),
                z(5),
            ]);
            c.add([
                text("cache-asaur", { size: 8, font: "unscii" }),
                anchor("center"),
                pos(0, -22),
                color(120, 255, 180),
                opacity(0.8),
            ]);
            let i = 0;
            makeInteract(c, () => {
                c.flipX = player.pos.x < c.pos.x;
                say({ who: "CACHE-ASAUR", text: SAUR_LINES[i % SAUR_LINES.length] });
                i++;
            }, { radius: 24 });
        }

        // ---------- trackable (rescued via lever, then 100% useless) ----------
        const trail = [];
        function addTrackableCell() {
            const imp = add([
                sprite("trackable", { anim: "idle" }),
                pos(at(12, 4).add(8, 0)),
                anchor("center"),
                z(5),
                { rescued: false },
            ]);
            const tag = imp.add([
                text("TB-U5LE55", { size: 8, font: "unscii" }),
                anchor("center"),
                pos(0, -14),
                color(255, 190, 120),
                opacity(0.8),
            ]);

            const cellDoor = addDoor(12, 8, { locked: true, interactive: false });

            const lever = add([
                sprite("lever", { frame: 0 }),
                pos(at(15, 8)),
                anchor("center"),
                z(3),
                { pulled: false },
            ]);
            makeInteract(lever, () => {
                if (lever.pulled) return;
                lever.pulled = true;
                lever.frame = 1;
                sfx.lever();
                cellDoor.locked = false;
                cellDoor.setOpen(true);
                sfx.door();
                imp.rescued = true;
                state.hasTrackable = true;
                imp.play("run");
                tween(imp.pos, at(13, 9), 0.9, (p) => imp.pos = p).then(() => {
                    imp.play("idle");
                    say([
                        { who: "???", text: "You rescued a TRACKABLE! (code: TB-U5LE55)" },
                        { who: "TRACKABLE", text: "It vows to accompany you on your noble quest!" },
                        { who: "TRACKABLE", text: "...It is completely useless." },
                        { who: "CHERUB", text: "Its goal is to visit Ohio. It has been in this dungeon for six years." },
                    ]);
                });
            }, { radius: 20 });

            const USELESS = [
                "It stares at you. Uselessly.",
                "It is thinking about Ohio.",
                "It contributes nothing. It's doing great.",
                "You could log it online. It would not care.",
            ];
            let ui = 0;
            makeInteract(imp, () => {
                say({ who: "TRACKABLE", text: USELESS[ui % USELESS.length] });
                ui++;
            }, { radius: 18, enabled: () => imp.rescued });

            // follow the player's breadcrumb trail, contributing nothing
            imp.onUpdate(() => {
                if (!imp.rescued || isDialogOpen()) return;
                const target = trail.length > 26 ? trail[trail.length - 26] : null;
                if (target && imp.pos.dist(target) > 3) {
                    const d = target.sub(imp.pos);
                    imp.pos = imp.pos.add(d.scale(Math.min(1, dt() * 8)));
                    imp.flipX = d.x < 0;
                    if (imp.curAnim() !== "run") imp.play("run");
                } else if (imp.curAnim() !== "idle") {
                    imp.play("idle");
                }
            });
        }

        // ---------- cherub ----------
        function addCherub(tx, ty) {
            const ch = add([
                sprite("cherub", { anim: "idle" }),
                pos(at(tx, ty)),
                anchor("center"),
                z(5),
                { baseY: ty * TILE + 8 },
            ]);
            ch.onUpdate(() => {
                ch.pos.y = ch.baseY + Math.sin(time() * 3) * 2;
            });
            makeInteract(ch, () => {
                const n = 5 - state.fragCount;
                say({
                    who: "CHERUB",
                    text: n > 0
                        ? `${n} fragment${n === 1 ? "" : "s"} to go. The final door is in the far northeast. I'm still not coming.`
                        : "You have all five! The final door, northeast. Go! Sign! Log!",
                });
            }, { radius: 20 });
            return ch;
        }

        // ---------- populate the dungeon ----------
        const R = ROOMS;

        // entry room
        const cherub = addCherub(8, 31);
        addFragmentCan(0, 14, 30);
        addCoin(6, 36);
        addCoin(12, 33);
        addCoin(15, 35);
        addMuggle("muggle_f", R.entry, 11, 35);
        addDoor(9, 29); // tutorial door into the north corridor
        addBanner("banner_green", 7, 28);
        addBanner("banner_yellow", 12, 28);

        // decoy gallery
        addDecoyCan(22, 30);
        addDecoyCan(25, 33);
        addFragmentCan(1, 28, 30);
        addDecoyCan(30, 34);
        addDecoyCan(23, 36);
        addCoin(27, 36);
        addBanner("banner_red", 24, 28);
        addBanner("banner_red", 28, 28);

        // muggle plaza
        addFragmentCan(2, 40, 33);
        addMuggle("muggle_m", R.plaza, 37, 31);
        addMuggle("muggle_f", R.plaza, 42, 35);
        addMuggle("ogre", R.plaza, 40, 36, 18);
        addCoin(36, 30);
        addCoin(44, 30);
        addCoin(36, 36);
        addCoin(44, 36);

        // shop
        addWizard(6, 9);
        addCachesaur(9, 12);
        addCoinChest(15, 9, 5);
        addTrackableCell();
        addBanner("banner_blue", 5, 7);
        addBanner("banner_blue", 8, 7);

        // gauntlet
        addFountain(23, 5);
        addFountain(28, 5);
        for (let i = 0; i < 3; i++) {
            addSpikes(23 + i * 3, 9, i * 0.5);
            addSpikes(23 + i * 3, 11, 1.0 + i * 0.5);
            addSpikes(23 + i * 3, 13, 0.4 + i * 0.7);
        }
        addFragmentCan(3, 31, 12);
        addCoin(21, 15);
        addCoin(31, 15);

        // vault
        addDecoyCan(38, 12);
        addFragmentCan(4, 40, 12);
        addDecoyCan(42, 12);
        addMuggle("muggle_m", R.vault, 40, 14);
        addBanner("banner_red", 37, 7);
        addBanner("banner_red", 41, 7);

        // final door + the true cache
        addDoor(38, 8, {
            locked: true,
            onLocked(door) {
                if (state.fragCount >= 5) {
                    door.locked = false;
                    door.setOpen(true);
                    sfx.door();
                    say({ who: "CHERUB", text: "The way is open. The TRUE cache awaits." });
                } else {
                    const n = 5 - state.fragCount;
                    say({ who: "???", text: `SEALED. The door hungers for ${n} more fragment${n === 1 ? "" : "s"}.` });
                }
            },
        });

        const finalCan = add([
            sprite("can"),
            pos(at(39, 2).add(8, 0)),
            anchor("center"),
            scale(1.5),
            area(),
            body({ isStatic: true }),
            z(40),
            { opened: false },
        ]);
        makeInteract(finalCan, () => {
            if (finalCan.opened) return;
            finalCan.opened = true;
            finalCan.play("open");
            sfx.win();
            wait(0.6, () => {
                go("win", {
                    frags: state.frags,
                    seconds: Math.floor(time() - state.startTime),
                    decoyBites: state.decoyBites,
                    deaths: state.deaths,
                    coins: state.coins,
                    hasTrackable: state.hasTrackable,
                });
            });
        }, { radius: 26 });

        // ---------- movement & camera ----------
        onUpdate(() => {
            const v = controls.dir();
            if (v.len() > 0) {
                if (v.x < 0) player.flipX = true;
                if (v.x > 0) player.flipX = false;
                player.move(v.scale(SPEED));
                if (player.curAnim() !== "run" && !player.invuln) player.play("run");
            } else if (player.curAnim() !== "idle" && !player.invuln) {
                player.play("idle");
            }

            player.z = player.pos.y;

            trail.push(player.pos.clone());
            if (trail.length > 120) trail.shift();

            if (!window.__DEBUG?.freecam) {
                camPos(vec2(
                    clamp(player.pos.x, width() / 2, MAP_W * TILE - width() / 2),
                    clamp(player.pos.y, height() / 2, MAP_H * TILE - height() / 2),
                ));
            }

            controls.setUsable(nearestInteractable() !== null);
            hud.update();
        });

        // dev-only hooks for automated testing (opt-in via ?debug=1)
        if (new URLSearchParams(location.search).has("debug")) {
            window.__DEBUG = {
                state,
                player,
                freecam: false,
                teleport: (tx, ty) => { player.pos = at(tx, ty); },
            };
        }

        // ---------- intro ----------
        if (!seenIntro) {
            seenIntro = true;
            wait(0.4, () => {
                say([
                    { who: "CHERUB", text: "Congratulations, adventurer! You have found the ancient relic!" },
                    { who: "CHERUB", text: "...What? You thought this was JUST ANOTHER TIN?" },
                    { who: "CHERUB", text: "Oh, sweet summer cacher. The log you seek lies deeper." },
                    { who: "CHERUB", text: "FIVE coordinate fragments are hidden in these halls, guarded by decoys and... worse. MUGGLES." },
                    { who: "CHERUB", text: "Open the green cans. Mind the teeth. Act natural around muggles." },
                    { who: "CHERUB", text: "Off you go, CACHE CRUSADER! I'll wait here. I don't do dungeons." },
                ]);
            });
        }
    });
}
