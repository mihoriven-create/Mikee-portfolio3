import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Briefcase,
  FileText,
  Layers,
  MapPin,
  Plug,
  Repeat,
  SearchCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { site } from '../config/site'
import { SectionHeader, pad2 } from './ui'

const FACT_ICONS: Record<string, LucideIcon> = {
  'Current role': Briefcase,
  'Core platforms': Layers,
  'Technical roots': Wrench,
  'Based in': MapPin,
}
const PRINCIPLE_ICONS: LucideIcon[] = [Plug, Repeat, SearchCheck, FileText]

// Systems People Rely On: portrait and profile, bio, principles and counters.
export function About({ reducedMotion }: { reducedMotion: boolean }) {
  const { about, stats } = site
  const statsRef = useRef<HTMLDListElement>(null)

  useGSAP(
    () => {
      if (reducedMotion) return
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const counter = { v: 0 }
        gsap.to(counter, {
          v: Number(el.dataset.count),
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 85%', once: true },
          onStart: () => {
            el.textContent = '0'
          },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.v))
          },
        })
      })
    },
    { scope: statsRef, dependencies: [reducedMotion] },
  )

  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionHeader index="03" label={about.label} headline={about.headline} />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.25fr]">
        <div data-reveal="left" className="h-fit overflow-hidden rounded-2xl border border-red/25 bg-black/55 md:bg-black/[0.68]">
          {/* The supplied photo is a small head-and-shoulders crop (216×229), so it is shown whole
              rather than cropped further; a larger photo would allow more of the upper body. */}
          <div className="flex items-center gap-5 border-b border-white/10 bg-gradient-to-br from-red/15 to-transparent p-6 sm:p-8">
            <img
              src={site.portrait}
              alt={`Portrait of ${site.name}`}
              loading="lazy"
              width={216}
              height={229}
              className="h-auto w-28 shrink-0 rounded-2xl border border-white/15 object-contain shadow-[0_10px_40px_-12px_rgb(var(--c-red)/0.5)] sm:w-32"
            />
            <p className="font-display text-lg font-extrabold uppercase leading-snug text-white">{about.fullName}</p>
          </div>
          <dl className="flex flex-col gap-5 p-6 sm:p-8">
            {about.facts.map((f) => {
              const Icon = FACT_ICONS[f.label] ?? Briefcase
              const [first, ...rest] = f.value
              return (
                <div key={f.label} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red/40 bg-red/[0.08] text-red">
                    <Icon size={16} aria-hidden />
                  </span>
                  <div>
                    <dt className="label text-[10px] text-red">{f.label}</dt>
                    <dd className="mt-1 text-sm text-white/85">
                      <span className="block font-semibold text-white">{first}</span>
                      {rest.map((line) => (
                        <span key={line} className="block text-white/65">
                          {line}
                        </span>
                      ))}
                    </dd>
                  </div>
                </div>
              )
            })}
          </dl>
        </div>
        <div data-reveal="right" className="flex flex-col gap-5 text-base leading-relaxed text-white/80 sm:text-lg">
          {about.story.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </div>

      <ol data-reveal className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {about.principles.map((p, i) => {
          const Icon = PRINCIPLE_ICONS[i] ?? Plug
          return (
            <li key={p.title} className="rounded-2xl border border-white/10 bg-black/55 p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-red/40 bg-red/[0.08] text-red">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="font-display text-sm font-bold text-red/60">{pad2(i + 1)}</span>
              </div>
              <p className="mt-5 font-display text-base font-extrabold uppercase leading-snug text-white">{p.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{p.body}</p>
            </li>
          )
        })}
      </ol>

      <dl
        ref={statsRef}
        data-reveal
        className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-red/30 bg-red/20 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse justify-end bg-[#0b0408] p-6 sm:p-8">
            <dt className="label mt-3 text-white/55">{stat.label}</dt>
            <dd className="font-display text-5xl font-black text-pop-text [text-shadow:0_0_30px_rgb(var(--c-pop)/0.6)] sm:text-6xl">
              <span data-count={stat.value} className="tabular-nums">
                {stat.value}
              </span>
              <span className="text-pop">{stat.suffix}</span>
            </dd>
          </div>
        ))}
      </dl>

    </section>
  )
}
