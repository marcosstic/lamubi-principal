import { requireAdminSession, toast } from '../shared/ui.js';
import { getAuthUser, getProfile, getSession } from '../supabase/auth.js';
import { getQRTokenByToken, redeemQRToken } from '../supabase/qr.js';
import { getOrderForScanner } from '../supabase/orders.js';

function qs(sel, root = document) { return root.querySelector(sel); }

async function hasAdminSession() {
  const session = await getSession();
  if (!session?.user?.id) return false;
  const { data: profile } = await getProfile(session.user.id);
  return !!profile && profile.role === 'admin';
}

function setStatus(kind, message) {
  const el = qs('[data-verify-status]');
  if (!el) return;
  el.style.color = kind === 'success' ? '#11bb75' : kind === 'warning' ? '#ff9800' : '#f44336';
  el.textContent = message;
}

function setDetails(text) {
  const el = qs('[data-verify-details]');
  if (!el) return;
  el.textContent = text || '';
}

async function main() {
  await requireAdminSession(hasAdminSession);

  const token = new URLSearchParams(window.location.search).get('token');
  const redeemBtn = qs('[data-verify-redeem]');
  if (redeemBtn) redeemBtn.disabled = true;

  if (!token) {
    setStatus('error', 'Falta el parámetro token.');
    setDetails('');
    return;
  }

  setStatus('warning', 'Cargando…');

  const { data: qrCode, error: qrErr } = await getQRTokenByToken(token);
  if (qrErr || !qrCode) {
    setStatus('error', 'QR inválido o no encontrado.');
    setDetails('');
    return;
  }

  const { data: order, error: orderErr } = await getOrderForScanner(qrCode.order_id);
  if (orderErr || !order) {
    setStatus('error', 'Orden no encontrada para este QR.');
    setDetails('');
    return;
  }

  setDetails(`Orden ${order.id?.slice(0, 8)}… · Estado: ${order.status}`);

  if (redeemBtn) {
    redeemBtn.disabled = order.status !== 'approved';
    redeemBtn.addEventListener('click', async () => {
      redeemBtn.disabled = true;
      const authUser = await getAuthUser();
      const { data, error } = await redeemQRToken(token, authUser.id, navigator.userAgent);
      if (error) {
        setStatus('error', error.message || 'No se pudo canjear.');
        toast(error.message || 'No se pudo canjear', 'warning');
        return;
      }
      if (data?.success) {
        setStatus('success', 'Canjeado exitosamente.');
        toast('QR canjeado', 'success');
      } else {
        setStatus('warning', data?.error || 'No se pudo canjear.');
        toast(data?.error || 'No se pudo canjear', 'warning');
      }
    }, { once: true });
  }

  if (order.status === 'approved') setStatus('success', 'Aprobado: listo para canjear.');
  else if (order.status === 'used') setStatus('warning', 'Este QR ya fue usado.');
  else if (order.status === 'rejected') setStatus('error', 'Orden rechazada.');
  else setStatus('warning', 'Orden pendiente / no aprobada.');
}

main();
