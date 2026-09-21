import { fileSize, filesFromList } from '../lib/files'
import type { AttachedFile } from '../types'

export function FileList({
  files,
  onRemove,
}: {
  files: AttachedFile[]
  onRemove?: (id: string) => void
}) {
  if (!files.length) return null
  return (
    <ul className="file-list">
      {files.map((f) => (
        <li key={f.id}>
          <a href={f.dataUrl} download={f.name} onClick={(e) => e.stopPropagation()}>
            {f.name}
            <small>{fileSize(f.size)}</small>
          </a>
          {onRemove && (
            <button type="button" onClick={() => onRemove(f.id)} aria-label={`Remove ${f.name}`}>
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export function FileAdd({
  files,
  onChange,
  label = 'Attach',
}: {
  files: AttachedFile[]
  onChange: (files: AttachedFile[]) => void
  label?: string
}) {
  return (
    <label className="file-add">
      <input
        type="file"
        multiple
        onChange={async (e) => {
          const added = await filesFromList(e.target.files, files.length)
          if (added.length) onChange([...files, ...added])
          e.target.value = ''
        }}
      />
      {label}
    </label>
  )
}
