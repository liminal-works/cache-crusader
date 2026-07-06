# Cache Crusader

A mobile web mini-dungeon-crawler that lives **inside a geocache**.

The gag: the cache listing promises a boring park-and-grab. The finder opens
the tin expecting a log sheet... and finds a QR code instead. The QR opens
this game. Beat the dungeon, collect the five coordinate fragments, and the
game reveals the coordinates of the *real* container — where the actual
paper log is waiting.

> **Cache name:** "Just Another Tin"
> **Listing description:** *"Not every cache has to be special. Just a quick P&G. Grab a pen."*

## What's in the dungeon

- **Decoy containers** — green ammo cans, some of which are just another
  can... and some of which have teeth.
- **Muggles** — get too close and a suspicion meter starts climbing.
  Open a container in front of one and it climbs a lot faster. Max it out
  and you're COMPROMISED (that costs a heart).
- **A wizard** — sells healing potions for 5 geocoins and dispenses hints
  that are technically hints.
- **You play as Cache-asaur** — a small teal dinosaur with a big mission.
- **DNF-asaur** — a fellow dino who has failed this dungeon four times and
  offers a lifeline. The lifeline is pointing at the wizard.
- **Talking your way out** — chat with a muggle and pick one of three
  excuses ("BIRDWATCHING.") to pause the suspicion meter for a while.
- **A trackable** (TB-U5LE55) — rescue it from its cell with the lever.
  It follows you for the rest of the game. It is completely useless.
  Its goal is to visit Ohio.
- **A spike gauntlet, a cherub narrator, and five coordinate fragments**
  that assemble into the final coordinates on the win screen.

Works on phones (touch d-pad + action button) and desktop
(WASD/arrows + E/space). After the first load it works **offline** —
important, because cell signal at ground zero is never good.

## Setting it up for your own cache

1. **Fork / clone this repo.**
2. **Encode your final coordinates:**
   ```
   node tools/encode.mjs "N 47 38.938|W 122 20.887|NEAR THE BIG|OAK STUMP|GO SIGN IT!"
   ```
   Exactly 5 fragments separated by `|`, plain ASCII only (the pixel font
   has no `°` symbol). They don't all have to be numbers — the last
   fragment is a great place for a hint or a victory lap.
3. **Paste the output into `config.js`** (the only file you need to edit).
4. **Enable GitHub Pages** (Settings → Pages → deploy from branch, root).
5. **Generate a QR code** pointing at your Pages URL and print it to fit
   inside the decoy tin. Laminate it or use a sticker — tins get damp.
6. Hide the decoy tin at the posted coordinates and the real log container
   at the coordinates the game reveals. Go live.

### Field notes

- The coordinates are XOR+base64 encoded, so they don't appear in
  View Source. A determined cheater with a debugger can still dig them
  out — but if a finder cheats, that's between them and their conscience.
- The service worker is network-first: players always get your latest
  config when they're online, and a fully cached game when they're not.
- Check your local geocaching guidelines on QR/web-dependent caches —
  most reviewers want the posted container to be findable without the
  game (it is — the game only gates the *final* stage), and a note in
  the listing that a smartphone is required is good manners.

## Development

No build step. Serve the folder and go:

```
npx http-server -p 8080
```

Append `?debug=1` to expose `window.__DEBUG` (teleport, state inspection,
freecam) for automated testing.

## Credits

- Art: [0x72's DungeonTilesetII](https://0x72.itch.io/dungeontileset-ii) (CC0)
- Font: [unscii](http://viznut.fi/unscii/) by viznut (public domain)
- Engine: [kaboom.js 3000](https://kaboomjs.com/) (MIT, vendored in `vendor/`)
- Title art & original prototype: [carsononti/cachecrusader](https://github.com/carsononti/cachecrusader)
