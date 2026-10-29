(function () {
  'use strict';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const hashId = (s) => { let h = 5381; for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
  const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const BLANK = /\[[^\]]*\]/g;

  // Everything is saved under one prefix so "Reset all progress" can clear it cleanly
  const PREFIX = 'ibmprep:';
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(PREFIX + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, val) { try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) { /* storage blocked */ } },
    clear() {
      try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* storage blocked */ }
    },
  };

  /* ------------------------------------------------------------------
     Theme toggle with a circular reveal
     ------------------------------------------------------------------ */
  const themeBtn = $('#themeToggle');
  function labelThemeButton() {
    const dark = root.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      labelThemeButton();
    };
    if (!document.startViewTransition || reducedMotion) return apply();
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    document.startViewTransition(apply).ready.then(() => {
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });
  labelThemeButton();

  /* ------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------ */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  /* ------------------------------------------------------------------
     Tabs: hash routing with a sliding indicator and directional slides
     ------------------------------------------------------------------ */
  const TABS = ['plan', 'glassdoor', 'terms', 'cloud', 'design', 'coding', 'assess', 'projects', 'mock', 'talk'];
  const pages = TABS.map((t) => $('#page-' + t));
  const tabLinks = $$('.tabs a');
  const indicator = $('.tab-indicator');
  let current = null;
  let navToken = 0;
  let pendingScroll = null; // where to land after the next tab switch (used by "Back")
  let afterEnter = null;    // one-off callback once the next tab is visible

  function moveIndicator() {
    const active = tabLinks.find((a) => a.dataset.tab === current);
    if (!active) return;
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.transform = `translateX(${active.offsetLeft - 4}px)`;
  }

  function show(name) {
    const next = $('#page-' + name);
    const visible = pages.find((p) => !p.hidden);
    const dir = current ? Math.sign(TABS.indexOf(name) - TABS.indexOf(current)) : 0;
    const token = ++navToken;

    current = name;
    tabLinks.forEach((a) => {
      if (a.dataset.tab !== name) return a.removeAttribute('aria-current');
      a.setAttribute('aria-current', 'page');
      // On phones the tab strip scrolls sideways; keep the active tab centered
      const strip = a.parentElement;
      if (strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    });
    moveIndicator();
    document.title = next.dataset.title;
    store.set('lastTab', name);
    pages.forEach((p) => p.getAnimations().forEach((a) => a.cancel()));

    const enter = () => {
      pages.forEach((p) => { p.hidden = p !== next; });
      window.scrollTo(0, pendingScroll || 0);
      pendingScroll = null;
      if (afterEnter) { const fn = afterEnter; afterEnter = null; setTimeout(fn, 30); }
      if (dir && !reducedMotion) {
        next.animate(
          [{ opacity: 0, transform: `translateX(${dir * 56}px)` }, { opacity: 1, transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      }
      if (name === 'plan') updateReady();
      onScroll();
    };

    if (!visible || visible === next || !dir || reducedMotion) return enter();
    // Enter when the exit animation ends, or after a short timeout if the browser
    // isn't painting frames (a background tab), so the switch never gets stuck
    let entered = false;
    const enterOnce = () => { if (!entered && token === navToken) { entered = true; enter(); } };
    visible
      .animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 56}px)` }],
        { duration: 200, easing: 'linear', fill: 'forwards' }
      )
      .finished.then(enterOnce)
      .catch(() => { /* cancelled by a newer navigation */ });
    setTimeout(enterOnce, 320);
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (TABS.includes(h)) show(h);
  });
  window.addEventListener('resize', moveIndicator);
  if (document.fonts) document.fonts.ready.then(moveIndicator);

  /* ------------------------------------------------------------------
     Scroll reveal + progress bar
     ------------------------------------------------------------------ */
  function stagger(scope = document) {
    $$('[data-stagger]', scope).forEach((group) => {
      [...group.children].forEach((child, i) => { child.classList.add('reveal'); child.style.setProperty('--d', Math.min(i, 8)); });
    });
  }
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
      setTimeout(() => entry.target.style.setProperty('--d', 0), 1200);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  const observeReveals = (scope = document) => $$('.reveal:not(.in)', scope).forEach((el) => revealObserver.observe(el));

  const progressBar = $('#progressBar');
  let ticking = false;
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ------------------------------------------------------------------
     Timer used by the pitch and the mock interview
     ------------------------------------------------------------------ */
  class Timer {
    constructor(el, { max = 120, target = null, zones = false, onTick } = {}) {
      this.el = el;
      this.digits = $('.timer-digits', el);
      this.bar = $('.timer-bar span', el);
      this.msg = $('.timer-msg', el);
      this.max = max;
      this.target = target;
      this.zones = zones;
      this.onTick = onTick;
      this.elapsed = 0;
      this.running = false;
      this.interval = 0;
    }
    get time() { return this.running ? performance.now() - this.t0 : this.elapsed; }
    start() {
      if (this.running) return;
      this.t0 = performance.now() - this.elapsed;
      this.running = true;
      this.render();
      this.interval = setInterval(() => this.render(), 100);
    }
    stop() {
      if (!this.running) return;
      this.elapsed = performance.now() - this.t0;
      this.running = false;
      clearInterval(this.interval);
      this.render();
    }
    toggle() { this.running ? this.stop() : this.start(); return this.running; }
    reset(target) {
      this.stop();
      this.elapsed = 0;
      if (target !== undefined) this.target = target;
      this.el.classList.remove('good', 'over');
      this.render();
    }
    render() {
      const ms = this.time;
      const s = ms / 1000;
      this.digits.textContent = fmtTime(ms);
      const span = this.target || this.max;
      this.bar.style.width = Math.min(100, (s / span) * 100) + '%';
      if (this.zones) {
        const good = s >= 60 && s <= 90;
        this.el.classList.toggle('good', good);
        this.el.classList.toggle('over', s > 90);
        if (this.msg && (this.running || s > 0)) {
          this.msg.textContent = s < 45 ? 'Keep going. Aim for at least 60 seconds.'
            : s < 60 ? 'Almost there.'
            : s <= 90 ? 'Sweet spot. Wrap up with why this role.'
            : 'Over 90 seconds. Trim one detail.';
        }
      } else if (this.target) {
        this.el.classList.toggle('over', s > this.target);
      }
      if (this.onTick) this.onTick(s);
    }
  }

  /* ------------------------------------------------------------------
     Checklists, plan picker, countdown
     ------------------------------------------------------------------ */
  const checks = store.get('checks', {});
  $$('.checklist').forEach((list) => {
    const group = list.dataset.group;
    $$('input', list).forEach((input) => {
      const id = `${group}:${input.dataset.id}`;
      input.checked = !!checks[id];
      input.addEventListener('change', () => {
        checks[id] = input.checked;
        store.set('checks', checks);
        updatePlanCount();
        updateReady();
      });
    });
  });
  function updatePlanCount() {
    const inputs = $$('.checklist[data-group="plan"] input');
    const done = inputs.filter((i) => i.checked).length;
    $('#planCount').textContent = `${done} / ${inputs.length}`;
    $('#planBar').style.width = pct(done, inputs.length) + '%';
  }

  const segButtons = $$('.seg button');
  function selectPlan(days) {
    segButtons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.plan === days)));
    $$('[data-plan-body]').forEach((el) => { el.hidden = el.dataset.planBody !== days; });
    store.set('planSeg', days);
  }
  segButtons.forEach((b) => b.addEventListener('click', () => selectPlan(b.dataset.plan)));
  selectPlan(store.get('planSeg', '3'));

  const dateInput = $('#interviewDate');
  dateInput.value = store.get('date', '');
  function daysUntil(value) {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((new Date(y, m - 1, d) - today) / 86400000);
  }
  function updateCountdown() {
    const el = $('#countdownText');
    const days = daysUntil(dateInput.value);
    if (days === null) el.textContent = 'Set it for a countdown.';
    else if (days > 1) el.innerHTML = `<strong>${days} days</strong> to go.`;
    else if (days === 1) el.innerHTML = '<strong>Tomorrow.</strong> Run the 1-day plan, then sleep early.';
    else if (days === 0) el.innerHTML = '<strong>Today.</strong> Day-of checklist is on the Talk tab. You\'ve got this.';
    else el.textContent = 'That date has passed. Set your next one.';
  }
  dateInput.addEventListener('change', () => {
    store.set('date', dateInput.value);
    updateCountdown();
    const days = daysUntil(dateInput.value);
    if (days !== null && days >= 0) selectPlan(days >= 7 ? '7' : days >= 3 ? '3' : '1');
  });
  updateCountdown();

  /* ------------------------------------------------------------------
     Flashcards
     ------------------------------------------------------------------ */
  const cards = PREP.cards.map((c) => ({ ...c, id: hashId(c.q) }));
  const cardState = store.get('cards', {});
  const cardGrid = $('#cardGrid');
  const hideKnown = $('#hideKnown');
  let cardFilter = 'All';

  cardGrid.innerHTML = cards.map((c) => `
    <article class="flash" data-id="${c.id}" data-cat="${c.c}">
      <div class="flash-inner" role="button" tabindex="0" aria-label="Flip card: ${c.q.replace(/"/g, '&quot;')}">
        <div class="flash-face flash-front">
          <div class="flash-cat"><span>${c.c}</span><span class="flash-state" aria-hidden="true"></span></div>
          <p class="flash-q">${c.q}</p>
          <span class="flash-tap">Answer out loud, then click to flip${c.you ? ' · <span class="you-chip">You</span>' : ''}</span>
        </div>
        <div class="flash-face flash-back">
          <div class="flash-cat"><span>Answer</span></div>
          <p class="flash-a">${c.a}</p>
          ${c.you ? `<p class="flash-you"><b>You:</b> ${c.you}</p>` : ''}
        </div>
      </div>
      <div class="flash-actions">
        <button class="mini good" type="button" data-mark="known" aria-pressed="false"><svg><use href="#i-check"/></svg> Know it</button>
        <button class="mini warn" type="button" data-mark="review" aria-pressed="false">Review</button>
      </div>
    </article>`).join('');

  const cardEls = new Map($$('.flash', cardGrid).map((el) => [el.dataset.id, el]));

  function paintCard(id) {
    const el = cardEls.get(id);
    const state = cardState[id];
    const badge = $('.flash-state', el);
    badge.className = 'flash-state' + (state ? ' ' + state : '');
    badge.innerHTML = state === 'known' ? '<svg><use href="#i-check"/></svg>' : state === 'review' ? '!' : '';
    $$('[data-mark]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mark === state)));
  }

  function setCardState(id, state, { toggle = false } = {}) {
    if (toggle && cardState[id] === state) delete cardState[id];
    else cardState[id] = state;
    store.set('cards', cardState);
    paintCard(id);
    applyCardFilter();
    updateReady();
  }

  function applyCardFilter() {
    let shown = 0;
    cards.forEach((c) => {
      const el = cardEls.get(c.id);
      const visible = (cardFilter === 'All' || c.c === cardFilter) && !(hideKnown.checked && cardState[c.id] === 'known');
      el.hidden = !visible;
      if (visible) shown++;
    });
    const known = cards.filter((c) => cardState[c.id] === 'known').length;
    const review = cards.filter((c) => cardState[c.id] === 'review').length;
    $('#cardCount').textContent = `${known} of ${cards.length} known · ${review} to review · showing ${shown}`;
    $('#cardBar').style.width = pct(known, cards.length) + '%';
  }

  const categories = ['All', ...new Set(cards.map((c) => c.c))];
  $('#cardFilters').innerHTML = categories.map((cat) => {
    const n = cat === 'All' ? cards.length : cards.filter((c) => c.c === cat).length;
    return `<button class="filter" type="button" data-cat="${cat}" aria-pressed="${cat === 'All'}">${cat}<span class="n">${n}</span></button>`;
  }).join('');
  $('#cardFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    cardFilter = btn.dataset.cat;
    $$('.filter', $('#cardFilters')).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    applyCardFilter();
    animateIn($$('.flash:not([hidden])', cardGrid));
  });
  hideKnown.addEventListener('change', applyCardFilter);

  cardGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.flash');
    if (!card) return;
    const mark = e.target.closest('[data-mark]');
    if (mark) return setCardState(card.dataset.id, mark.dataset.mark, { toggle: true });
    if (e.target.closest('.flash-inner')) card.classList.toggle('flipped');
  });
  cardGrid.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('flash-inner')) {
      e.preventDefault();
      e.target.closest('.flash').classList.toggle('flipped');
    }
  });

  $('#shuffleCards').addEventListener('click', () => {
    const els = [...cardEls.values()];
    for (let i = els.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [els[i], els[j]] = [els[j], els[i]]; }
    els.forEach((el) => { el.classList.remove('flipped'); cardGrid.appendChild(el); });
    animateIn(els.filter((el) => !el.hidden));
  });

  function animateIn(els) {
    if (reducedMotion) return;
    els.slice(0, 24).forEach((el, i) => el.animate(
      [{ opacity: 0, transform: 'translateY(14px) scale(.98)' }, { opacity: 1, transform: 'none' }],
      { duration: 380, delay: i * 30, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }
    ));
  }

  cards.forEach((c) => paintCard(c.id));
  applyCardFilter();

  $('#serviceMap').innerHTML = '<thead><tr><th>What</th><th>AWS</th><th>Google Cloud</th><th>IBM Cloud</th></tr></thead><tbody>' +
    PREP.serviceMap.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('') + '</tbody>';

  /* ------------------------------------------------------------------
     Diagrams (inline SVG with packets moving along the request paths)
     ------------------------------------------------------------------ */
  const box = (x, y, w, h, label, sub, cls = '') => `
    <rect class="d-box ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>
    <text class="d-label" x="${x + w / 2}" y="${y + (sub ? h / 2 - 2 : h / 2 + 4)}" text-anchor="middle">${label}</text>
    ${sub ? `<text class="d-sub" x="${x + w / 2}" y="${y + h / 2 + 14}" text-anchor="middle">${sub}</text>` : ''}`;
  const packet = (path, dur, begin = 0, alt = false) =>
    `<circle class="d-packet${alt ? ' alt' : ''}" r="4"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;

  const DIAGRAMS = {
    arch() {
      const lines = [
        ['M130 38 H160', ''], ['M360 38 H390', ''], ['M450 60 V92', ''],
        ['M120 205 H150', ''], ['M266 196 C288 196 288 151 310 151', ''], ['M266 214 C288 214 288 236 310 236', ''],
        ['M506 228 H560', ''], ['M560 143 C533 143 533 210 506 210', 'dash'], ['M506 256 C533 256 533 305 560 305', 'dash'],
      ];
      return `<svg viewBox="0 0 760 330" role="img" aria-label="Architecture: users reach a TLS route, which sends traffic to a React frontend and a FastAPI backend running as three pods on OpenShift. The backend reads secrets from a secrets manager, stores data in managed PostgreSQL, and sends logs and metrics to monitoring. A CI pipeline builds images into a registry that the cluster deploys from.">
        <rect class="d-zone" x="290" y="92" width="236" height="222" rx="14"/>
        <text class="d-zone-label" x="304" y="112">OPENSHIFT / KUBERNETES</text>
        ${lines.map(([d, c]) => `<path class="d-line ${c}" d="${d}" marker-end="url(#arrow)"/>`).join('')}
        ${packet('M120 205 H150 M266 214 C288 214 288 236 310 236 M506 228 H560', 2.6)}
        ${packet('M120 205 H150 M266 196 C288 196 288 151 310 151', 2.6, 1.3)}
        ${packet('M130 38 H160 M360 38 H390 M450 60 V92', 3.2, 0, true)}
        ${box(20, 16, 110, 44, 'git push', 'merge to main')}
        ${box(160, 16, 200, 44, 'CI pipeline', 'test · build · scan')}
        ${box(390, 16, 120, 44, 'Registry', 'image:commit-sha')}
        ${box(20, 180, 100, 50, 'Users', 'browser')}
        ${box(150, 180, 116, 50, 'Route', 'TLS · /api split', 'hl')}
        ${box(310, 128, 196, 46, 'Frontend', 'React build · nginx')}
        <rect class="d-box hl" x="310" y="196" width="196" height="84" rx="10"/>
        <text class="d-label" x="408" y="218" text-anchor="middle">Backend · FastAPI</text>
        <text class="d-sub" x="408" y="234" text-anchor="middle">Deployment ×3 · autoscaled</text>
        <circle class="d-pod" cx="368" cy="259" r="9"/><circle class="d-pod" cx="408" cy="259" r="9"/><circle class="d-pod" cx="448" cy="259" r="9"/>
        <text class="d-sub" x="408" y="304" text-anchor="middle">Alembic job runs before rollout</text>
        ${box(560, 120, 180, 46, 'Secrets Manager', 'DB URL · JWT key')}
        ${box(560, 203, 180, 50, 'Managed PostgreSQL', 'backups · encrypted')}
        ${box(560, 282, 180, 46, 'Logs · metrics · alerts', 'error rate · latency')}
      </svg>`;
    },
    pipe() {
      const stages = [['PR / merge', 'trigger'], ['Lint + test', 'CI'], ['Build image', 'container'], ['Scan', 'deps · image'], ['Registry', 'image:sha'], ['Staging', 'smoke tests'], ['Approve', 'gate'], ['Production', 'rolling']];
      const x = (i) => 10 + i * 93;
      return `<svg viewBox="0 0 760 150" role="img" aria-label="Pipeline: pull request or merge, lint and test, build image, scan, push to registry, deploy to staging, approval, rolling production deploy. Rollback redeploys the previous image from the registry.">
        ${stages.slice(1).map((_, i) => `<path class="d-line" d="M${x(i) + 80} 58 H${x(i + 1)}" marker-end="url(#arrow)"/>`).join('')}
        <path class="d-rollback" d="M${x(7) + 40} 86 C${x(7) + 40} 128 ${x(4) + 40} 128 ${x(4) + 40} 86" marker-end="url(#arrow)"/>
        <text class="d-rollback-label" x="${(x(7) + x(4)) / 2 + 40}" y="142" text-anchor="middle">rollback = redeploy the previous image</text>
        ${packet('M10 58 H750', 4)}
        ${packet('M10 58 H750', 4, 2, true)}
        ${stages.map(([l, s], i) => box(x(i), 30, 80, 56, l, s, i === 7 ? 'hl' : '')).join('')}
      </svg>`;
    },
    awsServerless() {
      const lines = [
        ['M130 150 H170', ''], ['M75 125 V43 H170', 'dash'], ['M320 150 H360', ''], ['M520 150 H570', ''],
        ['M75 175 V232', ''], ['M440 175 V232', ''], ['M520 255 H570', ''],
      ];
      return `<svg viewBox="0 0 760 290" role="img" aria-label="Serverless API: app users sign in with Cognito, which issues a JWT. Requests go to API Gateway, which checks the JWT and invokes Lambda functions that read and write a DynamoDB table. Lambda puts slow jobs on an SQS queue for a worker Lambda. Photos upload straight to S3.">
        ${lines.map(([d, c]) => `<path class="d-line ${c}" d="${d}" marker-end="url(#arrow)"/>`).join('')}
        ${packet('M130 150 H170 M320 150 H360 M520 150 H570', 2.6)}
        ${packet('M440 175 V232 M520 255 H570', 2.6, 1.3, true)}
        ${box(20, 125, 110, 50, 'App users', 'phone · browser')}
        ${box(170, 20, 150, 46, 'Cognito', 'sign-in · issues JWT')}
        ${box(170, 125, 150, 50, 'API Gateway', 'checks the JWT', 'hl')}
        ${box(360, 125, 160, 50, 'Lambda', 'API handlers', 'hl')}
        ${box(570, 125, 170, 50, 'DynamoDB', 'trips table')}
        ${box(20, 232, 110, 46, 'S3', 'photo uploads')}
        ${box(360, 232, 160, 46, 'SQS queue', 'slow jobs')}
        ${box(570, 232, 170, 46, 'Worker Lambda', 'emails · PDFs')}
      </svg>`;
    },
    awsEvents() {
      const lines = [['M130 65 H165', ''], ['M285 65 H320', ''], ['M440 65 H475', ''], ['M595 65 H630', ''], ['M535 90 V170', ''], ['M595 193 H630', '']];
      return `<svg viewBox="0 0 760 240" role="img" aria-label="Upload pipeline: the browser uploads to an S3 bucket with a pre-signed URL. S3 sends an event to an SQS queue, a Lambda function processes it and saves results in DynamoDB, then publishes to an SNS topic that notifies subscribers. Messages that keep failing move from the queue to a dead-letter queue.">
        ${lines.map(([d, c]) => `<path class="d-line ${c}" d="${d}" marker-end="url(#arrow)"/>`).join('')}
        <path class="d-rollback" d="M380 90 V170" marker-end="url(#arrow)"/>
        <text class="d-rollback-label" x="390" y="134">after 3 failed tries</text>
        ${packet('M130 65 H165 M285 65 H320 M440 65 H475 M595 65 H630', 3)}
        ${packet('M535 90 V170 M595 193 H630', 3, 1.5, true)}
        ${box(20, 40, 110, 50, 'Browser', 'pre-signed URL')}
        ${box(165, 40, 120, 50, 'S3 bucket', 'ObjectCreated', 'hl')}
        ${box(320, 40, 120, 50, 'SQS queue', 'buffers spikes')}
        ${box(475, 40, 120, 50, 'Lambda', 'extract text', 'hl')}
        ${box(630, 40, 110, 50, 'DynamoDB', 'results')}
        ${box(310, 170, 140, 46, 'Dead-letter queue', 'alarm on it')}
        ${box(475, 170, 120, 46, 'SNS topic', 'notify')}
        ${box(630, 170, 110, 46, 'Subscribers', 'email · services')}
      </svg>`;
    },
    aws3tier() {
      const lines = [
        ['M120 53 H150', ''], ['M270 53 H295 V86 H320', ''], ['M415 108 V150', ''], ['M635 108 V150', ''],
        ['M415 200 V250', ''], ['M600 200 C600 228 470 222 470 250', ''],
        ['M330 175 H270', 'dash'], ['M330 188 C300 188 300 273 270 273', 'dash'],
      ];
      return `<svg viewBox="0 0 760 330" role="img" aria-label="Three-tier app on AWS: users reach Route 53, which points to an Application Load Balancer in a VPC spanning two availability zones. The load balancer sends traffic to app servers in an Auto Scaling group in both zones. The app servers use an RDS primary database, which replicates to a standby in the other zone. App servers read credentials from Secrets Manager and send logs to CloudWatch.">
        <rect class="d-zone" x="300" y="10" width="440" height="310" rx="14"/>
        <text class="d-zone-label" x="314" y="30">VPC</text>
        <text class="d-zone-label" x="336" y="138">ZONE A</text>
        <text class="d-zone-label" x="556" y="138">ZONE B</text>
        <path class="d-line dash" d="M525 120 V310"/>
        ${lines.map(([d, c]) => `<path class="d-line ${c}" d="${d}" marker-end="url(#arrow)"/>`).join('')}
        <path class="d-rollback" d="M500 275 H550" marker-end="url(#arrow)"/>
        <text class="d-rollback-label" x="525" y="307" text-anchor="middle">sync copy</text>
        ${packet('M120 53 H150 M270 53 H295 V86 H320 M415 108 V150 M415 200 V250', 3.2)}
        ${packet('M635 108 V150 M600 200 C600 228 470 222 470 250', 3.2, 1.6, true)}
        ${box(20, 30, 100, 46, 'Users', 'HTTPS')}
        ${box(150, 30, 120, 46, 'Route 53', 'DNS')}
        ${box(320, 64, 400, 44, 'Application Load Balancer', 'public subnets · ACM certificate', 'hl')}
        ${box(330, 150, 170, 50, 'App servers', 'Auto Scaling group')}
        ${box(550, 150, 170, 50, 'App servers', 'Auto Scaling group')}
        ${box(330, 250, 170, 50, 'RDS primary', 'private subnet', 'hl')}
        ${box(550, 250, 170, 50, 'RDS standby', 'Multi-AZ failover')}
        ${box(20, 152, 250, 46, 'Secrets Manager', 'DB credentials')}
        ${box(20, 250, 250, 46, 'CloudWatch', 'logs · metrics · alarms')}
      </svg>`;
    },
  };

  /* ------------------------------------------------------------------
     Scenarios
     ------------------------------------------------------------------ */
  const chevron = '<svg class="acc-chev" aria-hidden="true"><use href="#i-chevron"/></svg>';
  $('#scenarioList').innerHTML = PREP.scenarios.map((s, i) => `
    <details class="card acc reveal" id="sc-${s.id}">
      <summary>
        <span class="acc-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="acc-title"><h3>${s.title}</h3><p>${s.prompt}</p></span>
        ${chevron}
      </summary>
      <div class="acc-body">
        <div><h4>Ask first</h4><ul class="dot-list">${s.clarify.map((q) => `<li>${q}</li>`).join('')}</ul></div>
        ${s.diagram ? `<div class="diagram">${DIAGRAMS[s.diagram]()}</div>` : ''}
        <div><h4>Say it in this order</h4><ol class="say-list">${s.steps.map((st) => `<li>${st}</li>`).join('')}</ol></div>
        <div class="box"><h4>Tradeoffs to mention</h4><ul class="dot-list">${s.tradeoffs.map((t) => `<li>${t}</li>`).join('')}</ul></div>
        <div class="acc-actions"><button class="mini" type="button" data-practice="design:${s.id}"><svg><use href="#i-play"/></svg> Practice on the clock</button></div>
      </div>
    </details>`).join('');

  /* ------------------------------------------------------------------
     Coding tracker
     ------------------------------------------------------------------ */
  const solved = store.get('solved', {});
  const totalProblems = PREP.problems.reduce((n, g) => n + g.items.length, 0);
  $('#probGroups').innerHTML = PREP.problems.map((g) => `
    <div class="prob-group">
      <h4><span>${g.p}</span><span class="g-count"></span></h4>
      ${g.items.map(([name, slug, diff]) => `
        <div class="prob">
          <label class="check"><input type="checkbox" data-slug="${slug}"><span>${name}</span></label>
          <span class="diff ${diff}">${diff === 'E' ? 'Easy' : 'Medium'}</span>
          <a href="https://leetcode.com/problems/${slug}/" target="_blank" rel="noopener" aria-label="Open ${name} on LeetCode"><svg><use href="#i-external"/></svg></a>
        </div>`).join('')}
    </div>`).join('');
  $$('#probGroups input').forEach((input) => {
    input.checked = !!solved[input.dataset.slug];
    input.addEventListener('change', () => {
      if (input.checked) solved[input.dataset.slug] = true; else delete solved[input.dataset.slug];
      store.set('solved', solved);
      updateProblems();
      updateReady();
    });
  });
  function updateProblems() {
    const n = Object.keys(solved).length;
    $('#probCount').textContent = `${n} / ${totalProblems} solved`;
    $('#probBar').style.width = pct(n, totalProblems) + '%';
    $$('.prob-group').forEach((g) => {
      const inputs = $$('input', g);
      $('.g-count', g).textContent = `${inputs.filter((i) => i.checked).length}/${inputs.length}`;
    });
  }
  updateProblems();

  /* ------------------------------------------------------------------
     Project deep dives
     ------------------------------------------------------------------ */
  const projTabs = $('#projTabs');
  const projPanels = $('#projPanels');
  projTabs.innerHTML = PREP.projects.map((p) => `
    <button class="proj-tab" type="button" role="tab" data-proj="${p.id}" style="--pc:${p.color}" aria-selected="false">
      <span class="dot"></span>${p.name}<span class="state" hidden><svg><use href="#i-check"/></svg></span>
    </button>`).join('');
  projPanels.innerHTML = PREP.projects.map((p) => `
    <div class="proj-panel" data-panel="${p.id}" style="--pc:${p.color}" role="tabpanel" hidden>
      <div class="card panel proj-main">
        <div class="proj-body">
          <div class="proj-head">
            <h3>${p.name}</h3>
            <p class="proj-role">${p.role}</p>
            <div class="tags">${p.stack.map((t) => `<span>${t}</span>`).join('')}</div>
          </div>
          <div>
            <h4><span>Your 60-second walkthrough</span><span class="status-pill todo" data-status="${p.id}"></span></h4>
            <textarea class="editor autosize" data-store="walk:${p.id}" aria-label="${p.name} walkthrough"></textarea>
            <div class="acc-actions" style="margin-top:12px">
              <button class="mini" type="button" data-practice="walk:${p.id}"><svg><use href="#i-play"/></svg> Say it on the clock</button>
              <button class="mini" type="button" data-reset="walk:${p.id}">Reset to draft</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card panel">
        <div class="proj-body">
          <div><h4>What you can say confidently</h4><ul class="dot-list">${p.facts.map((f) => `<li>${f}</li>`).join('')}</ul></div>
          ${p.note ? `<div class="box warn">${p.note}</div>` : ''}
          <div>
            <h4><span>Follow-ups they'll ask</span><button class="mini" type="button" data-practice="fu:${p.id}"><svg><use href="#i-play"/></svg> Drill these</button></h4>
            ${p.followups.map(([q, a]) => `<details class="fu"><summary>${chevron}<span>${q}</span></summary><p>${a}</p></details>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('');

  function selectProject(id) {
    $$('.proj-tab', projTabs).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.proj === id)));
    $$('.proj-panel', projPanels).forEach((panel) => {
      const show = panel.dataset.panel === id;
      if (show && panel.hidden && !reducedMotion) {
        panel.hidden = false;
        panel.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else panel.hidden = !show;
    });
    $$(`.proj-panel[data-panel="${id}"] textarea`).forEach(autosize);
    store.set('proj', id);
  }
  projTabs.addEventListener('click', (e) => { const t = e.target.closest('.proj-tab'); if (t) selectProject(t.dataset.proj); });

  function updateProjectStatus(id) {
    const ta = $(`textarea[data-store="walk:${id}"]`);
    const blanks = (ta.value.match(BLANK) || []).length;
    const pill = $(`[data-status="${id}"]`);
    pill.className = 'status-pill ' + (blanks ? 'todo' : 'done');
    pill.textContent = blanks ? `${blanks} blank${blanks === 1 ? '' : 's'} left` : 'Ready';
    $(`.proj-tab[data-proj="${id}"] .state`).hidden = !!blanks;
  }
  const projectsReady = () => PREP.projects.filter((p) => !($(`textarea[data-store="walk:${p.id}"]`).value.match(BLANK) || []).length).length;

  /* ------------------------------------------------------------------
     Saved text areas (pitch, Why IBM, walkthroughs)
     ------------------------------------------------------------------ */
  function defaultText(key) {
    if (key.startsWith('walk:')) return PREP.projects.find((p) => p.id === key.slice(5)).walkthrough;
    return PREP.defaults[key] || '';
  }
  function autosize(ta) {
    if (!ta.offsetParent) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 2 + 'px';
  }
  const saveTimers = {};
  $$('textarea[data-store]').forEach((ta) => {
    const key = ta.dataset.store;
    ta.value = store.get('text:' + key, defaultText(key));
    ta.addEventListener('input', () => {
      autosize(ta);
      clearTimeout(saveTimers[key]);
      saveTimers[key] = setTimeout(() => store.set('text:' + key, ta.value), 300);
      if (key.startsWith('walk:')) { updateProjectStatus(key.slice(5)); updateReady(); }
    });
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-reset]');
    if (!btn) return;
    const key = btn.dataset.reset;
    const ta = $(`textarea[data-store="${key}"]`);
    if (ta.value !== defaultText(key) && !window.confirm('Replace your text with the original draft?')) return;
    ta.value = defaultText(key);
    store.set('text:' + key, ta.value);
    ta.dispatchEvent(new Event('input'));
    showToast('Reset to the draft');
  });
  PREP.projects.forEach((p) => updateProjectStatus(p.id));
  selectProject(store.get('proj', PREP.projects[0].id));

  /* ------------------------------------------------------------------
     Talk tab
     ------------------------------------------------------------------ */
  $('#talkList').innerHTML = PREP.talk.map(([q, hint], i) => `
    <div class="q"><strong>${q}</strong><p>${hint}</p><button class="mini" type="button" data-practice="talk:${i}"><svg><use href="#i-play"/></svg> Practice</button></div>`).join('');

  const pitchTimerEl = $('#pitchTimer');
  const pitchTimer = new Timer(pitchTimerEl, { max: 120, zones: true });
  pitchTimerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-timer]');
    if (!btn) return;
    const toggle = $('[data-timer="toggle"]', pitchTimerEl);
    if (btn.dataset.timer === 'reset') {
      pitchTimer.reset();
      $('.timer-msg', pitchTimerEl).textContent = 'Press start and say it out loud.';
    } else pitchTimer.toggle();
    $('span', toggle).textContent = pitchTimer.running ? 'Pause' : pitchTimer.time ? 'Resume' : 'Start';
    $('use', toggle).setAttribute('href', pitchTimer.running ? '#i-pause' : '#i-play');
  });

  /* ------------------------------------------------------------------
     Mock interview
     ------------------------------------------------------------------ */
  const list = (items, ordered) => `<${ordered ? 'ol' : 'ul'}>${items.map((i) => `<li>${i}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
  const POOLS = {
    cloud: cards.map((c) => ({
      key: 'c:' + c.id, kind: 'cloud', q: c.q, sub: c.c, target: 90, cardId: c.id,
      guide: () => `<h4>Answer</h4><p>${c.a}</p>${c.you ? `<h4 style="margin-top:12px">Tie it to you</h4><p>${c.you}</p>` : ''}`,
    })),
    design: PREP.scenarios.map((s) => ({
      key: 'd:' + s.id, kind: 'design', q: s.prompt, sub: s.title, target: 300,
      guide: () => `<h4>Ask first</h4>${list(s.clarify)}<h4 style="margin-top:12px">Cover</h4>${list(s.steps, true)}<h4 style="margin-top:12px">Tradeoffs</h4>${list(s.tradeoffs)}`,
    })),
    projects: PREP.projects.flatMap((p) => [
      {
        key: 'w:' + p.id, kind: 'projects', q: `Walk me through ${p.name}.`, sub: p.role, target: 90,
        guide: () => `<h4>Hit these</h4>${list(p.facts)}<h4 style="margin-top:12px">Your draft</h4><p>${$(`textarea[data-store="walk:${p.id}"]`).value.replace(/</g, '&lt;')}</p>`,
      },
      ...p.followups.map(([q, a], i) => ({ key: `f:${p.id}:${i}`, kind: 'projects', q, sub: p.name, target: 120, guide: () => `<h4>How to answer</h4><p>${a}</p>` })),
    ]),
    talk: PREP.talk.map(([q, hint], i) => ({ key: 't:' + i, kind: 'talk', q, sub: 'Talk', target: i === 0 ? 90 : 120, guide: () => `<h4>Use</h4><p>${hint}</p>` })),
    coding: PREP.challenges.map((c) => ({
      key: 'k:' + c.id, kind: 'coding', q: `Talk me through how you'd solve "${c.title}."`, sub: c.story.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), target: 180,
      guide: () => `<h4>Hint</h4><p>${c.hint}</p><h4 style="margin-top:12px">Approach</h4><p>${c.approach}</p><p style="margin-top:6px"><strong>Complexity:</strong> ${c.complexity}</p>`,
    })),
  };
  POOLS.terms = PREP.terms.map((t) => ({
    key: 'g:' + t.t, kind: 'terms', target: 45, sub: t.cat,
    q: t.full ? `What does ${t.t} stand for, and what does it mean?` : `In plain English, what is "${t.t}"?`,
    guide: () => `${t.full ? `<h4>Stands for</h4><p>${t.full}</p>` : ''}<h4${t.full ? ' style="margin-top:12px"' : ''}>Meaning</h4><p>${t.what}</p>${t.eg ? `<p class="muted" style="margin-top:6px">e.g. ${t.eg}</p>` : ''}`,
  }));
  const KIND_LABEL = { terms: 'Term', cloud: 'Cloud concept', design: 'Design', coding: 'Coding', projects: 'Project deep dive', talk: 'Talk' };
  const MIX = [['cloud', 0.28], ['projects', 0.22], ['design', 0.17], ['talk', 0.13], ['coding', 0.1], ['terms', 0.1]];

  const mockQ = $('#mockQ');
  const mockGuide = $('#mockGuide');
  const mockRate = $('#mockRate');
  const startBtn = $('#mockStart');
  const pauseBtn = $('#mockPause');
  const guideBtn = $('#mockGuideBtn');
  const nextBtn = $('#mockNext');
  const mockTimer = new Timer($('#mockTimer'), { max: 120, target: 120 });
  let mode = 'mixed';
  let currentQ = null;
  let queue = null; // a fixed list of questions, e.g. "drill these follow-ups"
  const used = new Set();
  const history = store.get('mockHistory', []);

  function pickFrom(pool) {
    let fresh = pool.filter((q) => !used.has(q.key));
    if (!fresh.length) { pool.forEach((q) => used.delete(q.key)); fresh = pool; }
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  function nextQuestion() {
    if (queue && queue.length) return queue.shift();
    queue = null;
    if (mode !== 'mixed') return pickFrom(POOLS[mode]);
    let r = Math.random();
    const kind = (MIX.find(([, w]) => (r -= w) < 0) || MIX[0])[0];
    return pickFrom(POOLS[kind]);
  }

  function ask(q) {
    currentQ = q;
    used.add(q.key);
    $('#mockKind').textContent = KIND_LABEL[q.kind];
    $('#mockKind').className = 'mock-kind k-' + q.kind;
    $('#mockCount').textContent = `Question ${history.length + 1}`;
    mockQ.textContent = q.q;
    $('#mockSub').textContent = q.sub || '';
    if (q.kind !== 'terms') linkTerms(mockQ); // don't give away the answer to a terms question
    if (!reducedMotion) { mockQ.classList.remove('swap'); void mockQ.offsetWidth; mockQ.classList.add('swap'); }
    mockGuide.hidden = true;
    mockRate.hidden = true;
    $('#mockTarget').textContent = 'target ' + fmtTime(q.target * 1000);
    mockTimer.reset(q.target);
    mockTimer.start();
    startBtn.hidden = true;
    [pauseBtn, guideBtn, nextBtn].forEach((b) => { b.disabled = false; });
    setPauseLabel();
  }
  function setPauseLabel() {
    $('span', pauseBtn).textContent = mockTimer.running ? 'Pause' : 'Resume';
    $('use', pauseBtn).setAttribute('href', mockTimer.running ? '#i-pause' : '#i-play');
  }
  function showGuide() {
    if (!currentQ) return;
    mockGuide.innerHTML = currentQ.guide();
    linkTerms(mockGuide);
    mockGuide.hidden = false;
    mockRate.hidden = false;
    mockTimer.stop();
    setPauseLabel();
  }
  function record(rate) {
    if (!currentQ) return;
    history.unshift({ q: currentQ.q, kind: currentQ.kind, ms: Math.round(mockTimer.time), rate: rate || null });
    history.splice(60);
    store.set('mockHistory', history);
    if (rate && currentQ.cardId) setCardState(currentQ.cardId, rate === 'good' ? 'known' : 'review');
    renderHistory();
  }
  function advance(rate) {
    record(rate);
    ask(nextQuestion());
  }
  function renderHistory() {
    $('#mockHistory').innerHTML = history.slice(0, 20).map((h) => `
      <li><span class="h-dot ${h.rate || ''}"></span><span>${h.q.replace(/</g, '&lt;')}</span><span class="h-time">${fmtTime(h.ms)}</span></li>`).join('');
    $('#statDone').textContent = history.length;
    $('#statGood').textContent = history.filter((h) => h.rate === 'good').length;
    $('#statAvg').textContent = history.length ? fmtTime(history.reduce((s, h) => s + h.ms, 0) / history.length) : '–';
  }

  startBtn.addEventListener('click', () => ask(nextQuestion()));
  pauseBtn.addEventListener('click', () => { mockTimer.toggle(); setPauseLabel(); });
  guideBtn.addEventListener('click', showGuide);
  nextBtn.addEventListener('click', () => advance(null));
  mockRate.addEventListener('click', (e) => { const b = e.target.closest('[data-rate]'); if (b) advance(b.dataset.rate); });
  $('#mockClear').addEventListener('click', () => { history.length = 0; store.set('mockHistory', history); renderHistory(); });
  $$('.mock-modes .filter').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    queue = null;
    $$('.mock-modes .filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (currentQ) ask(nextQuestion());
  }));
  document.addEventListener('keydown', (e) => {
    if (current !== 'mock' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(document.activeElement.tagName) && e.key === ' ') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === ' ' && currentQ) { e.preventDefault(); mockTimer.toggle(); setPauseLabel(); }
    else if (k === 'g') showGuide();
    else if (k === 'n') currentQ ? advance(null) : ask(nextQuestion());
  });
  renderHistory();

  // "Practice" buttons elsewhere jump into the mock with a specific question
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-practice]');
    if (!btn) return;
    const [type, id] = btn.dataset.practice.split(':');
    if (type === 'design') ask(POOLS.design.find((q) => q.key === 'd:' + id));
    else if (type === 'walk') ask(POOLS.projects.find((q) => q.key === 'w:' + id));
    else if (type === 'talk') ask(POOLS.talk[Number(id)]);
    else if (type === 'fu') {
      queue = POOLS.projects.filter((q) => q.key.startsWith(`f:${id}:`));
      ask(queue.shift());
    }
    location.hash = 'mock';
  });

  /* ------------------------------------------------------------------
     Terms tab: searchable glossary with a quiz mode
     ------------------------------------------------------------------ */
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const terms = PREP.terms
    .map((t) => ({ ...t, id: 'term-' + slug(t.t) }))
    .sort((a, b) => a.t.localeCompare(b.t, 'en', { sensitivity: 'base' }));
  const termById = new Map(terms.map((t) => [t.id, t]));
  const termGrid = $('#termGrid');
  const termSearch = $('#termSearch');
  let termCat = 'All';

  const sayHtml = (t) => (t.say ? ` <span class="term-say">say "${t.say.replace(/"/g, '')}"</span>` : '');
  termGrid.innerHTML = terms.map((t) => `
    <article class="term-card" id="${t.id}" data-cat="${t.cat}">
      <div class="term-top"><span class="term-name">${t.t}</span><span class="term-cat">${t.cat}</span></div>
      <div class="term-reveal">
        ${t.full ? `<p class="term-full">${t.full}${sayHtml(t)}</p>` : t.say ? `<p class="term-full">${sayHtml(t)}</p>` : ''}
        <p class="term-what">${t.what}</p>
        ${t.eg ? `<p class="term-eg"><b>e.g.</b> ${t.eg}</p>` : ''}
      </div>
    </article>`).join('');
  const termEls = new Map($$('.term-card', termGrid).map((el) => [el.id, el]));

  const termCats = ['All', ...new Set(PREP.terms.map((t) => t.cat))];
  $('#termFilters').innerHTML = termCats.map((cat) => {
    const n = cat === 'All' ? terms.length : terms.filter((t) => t.cat === cat).length;
    return `<button class="filter" type="button" data-cat="${cat}" aria-pressed="${cat === 'All'}">${cat}<span class="n">${n}</span></button>`;
  }).join('');

  function filterTerms() {
    const q = termSearch.value.trim().toLowerCase();
    let shown = 0;
    terms.forEach((t) => {
      const hay = `${t.t} ${t.full || ''} ${t.what} ${t.eg || ''}`.toLowerCase();
      const visible = (termCat === 'All' || t.cat === termCat) && (!q || hay.includes(q));
      termEls.get(t.id).hidden = !visible;
      if (visible) shown++;
    });
    $('#termCount').textContent = shown === terms.length ? `${terms.length} terms` : `Showing ${shown} of ${terms.length}`;
  }
  $('#termFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    termCat = btn.dataset.cat;
    $$('.filter', $('#termFilters')).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    filterTerms();
    animateIn($$('.term-card:not([hidden])', termGrid));
  });
  termSearch.addEventListener('input', filterTerms);
  document.addEventListener('keydown', (e) => {
    if (current === 'terms' && e.key === '/' && document.activeElement !== termSearch) { e.preventDefault(); termSearch.focus(); }
  });

  const quizTerms = $('#quizTerms');
  quizTerms.checked = store.get('quizTerms', false);
  const applyQuiz = () => {
    termGrid.classList.toggle('quiz', quizTerms.checked);
    $$('.term-card.revealed', termGrid).forEach((c) => c.classList.remove('revealed'));
    store.set('quizTerms', quizTerms.checked);
  };
  quizTerms.addEventListener('change', applyQuiz);
  termGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.term-card');
    if (card && termGrid.classList.contains('quiz')) card.classList.toggle('revealed');
  });
  applyQuiz();
  filterTerms();

  // Jump to a term from anywhere, with a way back to where you were
  let returnTo = null;
  const termsBack = $('#termsBack');
  function openTerm(id) {
    if (current !== 'terms') {
      returnTo = { tab: current, y: scrollY };
      $('span', termsBack).textContent = $(`.tabs a[data-tab="${current}"]`).textContent;
      termsBack.hidden = false;
    }
    termSearch.value = '';
    termCat = 'All';
    $$('.filter', $('#termFilters')).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === 'All')));
    filterTerms();
    const focus = () => {
      const el = termEls.get(id);
      el.classList.add('revealed');
      el.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
      el.classList.remove('flash-hl'); void el.offsetWidth; el.classList.add('flash-hl');
    };
    if (current === 'terms') focus();
    else { afterEnter = focus; location.hash = 'terms'; }
  }
  $('button', termsBack).addEventListener('click', () => {
    if (!returnTo) return;
    pendingScroll = returnTo.y;
    termsBack.hidden = true;
    location.hash = returnTo.tab;
    returnTo = null;
  });

  /* ------------------------------------------------------------------
     Tap-to-explain: underline known terms across the site
     ------------------------------------------------------------------ */
  const aliasToTerm = new Map();
  const csAliases = [];
  const ciAliases = [];
  terms.forEach((t) => (t.m || [t.t]).forEach((alias) => {
    if (/[A-Z]/.test(alias)) { csAliases.push(alias); aliasToTerm.set(alias, t); }
    else { ciAliases.push(alias); aliasToTerm.set(alias.toLowerCase(), t); }
  }));
  const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const aliasRe = (list, flags) => new RegExp(`(?<![\\w-])(${list.sort((a, b) => b.length - a.length).map(reEscape).join('|')})s?(?![\\w-])`, flags);
  const CS_RE = aliasRe(csAliases, 'g');
  const CI_RE = aliasRe(ciAliases, 'gi');
  const SKIP = 'pre, code, textarea, input, button, a, svg, kbd, script, style, .term, .tabs, .brand, .kicker, .filter, .flash-cat, .tags, .mock-kind, .diff, .proj-tab, .term-pop, #page-terms, .ready-list, .no-terms';
  const BLOCKS = 'p, li, td, th, h2, h3, h4, summary, .flash-q, .mock-q, .mock-sub';

  function linkTerms(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const seen = new Map(); // block element -> term ids already linked in it

    nodes.forEach((node) => {
      const text = node.nodeValue;
      const hits = [];
      for (const [re, cs] of [[CS_RE, true], [CI_RE, false]]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text))) {
          const t = aliasToTerm.get(cs ? m[1] : m[1].toLowerCase());
          if (t) hits.push({ start: m.index, end: m.index + m[0].length, t });
        }
      }
      if (!hits.length) return;
      hits.sort((a, b) => a.start - b.start || b.end - a.end);
      const block = node.parentElement.closest(BLOCKS) || root;
      if (!seen.has(block)) seen.set(block, new Set());
      const used = seen.get(block);
      const keep = [];
      let lastEnd = -1;
      hits.forEach((h) => {
        if (h.start < lastEnd || used.has(h.t.id)) return;
        used.add(h.t.id);
        keep.push(h);
        lastEnd = h.end;
      });
      if (!keep.length) return;

      const frag = document.createDocumentFragment();
      let pos = 0;
      keep.forEach((h) => {
        if (h.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, h.start)));
        const span = document.createElement('span');
        span.className = 'term';
        span.dataset.term = h.t.id;
        span.tabIndex = 0;
        span.textContent = text.slice(h.start, h.end);
        frag.appendChild(span);
        pos = h.end;
      });
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      node.replaceWith(frag);
    });
  }

  const pop = $('#termPop');
  let popFor = null;
  let hideTimer = null;
  function showPop(el) {
    clearTimeout(hideTimer);
    const t = termById.get(el.dataset.term);
    if (!t) return;
    if (popFor && popFor !== el) popFor.classList.remove('active');
    popFor = el;
    el.classList.add('active');
    pop.innerHTML = `
      <div class="pop-head"><span class="pop-term">${t.t}</span><span class="term-cat">${t.cat}</span></div>
      ${t.full ? `<p class="pop-full">${t.full}</p>` : ''}
      ${t.say ? `<p class="term-say">say "${t.say.replace(/"/g, '')}"</p>` : ''}
      <p class="pop-what">${t.what}</p>
      ${t.eg ? `<p class="term-eg"><b>e.g.</b> ${t.eg}</p>` : ''}
      <button class="mini" type="button" data-open-term="${t.id}"><svg><use href="#i-book"/></svg> Open in Terms</button>`;
    pop.hidden = false;
    placePop(el);
  }
  function placePop(el) {
    const r = el.getBoundingClientRect();
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), innerWidth - pw - 12);
    const below = r.bottom + 10 + ph < innerHeight;
    pop.style.left = left + 'px';
    pop.style.top = (below ? r.bottom + 8 : r.top - ph - 8) + 'px';
    pop.dataset.side = below ? 'below' : 'above';
  }
  function hidePop() {
    pop.hidden = true;
    if (popFor) popFor.classList.remove('active');
    popFor = null;
  }
  const scheduleHide = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hidePop, 220); };

  // Capture phase so tapping a term inside a flashcard or accordion doesn't also flip or toggle it
  document.addEventListener('click', (e) => {
    const term = e.target.closest && e.target.closest('.term');
    if (term) {
      e.preventDefault();
      e.stopPropagation();
      if (popFor === term && !pop.hidden) hidePop(); else showPop(term);
      return;
    }
    const open = e.target.closest && e.target.closest('[data-open-term]');
    if (open) { e.stopPropagation(); hidePop(); openTerm(open.dataset.openTerm); return; }
    if (!pop.hidden && !pop.contains(e.target)) hidePop();
  }, true);
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const term = e.target.closest('.term');
    if (term) { clearTimeout(hideTimer); hideTimer = setTimeout(() => showPop(term), 140); }
    else if (pop.contains(e.target)) clearTimeout(hideTimer);
  });
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('.term') || pop.contains(e.target)) scheduleHide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePop();
    if (e.key === 'Enter' && document.activeElement.classList.contains('term')) { e.preventDefault(); showPop(document.activeElement); }
  });
  // Follow the term while scrolling; close once it leaves the screen
  window.addEventListener('scroll', () => {
    if (pop.hidden || !popFor) return;
    const r = popFor.getBoundingClientRect();
    if (!popFor.isConnected || r.bottom < 0 || r.top > innerHeight) hidePop(); else placePop(popFor);
  }, { passive: true });

  /* ------------------------------------------------------------------
     Export: PDF (via the print dialog), Quizlet/Anki text, Markdown
     ------------------------------------------------------------------ */
  const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const oneLine = (s) => s.replace(/[\t\r\n]+/g, ' ').trim();
  const byCat = (items, key) => items.reduce((acc, it) => { (acc[it[key]] = acc[it[key]] || []).push(it); return acc; }, {});
  const today = () => new Date().toISOString().slice(0, 10);

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('Downloaded ' + name);
  }

  const PRINT_CSS = `
    @page { margin: 16mm; }
    body { font: 10.5pt/1.5 -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif; color: #111; margin: 0; }
    h1 { font-size: 20pt; margin: 0 0 4pt; } .sub { color: #666; margin: 0 0 14pt; }
    h2 { font-size: 13.5pt; margin: 18pt 0 8pt; padding-bottom: 3pt; border-bottom: 1.5pt solid #059669; break-after: avoid; }
    h3 { font-size: 11pt; margin: 12pt 0 4pt; break-after: avoid; }
    .cols { columns: 2; column-gap: 18pt; }
    .item { break-inside: avoid; margin: 0 0 8pt; }
    .t { font-weight: 700; } .full { color: #444; font-style: italic; } .say { color: #059669; font-size: 9pt; }
    .eg { color: #555; font-size: 9.5pt; } .q { font-weight: 600; }
    .note { white-space: pre-wrap; border-left: 3pt solid #059669; padding: 4pt 0 4pt 10pt; margin: 4pt 0 10pt; }
    ol, ul { margin: 2pt 0 6pt; padding-left: 16pt; } li { margin: 1pt 0; }`;

  function printDoc(title, body) {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PRINT_CSS}</style></head><body><h1>${escapeHtml(title)}</h1><p class="sub">Billy Dang · IBM Cloud Developer prep · ${today()}</p>${body}</body></html>`;
    frame.onload = () => {
      const w = frame.contentWindow;
      w.addEventListener('afterprint', () => frame.remove());
      setTimeout(() => frame.remove(), 120000);
      w.focus();
      w.print();
    };
    document.body.appendChild(frame);
    showToast('Pick "Save as PDF" in the print window');
  }

  // Each section knows how to render itself as print HTML and as Markdown
  const notesList = () => [
    ['Pitch', $('#pitchText').value],
    ['Why IBM?', $('#whyIbmText').value],
    ...PREP.projects.map((p) => [`${p.name} walkthrough`, $(`textarea[data-store="walk:${p.id}"]`).value]),
  ];
  const pickedQuestions = () => $$('.checklist[data-group="ask"] input:checked').map((i) => i.nextElementSibling.textContent);
  const SECTIONS = {
    notes: {
      html: () => `<h2>My notes</h2>${notesList().map(([h, v]) => `<h3>${escapeHtml(h)}</h3><div class="note">${escapeHtml(v)}</div>`).join('')}` +
        (pickedQuestions().length ? `<h3>Questions I'll ask</h3><ul>${pickedQuestions().map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ul>` : ''),
      md: () => `## My notes\n\n${notesList().map(([h, v]) => `### ${h}\n\n${v}\n`).join('\n')}` +
        (pickedQuestions().length ? `\n### Questions I'll ask\n\n${pickedQuestions().map((q) => `- ${q}`).join('\n')}\n` : ''),
    },
    terms: {
      html: () => `<h2>Terms &amp; acronyms</h2>` + Object.entries(byCat(terms, 'cat')).map(([cat, list]) => `<h3>${cat}</h3><div class="cols">${list.map((t) => `
        <div class="item"><span class="t">${t.t}</span>${t.full ? ` <span class="full">${t.full}</span>` : ''}${t.say ? ` <span class="say">say "${t.say.replace(/"/g, '')}"</span>` : ''}<br>${t.what}${t.eg ? `<br><span class="eg">e.g. ${t.eg}</span>` : ''}</div>`).join('')}</div>`).join(''),
      md: () => `## Terms & acronyms\n\n` + Object.entries(byCat(terms, 'cat')).map(([cat, list]) => `### ${cat}\n\n${list.map((t) =>
        `- **${t.t}**${t.full ? ` (*${t.full}*)` : ''}${t.say ? `, say "${t.say.replace(/"/g, '')}"` : ''}: ${t.what}${t.eg ? ` e.g. ${t.eg}` : ''}`).join('\n')}\n`).join('\n'),
      anki: () => terms.map((t) => `${t.t}\t${oneLine(`${t.full ? t.full + ': ' : ''}${t.what}${t.eg ? ' e.g. ' + t.eg : ''}`)}`).join('\n'),
    },
    cards: {
      html: () => `<h2>Flashcards</h2>` + Object.entries(byCat(cards, 'c')).map(([cat, list]) => `<h3>${cat}</h3>${list.map((c) => `
        <div class="item"><div class="q">${c.q}</div>${c.a}${c.you ? `<br><span class="eg">You: ${c.you}</span>` : ''}</div>`).join('')}`).join(''),
      md: () => `## Flashcards\n\n` + Object.entries(byCat(cards, 'c')).map(([cat, list]) => `### ${cat}\n\n${list.map((c) =>
        `**${plain(c.q)}**\n\n${plain(c.a)}${c.you ? `\n\n_You: ${plain(c.you)}_` : ''}\n`).join('\n')}`).join('\n'),
      anki: () => cards.map((c) => `${oneLine(plain(c.q))}\t${oneLine(plain(c.a) + (c.you ? ' (You: ' + plain(c.you) + ')' : ''))}`).join('\n'),
    },
    design: {
      html: () => `<h2>Design scenarios</h2>${PREP.scenarios.map((s) => `<div class="item"><h3>${s.title}</h3><p>${s.prompt}</p>
        <b>Ask first</b><ul>${s.clarify.map((c) => `<li>${c}</li>`).join('')}</ul>
        <b>Cover</b><ol>${s.steps.map((c) => `<li>${c}</li>`).join('')}</ol>
        <b>Tradeoffs</b><ul>${s.tradeoffs.map((c) => `<li>${c}</li>`).join('')}</ul></div>`).join('')}`,
      md: () => `## Design scenarios\n\n${PREP.scenarios.map((s) => `### ${s.title}\n\n${s.prompt}\n\n**Ask first**\n${s.clarify.map((c) => `- ${plain(c)}`).join('\n')}\n\n**Cover**\n${s.steps.map((c, i) => `${i + 1}. ${plain(c)}`).join('\n')}\n\n**Tradeoffs**\n${s.tradeoffs.map((c) => `- ${plain(c)}`).join('\n')}\n`).join('\n')}`,
    },
    followups: {
      html: () => `<h2>Project follow-ups</h2>${PREP.projects.map((p) => `<h3>${p.name}</h3>${p.followups.map(([q, a]) => `<div class="item"><div class="q">${q}</div>${a}</div>`).join('')}`).join('')}`,
      md: () => `## Project follow-ups\n\n${PREP.projects.map((p) => `### ${p.name}\n\n${p.followups.map(([q, a]) => `**${q}**\n\n${a}\n`).join('\n')}`).join('\n')}`,
    },
  };
  const EXPORTS = {
    all: { title: 'IBM Tech Prep — Study guide', file: 'ibm-prep-study-guide', parts: ['notes', 'terms', 'cards', 'design', 'followups'] },
    notes: { title: 'IBM Tech Prep — My notes', file: 'ibm-prep-my-notes', parts: ['notes'] },
    terms: { title: 'IBM Tech Prep — Terms & acronyms', file: 'ibm-prep-terms', parts: ['terms'] },
    cards: { title: 'IBM Tech Prep — Flashcards', file: 'ibm-prep-flashcards', parts: ['cards'] },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-export] [data-fmt]');
    if (!btn) return;
    const exp = EXPORTS[btn.closest('[data-export]').dataset.export];
    const fmt = btn.dataset.fmt;
    if (fmt === 'pdf') printDoc(exp.title, exp.parts.map((p) => SECTIONS[p].html()).join(''));
    else if (fmt === 'md') download(`${exp.file}.md`, `# ${exp.title}\n\n_Exported ${today()}_\n\n` + exp.parts.map((p) => SECTIONS[p].md()).join('\n'));
    else if (fmt === 'anki') {
      download(`${exp.file}-quizlet-anki.txt`, SECTIONS[exp.parts[0]].anki());
      setTimeout(() => showToast('Quizlet: Import → paste. Anki: File → Import (tab-separated)'), 1900);
    }
  });

  /* ------------------------------------------------------------------
     Links between this site and the portfolio: the local copy when this
     site runs on your Mac, the published one otherwise
     ------------------------------------------------------------------ */
  function portfolioUrl() {
    if (location.protocol === 'file:') return new URL('../bpdang07_portfolio/index.html', location.href).href;
    if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return `${location.protocol}//${location.hostname}:8080/`;
    return 'https://bpdang07.github.io/bpdang07_portfolio/';
  }
  ['#portfolioLink', '#portfolioLink2'].forEach((sel) => { $(sel).href = portfolioUrl(); });

  /* ------------------------------------------------------------------
     Back up and restore progress (each browser and address keeps its own)
     ------------------------------------------------------------------ */
  $('#backupProgress').addEventListener('click', () => {
    const data = {};
    try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => { data[k] = localStorage.getItem(k); }); } catch (e) { /* storage blocked */ }
    download(`ibm-prep-progress-${today()}.json`, JSON.stringify({ app: 'ibm-tech-prep', version: 1, saved: new Date().toISOString(), data }, null, 2));
  });
  $('#restoreProgress').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let backup;
    try {
      backup = JSON.parse(await file.text());
      if (backup.app !== 'ibm-tech-prep' || !backup.data || typeof backup.data !== 'object') throw new Error('not a backup');
    } catch (err) {
      showToast('That file isn\'t a progress backup from this site');
      return;
    }
    if (!window.confirm(`Replace the progress in this browser with the backup from ${new Date(backup.saved).toLocaleString()}?`)) return;
    store.clear();
    try {
      Object.entries(backup.data).forEach(([k, v]) => { if (k.startsWith(PREFIX) && typeof v === 'string') localStorage.setItem(k, v); });
    } catch (err) { /* storage blocked */ }
    location.reload();
  });

  // Tick a Plan checklist item from code, e.g. when a goal is reached on the Assess tab
  function autoCheck(id) {
    const input = $(`.checklist[data-group="plan"] input[data-id="${id}"]`);
    if (!input || input.checked) return;
    input.checked = true;
    checks['plan:' + id] = true;
    store.set('checks', checks);
    updatePlanCount();
    showToast('Checked off on your Plan tab');
  }

  /* ------------------------------------------------------------------
     Assess: HackerRank-style challenges run against real test cases
     ------------------------------------------------------------------ */
  const challenges = PREP.challenges;
  const passed = store.get('challenges', {}); // id -> true once every test has passed
  const builtTests = new Map();
  const testsFor = (c) => {
    if (!builtTests.has(c.id)) builtTests.set(c.id, c.tests.map((t) => (t.make ? t.make() : t)));
    return builtTests.get(c.id);
  };
  const diffLabel = (d) => (d === 'E' ? 'Easy' : 'Medium');
  const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const chalPicker = $('#chalPicker');
  const chalStatement = $('#chalStatement');
  const chalResults = $('#chalResults');
  const codeEl = $('#chalCode');
  const gutter = $('#chalGutter');
  const chalClock = $('#chalClock');
  const langSelect = $('#chalLang');
  let chal = null;
  let chalLang = store.get('chalLang', 'py');
  let chalBusy = false;
  langSelect.value = chalLang;

  // Values written the way the chosen language writes them: True/None in Python, true/null in JavaScript
  function showValue(v, max = 400) {
    const fmt = (x) => Array.isArray(x) ? `[${x.map(fmt).join(', ')}]`
      : typeof x === 'string' ? JSON.stringify(x)
      : typeof x === 'boolean' ? (chalLang === 'py' ? (x ? 'True' : 'False') : String(x))
      : x === null || x === undefined ? (chalLang === 'py' ? 'None' : 'null')
      : String(x);
    const text = fmt(v);
    return text.length > max ? `${text.slice(0, max)} … (${text.length.toLocaleString()} characters)` : text;
  }

  const starter = (c) => {
    if (c.starter) return c.starter[chalLang];
    const names = c.params.map((p) => p[1]).join(', ');
    return chalLang === 'py'
      ? `def ${c.fn}(${names}):\n    # Write your code here\n    pass\n`
      : `function ${c.fn}(${names}) {\n  // Write your code here\n}\n`;
  };
  const codeKey = () => `code:${chal.id}:${chalLang}`;

  chalPicker.innerHTML = challenges.map((c, i) => `
    <button class="chal-pick" type="button" role="tab" data-id="${c.id}" aria-selected="false">
      <span class="chal-num mono">${String(i + 1).padStart(2, '0')}</span>
      <span class="chal-pick-body">
        <strong>${c.title}</strong>
        <span class="chal-pick-meta"><span class="diff ${c.diff}">${diffLabel(c.diff)}</span>${c.tags[0]}</span>
      </span>
      <span class="chal-done" title="Passed"><svg><use href="#i-check"/></svg></span>
    </button>`).join('');

  function paintPicker() {
    $$('.chal-pick', chalPicker).forEach((b) => {
      b.setAttribute('aria-selected', String(!!chal && b.dataset.id === chal.id));
      b.classList.toggle('passed', !!passed[b.dataset.id]);
    });
  }

  function renderStatement() {
    const c = chal;
    const samples = testsFor(c).slice(0, c.samples);
    chalStatement.innerHTML = `
      <div class="chal-meta"><span class="diff ${c.diff}">${diffLabel(c.diff)}</span><span class="mono muted">~${c.time} min</span>${c.tags.map((t) => `<span class="chal-tag">${t}</span>`).join('')}</div>
      <h3>${c.title}</h3>
      <div class="chal-story">${c.story}</div>
      <h4>Function description</h4>
      <p>Complete the function <code>${c.fn}</code>. It has the following parameter${c.params.length > 1 ? 's' : ''}:</p>
      <ul class="dot-list">${c.params.map(([type, name, desc]) => `<li><code>${type} ${name}</code>: ${desc}</li>`).join('')}</ul>
      <p><strong>Returns</strong> <code>${c.returns[0]}</code>: ${c.returns[1]}</p>
      <h4>Constraints</h4>
      <ul class="dot-list">${c.constraints.map((k) => `<li>${k}</li>`).join('')}</ul>
      ${samples.map((t, i) => `
        <h4>Sample ${i}</h4>
        <div class="sample">
          <span class="mono muted">Input</span>
          <pre>${escapeHtml(c.params.map(([, name], j) => `${name} = ${showValue(t.args[j])}`).join('\n'))}</pre>
          <span class="mono muted">Output</span>
          <pre>${escapeHtml(showValue(t.out))}</pre>
          ${t.why ? `<p class="sample-why">${t.why}</p>` : ''}
        </div>`).join('')}
      <details class="fu chal-help"><summary>${chevron}<span>Hint</span></summary><p>${c.hint}</p></details>
      <details class="fu chal-help"><summary>${chevron}<span>Approach and solution</span></summary>
        <p>${c.approach}</p>
        <p><strong>Complexity:</strong> ${c.complexity}</p>
        <pre><code>${escapeHtml(c.solution[chalLang])}</code></pre>
      </details>`;
    linkTerms(chalStatement);
  }

  // Clock: starts on the first keystroke, stops when every test passes
  let clockStart = 0;
  let clockTimer = 0;
  let clockDone = false;
  function resetClock() {
    clearInterval(clockTimer);
    clockStart = 0;
    clockDone = false;
    chalClock.textContent = `0:00 / ${chal.time}:00`;
    chalClock.classList.remove('over', 'done');
  }
  function startClock() {
    if (clockStart || clockDone) return;
    clockStart = performance.now();
    clockTimer = setInterval(() => {
      const ms = performance.now() - clockStart;
      chalClock.textContent = `${fmtTime(ms)} / ${chal.time}:00`;
      chalClock.classList.toggle('over', ms > chal.time * 60000);
    }, 500);
  }
  function stopClock() {
    clearInterval(clockTimer);
    clockDone = true;
    chalClock.classList.add('done');
    return clockStart ? performance.now() - clockStart : 0;
  }

  function updateGutter() {
    const lines = codeEl.value.split('\n').length;
    if (Number(gutter.dataset.lines) !== lines) {
      gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
      gutter.dataset.lines = lines;
    }
    gutter.scrollTop = codeEl.scrollTop;
  }

  function openChallenge(id) {
    chal = challenges.find((c) => c.id === id) || challenges[0];
    store.set('chal', chal.id);
    renderStatement();
    codeEl.value = store.get(codeKey(), starter(chal));
    codeEl.scrollTop = 0;
    updateGutter();
    chalResults.innerHTML = '';
    resetClock();
    paintPicker();
  }

  // Editor: Tab indents, Shift+Tab outdents, Enter keeps indentation, Esc lets the next Tab leave
  const indentUnit = () => (chalLang === 'py' ? '    ' : '  ');
  function insertText(text) {
    if (!document.execCommand('insertText', false, text)) {
      codeEl.setRangeText(text, codeEl.selectionStart, codeEl.selectionEnd, 'end');
      codeEl.dispatchEvent(new Event('input'));
    }
  }
  function shiftLines(outdent) {
    const { value, selectionStart: s, selectionEnd: e } = codeEl;
    const from = value.lastIndexOf('\n', s - 1) + 1;
    const to = e > s && value[e - 1] === '\n' ? e - 1 : e;
    const unit = indentUnit();
    const block = value.slice(from, to);
    const lines = block.split('\n');
    const changed = lines.map((l) => (outdent ? l.replace(new RegExp(`^ {1,${unit.length}}`), '') : unit + l)).join('\n');
    codeEl.setSelectionRange(from, to);
    insertText(changed);
    const firstDelta = (outdent ? lines[0].length - lines[0].replace(new RegExp(`^ {1,${unit.length}}`), '').length : -unit.length);
    codeEl.setSelectionRange(Math.max(from, s - firstDelta), from + changed.length + (e - to));
  }
  let escaped = false;
  codeEl.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runChallenge(false); return; }
    if (e.key === 'Escape') { escaped = true; return; }
    if (e.key === 'Tab' && !escaped) {
      e.preventDefault();
      const multi = codeEl.value.slice(codeEl.selectionStart, codeEl.selectionEnd).includes('\n');
      if (e.shiftKey || multi) shiftLines(e.shiftKey);
      else insertText(indentUnit());
    } else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const { value, selectionStart: s } = codeEl;
      const line = value.slice(value.lastIndexOf('\n', s - 1) + 1, s);
      let indent = line.match(/^[ \t]*/)[0];
      if (/[:{[(]\s*$/.test(line)) indent += indentUnit();
      insertText('\n' + indent);
    }
    escaped = false;
  });
  let codeSaveTimer;
  codeEl.addEventListener('input', () => {
    updateGutter();
    startClock();
    clearTimeout(codeSaveTimer);
    codeSaveTimer = setTimeout(() => store.set(codeKey(), codeEl.value), 300);
  });
  codeEl.addEventListener('scroll', () => { gutter.scrollTop = codeEl.scrollTop; });

  langSelect.addEventListener('change', () => {
    store.set(codeKey(), codeEl.value);
    chalLang = langSelect.value;
    store.set('chalLang', chalLang);
    const keepClock = clockStart;
    renderStatement();
    codeEl.value = store.get(codeKey(), starter(chal));
    updateGutter();
    chalResults.innerHTML = '';
    if (!keepClock) resetClock();
  });
  $('#chalReset').addEventListener('click', () => {
    if (codeEl.value !== starter(chal) && !window.confirm('Replace your code with the empty starter?')) return;
    codeEl.value = starter(chal);
    store.set(codeKey(), codeEl.value);
    updateGutter();
    chalResults.innerHTML = '';
  });
  chalPicker.addEventListener('click', (e) => {
    const b = e.target.closest('.chal-pick');
    if (!b || chalBusy) return;
    if (chal) store.set(codeKey(), codeEl.value);
    openChallenge(b.dataset.id);
    const work = $('#chalWork');
    if (work.getBoundingClientRect().top < 0 || work.getBoundingClientRect().top > innerHeight * 0.6) {
      work.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });

  function testRow(i, isSample) {
    return `<li class="test pending" data-i="${i}">
      <div class="test-head"><span class="test-icon" aria-hidden="true"></span><span class="test-name">${isSample ? `Sample ${i}` : `Hidden test ${i}`}</span><span class="test-status muted">Waiting</span><span class="test-ms mono muted"></span></div>
      <div class="test-body" hidden></div>
    </li>`;
  }
  function paintRow(li, { ok, status, ms, detail }) {
    li.className = `test ${ok ? 'pass' : 'fail'}`;
    $('.test-icon', li).innerHTML = `<svg><use href="#${ok ? 'i-check' : 'i-x'}"/></svg>`;
    $('.test-status', li).textContent = status;
    $('.test-ms', li).textContent = ms === undefined ? '' : `${Math.max(1, Math.round(ms))} ms`;
    const body = $('.test-body', li);
    body.innerHTML = detail || '';
    body.hidden = !detail;
  }

  async function runChallenge(all) {
    if (chalBusy || !chal) return;
    chalBusy = true;
    const c = chal;
    const lang = chalLang;
    const tests = testsFor(c).slice(0, all ? undefined : c.samples);
    store.set(codeKey(), codeEl.value);
    $('#chalRun').disabled = $('#chalSubmit').disabled = langSelect.disabled = true;
    chalPicker.classList.add('locked');
    chalResults.innerHTML = `
      <p class="run-status" id="runStatus"><span class="spinner" aria-hidden="true"></span><span>Running…</span></p>
      <ol class="test-list">${tests.map((_, i) => testRow(i, i < c.samples)).join('')}</ol>`;
    const rowEl = (i) => $(`.test[data-i="${i}"]`, chalResults);
    const setStatus = (text) => { const el = $('#runStatus span:last-child'); if (el) el.textContent = text; };

    let passCount = 0;
    const res = await CodeRunner.run(lang, codeEl.value, c.fn, tests, {
      onStatus: setStatus,
      onResult: (i, r) => {
        const t = tests[i];
        const isSample = i < c.samples;
        const ok = !r.error && sameValue(r.got, t.out);
        if (ok) passCount++;
        const io = isSample ? `
          <span class="mono muted">Input</span><pre>${escapeHtml(c.params.map(([, name], j) => `${name} = ${showValue(t.args[j])}`).join('\n'))}</pre>
          <span class="mono muted">Expected</span><pre>${escapeHtml(showValue(t.out))}</pre>` : '';
        const yours = r.error ? `<span class="mono muted">Error</span><pre class="err">${escapeHtml(r.error)}</pre>` : `<span class="mono muted">Your output</span><pre>${escapeHtml(showValue(r.got))}</pre>`;
        paintRow(rowEl(i), {
          ok, ms: r.ms,
          status: ok ? 'Passed' : r.error ? 'Runtime error' : 'Wrong answer',
          detail: isSample ? io + yours : r.error ? yours : '',
        });
      },
    });

    if (res.compileError) {
      tests.forEach((_, i) => paintRow(rowEl(i), { ok: false, status: 'Not run' }));
    } else if (res.timedOut !== null) {
      tests.forEach((_, i) => {
        if (i === res.timedOut) paintRow(rowEl(i), { ok: false, status: 'Time limit exceeded', detail: `<p class="hint">Still running after ${CodeRunner.LIMIT_MS[lang] / 1000} seconds. Look for an infinite loop, or an O(n²) approach on a large input.</p>` });
        else if (i > res.timedOut) paintRow(rowEl(i), { ok: false, status: 'Not run' });
      });
    }

    const allPassed = !res.compileError && res.timedOut === null && passCount === tests.length;
    let summary;
    if (res.compileError) summary = `<div class="box warn run-error"><strong>Your code didn't run.</strong><pre class="err">${escapeHtml(res.compileError)}</pre></div>`;
    else if (allPassed && all) {
      const firstPass = !passed[c.id];
      passed[c.id] = true;
      store.set('challenges', passed);
      const took = stopClock();
      paintPicker();
      updateReady();
      if (Object.keys(passed).length >= 6) autoCheck('assess6');
      summary = `<div class="box run-pass"><strong>All ${tests.length} tests passed${took >= 1000 ? ` in ${fmtTime(took)}` : ''}.</strong> ${firstPass ? 'Nice. ' : ''}Now say the time and space complexity out loud, then open "Approach and solution" to compare.</div>`;
    } else if (allPassed) summary = `<div class="box run-pass"><strong>Both samples pass.</strong> Submit to run the hidden tests too.</div>`;
    else summary = `<p class="run-score"><strong>${passCount} of ${tests.length}</strong> ${all ? 'tests' : 'samples'} passed.${all && passCount ? ' On a real assessment that would still earn partial credit.' : ''}</p>`;

    const logs = res.logs.length ? `<details class="fu stdout" open><summary>${chevron}<span>Printed output</span></summary><pre>${escapeHtml(res.logs.join('\n'))}</pre></details>` : '';
    if (chal === c && chalLang === lang) {
      $('#runStatus').outerHTML = summary;
      chalResults.insertAdjacentHTML('beforeend', logs);
    }
    $('#chalRun').disabled = $('#chalSubmit').disabled = langSelect.disabled = false;
    chalPicker.classList.remove('locked');
    chalBusy = false;
  }
  $('#chalRun').addEventListener('click', () => runChallenge(false));
  $('#chalSubmit').addEventListener('click', () => runChallenge(true));

  paintPicker();
  openChallenge(store.get('chal', challenges[0].id));

  /* ------------------------------------------------------------------
     Assess: multiple-choice quiz
     ------------------------------------------------------------------ */
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const quizTopics = ['All topics', ...new Set(PREP.quiz.map((q) => q.c))];
  $('#quizTopic').innerHTML = quizTopics.map((t) => {
    const n = t === 'All topics' ? PREP.quiz.length : PREP.quiz.filter((q) => q.c === t).length;
    return `<option value="${t}">${t} (${n})</option>`;
  }).join('');
  let quizN = '10';
  $$('#quizCount button').forEach((b) => b.addEventListener('click', () => {
    quizN = b.dataset.n;
    $$('#quizCount button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  }));

  let quiz = null;
  let lastQuiz = null;
  const isRight = (item) => item.pick !== null && item.opts[item.pick].right;

  function paintQuizBest() {
    const best = store.get('quizBest', null);
    $('#quizBest').textContent = best ? `best: ${best.score}% on ${best.n} questions` : `${PREP.quiz.length} questions`;
  }

  function startQuiz(questions) {
    const items = questions.map((q) => ({ src: q, opts: shuffle(q.o.map((text, k) => ({ text, right: k === q.a }))), pick: null }));
    quiz = { items, i: 0, deadline: Date.now() + items.length * 60000 };
    quiz.timer = setInterval(tickQuiz, 250);
    $('#quizSetup').hidden = true;
    $('#quizResult').hidden = true;
    $('#quizRun').hidden = false;
    renderQuizQ();
    tickQuiz();
  }
  function tickQuiz() {
    if (!quiz) return;
    const left = Math.max(0, quiz.deadline - Date.now());
    const clock = $('#quizClock');
    clock.textContent = fmtTime(left + 999);
    clock.classList.toggle('low', left < 60000);
    if (left <= 0) finishQuiz(true);
  }
  function renderQuizQ() {
    const item = quiz.items[quiz.i];
    $('#quizProgress').textContent = `Question ${quiz.i + 1} of ${quiz.items.length}`;
    $('#quizBar').style.width = pct(quiz.items.filter((it) => it.pick !== null).length, quiz.items.length) + '%';
    $('#quizCat').textContent = item.src.c;
    $('#quizQ').textContent = item.src.q;
    $('#quizOpts').innerHTML = item.opts.map((o, k) => `
      <button class="quiz-opt" type="button" role="radio" aria-checked="${item.pick === k}" data-k="${k}">
        <span class="quiz-key mono">${'ABCD'[k]}</span><span>${escapeHtml(o.text)}</span>
      </button>`).join('');
    $('#quizPrev').disabled = quiz.i === 0;
    const last = quiz.i === quiz.items.length - 1;
    $('#quizNext').innerHTML = last ? 'Finish <svg class="ico"><use href="#i-check"/></svg>' : 'Next <svg class="ico"><use href="#i-next"/></svg>';
  }
  function pickOption(k) {
    if (!quiz) return;
    quiz.items[quiz.i].pick = k;
    $$('.quiz-opt', $('#quizOpts')).forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.k) === k)));
    $('#quizBar').style.width = pct(quiz.items.filter((it) => it.pick !== null).length, quiz.items.length) + '%';
  }
  $('#quizOpts').addEventListener('click', (e) => { const b = e.target.closest('.quiz-opt'); if (b) pickOption(Number(b.dataset.k)); });
  $('#quizPrev').addEventListener('click', () => { if (quiz && quiz.i > 0) { quiz.i--; renderQuizQ(); } });
  $('#quizNext').addEventListener('click', () => {
    if (!quiz) return;
    if (quiz.i < quiz.items.length - 1) { quiz.i++; renderQuizQ(); return; }
    const blank = quiz.items.filter((it) => it.pick === null).length;
    if (blank && !window.confirm(`${blank} question${blank === 1 ? ' is' : 's are'} unanswered. Finish anyway?`)) return;
    finishQuiz(false);
  });
  $('#quizStart').addEventListener('click', () => {
    const topic = $('#quizTopic').value;
    const pool = PREP.quiz.filter((q) => topic === 'All topics' || q.c === topic);
    startQuiz(shuffle(pool).slice(0, quizN === 'all' ? pool.length : Number(quizN)));
  });

  function finishQuiz(timeUp) {
    clearInterval(quiz.timer);
    const { items } = quiz;
    lastQuiz = quiz;
    quiz = null;
    const right = items.filter(isRight).length;
    const score = pct(right, items.length);
    const best = store.get('quizBest', null);
    if (items.length >= 10 && (!best || score > best.score)) store.set('quizBest', { score, n: items.length, date: today() });
    if (score >= 80 && items.length >= 20) autoCheck('quiz80');
    paintQuizBest();

    const byTopic = {};
    items.forEach((it) => {
      const t = byTopic[it.src.c] || (byTopic[it.src.c] = { right: 0, n: 0 });
      t.n++;
      if (isRight(it)) t.right++;
    });
    const missed = items.filter((it) => !isRight(it)).length;
    const result = $('#quizResult');
    $('#quizRun').hidden = true;
    result.hidden = false;
    result.innerHTML = `
      <div class="quiz-score">
        <div class="quiz-big"><strong>${score}%</strong><span>${right} of ${items.length} right${timeUp ? ' · time ran out' : ''}</span></div>
        <ul class="ready-list quiz-topics">${Object.entries(byTopic).sort((a, b) => a[1].right / a[1].n - b[1].right / b[1].n).map(([t, s]) => `
          <li><div class="row"><span>${t}</span><span>${s.right}/${s.n}</span></div><div class="mini-bar"><i style="width:${pct(s.right, s.n)}%"></i></div></li>`).join('')}</ul>
      </div>
      <div class="quiz-actions">
        <button class="btn btn-primary btn-sm" type="button" data-quiz="new"><svg class="ico"><use href="#i-reset"/></svg> New quiz</button>
        ${missed ? `<button class="btn btn-ghost btn-sm" type="button" data-quiz="missed">Retry the ${missed} I missed</button>` : ''}
      </div>
      <h4 class="quiz-review-head">Review</h4>
      <ol class="quiz-review">${items.map((it) => {
        const ok = isRight(it);
        const correct = it.opts.find((o) => o.right).text;
        return `<li class="${ok ? 'ok' : 'bad'}">
          <p class="rq">${escapeHtml(it.src.q)}</p>
          ${ok ? '' : `<p class="ra wrong"><svg><use href="#i-x"/></svg>${it.pick === null ? 'No answer' : escapeHtml(it.opts[it.pick].text)}</p>`}
          <p class="ra right"><svg><use href="#i-check"/></svg>${escapeHtml(correct)}</p>
          <p class="why">${it.src.why}</p>
        </li>`;
      }).join('')}</ol>`;
    linkTerms($('.quiz-review', result));
    if (!reducedMotion) result.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  $('#quizResult').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quiz]');
    if (!b) return;
    if (b.dataset.quiz === 'missed' && lastQuiz) startQuiz(shuffle(lastQuiz.items.filter((it) => !isRight(it)).map((it) => it.src)));
    else { $('#quizResult').hidden = true; $('#quizSetup').hidden = false; }
    $('#quiz').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
  document.addEventListener('keydown', (e) => {
    if (current !== 'assess' || !quiz || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    const k = '1234'.indexOf(e.key);
    if (k !== -1) { e.preventDefault(); pickOption(k); }
  });
  paintQuizBest();

  /* ------------------------------------------------------------------
     Glassdoor: reported questions, fundamentals, SQL drills and a
     one-way video screen practice (think, then record, no pausing)
     ------------------------------------------------------------------ */
  const GD = PREP.glassdoor;
  $('#gdSource').href = GD.source;
  const STAGE_KIND = { 'Recruiter call': '', Technical: 'k-design', Manager: 'k-projects' };
  const goButton = ([kind, target, label]) => (
    kind === 'tab' ? `<a class="mini" href="#${target}"><svg><use href="#i-next"/></svg> ${label}</a>`
      : kind === 'jump' ? `<button class="mini" type="button" data-jump="${target}"><svg><use href="#i-chevron"/></svg> ${label}</button>`
      : kind === 'screen' ? `<button class="mini" type="button" data-screen="${target}"><svg><use href="#i-video"/></svg> ${label}</button>`
      : `<button class="mini" type="button" data-chal="${target}"><svg><use href="#i-code"/></svg> ${label}</button>`
  );
  $('#gdReported').innerHTML = GD.reported.map((r) => `
    <article class="card gd-item reveal">
      <div class="gd-meta"><span class="mock-kind ${STAGE_KIND[r.stage] ?? 'k-coding'}">${r.stage}</span><span class="mono muted">${r.where}</span></div>
      <h3>${r.q}</h3>
      <details class="fu"><summary>${chevron}<span>How to answer</span></summary><p>${r.how}</p></details>
      <div class="gd-go">${goButton(r.go)}</div>
    </article>`).join('');

  $('#gdFundList').innerHTML = GD.fundamentals.map((f) => `
    <div class="card panel">
      <div class="panel-head"><h3>${f.topic}</h3><span class="mono muted">${f.items.length} questions</span></div>
      ${f.items.map(([q, a]) => `<details class="fu"><summary class="no-terms">${chevron}<span>${q}</span></summary><p>${a}</p></details>`).join('')}
    </div>`).join('');

  const SQL_KW = /\b(SELECT|DISTINCT|FROM|WHERE|LEFT JOIN|JOIN|ON|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|AS|IS NULL|DESC|OVER|PARTITION BY)\b/g;
  $('#gdSchema').textContent = GD.sql.schema;
  $('#gdSqlList').innerHTML = GD.sql.items.map(([q, sql, note], i) => `
    <details class="fu"><summary>${chevron}<span>${i + 1}. ${q}</span></summary>
      <pre><code>${escapeHtml(sql).replace(SQL_KW, '<span class="k">$1</span>')}</code></pre>
      <p>${escapeHtml(note)}</p>
    </details>`).join('');

  // Scroll to a section on this page without changing the hash (the hash picks the tab)
  function jumpTo(id) {
    const el = $('#' + id);
    const top = el.getBoundingClientRect().top + scrollY - $('.topbar').offsetHeight - 16;
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump]');
    if (jump) { e.preventDefault(); jumpTo(jump.dataset.jump); return; }
    const chalBtn = e.target.closest('[data-chal]');
    if (chalBtn) { openChallenge(chalBtn.dataset.chal); location.hash = 'assess'; return; }
    const screenBtn = e.target.closest('[data-screen]');
    if (screenBtn) { jumpTo('gdScreen'); beginThink(Number(screenBtn.dataset.screen)); }
  });

  const THINK_SEC = 60;
  const screenEl = {
    phase: $('#screenPhase'), count: $('#screenCount'), q: $('#screenQ'), timer: $('#screenTimer'),
    digits: $('#screenDigits'), label: $('#screenLabel'), bar: $('#screenBar'), tip: $('#screenTip'),
    start: $('#screenStart'), now: $('#screenNow'), stop: $('#screenStop'), retake: $('#screenRetake'),
    cam: $('#screenCam'), live: $('#screenLive'), playback: $('#screenPlayback'), off: $('#screenOff'), rec: $('#screenRec'),
  };
  let screenSec = store.get('screenSec', 180);
  let screenRuns = store.get('screenRuns', 0);
  let phase = 'idle'; // idle → think → answer → done
  let screenIdx = null;
  let phaseLen = 0;
  let phaseEnd = 0;
  let phaseTimer = 0;
  let camStream = null;
  let recorder = null;
  let playbackUrl = null;
  const screenUsed = new Set();

  $$('#screenLen button').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.sec) === screenSec)));
  $('#screenLen').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sec]');
    if (!b) return;
    screenSec = Number(b.dataset.sec);
    store.set('screenSec', screenSec);
    $$('#screenLen button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  });

  function paintScreen() {
    const labels = { idle: 'Ready', think: 'Think', answer: camStream ? 'Recording' : 'Answer now', done: 'Done' };
    screenEl.phase.textContent = labels[phase];
    screenEl.phase.className = 'mock-kind ' + (phase === 'answer' ? 'k-rec' : phase === 'think' ? 'k-design' : 'k-talk');
    screenEl.count.textContent = screenRuns ? `${screenRuns} answered` : '';
    screenEl.start.hidden = phase === 'think' || phase === 'answer';
    $('span', screenEl.start).textContent = phase === 'done' ? 'Next question' : 'Start';
    screenEl.now.hidden = phase !== 'think';
    screenEl.stop.hidden = phase !== 'answer';
    screenEl.retake.hidden = phase !== 'done';
    screenEl.tip.hidden = phase !== 'done';
    const showPlayback = phase === 'done' && !!playbackUrl;
    screenEl.playback.hidden = !showPlayback;
    screenEl.live.hidden = showPlayback || !camStream;
    screenEl.off.hidden = showPlayback || !!camStream;
    screenEl.rec.hidden = !(phase === 'answer' && recorder);
  }

  function tickScreen() {
    const left = Math.max(0, phaseEnd - performance.now());
    screenEl.digits.textContent = fmtTime(Math.ceil(left / 1000) * 1000);
    screenEl.bar.style.width = (100 * (1 - left / phaseLen)) + '%';
    screenEl.timer.classList.toggle('over', phase === 'answer' && left < 10000);
    if (left > 0) return;
    if (phase === 'think') beginAnswer();
    else finishAnswer();
  }
  function runPhase(sec, label) {
    phaseLen = sec * 1000;
    phaseEnd = performance.now() + phaseLen;
    screenEl.label.textContent = label;
    clearInterval(phaseTimer);
    phaseTimer = setInterval(tickScreen, 200);
    tickScreen();
  }

  function clearPlayback() {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    playbackUrl = null;
    screenEl.playback.removeAttribute('src');
    screenEl.playback.load();
  }
  function startRecording() {
    if (!camStream || typeof MediaRecorder === 'undefined') return;
    const chunks = [];
    let rec;
    try { rec = new MediaRecorder(camStream); } catch (err) { return; }
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      if (rec.discard || !chunks.length) return;
      clearPlayback();
      playbackUrl = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'video/webm' }));
      screenEl.playback.src = playbackUrl;
      paintScreen();
    };
    rec.start();
    recorder = rec;
  }
  function stopRecording(keep) {
    if (!recorder) return;
    recorder.discard = !keep;
    if (recorder.state !== 'inactive') recorder.stop();
    recorder = null;
  }

  function pickScreen() {
    let fresh = GD.screen.map((_, i) => i).filter((i) => !screenUsed.has(i));
    if (!fresh.length) { screenUsed.clear(); fresh = GD.screen.map((_, i) => i); }
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  function beginThink(i) {
    stopRecording(false);
    clearPlayback();
    screenIdx = i;
    screenUsed.add(i);
    screenEl.q.textContent = GD.screen[i][0];
    if (!reducedMotion) { screenEl.q.classList.remove('swap'); void screenEl.q.offsetWidth; screenEl.q.classList.add('swap'); }
    phase = 'think';
    runPhase(THINK_SEC, 'think time');
    paintScreen();
  }
  function beginAnswer() {
    phase = 'answer';
    startRecording();
    runPhase(screenSec, 'answer time');
    paintScreen();
  }
  function finishAnswer() {
    const used = phaseLen - Math.max(0, phaseEnd - performance.now());
    clearInterval(phaseTimer);
    stopRecording(true);
    phase = 'done';
    screenRuns += 1;
    store.set('screenRuns', screenRuns);
    if (screenRuns >= 3) autoCheck('screen3');
    screenEl.digits.textContent = fmtTime(used);
    screenEl.label.textContent = 'you spoke for';
    screenEl.bar.style.width = '100%';
    screenEl.timer.classList.remove('over');
    screenEl.tip.innerHTML = `<strong>A strong answer hits:</strong> ${GD.screen[screenIdx][1]}`;
    paintScreen();
  }
  function cancelScreen() {
    clearInterval(phaseTimer);
    stopRecording(false);
    phase = 'idle';
    screenEl.q.textContent = 'Press Start for a question.';
    screenEl.digits.textContent = fmtTime(THINK_SEC * 1000);
    screenEl.label.textContent = 'think time';
    screenEl.bar.style.width = '0%';
    screenEl.timer.classList.remove('over');
    paintScreen();
  }

  function stopCamera() {
    if (phase === 'answer') stopRecording(false);
    if (camStream) camStream.getTracks().forEach((t) => t.stop());
    camStream = null;
    screenEl.live.srcObject = null;
    screenEl.cam.checked = false;
    paintScreen();
  }
  screenEl.cam.addEventListener('change', async () => {
    if (!screenEl.cam.checked) return stopCamera();
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      screenEl.live.srcObject = camStream;
      if (phase === 'answer') startRecording();
    } catch (err) {
      screenEl.cam.checked = false;
      showToast('No camera access. You can still practice without it.');
    }
    paintScreen();
  });

  screenEl.start.addEventListener('click', () => beginThink(pickScreen()));
  screenEl.now.addEventListener('click', beginAnswer);
  screenEl.stop.addEventListener('click', finishAnswer);
  screenEl.retake.addEventListener('click', () => beginThink(screenIdx));
  // Leaving the tab ends a run in progress and turns the camera off
  window.addEventListener('hashchange', () => {
    if (current === 'glassdoor') return;
    if (phase === 'think' || phase === 'answer') cancelScreen();
    if (camStream) stopCamera();
  });
  window.addEventListener('pagehide', () => { if (camStream) stopCamera(); });
  paintScreen();

  /* ------------------------------------------------------------------
     Readiness ring on the Plan tab
     ------------------------------------------------------------------ */
  function updateReady() {
    const planInputs = $$('.checklist[data-group="plan"] input');
    const parts = [
      ['Flashcards known', cards.filter((c) => cardState[c.id] === 'known').length, cards.length],
      ['Problems solved', Object.keys(solved).length, totalProblems],
      ['Challenges passed', Object.keys(store.get('challenges', {})).length, PREP.challenges.length],
      ['Walkthroughs ready', projectsReady(), PREP.projects.length],
      ['Checklist', planInputs.filter((i) => i.checked).length, planInputs.length],
    ];
    const overall = parts.reduce((s, [, n, d]) => s + n / d, 0) / parts.length;
    $('#readyPct').textContent = Math.round(overall * 100) + '%';
    $('#ringFill').style.strokeDashoffset = 289.03 * (1 - overall);
    $('#readyList').innerHTML = parts.map(([label, n, d]) => `
      <li><div class="row"><span>${label}</span><span>${n}/${d}</span></div><div class="mini-bar"><i style="width:${pct(n, d)}%"></i></div></li>`).join('');
  }

  $('#resetAll').addEventListener('click', () => {
    if (!window.confirm('Clear all saved progress and notes on this browser?')) return;
    store.clear();
    location.reload();
  });

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  // Autosize text areas whenever their tab becomes visible
  new MutationObserver(() => $$('textarea.autosize').forEach(autosize)).observe($('main'), { attributes: true, subtree: true, attributeFilter: ['hidden'] });
  stagger();
  observeReveals();
  updatePlanCount();
  linkTerms($('main'));
  // Reopen on the tab you were last on, unless the link names one
  const first = location.hash.slice(1);
  const lastTab = store.get('lastTab', 'plan');
  show(TABS.includes(first) ? first : TABS.includes(lastTab) ? lastTab : 'plan');
})();
