// Fire `fn` once on the next tap/click/keypress. Kaboom emits BOTH a mouse
// event and a touch event for a single tap on mobile, so binding all three
// naively would run `fn` twice — double-triggering scene changes. The latch
// guarantees exactly one call, whichever event lands first.
export function onceOnPress(fn) {
    let fired = false;
    const run = () => {
        if (fired) return;
        fired = true;
        fn();
    };
    onMousePress(run);
    onKeyPress(run);
    onTouchStart(run);
}
