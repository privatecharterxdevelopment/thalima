import { useState } from 'react'
import { fileToReceipt } from '../lib/receiptFile'
import type { AttachedFile } from '../types'

export function ReceiptCapture({
  onFile,
  busy,
  scanLabel = 'Scan receipt',
  uploadLabel = 'Upload receipt',
  combinedLabel,
}: {
  onFile: (file: AttachedFile) => void
  busy?: boolean
  scanLabel?: string
  uploadLabel?: string
  combinedLabel?: string
}) {
  const [error, setError] = useState('')

  async function take(list: FileList | null) {
    const file = list?.[0]
    if (!file) return
    setError('')
    const receipt = await fileToReceipt(file)
    if (!receipt) {
      setError('That file is too large or not a supported image/PDF. Try a smaller scan.')
      return
    }
    onFile(receipt)
  }

  if (combinedLabel) {
    return (
      <div className="acct-capture">
        <label className="acct-drop">
          <input
            type="file"
            accept="image/*,application/pdf,.pdf"
            disabled={busy}
            onChange={(e) => {
              void take(e.target.files)
              e.target.value = ''
            }}
          />
          {combinedLabel}
        </label>
        {error ? <p className="acct-warn">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="acct-capture">
      <label className="acct-capture-btn">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={busy}
          onChange={(e) => {
            void take(e.target.files)
            e.target.value = ''
          }}
        />
        {scanLabel}
      </label>
      <label className="acct-capture-btn is-ghost">
        <input
          type="file"
          accept="image/*,application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => {
            void take(e.target.files)
            e.target.value = ''
          }}
        />
        {uploadLabel}
      </label>
      {error ? <p className="acct-warn">{error}</p> : null}
    </div>
  )
}
