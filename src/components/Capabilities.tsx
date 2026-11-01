import {
  Bot,
  Boxes,
  Code2,
  Database,
  FileSpreadsheet,
  Globe,
  ListChecks,
  MessagesSquare,
  Plug,
  Route,
  Sparkles,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { site } from '../config/site'
import { scrollToHash } from '../lib/motion'
import { Chip, SectionHeader, pad2 } from './ui'

// One icon per capability area, in the order they appear in site.ts
const AREA_ICONS: LucideIcon[] = [Database, Workflow, Bot, Plug, Wrench, Route, Code2, ListChecks]
// One icon per toolkit group: CRM, automation & AI, communication, forms & documents, web, collaboration
const TOOLKIT_ICONS: LucideIcon[] = [Database, Sparkles, MessagesSquare, FileSpreadsheet, Globe, Users]

export function Capabilities() {
  const { capabilities, work } = site
  return (
    <section id="capabilities" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionHeader
        index="02"
        label={capabilities.label}
        headline={capabilities.headline}
        intro={capabilities.intro}
      />

      <div data-reveal className="mt-12 divide-y divide-white/10 border-y border-white/10">
        {capabilities.areas.map((area, i) => {
          const Icon = AREA_ICONS[i] ?? Workflow
          return (
          <details key={area.title} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-4 py-5 transition hover:text-red sm:gap-5 [&::-webkit-details-marker]:hidden">
              <span className="font-display text-sm font-bold text-red">{pad2(i + 1)}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red/40 bg-red/[0.08] text-red transition group-open:shadow-glow">
                <Icon size={17} aria-hidden />
              </span>
              <span className="flex-1 font-display text-base font-extrabold uppercase tracking-wide sm:text-xl">
                {area.title}
              </span>
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-full border border-red/40 text-red transition group-open:rotate-45 group-open:bg-red group-open:text-on-accent"
              >
                +
              </span>
            </summary>
            <div className="grid gap-6 pb-8 pl-0 sm:pl-11 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="leading-relaxed text-white/75">{area.body}</p>
                <p className="label mt-5 text-[10px]">Tools</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {area.tools.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="label text-[10px]">Seen in</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {area.seenIn.map((n) => {
                    const c = work.cases[n - 1]
                    return (
                      <li key={n}>
                        <a
                          href={`#${c.id}`}
                          onClick={(e) => {
                            e.preventDefault()
                            scrollToHash(`#${c.id}`)
                          }}
                          className="group/link flex gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:border-red/60 hover:bg-red/[0.06] hover:text-white"
                        >
                          <span className="font-display text-xs font-bold text-red">{pad2(n)}</span>
                          <span className="flex-1">{c.title}</span>
                          <span aria-hidden className="text-red transition group-hover/link:translate-x-1">
                            →
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </details>
          )
        })}
      </div>

      <div className="mt-20">
        <div data-reveal="left" className="flex items-end justify-between gap-4">
          <p className="label section-title flex items-center gap-3">
            <Boxes size={14} className="text-pop" aria-hidden /> Toolkit
          </p>
          <p className="label text-[10px] text-white/45">
            {capabilities.toolkit.reduce((n, g) => n + g.items.length, 0)} tools · {capabilities.toolkit.length} groups
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.toolkit.map((group, i) => {
            const Icon = TOOLKIT_ICONS[i] ?? Boxes
            return (
              <div key={group.group} data-reveal={i % 2 ? 'right' : 'left'}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-5 transition duration-300 hover:border-red/50 md:backdrop-blur-sm">
                  {/* thin glowing accent along the top edge */}
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-red/70 to-transparent opacity-50 transition group-hover:opacity-100"
                  />
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-red/40 bg-red/[0.08] text-red transition group-hover:bg-red group-hover:text-on-accent">
                      <Icon size={16} aria-hidden />
                    </span>
                    <p className="label flex-1 text-[10px] text-white/85">{group.group}</p>
                    <span className="font-display text-xs font-bold text-white/30">{pad2(group.items.length)}</span>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {group.items.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80 transition hover:border-red/60 hover:bg-red/10 hover:text-white"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
