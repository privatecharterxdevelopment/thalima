import { useEffect, useMemo, useState } from 'react'
import { Printer, Search, Trash2, Upload } from 'lucide-react'
import { fileSize } from '../lib/files'
import {
  deleteDocument,
  listDocuments,
  openDocument,
  printDocument,
  subscribeDocuments,
  uploadDocument,
  type DriveDoc,
} from '../lib/documents'
import { dayClock } from '../lib/format'
import { useStore } from '../store'

function kindOf(doc: DriveDoc) {
  const ext = doc.name.split('.').pop()?.toLowerCase()
  if (doc.mime.startsWith('image/')) return 'Image'
  if (doc.mime === 'application/pdf' || ext === 'pdf') return 'PDF'
  if (doc.mime.startsWith('text/') || ext === 'txt') return 'Text'
  if (ext === 'doc' || ext === 'docx') return 'Word'
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'Spreadsheet'
  if (ext && ext !== doc.name.toLowerCase()) return ext.toUpperCase()
  return 'File'
}

export function Cloud() {
  const { user } = useStore()
  const [docs, setDocs] = useState<DriveDoc[]>([])
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function refresh() {
    const rows = await listDocuments()
    setDocs(rows)
  }

  useEffect(() => {
    if (!user) return
    let stop = false
    void listDocuments()
      .then((rows) => {
        if (!stop) setDocs(rows)
      })
      .catch((err: unknown) => {
        if (!stop) setNotice(err instanceof Error ? err.message : 'Could not load documents.')
      })
    const unsubscribe = subscribeDocuments(() => {
      void listDocuments()
        .then((rows) => {
          if (!stop) setDocs(rows)
        })
        .catch(() => {})
    })
    return () => {
      stop = true
      unsubscribe()
    }
  }, [user])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter((doc) =>
      [doc.name, kindOf(doc), doc.uploaded_by_name].join(' ').toLowerCase().includes(q),
    )
  }, [docs, query])

  if (!user) return null

  async function onUpload(list: FileList | null) {
    if (!list?.length) return
    setBusy(true)
    setNotice('')
    const failed: string[] = []
    for (const file of Array.from(list)) {
      try {
        await uploadDocument(file)
      } catch (err) {
        failed.push(err instanceof Error ? err.message : file.name)
      }
    }
    try {
      await refresh()
    } catch (err) {
      failed.push(err instanceof Error ? err.message : 'Could not refresh the list.')
    }
    setBusy(false)
    if (failed.length) setNotice(failed.join(' '))
  }

  async function onOpen(doc: DriveDoc) {
    setNotice('')
    try {
      await openDocument(doc)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not open this document.')
    }
  }

  async function onPrint(doc: DriveDoc) {
    setNotice('')
    try {
      await printDocument(doc)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not print this document.')
    }
  }

  async function onDelete(doc: DriveDoc) {
    if (!window.confirm(`Delete ${doc.name}? It disappears for the whole crew.`)) return
    setNotice('')
    try {
      await deleteDocument(doc)
      setDocs((rows) => rows.filter((row) => row.id !== doc.id))
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete this document.')
    }
  }

  return (
    <div className="pad cloud-drive">
      <div className="cloud-toolbar">
        <label className="ops-search cloud-search">
          <Search size={16} strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
          />
        </label>
        <label className={`btn ${busy ? 'is-busy' : ''}`}>
          <Upload size={15} strokeWidth={1.75} />
          {busy ? 'Uploading' : 'Upload'}
          <input
            type="file"
            multiple
            disabled={busy}
            onChange={(e) => {
              void onUpload(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {notice ? <p className="cloud-note">{notice}</p> : null}

      {shown.length === 0 ? (
        <p className="cloud-note">
          {docs.length === 0
            ? 'No documents yet. Upload a file and the whole crew can open it.'
            : 'No documents match that search.'}
        </p>
      ) : (
        <table className="table inv-table cloud-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Added</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <button className="cloud-file" type="button" onClick={() => void onOpen(doc)}>
                    {doc.name}
                  </button>
                </td>
                <td className="muted">{kindOf(doc)}</td>
                <td className="muted">{fileSize(doc.size_bytes)}</td>
                <td className="muted">
                  {dayClock(doc.created_at)}
                  {doc.uploaded_by_name ? ` · ${doc.uploaded_by_name.split(' ')[0]}` : ''}
                </td>
                <td>
                  <div className="cloud-acts">
                    <button className="text-link" type="button" onClick={() => void onOpen(doc)}>
                      Open
                    </button>
                    <button className="text-link" type="button" onClick={() => void onPrint(doc)}>
                      <Printer size={14} strokeWidth={1.75} />
                      Print
                    </button>
                    <button className="text-link" type="button" onClick={() => void onDelete(doc)}>
                      <Trash2 size={14} strokeWidth={1.75} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
