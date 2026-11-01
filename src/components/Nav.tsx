import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Check, Palette } from 'lucide-react'
import { site } from '../config/site'
import { scrollToHash } from '../lib/motion'
import { THEMES, THEME_CHANGE, getTheme, setTheme, type ThemeId } from '../lib/theme'

// Palette button: opens a small menu of colour themes. The whole site (and the 3D maze) recolours
// at once; the choice is remembered in this browser.
function ThemePicker() {
  const [open, setOpen] = useState(false)
  const [theme, setThemeState] = useState<ThemeId>(getTheme)
  const root = useRef<HTMLDivElement>(null)

  // The hero orb can change the theme too; keep the tick mark on the right one
  useEffect(() => {
    const sync = () => setThemeState(getTheme())
    window.addEventListener(THEME_CHANGE, sync)
    return () => window.removeEventListener(THEME_CHANGE, sync)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const choose = (id: ThemeId) => {
    setTheme(id)
    setThemeState(id)
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="theme-menu"
        aria-label="Colour theme"
        title="Colour theme"
        className="glass-pill grid h-9 w-9 place-items-center text-white/85 hover:text-white"
      >
        <Palette size={16} aria-hidden />
      </button>
      {open && (
        <div
          id="theme-menu"
          role="radiogroup"
          aria-label="Colour theme"
          className="absolute right-0 top-12 flex w-44 flex-col gap-1 rounded-2xl border border-red/40 bg-bg/90 p-2 backdrop-blur-xl"
        >
          {THEMES.map((t) => {
            const on = t.id === theme
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(t.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-grotesk text-[11px] uppercase tracking-[0.2em] transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70 ${
                  on ? 'text-white' : 'text-white/70'
                }`}
              >
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ background: t.swatch, boxShadow: `0 0 10px ${t.swatch}` }}
                />
                <span className="flex-1">{t.label}</span>
                {on && <Check size={14} aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)

  const onAnchor = (e: MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href')
    if (!href?.startsWith('#')) return
    e.preventDefault()
    setOpen(false)
    scrollToHash(href)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8" aria-label="Main">
        <a href="#top" onClick={onAnchor} className="group flex items-center gap-3" aria-label={`${site.name}, home`}>
          <span className="h-2 w-2 rounded-full bg-red animate-pulse-dot" />
          <span className="font-display text-sm font-extrabold tracking-[0.35em] text-white transition group-hover:text-glow">
            {site.wordmark}
          </span>
        </a>

        <div className="flex items-center gap-2">
          <ul className="hidden items-center gap-2 lg:flex">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={onAnchor}
                  className="glass-pill block px-3.5 py-2 font-grotesk text-[10px] font-medium uppercase tracking-[0.2em] text-white/85 hover:text-white xl:px-4 xl:text-[11px]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ThemePicker />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="glass-pill px-4 py-2 font-grotesk text-[11px] font-medium uppercase tracking-[0.22em] text-white lg:hidden"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {open && (
        <ul
          id="mobile-menu"
          className="mx-4 flex flex-col gap-1 rounded-2xl border border-red/40 bg-bg/90 p-3 backdrop-blur-xl sm:mx-8 lg:hidden"
        >
          {site.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onAnchor}
                className="block rounded-xl px-4 py-3 font-grotesk text-sm uppercase tracking-[0.2em] text-white/85 transition hover:bg-red/10 hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
