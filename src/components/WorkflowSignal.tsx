import { useEffect, useRef } from 'react'

// A thin "live workflow" line in the right-hand margin while The Approach is on screen. As the
// visitor scrolls through the section, a small glowing pulse travels down the line through the
// steps a lead takes; each step lights up and shows its label as the pulse reaches it.
// Purely decorative (the section's text already explains the workflow), so it is hidden from
// assistive technology. It stays in the margin, clear of the content, and uses the theme colours.

const STEPS = ['Form', 'CRM', 'Qualification', 'Follow-up', 'Team alert', 'Appointment']
const TOP = 0.22 // the line runs from 22% to 78% of the screen height
const BOTTOM = 0.78
const REACH = 0.075 // how close (as a share of the line) the pulse must be for a step to light up

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)

export function WorkflowSignal({ reducedMotion }: { reducedMotion: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const pulse = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const labels = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    let compact: boolean | null = null

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = root.current
      const section = document.getElementById('approach')
      if (!el || !section) return
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      const r = section.getBoundingClientRect()

      // Only while The Approach is on screen (it is shorter than the screen): in as it rises past
      // the lower part of the screen, out as it leaves the top
      const shown = Math.min(clamp01((vh * 0.85 - r.top) / (vh * 0.2)), clamp01((r.bottom - vh * 0.2) / (vh * 0.2)))
      el.style.opacity = smooth(shown).toFixed(3)
      if (shown <= 0) return

      // Sit in the right margin: with labels where it is wide, a slim version at the edge otherwise
      const contentRight = r.right - parseFloat(getComputedStyle(section).paddingRight)
      const margin = vw - contentRight
      const isCompact = margin < 150
      if (isCompact !== compact) {
        compact = isCompact
        el.dataset.compact = String(isCompact)
      }
      el.style.left = `${isCompact ? vw - Math.max(5, margin * 0.35) : vw - Math.min(44, margin * 0.3)}px`

      // How far the section has crossed the screen: Form as its top passes 60% of the screen,
      // Appointment as its bottom passes 40%
      const p = clamp01((vh * 0.6 - r.top) / (r.height + vh * 0.2))
      const length = (BOTTOM - TOP) * vh
      if (fill.current) fill.current.style.height = `${p * length}px`
      if (pulse.current) pulse.current.style.transform = `translate3d(-50%, ${p * length}px, 0)`

      STEPS.forEach((_, i) => {
        const at = i / (STEPS.length - 1)
        const near = smooth(1 - clamp01(Math.abs(p - at) / REACH))
        const passed = p >= at - REACH
        const node = nodes.current[i]
        const label = labels.current[i]
        if (node) {
          node.style.transform = `translate(-50%, -50%) scale(${1 + near * 0.8})`
          node.style.opacity = (passed ? 0.8 + near * 0.2 : 0.5).toFixed(3)
          node.style.boxShadow = near > 0.01 ? `0 0 ${4 + near * 10}px rgb(var(--c-red) / ${0.9 * near})` : 'none'
        }
        if (label) label.style.opacity = near.toFixed(3)
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={root}
      aria-hidden
      className="group pointer-events-none fixed z-[15] w-0 opacity-0"
      style={{ top: `${TOP * 100}vh`, height: `${(BOTTOM - TOP) * 100}vh` }}
    >
      {/* The line, and the part the pulse has already travelled */}
      <div className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-white/20" />
      <div ref={fill} className="absolute left-0 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-red/20 to-red/80" />

      {STEPS.map((step, i) => (
        <div key={step} className="absolute left-0" style={{ top: `${(i / (STEPS.length - 1)) * 100}%` }}>
          <div
            ref={(n) => (nodes.current[i] = n)}
            className="absolute left-0 top-0 h-[5px] w-[5px] rounded-full border border-red bg-bg group-data-[compact=true]:h-1 group-data-[compact=true]:w-1"
          />
          {/* Label to the left of the line; left out on narrow screens, where the margin is too
              slim to hold it without crowding the text */}
          <span
            ref={(n) => (labels.current[i] = n)}
            className="label absolute right-3 top-0 -translate-y-1/2 whitespace-nowrap text-[9px] text-red opacity-0 [text-shadow:0_0_10px_rgb(var(--c-red)/0.6)] group-data-[compact=true]:hidden"
          >
            {step}
          </span>
        </div>
      ))}

      {/* The pulse, with a short fading trail */}
      <div ref={pulse} className="absolute left-0 top-0">
        {!reducedMotion && (
          <div className="absolute bottom-0 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-[rgb(var(--c-tint))]" />
        )}
        <div className="absolute left-1/2 top-0 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--c-tint))] shadow-[0_0_6px_rgb(var(--c-tint)/0.9),0_0_16px_rgb(var(--c-red)/0.7)]" />
      </div>
    </div>
  )
}
