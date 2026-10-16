import { supabase } from '../lib/supabase';

/**
 * `crypto.randomUUID` فقط در context امن (https یا localhost) وجود دارد. اپ روی
 * `0.0.0.0` سرو می‌شود و از داخل شبکه با آدرس IP هم باز می‌شود؛ آنجا این تابع
 * undefined است و فراخوانی‌اش استثنا می‌دهد. پس نام فایل با getRandomValues
 * ساخته می‌شود که در همه contextها در دسترس است.
 */
function randomFileName(ext: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${crypto.randomUUID()}.${ext}`;
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${id}.${ext}`;
}

export async function uploadImageToSupabase(
  folder: string,
  file: File
): Promise<{ url: string; error?: string }> {
  try {
    const ext = file.name.split('.')?.pop() || 'jpg';
    const path = `${folder}/${randomFileName(ext)}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(path, file, { upsert: false });

    if (error) return { url: '', error: error.message };

    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { url: '', error: e instanceof Error ? e.message : String(e) };
  }
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