import { uid } from './format'
import type { AttachedFile } from '../types'

const MAX_BYTES = 1_500_000
const MAX_FILES = 8

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function filesFromList(list: FileList | null, already = 0): Promise<AttachedFile[]> {
  if (!list) return []
  const room = Math.max(0, MAX_FILES - already)
  const out: AttachedFile[] = []
  for (const file of Array.from(list).slice(0, room)) {
    if (file.size > MAX_BYTES) continue
    const dataUrl = await readAsDataUrl(file)
    out.push({
      id: uid('f'),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl,
    })
  }
  return out
}

export function fileSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
