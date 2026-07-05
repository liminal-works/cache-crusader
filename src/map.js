// Dungeon layout. Rooms and corridors are floor rectangles; walls are
// derived automatically from the floor plan so the map is easy to remix.
//
//   [trackable cell]                  [win alcove]
//   [ R4 shop ]--[ R5 gauntlet ]--[ R6 vault ]
//        |                              |
//   [ R1 entry ]--[ R2 decoys  ]--[ R3 plaza ]

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
    { x: 17, y: 11, w: 3, h: 2 },   // shop -> gauntlet
    { x: 32, y: 11, w: 2, h: 2 },   // gauntlet -> vault
    { x: 39, y: 17, w: 2, h: 12 },  // plaza -> vault
    { x: 38, y: 5, w: 2, h: 3 },    // vault -> win alcove (final door here)
];

export const MAP_W = 49;
export const MAP_H = 42;

// Derive wall tiles from the floor plan. For every non-floor cell touching
// floor: floor below => wall face (w) with cap (t) above; floor above =>
// cap (t) with face (w) below; floor beside => thin side walls (l/r);
// diagonal-only contact => corner pieces.
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
    const grid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(" "));
    const floorGrid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(" "));

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (F(x, y)) {
                floorGrid[y][x] = ".";
                continue;
            }
            const n = F(x, y - 1), s = F(x, y + 1), e = F(x + 1, y), w = F(x - 1, y);
            if (s) grid[y][x] = "w";
            else if (n) grid[y][x] = "t";
            else if (e) grid[y][x] = "l";
            else if (w) grid[y][x] = "r";
            else if (F(x + 1, y + 1)) grid[y][x] = "c";
            else if (F(x - 1, y + 1)) grid[y][x] = "d";
            else if (F(x + 1, y - 1)) grid[y][x] = "a";
            else if (F(x - 1, y - 1)) grid[y][x] = "b";
        }
    }

    // second pass: give every north-facing face a cap above, and every
    // south cap a face below, so walls read with the right depth
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (grid[y][x] === "w" && y > 0 && grid[y - 1][x] === " " && !F(x, y - 1)) {
                grid[y - 1][x] = "t";
            }
            if (grid[y][x] === "t" && !F(x, y - 1) && y + 1 < MAP_H && grid[y + 1][x] === " " && !F(x, y + 1)) {
                grid[y + 1][x] = "w";
            }
        }
    }

    return {
        floorRows: floorGrid.map((r) => r.join("")),
        wallRows: grid.map((r) => r.join("")),
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
