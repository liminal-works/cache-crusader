#!/usr/bin/env node
// Cache owner tool: encode your final coordinates for config.js
//
// Usage:
//   node tools/encode.mjs "N 47 38.938|W 122 20.887|NEAR THE BIG|OAK STUMP|GO SIGN IT!"
//
// The string is split on "|" into exactly 5 fragments — one per fragment
// container in the dungeon. Keep every character plain ASCII (the bitmap
// font has no ° symbol — write N 47 38.938, not N 47° 38.938').
// Paste the output into config.js as encodedCoords.

import { encodeCoords, decodeCoords } from "../src/coords.js";

const plain = process.argv[2];
if (!plain) {
    console.error('Usage: node tools/encode.mjs "FRAG1|FRAG2|FRAG3|FRAG4|FRAG5"');
    process.exit(1);
}

const frags = plain.split("|");
if (frags.length !== 5) {
    console.error(`Expected 5 fragments separated by "|", got ${frags.length}.`);
    process.exit(1);
}
if (/[^\x20-\x7e|]/.test(plain)) {
    console.error("Non-ASCII character found — the in-game font can't draw it. Use plain letters/digits only.");
    process.exit(1);
}

const blob = encodeCoords(plain);
console.log("\nPaste this into config.js:\n");
console.log(`    encodedCoords: "${blob}",\n`);
console.log("Sanity check (decodes back to):");
decodeCoords(blob).forEach((f, i) => console.log(`  fragment ${i + 1}: ${f}`));
