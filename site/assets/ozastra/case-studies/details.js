(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const contexts = [];
  let active = null;
  let moving = false;
  // Only this section changes size. Refreshing every ScrollTrigger reverts
  // unrelated pinned scenes and can briefly expose their backgrounds.
  const refresh = () => { if (typeof lenis !== 'undefined') lenis.resize(); };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mix = (a, b, t) => a + (b - a) * t;
  const snapshot = image => ({ src: image.currentSrc || image.src, rect: image.getBoundingClientRect() });
  function placeScroll(top) {
    if (typeof lenis !== 'undefined') lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: 'instant' });
  }
  function makeFlight(from, to) {
    const copy = new Image();
    copy.src = from.src;
    copy.alt = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.className = 'oz-case-travelling-art';
    // Give the clone its complete geometry before it ever enters the document.
    Object.assign(copy.style, {
      left: `${from.rect.left}px`, top: `${from.rect.top}px`,
      width: `${from.rect.width}px`, height: `${from.rect.height}px`,
      transformOrigin: '0 0', transform: 'translate3d(0,0,0)'
    });
    to.style.visibility = 'hidden';
    document.body.append(copy);
    return { copy, from: from.rect, to };
  }
  async function prepare(context, name) {
    const fragment = document.getElementById(`oz-case-template-${name}`).content.cloneNode(true);
    const main = fragment.querySelector('.oz-case-art > img');
    // Keep the exact same decoded asset through thumbnail, motion and detail.
    main.src = context.links.find(link => link.dataset.caseTrigger === name).querySelector('[data-case-brand] img').src;
    await main.decode().catch(() => {});
    return fragment;
  }
  function transition(context, { startHeight, endHeight, from, targets, opening }) {
    const panel = context.panel;
    const sectionMinHeight = context.section.style.minHeight;
    const startScroll = scrollY;
    const stageTop = context.stage.getBoundingClientRect().top + startScroll;
    const endScroll = Math.max(0, opening ? stageTop - 95 : context.section.getBoundingClientRect().top + startScroll - 24);
    // Keep enough document below the viewport while shrinking. Browser scroll
    // clamping must not race the artwork/section animation.
    context.section.style.minHeight = `${context.section.getBoundingClientRect().height}px`;
    context.stage.style.height = `${startHeight}px`;
    context.stage.dataset.motion = 'running';
    context.stage.setAttribute('aria-busy', 'true');
    const flights = targets.map(({ name, image }) => makeFlight(from[name], image));
    const story = panel.querySelector('.oz-case-story');
    const chrome = [...panel.querySelectorAll('.oz-case-bar, .oz-case-art > p, .oz-case-switch > span')];
    const cardText = opening ? [] : [...context.cardWrap.querySelectorAll('[data-case-brand] ~ *')];
    if (opening) { story.style.opacity = '0'; chrome.forEach(e => e.style.opacity = '0'); }
    refresh();
    const duration = reduceMotion.matches ? 0 : 760;
    let start;
    return new Promise(resolve => {
      const frame = time => {
        start ??= time;
        const progress = duration ? Math.min(1, (time - start) / duration) : 1;
        const amount = ease(progress);
        context.stage.style.height = `${mix(startHeight, endHeight, amount)}px`;
        // Update Lenis' scroll limit with this frame's height, not the old
        // collapsed document, before applying the matching camera position.
        refresh();
        placeScroll(mix(startScroll, endScroll, amount));
        for (const { copy, from: origin, to } of flights) {
          const end = to.getBoundingClientRect();
          const x = mix(origin.left, end.left, amount) - origin.left;
          const y = mix(origin.top, end.top, amount) - origin.top;
          const sx = mix(1, end.width / origin.width, amount);
          const sy = mix(1, end.height / origin.height, amount);
          copy.style.transform = `translate3d(${x}px,${y}px,0) scale(${sx},${sy})`;
        }
        const reveal = opening ? Math.max(0, Math.min(1, (progress - .48) / .52)) : Math.max(0, 1 - progress * 4);
        story.style.opacity = String(reveal);
        story.style.transform = opening ? `translateY(${8 * (1 - reveal)}px)` : '';
        chrome.forEach(e => { e.style.opacity = String(opening ? Math.min(1, progress * 2) : Math.max(0, 1 - progress * 3)); });
        cardText.forEach(e => { e.style.opacity = String(Math.max(0, (progress - .7) / .3)); });
        if (progress < 1) { requestAnimationFrame(frame); return; }
        // Commit the DOM before releasing reserved height; no old layout frame.
        if (!opening) reset(context);
        flights.forEach(({ copy, to }) => { to.style.visibility = ''; copy.remove(); });
        story.style.opacity = ''; story.style.transform = '';
        chrome.forEach(e => { e.style.opacity = ''; });
        cardText.forEach(e => { e.style.opacity = ''; });
        context.stage.style.height = '';
        context.section.style.minHeight = sectionMinHeight;
        context.stage.removeAttribute('data-motion');
        context.stage.removeAttribute('aria-busy');
        refresh();
        resolve();
      };
      requestAnimationFrame(frame);
    });
  }
  function updateTriggers() {
    contexts.forEach(context => context.links.forEach(link => {
      link.setAttribute('aria-expanded', String(active?.link === link));
    }));
  }
  function reset(context) {
    context.panel.replaceChildren();
    context.panel.removeAttribute('data-active-case');
    context.cardWrap.classList.remove('oz-case-source-hidden');
    context.cardWrap.inert = false;
    context.cardWrap.classList.remove('oz-case-returning');
    context.section.classList.remove('oz-case-is-open');
  }
  function addSwitch(context, name) {
    const other = context.links.find(link => link.dataset.caseTrigger !== name);
    const aside = context.panel.querySelector('.oz-case-art');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'oz-case-switch';
    button.setAttribute('aria-controls', context.panel.id);
    const image = other.querySelector('[data-case-brand] img').cloneNode();
    image.alt = '';
    image.loading = 'eager';
    const text = document.createElement('span');
    const label = document.createElement('small');
    label.textContent = 'EXPLORE THE OTHER CASE';
    const title = document.createElement('strong');
    title.textContent = other.querySelector('h2, h3').textContent;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.className = 'oz-case-switch-arrow';
    text.append(label, title);
    button.append(image, text, arrow);
    aside.append(button);
    button.addEventListener('click', () => open(context, other));
    return { button, image, name: other.dataset.caseTrigger };
  }
  async function close(returnFocus = true) {
    if (!active || moving) return;
    moving = true;
    const { context, link, name, other } = active;
    const from = {
      [name]: snapshot(context.panel.querySelector('.oz-case-art > img')),
      [other.name]: snapshot(other.image)
    };
    const startHeight = context.stage.getBoundingClientRect().height;
    context.stage.style.height = `${startHeight}px`;
    // Lay the restored cards over the outgoing story. They don't add a second
    // block of height or flash underneath it during the fold.
    context.cardWrap.classList.remove('oz-case-source-hidden');
    context.cardWrap.classList.add('oz-case-returning');
    context.cardWrap.inert = false;
    context.panel.inert = true;
    const endHeight = context.cardWrap.getBoundingClientRect().height + parseFloat(getComputedStyle(context.cardWrap).marginTop);
    const targets = context.links.map(item => ({ name: item.dataset.caseTrigger, image: item.querySelector('[data-case-brand] img') }));
    context.panel.querySelectorAll('.oz-case-art > img,.oz-case-switch > img').forEach(i => i.style.visibility = 'hidden');
    active = null;
    updateTriggers();
    await transition(context, { startHeight, endHeight, from, targets, opening: false });
    context.cardWrap.classList.remove('oz-case-returning');
    context.panel.inert = false;
    moving = false;
    if (returnFocus) link.focus({ preventScroll: true });
  }
  async function open(context, link) {
    if (moving) return;
    if (active?.link === link) { close(); return; }
    moving = true;
    const name = link.dataset.caseTrigger;
    const fragment = await prepare(context, name);
    if (!context.section.getClientRects().length) { moving = false; return; }
    const startHeight = context.stage.getBoundingClientRect().height;
    const from = {};
    if (active?.context === context) {
      from[active.name] = snapshot(context.panel.querySelector('.oz-case-art > img'));
      from[active.other.name] = snapshot(active.other.image);
    } else {
      context.links.forEach(item => { from[item.dataset.caseTrigger] = snapshot(item.querySelector('[data-case-brand] img')); });
      if (active) reset(active.context);
    }
    // Reserve the current space before removing or replacing anything.
    context.stage.style.height = `${startHeight}px`;
    context.panel.inert = false;
    context.panel.replaceChildren(fragment);
    context.panel.dataset.activeCase = name;
    context.section.classList.add('oz-case-is-open');
    const other = addSwitch(context, name);
    active = { context, link, name, other };
    context.cardWrap.classList.add('oz-case-source-hidden');
    context.cardWrap.inert = true;
    updateTriggers();
    context.panel.querySelector('.oz-case-close').addEventListener('click', () => close());
    const endHeight = context.panel.getBoundingClientRect().height;
    await transition(context, {
      startHeight, endHeight, from,
      targets: [{ name, image: context.panel.querySelector('.oz-case-art > img') }, { name: other.name, image: other.image }],
      opening: true
    });
    moving = false;
    if (context.section.getClientRects().length) context.panel.querySelector('h2').focus({ preventScroll: true });
    else { reset(context); active = null; updateTriggers(); refresh(); }
  }
  document.querySelectorAll('[data-ozastra-cases="work"], [data-ozastra-cases="mobile"]').forEach((section, i) => {
    const cards = section.querySelector('.w-dyn-list');
    if (!cards) return;
    const panel = document.createElement('div');
    panel.className = 'oz-case-expansion';
    panel.id = `oz-case-expansion-${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Case study details');
    const cardWrap = cards.closest('.global-subline-div') || cards;
    const stage = document.createElement('div');
    stage.className = 'oz-case-stage';
    cardWrap.before(stage);
    stage.append(panel, cardWrap);
    const context = { section, panel, cardWrap, stage, links: [...section.querySelectorAll('.articel-item > a')] };
    contexts.push(context);
    context.links.forEach(link => {
      const name = link.querySelector('[data-case-brand]')?.dataset.caseBrand;
      if (!document.getElementById(`oz-case-template-${name}`)) return;
      link.dataset.caseTrigger = name;
      link.setAttribute('role', 'button');
      link.setAttribute('aria-expanded', 'false');
      link.setAttribute('aria-controls', panel.id);
      link.querySelector('[data-scramble-text]').textContent = 'View case study';
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        open(context, link);
      });
      link.addEventListener('keydown', event => {
        if (event.key === ' ') { event.preventDefault(); open(context, link); }
      });
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active && active.context.panel.contains(document.activeElement)) { event.preventDefault(); close(); }
  });
  // Read visibility after the new breakpoint layout has been committed.
  let resizeFrame = 0;
  function syncLayout() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (active && !moving && !active.context.section.getClientRects().length) {
        reset(active.context); active = null; updateTriggers(); refresh();
      }
    });
  }
  matchMedia('(max-width: 991px)').addEventListener('change', syncLayout);
  addEventListener('resize', syncLayout);
})();
