import { supabase } from './client.js';

const PRODUCTS_TABLE = 'products';
const PRODUCT_IMAGES_BUCKET = 'product-images';

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function listActiveProductsPublic() {
  return supabase
    .from(PRODUCTS_TABLE)
    .select('id, sku, slug, product_type, name, description, price_usd, active, image_path, sort_order, created_at, updated_at')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
}

export async function listProductsAdmin() {
  return supabase
    .from(PRODUCTS_TABLE)
    .select('id, sku, slug, product_type, name, description, price_usd, active, image_path, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
}

export async function createProduct(input) {
  const payload = {
    sku: input.sku,
    slug: input.slug,
    product_type: input.product_type,
    name: input.name,
    description: input.description || null,
    price_usd: input.price_usd,
    active: input.active,
    sort_order: input.sort_order,
    image_path: input.image_path || null
  };

  return supabase
    .from(PRODUCTS_TABLE)
    .insert(payload)
    .select('id')
    .single();
}

export async function updateProduct(id, patch) {
  const payload = {
    ...patch,
    updated_at: new Date().toISOString()
  };

  return supabase
    .from(PRODUCTS_TABLE)
    .update(payload)
    .eq('id', id)
    .select('id')
    .single();
}

export async function deleteProduct(id) {
  return supabase
    .from(PRODUCTS_TABLE)
    .delete()
    .eq('id', id)
    .select('id')
    .single();
}

export function getProductImagePublicUrl(image_path) {
  if (!image_path) return null;
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(image_path);
  return data?.publicUrl || null;
}

export async function uploadProductImage(file, opts) {
  const sku = String(opts?.sku || '').trim();
  if (!sku) {
    return { data: null, error: { message: 'SKU requerido para subir imagen' } };
  }

  const ext = String(file?.name || '').split('.').pop().toLowerCase();
  const safeExt = ext && ext.length <= 6 ? ext : 'jpg';
  const objectPath = `products/${sku}/${Date.now()}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file?.type || 'application/octet-stream'
    });

  if (error) return { data: null, error };
  return { data: { path: data.path }, error: null };
}

export function deriveSkuAndSlugFromName(name) {
  const base = slugify(name);
  const sku = base ? base.slice(0, 40) : `sku-${Date.now()}`;
  const slug = base ? base.slice(0, 80) : `producto-${Date.now()}`;
  return { sku, slug };
}
