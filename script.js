/* ═══════════════════════════════════════════════
   NC Sati and Co — script.js
   ═══════════════════════════════════════════════ */

document.documentElement.classList.add('js-ready');

/* ── Footer Year ── */
const fyEl = document.getElementById('footer-year');
if (fyEl) fyEl.textContent = new Date().getFullYear();

/* ── Scroll Progress + Navbar + Back-to-Top ── */
const progressBar = document.getElementById('scroll-progress');
const backToTop   = document.getElementById('back-to-top');
const navbar      = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) {
    progressBar.style.width = docHeight > 0 ? (scrollTop / docHeight * 100) + '%' : '0%';
  }
  if (navbar) navbar.classList.toggle('scrolled', scrollTop > 50);
  if (backToTop) backToTop.classList.toggle('visible', scrollTop > 400);
}, { passive: true });

/* ── Mobile Menu Toggle ── */
const menuBtn    = document.getElementById('menu-toggle-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

/* ── Reveal Animations (IntersectionObserver) ── */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ════════════════════════════════════════════
   SERVICES CAROUSEL — seamless infinite loop
   ─ Clones first N cards at the end so the
     carousel never jumps backward.
   ─ Timer starts on first real interval so
     the initial display is the same 3 s.
════════════════════════════════════════════ */
(function () {
  const carousel   = document.getElementById('services-carousel');
  const dotsEl     = document.getElementById('carousel-dots');
  const viewAllBtn = document.getElementById('view-all-btn');
  const allGrid    = document.getElementById('all-services-grid');

  if (!carousel || !dotsEl) return;

  // Original cards only (not clones)
  const cards      = Array.from(carousel.querySelectorAll('.service-card-new'));
  const totalCards = cards.length;   // 9

  let currentIndex  = 0;
  let autoTimer     = null;
  let allVisible    = false;
  let transitioning = false;

  /* ── helpers ── */
  function getVisibleCount() {
    if (window.innerWidth <= 560) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getCardWidth() {
    // Measure from the first real card each time (handles resize)
    const firstCard = carousel.querySelector('.service-card-new');
    if (!firstCard) return 0;
    const gap = parseFloat(getComputedStyle(carousel).gap) || 24;
    return firstCard.getBoundingClientRect().width + gap;
  }

  /* ── Clone setup for seamless wrap ── */
  function setupClones() {
    // Remove old clones
    carousel.querySelectorAll('.card-clone').forEach(c => c.remove());
    const vc = getVisibleCount();
    // Append clones of the first `vc` cards at the END
    for (let i = 0; i < vc; i++) {
      const clone = cards[i].cloneNode(true);
      clone.classList.add('card-clone');
      carousel.appendChild(clone);
    }
  }

  /* ── Dots ── */
  function buildDots() {
    dotsEl.innerHTML = '';
    const pages = Math.ceil(totalCards / getVisibleCount());
    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.addEventListener('click', () => {
        goTo(i * getVisibleCount(), true);
        resetTimer();
      });
      dotsEl.appendChild(btn);
    }
  }

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.carousel-dot');
    const vc   = getVisibleCount();
    // Map the current index back into the real range for dot highlight
    const realIndex = currentIndex % totalCards;
    const page      = Math.floor(realIndex / vc);
    dots.forEach((d, i) => d.classList.toggle('active', i === page));
  }

  /* ── Core movement ── */
  function goTo(index, animate) {
    currentIndex = index;
    carousel.style.transition = animate
      ? 'transform 0.55s cubic-bezier(0.25, 0.8, 0.25, 1)'
      : 'none';
    carousel.style.transform = `translateX(-${getCardWidth() * currentIndex}px)`;
    updateDots();
  }

  /* ── Advance one step ── */
  function next() {
    if (transitioning || allVisible) return;
    transitioning = true;
    const nextIndex = currentIndex + 1;
    goTo(nextIndex, true);

    // After the CSS transition ends, check if we entered the clone zone
    carousel.addEventListener('transitionend', function handler() {
      carousel.removeEventListener('transitionend', handler);
      transitioning = false;

      if (currentIndex >= totalCards) {
        // Instantly snap back to the real start (no animation)
        const offset = currentIndex - totalCards;
        goTo(offset, false);
        // Force reflow so the next animated goTo works correctly
        void carousel.getBoundingClientRect();
      }
    });
  }

  /* ── Auto-timer (no initial freeze: first tick fires after exactly 3 s) ── */
  function startTimer() {
    autoTimer = setInterval(next, 3000);
  }

  function resetTimer() {
    clearInterval(autoTimer);
    startTimer();
  }

  /* ── Swipe support ── */
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : goTo(Math.max(currentIndex - 1, 0), true);
      resetTimer();
    }
  }, { passive: true });

  /* ── Pause on hover ── */
  carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
  carousel.addEventListener('mouseleave', () => { if (!allVisible) startTimer(); });

  /* ── Initialise ── */
  setupClones();
  buildDots();
  goTo(0, false);   // Position instantly at index 0 — no transition on load
  startTimer();     // First real auto-advance fires in 3 s (no freeze)

  /* ── Rebuild on resize ── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupClones();
      buildDots();
      goTo(0, false);
    }, 200);
  });

  /* ── Populate All Services Grid ── */
  if (allGrid) {
    cards.forEach(card => allGrid.appendChild(card.cloneNode(true)));
  }

  /* ── View All Services toggle ── */
  if (viewAllBtn && allGrid) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      allVisible = !allVisible;

      const wrapper = document.getElementById('carousel-wrapper');

      if (allVisible) {
        allGrid.style.display = 'grid';
        requestAnimationFrame(() => allGrid.classList.add('visible'));
        viewAllBtn.innerHTML = `Hide Services <span class="material-symbols-outlined">expand_less</span>`;
        if (wrapper) wrapper.style.display = 'none';
        clearInterval(autoTimer);
      } else {
        allGrid.classList.remove('visible');
        allGrid.style.display = 'none';
        if (wrapper) wrapper.style.display = 'block';
        viewAllBtn.innerHTML = `View All Services <span class="material-symbols-outlined">arrow_forward</span>`;
        startTimer();
      }
    });
  }
})();
