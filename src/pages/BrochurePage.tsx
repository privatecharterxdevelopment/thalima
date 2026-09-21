import { SiteChrome, BROCHURE, useSiteCopy } from '../site'
import '../landing.css'

export function BrochurePage() {
  const { t } = useSiteCopy()
  return (
    <SiteChrome title={t.brochure}>
      <article className="lp-page">
        <header className="lp-page-head">
          <p className="lp-eye">{t.brochure}</p>
          <h1>{t.brochureTitle}</h1>
          <p>{t.brochureLead}</p>
        </header>

        <div className="lp-page-media">
          <img src="/yacht/cover-sailing.jpg" alt="Thalima brochure cover" />
        </div>

        <p className="lp-page-cta">
          <a className="lp-btn" href={BROCHURE} target="_blank" rel="noreferrer">
            {t.openBrochure}
          </a>
        </p>
      </article>
    </SiteChrome>
  )
}
