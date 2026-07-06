// Dungeon layout. Rooms and corridors are floor rectangles; walls are
// derived automatically from the floor plan so the map is easy to remix.
//
//   [trackable cell]                [win alcove]
//   [ R4 shop ]--[ R5 gauntlet ]   [ R6 vault ]
//        |                              |
//   [ R1 entry ]--[ R2 decoys  ]--[ R3 plaza ]
//
// The gauntlet (fragment 4) hangs off the shop on purpose: the only way
// to reach it is straight past the wizard and the trackable's cell.

export const TILE = 16;

export const ROOMS = {
    entry: { x: 3, y: 29, w: 14, h: 9 },
    decoys: { x: 20, y: 29, w: 12, h: 9 },
    plaza: { x: 34, y: 29, w: 12, h: 9 },
    shop: { x: 3, y: 8, w: 14, h: 9 },
    gauntlet: { x: 20, y: 8, w: 12, h: 9 },
    vault: { x: 34, y: 8, w: 12, h: 9 },
    cell: { x: 12, y: 6, w: 2, h: 2 },      // trackable jail, opens into shop
    alcove: { x: 37, y: 2, w: 5, h: 3 },    // behind the final door
};

const CORRIDORS = [
    { x: 17, y: 32, w: 3, h: 2 },   // entry -> decoys
    { x: 32, y: 32, w: 2, h: 2 },   // decoys -> plaza
    { x: 9, y: 17, w: 2, h: 12 },   // entry -> shop
    { x: 17, y: 11, w: 3, h: 2 },   // shop -> gauntlet (gauntlet dead-ends here)
    { x: 39, y: 17, w: 2, h: 12 },  // plaza -> vault
    { x: 38, y: 5, w: 2, h: 3 },    // vault -> win alcove (final door here)
];

export const MAP_W = 49;
export const MAP_H = 42;

// Derive walls from the floor plan, 0x72-style: walls are a solid brick
// mass two tiles deep around every floor area, and every boundary between
// brick and not-brick gets a thin trim overlay (the wall_top ledge and
// wall_left/right/corner slivers are mostly-transparent edge sprites).
//   #  brick, fully solid   — wall cell touching floor
//   %  brick, decorative    — outer-ring wall cell (unreachable)
export function buildGrids() {
    const isFloor = new Set();
    const allRects = [...Object.values(ROOMS), ...CORRIDORS];
    for (const r of allRects) {
        for (let y = r.y; y < r.y + r.h; y++) {
            for (let x = r.x; x < r.x + r.w; x++) {
                isFloor.add(x + "," + y);
            }
        }
    }

    const F = (x, y) => isFloor.has(x + "," + y);
    const nearFloor = (x, y, d) => {
        for (let dy = -d; dy <= d; dy++) {
            for (let dx = -d; dx <= d; dx++) {
                if (F(x + dx, y + dy)) return true;
            }
        }
        return false;
    };

    const grid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(" "));
    const floorGrid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(" "));

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (F(x, y)) {
                floorGrid[y][x] = ".";
                continue;
            }
            if (nearFloor(x, y, 1)) grid[y][x] = "#";
            else if (nearFloor(x, y, 2)) grid[y][x] = "%";
        }
    }

    // trim overlays: for every non-brick cell, outline the brick beside it.
    // brick below => bottom ledge (or an L-shaped corner piece when brick
    // is also to the side); brick beside => vertical edge sliver.
    const isWall = (x, y) =>
        x >= 0 && x < MAP_W && y >= 0 && y < MAP_H && grid[y][x] !== " ";
    const overlays = [];
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (grid[y][x] !== " ") continue;
            const s = isWall(x, y + 1);
            const w = isWall(x - 1, y);
            const e = isWall(x + 1, y);
            if (s) overlays.push({ x, y, name: w ? "wall_botleft" : e ? "wall_botright" : "wall_top" });
            if (w && !s) overlays.push({ x, y, name: "wall_left" });
            if (e && !s) overlays.push({ x, y, name: "wall_right" });
        }
    }

    return {
        floorRows: floorGrid.map((r) => r.join("")),
        wallRows: grid.map((r) => r.join("")),
        overlays,
    };
}

// convenience: tile coords -> world px (center of tile)
export function at(tx, ty) {
    return vec2(tx * TILE + TILE / 2, ty * TILE + TILE / 2);
}

export function roomCenter(room) {
    return vec2((room.x + room.w / 2) * TILE, (room.y + room.h / 2) * TILE);
}

export function roomBoundsPx(room) {
    return {
        x0: room.x * TILE, y0: room.y * TILE,
        x1: (room.x + room.w) * TILE, y1: (room.y + room.h) * TILE,
    };
}
