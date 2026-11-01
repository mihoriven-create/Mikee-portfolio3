import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, FileDown, Loader2, Mail, MessageCircle, Send, X } from 'lucide-react'
import { site } from '../config/site'
import { OPEN_CONTACT_FORM, externalProps, motion, scrollToHash } from '../lib/motion'
import { SectionHeader } from './ui'

const inputClass =
  'mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red/70 focus:shadow-glow'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'activation'
const EMPTY = { firstName: '', lastName: '', email: '', message: '' }

// Builds a ready-to-send email with the visitor's message, used when the form can't deliver it
const mailtoFor = (form: typeof EMPTY) =>
  `mailto:${site.email}?subject=${encodeURIComponent(site.contact.form.subject)}&body=${encodeURIComponent(
    `${form.message}

— ${`${form.firstName} ${form.lastName}`.trim()} (${form.email})`,
  )}`

// Sends the message straight to the inbox through FormSubmit; no email app opens. Gives up after
// 15 seconds so a stalled request never leaves the button spinning.
async function deliver(form: typeof EMPTY): Promise<'sent' | 'activation'> {
  const res = await fetch(site.contact.form.endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: `${form.firstName} ${form.lastName}`.trim(),
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      message: form.message,
      _subject: site.contact.form.subject,
      _replyto: form.email,
      _template: 'table',
      _captcha: 'false',
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string }
  if (res.ok && String(data.success) !== 'false') return 'sent'
  // FormSubmit answers this way until the inbox owner clicks the one-time activation email
  if (/activat/i.test(data.message ?? '')) return 'activation'
  throw new Error(data.message || `HTTP ${res.status}`)
}

function MessageForm({ firstFieldRef }: { firstFieldRef: React.RefObject<HTMLInputElement> }) {
  const ids = { first: useId(), last: useId(), email: useId(), message: useId() }
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [sentFrom, setSentFrom] = useState(EMPTY) // the message that failed, kept for the email fallback
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (new FormData(e.currentTarget).get('_honey')) return // a bot filled the hidden field
    setStatus('sending')
    setSentFrom(form)
    try {
      const result = await deliver(form)
      setStatus(result)
      if (result === 'sent') setForm(EMPTY)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-start gap-3 py-6" role="status">
        <CheckCircle2 size={36} className="text-red" aria-hidden />
        <p className="font-display text-lg font-extrabold uppercase text-white">Message sent</p>
        <p className="text-white/70">Thanks for reaching out. I'll get back to you soon.</p>
        <button type="button" onClick={() => setStatus('idle')} className="label mt-1 text-white/70 transition hover:text-red">
          Send another message →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-5">
      <p className="max-w-2xl font-grotesk text-lg font-medium text-white">{site.contact.form.intro}</p>
      {/* Honeypot for spam bots; hidden from people and screen readers */}
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.first} className="label text-[10px]">
            First name
          </label>
          <input id={ids.first} ref={firstFieldRef} required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} className={inputClass} />
        </div>
        <div>
          <label htmlFor={ids.last} className="label text-[10px]">
            Last name
          </label>
          <input id={ids.last} required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor={ids.email} className="label text-[10px]">
          Email
        </label>
        <input id={ids.email} type="email" required autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} />
      </div>
      <div>
        <label htmlFor={ids.message} className="label text-[10px]">
          Message
        </label>
        <textarea
          id={ids.message}
          required
          rows={5}
          value={form.message}
          onChange={set('message')}
          placeholder="What would you like to build or fix?"
          className={`${inputClass} resize-y`}
        />
      </div>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center gap-2 rounded-full bg-red px-8 py-3.5 font-grotesk text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_0_24px_-8px_rgb(var(--c-red)/0.85)] transition duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
        >
          {status === 'sending' ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
          {status === 'sending' ? 'Sending…' : 'Send Message'}
        </button>
        {(status === 'error' || status === 'activation') && (
          <div className="text-sm text-ember" role="alert">
            <p>
              {status === 'activation'
                ? "The contact form is still being set up, so this message wasn't delivered."
                : "The message didn't go through (the connection failed or timed out)."}{' '}
              Your text is still here. Try again, or send it from your own email app:
            </p>
            <a href={mailtoFor(sentFrom)} className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-white underline decoration-red underline-offset-4 hover:text-red">
              <Mail size={14} aria-hidden /> Send by email instead
            </a>
          </div>
        )}
      </div>
    </form>
  )
}

// Medium highlight: a clear red border, a light red fill and a soft glow, stronger on hover.
const cardClass =
  'group flex h-full w-full flex-col items-center gap-3 rounded-2xl border border-red/70 bg-red/[0.14] p-4 text-center shadow-[0_0_26px_-8px_rgb(var(--c-red)/0.6),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red hover:bg-red/25 hover:shadow-[0_0_38px_-6px_rgb(var(--c-red)/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:text-left'
const iconClass =
  'grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red/60 bg-red/20 text-white transition group-hover:bg-red'

// The "Email me" pop-up that holds the message form. Esc or the backdrop closes it.
function EmailMeDialog({ onClose }: { onClose: () => void }) {
  const firstField = useRef<HTMLInputElement>(null)
  const titleId = useId()

  useEffect(() => {
    motion.lenis?.stop()
    const t = setTimeout(() => firstField.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      motion.lenis?.start()
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-2xl animate-[fade-in_200ms_ease-out] rounded-2xl border border-red/40 bg-[#0b0408]/95 p-6 shadow-[0_30px_80px_-20px_rgb(var(--c-red)/0.35)] sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <p id={titleId} className="label flex items-center gap-2 text-[10px] text-red">
            <Mail size={14} aria-hidden /> Email me
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-red hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <MessageForm firstFieldRef={firstField} />
      </div>
    </div>,
    document.body,
  )
}

// "Let's build better systems": just the headline and three buttons over the maze.
// Email me opens the message form in a pop-up.
export function Contact() {
  const [formOpen, setFormOpen] = useState(false)
  const close = useCallback(() => setFormOpen(false), [])

  // The hero and nav "Start a conversation" buttons open the form from anywhere on the page
  useEffect(() => {
    const open = () => setFormOpen(true)
    window.addEventListener(OPEN_CONTACT_FORM, open)
    return () => window.removeEventListener(OPEN_CONTACT_FORM, open)
  }, [])

  return (
    <section id="contact" className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 pt-24 sm:px-8">
      {/* Headline and buttons centred in the screen, footer at the bottom */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <SectionHeader index="08" label={site.contact.label} headline={site.contact.headline} center />

        {/* No scroll reveal here: this is the last screen, so an exit animation would hide the buttons */}
        <ul className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-3">
          <li>
            <button type="button" onClick={() => setFormOpen(true)} aria-haspopup="dialog" className={cardClass}>
              <span className={iconClass}>
                <Mail size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-extrabold uppercase text-white sm:text-base">Email me</span>
                <span className="mt-0.5 hidden text-sm text-white/80 sm:block">Send a message</span>
              </span>
            </button>
          </li>
          <li>
            <a href={site.whatsapp} {...externalProps(site.whatsapp)} className={cardClass}>
              <span className={iconClass}>
                <MessageCircle size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-extrabold uppercase text-white sm:text-base">WhatsApp</span>
                <span className="mt-0.5 hidden text-sm text-white/80 sm:block">Message me</span>
              </span>
            </a>
          </li>
          <li>
            <a href={site.resume} {...externalProps(site.resume)} className={cardClass}>
              <span className={iconClass}>
                <FileDown size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-extrabold uppercase text-white sm:text-base">Résumé</span>
                <span className="mt-0.5 hidden text-sm text-white/80 sm:block">Download the PDF</span>
              </span>
            </a>
          </li>
        </ul>
      </div>

      <footer className="mt-14 w-full pb-10">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-red/60 to-transparent" />
        <div className="label mt-5 flex flex-col items-center justify-between gap-3 text-[10px] text-white/45 sm:flex-row">
          <span>{site.footer}</span>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              scrollToHash('#top')
            }}
            className="transition hover:text-red"
          >
            Back to top ↑
          </a>
        </div>
      </footer>

      {formOpen && <EmailMeDialog onClose={close} />}
    </section>
  )
}
