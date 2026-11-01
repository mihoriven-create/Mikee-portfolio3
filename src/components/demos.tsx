import { useId, useMemo, useState } from 'react'

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="label block text-[10px] text-white/55">
        {label}
      </label>
      {/* Editable values glow neon blue so visitors can see they can change them */}
      <div className="mt-2 flex cursor-text items-center gap-2 rounded-lg border border-signal/35 bg-black/40 px-3 py-2 transition hover:border-signal/70 focus-within:border-signal focus-within:shadow-[0_0_16px_-4px_rgb(var(--c-signal)/0.8)]">
        {prefix && <span className="text-signal/60">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="neon-value w-full bg-transparent font-grotesk tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-signal/60">{suffix}</span>}
      </div>
    </div>
  )
}

// Interactive recreation of the Jotform DSCR calculator (NOI ÷ annual debt service).
export function DscrCalculator() {
  const [income, setIncome] = useState(60000)
  const [expenses, setExpenses] = useState(18000)
  const [loan, setLoan] = useState(400000)
  const [rate, setRate] = useState(7.5)
  const [years, setYears] = useState(30)

  const { noi, debt, dscr } = useMemo(() => {
    const noi = (income || 0) - (expenses || 0)
    const r = (rate || 0) / 100 / 12
    const n = (years || 0) * 12
    const monthly = n <= 0 ? 0 : r === 0 ? (loan || 0) / n : ((loan || 0) * r) / (1 - Math.pow(1 + r, -n))
    const debt = monthly * 12
    return { noi, debt, dscr: debt > 0 ? noi / debt : 0 }
  }, [income, expenses, loan, rate, years])

  const verdict =
    dscr >= 1.25
      ? 'Income covers the loan payments.'
      : dscr >= 1
        ? 'Income covers the payments, with a thin margin.'
        : 'Income does not cover the loan payments.'
  const marker = Math.min(dscr / 2, 1) * 100

  return (
    <div className="rounded-xl border border-red/25 bg-black/30 p-5 sm:p-6">
      <p className="label text-[10px] text-red">DSCR calculator — interactive recreation</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="label text-[10px] sm:col-span-2">Property figures</p>
          <Field label="Gross rental income / yr" prefix="$" value={income} onChange={setIncome} step={1000} />
          <Field label="Operating expenses / yr" prefix="$" value={expenses} onChange={setExpenses} step={1000} />
          <p className="label mt-2 text-[10px] sm:col-span-2">Loan details</p>
          <Field label="Loan amount" prefix="$" value={loan} onChange={setLoan} step={5000} />
          <Field label="Interest rate" suffix="%" value={rate} onChange={setRate} step={0.125} />
          <Field label="Amortization" suffix="yrs" value={years} onChange={setYears} />
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-black/40 p-5" aria-live="polite">
          <div>
            <p className="label text-[10px]">Debt service coverage ratio</p>
            <p className="mt-2 font-display text-6xl font-black text-white [text-shadow:0_0_30px_rgb(var(--c-red)/0.6)]">
              {dscr.toFixed(2)}
              <span className="ml-2 align-middle font-grotesk text-sm font-medium tracking-[0.2em] text-red">DSCR</span>
            </p>
            <p className="mt-2 text-sm text-white/75">{verdict}</p>
          </div>
          <div className="mt-6">
            <div className="relative h-2 rounded-full bg-gradient-to-r from-blood via-red to-ember">
              <span className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-white/60" style={{ left: '50%' }} />
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red shadow-glow transition-[left] duration-500"
                style={{ left: `${marker}%` }}
              />
            </div>
            <div className="label mt-2 flex justify-between text-[9px] text-white/45">
              <span>0.00</span>
              <span>1.00 break-even</span>
              <span>2.00+</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="label text-[9px]">Net operating income</dt>
                <dd className="mt-1 font-grotesk text-white tabular-nums">{money(noi)}</dd>
              </div>
              <div>
                <dt className="label text-[9px]">Annual debt service</dt>
                <dd className="mt-1 font-grotesk text-white tabular-nums">{money(debt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-white/45">
        Example figures. This recreation uses the standard formula (net operating income ÷ annual debt service); the
        original is a Jotform form built with calculated fields.
      </p>
    </div>
  )
}

// Working demo of the Lead Age calculation: =TODAY() − Created.
export function LeadAgeDemo() {
  const id = useId()
  const today = useMemo(() => new Date(), [])
  const [created, setCreated] = useState(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - 484)
    return d.toISOString().slice(0, 10)
  })
  const days = Math.max(0, Math.floor((today.getTime() - new Date(created + 'T00:00:00').getTime()) / 86_400_000))

  return (
    <div className="rounded-xl border border-red/25 bg-black/30 p-5 sm:p-6">
      <p className="label text-[10px] text-red">Lead Age — working demo of the calculation</p>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <label htmlFor={id} className="label block text-[10px] text-white/55">
            Contact created
          </label>
          <input
            id={id}
            type="date"
            value={created}
            max={today.toISOString().slice(0, 10)}
            onChange={(e) => e.target.value && setCreated(e.target.value)}
            className="neon-value neon-date mt-2 w-full cursor-pointer rounded-lg border border-signal/35 bg-black/40 px-3 py-2 font-grotesk outline-none transition [color-scheme:dark] hover:border-signal/70 focus:border-signal focus:shadow-[0_0_16px_-4px_rgb(var(--c-signal)/0.8)]"
          />
        </div>
        <p className="font-mono text-sm text-white/55">
          <span className="text-red">fx</span> =TODAY() − Created
        </p>
        <p className="sm:ml-auto" aria-live="polite">
          <span className="label block text-[10px]">Lead age</span>
          <span className="font-display text-5xl font-black text-white [text-shadow:0_0_30px_rgb(var(--c-red)/0.6)]">
            {days}
          </span>
          <span className="ml-2 font-grotesk text-sm uppercase tracking-[0.2em] text-red">days</span>
        </p>
      </div>
    </div>
  )
}
