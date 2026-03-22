/**
 * SOVEREIGN VISION — site.js
 * Master orchestrator. Load this file last (before </body>).
 *
 * Responsibilities:
 *   - Load shared footer partial into #sv-footer-mount
 *   - Provide global utility functions
 *   - Bootstrap any page-specific JS via data-page attribute
 *   - Provide a minimal pub/sub for cross-module communication
 */

(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────── */
  const FOOTER_PARTIAL = '/assets/partials/footer.html';

  /* ── Fetch-include footer ────────────────────────────────── */
  function loadFooter() {
    const mount = document.getElementById('sv-footer-mount');
    if (!mount) return;

    if (mount.children.length > 0) return; // already populated

    fetch(FOOTER_PARTIAL)
      .then(res => {
        if (!res.ok) throw new Error('Footer partial not found');
        return res.text();
      })
      .then(html => {
        mount.innerHTML = html;
      })
      .catch(err => {
        console.warn('[sv-site] Could not load footer partial:', err.message);
      });
  }

  /* ── Generic include loader (reusable for any partial) ───── */
  /*
   * Usage: <div data-include="/assets/partials/something.html"></div>
   * The element's content is replaced with the fetched partial.
   */
  function loadAllIncludes() {
    const includes = document.querySelectorAll('[data-include]');
    includes.forEach(el => {
      const src = el.dataset.include;
      if (!src) return;
      fetch(src)
        .then(res => res.ok ? res.text() : Promise.reject())
        .then(html => { el.outerHTML = html; })
        .catch(() => {});
    });
  }

  /* ── Minimal pub/sub bus ─────────────────────────────────── */
  const listeners = {};

  window.SVBus = {
    on(event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
    },
    emit(event, data) {
      (listeners[event] || []).forEach(fn => fn(data));
    }
  };

  /* ── Utilities ───────────────────────────────────────────── */
  window.SVUtils = {
    /**
     * Debounce wrapper
     */
    debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    /**
     * Format a number for display: 1000 → "1,000"
     */
    formatNumber(n) {
      return Number(n).toLocaleString();
    },

    /**
     * Simple cookie-cutter fetch with JSON response
     */
    async fetchJSON(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
  };

  /* ── Page-specific init dispatch ─────────────────────────── */
  /*
   * Add data-page="communications" to <body> on each page.
   * Add corresponding handlers to SVPageInits below.
   */
  const SVPageInits = {
    // Example:
    // communications: function() { /* page-specific boot */ },
    // energy: function() { /* page-specific boot */ },
  };

  function dispatchPageInit() {
    const page = document.body.dataset.page;
    if (page && typeof SVPageInits[page] === 'function') {
      SVPageInits[page]();
    }
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    loadAllIncludes();
    loadFooter();
    dispatchPageInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
