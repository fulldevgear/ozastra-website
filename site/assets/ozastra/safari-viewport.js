// Safari's retracting browser bars are not a change to the authored scene.
// Standalone web apps and other browsers retain their existing viewport handling.
(() => {
  const ua = navigator.userAgent;
  const safari = /iPhone/.test(ua) && /AppleWebKit/.test(ua)
    && /Version\/[\d.]+/.test(ua) && /Safari\//.test(ua)
    && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//.test(ua);
  if (!safari || navigator.standalone === true || matchMedia('(display-mode: standalone)').matches) return;

  const root = document.documentElement;
  let width = 0, angle, timer;
  const orientation = () => screen.orientation?.angle ?? window.orientation ?? null;
  function measure() {
    // Pinch zoom and the keyboard must not redefine the scene's camera.
    if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > .01) return;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;width:0;height:100svh;';
    document.body.append(probe);
    const small = probe.getBoundingClientRect().height;
    probe.style.height = '100lvh';
    const large = probe.getBoundingClientRect().height;
    probe.remove();
    if (!(small > 0 && large >= small)) return;
    root.style.setProperty('--ozastra-safari-small-height', `${small}px`);
    root.style.setProperty('--ozastra-safari-large-height', `${large}px`);
    root.dataset.ozastraSafariViewport = 'stable';
    width = root.clientWidth;
    angle = orientation();
  }
  function onResize() {
    clearTimeout(timer);
    if (root.clientWidth === width && orientation() === angle) return;
    // Rotation produces several intermediate sizes. Commit only the final one.
    timer = setTimeout(measure, 180);
  }
  // Runs before the hero. The deferred legacy bundle repeats the GSAP option
  // once that library has loaded, before any page triggers initialize.
  window.ScrollTrigger?.config({ignoreMobileResize: true});
  measure();
  addEventListener('resize', onResize, {passive: true});
  addEventListener('orientationchange', onResize, {passive: true});
  window.visualViewport?.addEventListener('resize', onResize, {passive: true});
  addEventListener('pageshow', onResize);
  addEventListener('pagehide', () => clearTimeout(timer));
})();
