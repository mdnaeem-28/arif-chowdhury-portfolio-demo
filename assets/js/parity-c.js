/* Round 9, area C: behaviour fixes from the audits. Loaded after main.js and parity-b.js (defer).
   Everything here feature-detects and fails soft: if a selector is missing the block is skipped.
   Dependencies on markup: #about-title or .about__lead, .nav .nav__link, .marquee, .chart__nums .chart__a/.chart__b,
   .chart__keys, dialog#contact-dialog [data-view], .hero__top, .reveal. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var mq = window.matchMedia ? function (q) { return window.matchMedia(q); } : function () { return { matches: false }; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var base = 'cubic-bezier(0.22, 1, 0.36, 1)'; // documented here; the CSS owns the curve

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- 9. Reveal reliability: content must show if main.js failed or IntersectionObserver is missing ---------- */
  (function () {
    function revealAll() { root.classList.add('reveal-all'); }
    // main.js sets --header-h on the root as its first act; if it is missing, main.js did not run to completion.
    var mainOk = !!root.style.getPropertyValue('--header-h');
    if (!hasIO || !mainOk) { revealAll(); return; }
    // Safety net: anything inside the first screen that is still hidden a moment after load is shown.
    function rescue() {
      $$('.js .reveal:not(.is-visible)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    }
    window.addEventListener('load', function () { setTimeout(rescue, 1500); });
  })();

  /* ---------- 1. Contact dialog: focus and live status while Sending ---------- */
  (function () {
    var dlg = $('#contact-dialog');
    if (!dlg) return;
    $$('[data-view] .modal__title', dlg).forEach(function (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); });
    var sending = $('[data-view="sending"]', dlg);
    if (!sending) return;
    var status = $('[role="status"]', sending);
    if (status) { status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true'); }
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function () {
      if (sending.hidden) return;
      var head = $('.modal__title', sending);
      if (head && doc.activeElement !== head && dlg.open) head.focus({ preventScroll: true });
      if (status) { var t = status.textContent; status.textContent = ''; window.setTimeout(function () { status.textContent = t; }, 60); }
    }).observe(sending, { attributes: true, attributeFilter: ['hidden'] });
  })();

  /* ---------- 8. Current page link: mirror main.js scroll-spy onto aria-current, keep the active link in view ---------- */
  var nav = $('.nav');
  var navLinks = $$('.nav__link');
  function syncCurrent() {
    navLinks.forEach(function (l) {
      if (l.classList.contains('is-active')) { if (l.getAttribute('aria-current') !== 'true') l.setAttribute('aria-current', 'true'); }
      else if (l.hasAttribute('aria-current')) l.removeAttribute('aria-current');
    });
  }
  function navOverflows() { return nav && nav.scrollWidth > nav.clientWidth + 1; }
  function updateFades() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', nav.scrollLeft > 2);
    nav.classList.toggle('is-end', !navOverflows() || nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 2);
  }
  function revealActiveLink() {
    if (!navOverflows()) return;
    var a = $('.nav__link.is-active');
    if (!a) return;
    var target = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
    var max = nav.scrollWidth - nav.clientWidth;
    nav.scrollLeft = Math.max(0, Math.min(max, target)); // only the strip moves, never the page
    updateFades();
  }
  if (navLinks.length) {
    syncCurrent();
    if ('MutationObserver' in window) {
      var lastActive = $('.nav__link.is-active');
      new MutationObserver(function (muts) {
        syncCurrent();
        if (!muts.some(function (m) { return m.target !== nav; })) return; // the strip's own fade classes are not a section change
        var a = $('.nav__link.is-active');
        if (a && a !== lastActive) { lastActive = a; revealActiveLink(); } // only when the section changes, so manual strip scrolling is never fought
      }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    if (!hasIO) { // fallback scroll spy, rAF throttled, only when main.js cannot do it
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return; ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          var best = null, mid = window.innerHeight * 0.45;
          navLinks.forEach(function (l) {
            var s = doc.getElementById((l.getAttribute('href') || '').slice(1));
            if (s) { var r = s.getBoundingClientRect(); if (r.top <= mid) best = l; }
          });
          navLinks.forEach(function (l) { l.classList.toggle('is-active', l === best); });
        });
      }, { passive: true });
    }
  }
  if (nav) {
    var navTick = false;
    nav.addEventListener('scroll', function () {
      if (navTick) return; navTick = true;
      window.requestAnimationFrame(function () { navTick = false; updateFades(); });
    }, { passive: true });
    window.addEventListener('resize', updateFades);
    updateFades();
  }

  /* ---------- 7. Chart card: legend colours and After / Before captions ---------- */
  (function () {
    var keys = $('.chart__keys');
    if (keys) {
      $$('span', keys).forEach(function (s) {
        var t = (s.textContent || '').trim().toLowerCase();
        if (t === 'before') s.classList.add('key-before');
        else if (t === 'after') s.classList.add('key-after');
      });
    }
    function caption(sel, text) {
      var el = $(sel);
      if (!el || $('.chart__cap', el)) return;
      var c = doc.createElement('span');
      c.className = 'chart__cap';
      c.textContent = text;
      el.appendChild(doc.createTextNode(' ')); // keeps "3.1 min After" readable for screen readers
      el.appendChild(c);
    }
    caption('.chart__nums .chart__a', 'After');
    caption('.chart__nums .chart__b', 'Before');
  })();

  /* ---------- 5. Motion control: pause / play for all continuous motion ---------- */
  (function () {
    if (reduceMotion) return; // animations are already off
    if ($('.motion-toggle')) return;
    var marquee = $('.marquee');
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'motion-toggle' + (marquee ? '' : ' motion-toggle--fixed');
    var pauseIcon = '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M6 3.5v11M12 3.5v11" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/></svg>';
    var playIcon = '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M5.5 3.5l9 5.5-9 5.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    var paused = false; // state lives in memory only
    function render() {
      root.classList.toggle('anim-paused', paused);
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? 'Play animations' : 'Pause animations');
      btn.innerHTML = paused ? playIcon : pauseIcon;
    }
    btn.addEventListener('click', function () { paused = !paused; render(); });
    render();
    if (marquee && marquee.parentNode) marquee.parentNode.appendChild(btn); else doc.body.appendChild(btn);
  })();

  /* ---------- Word by word reveal on the About lead ---------- */
  (function () {
    var head = $('#about-title') || $('.about__lead');
    if (!head || reduceMotion || !hasIO || head.querySelector('.word')) return; // reduced motion: final text, untouched
    var label = (head.textContent || '').replace(/\s+/g, ' ').trim();
    var words = [];
    function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var w = doc.createElement('span');
            w.className = 'word';
            w.setAttribute('aria-hidden', 'true');
            w.textContent = p;
            words.push(w);
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          split(n); // keeps the existing inner <span> and its colour
        }
      });
    }
    split(head);
    if (!words.length) return;
    head.setAttribute('aria-label', label); // screen readers get one clean string, word spans are hidden
    var io = new IntersectionObserver(function (entries) {
      var hit = entries.filter(function (en) {
        var bottom = en.rootBounds ? en.rootBounds.bottom : window.innerHeight;
        return en.isIntersecting || en.boundingClientRect.top < bottom;
      }).sort(function (a, b) { return words.indexOf(a.target) - words.indexOf(b.target); });
      hit.forEach(function (en, i) {
        en.target.style.transitionDelay = Math.min(i * 45, 400) + 'ms'; // one after another, capped
        en.target.classList.add('is-lit');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -40% 0px', threshold: 0 }); // trigger line at 60% of the viewport height
    words.forEach(function (w) { io.observe(w); });
  })();

  /* ---------- 2. Headings with a hard <br>: if the break leaves an extra ugly line at this width, use a space instead (copy unchanged) ---------- */
  (function () {
    var heads = $$('h1, h2, .footer__cta').filter(function (h) { return h.querySelector('br'); });
    if (!heads.length) return;
    var state = heads.map(function (h) { return { el: h, brs: $$('br', h), swaps: [] }; });
    function lineCount(el) {
      var lh = parseFloat(window.getComputedStyle(el).lineHeight);
      if (!lh) return 0;
      return Math.round(el.getBoundingClientRect().height / lh);
    }
    function restore(s) {
      s.swaps.forEach(function (p) { if (p[1].parentNode) p[1].parentNode.replaceChild(p[0], p[1]); });
      s.swaps = [];
    }
    function fit() {
      state.forEach(function (s) {
        restore(s);
        var natural = s.brs.length + 1;
        if (lineCount(s.el) <= natural) return; // the hard breaks already give the cleanest result
        s.brs.forEach(function (br) {
          if (!br.parentNode) return;
          var sp = doc.createTextNode(' ');
          br.parentNode.replaceChild(sp, br);
          s.swaps.push([br, sp]);
        });
        if (lineCount(s.el) > natural) restore(s); // a space did not help, keep the original markup
      });
    }
    var raf = 0;
    function schedule() { if (raf) return; raf = window.requestAnimationFrame(function () { raf = 0; fit(); }); }
    window.addEventListener('resize', schedule);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(schedule);
    schedule();
  })();
})();