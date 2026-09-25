import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

const interiorPreview = [
  { src: '/yacht/interior/11.jpg', alt: 'Owner suite' },
  { src: '/yacht/interior/18.jpg', alt: 'Saloon' },
  { src: '/yacht/interior/08.jpg', alt: 'Twin cabin' },
  { src: '/yacht/interior/05.jpg', alt: 'Galley' },
  { src: '/yacht/interior/12.jpg', alt: 'Ensuite' },
  { src: '/yacht/interior/14.jpg', alt: 'Owner study' },
]

export function Landing() {
  const { t } = useSiteCopy()
  const heroRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = heroRef.current
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
    <SiteChrome>
      <section className="lp-hero lp-hero-bleed">
        <div className="lp-hero-media">
          <video
            ref={heroRef}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            poster="/yacht/hero.jpg"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/yacht/hero.mp4?v=2" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className="lp-intro lp-intro-long">
        <p className="lp-eye">Thalima</p>
        <h2>
          {t.introTitle1}
          <br />
          {t.introTitle2}
        </h2>
        <div className="lp-prose">
          <p className="lp-lead">{t.introBody}</p>
          <p>{t.introP1}</p>
          <p>{t.introP2}</p>
          <p>{t.introP3}</p>
          <p>{t.introP4}</p>
          <p className="lp-close">{t.introClose}</p>
        </div>
      </section>

      <section className="lp-cut" aria-hidden="true">
        <img src="/yacht/sail-aerial-lagoon.jpg" alt="" loading="lazy" decoding="async" />
        <img src="/yacht/hero-sailing.jpg" alt="" loading="lazy" decoding="async" />
      </section>

      <section className="lp-story">
        <p className="lp-eye">{t.storyEye}</p>
        <h2>{t.storyTitle}</h2>
        <div className="lp-prose">
          <p>{t.storyP1}</p>
          <p>{t.storyP2}</p>
          <p>{t.storyP3}</p>
          <p className="lp-close">{t.storyP4}</p>
        </div>
      </section>

      <section className="lp-waters">
        <div className="lp-waters-head">
          <p className="lp-eye">{t.watersEye}</p>
          <h2>{t.watersTitle}</h2>
        </div>
        <div className="lp-waters-grid">
          <article>
            <img src="/yacht/sail-beam.jpg" alt="" loading="lazy" decoding="async" />
            <h3>{t.medTitle}</h3>
            <p>{t.medBody}</p>
          </article>
          <article>
            <img src="/yacht/sail-aerial-lagoon.jpg" alt="" loading="lazy" decoding="async" />
            <h3>{t.caribTitle}</h3>
            <p>{t.caribBody}</p>
          </article>
        </div>
        <p className="lp-waters-note">{t.watersNote}</p>
      </section>

      <section className="lp-charter-block">
        <p className="lp-eye">{t.charterBlockEye}</p>
        <h2>{t.charterBlockTitle}</h2>
        <p className="lp-lead">{t.charterBlockLead}</p>
        <div className="lp-charter-points">
          <article>
            <h3>{t.lifeTitle}</h3>
            <p>{t.lifeBody}</p>
          </article>
          <article>
            <h3>{t.tableTitle}</h3>
            <p>{t.tableBody}</p>
          </article>
          <article>
            <h3>{t.playTitle}</h3>
            <p>{t.playBody}</p>
          </article>
        </div>
        <p className="lp-close">{t.charterEnquire}</p>
        <div className="lp-pills" style={{ marginTop: '2rem' }}>
          <Link className="lp-btn" to="/charter">
            {t.charter}
          </Link>
          <Link className="lp-btn lp-btn-ghost" to="/boat">
            {t.theBoat}
          </Link>
        </div>
      </section>

      <section className="lp-interior-strip">
        <div className="lp-interior-head">
          <div>
            <p className="lp-eye">{t.interiorEye}</p>
            <h2>{t.interiorTitle}</h2>
          </div>
          <p>{t.interiorLead}</p>
        </div>
        <div className="lp-interior-grid">
          {interiorPreview.map((shot) => (
            <Link key={shot.src} to="/boat#interior" className="lp-interior-tile">
              <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
            </Link>
          ))}
        </div>
        <p className="lp-page-cta" style={{ paddingInline: 0 }}>
          <Link className="lp-btn" to="/boat#interior">
            {t.interior}
          </Link>
        </p>
      </section>

      <section className="lp-manage">
        <p className="lp-eye">{t.manageEye}</p>
        <h2>{t.manageTitle}</h2>
        <div className="lp-prose">
          <p>{t.manageP1}</p>
          <p>{t.manageP2}</p>
        </div>
      </section>

      <section className="lp-dark">
        <div className="lp-banner">
          <img src="/yacht/sail-overhead.jpg" alt="Thalima under sail" loading="lazy" decoding="async" />
          <h2>{t.banner}</h2>
        </div>

        <div className="lp-select">
          <div className="lp-select-head">
            <div>
              <p className="lp-eye">{t.onboard}</p>
              <h2>
                {t.selectTitle1}
                <br />
                {t.selectTitle2}
              </h2>
            </div>
            <div className="lp-pills">
              <Link className="lp-btn" to="/charter">
                {t.charter}
              </Link>
              <Link className="lp-btn lp-btn-ghost" to="/brochure">
                {t.brochure}
              </Link>
            </div>
          </div>

          <div className="lp-cards">
            <Link className="lp-card" to="/boat#interior">
              <img src="/yacht/interior/11.jpg" alt={t.ownerSuite} loading="lazy" decoding="async" />
              <div>
                <span>{t.ownerSuite}</span>
                <b>{t.ownerSuiteB}</b>
                <p>{t.ownerSuiteP}</p>
              </div>
            </Link>
            <Link className="lp-card lp-card-tall" to="/charter">
              <img src="/yacht/hero-sailing.jpg" alt={t.underSail} loading="lazy" decoding="async" />
              <div>
                <span>{t.underSail}</span>
                <b>{t.underSailB}</b>
                <p>{t.underSailP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat">
              <img src="/yacht/cockpit-night.jpg" alt={t.evening} loading="lazy" decoding="async" />
              <div>
                <span>{t.evening}</span>
                <b>{t.eveningB}</b>
                <p>{t.eveningP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat#interior">
              <img src="/yacht/interior/18.jpg" alt={t.lounge} loading="lazy" decoding="async" />
              <div>
                <span>{t.lounge}</span>
                <b>{t.loungeB}</b>
                <p>{t.loungeP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat#interior">
              <img src="/yacht/interior/08.jpg" alt={t.saloon} loading="lazy" decoding="async" />
              <div>
                <span>{t.interior}</span>
                <b>{t.saloonB}</b>
                <p>{t.saloonP}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="lp-journal">
        <div className="lp-journal-head">
          <div>
            <p className="lp-eye">{t.paper}</p>
            <h2>{t.worth}</h2>
          </div>
          <p>{t.journalLead}</p>
        </div>
        <div className="lp-posts">
          <Link to="/brochure">
            <img src="/yacht/sail-aerial-lagoon.jpg" alt="" loading="lazy" decoding="async" />
            <span>{t.postBrochure}</span>
            <h3>{t.postBrochureTitle}</h3>
            <em>{t.readMore}</em>
          </Link>
          <Link to="/specs">
            <img src="/yacht/sail-beam.jpg" alt="" loading="lazy" decoding="async" />
            <span>{t.postSpec}</span>
            <h3>{t.postSpecTitle}</h3>
            <em>{t.readMore}</em>
          </Link>
          <Link to="/charter">
            <img src="/yacht/cockpit-sunpads.jpg" alt="" loading="lazy" decoding="async" />
            <span>{t.charter}</span>
            <h3>{t.postCharterTitle}</h3>
            <em>{t.writeToUs}</em>
          </Link>
        </div>
      </section>
    </SiteChrome>
  )
}
