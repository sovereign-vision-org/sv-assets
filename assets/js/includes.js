/* ═══════════════════════════════════════════════════════════════════
   SOVEREIGN VISION — includes.js
   Loads nav.html and footer.html partials into placeholder elements.

   Usage in any page:
     <div data-include="partials/nav.html"></div>
     ...page content...
     <div data-include="partials/footer.html"></div>
     <script src="assets/js/includes.js"></script>
     <script src="assets/js/site.js" defer></script>

   The include script runs synchronously-ish using fetch promises,
   then fires a custom event "includes:ready" so site.js can safely
   query the DOM for nav/footer elements.
═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var placeholders = document.querySelectorAll('[data-include]');
  if (!placeholders.length) return;

  // Resolve path relative to the current page's location
  function resolvePath(src) {
    // If already absolute, return as-is
    if (src.startsWith('http') || src.startsWith('/')) return src;
    // Otherwise resolve relative to page
    var base = window.location.pathname.split('/').slice(0, -1).join('/');
    return base ? base + '/' + src : src;
  }

  var promises = Array.from(placeholders).map(function (el) {
    var src = el.dataset.include;
    return fetch(resolvePath(src))
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load: ' + src);
        return res.text();
      })
      .then(function (html) {
        // Replace the placeholder with the fetched HTML
        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        // Move all child nodes out of wrapper into the document
        while (wrapper.firstChild) {
          el.parentNode.insertBefore(wrapper.firstChild, el);
        }
        el.parentNode.removeChild(el);
      })
      .catch(function (err) {
        console.warn('[includes.js]', err.message);
        el.parentNode.removeChild(el);
      });
  });

  Promise.all(promises).then(function () {
    // Fire event so site.js can re-query the DOM
    document.dispatchEvent(new CustomEvent('includes:ready'));
    // Re-run site.js init if already loaded (for nav/reveal)
    if (window.SV && typeof window.SV.init === 'function') {
      window.SV.init();
    }
  });

})();
