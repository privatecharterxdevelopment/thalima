import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { yachtPhotos, yachtVideos } from '../data/yachtMedia'
import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

const interiorPreview = [
  yachtPhotos.owner[0],
  yachtPhotos.saloon[1],
  yachtPhotos.cabins[0],
  yachtPhotos.galley[1],
  yachtPhotos.owner[5],
  yachtPhotos.owner[2],
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
    el.addEventListener('canplay', tryPlay)
    el.addEventListener('playing', () => {
      el.controls = false
    })
    return () => {
      el.removeEventListener('loadeddata', tryPlay)
      el.removeEventListener('canplay', tryPlay)
    }
  }, [])

  return (
    <SiteChrome>
      <section className="lp-hero">
        <div className="lp-hero-media">
          <video
            ref={heroRef}
            key="deck-walkthrough-hero"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            poster={yachtPhotos.deck[1].src}
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={`${yachtVideos.deckWalkthrough}?v=2`} type="video/mp4" />
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
        <img src={yachtPhotos.sailing[5].src} alt="" loading="lazy" decoding="async" />
        <img src={yachtPhotos.sailing[0].src} alt="" loading="lazy" decoding="async" />
      </section>

      <section className="lp-services">
        <p className="lp-eye">{t.servicesEye}</p>
        <h2>{t.servicesTitle}</h2>

        <article className="lp-svc">
          <img src={yachtPhotos.deck[5].src} alt="Guests in the cockpit" loading="lazy" decoding="async" />
          <div>
            <h3>{t.svc1Title}</h3>
            <p>{t.svc1Body}</p>
            <Link to="/charter">
              {t.svc1Cta} <span>↗</span>
            </Link>
          </div>
        </article>

        <article className="lp-svc lp-svc-flip">
          <img src={yachtPhotos.deck[4].src} alt="Evening on deck" loading="lazy" decoding="async" />
          <div>
            <h3>{t.svc2Title}</h3>
            <p>{t.svc2Body}</p>
            <Link to="/boat">
              {t.svc2Cta} <span>↗</span>
            </Link>
          </div>
        </article>

        <article className="lp-svc">
          <img src={yachtPhotos.saloon[2].src} alt="Saloon after the 2024 refit" loading="lazy" decoding="async" />
          <div>
            <h3>{t.svc3Title}</h3>
            <p>{t.svc3Body}</p>
            <Link to="/brochure">
              {t.svc3Cta} <span>↗</span>
            </Link>
          </div>
        </article>
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
          <img src={yachtPhotos.sailing[6].src} alt="Thalima under sail" loading="lazy" decoding="async" />
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
              <img src={yachtPhotos.owner[0].src} alt={t.ownerSuite} loading="lazy" decoding="async" />
              <div>
                <span>{t.ownerSuite}</span>
                <b>{t.ownerSuiteB}</b>
                <p>{t.ownerSuiteP}</p>
              </div>
            </Link>
            <Link className="lp-card lp-card-tall" to="/charter">
              <img src={yachtPhotos.sailing[1].src} alt={t.underSail} loading="lazy" decoding="async" />
              <div>
                <span>{t.underSail}</span>
                <b>{t.underSailB}</b>
                <p>{t.underSailP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat">
              <img src={yachtPhotos.deck[4].src} alt={t.evening} loading="lazy" decoding="async" />
              <div>
                <span>{t.evening}</span>
                <b>{t.eveningB}</b>
                <p>{t.eveningP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat#interior">
              <img src={yachtPhotos.lounge[0].src} alt={t.lounge} loading="lazy" decoding="async" />
              <div>
                <span>{t.lounge}</span>
                <b>{t.loungeB}</b>
                <p>{t.loungeP}</p>
              </div>
            </Link>
            <Link className="lp-card" to="/boat#interior">
              <img src={yachtPhotos.saloon[2].src} alt={t.saloon} loading="lazy" decoding="async" />
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
            <img src={yachtPhotos.sailing[5].src} alt="" loading="lazy" decoding="async" />
            <span>{t.postBrochure}</span>
            <h3>{t.postBrochureTitle}</h3>
            <em>{t.readMore}</em>
          </Link>
          <Link to="/specs">
            <img src={yachtPhotos.ga.src} alt="" loading="lazy" decoding="async" />
            <span>{t.postSpec}</span>
            <h3>{t.postSpecTitle}</h3>
            <em>{t.readMore}</em>
          </Link>
          <Link to="/charter">
            <img src={yachtPhotos.deck[5].src} alt="" loading="lazy" decoding="async" />
            <span>{t.charter}</span>
            <h3>{t.postCharterTitle}</h3>
            <em>{t.writeToUs}</em>
          </Link>
        </div>
      </section>
    </SiteChrome>
  )
}
