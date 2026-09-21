import { SiteChrome, useSiteCopy } from '../site'
import '../landing.css'

export function Privacy() {
  const { t } = useSiteCopy()
  return (
    <SiteChrome title={t.privacy}>
      <article className="lp-page">
        <header className="lp-page-head">
          <p className="lp-eye">{t.privacy}</p>
          <h1>{t.privacyTitle}</h1>
        </header>
        <div className="lp-copy-wide">
          <p>{t.privacy1}</p>
          <p>{t.privacy2}</p>
          <p>{t.privacy3}</p>
        </div>
      </article>
    </SiteChrome>
  )
}
