// ============================================================
//  CACHE OWNER CONFIG — this is the only file you need to edit
// ============================================================
//
// encodedCoords holds the 5 coordinate fragments the player earns
// in-game, XOR+base64 encoded so they don't show up in View Source.
//
// To set your own final coordinates:
//   node tools/encode.mjs "N 47 38.938|W 122 20.887|THESE ARE|PLACEHOLDER|COORDS, CO!"
// ...then paste the output below. Exactly 5 fragments, ASCII only
// (no ° symbol — the pixel font can't draw it).
//
// Fragments don't have to all be numbers — the last one is a great
// spot for a hint or a "GO SIGN IT!".

export const CACHE_CONFIG = {
    cacheName: "Just Another Tin",

    // Placeholder points at Geocaching HQ and literally spells out
    // "THESE ARE PLACEHOLDER COORDS, CO!" — change it before publishing.
    encodedCoords: "GmZgdA15bX1tHnkyGHR5d2ANZnlgbH5jP3kCEAARDQAcCigYCRNuEQEBGAIREVEJGhwGaRJibxcHZA==",
};
