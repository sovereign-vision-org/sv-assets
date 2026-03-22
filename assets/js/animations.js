/**
 * SOVEREIGN VISION — animations.js
 * Scroll-reveal (IntersectionObserver), stagger delays,
 * wave canvas renderer, progress bar animation.
 * All animations respect prefers-reduced-motion.
 */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Scroll Reveal ───────────────────────────────────────── */
  function initReveal() {
    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
    if (!targets.length) return;

    if (reduced) {
      targets.forEach(el => el.classList.add('visible'));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.07,
      rootMargin: '0px 0px -28px 0px'
    });

    targets.forEach(el => io.observe(el));
  }

  /* ── Stagger Delays ──────────────────────────────────────── */
  /*
   * Each entry: [CSS selector, fn(index) → delay string]
   * Add new stagger groups here as new pages are built.
   */
  function applyStaggerDelays() {
    const groups = [
      ['.sv-grid-4-1px .sys-card',    i => `${(i % 4) * 0.10}s`],
      ['.sv-grid-3-1px .sys-card',    i => `${(i % 3) * 0.10}s`],
      ['.sv-grid-3-1px-dark .sv-data-card', i => `${(i % 3) * 0.08}s`],
      ['.sv-grid-4-1px .sv-icon-card',i => `${(i % 4) * 0.08}s`],
      ['.sv-stats-row .sv-stat',      i => `${i * 0.10}s`],
      ['.sv-tag-grid .sv-tag',        i => `${i * 0.06}s`],
      ['.sv-pillar',                  i => `${i * 0.12}s`],
      ['.sv-step-card',               i => `${i * 0.10}s`],
      ['.sv-feature-card',            i => `${i * 0.06}s`],
      ['.sv-timeline-item',           i => `${i * 0.12}s`],
    ];

    groups.forEach(([sel, fn]) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.style.transitionDelay) {
          el.style.transitionDelay = fn(i);
        }
      });
    });
  }

  /* ── Wave Canvas Renderer ────────────────────────────────── */
  /*
   * Usage: <canvas id="wave-canvas" class="sv-wave-canvas"></canvas>
   * The canvas must be inside the hero / section it fills.
   * Options are passed via data attributes:
   *   data-opacity  (default 0.15)
   *   data-speed    (default 1.0 — multiplier)
   */
  function initWaveCanvas(canvasId, opts) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, t = 0;

    const opacity   = parseFloat(canvas.dataset.opacity || (opts && opts.opacity) || 0.15);
    const speedMult = parseFloat(canvas.dataset.speed   || (opts && opts.speed)   || 1.0);

    const waveData = opts && opts.waves ? opts.waves : [
      { amp: 18, freq: 0.007, speed: 0.26, yF: 0.57, color: `rgba(35,193,196,${opacity * 2.3})`,   lw: 1.2 },
      { amp: 11, freq: 0.011, speed: 0.44, yF: 0.64, color: `rgba(255,198,29,${opacity * 1.2})`,   lw: 0.8 },
      { amp: 24, freq: 0.005, speed: 0.17, yF: 0.72, color: `rgba(35,193,196,${opacity * 1.07})`,  lw: 1.0 },
    ];

    function resize() {
      const parent = canvas.parentElement;
      W = canvas.width  = parent.offsetWidth;
      H = canvas.height = parent.offsetHeight;
    }

    resize();
    new ResizeObserver(resize).observe(canvas.parentElement);

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (!reduced) {
        waveData.forEach(w => {
          ctx.beginPath();
          ctx.lineWidth = w.lw;
          ctx.strokeStyle = w.color;

          for (let x = 0; x <= W; x += 3) {
            const y = H * w.yF
              + Math.sin(x * w.freq + t * w.speed * speedMult) * w.amp
              + Math.sin(x * w.freq * 1.8 + t * w.speed * speedMult * 0.7) * (w.amp * 0.38);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        t += 0.85;
      }

      requestAnimationFrame(draw);
    }

    draw();

    return { resize };
  }

  /* ── Progress / Autonomy Bars ────────────────────────────── */
  /*
   * Observes .sv-bar-fill elements.
   * Width is set via data-width="75%" on the element.
   * Starts at 0, animates to target when entering viewport.
   */
  function initProgressBars() {
    const fills = document.querySelectorAll('.sv-bar-fill[data-width]');
    if (!fills.length) return;

    if (reduced) {
      fills.forEach(fill => {
        fill.style.width = fill.dataset.width;
      });
      return;
    }

    const barIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.width;
          barIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    fills.forEach(fill => {
      fill.style.width = '0%';
      barIO.observe(fill);
    });
  }

  /* ── Video Fallback ──────────────────────────────────────── */
  function initVideoFallback() {
    const video    = document.getElementById('hero-video');
    const fallback = document.getElementById('hero-fallback');

    if (!fallback) return;

    // Show fallback by default
    fallback.style.display = 'block';

    if (video) {
      video.addEventListener('loadeddata', () => {
        fallback.style.display = 'none';
      });
      video.addEventListener('error', () => {
        fallback.style.display = 'block';
      });
      // Safety: if video loads within 3s but event missed
      setTimeout(() => {
        if (video.readyState >= 2) fallback.style.display = 'none';
      }, 3000);
    }
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.SVAnimations = {
    initReveal,
    applyStaggerDelays,
    initWaveCanvas,
    initProgressBars,
    initVideoFallback,
  };

  /* ── Boot on DOM ready ───────────────────────────────────── */
  function boot() {
    applyStaggerDelays();
    initReveal();
    initProgressBars();
    initVideoFallback();
    // Wave canvas — init default canvas if present
    initWaveCanvas('wave-canvas');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
