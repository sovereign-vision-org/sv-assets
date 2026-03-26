/* ═══════════════════════════════════════════════════════════════════
   SOVEREIGN VISION — site.js
   Shared behaviour for every page.
   Safe to run before OR after nav partial is injected —
   includes.js calls window.SV.initNav() once the partial is in the DOM.
═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Nav init ── */
  function initNav() {
    var nav = document.getElementById('nav');
    if (nav) {
      function updateNav() { nav.classList.toggle('scrolled', window.scrollY > 40); }
      window.addEventListener('scroll', updateNav, { passive: true });
      updateNav();
    }

    var ham = document.getElementById('hamburger');
    var mob = document.getElementById('mobile-menu');
    if (ham && mob) {
      var newHam = ham.cloneNode(true);
      ham.parentNode.replaceChild(newHam, ham);
      ham = newHam;
      ham.addEventListener('click', function () {
        var open = ham.classList.toggle('open');
        mob.classList.toggle('open', open);
        ham.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }

    window.closeMobileMenu = window.closeMobile = function () {
      var h = document.getElementById('hamburger');
      var m = document.getElementById('mobile-menu');
      if (h) { h.classList.remove('open'); h.setAttribute('aria-expanded', 'false'); }
      if (m) { m.classList.remove('open'); }
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      var timer;
      dd.addEventListener('mouseenter', function () { clearTimeout(timer); dd.classList.add('active'); });
      dd.addEventListener('mouseleave', function () { timer = setTimeout(function () { dd.classList.remove('active'); }, 160); });
      var toggle = dd.querySelector('a');
      if (toggle) {
        toggle.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dd.classList.toggle('active'); }
          if (e.key === 'Escape') { dd.classList.remove('active'); }
        });
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown'))
        document.querySelectorAll('.nav-dropdown.active').forEach(function (dd) { dd.classList.remove('active'); });
    });

    /* Highlight current page */
    var cur = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#nav a[href]').forEach(function (a) {
      if (a.getAttribute('href') === cur) a.style.color = 'var(--coral)';
    });
  }

  /* ── Reveal ── */
  function initReveal() {
    var els = document.querySelectorAll('.reveal,.reveal-left,.reveal-up,.reveal-right');
    if (!els.length) return;
    var vp = window.innerHeight || document.documentElement.clientHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vp && r.bottom > 0) el.classList.add('visible');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px' });
    els.forEach(function (el) { if (!el.classList.contains('visible')) io.observe(el); });
  }

  /* ── Public API ── */
  window.SV = { initNav: initNav, initReveal: initReveal, init: function () { initNav(); initReveal(); } };

  /* Auto-run reveal immediately */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }

  /* Auto-run nav if inline nav already exists */
  if (document.getElementById('nav')) initNav();

  /* Re-run after includes.js fires */
  document.addEventListener('includes:ready', function () { initNav(); initReveal(); });

})();
