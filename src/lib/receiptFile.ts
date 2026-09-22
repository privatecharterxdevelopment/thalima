import { MAX_UPLOAD_BYTES, uploadFile } from './upload'
import type { AttachedFile } from '../types'

export async function fileToReceipt(file: File): Promise<AttachedFile | null> {
  if (file.size > MAX_UPLOAD_BYTES) return null
  try {
    return await uploadFile(file, file.name, file.type || 'application/octet-stream')
  } catch {
    return null
  }
}
