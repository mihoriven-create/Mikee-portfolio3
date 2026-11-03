import { useEffect, useRef } from 'react'

// A custom pointer for mouse users: a small white arrow with a navy outline, a cyan glow and a hint
// of circuitry. It is moved straight to the pointer on every event (no easing, so no lag). Over
// links and buttons it tightens and glows brighter; pressing squeezes it. Text fields
// get the native I-beam back, and touch or pen input never sees it. The native cursor is only
// hidden once a real mouse has moved, so it stays as the fallback until then.
// To turn it off, remove <Cursor /> from App.tsx.

const TEXT_FIELD =
  'input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]), textarea, [contenteditable]:not([contenteditable="false"])'
const INTERACTIVE =
  'a[href], button, select, label, summary, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"]), input, .cursor-pointer, .cursor-grab, .cursor-zoom-in'

export function Cursor() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    let state = 'hidden'

    const set = (next: string) => {
      if (next === state) return
      state = next
      el.dataset.state = next
    }
    const off = () => {
      html.classList.remove('custom-cursor')
      set('hidden')
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !fine.matches) return off()
      html.classList.add('custom-cursor')
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest(TEXT_FIELD)) set('hidden')
      else set(target?.closest(INTERACTIVE) ? 'hover' : 'idle')
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') el.dataset.press = '1'
    }
    const up = () => {
      el.dataset.press = '0'
    }
    const leave = () => set('hidden')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('blur', leave)
    html.addEventListener('mouseleave', leave)
    fine.addEventListener('change', off)
    return () => {
      off()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('blur', leave)
      html.removeEventListener('mouseleave', leave)
      fine.removeEventListener('change', off)
    }
  }, [])

  return (
    <div ref={root} aria-hidden data-state="hidden" data-press="0" className="cursor-fx">
      {/* The arrow; its tip sits exactly on the pointer */}
      <svg className="cursor-arrow" viewBox="0 0 24 24">
        <path
          d="M3 2.5 L3 19.5 L7.4 15.4 L10.6 22 L13.9 20.5 L10.8 14 L17 13.6 Z"
          fill="#ffffff"
          stroke="#0b2350"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.9 15.2 L11.4 18.4 L12.6 18.4" fill="none" stroke="#22b8e0" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="12.9" cy="18.4" r="0.75" fill="#22e3ff" />
      </svg>
    </div>
  )
}
