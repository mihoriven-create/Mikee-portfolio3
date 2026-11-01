import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import type { Shot } from '../config/site'
import { EASE, EASE_IN, prefersReducedMotion } from '../lib/easing'
import { motion } from '../lib/motion'

const SLIDE = 40 // px a screenshot travels when switching

// Full-size viewer for screenshots. Esc closes, arrow keys step through.
// `animated` (used by the Projects section) adds a soft scale-and-fade open/close and sliding
// swaps between screenshots; without it the viewer behaves exactly as before.
export function Lightbox({
  shots,
  index,
  onClose,
  animated = false,
}: {
  shots: Shot[]
  index: number
  onClose: () => void
  animated?: boolean
}) {
  const [i, setI] = useState(index)
  const dir = useRef(0)
  const backdrop = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const reduced = prefersReducedMotion()

  const step = useCallback(
    (d: number) => {
      dir.current = d
      setI((n) => (n + d + shots.length) % shots.length)
    },
    [shots.length],
  )

  // Close: fade and settle back to 0.96 before unmounting
  const requestClose = useCallback(() => {
    if (!animated) return onClose()
    if (closing.current) return
    closing.current = true
    gsap.to(backdrop.current, { opacity: 0, duration: 0.22, ease: EASE_IN })
    gsap.to(panel.current, {
      opacity: 0,
      scale: reduced ? 1 : 0.96,
      duration: 0.22,
      ease: EASE_IN,
      onComplete: onClose,
    })
  }, [animated, onClose, reduced])

  // Open: scale 0.96 → 1 with a fade; focus lands on the close button
  useLayoutEffect(() => {
    if (!animated) return
    closeBtn.current?.focus({ preventScroll: true })
    gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: EASE })
    gsap.fromTo(
      panel.current,
      { opacity: 0, scale: reduced ? 1 : 0.96 },
      { opacity: 1, scale: 1, duration: 0.5, ease: EASE, clearProps: 'transform' },
    )
  }, [animated, reduced])

  // Switching screenshots slides the new one in from the side it came from
  useLayoutEffect(() => {
    if (!animated || dir.current === 0 || !image.current) return
    gsap.fromTo(
      image.current,
      { opacity: 0, x: reduced ? 0 : dir.current * SLIDE },
      { opacity: 1, x: 0, duration: reduced ? 0.2 : 0.5, ease: EASE },
    )
  }, [i, animated, reduced])

  useEffect(() => {
    motion.lenis?.stop()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      motion.lenis?.start()
    }
  }, [requestClose, step])

  const shot = shots[i]
  const fx = animated ? 'focus-ring press' : '' // Projects-only focus and press feel
  // Portal to <body>: reveal animations leave transforms on ancestors, which would trap position: fixed
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={shot.caption} className="fixed inset-0 z-[60]" onClick={requestClose}>
      <div ref={backdrop} aria-hidden className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div ref={panel} className="relative flex h-full flex-col p-4 sm:p-8">
        <div className="flex items-center justify-between gap-4 text-white/80" onClick={(e) => e.stopPropagation()}>
          <span className="label text-[10px]">
            {i + 1} / {shots.length}
          </span>
          <button
            ref={closeBtn}
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className={`glass-pill ${fx} grid h-10 w-10 place-items-center`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden py-4">
          <img
            ref={image}
            key={shot.src}
            src={shot.src}
            alt={shot.caption}
            className="max-h-full max-w-full rounded-lg border border-white/10 object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {shots.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous screenshot"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                className={`glass-pill ${fx} absolute left-0 grid h-11 w-11 place-items-center text-white`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next screenshot"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                className={`glass-pill ${fx} absolute right-0 grid h-11 w-11 place-items-center text-white`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
        <p className="mx-auto max-w-3xl text-center text-sm text-white/75" onClick={(e) => e.stopPropagation()}>
          {shot.caption}
        </p>
      </div>
    </div>,
    document.body,
  )
}

const ctrl =
  'group/btn focus-ring press grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-red hover:text-white'

// Compact screenshot viewer: one real screenshot at a time, with previous / next controls, dots,
// and a button to open it full size. Swaps slide horizontally; the image drifts gently inside its
// frame as the card scrolls (parallax), except with reduced motion.
export function Gallery({ shots, label = 'Screenshots' }: { shots: Shot[]; label?: string }) {
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)
  const dir = useRef(0)
  const frame = useRef<HTMLButtonElement>(null)
  const drift = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const step = (d: number) => {
    dir.current = d
    setI((n) => (n + d + shots.length) % shots.length)
  }
  const shot = shots[i]

  // Slide the new screenshot in from the side it came from, with a short fade
  useLayoutEffect(() => {
    if (dir.current === 0 || !image.current) return
    const reduced = prefersReducedMotion()
    gsap.fromTo(
      image.current,
      { opacity: 0, x: reduced ? 0 : dir.current * SLIDE },
      { opacity: 1, x: 0, duration: reduced ? 0.2 : 0.55, ease: EASE },
    )
  }, [i])

  // Parallax: ~8% travel of the screenshot inside its frame while the card crosses the screen
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          drift.current,
          { yPercent: -4, scale: 1.08 },
          {
            yPercent: 4,
            scale: 1.08,
            ease: 'none',
            scrollTrigger: { trigger: frame.current, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: frame },
  )

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <p className="label text-[10px]">
          {label} · {i + 1} / {shots.length}
        </p>
        <div className="flex items-center gap-1.5">
          {shots.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous screenshot" className={ctrl}>
                <ChevronLeft size={16} className="ease-cinema transition-transform group-hover/btn:-translate-x-0.5" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next screenshot" className={ctrl}>
                <ChevronRight size={16} className="ease-cinema transition-transform group-hover/btn:translate-x-0.5" />
              </button>
            </>
          )}
          <button type="button" onClick={() => setOpen(true)} aria-label={`Open full size: ${shot.caption}`} className={ctrl}>
            <Maximize2 size={14} className="ease-cinema transition-transform group-hover/btn:scale-110" />
          </button>
        </div>
      </div>
      <button
        ref={frame}
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring block w-full cursor-zoom-in overflow-hidden bg-white"
        aria-label={`Open full size: ${shot.caption}`}
      >
        <div ref={drift} className="h-48 sm:h-64">
          <img
            ref={image}
            key={shot.src}
            src={shot.src}
            alt={shot.caption}
            loading="lazy"
            decoding="async"
            className="mx-auto h-full w-full object-contain"
          />
        </div>
      </button>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <p className="line-clamp-1 text-xs text-white/65">{shot.caption}</p>
        {shots.length > 1 && (
          <div className="flex shrink-0 gap-1.5" aria-hidden>
            {shots.map((s, n) => (
              <span
                key={s.src}
                className={`h-1.5 rounded-full ${n === i ? 'w-4 bg-red' : 'w-1.5 bg-white/25'}`}
              />
            ))}
          </div>
        )}
      </div>
      {open && <Lightbox shots={shots} index={i} onClose={close} animated />}
    </div>
  )
}
