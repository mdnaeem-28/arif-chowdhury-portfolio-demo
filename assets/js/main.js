/* Arif Chowdhury, demo portfolio. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = doc.getElementById('site-header');

  /* ---------- Header height variable (for scroll offset) ---------- */
  function setHeaderH() {
    if (header) doc.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  setHeaderH();
  window.addEventListener('resize', setHeaderH);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(setHeaderH);

  /* ---------- Smooth anchor scroll (CSS handles smoothness, JS moves focus and the hash) ---------- */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    if (a.hasAttribute('data-demo')) { e.preventDefault(); return; }
    if (a.hasAttribute('data-open')) return; // handled by the modal code
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = doc.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (history.pushState) history.pushState(null, '', '#' + id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Active nav link on scroll (IntersectionObserver) ---------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav__link'));
  var navMap = {};
  navLinks.forEach(function (l) { navMap[l.getAttribute('href').slice(1)] = l; });
  var navKeyBySection = {
    home: 'home', about: 'about', services: 'about', why: 'about',
    process: 'process', results: 'work', work: 'work', notes: 'notes', contact: 'contact'
  };
  function setActive(key) {
    navLinks.forEach(function (l) {
      var on = key && l === navMap[key];
      l.classList.toggle('is-active', !!on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    var sections = Array.prototype.slice.call(doc.querySelectorAll('main > section[id], footer[id]'));
    var visible = {};
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      sections.forEach(function (s) { if (visible[s.id]) current = s.id; });
      if (current) setActive(navKeyBySection[current] || null);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- Chips toggle ---------- */
  doc.querySelectorAll('button.chip[aria-pressed]').forEach(function (c) {
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  /* ---------- Modals: native dialog + focus trap, Esc, backdrop click, focus return ---------- */
  var focusable = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
  var lastOpener = null;

  function openDialog(dlg, opener) {
    lastOpener = opener || doc.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    doc.body.classList.add('modal-open');
    var first = dlg.querySelector('[data-view]:not([hidden]) input, [data-view]:not([hidden]) button, button[data-close]');
    if (first) first.focus();
  }
  function closeDialog(dlg) {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  function onClosed() {
    if (!doc.querySelector('dialog[open]')) doc.body.classList.remove('modal-open');
    if (lastOpener && doc.contains(lastOpener)) lastOpener.focus({ preventScroll: true });
  }
  doc.querySelectorAll('dialog.modal').forEach(function (dlg) {
    dlg.addEventListener('close', onClosed);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(dlg); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeDialog(dlg); return; }
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(dlg.querySelectorAll(focusable), function (el) {
        return el.offsetParent !== null && !el.closest('[hidden]');
      });
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (doc.activeElement === first || !dlg.contains(doc.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (doc.activeElement === last || !dlg.contains(doc.activeElement))) { e.preventDefault(); first.focus(); }
    });
    dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeDialog(dlg); }); });
  });

  /* Contact dialog */
  var contactDlg = doc.getElementById('contact-dialog');
  var form = doc.getElementById('contact-form');
  var views = {};
  contactDlg.querySelectorAll('[data-view]').forEach(function (v) { views[v.getAttribute('data-view')] = v; });
  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
  }
  function clearErrors() {
    form.querySelectorAll('.field').forEach(function (f) {
      f.classList.remove('has-error');
      var err = f.querySelector('.field__err'); err.hidden = true; err.textContent = '';
      var inp = f.querySelector('input, textarea'); inp.removeAttribute('aria-invalid');
    });
  }
  function setError(input, msg) {
    var f = input.closest('.field'); var err = f.querySelector('.field__err');
    f.classList.add('has-error'); input.setAttribute('aria-invalid', 'true');
    err.textContent = msg; err.hidden = false;
  }
  function validate() {
    clearErrors();
    var name = form.elements.name, email = form.elements.email, msg = form.elements.message;
    var firstBad = null;
    if (!name.value.trim()) { setError(name, 'Please enter your name.'); firstBad = firstBad || name; }
    if (!email.value.trim()) { setError(email, 'Please enter your email.'); firstBad = firstBad || email; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { setError(email, 'Please enter a valid email, like you@example.com.'); firstBad = firstBad || email; }
    if (!msg.value.trim()) { setError(msg, 'Please tell me a little about your product.'); firstBad = firstBad || msg; }
    else if (msg.value.trim().length < 10) { setError(msg, 'Please write at least a short sentence (10 characters).'); firstBad = firstBad || msg; }
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function resetContact() { form.reset(); clearErrors(); showView('form'); }
  var sendTimer = null;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    showView('sending');
    /* focus goes to the Sending heading (the only button is disabled and cannot hold focus) */
    var sendHead = views.sending.querySelector('.modal__title');
    if (sendHead) { sendHead.setAttribute('tabindex', '-1'); sendHead.focus(); }
    if (sendTimer) clearTimeout(sendTimer);
    sendTimer = setTimeout(function () {
      sendTimer = null;
      if (!contactDlg.open) return; // dialog was closed while sending
      showView('success'); // nothing is sent anywhere
      var t = views.success.querySelector('[data-success-title]'); if (t) t.focus();
    }, 1200);
  });
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field');
    if (f && f.classList.contains('has-error')) {
      f.classList.remove('has-error'); e.target.removeAttribute('aria-invalid');
      var err = f.querySelector('.field__err'); err.hidden = true; err.textContent = '';
    }
  });
  contactDlg.addEventListener('close', function () {
    if (sendTimer) { clearTimeout(sendTimer); sendTimer = null; } // Esc or Close while sending cancels the fake send
    setTimeout(resetContact, 200);
  });

  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open="contact"]');
    if (!t) return;
    e.preventDefault();
    resetContact();
    openDialog(contactDlg, t);
  });

  /* Case study dialog */
  var caseDlg = doc.getElementById('case-dialog');
  var cases = {
    hotel: {
      chip: 'BOOKING UX', title: 'HOTEL BOOKING REDESIGN',
      desc: 'Demo case study. Fewer steps from search to confirmation, found by watching ten travelers book on their phones.',
      img: 'assets/img/case-hotel.jpg',
      alt: 'Three phone screens of a hotel booking app showing search results, a room page and a booking confirmation',
      stats: ['time', 'steps', 'drop']
    },
    train: {
      chip: 'PAYMENTS', title: 'TRAIN TICKET APP',
      desc: 'Demo case study. Seat picking and payment without the confusion.',
      img: 'assets/img/case-train.jpg',
      alt: 'Three phone screens of a train ticket app showing seat selection, payment methods and a ticket with a QR code',
      stats: ['drop']
    }
  };
  function openCase(key, opener) {
    var c = cases[key]; if (!c) return;
    doc.getElementById('case-chip').textContent = c.chip;
    doc.getElementById('case-title').textContent = c.title;
    doc.getElementById('case-desc').textContent = c.desc;
    var img = doc.getElementById('case-cover'); img.src = c.img; img.alt = c.alt;
    caseDlg.querySelectorAll('[data-stat]').forEach(function (s) { s.hidden = c.stats.indexOf(s.getAttribute('data-stat')) === -1; });
    openDialog(caseDlg, opener);
  }
  doc.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-case-open]');
    if (btn) { e.stopPropagation(); openCase(btn.getAttribute('data-case-open'), btn); return; }
  });
})();
