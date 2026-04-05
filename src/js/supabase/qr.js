import { supabase } from './client.js';

const QR_CODES_TABLE = 'qr_codes';
const QR_REDEMPTIONS_TABLE = 'qr_redemptions';

// ============================================================
// QR Codes - Public API
// ============================================================

/**
 * Crea un token QR para una orden
 * @param {string} orderId - ID de la orden
 * @param {string} purpose - Propósito del QR ('order_pickup' | 'ticket_entry')
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createQRToken(orderId, purpose = 'order_pickup') {
  // Generate unique token
  const token = crypto.randomUUID();
  
  // Set expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from(QR_CODES_TABLE)
    .insert({
      token,
      purpose,
      order_id: orderId,
      status: 'active',
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Obtiene el token QR de una orden
 * @param {string} orderId - ID de la orden
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getQRTokenByOrder(orderId) {
  const { data, error } = await supabase
    .from(QR_CODES_TABLE)
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Obtiene un QR token por su token string
 * @param {string} token - Token del QR
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getQRTokenByToken(token) {
  const { data, error } = await supabase
    .from(QR_CODES_TABLE)
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data, error: null };
}

// ============================================================
// QR Redemption - Admin API
// ============================================================

/**
 * Canjea un token QR (idempotente)
 * @param {string} token - Token del QR
 * @param {string} redeemedBy - ID del usuario que escanea
 * @param {string} deviceId - Identificador del dispositivo
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function redeemQRToken(token, redeemedBy, deviceId = null) {
  // Call the RPC function for idempotent redemption
  const { data, error } = await supabase.rpc('redeem_qr_token', {
    token_input: token,
    scanner_id: redeemedBy
  });

  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Obtiene el historial de canjes de un QR
 * @param {string} qrCodeId - ID del QR code
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getQRRedemptions(qrCodeId) {
  const { data, error } = await supabase
    .from(QR_REDEMPTIONS_TABLE)
    .select(`
      id, redeemed_at, redeemed_by, device_id, created_at,
      redeemer:auth.users(id, email)
    `)
    .eq('qr_code_id', qrCodeId)
    .order('redeemed_at', { ascending: false });

  if (error) return { data: null, error };
  return { data: data || [], error: null };
}

/**
 * Obtiene un QR con sus canjes
 * @param {string} qrCodeId - ID del QR code
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getQRWithRedemptions(qrCodeId) {
  const { data: qr, error: qrError } = await supabase
    .from(QR_CODES_TABLE)
    .select('*')
    .eq('id', qrCodeId)
    .maybeSingle();

  if (qrError || !qr) return { data: null, error: qrError };

  const { data: redemptions, error: redemptionsError } = await getQRRedemptions(qrCodeId);
  if (redemptionsError) return { data: null, error: redemptionsError };

  return { data: { ...qr, redemptions }, error: null };
}
