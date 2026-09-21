import { useState, type FormEvent } from 'react'
import { SiteChrome, CHARTER_TO, useSiteCopy } from '../site'
import { yacht } from '../data/yacht'
import '../landing.css'

const GUESTS = [
  { value: 'Up to 6 guests', key: 'g6' as const },
  { value: '6 – 8 guests', key: 'g8' as const },
  { value: 'More than 8 guests', key: 'gMore' as const },
]
const LENGTHS = [
  '21 – 24 metres (70\' – 80\')',
  '24 – 34 metres (80\' – 100\')',
  'Over 30 metres (over 100\')',
] as const
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
  length: string
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
  length: 'Over 30 metres (over 100\')',
  area: 'Mediterranean',
  message: '',
  consent: false,
}

export function Charter() {
  const { t } = useSiteCopy()
  const [form, setForm] = useState<Fields>(empty)
  const [sent, setSent] = useState(false)

  const set = (key: keyof Fields, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
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
      `Length of interest: ${form.length}`,
      `Preferred location: ${form.area}`,
      '',
      form.message || '(no message)',
    ].join('\n')
    const href = `mailto:${CHARTER_TO}?subject=${encodeURIComponent('Thalima charter enquiry')}&body=${encodeURIComponent(body)}`
    window.location.href = href
    setSent(true)
  }

  return (
    <SiteChrome title={t.charter}>
      <article className="lp-page">
        <header className="lp-page-head">
          <p className="lp-eye">{t.charter}</p>
          <h1>{t.charterTitle}</h1>
          <p>{t.charterLead}</p>
        </header>

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

          <form className="lp-form" onSubmit={onSubmit}>
            <h2>{t.enquire}</h2>
            <p>{t.enquireLead}</p>

            {sent && (
              <p className="lp-form-ok">
                {t.formOk} {CHARTER_TO}.
              </p>
            )}

            <div className="lp-form-row">
              <label>
                {t.firstName}
                <input required value={form.first} onChange={(e) => set('first', e.target.value)} autoComplete="given-name" />
              </label>
              <label>
                {t.lastName}
                <input value={form.last} onChange={(e) => set('last', e.target.value)} autoComplete="family-name" />
              </label>
            </div>
            <div className="lp-form-row">
              <label>
                {t.email}
                <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
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
              <legend>{t.lengthInterest}</legend>
              {LENGTHS.map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="length"
                    value={option}
                    checked={form.length === option}
                    onChange={() => set('length', option)}
                  />
                  {option}
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
              <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} required />
              {t.consent}
            </label>
            <button className="lp-btn" type="submit">
              {t.send}
            </button>
          </form>
        </div>
      </article>
    </SiteChrome>
  )
}
