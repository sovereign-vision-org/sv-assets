/**
 * SOVEREIGN VISION — nav.js
 * Handles two scenarios automatically:
 *
 *   1. FETCH MODE (all inner pages)
 *      A <div id="sv-nav-mount"></div> exists in the page.
 *      nav.js fetches /assets/partials/nav.html, injects it,
 *      then runs initNav().
 *
 *   2. INLINE MODE (index.html and any page with nav already in the DOM)
 *      No #sv-nav-mount exists, but a <nav id="nav"> is already present.
 *      nav.js runs initNav() directly — no fetch needed.
 *
 * Behaviour initialised in both cases:
 *   - Scroll → .scrolled class on nav
 *   - Dropdown hover/click with diagonal-mouse grace timer
 *   - Mobile hamburger / full-screen menu toggle
 *   - Keyboard: Escape closes dropdowns / mobile menu
 *   - Active-page link highlighting
 *
 * Public API:  window.SVNav.init()  — callable manually if needed
 */

(function () {
  'use strict';

  var NAV_PARTIAL      = '/assets/partials/nav.html';
  var SCROLL_THRESHOLD = 60;
  var DROPDOWN_GRACE   = 120; // ms grace for diagonal mouse travel

  /* ── Boot: decide fetch vs inline ───────────────────────── */
  function boot() {
    var mount     = document.getElementById('sv-nav-mount');
    var inlineNav = document.getElementById('nav') || document.querySelector('.sv-nav');

    if (mount) {
      // Inner page pattern — fetch the shared partial
      if (mount.children.length > 0) {
        initNav(); // Already populated (SSI / pre-render)
      } else {
        fetch(NAV_PARTIAL)
          .then(function (res) {
            if (!res.ok) throw new Error('Nav partial not found (' + res.status + ')');
            return res.text();
          })
          .then(function (html) {
            mount.innerHTML = html;
            initNav();
          })
          .catch(function (err) {
            console.warn('[sv-nav] Could not load nav partial:', err.message);
          });
      }
    } else if (inlineNav) {
      // Homepage / inline pattern — nav HTML already in DOM
      initNav();
    }
  }

  /* ── initNav: wire all behaviour to the nav in the DOM ───── */
  function initNav() {
    var nav        = document.getElementById('nav') || document.querySelector('.sv-nav');
    var hamburger  = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobile-menu');

    if (!nav) return;

    /* Scroll state */
    function updateScrollState() {
      nav.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
    }
    window.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();

    /* Dropdowns */
    var dropdowns = nav.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(function (dd) {
      var closeTimer = null;

      function openDd() {
        clearTimeout(closeTimer);
        dropdowns.forEach(function (other) {
          if (other !== dd) other.classList.remove('active');
        });
        dd.classList.add('active');
      }

      function scheduledClose() {
        closeTimer = setTimeout(function () {
          dd.classList.remove('active');
        }, DROPDOWN_GRACE);
      }

      function cancelClose() {
        clearTimeout(closeTimer);
      }

      dd.addEventListener('mouseenter', openDd);
      dd.addEventListener('mouseleave', scheduledClose);

      var menu = dd.querySelector('.dropdown-menu');
      if (menu) {
        menu.addEventListener('mouseenter', cancelClose);
        menu.addEventListener('mouseleave', scheduledClose);
      }

      var trigger = dd.querySelector('a');
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          if (window.innerWidth > 960) {
            e.preventDefault();
            dd.classList.contains('active') ? dd.classList.remove('active') : openDd();
          }
        });
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(function (dd) { dd.classList.remove('active'); });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        dropdowns.forEach(function (dd) { dd.classList.remove('active'); });
        if (mobileMenu && mobileMenu.classList.contains('open')) {
          closeMobileMenuFn();
        }
      }
    });

    /* Mobile menu */
    if (hamburger && mobileMenu) {
      var menuOpen = false;

      function openMobileMenuFn() {
        menuOpen = true;
        hamburger.classList.add('open');
        mobileMenu.style.display = 'flex';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            mobileMenu.classList.add('open');
          });
        });
        document.body.style.overflow = 'hidden';
        hamburger.setAttribute('aria-expanded', 'true');
      }

      function closeMobileMenuFn() {
        menuOpen = false;
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
        setTimeout(function () {
          if (!mobileMenu.classList.contains('open')) {
            mobileMenu.style.display = '';
          }
        }, 380);
      }

      // Global — used by onclick="closeMobileMenu()" in mobile menu links
      window.closeMobileMenu = closeMobileMenuFn;

      hamburger.addEventListener('click', function () {
        menuOpen ? closeMobileMenuFn() : openMobileMenuFn();
      });
    }

    highlightActivePage(nav);
  }

  /* Active page highlight */
  function highlightActivePage(nav) {
    var current = window.location.pathname
      .replace(/\/$/, '')
      .replace(/\.html$/, '');

    nav.querySelectorAll('.nav-links a, .dropdown-menu a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var normalized = href.replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '');
      var currentNorm = current.replace(/^\//, '');
      if (currentNorm === normalized || (currentNorm === '' && normalized === 'index')) {
        link.classList.add('active-page');
      }
    });
  }

  /* Public API */
  window.SVNav = { init: initNav };

  /* Run */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
