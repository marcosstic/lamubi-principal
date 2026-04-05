import { createQRToken, getQRTokenByOrder, redeemQRToken, getQRWithRedemptions } from '../supabase/qr.js';
import { getBuyerOrderWithItems } from '../supabase/orders.js';
import { getProfile, getAuthUser } from '../supabase/auth.js';

/**
 * Genera un QR para una orden aprobada
 * @param {string} orderId - ID de la orden
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function generateQRForOrder(orderId) {
  // Get current user
  const authUser = await getAuthUser();
  if (!authUser?.id) {
    return { data: null, error: { message: 'Usuario no autenticado' } };
  }

  // Get order details
  const { data: order, error: orderError } = await getBuyerOrderWithItems(
    authUser.id,
    orderId
  );
  
  if (orderError || !order) {
    return { data: null, error: orderError || { message: 'Orden no encontrada' } };
  }

  // Check if order is approved
  if (order.status !== 'approved') {
    return { data: null, error: { message: 'La orden no está aprobada' } };
  }

  // Get or create QR token
  let { data: qrToken } = await getQRTokenByOrder(orderId);
  
  if (!qrToken) {
    const { data: newToken, error: tokenError } = await createQRToken(orderId, 'order_pickup');
    if (tokenError) return { data: null, error: tokenError };
    qrToken = newToken;
  }

  // Get buyer profile
  const { data: profile } = await getProfile(order.buyer_id);

  return {
    data: {
      qrToken: qrToken.token,
      qrCodeId: qrToken.id,
      order: {
        id: order.id,
        status: order.status,
        total_usd: order.total_usd,
        created_at: order.created_at,
        items: order.order_items || [],
        payments: order.payments || []
      },
      buyer: {
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '—',
        phone: profile?.phone || authUser.user_metadata?.phone || '—',
        email: authUser.email || profile?.email || '—',
        edad: profile?.edad || authUser.user_metadata?.edad || '—',
        sexo: profile?.sexo || authUser.user_metadata?.sexo || '—'
      },
      expiresAt: qrToken.expires_at
    },
    error: null
  };
}

/**
 * Canjea una orden por order_id (simplificado)
 * @param {string} orderId - ID de la orden
 * @param {string} scannerId - ID del scanner/empleado
 * @param {string} deviceId - Identificador del dispositivo
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function redeemQR(orderId, scannerId, deviceId = null) {
  const { supabase } = await import('../supabase/client.js');
  const { getBuyerOrderWithItems } = await import('../supabase/orders.js');
  
  // Get order details
  const { data: order, error: orderError } = await getBuyerOrderWithItems(scannerId, orderId);
  
  if (orderError || !order) {
    return { data: null, error: { message: 'Orden no encontrada' } };
  }
  
  // Check if order is approved
  if (order.status !== 'approved') {
    return { data: null, error: { message: `Orden ${order.status === 'used' ? 'ya canjeada' : 'no aprobada'}` } };
  }
  
  // Update order status to 'used'
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'used', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  
  if (updateError) {
    return { data: null, error: updateError };
  }
  
  // Get buyer profile
  const { getProfile } = await import('../supabase/auth.js');
  const { data: profile } = await getProfile(order.buyer_id);
  
  return {
    data: {
      success: true,
      order: {
        id: order.id,
        status: 'used',
        total_usd: order.total_usd
      },
      buyer: {
        full_name: profile?.full_name || '—',
        email: profile?.email || '—'
      }
    },
    error: null
  };
}

/**
 * Obtiene el historial de un QR
 * @param {string} qrCodeId - ID del QR code
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getQRHistory(qrCodeId) {
  const { data, error } = await getQRWithRedemptions(qrCodeId);
  
  if (error) return { data: null, error };
  return { data, error: null };
}
