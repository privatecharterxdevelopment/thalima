import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { SiteChrome, CHARTER_TO, useSiteCopy } from '../site'
import { yacht } from '../data/yacht'
import '../landing.css'

const GUESTS = [
  { value: 'Up to 6 guests', key: 'g6' as const },
  { value: '6 – 8 guests', key: 'g8' as const },
  { value: 'More than 8 guests', key: 'gMore' as const },
]
const AREAS = [
  { value: 'Mediterranean', key: 'mediterranean' as const },
  { value: 'Northern Europe', key: 'nEurope' as const },
  { value: 'Caribbean', key: 'caribbean' as const },
  { value: 'Asia-Pacific', key: 'asiaPacific' as const },
  { value: 'Other', key: 'other' as const },
]

type Fields = {
  first: string
  last: string
  email: string
  phone: string
  from: string
  to: string
  guests: string
  area: string
  message: string
  consent: boolean
}

const empty: Fields = {
  first: '',
  last: '',
  email: '',
  phone: '',
  from: '',
  to: '',
  guests: '6 – 8 guests',
  area: 'Mediterranean',
  message: '',
  consent: false,
}

const CONFETTI = ['#eef2f6', '#ffffff', '#9aa4b0', '#3dba7a', '#f2d38a']

function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fit = () => {
      const r = parent.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(r.width * devicePixelRatio))
      canvas.height = Math.max(1, Math.round(r.height * devicePixelRatio))
    }
    fit()

    const w = () => canvas.width / devicePixelRatio
    const h = () => canvas.height / devicePixelRatio
    const bits = Array.from({ length: 110 }, () => ({
      x: Math.random() * w(),
      y: -20 - Math.random() * h(),
      vx: -1.6 + Math.random() * 3.2,
      vy: 2.4 + Math.random() * 4.2,
      rot: Math.random() * Math.PI,
      vr: -0.18 + Math.random() * 0.36,
      bw: 5 + Math.random() * 7,
      bh: 8 + Math.random() * 10,
      color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    }))

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const width = w()
      const height = h()
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      for (const bit of bits) {
        bit.x += bit.vx
        bit.y += bit.vy
        bit.rot += bit.vr
        ctx.save()
        ctx.translate(bit.x, bit.y)
        ctx.rotate(bit.rot)
        ctx.fillStyle = bit.color
        ctx.fillRect(-bit.bw / 2, -bit.bh / 2, bit.bw, bit.bh)
        ctx.restore()
      }
      if (now - start < 3200) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas className="lp-confetti" ref={ref} aria-hidden="true" />
}

export function Charter() {
  const { t } = useSiteCopy()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Fields>(empty)
  const [step, setStep] = useState<1 | 2>(1)
  const [sent, setSent] = useState(false)

  const set = (key: keyof Fields, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const goNext = () => {
    const node = formRef.current
    if (!node) return
    const first = node.querySelector<HTMLInputElement>('input[autocomplete="given-name"]')
    const email = node.querySelector<HTMLInputElement>('input[type="email"]')
    if (!first?.checkValidity() || !email?.checkValidity()) {
      node.reportValidity()
      return
    }
    setStep(2)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.consent) return
    const body = [
      `Yacht: ${yacht.type} Thalima`,
      `Name: ${[form.first, form.last].filter(Boolean).join(' ')}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || '—'}`,
      `Preferred start: ${form.from || '—'}`,
      `Preferred end: ${form.to || '—'}`,
      `Guests: ${form.guests}`,
      `Preferred location: ${form.area}`,
      '',
      form.message || '(no message)',
    ].join('\n')
    const href = `mailto:${CHARTER_TO}?subject=${encodeURIComponent('Thalima charter enquiry')}&body=${encodeURIComponent(body)}`
    setSent(true)
    window.setTimeout(() => {
      window.location.href = href
    }, 1400)
  }

  return (
    <SiteChrome title={t.charter}>
      <article className="lp-page lp-charter-page">
        <figure className="lp-contact-hero lp-charter-hero lp-charter-hero-bleed">
          <video
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            poster="/yacht/charter.jpg?v=3"
            aria-hidden="true"
          >
            <source src="/yacht/charter.mp4" type="video/mp4" />
          </video>
          <img className="lp-contact-mark" src="/mark.png" alt="" />
        </figure>

        <header className="lp-page-head">
          <p className="lp-eye">{t.charter}</p>
          <h1>{t.charterTitle}</h1>
          <p>{t.charterLead}</p>
        </header>

        <div className="lp-charter-gallery">
          {[
            '/yacht/interior/11.jpg',
            '/yacht/interior/18.jpg',
            '/yacht/cockpit-sunpads.jpg',
            '/yacht/interior/08.jpg',
            '/yacht/interior/12.jpg',
            '/yacht/hero-sailing.jpg',
            '/yacht/interior/14.jpg',
            '/yacht/interior/05.jpg',
          ].map((src) => (
            <Link key={src} to="/boat#interior" className="lp-charter-shot">
              <img src={src} alt="" loading="lazy" decoding="async" />
            </Link>
          ))}
        </div>

        <section className="lp-charter-copy">
          <h2>{t.lifeTitle}</h2>
          <p>{t.lifeBody}</p>
          <h2>{t.tableTitle}</h2>
          <p>{t.tableBody}</p>
          <h2>{t.playTitle}</h2>
          <p>{t.playBody}</p>
          <p className="lp-close">{t.charterEnquire}</p>
        </section>

        <hr className="lp-page-rule" />

        <div className="lp-split">
          <aside className="lp-facts">
            <h2>{t.theWeek}</h2>
            <dl>
              <div>
                <dt>{t.lowSeason}</dt>
                <dd>€ 70,000 / week + expenses + tax</dd>
              </div>
              <div>
                <dt>{t.highSeason}</dt>
                <dd>€ 75,000 / week + expenses + tax</dd>
              </div>
              <div>
                <dt>{t.guests}</dt>
                <dd>8 · 4 cabins</dd>
              </div>
              <div>
                <dt>{t.crewN}</dt>
                <dd>5</dd>
              </div>
              <div>
                <dt>{t.summer}</dt>
                <dd>{t.mediterranean}</dd>
              </div>
              <div>
                <dt>{t.tender}</dt>
                <dd>{yacht.tender}</dd>
              </div>
            </dl>
            <p>{t.weekNote}</p>
          </aside>

          <form className="lp-form lp-form-box" onSubmit={onSubmit} ref={formRef} noValidate={step === 1}>
            {sent && <Confetti />}

            <h2>{t.enquire}</h2>
            {!sent && <p>{t.enquireLead}</p>}

            {!sent && (
              <div className="lp-form-progress" aria-hidden="true">
                <span className={step >= 1 ? 'on' : ''}>1</span>
                <i />
                <span className={step >= 2 ? 'on' : ''}>2</span>
              </div>
            )}

            {sent ? (
              <div className="lp-form-done">
                <span className="lp-form-check" aria-hidden="true">
                  <Check size={28} strokeWidth={2.4} />
                </span>
                <h3>{t.formThanks}</h3>
              </div>
            ) : step === 1 ? (
              <>
                <div className="lp-form-row">
                  <label>
                    {t.firstName}
                    <input
                      required
                      value={form.first}
                      onChange={(e) => set('first', e.target.value)}
                      autoComplete="given-name"
                    />
                  </label>
                  <label>
                    {t.lastName}
                    <input value={form.last} onChange={(e) => set('last', e.target.value)} autoComplete="family-name" />
                  </label>
                </div>
                <div className="lp-form-row">
                  <label>
                    {t.email}
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    {t.phone}
                    <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
                  </label>
                </div>
                <div className="lp-form-row">
                  <label>
                    {t.startDate}
                    <input type="date" value={form.from} onChange={(e) => set('from', e.target.value)} />
                  </label>
                  <label>
                    {t.endDate}
                    <input type="date" value={form.to} onChange={(e) => set('to', e.target.value)} />
                  </label>
                </div>
                <div className="lp-form-actions">
                  <button className="lp-btn" type="button" onClick={goNext}>
                    {t.formNext}
                  </button>
                </div>
              </>
            ) : (
              <>
                <fieldset className="lp-choices">
                  <legend>{t.guestCount}</legend>
                  {GUESTS.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="guests"
                        value={option.value}
                        checked={form.guests === option.value}
                        onChange={() => set('guests', option.value)}
                      />
                      {t[option.key]}
                    </label>
                  ))}
                </fieldset>
                <fieldset className="lp-choices">
                  <legend>{t.location}</legend>
                  {AREAS.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="area"
                        value={option.value}
                        checked={form.area === option.value}
                        onChange={() => set('area', option.value)}
                      />
                      {t[option.key]}
                    </label>
                  ))}
                </fieldset>
                <label>
                  {t.message}
                  <textarea rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} />
                </label>
                <p className="lp-form-note">{t.formNote}</p>
                <label className="lp-check">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set('consent', e.target.checked)}
                    required
                  />
                  {t.consent}
                </label>
                <div className="lp-form-actions">
                  <button className="lp-btn lp-btn-ghost" type="button" onClick={() => setStep(1)}>
                    {t.formBack}
                  </button>
                  <button className="lp-btn" type="submit">
                    {t.send}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </article>
    </SiteChrome>
  )
}
