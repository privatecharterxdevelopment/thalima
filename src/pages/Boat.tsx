import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

type Shot = {
  src: string
  alt: string
  caption: string
  span?: 'wide' | 'tall'
  group?: 'deck' | 'interior'
}

const deckShots: Shot[] = [
  {
    src: '/yacht/sail-overhead.jpg',
    alt: 'Thalima under sail, seen from above',
    caption: 'Under sail',
    span: 'wide',
    group: 'deck',
  },
  {
    src: '/yacht/hero-sailing.jpg',
    alt: 'Thalima sailing, guests on deck',
    caption: 'On deck',
    span: 'tall',
    group: 'deck',
  },
  {
    src: '/yacht/sail-beam.jpg',
    alt: 'Thalima in profile on a calm evening',
    caption: 'Profile',
    group: 'deck',
  },
  {
    src: '/yacht/sail-aerial-lagoon.jpg',
    alt: 'Thalima at anchor over turquoise water',
    caption: 'At anchor',
    group: 'deck',
  },
  {
    src: '/yacht/cockpit-sunpads.jpg',
    alt: 'Sunpads and twin wheels, looking forward',
    caption: 'Sunpads',
    group: 'deck',
  },
  {
    src: '/yacht/cockpit-table.jpg',
    alt: 'Guest cockpit set for a meal, boom awning up',
    caption: 'Guest cockpit',
    span: 'wide',
    group: 'deck',
  },
  {
    src: '/yacht/cockpit-night.jpg',
    alt: 'Evening in the cockpit',
    caption: 'Evening',
    group: 'deck',
  },
]

const interiorShots: Shot[] = [
  { src: '/yacht/interior/11.jpg', alt: 'Owner suite with island berth', caption: 'Owner suite', span: 'wide', group: 'interior' },
  { src: '/yacht/interior/17.jpg', alt: 'Owner suite under skylights', caption: 'Owner suite', span: 'tall', group: 'interior' },
  { src: '/yacht/interior/14.jpg', alt: 'Owner study with quilted chair', caption: 'Owner study', group: 'interior' },
  { src: '/yacht/interior/15.jpg', alt: 'Owner suite looking toward ensuite', caption: 'Owner suite', group: 'interior' },
  { src: '/yacht/interior/16.jpg', alt: 'Owner suite with desk and sofa', caption: 'Owner suite', span: 'wide', group: 'interior' },
  { src: '/yacht/interior/13.jpg', alt: 'Owner suite with striped bedding', caption: 'Owner suite', group: 'interior' },
  { src: '/yacht/interior/19.jpg', alt: 'Owner suite walkway and desk', caption: 'Owner suite', group: 'interior' },
  { src: '/yacht/interior/12.jpg', alt: 'Ensuite with double vanity', caption: 'Ensuite', span: 'wide', group: 'interior' },
  { src: '/yacht/interior/08.jpg', alt: 'Twin guest cabin', caption: 'Twin cabin', group: 'interior' },
  { src: '/yacht/interior/09.jpg', alt: 'Twin guest cabin with blue throws', caption: 'Twin cabin', group: 'interior' },
  { src: '/yacht/interior/10.jpg', alt: 'Twin guest cabin with terracotta throws', caption: 'Twin cabin', span: 'wide', group: 'interior' },
  { src: '/yacht/interior/07.jpg', alt: 'Interior companionway', caption: 'Companionway', group: 'interior' },
  { src: '/yacht/interior/18.jpg', alt: 'Saloon and lounge after the 2024 refit', caption: 'Saloon', span: 'wide', group: 'interior' },
  { src: '/yacht/interior/01.jpg', alt: 'Galley and systems station', caption: 'Galley', group: 'interior' },
  { src: '/yacht/interior/03.jpg', alt: 'Galley island and range', caption: 'Galley', group: 'interior' },
  { src: '/yacht/interior/05.jpg', alt: 'Galley with coffee station', caption: 'Galley', group: 'interior' },
  { src: '/yacht/interior/06.jpg', alt: 'Galley looking aft to fridge', caption: 'Galley', span: 'wide', group: 'interior' },
  { src: '/yacht/interior/02.jpg', alt: 'Navigation and crew station', caption: 'Navigation', group: 'interior' },
  { src: '/yacht/interior/04.jpg', alt: 'Galley worktop', caption: 'Galley', group: 'interior' },
  { src: '/yacht/lounge.jpg', alt: 'Lounge seating', caption: 'Lounge', group: 'interior' },
]

const shots: Shot[] = [...deckShots, ...interiorShots]

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

        <div className="lp-bento">
          <figure className="lp-bento-video">
            <button type="button" onClick={() => setOpen(0)} aria-label={deckShots[0].caption}>
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
              <span>{deckShots[0].caption}</span>
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
