import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

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
      <section className="lp-hero">
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

      <section className="lp-intro">
        <p className="lp-eye">Thalima</p>
        <h2>
          {t.introTitle1}
          <br />
          {t.introTitle2}
        </h2>
        <p>{t.introBody}</p>
      </section>

      <section className="lp-cut" aria-hidden="true">
        <img src="/yacht/sail-aerial-lagoon.jpg" alt="" />
        <img src="/yacht/hero-sailing.jpg" alt="" />
      </section>

      <section className="lp-services">
        <p className="lp-eye">{t.servicesEye}</p>
        <h2>{t.servicesTitle}</h2>

        <article className="lp-svc">
          <img src="/yacht/cockpit-sunpads.jpg" alt="Guests on the sunpads" />
          <div>
            <h3>{t.svc1Title}</h3>
            <p>{t.svc1Body}</p>
            <Link to="/charter">
              {t.svc1Cta} <span>↗</span>
            </Link>
          </div>
        </article>

        <article className="lp-svc lp-svc-flip">
          <img src="/yacht/cockpit-night.jpg" alt="Evening in the cockpit" />
          <div>
            <h3>{t.svc2Title}</h3>
            <p>{t.svc2Body}</p>
            <Link to="/boat">
              {t.svc2Cta} <span>↗</span>
            </Link>
          </div>
        </article>

        <article className="lp-svc">
          <img src="/yacht/saloon.jpg" alt="Saloon after the 2024 refit" />
          <div>
            <h3>{t.svc3Title}</h3>
            <p>{t.svc3Body}</p>
            <Link to="/brochure">
              {t.svc3Cta} <span>↗</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="lp-dark">
        <div className="lp-banner">
          <img src="/yacht/sail-overhead.jpg" alt="Thalima under sail" />
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
            <Link className="lp-card" to="/boat">
              <img src="/yacht/owner-cabin.jpg" alt={t.ownerSuite} />
              <div>
                <span>{t.ownerSuite}</span>
                <b>{t.ownerSuiteB}</b>
                <p>{t.ownerSuiteP}</p>
              </div>
            </Link>
            <Link className="lp-card lp-card-tall" to="/charter">
              <img src="/yacht/hero-sailing.jpg" alt={t.underSail} />
              <div>
                <span>{t.underSail}</span>
                <b>{t.underSailB}</b>
                <p>{t.underSailP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat">
              <img src="/yacht/cockpit-night.jpg" alt={t.evening} />
              <div>
                <span>{t.evening}</span>
                <b>{t.eveningB}</b>
                <p>{t.eveningP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/brochure">
              <img src="/yacht/lounge.jpg" alt={t.lounge} />
              <div>
                <span>{t.lounge}</span>
                <b>{t.loungeB}</b>
                <p>{t.loungeP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/specs">
              <img src="/yacht/saloon.jpg" alt={t.saloon} />
              <div>
                <span>{t.saloon}</span>
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
            <img src="/yacht/sail-aerial-lagoon.jpg" alt="" />
            <span>{t.postBrochure}</span>
            <h3>{t.postBrochureTitle}</h3>
            <em>{t.readMore}</em>
          </Link>
          <Link to="/specs">
            <img src="/yacht/sail-beam.jpg" alt="" />
            <span>{t.postSpec}</span>
            <h3>{t.postSpecTitle}</h3>
            <em>{t.readMore}</em>
          </Link>
          <Link to="/charter">
            <img src="/yacht/cockpit-sunpads.jpg" alt="" />
            <span>{t.charter}</span>
            <h3>{t.postCharterTitle}</h3>
            <em>{t.writeToUs}</em>
          </Link>
        </div>
      </section>
    </SiteChrome>
  )
}
