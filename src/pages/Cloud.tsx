import { useSearchParams } from 'react-router-dom'
import { FileAdd } from '../components/FileList'
import { SectionTabs } from '../components/SectionTabs'
import { Avatar } from '../components/Avatar'
import { crew } from '../data/crew'
import { vesselFile } from '../data/ops'
import { yacht } from '../data/yacht'
import { certOverdue, certSoon } from '../lib/alerts'
import { dayClock, uid } from '../lib/format'
import { canAdminCalendar } from '../lib/permissions'
import { useStore } from '../store'
import type { CloudDoc, CloudFolder } from '../types'

const tabs = [
  { id: 'yacht', label: 'Yacht' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'manuals', label: 'Manuals' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'directory', label: 'Directory' },
] as const

type Tab = (typeof tabs)[number]['id']

const folderOf: Record<Exclude<Tab, 'directory' | 'yacht'>, CloudFolder> = {
  certificates: 'certificate',
  manuals: 'manual',
  invoices: 'invoice',
  contracts: 'contract',
}

export function Cloud() {
  const { user, docs, ops, addDoc, removeDoc } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'yacht') as Tab
  if (!user) return null
  const admin = canAdminCalendar(user)

  const folder: CloudFolder | 'all' =
    tab === 'yacht' ? 'yacht' : tab === 'directory' ? 'all' : folderOf[tab]
  const rows = [...docs]
    .filter((d) => tab === 'directory' || (d.folder ?? 'yacht') === folder)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const yachtCerts = ops.certificates.filter((c) => c.kind !== 'crew')

  return (
    <div className="pad cloud">
      <div className="inv-head">
        <SectionTabs value={tab} onChange={(id) => setParams({ tab: id })} tabs={[...tabs]} />
      </div>

      {tab === 'yacht' && (
        <dl className="vessel-file">
          <div>
            <dt>Yacht</dt>
            <dd>
              {yacht.name} · {yacht.type}
            </dd>
          </div>
          <div>
            <dt>Flag / port</dt>
            <dd>
              {yacht.flag} · {vesselFile.port}
            </dd>
          </div>
          <div>
            <dt>MMSI / call / IMO</dt>
            <dd>
              {yacht.mmsi} · {yacht.callsign} · {yacht.imo}
            </dd>
          </div>
          <div>
            <dt>Class</dt>
            <dd>
              {vesselFile.classSociety} · {vesselFile.mca}
            </dd>
          </div>
          <div>
            <dt>Insurance</dt>
            <dd>{vesselFile.insurance}</dd>
          </div>
          <div>
            <dt>Tanks</dt>
            <dd>
              Fuel {vesselFile.tanks.fuelL.toLocaleString()} L · Water {vesselFile.tanks.waterL.toLocaleString()} L ·
              Grey {vesselFile.tanks.greyL.toLocaleString()} L · Black {vesselFile.tanks.blackL.toLocaleString()} L
            </dd>
          </div>
          <div>
            <dt>Tender / toys</dt>
            <dd>{vesselFile.toys.join(' · ')}</dd>
          </div>
        </dl>
      )}

      {tab === 'certificates' && (
        <table className="table inv-table" style={{ marginBottom: 28 }}>
          <thead>
            <tr>
              <th>Certificate</th>
              <th>Kind</th>
              <th>Expires</th>
              <th>Issuer</th>
            </tr>
          </thead>
          <tbody>
            {yachtCerts.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.title}
                  {c.notes ? <div className="muted">{c.notes}</div> : null}
                </td>
                <td>{c.kind}</td>
                <td className={certOverdue(c.expiresAt) || certSoon(c.expiresAt) ? 'low' : ''}>{dayClock(c.expiresAt)}</td>
                <td className="muted">{c.issuer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'directory' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th>Reach</th>
              <th>Place</th>
            </tr>
          </thead>
          <tbody>
            {ops.contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.name}
                  {c.note ? <div className="muted">{c.note}</div> : null}
                </td>
                <td>{c.kind}</td>
                <td>
                  {c.phone ? <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a> : '—'}
                  {c.email ? (
                    <div>
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                    </div>
                  ) : null}
                  {c.whatsapp ? <div className="muted">WhatsApp {c.whatsapp}</div> : null}
                </td>
                <td className="muted">{c.place}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab !== 'directory' && (
        <>
          {admin && tab !== 'yacht' && (
            <div className="cloud-add">
              <FileAdd
                files={[]}
                label="Add documents"
                onChange={(files) => {
                  for (const f of files) {
                    const doc: CloudDoc = {
                      ...f,
                      id: uid('d'),
                      title: f.name.replace(/\.[^.]+$/, ''),
                      createdBy: user.id,
                      createdAt: new Date().toISOString(),
                      folder: folder === 'all' ? 'yacht' : folder,
                    }
                    addDoc(doc)
                  }
                }}
              />
            </div>
          )}
          {tab !== 'yacht' || rows.length > 0 ? (
            <ul className="cloud-list">
              {rows.length === 0 ? (
                <li className="hint">Nothing in this folder yet.</li>
              ) : (
                rows.map((d) => {
                  const who = crew.find((c) => c.id === d.createdBy)
                  return (
                    <li key={d.id} className="cloud-row">
                      <a href={d.dataUrl} download={d.name}>
                        <strong>{d.title}</strong>
                        <span>{d.name}</span>
                      </a>
                      <small>
                        {who && <Avatar person={who} size="sm" />}
                        {who?.name.split(' ')[0]} · {dayClock(d.createdAt)}
                      </small>
                      {admin && (
                        <button className="text-link" type="button" onClick={() => removeDoc(d.id)}>
                          Remove
                        </button>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          ) : null}
        </>
      )}
    </div>
  )
}
