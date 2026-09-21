import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

type Shot = {
  src: string
  alt: string
  caption: string
  span?: 'wide' | 'tall'
}

const shots: Shot[] = [
  {
    src: '/yacht/sail-overhead.jpg',
    alt: 'Thalima under sail, seen from above',
    caption: 'Under sail',
    span: 'wide',
  },
  {
    src: '/yacht/hero-sailing.jpg',
    alt: 'Thalima sailing, guests on deck',
    caption: 'On deck',
    span: 'tall',
  },
  {
    src: '/yacht/sail-beam.jpg',
    alt: 'Thalima in profile on a calm evening',
    caption: 'Profile',
  },
  {
    src: '/yacht/sail-aerial-lagoon.jpg',
    alt: 'Thalima at anchor over turquoise water',
    caption: 'At anchor',
  },
  {
    src: '/yacht/cockpit-sunpads.jpg',
    alt: 'Sunpads and twin wheels, looking forward',
    caption: 'Sunpads',
  },
  {
    src: '/yacht/cockpit-table.jpg',
    alt: 'Guest cockpit set for a meal, boom awning up',
    caption: 'Guest cockpit',
    span: 'wide',
  },
  {
    src: '/yacht/cockpit-night.jpg',
    alt: 'Evening in the cockpit',
    caption: 'Evening',
  },
  {
    src: '/yacht/owner-cabin.jpg',
    alt: 'Owner suite, walk-around berth and study',
    caption: 'Owner suite',
  },
  {
    src: '/yacht/saloon.jpg',
    alt: 'Saloon and dining table after the 2024 refit',
    caption: 'Saloon',
    span: 'wide',
  },
  {
    src: '/yacht/lounge.jpg',
    alt: 'Lounge seating and television',
    caption: 'Lounge',
  },
  {
    src: '/yacht/owner-berth.jpg',
    alt: 'Owner berth, looking aft',
    caption: 'Owner berth',
  },
  {
    src: '/yacht/guest-twins.jpg',
    alt: 'Guest cabin with twin berths',
    caption: 'Guest twins',
  },
]

export function Boat() {
  const { t } = useSiteCopy()
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    if (open === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % shots.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + shots.length) % shots.length))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = open === null ? null : shots[open]

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

        <div className="lp-bento">
          <figure className="lp-bento-video">
            <button type="button" onClick={() => setOpen(0)} aria-label={shots[0].caption}>
              <video
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                poster="/yacht/sail-overhead.jpg"
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src="/yacht/sail.mp4" type="video/mp4" />
              </video>
              <span>{shots[0].caption}</span>
            </button>
          </figure>
          {shots.slice(1).map((shot, i) => (
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

        <section className="lp-boat-copy">
          <h2>{t.interior}</h2>
          <p>{t.interior1}</p>
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
              setOpen((open - 1 + shots.length) % shots.length)
            }}
          >
            <ChevronLeft size={28} strokeWidth={1.4} />
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={current.src} alt={current.alt} />
            <figcaption>
              {current.caption}
              <em>
                {open + 1} / {shots.length}
              </em>
            </figcaption>
          </figure>
          <button
            className="lp-lightbox-next"
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((open + 1) % shots.length)
            }}
          >
            <ChevronRight size={28} strokeWidth={1.4} />
          </button>
          <div className="lp-lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
            {shots.map((shot, i) => (
              <button
                key={shot.src}
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
