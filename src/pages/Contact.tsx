import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SiteChrome, MAIL, CHARTER_TO, PHONE, PHONE_LABEL, useSiteCopy } from '../site'
import '../landing.css'

export function Contact() {
  const { t } = useSiteCopy()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    el.defaultMuted = true
    el.controls = false
    el.playsInline = true
    const tryPlay = () => {
      el.controls = false
      void el.play().catch(() => {})
    }
    tryPlay()
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('playing', () => {
      el.controls = false
    })
    return () => {
      el.removeEventListener('loadeddata', tryPlay)
    }
  }, [])

  return (
    <SiteChrome title={t.contact}>
      <article className="lp-page lp-contact-page">
        <figure className="lp-contact-hero">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            poster="/yacht/contact.jpg"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/yacht/contact.mp4" type="video/mp4" />
          </video>
          <img className="lp-contact-mark" src="/mark.png" alt="" />
        </figure>

        <header className="lp-page-head">
          <p className="lp-eye">{t.contact}</p>
          <h1>{t.contactTitle}</h1>
          <p>{t.contactLead}</p>
        </header>

        <div className="lp-contact">
          <div>
            <b>{t.charter}</b>
            <a href={MAIL}>{CHARTER_TO}</a>
            <Link to="/charter">{t.sendEnquiry}</Link>
          </div>
          <div>
            <b>{t.telephone}</b>
            <a href={`tel:${PHONE}`}>{PHONE_LABEL}</a>
          </div>
          <div>
            <b>{t.theBoat}</b>
            <Link to="/boat">{t.onDeck}</Link>
            <Link to="/brochure">{t.brochure}</Link>
            <Link to="/specs">{t.specs}</Link>
          </div>
        </div>
      </article>
    </SiteChrome>
  )
}
