import { supabase } from '../lib/supabase';
export { supabase } from '../lib/supabase';
export type { Session, User } from '@supabase/supabase-js';

/**
 * Uploads an attachment to the `order-documents` bucket.
 *
 * Documents are attached while the order form is being filled in, so no order
 * row exists yet. Files therefore land in the caller's own staging folder
 * `private/<auth uid>/…`; the returned path is stored on the `order_documents`
 * row once the order is created. The storage policies grant a customer write
 * access to that folder only, and read access to anything attached to their
 * own orders — see migration 006 section 7.
 */
export async function uploadOrderDocument(
  ownerId: string,
  file: File,
  label: string,
): Promise<{ path: string; error?: string }> {
  const ext = file.name.split('.')?.pop();
  const safeLabel = (label || 'doc').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeLabel}-${crypto.randomUUID()}.${ext}`;
  const path = `private/${ownerId}/${fileName}`;
  const { error } = await supabase.storage
    .from('order-documents')
    .upload(path, file, { upsert: false });
  if (error) return { path: '', error: error.message };
  return { path };
}

export async function getSignedDocumentUrl(
  storagePath: string,
  expiresInSec = 120,
): Promise<string> {
  const { data } = await supabase.storage
    .from('order-documents')
    .createSignedUrl(storagePath, expiresInSec);
  return data?.signedUrl ?? '';
}

export async function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  mimeType = 'application/octet-stream',
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: mimeType });
}

export async function uploadImage(
  folder: string,
  file: File,
): Promise<{ path: string; error?: string }> {
  const ext = file.name.split('.')?.pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${fileName}`;
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: false });
  if (error) return { path: '', error: error.message };
  return { path };
}

export function getPublicImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from('images').getPublicUrl(storagePath);
  return data?.publicUrl ?? '';
}

