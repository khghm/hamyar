import { supabase } from '../lib/supabase';

export async function uploadImageToSupabase(
  folder: string,
  file: File
): Promise<{ url: string; error?: string }> {
  const ext = file.name.split('.')?.pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${fileName}`;
  
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: false });
  
  if (error) return { url: '', error: error.message };
  
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function uploadImageFromDataUrl(
  folder: string,
  dataUrl: string,
  fileName: string
): Promise<{ url: string; error?: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
  return uploadImageToSupabase(folder, file);
}

export async function deleteImageFromSupabase(url: string): Promise<{ error?: string }> {
  try {
    const path = url.split('/images/')[1];
    if (!path) return { error: 'Invalid URL' };
    
    const { error } = await supabase.storage.from('images').remove([path]);
    if (error) return { error: error.message };
    return {};
  } catch {
    return { error: 'Failed to delete' };
  }
}