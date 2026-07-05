// Coordinate fragment encoding/decoding.
//
// The final coordinates never appear in the source as plain text — they are
// XOR'd with KEY and base64'd in config.js, and only decoded in memory when
// a fragment is collected. This won't stop a determined cheater with a
// debugger, but it does stop "View Source -> Ctrl+F". If a finder cheats,
// that's between them and their conscience.

const KEY = "TFTC-JUST-ANOTHER-TIN";

function xorWith(str) {
    let out = "";
    for (let i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    return out;
}

// b64 blob -> array of fragment strings (the plaintext is fragments joined by "|")
export function decodeCoords(b64) {
    return xorWith(atob(b64)).split("|");
}

// "frag|frag|frag|frag|frag" -> b64 blob (used by tools/encode.mjs)
export function encodeCoords(plain) {
    return btoa(xorWith(plain));
}
