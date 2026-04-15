import { supabase } from './client.js';

const PAYMENTS_TABLE = 'payments';
const PAYMENT_PROOFS_TABLE = 'payment_proofs';
const PROOFS_BUCKET = 'payment-proofs';

// ============================================================
// Payments CRUD
// ============================================================

export async function createPayment({ orderId, payerId, method, amountUsd, amountBs }) {
  return supabase
    .from(PAYMENTS_TABLE)
    .insert({
      order_id: orderId,
      payer_id: payerId,
      method,
      amount_usd: amountUsd || null,
      amount_bs: amountBs || null,
      status: 'submitted'
    })
    .select()
    .single();
}

export async function getPaymentByOrder(orderId) {
  return supabase
    .from(PAYMENTS_TABLE)
    .select(`
      *,
      proofs:payment_proofs(id, storage_path, created_at)
    `)
    .eq('order_id', orderId)
    .maybeSingle();
}

export async function updatePaymentStatus(paymentId, status, reviewedBy) {
  const patch = {
    status,
    reviewed_by: reviewedBy || null,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return supabase
    .from(PAYMENTS_TABLE)
    .update(patch)
    .eq('id', paymentId)
    .select()
    .single();
}

export async function listPendingPayments() {
  return supabase
    .from(PAYMENTS_TABLE)
    .select(`
      *,
      order:orders(id, buyer_id, total_usd, created_at, order_items:order_items(id, qty, unit_price_usd, product:products(id, sku, name))),
      proofs:payment_proofs(id, storage_path, created_at)
    `)
    .in('status', ['submitted', 'approved', 'rejected'])
    .order('submitted_at', { ascending: false });
}

export async function listAllPayments(filters = {}) {
  let query = supabase
    .from(PAYMENTS_TABLE)
    .select(`
      *,
      order:orders(id, buyer_id, total_usd, created_at),
      proofs:payment_proofs(id, storage_path, created_at)
    `)
    .order('submitted_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

// ============================================================
// Payment Proofs (Storage)
// ============================================================

export async function uploadPaymentProof(paymentId, file) {
  const ext = String(file?.name || '').split('.').pop().toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg';
  const objectPath = `proofs/${paymentId}/${Date.now()}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from(PROOFS_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file?.type || 'application/octet-stream'
    });

  if (error) return { data: null, error };

  // Create proof record
  const { data: proof, error: proofErr } = await supabase
    .from(PAYMENT_PROOFS_TABLE)
    .insert({
      payment_id: paymentId,
      storage_path: objectPath
    })
    .select()
    .single();

  if (proofErr) return { data: null, error: proofErr };
  return { data: proof, error: null };
}

export function getProofPublicUrl(storagePath) {
  if (!storagePath) return null;
  const { data } = supabase.storage.from(PROOFS_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

export async function createProofSignedUrl(storagePath, expiresInSeconds = 300) {
  if (!storagePath) return { data: null, error: { message: 'storagePath requerido' } };
  const expiresIn = Number(expiresInSeconds);
  const safeExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 300;

  const { data, error } = await supabase.storage
    .from(PROOFS_BUCKET)
    .createSignedUrl(storagePath, safeExpiresIn);

  if (error) return { data: null, error };
  return { data: { signedUrl: data?.signedUrl || null }, error: null };
}
