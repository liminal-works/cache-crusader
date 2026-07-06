// Input: WASD/arrows + E/space on desktop, on-screen d-pad + action button
// on touch devices. Touch uses raw multi-touch tracking (id -> button) so
// walking diagonally-ish while tapping interact actually works — the
// prototype's hover-based buttons couldn't do that.

import { isDialogOpen, dialogJustClosed } from "./dialog.js";

const ARROW_FRAMES = { up: 0, down: 1, right: 2, left: 3 };

export function createControls() {
    // built lazily: kaboom globals don't exist at module-eval time
    const DIRS = {
        up: vec2(0, -1),
        down: vec2(0, 1),
        left: vec2(-1, 0),
        right: vec2(1, 0),
    };

    const interactFns = [];
    const held = new Map(); // touch id (or "mouse") -> button name
    let usable = false;

    const showTouch = isTouchscreen();
    const btns = {};
    let interactBtn = null;

    if (showTouch) {
        const mk = (name, x, y) => {
            btns[name] = add([
                sprite("arrow_button", { frame: ARROW_FRAMES[name] }),
                scale(2),
                pos(x, y),
                anchor("center"),
                fixed(),
                z(4000),
                opacity(0.85),
            ]);
        };
        mk("up", 46, height() - 66);
        mk("down", 46, height() - 16);
        mk("left", 20, height() - 41);
        mk("right", 72, height() - 41);

        interactBtn = add([
            sprite("interact_button", { frame: 0 }),
            scale(2.4),
            pos(width() - 34, height() - 40),
            anchor("center"),
            fixed(),
            z(4000),
            opacity(0.85),
        ]);
    }

    // kaboom hands touch positions in raw window coords; map them into the
    // 256x256 letterboxed game viewport
    function windowToGame(p) {
        const r = document.querySelector("#game canvas").getBoundingClientRect();
        const s = Math.min(r.width / width(), r.height / height());
        const ox = r.x + (r.width - width() * s) / 2;
        const oy = r.y + (r.height - height() * s) / 2;
        return vec2((p.x - ox) / s, (p.y - oy) / s);
    }

    function buttonAt(p) {
        for (const [name, b] of Object.entries(btns)) {
            if (Math.abs(p.x - b.pos.x) <= 20 && Math.abs(p.y - b.pos.y) <= 20) return name;
        }
        if (interactBtn
            && Math.abs(p.x - interactBtn.pos.x) <= 24
            && Math.abs(p.y - interactBtn.pos.y) <= 24) return "interact";
        return null;
    }

    function refreshSprites() {
        const active = new Set(held.values());
        for (const [name, b] of Object.entries(btns)) {
            b.use(sprite(active.has(name) ? "arrow_button_action" : "arrow_button", { frame: ARROW_FRAMES[name] }));
        }
    }

    function press(id, p) {
        const name = buttonAt(p);
        if (!name) return;
        if (name === "interact") {
            fireInteract();
            if (interactBtn) {
                interactBtn.frame = 1;
                wait(0.12, () => { if (interactBtn.exists()) interactBtn.frame = 0; });
            }
            return;
        }
        held.set(id, name);
        refreshSprites();
    }

    function release(id) {
        if (held.delete(id)) refreshSprites();
    }

    if (showTouch) {
        onTouchStart((p, t) => press(t.identifier, windowToGame(p)));
        onTouchMove((p, t) => {
            // sliding a thumb across the d-pad re-targets the direction
            const name = buttonAt(windowToGame(p));
            if (name && name !== "interact" && held.get(t.identifier) !== name) {
                held.set(t.identifier, name);
                refreshSprites();
            }
        });
        onTouchEnd((p, t) => release(t.identifier));
        window.addEventListener("blur", () => { held.clear(); refreshSprites(); }, { passive: true });
    }

    function fireInteract() {
        // dialogJustClosed: the same tap that dismissed a dialog box must
        // not immediately re-interact with whatever is in front of us
        if (isDialogOpen() || dialogJustClosed()) return;
        interactFns.forEach((fn) => fn());
    }

    onKeyPress("space", fireInteract);
    onKeyPress("e", fireInteract);

    return {
        // current movement vector (zero while dialog is up)
        dir() {
            if (isDialogOpen()) return vec2(0, 0);
            let v = vec2(0, 0);
            for (const name of held.values()) v = v.add(DIRS[name]);
            if (isKeyDown("a") || isKeyDown("left")) v = v.add(DIRS.left);
            if (isKeyDown("d") || isKeyDown("right")) v = v.add(DIRS.right);
            if (isKeyDown("w") || isKeyDown("up")) v = v.add(DIRS.up);
            if (isKeyDown("s") || isKeyDown("down")) v = v.add(DIRS.down);
            return v.len() > 0 ? v.unit() : v;
        },

        onInteract(fn) {
            interactFns.push(fn);
        },

        // pulse the action button when something is in range
        setUsable(b) {
            usable = b;
            if (interactBtn) {
                interactBtn.opacity = b ? 1 : 0.55;
                interactBtn.scale = vec2(b ? 2.4 + 0.15 * Math.sin(time() * 8) : 2.4);
            }
        },
    };
}
