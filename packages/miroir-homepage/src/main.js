// ── Dark mode FOUC prevention ──────────────────────────────────────────────
// The real FOUC guard is the inline <script> in each HTML <head>; this module
// wires up the toggle button after DOM is ready.

const STORAGE_KEY = 'miroir-theme'

function init() {
  const html = document.documentElement

  // ── Theme toggle ──────────────────────────────────────────────────────────
  function syncIcons() {
    const isDark = html.classList.contains('dark')
    document.getElementById('icon-sun')?.classList.toggle('hidden', !isDark)
    document.getElementById('icon-moon')?.classList.toggle('hidden', isDark)
    const btn = document.getElementById('theme-toggle')
    if (btn) btn.dataset.tooltip = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  }
  syncIcons()

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const isDark = html.classList.toggle('dark')
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    syncIcons()
  })

  // ── Mobile menu ───────────────────────────────────────────────────────────
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden')
  })

  // ── Image base-URL resolution ─────────────────────────────────────────────
  // Vite exposes import.meta.env.BASE_URL which is '/miroir/' in production
  // and '/' in dev. We use data-src on <img> tags so paths are always correct
  // regardless of which sub-page the script runs on.
  const base = import.meta.env.BASE_URL
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = base + img.dataset.src
  })

  // ── Scroll-reveal ─────────────────────────────────────────────────────────
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          revealObserver.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

  // ── Lightbox ──────────────────────────────────────────────────────────────
  const lightbox = document.getElementById('lightbox')
  const lightboxImg = document.getElementById('lightbox-img')

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return
    lightboxImg.src = src
    lightboxImg.alt = alt ?? ''
    lightbox.classList.remove('hidden')
    lightbox.classList.add('flex')
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    lightbox?.classList.add('hidden')
    lightbox?.classList.remove('flex')
    document.body.style.overflow = ''
  }

  document.querySelectorAll('[data-lightbox]').forEach(el => {
    el.addEventListener('click', () => {
      const img = el.querySelector('img')
      if (img) openLightbox(img.src, img.alt)
    })
  })

  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox)
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox() })
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox() })
}

// Module scripts are deferred, so DOM is ready when this runs.
// Guard against Vite HMR re-evaluation after DOMContentLoaded has already fired.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
