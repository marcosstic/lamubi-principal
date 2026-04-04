import { supabase } from './client.js';

const MESAS_MAPS_TABLE = 'mesas_maps';
const MESAS_MAP_IMAGES_TABLE = 'mesas_map_images';
const MESAS_BUCKET = 'mesas-images';

// ============================================================
// Mesas Maps - Public API
// ============================================================

/**
 * Obtiene el mapa de mesas activo actual con sus imágenes
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getActiveMesasMap() {
  // First, get the active map
  const { data: map, error: mapError } = await supabase
    .from(MESAS_MAPS_TABLE)
    .select('id, status, created_by, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (mapError || !map) return { data: null, error: mapError };

  // Then, get the images for this map
  const { data: images, error: imagesError } = await supabase
    .from(MESAS_MAP_IMAGES_TABLE)
    .select('id, storage_path, created_at')
    .eq('map_id', map.id)
    .order('created_at', { ascending: false });

  if (imagesError) return { data: null, error: imagesError };

  return { data: { ...map, images: images || [] }, error: null };
}

/**
 * Obtiene el historial de mapas de mesas (últimos 20)
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getMesasHistory() {
  // First, get all maps
  const { data: maps, error: mapsError } = await supabase
    .from(MESAS_MAPS_TABLE)
    .select('id, status, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (mapsError || !maps) return { data: null, error: mapsError };

  // Then, get all images for these maps
  const mapIds = maps.map(m => m.id);
  const { data: images, error: imagesError } = await supabase
    .from(MESAS_MAP_IMAGES_TABLE)
    .select('id, map_id, storage_path, created_at')
    .in('map_id', mapIds)
    .order('created_at', { ascending: false });

  if (imagesError) return { data: null, error: imagesError };

  // Combine maps with their images
  const result = maps.map(map => ({
    ...map,
    images: (images || []).filter(img => img.map_id === map.id)
  }));

  return { data: result, error: null };
}

// ============================================================
// Mesas Maps - Admin API
// ============================================================

/**
 * Publica un nuevo mapa de mesas (archiva el anterior y crea uno nuevo)
 * @param {File} file - Imagen del mapa de mesas
 * @param {string} createdBy - ID del usuario admin que publica
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function publishMesasMap(file, createdBy) {
  // Validar archivo
  if (!file) {
    return { data: null, error: { message: 'Archivo requerido' } };
  }

  // Step 1: Upload image to storage
  const ext = String(file?.name || '').split('.').pop().toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const objectPath = `maps/${Date.now()}.${safeExt}`;

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(MESAS_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file?.type || 'application/octet-stream'
    });

  if (uploadErr) return { data: null, error: uploadErr };

  // Step 2: Archive current active map
  await supabase
    .from(MESAS_MAPS_TABLE)
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('status', 'active');

  // Step 3: Create new active map
  const { data: map, error: mapErr } = await supabase
    .from(MESAS_MAPS_TABLE)
    .insert({ status: 'active', created_by: createdBy || null })
    .select()
    .single();

  if (mapErr) return { data: null, error: mapErr };

  // Step 4: Create image record
  const { data: image, error: imageErr } = await supabase
    .from(MESAS_MAP_IMAGES_TABLE)
    .insert({ map_id: map.id, storage_path: objectPath })
    .select()
    .single();

  if (imageErr) return { data: null, error: imageErr };

  return { data: { map, image }, error: null };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Obtiene la URL pública de una imagen de mesas
 * @param {string} storagePath - Ruta del archivo en storage
 * @returns {string|null}
 */
export function getMesasImagePublicUrl(storagePath) {
  if (!storagePath) return null;
  const { data } = supabase.storage.from(MESAS_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}
