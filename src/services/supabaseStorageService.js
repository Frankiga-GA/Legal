import { isSupabaseConfigured, supabase } from '../utils/supabase';

const BUCKET_NAME = 'case-documents';

/**
 * Sube un archivo físico al disco duro de Supabase Storage.
 * @param {File} file - El archivo a subir
 * @param {string} caseId - ID del expediente para organizar las carpetas
 * @returns {Promise<{ publicUrl: string|null, error: string|null }>}
 */
export const uploadFileToStorage = async (file, caseId) => {
  if (!isSupabaseConfigured || !supabase) {
    return { publicUrl: null, error: 'Supabase no está configurado.' };
  }

  try {
    // Para evitar conflictos de nombres de archivos, agregamos un UUID o timestamp al principio
    const fileExtension = file.name.split('.').pop();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${crypto.randomUUID()}-${safeFileName}`;
    const filePath = `${caseId}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error al subir archivo a Storage:', error);
      return { publicUrl: null, error: error.message };
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { publicUrl: urlData.publicUrl, error: null };
  } catch (err) {
    console.error('Excepción al subir a Storage:', err);
    return { publicUrl: null, error: err.message };
  }
};
