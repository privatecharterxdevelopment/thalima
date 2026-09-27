import { supabase } from './supabase'

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024

export type DriveDoc = {
  id: string
  name: string
  storage_path: string
  mime: string
  size_bytes: number
  uploaded_by: string | null
  uploaded_by_name: string
  created_at: string
}

function safeName(name: string) {
  return name.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180) || 'file'
}

export async function listDocuments(): Promise<DriveDoc[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, storage_path, mime, size_bytes, uploaded_by, uploaded_by_name, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as DriveDoc[]
}

export async function uploadDocument(file: File) {
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error(`${file.name} is larger than 25 MB.`)
  }
  const name = safeName(file.name)
  const storage_path = `${crypto.randomUUID()}/${name}`
  const mime = file.type || 'application/octet-stream'
  const { error: upErr } = await supabase.storage.from('documents').upload(storage_path, file, {
    contentType: mime,
    upsert: false,
  })
  if (upErr) throw new Error(upErr.message)
  const { error } = await supabase.from('documents').insert({
    name: file.name.trim() || name,
    storage_path,
    mime,
    size_bytes: file.size,
  })
  if (error) {
    await supabase.storage.from('documents').remove([storage_path])
    throw new Error(error.message)
  }
}

export async function deleteDocument(doc: DriveDoc) {
  const { error: fileErr } = await supabase.storage.from('documents').remove([doc.storage_path])
  if (fileErr) throw new Error(fileErr.message)
  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw new Error(error.message)
}

async function fileBlob(doc: DriveDoc) {
  const { data, error } = await supabase.storage.from('documents').download(doc.storage_path)
  if (error || !data) throw new Error(error?.message || 'Could not open this document.')
  return new Blob([data], { type: doc.mime || data.type || 'application/octet-stream' })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;'
    if (ch === '<') return '&lt;'
    if (ch === '>') return '&gt;'
    if (ch === '"') return '&quot;'
    return '&#39;'
  })
}

export async function openDocument(doc: DriveDoc) {
  const blob = await fileBlob(doc)
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank', 'noopener')
  if (!opened) {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener'
    a.click()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

export async function printDocument(doc: DriveDoc) {
  const blob = await fileBlob(doc)
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.title = doc.name
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const page = frame.contentDocument
  const view = frame.contentWindow
  if (!page || !view) {
    frame.remove()
    URL.revokeObjectURL(url)
    throw new Error('Could not print this document.')
  }
  const title = escapeHtml(doc.name)
  const type = blob.type
  const finish = () => {
    view.focus()
    view.print()
  }
  if (type.startsWith('text/')) {
    const text = escapeHtml(await blob.text())
    page.open()
    page.write(
      `<!doctype html><title>${title}</title><pre style="font:15px/1.6 ui-sans-serif,sans-serif;white-space:pre-wrap;padding:2.5rem;margin:0">${text}</pre>`,
    )
    page.close()
    finish()
  } else if (type.startsWith('image/')) {
    page.open()
    page.write(
      `<!doctype html><title>${title}</title><body style="margin:0"><img alt="" src="${url}" style="max-width:100%"></body>`,
    )
    page.close()
    const img = page.querySelector('img')
    if (img) img.addEventListener('load', finish)
    else finish()
  } else {
    frame.src = url
    frame.addEventListener('load', finish)
  }
  window.setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 60_000)
}

export function subscribeDocuments(onChange: () => void) {
  const channel = supabase
    .channel(`documents-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => onChange())
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
