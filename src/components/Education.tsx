import { GraduationCap } from 'lucide-react'
import { site } from '../config/site'
import { SectionHeader } from './ui'

// Kept separate from Experience; sits between More work by organization and In Their Words.
export function Education() {
  const { education } = site
  return (
    <section id="education" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 pt-8 sm:px-8">
      <SectionHeader index="06" label="Education" />
      <div data-reveal="right" className="mt-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/55 p-6 sm:flex-row sm:items-center sm:gap-6 md:backdrop-blur-sm">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red/40 bg-red/[0.08] text-red">
            <GraduationCap size={22} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-extrabold uppercase text-white">{education.school}</span>
            <span className="mt-1 block text-sm text-white/60">{education.field}</span>
          </span>
          <span className="label text-[10px]">{education.period}</span>
        </div>
      </div>
    </section>
  )
}
