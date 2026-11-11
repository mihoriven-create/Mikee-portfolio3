import { useCallback, useState } from 'react'
import { Maximize2, MessageSquareQuote, Quote } from 'lucide-react'
import { site } from '../config/site'
import { Lightbox } from './Gallery'
import { SectionHeader } from './ui'

function Attribution({ name, org, logo }: { name: string; org: string; logo: string }) {
  return (
    <figcaption className="mt-6 flex items-center gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white p-1.5">
        <img src={logo} alt={`${org} logo`} loading="lazy" className="max-h-full max-w-full object-contain" />
      </span>
      <span>
        <span className="block font-display text-sm font-extrabold uppercase text-white">{name}</span>
        <span className="label mt-1 block text-[10px]">{org}</span>
      </span>
    </figcaption>
  )
}

// Testimonials with company logos, then the original reviews from day-to-day work with their
// Slack screenshots (click to open full size).
export function Feedback() {
  const { feedback } = site
  const [lead, ...rest] = feedback.testimonials
  const shots = feedback.fromWork.map((item) => item.shot)
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])

  return (
    <section id="feedback" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionHeader index="07" label={feedback.label} headline={feedback.headline} />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <figure
          data-reveal="left"
          className="relative rounded-2xl border border-red/30 bg-black/55 md:bg-black/[0.68] bg-gradient-to-br from-red/[0.12] to-transparent p-7 sm:p-10 lg:row-span-2"
        >
          <Quote size={40} className="fill-red text-red" aria-hidden />
          <blockquote className="mt-4 font-grotesk text-lg leading-relaxed text-white sm:text-xl">{lead.quote}</blockquote>
          <Attribution {...lead} />
        </figure>
        {rest.map((t) => (
          <figure key={t.name} data-reveal="right" className="rounded-2xl border border-white/10 bg-black/55 md:bg-black/[0.68] p-7">
            <Quote size={22} className="fill-red/70 text-red/70" aria-hidden />
            <blockquote className="mt-3 text-white/85">{t.quote}</blockquote>
            <Attribution {...t} />
          </figure>
        ))}
      </div>

      <div className="mt-16">
        <div data-reveal="left">
          <p className="label flex items-center gap-3">
            <MessageSquareQuote size={15} className="text-red" aria-hidden /> From the work itself
          </p>
          <p className="mt-3 max-w-2xl text-white/65">{feedback.fromWorkIntro}</p>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {feedback.fromWork.map((item, i) => (
            <li key={item.name} data-reveal={i % 2 ? 'right' : 'left'} className="flex">
              <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55 md:bg-black/[0.68]">
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="group relative block aspect-[16/7] w-full cursor-zoom-in overflow-hidden bg-[#1a1d21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red/70"
                  aria-label={`Open full-size screenshot: ${item.shot.caption}`}
                >
                  <img
                    src={item.shot.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="label absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[9px] text-white">
                    <Maximize2 size={11} aria-hidden /> View
                  </span>
                </button>
                <div className="flex flex-1 flex-col p-6">
                  <p className="label text-[10px] text-red">{item.topic}</p>
                  {item.quote && <p className="mt-3 flex-1 text-white/85">“{item.quote}”</p>}
                  <p className="mt-4 text-sm text-white/60">— {item.name}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {open !== null && <Lightbox shots={shots} index={open} onClose={close} />}
    </section>
  )
}
