// ── Dark mode FOUC prevention ──────────────────────────────────────────────
// The real FOUC guard is the inline <script> in each HTML <head>; this module
// wires up the toggle button after DOM is ready.

const STORAGE_KEY = 'miroir-theme'

// ── Navbar renderer ───────────────────────────────────────────────────────
// Each page sets window.NAVBAR_CONFIG = { base, active } before importing this
// module.  base is the relative path from the page to the site root (e.g.
// './', '../', '../../').  active is the key of the currently-active nav
// link (e.g. 'blog'), or null for the home page.
function renderNavbar({ base = './', active = null } = {}) {
  const placeholder = document.getElementById('site-navbar')
  if (!placeholder) return

  const link = (href, label, key) => {
    const cls = key === active ? 'nav-link-active' : 'nav-link'
    return `<a href="${href}" class="${cls}">${label}</a>`
  }

  const externalLink = (href, label) =>
    `<a href="${href}" target="_blank" rel="noopener" class="nav-link">${label}</a>`

  // "Home" appears in the mobile menu only when not on the root page
  const mobileHomeLink = base === './' ? '' : link(base, 'Home', null)

  const html = `<nav class="fixed top-0 inset-x-0 z-50 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
      <a href="${base}" class="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400 shrink-0">
        <img data-src="miroir-logo.png" alt="" class="h-7 w-7" />
        Miroir
      </a>
      <div class="hidden md:flex items-center gap-6 text-sm font-medium ml-2">
        ${link(base + 'blog/', 'Blog', 'blog')}
        ${link(base + 'sandbox/', 'Sandbox', 'sandbox')}
        ${externalLink('https://github.com/miroir-framework/miroir/tree/master/docs', 'Docs')}
        ${externalLink('https://github.com/miroir-framework/miroir', 'GitHub')}
      </div>
      <div class="ml-auto flex items-center gap-2">
        <button id="theme-toggle" aria-label="Toggle dark mode" data-tooltip="" class="theme-tooltip p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg id="icon-sun" class="hidden h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
          <svg id="icon-moon" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        </button>
        <button id="menu-toggle" aria-label="Open menu" class="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-4 flex flex-col gap-4 text-sm font-medium">
      ${mobileHomeLink}
      ${link(base + 'blog/', 'Blog', 'blog')}
      ${link(base + 'sandbox/', 'Sandbox', 'sandbox')}
      ${externalLink('https://github.com/miroir-framework/miroir/tree/master/docs', 'Docs')}
      ${externalLink('https://github.com/miroir-framework/miroir', 'GitHub')}
    </div>
  </nav>`

  placeholder.outerHTML = html
}

function init() {
  renderNavbar(window.NAVBAR_CONFIG || {})

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
