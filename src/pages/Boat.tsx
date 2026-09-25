import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { allDeckShots, allInteriorShots, yachtVideos, type YachtShot } from '../data/yachtMedia'
import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

const deckShots = allDeckShots()
const interiorShots = allInteriorShots()
const shots: YachtShot[] = [...deckShots, ...interiorShots]

export function Boat() {
  const { t } = useSiteCopy()
  const [open, setOpen] = useState<number | null>(null)
  const allShots = useMemo(() => shots, [])

  useEffect(() => {
    if (window.location.hash === '#interior') {
      document.getElementById('interior')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  useEffect(() => {
    if (open === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % allShots.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + allShots.length) % allShots.length))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, allShots.length])

  const current = open === null ? null : allShots[open]
  const interiorStart = deckShots.length

  return (
    <SiteChrome title={t.theBoat}>
      <article className="lp-page">
        <header className="lp-boat-head">
          <div>
            <p className="lp-eye">{t.theBoat}</p>
            <h1>{t.boatTitle}</h1>
          </div>
          <p>{t.boatLead}</p>
        </header>

        <section className="lp-boat-copy lp-boat-story">
          <p className="lp-lead">{t.introBody}</p>
          <p>{t.introP1}</p>
          <p>{t.introP2}</p>
          <p>{t.introP3}</p>
          <p>{t.introP4}</p>
          <p className="lp-close">{t.introClose}</p>
        </section>

        <section className="lp-boat-copy">
          <p className="lp-eye">{t.storyEye}</p>
          <h2>{t.storyTitle}</h2>
          <p>{t.storyP1}</p>
          <p>{t.storyP2}</p>
          <p>{t.storyP3}</p>
          <p className="lp-close">{t.storyP4}</p>
        </section>

        <div className="lp-bento">
          <figure className="lp-bento-video">
            <button type="button" onClick={() => setOpen(0)} aria-label={deckShots[0].caption}>
              <video
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                poster={deckShots[0].src}
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src={yachtVideos.deckWalkthrough} type="video/mp4" />
              </video>
              <span>Deck walkthrough</span>
            </button>
          </figure>
          {deckShots.slice(1).map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              className={shot.span ? `lp-bento-${shot.span}` : undefined}
              onClick={() => setOpen(i + 1)}
            >
              <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
              <span>{shot.caption}</span>
            </button>
          ))}
        </div>

        <section className="lp-boat-copy">
          <h2>{t.deck}</h2>
          <p>{t.deck1}</p>
          <p>{t.deck2}</p>
        </section>

        <section className="lp-boat-copy" id="interior">
          <h2>{t.interior}</h2>
          <p>{t.interior1}</p>
        </section>

        <section className="lp-interior-gallery" aria-label={t.interior}>
          <div className="lp-interior-head lp-interior-head-inline">
            <div>
              <p className="lp-eye">{t.interiorEye}</p>
              <h2>{t.interiorTitle}</h2>
            </div>
            <p>{t.interiorLead}</p>
          </div>

          <figure className="lp-walkthrough">
            <video
              controls
              playsInline
              preload="metadata"
              poster={interiorShots[0]?.src}
            >
              <source src={yachtVideos.interiorWalkthrough} type="video/mp4" />
            </video>
            <figcaption>Interior walkthrough</figcaption>
          </figure>

          <div className="lp-bento lp-bento-interior">
            {interiorShots.map((shot, i) => (
              <button
                key={`${shot.src}-${i}`}
                type="button"
                className={shot.span ? `lp-bento-${shot.span}` : undefined}
                onClick={() => setOpen(interiorStart + i)}
              >
                <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
                <span>{shot.caption}</span>
              </button>
            ))}
          </div>
        </section>

        <p className="lp-page-cta">
          <Link className="lp-btn" to="/charter">
            {t.charter}
          </Link>
          <Link className="lp-btn lp-btn-ghost" to="/specs">
            {t.specs}
          </Link>
        </p>
      </article>

      {current && open !== null && (
        <div
          className="lp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          onClick={() => setOpen(null)}
        >
          <button className="lp-lightbox-close" type="button" aria-label="Close" onClick={() => setOpen(null)}>
            <X size={22} strokeWidth={1.6} />
          </button>
          <button
            className="lp-lightbox-prev"
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((open - 1 + allShots.length) % allShots.length)
            }}
          >
            <ChevronLeft size={28} strokeWidth={1.4} />
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={current.src} alt={current.alt} />
            <figcaption>
              {current.caption}
              <em>
                {open + 1} / {allShots.length}
              </em>
            </figcaption>
          </figure>
          <button
            className="lp-lightbox-next"
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((open + 1) % allShots.length)
            }}
          >
            <ChevronRight size={28} strokeWidth={1.4} />
          </button>
          <div className="lp-lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
            {allShots.map((shot, i) => (
              <button
                key={`${shot.src}-thumb-${i}`}
                type="button"
                className={i === open ? 'on' : undefined}
                onClick={() => setOpen(i)}
              >
                <img src={shot.src} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </SiteChrome>
  )
}
