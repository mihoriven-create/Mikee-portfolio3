import { Building2 } from 'lucide-react'
import { site } from '../config/site'
import { LogoIcon, SectionHeader } from './ui'

type Org = (typeof site.work.clientWork.orgs)[number]

// One client business: square logo to the left of its name, a one-line description, and every
// contribution.
function OrgCard({ org, index }: { org: Org; index: number }) {
  return (
    <li data-reveal={index % 2 ? 'right' : 'left'} className="flex">
      <div className="flex w-full flex-col rounded-2xl border border-white/10 bg-black/55 md:bg-black/[0.68] p-5">
        <div className="flex items-center gap-4">
          <LogoIcon src={org.logo} name={org.name} fallback={<Building2 size={18} aria-hidden />} />
          <div className="min-w-0">
            <p className="font-display text-sm font-extrabold uppercase leading-snug text-white">{org.name}</p>
            {org.role && <p className="label mt-1 text-[9px] text-red">{org.role}</p>}
          </div>
        </div>
        <p className="mt-4 border-l-2 border-red/60 pl-3 text-sm font-medium text-white/90">{org.summary}</p>
        <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-white/70">
          {org.contributions.map((c) => (
            <li key={c} className="flex gap-2.5">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

// More work by organization: sits between Experience ("Where I have worked") and Education.
export function Organizations() {
  const { clientWork } = site.work
  return (
    <section id="organizations" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionHeader index="05" label={clientWork.label} headline={clientWork.headline} intro={clientWork.intro} />
      <ul className="mt-12 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientWork.orgs.map((org, i) => (
          <OrgCard key={org.name} org={org} index={i} />
        ))}
      </ul>
    </section>
  )
}
