/* Run in the head: stage the first frame before the page is painted. */
(() => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Each top-of-page load, including refresh, gets the same entrance.
  // A previous visit must not bypass the staged first frame.
  if (motion.matches || location.hash || scrollY > 4) return;

  root.dataset.ozastraEntrance = 'pending';
  let finished = false;
  let completion;
  // A failed font, script or animation must never leave the page concealed.
  const failsafe = setTimeout(finish, 2400);
  const controller = new AbortController();
  const options = { passive: true, signal: controller.signal };

  function finish() {
    if (finished) return;
    finished = true;
    delete root.dataset.ozastraEntrance;
    clearTimeout(failsafe);
    clearTimeout(completion);
    controller.abort();
  }
  for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'focusin']) {
    addEventListener(name, finish, options);
  }
  addEventListener('scroll', () => { if (scrollY > 4) finish(); }, options);
  addEventListener('pageshow', event => { if (event.persisted) finish(); }, options);
  motion.addEventListener('change', () => { if (motion.matches) finish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);

  function backgroundReady() {
    const layer = document.querySelector('[data-ozastra-chromium="environment"]') ||
      document.querySelector('[data-ozastra-chromium="layer"]');
    if (!layer) return Promise.resolve();
    // WebGL initializes asynchronously. Do not reveal the poster and then
    // replace it abruptly halfway through the entrance.
    return new Promise(resolve => {
      let frame;
      let settled = false;
      const timeout = setTimeout(done, 600);
      const poster = layer.querySelector('img');
      let decoded = !poster;
      poster?.decode().then(() => { decoded = true; }, () => { decoded = true; });
      function done() {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cancelAnimationFrame(frame);
        resolve();
      }
      function check() {
        const state = layer.dataset.state;
        if (finished || state === 'running' || state === 'paused' || (state === 'still' && decoded)) {
          done();
        } else frame = requestAnimationFrame(check);
      }
      check();
    });
  }

  let started = false;
  async function start() {
    if (started || finished) return;
    started = true;
    await Promise.all([
      Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 240))]),
      backgroundReady()
    ]);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (finished) return;
      if (scrollY > 4 || motion.matches) { finish(); return; }
      // The loading watchdog must not cut an already running animation short.
      clearTimeout(failsafe);
      root.dataset.ozastraEntrance = 'running';
      completion = setTimeout(finish, 1540);
    }));
  }
  if (document.readyState === 'loading') {
    // The hero only needs parsed markup, fonts and its first background frame.
    // DOMContentLoaded also waits for every deferred legacy dependency, which
    // used to exhaust the watchdog on an uncached visit and skip the entrance.
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'loading') start();
    }, { signal: controller.signal });
  } else start();
})();
