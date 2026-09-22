import { supabase } from './supabase'
import type { AttachedFile } from '../types'

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024
export const MAX_FILES = 8

export async function uploadFile(file: Blob, name: string, type: string): Promise<AttachedFile> {
  const safe = name.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180) || 'file'
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const path = `${id}_${safe}`
  const { error } = await supabase.storage.from('uploads').upload(path, file, {
    contentType: type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('uploads').getPublicUrl(path)
  return {
    id: `f_${id}`,
    name: safe,
    type: type || 'application/octet-stream',
    size: file.size,
    dataUrl: data.publicUrl,
  }
}
