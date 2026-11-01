import type { ReactNode } from 'react'

export function SectionLabel({ index, children, center }: { index?: string; children: ReactNode; center?: boolean }) {
  return (
    <p className={`label flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
      {index && <span className="text-red">({index})</span>}
      {children}
      <span className="h-px w-8 bg-red/70" />
    </p>
  )
}

export function SectionHeader({
  index,
  label,
  headline,
  intro,
  center,
}: {
  index: string
  label: string
  headline?: readonly string[]
  intro?: string
  center?: boolean
}) {
  return (
    <div data-reveal={center ? undefined : 'left'} className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <SectionLabel index={index} center={center}>
        {label}
      </SectionLabel>
      {headline && (
        <h2 className="mt-5 font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(2rem,5.5vw,4.5rem)]">
          {headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
      )}
      {intro && (
        <p className={`mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg ${center ? 'mx-auto text-balance' : ''}`}>{intro}</p>
      )}
    </div>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-red/30 bg-red/[0.06] px-3 py-1 font-grotesk text-[11px] uppercase tracking-[0.14em] text-white/80">
      {children}
    </span>
  )
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

// Square company-logo tile shown to the left of a business name. Logos are transparent PNGs,
// fitted whole on a light tile so dark marks (e.g. a black emblem) stay visible on the dark site.
export function LogoIcon({ src, name, fallback }: { src?: string; name: string; fallback?: ReactNode }) {
  if (!src) {
    return (
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-red/40 bg-red/10 text-red">
        {fallback}
      </span>
    )
  }
  return (
    <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_6px_20px_-10px_rgb(var(--c-red)/0.6)] ring-1 ring-white/20">
      <img src={src} alt={`${name} logo`} loading="lazy" className="h-full w-full object-contain" />
    </span>
  )
}
