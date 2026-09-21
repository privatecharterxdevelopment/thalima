import { Link } from 'react-router-dom'
import { SiteChrome, SPEC, useSiteCopy } from '../site'
import { yacht } from '../data/yacht'
import '../landing.css'

const rows: [string, string][] = [
  ['Yacht', `${yacht.type} · ${yacht.name}`],
  ['Builder', yacht.builder],
  ['Year / refit', `${yacht.year} / ${yacht.refit}`],
  ['LOA', `${yacht.loaM} m`],
  ['LWL', '29.78 m'],
  ['Beam', `${yacht.beamM} m`],
  ['Draft', `${yacht.draftM} m`],
  ['Displacement', '87 t'],
  ['Sail area', `${yacht.sailAreaM2} m²`],
  ['Engine', yacht.engine],
  ['Cruise / max', `${yacht.cruiseKn} / ${yacht.maxKn} kn`],
  ['Range', `${yacht.rangeNm} nm`],
  ['Guests / cabins', `${yacht.guests} / ${yacht.cabins}`],
  ['Crew', String(yacht.crew)],
  ['Naval', yacht.naval],
  ['Design', yacht.design],
  ['Class', yacht.class],
  ['Flag', yacht.flag],
  ['Tender', yacht.tender],
]

export function Specs() {
  const { t } = useSiteCopy()
  return (
    <SiteChrome title={t.specs}>
      <article className="lp-page">
        <header className="lp-page-head">
          <p className="lp-eye">{t.specs}</p>
          <h1>{t.specsTitle}</h1>
          <p>{t.specsLead}</p>
        </header>

        <dl className="lp-spec">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <p className="lp-page-cta">
          <a className="lp-btn" href={SPEC} target="_blank" rel="noreferrer">
            {t.openSpec}
          </a>
          <Link className="lp-btn lp-btn-ghost" to="/charter">
            {t.charter}
          </Link>
        </p>
      </article>
    </SiteChrome>
  )
}
