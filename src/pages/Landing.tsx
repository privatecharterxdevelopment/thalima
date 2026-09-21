import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../landing.css'

const MAIL = 'mailto:sales@sws-yachts.eu?subject=Thalima%20charter'
const BROCHURE = '/yacht/brochure.pdf'
const SPEC = '/yacht/spec.pdf'

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const title = document.title
    html.classList.add('is-site')
    document.title = 'Thalima'
    return () => {
      html.classList.remove('is-site')
      document.title = title
    }
  }, [])

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

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className={menuOpen ? 'lp is-menu' : 'lp'}>
      <header className="lp-nav">
        <button
          className="lp-menu-btn"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          +
        </button>
        <a className="lp-brand" href="/">
          Thalima
        </a>
        <Link className="lp-crew" to="/login">
          Crew
        </Link>
      </header>

      <div
        className={menuOpen ? 'lp-overlay is-open' : 'lp-overlay'}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <img className="lp-overlay-mark" src="/yacht/sw-mark.png" alt="" />
        <nav className="lp-overlay-nav" aria-label="Menu">
          <a href="#stay" onClick={closeMenu}>
            Charter
          </a>
          <a href="#boat" onClick={closeMenu}>
            The boat
          </a>
          <a href={BROCHURE} target="_blank" rel="noreferrer" onClick={closeMenu}>
            Brochure
          </a>
          <a href="#ask" onClick={closeMenu}>
            Contact
          </a>
          <Link to="/login" onClick={closeMenu}>
            Crew
          </Link>
        </nav>
      </div>

      <section className="lp-hero">
        <div className="lp-hero-head">
          <p className="lp-eye">Southern Wind 110 RS</p>
          <h1>Southern Wind</h1>
        </div>
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
            <source src="/yacht/hero.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className="lp-intro">
        <p className="lp-eye">Thalima</p>
        <h2>
          A Southern Wind 110.
          <br />
          One quiet week in the Med.
        </h2>
        <p>
          Built in Cape Town, drawn by Farr, dressed by Nauta. We take a short list of weeks — Italy,
          Sardinia, the South of France — and the same five who sail her. Charter, crew, the boat.
          Under one roof, without the handoffs.
        </p>
      </section>

      <section className="lp-cut" aria-hidden="true">
        <img src="/yacht/sail-aerial-lagoon.jpg" alt="" />
        <img src="/yacht/hero-sailing.jpg" alt="" />
      </section>

      <section className="lp-services" id="stay">
        <p className="lp-eye">Our services</p>
        <h2>Three ways in. One boat.</h2>

        <article className="lp-svc">
          <img src="/yacht/cockpit-sunpads.jpg" alt="Guests on the sunpads" />
          <div>
            <h3>A week you’ll actually remember.</h3>
            <p>
              Tell us when, and where. We put you on Thalima with the crew that lives aboard — Med in
              summer, the Williams on the foredeck, dinner when the light goes.
            </p>
            <a href={MAIL}>
              Start a charter <span>↗</span>
            </a>
          </div>
        </article>

        <article className="lp-svc lp-svc-flip">
          <img src="/yacht/cockpit-night.jpg" alt="Evening in the cockpit" />
          <div>
            <h3>Crew, watches, the boat — quietly handled.</h3>
            <p>
              Tasks, watches, the log — signed in, not in a group chat. The board they use is the login
              on this site.
            </p>
            <Link to="/login">
              Hand it over <span>↗</span>
            </Link>
          </div>
        </article>

        <article className="lp-svc">
          <img src="/yacht/saloon.jpg" alt="Saloon after the 2024 refit" />
          <div>
            <h3>The book. Then the spec.</h3>
            <p>
              November 2025 brochure: deck, interior, the lines. The July spec if you want numbers.
              Both open as PDFs.
            </p>
            <a href={BROCHURE} target="_blank" rel="noreferrer">
              Open the brochure <span>↗</span>
            </a>
          </div>
        </article>
      </section>

      <section className="lp-dark" id="boat">
        <div className="lp-banner">
          <img src="/yacht/sail-overhead.jpg" alt="Thalima under sail" />
          <h2>
            The right week
            <br />
            changes the way time
            <br />
            moves.
          </h2>
        </div>

        <div className="lp-select">
          <div className="lp-select-head">
            <div>
              <p className="lp-eye">On board</p>
              <h2>
                A small selection, current today.
                <br />
                The rest is in the book.
              </h2>
            </div>
            <div className="lp-pills">
              <a className="lp-btn" href={MAIL}>
                Charter
              </a>
              <a className="lp-btn lp-btn-ghost" href={BROCHURE} target="_blank" rel="noreferrer">
                Brochure
              </a>
            </div>
          </div>

          <div className="lp-cards">
            <a className="lp-card" href={BROCHURE} target="_blank" rel="noreferrer">
              <img src="/yacht/owner-cabin.jpg" alt="Owner suite" />
              <div>
                <span>Owner suite</span>
                <b>Forward, walk-around berth</b>
                <p>Ensuite · 2024 refit</p>
              </div>
            </a>
            <a className="lp-card lp-card-tall" href={MAIL}>
              <img src="/yacht/hero-sailing.jpg" alt="Under sail" />
              <div>
                <span>Under sail</span>
                <b>Eleven knots when it is kind</b>
                <p>33.65 m · 10 guests</p>
              </div>
            </a>
            <a className="lp-card" href={MAIL}>
              <img src="/yacht/cockpit-night.jpg" alt="Evening cockpit" />
              <div>
                <span>Evening</span>
                <b>Ten around the table</b>
                <p>Centre cockpit</p>
              </div>
            </a>
            <a className="lp-card" href={BROCHURE} target="_blank" rel="noreferrer">
              <img src="/yacht/lounge.jpg" alt="Lounge" />
              <div>
                <span>Lounge</span>
                <b>After the Badalona winter</b>
                <p>Interior</p>
              </div>
            </a>
            <a className="lp-card" href={BROCHURE} target="_blank" rel="noreferrer">
              <img src="/yacht/saloon.jpg" alt="Saloon" />
              <div>
                <span>Saloon</span>
                <b>Seats ten, quietly</b>
                <p>Nauta · teak</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="lp-journal">
        <div className="lp-journal-head">
          <div>
            <p className="lp-eye">On paper</p>
            <h2>Worth reading</h2>
          </div>
          <p>The brochure, the spec, and a week that is still open. Three ways to start.</p>
        </div>
        <div className="lp-posts">
          <a href={BROCHURE} target="_blank" rel="noreferrer">
            <img src="/yacht/sail-aerial-lagoon.jpg" alt="" />
            <span>Brochure · Nov 2025</span>
            <h3>The book — deck, interior, the lines.</h3>
            <em>Read more</em>
          </a>
          <a href={SPEC} target="_blank" rel="noreferrer">
            <img src="/yacht/sail-beam.jpg" alt="" />
            <span>Specification · Jul 2026</span>
            <h3>33.65 m, Farr, Nauta, Ontario Blue.</h3>
            <em>Read more</em>
          </a>
          <a href={MAIL}>
            <img src="/yacht/cockpit-sunpads.jpg" alt="" />
            <span>Charter</span>
            <h3>Tell us the week. We come back with a coast.</h3>
            <em>Write to us</em>
          </a>
        </div>
      </section>

      <footer className="lp-foot" id="ask">
        <div className="lp-foot-grid">
          <div>
            <b>Thalima</b>
            <p>Built in Cape Town. Sailed in the Mediterranean.</p>
          </div>
          <div>
            <b>Contact</b>
            <a href="tel:+390105704035">+39 010 570 4035</a>
            <a href={MAIL}>sales@sws-yachts.eu</a>
          </div>
          <div>
            <b>On this site</b>
            <a href={MAIL}>Charter</a>
            <Link to="/login">Management</Link>
            <a href={BROCHURE} target="_blank" rel="noreferrer">
              Brochure
            </a>
            <a href={SPEC} target="_blank" rel="noreferrer">
              Spec
            </a>
          </div>
        </div>
        <p className="lp-mega">Thalima</p>
      </footer>
    </div>
  )
}
