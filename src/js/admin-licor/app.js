console.log('admin-licor/app.js loaded');

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  if (document.getElementById('debug-console')) {
    document.getElementById('debug-console').textContent += `[ERROR] ${e.error?.message || e.message}\n`;
  }
});

import { bindNavActive, requireAdminSession, toast } from '../shared/ui.js';
import { getAuthUser, getProfile, getSession, signInWithPassword, signOut } from '../supabase/auth.js';
import { createProduct, deleteProduct, deriveSkuAndSlugFromName, getProductImagePublicUrl, listProductsAdmin, updateProduct, uploadProductImage } from '../supabase/products.js';
import { getCurrentExchangeRate, updateExchangeRate } from '../supabase/settings.js';
import { listAllOrders, updateOrderStatus, getOrderWithDetails } from '../supabase/orders.js';
import { listPendingPayments, updatePaymentStatus, getProofPublicUrl } from '../supabase/payments.js';
import { getActiveMesasMap, publishMesasMap, getMesasHistory, getMesasImagePublicUrl } from '../supabase/mesas.js';
import { redeemQR } from '../use-cases/qr.js';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

async function hasAdminSession() {
  const session = await getSession();
  if (!session?.user?.id) return false;
  const { data: profile } = await getProfile(session.user.id);
  return !!profile && profile.role === 'admin';
}

function initGuards() {
  qsa('[data-require-admin]').forEach(() => {
    (async () => {
      await requireAdminSession(hasAdminSession);
    })();
  });
}

async function initHeader() {
  bindNavActive();
  const userEl = qs('[data-admin-email]');
  const authUser = await getAuthUser();
  if (userEl) userEl.textContent = authUser?.email || '';
  const logout = qs('[data-admin-logout]');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      (async () => {
        await signOut();
        toast('Sesión cerrada', 'info');
        setTimeout(() => location.href = '/admin-licor/login.html', 250);
      })();
    });
  }
}

function initLogin() {
  const form = qs('[data-admin-login-form]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    (async () => {
      const email = qs('input[name="email"]', form).value.trim().toLowerCase();
      const password = qs('input[name="password"]', form).value;
      if (!email || !password) {
        toast('Completa email y contraseña', 'warning');
        return;
      }

      const { data, error } = await signInWithPassword(email, password);
      if (error) {
        toast(error.message || 'Error iniciando sesión', 'warning');
        return;
      }

      const authUser = data?.user || (await getAuthUser());
      if (!authUser) {
        toast('No se pudo obtener la sesión', 'warning');
        return;
      }

      const { data: profile } = await getProfile(authUser.id);
      if (!profile || profile.role !== 'admin') {
        await signOut();
        toast('No autorizado (requiere admin)', 'warning');
        return;
      }

      toast('Bienvenido', 'success');
      const next = new URLSearchParams(location.search).get('next');
      setTimeout(() => location.href = next || '/admin-licor/index.html', 300);
    })();
  });
}

async function initDashboard() {
  const root = qs('[data-admin-dashboard]');
  if (!root) return;
  if (!(await requireAdminSession(hasAdminSession))) return;

  const TZ_VE = 'America/Caracas';
  const fmtVe = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-VE', { timeZone: TZ_VE, dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

  // Load orders from Supabase
  const { data: orders, error } = await listAllOrders();
  if (error) {
    toast('No se pudieron cargar las órdenes', 'warning');
    return;
  }

  const pending = (orders || []).filter((o) => o.status === 'awaiting_verification').length;
  const approved = (orders || []).filter((o) => o.status === 'approved').length;
  const rejected = (orders || []).filter((o) => o.status === 'rejected').length;

  root.querySelector('[data-kpi-pending]')?.replaceChildren(document.createTextNode(String(pending)));
  root.querySelector('[data-kpi-approved]')?.replaceChildren(document.createTextNode(String(approved)));
  root.querySelector('[data-kpi-rejected]')?.replaceChildren(document.createTextNode(String(rejected)));

  const select = qs('[data-recent-status]', root);
  const list = qs('[data-recent-list]', root);
  if (!select || !list) return;

  async function renderRecent() {
    const status = select.value || 'all';
    const { data: filteredOrders } = await listAllOrders(status !== 'all' ? { status } : {});
    const items = (filteredOrders || []).slice(0, 8);

    if (!items.length) {
      list.innerHTML = `<div class="card card--soft"><p class="card__text">Sin órdenes para este filtro.</p></div>`;
      return;
    }

    list.innerHTML = items.map((o) => {
      const buyerId = o?.buyer_id || '—';
      const totalUsd = Number(o?.total_usd || 0).toFixed(2);
      const badge = `badge--${o.status}`;
      const statusLabel = o.status === 'awaiting_verification' ? 'Pendiente' : o.status === 'approved' ? 'Aprobada' : o.status === 'rejected' ? 'Rechazada' : o.status;
      return `<div class="card card--soft" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap"><div><div style="font-weight:900">${o.id.slice(0, 8)}...</div><div class="help">Buyer: ${buyerId.slice(0, 8)}...</div><div class="help">${fmtVe(o.created_at)} · $${totalUsd}</div></div><span class="badge ${badge}">${statusLabel}</span></div>`;
    }).join('');
  }

  select.addEventListener('change', renderRecent);
  await renderRecent();
}

async function initMesasUpload() {
  const root = qs('[data-admin-mesas]');
  if (!root) return;
  if (!(await requireAdminSession(hasAdminSession))) return;

  const authUser = await getAuthUser();
  const file = qs('input[type="file"]', root);
  const preview = qs('[data-mesas-preview]', root);
  const save = qs('[data-mesas-save]', root);
  const historyEl = qs('[data-mesas-history]', root);

  let selectedFile = null;

  file?.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f) return;
    selectedFile = f;
    // Show preview using FileReader
    const reader = new FileReader();
    reader.onload = () => {
      if (preview) preview.src = reader.result;
    };
    reader.readAsDataURL(f);
  });

  save?.addEventListener('click', async () => {
    if (!selectedFile) {
      toast('Selecciona una imagen primero', 'warning');
      return;
    }

    const { data, error } = await publishMesasMap(selectedFile, authUser?.id);
    if (error) {
      toast(error.message || 'No se pudo publicar el mapa', 'warning');
      return;
    }

    toast('Mesas publicadas', 'success');
    selectedFile = null;
    file.value = '';
    if (preview) preview.src = '';
    await renderHistory();
  });

  async function renderHistory() {
    if (!historyEl) return;
    const { data: history, error } = await getMesasHistory();
    if (error) {
      console.error('Error getting mesas history:', error);
      historyEl.innerHTML = `<div class="card card--soft"><p class="card__text">Error cargando historial.</p></div>`;
      return;
    }
    console.log('Mesas history:', history);
    if (!history.length) {
      historyEl.innerHTML = `<div class="card card--soft"><p class="card__text">Sin historial aún.</p></div>`;
      return;
    }
    historyEl.innerHTML = history.map((h) => {
      const imgUrl = h.images?.[0]?.storage_path ? getMesasImagePublicUrl(h.images[0].storage_path) : '';
      console.log('Map:', h.id, 'Images:', h.images, 'URL:', imgUrl);
      return `
        <div class="card card--soft" style="display:grid;gap:.75rem">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <div>
              <div style="font-weight:900">${new Date(h.created_at).toLocaleString('es-VE')}</div>
              <div class="help">${h.status === 'active' ? 'Activo' : 'Archivado'}</div>
            </div>
            ${imgUrl ? `<a class="btn btn--secondary" href="${imgUrl}" target="_blank" rel="noopener noreferrer">Abrir</a>` : '<span class="help">Sin imagen</span>'}
          </div>
          ${imgUrl ? `<div style="border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden;background:#000"><img src="${imgUrl}" alt="Mesas" style="width:100%;height:auto;display:block" /></div>` : ''}
        </div>
      `;
    }).join('');
  }

  await renderHistory();
}

async function initTasa() {
  const input = qs('[data-rate-input]');
  const save = qs('[data-rate-save]');
  const info = qs('[data-rate-info]');
  if (!input || !save) return;
  if (!(await requireAdminSession(hasAdminSession))) return;

  const authUser = await getAuthUser();

  // Load current rate from Supabase
  const { data: currentRate, error: rateErr, row: rateRow } = await getCurrentExchangeRate();
  if (rateErr) {
    toast('No se pudo cargar la tasa actual', 'warning');
  } else if (currentRate) {
    input.value = String(currentRate);
    if (info && rateRow) {
      info.textContent = `Última actualización: ${new Date(rateRow.created_at).toLocaleString('es-VE')}`;
    }
  } else {
    input.value = '600';
  }

  save.addEventListener('click', async () => {
    const res = await updateExchangeRate(input.value, authUser?.id);
    if (res.error) {
      toast(res.error.message || 'No se pudo guardar la tasa', 'warning');
      return;
    }
    toast('Tasa guardada en Supabase', 'success');
    if (info) {
      info.textContent = `Actualizada: ${new Date().toLocaleString('es-VE')}`;
    }
  });
}

let _editingProductId = null;

async function initLicores() {
  const tbody = qs('[data-licor-tbody]');
  if (!tbody) return;
  if (!(await requireAdminSession(hasAdminSession))) return;

  const btnNew = qs('[data-licor-new]');
  const formWrap = qs('[data-licor-form]');
  const form = qs('[data-licor-create-form]');
  const btnCancel = qs('[data-licor-cancel]');
  const formTitle = qs('[data-licor-form-title]');

  async function render() {
    const { data, error } = await listProductsAdmin();
    if (error) {
      toast(error.message || 'No se pudo cargar el catálogo', 'warning');
      return;
    }

    const rows = (data || []).filter((p) => p.product_type === 'liquor');
    tbody.innerHTML = rows.map((p) => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.6rem">
            ${p.image_path ? `<img alt="" src="${getProductImagePublicUrl(p.image_path) || ''}" style="width:34px;height:34px;object-fit:cover;border-radius:8px" />` : ''}
            <div>
              <div style="font-weight:600">${p.name}</div>
              <div class="help" style="margin:0">${p.sku || ''}</div>
            </div>
          </div>
        </td>
        <td>${Number(p.sort_order || 0)}</td>
        <td>$${Number(p.price_usd || 0).toFixed(2)}</td>
        <td><span class="badge badge--${p.active ? 'approved' : 'rejected'}">${p.active ? 'Sí' : 'No'}</span></td>
        <td>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn btn--secondary" type="button" data-licor-action="toggle-active" data-licor-id="${p.id}" data-licor-active="${p.active ? '1' : '0'}">${p.active ? 'Desactivar' : 'Activar'}</button>
            <button class="btn btn--secondary" type="button" data-licor-action="edit" data-licor-id="${p.id}">Editar</button>
            <button class="btn btn--secondary" type="button" data-licor-action="delete" data-licor-id="${p.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  btnNew?.addEventListener('click', () => {
    _editingProductId = null;
    if (formWrap) formWrap.style.display = 'block';
    if (formTitle) formTitle.textContent = 'Crear licor';
    form?.reset();
  });

  btnCancel?.addEventListener('click', () => {
    _editingProductId = null;
    if (formWrap) formWrap.style.display = 'none';
  });

  tbody.addEventListener('click', async (e) => {
    const toggleBtn = e.target?.closest?.('[data-licor-action="toggle-active"]');
    if (toggleBtn) {
      const id = toggleBtn.getAttribute('data-licor-id') || '';
      const isActive = toggleBtn.getAttribute('data-licor-active') === '1';
      if (!id) return;
      const nextActive = !isActive;
      const res = await updateProduct(id, { active: nextActive });
      if (res.error) {
        toast(res.error.message || 'No se pudo actualizar', 'warning');
        return;
      }
      toast('Actualizado', 'success');
      await render();
      return;
    }

    const editBtn = e.target?.closest?.('[data-licor-action="edit"]');
    if (editBtn) {
      const id = editBtn.getAttribute('data-licor-id') || '';
      if (!id) return;
      openEditForm(id);
      return;
    }

    const deleteBtn = e.target?.closest?.('[data-licor-action="delete"]');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-licor-id') || '';
      if (!id) return;
      if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
      const res = await deleteProduct(id);
      if (res.error) {
        toast(res.error.message || 'No se pudo eliminar', 'warning');
        return;
      }
      toast('Producto eliminado', 'success');
      await render();
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = qs('input[name="name"]', form).value.trim();
    const desc = qs('input[name="desc"]', form).value.trim();
    const priceUsd = Number(qs('input[name="priceUsd"]', form).value);
    const sortOrder = Number(qs('input[name="sortOrder"]', form)?.value || 0);
    const file = qs('input[name="img"]', form).files?.[0] || null;

    if (!name || !desc || !Number.isFinite(priceUsd) || !Number.isFinite(sortOrder)) {
      toast('Completa nombre, descripción y precio', 'warning');
      return;
    }

    let image_path = null;
    if (file) {
      const derived = deriveSkuAndSlugFromName(name);
      const up = await uploadProductImage(file, { sku: derived.sku });
      if (up.error) {
        toast(up.error.message || 'No se pudo subir la imagen', 'warning');
        return;
      }
      image_path = up.data.path;
    }

    let res;
    if (_editingProductId) {
      // Update existing product
      const patch = { name, description: desc, price_usd: priceUsd, sort_order: sortOrder };
      if (image_path) patch.image_path = image_path;
      res = await updateProduct(_editingProductId, patch);
    } else {
      // Create new product
      const derived = deriveSkuAndSlugFromName(name);
      res = await createProduct({
        sku: derived.sku,
        slug: derived.slug,
        product_type: 'liquor',
        name,
        description: desc,
        price_usd: priceUsd,
        active: true,
        sort_order: sortOrder,
        image_path
      });
    }

    if (res.error) {
      toast(res.error.message || 'No se pudo guardar el licor', 'warning');
      return;
    }

    toast(_editingProductId ? 'Producto actualizado' : 'Licor guardado', 'success');
    _editingProductId = null;
    if (formWrap) formWrap.style.display = 'none';
    await render();
  });

  await render();
}

async function openEditForm(id) {
  const formWrap = qs('[data-licor-form]');
  const form = qs('[data-licor-create-form]');
  const formTitle = qs('[data-licor-form-title]');
  if (!formWrap || !form) return;

  // Get product data
  const { data, error } = await listProductsAdmin();
  if (error) {
    toast('No se pudo cargar el producto', 'warning');
    return;
  }

  const product = (data || []).find((p) => p.id === id);
  if (!product) {
    toast('Producto no encontrado', 'warning');
    return;
  }

  _editingProductId = id;
  formWrap.style.display = 'block';
  if (formTitle) formTitle.textContent = 'Editar licor';

  // Pre-fill form
  qs('input[name="name"]', form).value = product.name || '';
  qs('input[name="desc"]', form).value = product.description || '';
  qs('input[name="priceUsd"]', form).value = Number(product.price_usd || 0);
  qs('input[name="sortOrder"]', form).value = Number(product.sort_order || 0);
}

async function initCompradores() {
  const app = qs('[data-buyers-app]');
  if (!app) return;
  if (!(await requireAdminSession(hasAdminSession))) return;

  const TZ_VE = 'America/Caracas';
  const fmtVe = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-VE', { timeZone: TZ_VE, dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

  // Load orders from Supabase
  const { data: orders, error } = await listAllOrders();
  if (error) {
    toast('No se pudieron cargar las órdenes', 'warning');
    return;
  }

  const statusFilter = (new URLSearchParams(location.search).get('status') || 'all').trim().toLowerCase();
  const filteredOrders = statusFilter === 'all' ? (orders || []) : (orders || []).filter((o) => String(o?.status || '').toLowerCase() === statusFilter);

  // Group by buyer_id and aggregate
  const map = new Map();
  for (const o of filteredOrders) {
    const buyerId = o?.buyer_id;
    if (!buyerId) continue;
    const prev = map.get(buyerId) || { buyerId, compras: 0, totalUsd: 0, ultimaAt: null };
    const createdAt = o?.created_at || null;
    const hasNewer = createdAt && (!prev.ultimaAt || new Date(createdAt) > new Date(prev.ultimaAt));
    map.set(buyerId, {
      ...prev,
      compras: prev.compras + 1,
      totalUsd: prev.totalUsd + Number(o?.total_usd || 0),
      ultimaAt: hasNewer ? createdAt : prev.ultimaAt
    });
  }

  const params = new URLSearchParams(location.search);
  const sortKey = (params.get('sort') || 'ultimaAt').trim();
  const sortDir = (params.get('dir') || 'desc').trim().toLowerCase();

  const buyers = Array.from(map.values()).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'compras') return ((a.compras || 0) - (b.compras || 0)) * dir;
    if (sortKey === 'totalUsd') return ((a.totalUsd || 0) - (b.totalUsd || 0)) * dir;
    const at = (x) => (x.ultimaAt ? new Date(x.ultimaAt).getTime() : 0);
    return (at(a) - at(b)) * dir;
  });

  const q = (params.get('q') || '').trim().toLowerCase();
  const pageSize = Math.max(1, Math.min(50, Number(params.get('pageSize') || 10) || 10));
  const page = Math.max(1, Number(params.get('page') || 1) || 1);
  const filtered = buyers; // Filter by search would need profile data
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  if (!filtered.length) {
    app.innerHTML = `<div class="card card--soft"><h3 class="card__title">Sin compradores todavía</h3><p class="card__text">Aún no hay órdenes registradas.</p></div>`;
    return;
  }

  app.innerHTML = `
    <div class="card card--soft">
      <h3 class="card__title">Compradores (${filtered.length})</h3>
      <div class="help">Página ${safePage}/${totalPages} · Filas: ${pageSize}</div>
      <div style="display:grid;gap:.5rem;margin-top:.6rem">
        ${paged.map((b) => {
          const fecha = b.ultimaAt ? fmtVe(b.ultimaAt) : '—';
          return `<div class="help"><strong>${b.buyerId.slice(0, 8)}...</strong> — ${b.compras} compras — $${b.totalUsd.toFixed(2)} — Última: ${fecha} <button class="btn btn--secondary" type="button" data-buyer-detail="${b.buyerId}">Detalle</button><div data-buyer-detail-panel="${b.buyerId}" style="display:none;margin-top:.5rem"></div></div>`;
        }).join('')}
      </div>
    </div>
  `;

  app.addEventListener('click', async (e) => {
    const b = e.target && e.target.closest ? e.target.closest('[data-buyer-detail]') : null;
    if (!b) return;
    const buyerId = (b.getAttribute('data-buyer-detail') || '').trim();
    const panel = buyerId ? app.querySelector(`[data-buyer-detail-panel="${buyerId}"]`) : null;
    if (!panel) return;
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'block' : 'none';
    b.textContent = open ? 'Ocultar' : 'Detalle';
    if (!open || panel.getAttribute('data-loaded') === '1') return;

    // Load buyer orders from Supabase
    const { data: buyerOrders } = await listAllOrders();
    const buyerOrderList = (buyerOrders || []).filter((o) => o.buyer_id === buyerId).sort((a, c) => new Date(c.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    panel.innerHTML = '';
    if (!buyerOrderList.length) { panel.innerHTML = '<div class="help">Sin órdenes para este comprador.</div>'; panel.setAttribute('data-loaded', '1'); return; }
    buyerOrderList.forEach((o) => {
      const row = document.createElement('div');
      row.className = 'card card--soft';
      row.style.marginTop = '.5rem';
      const statusLabel = o.status === 'awaiting_verification' ? 'Pendiente' : o.status === 'approved' ? 'Aprobada' : o.status === 'rejected' ? 'Rechazada' : o.status;
      row.innerHTML = `<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap"><div><div style="font-weight:900">${o.id.slice(0, 8)}... <span class="badge badge--${o.status}">${statusLabel}</span></div><div class="help">${fmtVe(o.created_at)} · $${Number(o?.total_usd || 0).toFixed(2)}</div></div></div>`;
      panel.appendChild(row);
    });
    panel.setAttribute('data-loaded', '1');
  });
}

async function initVerificaciones() {
  const root = qs('[data-admin-verificaciones]');
  if (!root) return;
  if (!(await requireAdminSession(hasAdminSession))) return;

  const list = qs('[data-verif-list]', root);
  const detail = qs('[data-verif-detail]', root);
  const authUser = await getAuthUser();

  async function render() {
    const { data: payments, error } = await listPendingPayments();
    const pending = (payments || []).filter((p) => p.status === 'submitted');

    if (!pending.length) {
      list.innerHTML = `<div class="card card--soft"><h3 class="card__title">Sin pendientes</h3><p class="card__text">No hay pagos por verificar.</p></div>`;
      detail.innerHTML = `<div class="card card--soft"><p class="card__text">Selecciona un pago para ver detalles.</p></div>`;
      return;
    }

    list.innerHTML = pending.map((p) => {
      const methodLabel = p.method === 'zelle' ? 'Zelle' : 'Pago Móvil';
      const amountLabel = p.amount_usd ? `$${Number(p.amount_usd).toFixed(2)}` : '';
      return `
        <button type="button" class="card card--soft" data-open="${p.id}" style="text-align:left;cursor:pointer;width:100%">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <div>
              <div style="font-weight:900">${p.id.slice(0, 8)}...</div>
              <div class="help">${methodLabel} · ${amountLabel}</div>
            </div>
            <span class="badge badge--pending">Pendiente</span>
          </div>
        </button>
      `;
    }).join('');

    qsa('[data-open]', list).forEach((b) => {
      b.addEventListener('click', () => openDetail(b.getAttribute('data-open')));
    });

    openDetail(pending[0].id);
  }

  async function openDetail(paymentId) {
    const { data: payments } = await listPendingPayments();
    const p = (payments || []).find((x) => x.id === paymentId);
    if (!p) return;

    const proofUrl = p.proofs?.[0]?.storage_path ? getProofPublicUrl(p.proofs[0].storage_path) : null;
    const methodLabel = p.method === 'zelle' ? 'Zelle' : 'Pago Móvil';

    detail.innerHTML = `
      <div class="card card--soft" style="display:grid;gap:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div>
            <h3 class="card__title" style="margin:0">Pago ${p.id.slice(0, 8)}...</h3>
            <p class="help" style="margin:.25rem 0 0">Orden: ${p.order_id?.slice(0, 8) || '—'}...</p>
          </div>
          <span class="badge badge--pending">Pendiente</span>
        </div>
        <div class="grid grid--2">
          <div class="card card--soft"><div class="label">Método</div><div style="font-weight:600">${methodLabel}</div></div>
          <div class="card card--soft"><div class="label">Monto USD</div><div style="font-weight:900;font-size:1.2rem">$${Number(p.amount_usd || 0).toFixed(2)}</div></div>
        </div>
        ${proofUrl ? `
          <div>
            <div class="label" style="margin-bottom:.5rem">Comprobante</div>
            <div style="border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden">
              <img src="${proofUrl}" alt="Comprobante" style="width:100%;height:auto;display:block" />
            </div>
          </div>
        ` : '<div class="help">Sin comprobante adjunto</div>'}
        <div class="field">
          <div class="label">Motivo de rechazo (si aplica)</div>
          <input class="input" type="text" name="reason" placeholder="Ej: comprobante ilegible" />
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn--primary" type="button" data-approve> Aprobar </button>
          <button class="btn btn--secondary" type="button" data-reject> Rechazar </button>
        </div>
      </div>
    `;

    qs('[data-approve]', detail)?.addEventListener('click', async () => {
      // Update payment status
      const res = await updatePaymentStatus(paymentId, 'approved', authUser?.id);
      if (res.error) {
        toast(res.error.message || 'No se pudo aprobar el pago', 'warning');
        return;
      }
      // Update order status
      await updateOrderStatus(p.order_id, 'approved');
      toast('Pago aprobado', 'success');
      await render();
    });

    qs('[data-reject]', detail)?.addEventListener('click', async () => {
      const reason = qs('input[name="reason"]', detail).value.trim();
      if (!reason) {
        toast('Ingresa un motivo de rechazo', 'warning');
        return;
      }
      // Update payment status
      const res = await updatePaymentStatus(paymentId, 'rejected', authUser?.id);
      if (res.error) {
        toast(res.error.message || 'No se pudo rechazar el pago', 'warning');
        return;
      }
      // Update order status
      const orderRes = await updateOrderStatus(p.order_id, 'rejected');
      if (orderRes.error) {
        toast(orderRes.error.message || 'No se pudo actualizar la orden', 'warning');
        return;
      }
      toast('Pago rechazado', 'info');
      await render();
    });
  }

  await render();
}

async function initScanner() {
  console.log('initScanner called');
  const readerEl = document.getElementById('qr-reader');
  const resultContainer = document.getElementById('result-container');
  const historyContainer = document.getElementById('scan-history');
  const toggleBtn = document.getElementById('btn-toggle-scan');
  const debugConsole = document.getElementById('debug-console');
  const clearDebugBtn = document.getElementById('clear-debug');
  
  if (!readerEl) {
    console.error('qr-reader element not found');
    debug('ERROR: qr-reader element not found');
    return;
  }
  if (!toggleBtn) {
    console.error('btn-toggle-scan element not found');
    debug('ERROR: btn-toggle-scan element not found');
    return;
  }
  
  debug('initScanner started');
  if (!(await requireAdminSession(hasAdminSession))) return;

  const authUser = await getAuthUser();
  const scanHistory = [];
  let html5QrCode = null;
  let isScanning = false;
  let lastScanTime = 0;
  const SCAN_COOLDOWN = 3000; // 3 seconds cooldown
  
  // iOS-specific configuration
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  debug(`Platform detected: iOS=${isIOS}, Android=${isAndroid}`);
  
  // Business rule: HTTPS verification for camera access
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    debug('WARNING: Not using HTTPS. Camera may not work on iOS.');
    toast('⚠️ Para mejor compatibilidad, usa HTTPS', 'warning');
  }

  // Camera management
  let currentCameraId = null;
  let availableCameras = [];
  
  // Function to get available cameras
  async function getAvailableCameras() {
    try {
      // Request permission first if needed
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      debug(`Found ${videoDevices.length} camera(s):`, videoDevices.map(d => ({ id: d.deviceId, label: d.label })));
      return videoDevices;
    } catch (err) {
      debug('Error getting cameras:', err.message);
      return [];
    }
  }
  
  // Function to switch camera
  async function switchCamera() {
    if (!html5QrCode || availableCameras.length <= 1) {
      debug('Cannot switch camera: not enough cameras or scanner not ready');
      return;
    }
    
    // Find current camera index
    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    
    debug(`Switching from camera ${currentIndex} to ${nextIndex}:`, nextCamera.deviceId);
    
    try {
      // Stop current scanner
      await html5QrCode.pause();
      
      // Start with new camera
      const cameraConfig = {
        facingMode: nextCamera.deviceId ? { exact: nextCamera.deviceId } : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      
      const config = {
        fps: isIOS ? 15 : 10,
        qrbox: { width: 250, height: 250 },
        ...(isIOS ? {} : { aspectRatio: 1.0 }),
        disableFlip: false
      };
      
      await html5QrCode.start(cameraConfig, config, onScanSuccess, (errorMessage) => {
        if (!errorMessage.includes('No MultiFormat Readers')) {
          debug('Scan error: ' + errorMessage);
        }
      });
      
      currentCameraId = nextCamera.deviceId;
      debug('Camera switched successfully');
      
    } catch (err) {
      debug('Error switching camera:', err.message);
      toast('No se pudo cambiar de cámara: ' + err.message, 'warning');
      
      // Restart with original camera
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          (errorMessage) => {
            if (!errorMessage.includes('No MultiFormat Readers')) {
              debug('Scan error: ' + errorMessage);
            }
          }
        );
      } catch (e) {
        debug('Failed to restore original camera:', e.message);
      }
    }
  }

  // Debug function
  function debug(message) {
    if (debugConsole) {
      const timestamp = new Date().toLocaleTimeString();
      debugConsole.textContent += `[${timestamp}] ${message}\n`;
      debugConsole.scrollTop = debugConsole.scrollHeight;
    }
    console.log(message);
  }

  // Clear debug
  if (clearDebugBtn) {
    clearDebugBtn.addEventListener('click', () => {
      if (debugConsole) debugConsole.textContent = '';
    });
  }

  debug('Scanner initialized');
  debug('Auth user:', authUser?.email);

  function showResult(success, message, data = null) {
    if (!resultContainer) return;
    const icon = success ? '✅' : '❌';
    let details = '';
    if (data?.buyer) {
      details = `
        <div class="details">
          <div><strong>Comprador:</strong> ${data.buyer?.full_name || '—'}</div>
          <div><strong>Orden:</strong> ${data.order?.id?.slice(0, 8) || '—'}...</div>
          <div><strong>Total:</strong> $${Number(data.order?.total_usd || 0).toFixed(2)}</div>
        </div>
      `;
    }
    resultContainer.innerHTML = `
      <div class="result-card ${success ? 'success' : 'error'}">
        <div class="icon">${icon}</div>
        <div class="message">${message}</div>
        ${details}
      </div>
    `;
  }

  function addToHistory(orderId, success, message) {
    scanHistory.unshift({
      orderId: orderId.slice(0, 8) + '...',
      success,
      message,
      time: new Date().toLocaleString('es-VE')
    });
    if (scanHistory.length > 10) scanHistory.pop();
    if (!historyContainer) return;
    historyContainer.innerHTML = scanHistory.map((h) => `
      <div class="history-item">
        <div>
          <div style="font-weight:600">${h.orderId}</div>
          <div class="time">${h.time}</div>
        </div>
        <span class="${h.success ? 'badge-valid' : 'badge-invalid'}">${h.success ? 'Válido' : 'Inválido'}</span>
      </div>
    `).join('');
  }

  async function onScanSuccess(decodedText) {
    debug('QR scanned: ' + decodedText);
    
    if (!authUser?.id) {
      debug('No auth user');
      return;
    }
    
    // Cooldown check
    const now = Date.now();
    if (now - lastScanTime < SCAN_COOLDOWN) {
      debug('Cooldown active, skipping');
      return;
    }
    lastScanTime = now;

    // Pause scanning
    if (html5QrCode && isScanning) {
      await html5QrCode.pause();
      isScanning = false;
      toggleBtn.textContent = '📷 Reanudar Scanner';
      toggleBtn.className = 'btn-scan start';
      debug('Scanner paused');
    }

    try {
      debug('Calling redeemQR...');
      const { data, error } = await redeemQR(decodedText, authUser.id, navigator.userAgent);
      debug('Response: ' + JSON.stringify({ data, error }));
      
      if (data?.success) {
        showResult(true, '✅ QR Válido - Orden canjeada', data);
        addToHistory(decodedText, true, 'Canjeado');
        toast('QR canjeado exitosamente', 'success');
        debug('QR redeemed successfully');
      } else {
        const errorMsg = data?.error || 'QR Inválido';
        showResult(false, '❌ ' + errorMsg);
        addToHistory(decodedText, false, errorMsg);
        toast(errorMsg, 'warning');
        debug('QR invalid: ' + errorMsg);
      }
    } catch (err) {
      debug('Exception: ' + err.message);
      showResult(false, '❌ Error al procesar QR');
      addToHistory(decodedText, false, 'Error');
      toast('Error al procesar QR', 'error');
    }

    // Resume scanning after 3 seconds
    setTimeout(async () => {
      if (html5QrCode && !isScanning) {
        try {
          await html5QrCode.resume();
          isScanning = true;
          toggleBtn.textContent = '⏸ Pausar Scanner';
          toggleBtn.className = 'btn-scan stop';
          debug('Scanner resumed');
        } catch (e) {
          debug('Resume error: ' + e.message);
        }
      }
    }, 3000);
  }

  // Toggle scan button
  toggleBtn.addEventListener('click', async () => {
    debug('Toggle button clicked. isScanning: ' + isScanning);
    if (isScanning) {
      // Stop scanning
      if (html5QrCode) {
        await html5QrCode.pause();
        isScanning = false;
      }
      toggleBtn.textContent = '📷 Iniciar Scanner';
      toggleBtn.className = 'btn-scan start';
      readerEl.classList.add('hidden');
      debug('Scanner stopped');
    } else {
      // Start scanning
      debug('Starting scanner...');
      readerEl.classList.remove('hidden');
      toggleBtn.textContent = '⏳ Iniciando...';
      toggleBtn.disabled = true;
      
      // iOS-specific: Check camera permissions before starting
      if (isIOS) {
        debug('iOS detected, checking camera permissions');
        try {
          const permission = await navigator.permissions.query({ name: 'camera' });
          debug('Camera permission status:', permission.state);
          if (permission.state === 'denied') {
            throw new Error('Cámara denegada. Ve a Configuración > Safari > Cámara y activa los permisos.');
          }
        } catch (permError) {
          debug('Permission check error (non-critical):', permError.message);
          // Continue anyway - the start() will handle permissions
        }
      }

      try {
        if (!html5QrCode) {
          debug('Creating Html5Qrcode instance');
          html5QrCode = new Html5Qrcode('qr-reader');
          
          // iOS CRITICAL FIX: Add required video attributes after Html5Qrcode creates the video element
          if (isIOS) {
            setTimeout(() => {
              const videoElement = document.querySelector('#qr-reader video');
              if (videoElement) {
                debug('Applying iOS required video attributes');
                videoElement.setAttribute('playsinline', '');
                videoElement.setAttribute('muted', '');
                videoElement.setAttribute('autoplay', '');
                debug('iOS video attributes set: playsinline, muted, autoplay');
              } else {
                debug('WARNING: iOS video element not found after Html5Qrcode creation');
              }
            }, 100);
          }
        }

        // iOS-specific camera configuration
        const cameraConfig = {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
        
        // iOS-specific scanner configuration
        const config = {
          fps: isIOS ? 15 : 10, // Higher FPS for iOS
          qrbox: { width: 250, height: 250 },
          // iOS workaround: Don't set aspectRatio to avoid detection issues
          ...(isIOS ? {} : { aspectRatio: 1.0 }),
          disableFlip: false
        };

        debug('Starting camera with config: ' + JSON.stringify(config));
        debug('Camera config: ' + JSON.stringify(cameraConfig));
        
        await html5QrCode.start(
          cameraConfig,
          config,
          onScanSuccess,
          (errorMessage) => {
            // Ignore parse errors but log for debugging
            if (!errorMessage.includes('No MultiFormat Readers')) {
              debug('Scan error: ' + errorMessage);
            }
          }
        );

        debug('Scanner started successfully');
        isScanning = true;
        toggleBtn.textContent = '⏸ Pausar Scanner';
        toggleBtn.className = 'btn-scan stop';
      } catch (err) {
        debug('Error starting scanner: ' + err.message);
        debug('Error details:', err);
        
        // iOS-specific error handling
        if (isIOS) {
          if (err.message.includes('NotAllowedError') || err.message.includes('Permission denied')) {
            toast('❌ Permiso de cámara denegado. Ve a Configuración > Safari > Cámara', 'error');
          } else if (err.message.includes('NotFoundError') || err.message.includes('DevicesNotFoundError')) {
            toast('❌ No se encontró cámara. Verifica que tu dispositivo tenga cámara', 'error');
          } else if (err.message.includes('HTTPS') || err.message.includes('secure origin')) {
            toast('⚠️ La cámara requiere HTTPS en iOS', 'warning');
          } else if (err.message.includes('OverconstrainedError') || err.message.includes('ConstraintNotSatisfiedError')) {
            toast('⚠️ Configuración de cámara no compatible. Intenta cambiar de cámara', 'warning');
          } else {
            toast('No se pudo iniciar la cámara en iOS: ' + err.message, 'warning');
          }
        } else {
          toast('No se pudo iniciar la cámara: ' + err.message, 'warning');
        }
        
        toggleBtn.textContent = '📷 Iniciar Scanner';
        toggleBtn.className = 'btn-scan start';
        readerEl.classList.add('hidden');
      } finally {
        toggleBtn.disabled = false;
      }
    }
  });
  
  // Camera switch button
  const switchCameraBtn = document.getElementById('btn-switch-camera');
  if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', async () => {
      debug('Switch camera button clicked');
      await switchCamera();
    });
  }
  
  // Initialize cameras after scanner starts
  setTimeout(async () => {
    availableCameras = await getAvailableCameras();
    if (switchCameraBtn) {
      switchCameraBtn.style.display = availableCameras.length > 1 ? 'inline-block' : 'none';
    }
    debug(`Camera switch button ${availableCameras.length > 1 ? 'shown' : 'hidden'}`);
  }, 1000);
}

initHeader();
initGuards();
initLogin();
initDashboard();
initTasa();
initLicores();
initMesasUpload();
initVerificaciones();
initCompradores();
try {
  initScanner();
  console.log('initScanner called at end of file');
} catch (err) {
  console.error('Error in initScanner:', err);
  if (document.getElementById('debug-console')) {
    document.getElementById('debug-console').textContent += `[FATAL] ${err.message}\n${err.stack}\n`;
  }
}
