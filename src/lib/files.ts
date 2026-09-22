import { MAX_FILES, MAX_UPLOAD_BYTES, uploadFile } from './upload'
import type { AttachedFile } from '../types'

export async function filesFromList(list: FileList | null, already = 0): Promise<AttachedFile[]> {
  if (!list) return []
  const room = Math.max(0, MAX_FILES - already)
  const out: AttachedFile[] = []
  for (const file of Array.from(list).slice(0, room)) {
    if (file.size > MAX_UPLOAD_BYTES) continue
    try {
      out.push(await uploadFile(file, file.name, file.type || 'application/octet-stream'))
    } catch {
      /* skip failed upload */
    }
  }
  return out
}

export function fileSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
