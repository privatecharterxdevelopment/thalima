import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Anchor, Globe, Mail, Moon, Sun } from 'lucide-react'
import {
  copy,
  LANGS,
  LANG_KEY,
  readLang,
  type Lang,
  type SiteCopy,
} from './lib/siteCopy'
import { useStore } from './store'

export const CHARTER_TO = 'charter@thalima.com'
export const MAIL = `mailto:${CHARTER_TO}?subject=Thalima%20charter`
export const BROCHURE = '/yacht/brochure.pdf'
export const SPEC = '/yacht/spec.pdf'
export const PHONE = '+390105704035'
export const PHONE_LABEL = '+39 010 570 4035'
export const YOUTUBE = 'https://www.youtube.com/watch?v=dnsURdmF81M'

const COOKIE_KEY = 'thalima.cookie'

type SiteCtx = {
  lang: Lang
  setLang: (lang: Lang) => void
  night: boolean
  setNight: (night: boolean) => void
  t: SiteCopy
}

const Ctx = createContext<SiteCtx | null>(null)

export function useSiteCopy() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSiteCopy')
  return ctx
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useStore()
  const [lang, setLangState] = useState<Lang>('en')
  const night = theme === 'dark'
  const t = copy[lang]

  useEffect(() => {
    setLangState(readLang())
  }, [])

  const setLang = (next: Lang) => {
    setLangState(next)
    localStorage.setItem(LANG_KEY, next)
  }

  const setNight = useCallback(
    (next: boolean) => {
      setTheme(next ? 'dark' : 'light')
    },
    [setTheme],
  )

  const value = useMemo(
    () => ({ lang, setLang, night, setNight, t }),
    [lang, night, setNight, t],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function SiteChrome({ children, title }: { children: ReactNode; title?: string }) {
  const { lang, setLang, night, setNight, t } = useSiteCopy()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drop, setDrop] = useState<'info' | 'lang' | null>(null)
  const menuVideo = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const prev = document.title
    html.classList.add('is-site')
    html.classList.toggle('is-site-night', night)
    html.lang = lang
    document.title = title ? `${title} · Thalima` : 'Thalima'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#0b1622' : '#f7f4ef')
    return () => {
      html.classList.remove('is-site', 'is-site-night')
      html.lang = 'en'
      document.title = prev
    }
  }, [title, night, lang])

  useEffect(() => {
    if (!menuOpen) return
    const html = document.documentElement
    const y = window.scrollY
    html.classList.add('is-site-menu')
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'

    const block = (e: Event) => {
      e.preventDefault()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('wheel', block, { passive: false })
    window.addEventListener('touchmove', block, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      html.classList.remove('is-site-menu')
      html.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      window.scrollTo(0, y)
      window.removeEventListener('wheel', block)
      window.removeEventListener('touchmove', block)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    const el = menuVideo.current
    if (!el) return
    el.muted = true
    el.defaultMuted = true
    el.controls = false
    el.playsInline = true
    if (!menuOpen) {
      el.pause()
      return
    }
    const tryPlay = () => {
      el.controls = false
      void el.play().catch(() => {})
    }
    tryPlay()
    el.addEventListener('loadeddata', tryPlay)
    return () => el.removeEventListener('loadeddata', tryPlay)
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const infoMenu = (place: 'header' | 'foot') => (
    <div
      className={[
        'lp-drop',
        place === 'header' ? 'lp-info-header' : 'lp-info-foot',
        drop === 'info' ? 'is-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => setDrop('info')}
      onMouseLeave={() => setDrop(null)}
    >
      <button
        className="lp-tool lp-info-i"
        type="button"
        aria-haspopup="true"
        aria-expanded={drop === 'info'}
        aria-label={t.info}
        onClick={() => setDrop((d) => (d === 'info' ? null : 'info'))}
      >
        i
      </button>
      <div className="lp-drop-menu">
        <NavLink to="/brochure" onClick={close}>
          {t.brochure}
        </NavLink>
        <NavLink to="/specs" onClick={close}>
          {t.specs}
        </NavLink>
      </div>
    </div>
  )

  return (
    <div className={['lp', menuOpen ? 'is-menu' : '', night ? 'is-night' : ''].filter(Boolean).join(' ')}>
        <header className="lp-nav">
          <Link className="lp-brand" to="/" onClick={close} aria-label="Thalima">
            <img src="/logo.png" alt="Thalima" />
          </Link>
          <nav className="lp-tools" aria-label="Quick links">
            {infoMenu('header')}

            <div
              className={drop === 'lang' ? 'lp-drop is-open' : 'lp-drop'}
              onMouseEnter={() => setDrop('lang')}
              onMouseLeave={() => setDrop(null)}
            >
              <button
                className="lp-tool"
                type="button"
                aria-haspopup="true"
                aria-expanded={drop === 'lang'}
                aria-label={t.language}
                onClick={() => setDrop((d) => (d === 'lang' ? null : 'lang'))}
              >
                <Globe size={19} strokeWidth={1.6} />
              </button>
              <div className="lp-drop-menu lp-drop-lang">
                {LANGS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={lang === item.id ? 'on' : ''}
                    onClick={() => {
                      setLang(item.id)
                      setDrop(null)
                    }}
                  >
                    <span className="lp-lang-flag" aria-hidden="true">
                      {item.flag}
                    </span>
                    <span className="lp-lang-name">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <NavLink className="lp-tool" to="/charter" aria-label={t.charter} title={t.charter} onClick={close}>
              <Anchor size={19} strokeWidth={1.6} />
            </NavLink>

            <a className="lp-tool" href={MAIL} aria-label={t.contact} title={t.contact}>
              <Mail size={19} strokeWidth={1.6} />
            </a>

            <button
              className="lp-tool"
              type="button"
              aria-label={night ? t.themeLight : t.themeDark}
              title={night ? t.themeLight : t.themeDark}
              onClick={() => setNight(!night)}
            >
              {night ? <Sun size={19} strokeWidth={1.6} /> : <Moon size={19} strokeWidth={1.6} />}
            </button>
          </nav>
          <button
            className="lp-menu-btn"
            type="button"
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            +
          </button>
        </header>

        <div
          className={menuOpen ? 'lp-overlay is-open' : 'lp-overlay'}
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          <div className="lp-overlay-media" aria-hidden="true">
            <video
              ref={menuVideo}
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="metadata"
              poster="/yacht/menu.jpg?v=2"
              tabIndex={-1}
            >
              <source src="/yacht/menu.mp4?v=2" type="video/mp4" />
            </video>
            <img className="lp-overlay-mark" src="/mark.png" alt="" />
          </div>
          <nav className="lp-overlay-nav" aria-label="Menu">
            <Link to="/charter" onClick={close}>
              {t.charter}
            </Link>
            <Link to="/boat" onClick={close}>
              {t.theBoat}
            </Link>
            <Link to="/brochure" onClick={close}>
              {t.brochure}
            </Link>
            <Link to="/specs" onClick={close}>
              {t.specs}
            </Link>
            <Link to="/contact" onClick={close}>
              {t.contact}
            </Link>
          </nav>
        </div>

        {children}

        <footer className="lp-foot" id="ask">
          <div className="lp-foot-close">
            <h2>
              {t.madeForWind}
              <br />
              {t.builtForSea}
            </h2>
            <p className="lp-foot-meta">
              <b>Thalima</b>
              {t.sw110}
              <br />
              {t.sailingYacht}
            </p>
          </div>

          <hr className="lp-foot-rule" />

          <div className="lp-foot-grid">
            <div>
              <b>Thalima</b>
              <p>{t.capeTown}</p>
              <p>{t.medCruise}</p>
            </div>
            <div>
              <b>{t.contact}</b>
              <a href={`tel:${PHONE}`}>{PHONE_LABEL}</a>
              <a href={MAIL}>{CHARTER_TO}</a>
            </div>
            <div>
              <b>{t.explore}</b>
              <Link to="/charter">{t.charter}</Link>
              <Link to="/boat">{t.theBoat}</Link>
              <Link to="/brochure">{t.brochure}</Link>
              <Link to="/specs">{t.specifications}</Link>
            </div>
          </div>

          <div className="lp-foot-bar">
            <div className="lp-foot-actions">
              <Link className="lp-btn lp-btn-ghost" to="/brochure">
                {t.brochure}
              </Link>
              <Link className="lp-btn lp-btn-ghost" to="/specs">
                {t.specs}
              </Link>
            </div>
            <div className="lp-foot-legal">
              {infoMenu('foot')}
              <p>{t.copyYear}</p>
              <Link to="/privacy">{t.privacy}</Link>
              <Link to="/login">{t.crewLogin}</Link>
              <a href={YOUTUBE} target="_blank" rel="noreferrer">
                {t.youtube} <span>↗</span>
              </a>
            </div>
          </div>
        </footer>

        <CookieBanner />
      </div>
  )
}

function CookieBanner() {
  const { t } = useSiteCopy()
  const [choice, setChoice] = useState<string | null>('pending')

  useEffect(() => {
    setChoice(localStorage.getItem(COOKIE_KEY))
  }, [])

  if (choice === 'pending' || choice) return null

  const save = (value: 'all' | 'essential') => {
    localStorage.setItem(COOKIE_KEY, value)
    setChoice(value)
  }

  return (
    <aside className="lp-cookie" role="dialog" aria-label="Cookies">
      <img className="lp-cookie-mark" src="/mark.png" alt="" />
      <p>{t.cookieBody}</p>
      <div>
        <button type="button" className="lp-btn lp-cookie-ok" onClick={() => save('all')}>
          {t.cookieAccept}
        </button>
        <button type="button" className="lp-btn lp-btn-ghost lp-cookie-min" onClick={() => save('essential')}>
          {t.cookieEssential}
        </button>
        <Link to="/privacy">{t.privacy}</Link>
      </div>
    </aside>
  )
}
