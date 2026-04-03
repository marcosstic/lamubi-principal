import { clearAdminSession, getAdminSession, getCroquisHistory, setAdminSession, setCroquisCurrent, getOrders, updateOrderStatus, getMockRate, setMockRate, getMockCatalog, addCatalogItem } from '../shared/store.js';
import { bindNavActive, requireAdminSession, toast } from '../shared/ui.js';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function initGuards() {
  qsa('[data-require-admin]').forEach(() => requireAdminSession(getAdminSession));
}

function initHeader() {
  bindNavActive();
  const user = getAdminSession();
  const userEl = qs('[data-admin-email]');
  if (userEl) userEl.textContent = user?.email || '';
  const logout = qs('[data-admin-logout]');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      clearAdminSession();
      toast('Sesión cerrada', 'info');
      setTimeout(() => location.href = '/admin-licor/login.html', 250);
    });
  }
}

function initLogin() {
  const form = qs('[data-admin-login-form]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = qs('input[name="email"]', form).value.trim().toLowerCase();
    const password = qs('input[name="password"]', form).value;
    if (!email || !password) {
      toast('Completa email y contraseña', 'warning');
      return;
    }
    setAdminSession({ email });
    toast('Bienvenido', 'success');
    const next = new URLSearchParams(location.search).get('next');
    setTimeout(() => location.href = next || '/admin-licor/index.html', 300);
  });
}

function initDashboard() {
  const root = qs('[data-admin-dashboard]');
  if (!root) return;
  if (!requireAdminSession(getAdminSession)) return;

  const orders = getOrders();
  const pending = orders.filter((o) => o.status === 'pending').length;
  const approved = orders.filter((o) => o.status === 'approved').length;
  const rejected = orders.filter((o) => o.status === 'rejected').length;

  root.querySelector('[data-kpi-pending]')?.replaceChildren(document.createTextNode(String(pending)));
  root.querySelector('[data-kpi-approved]')?.replaceChildren(document.createTextNode(String(approved)));
  root.querySelector('[data-kpi-rejected]')?.replaceChildren(document.createTextNode(String(rejected)));

  const select = qs('[data-recent-status]', root);
  const list = qs('[data-recent-list]', root);
  if (!select || !list) return;

  const TZ_VE = 'America/Caracas';
  const fmtVe = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-VE', { timeZone: TZ_VE, dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

  function renderRecent() {
    const status = select.value || 'all';
    const all = getOrders().slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const filtered = status === 'all' ? all : all.filter((o) => o.status === status);
    const items = filtered.slice(0, 8);

    if (!items.length) {
      list.innerHTML = `<div class="card card--soft"><p class="card__text">Sin órdenes para este filtro.</p></div>`;
      return;
    }

    list.innerHTML = items.map((o) => {
      const email = o?.buyer?.email || o?.userEmail || '—';
      const qr = o?.qrToken ? `LICOR:${o.qrToken}` : '—';
      const totalUsd = Number(o?.totals?.totalUsd || 0).toFixed(2);
      const badge = `badge--${o.status}`;
      return `<div class="card card--soft" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap"><div><div style="font-weight:900">${o.id}</div><div class="help">${email}</div><div class="help">${fmtVe(o.createdAt)} · $${totalUsd}</div><div class="help">QR: <strong>${qr}</strong></div></div><span class="badge ${badge}">${o.status}</span></div>`;
    }).join('');
  }

  select.addEventListener('change', renderRecent);
  renderRecent();
}

function initCroquisUpload() {
  const root = qs('[data-admin-croquis]');
  if (!root) return;
  if (!requireAdminSession(getAdminSession)) return;

  const file = qs('input[type="file"]', root);
  const preview = qs('[data-croquis-preview]', root);
  const save = qs('[data-croquis-save]', root);
  const historyEl = qs('[data-croquis-history]', root);

  let dataUrl = null;

  file?.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      dataUrl = String(reader.result || '');
      if (preview) preview.src = dataUrl;
    };
    reader.readAsDataURL(f);
  });

  save?.addEventListener('click', () => {
    if (!dataUrl) {
      toast('Selecciona una imagen primero', 'warning');
      return;
    }
    setCroquisCurrent(dataUrl);
    toast('Croquis publicado', 'success');
    renderHistory();
  });

  function renderHistory() {
    if (!historyEl) return;
    const history = getCroquisHistory();
    if (!history.length) {
      historyEl.innerHTML = `<div class="card card--soft"><p class="card__text">Sin historial aún.</p></div>`;
      return;
    }
    historyEl.innerHTML = history.map((h) => `
      <div class="card card--soft" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div>
          <div style="font-weight:900">${new Date(h.updatedAt).toLocaleString()}</div>
          <div class="help">Versión publicada</div>
        </div>
        <a class="btn btn--secondary" href="${h.dataUrl}" target="_blank" rel="noopener noreferrer">Abrir</a>
      </div>
    `).join('');
  }

  renderHistory();
}

function initTasa() {
  const root = qs('[data-require-admin]');
  const input = qs('[data-rate-input]');
  const save = qs('[data-rate-save]');
  if (!input || !save) return;
  if (!requireAdminSession(getAdminSession)) return;

  input.value = String(getMockRate());

  save.addEventListener('click', () => {
    const ok = setMockRate(input.value);
    if (!ok) {
      toast('Ingresa una tasa válida', 'warning');
      return;
    }
    toast('Tasa guardada', 'success');
  });
}

function initLicores() {
  const tbody = qs('[data-licor-tbody]');
  if (!tbody) return;
  if (!requireAdminSession(getAdminSession)) return;

  const btnNew = qs('[data-licor-new]');
  const formWrap = qs('[data-licor-form]');
  const form = qs('[data-licor-create-form]');
  const btnCancel = qs('[data-licor-cancel]');

  function render() {
    const catalog = getMockCatalog();
    tbody.innerHTML = catalog.map((p) => `
      <tr>
        <td>${p.name}</td>
        <td>$${Number(p.priceUsd || 0).toFixed(2)}</td>
        <td><span class="badge badge--approved">Sí</span></td>
        <td><button class="btn btn--secondary" type="button" disabled>Editar</button></td>
      </tr>
    `).join('');
  }

  btnNew?.addEventListener('click', () => {
    if (formWrap) formWrap.style.display = 'block';
    form?.reset();
  });

  btnCancel?.addEventListener('click', () => {
    if (formWrap) formWrap.style.display = 'none';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = qs('input[name="name"]', form).value.trim();
    const desc = qs('input[name="desc"]', form).value.trim();
    const priceUsd = Number(qs('input[name="priceUsd"]', form).value);
    const file = qs('input[name="img"]', form).files?.[0] || null;

    if (!name || !desc || !Number.isFinite(priceUsd)) {
      toast('Completa nombre, descripción y precio', 'warning');
      return;
    }

    let img = '/mubito.jpg';
    if (file) {
      img = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || '/mubito.jpg'));
        r.onerror = () => resolve('/mubito.jpg');
        r.readAsDataURL(file);
      });
    }

    const sku = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32) || `sku-${Date.now()}`;
    addCatalogItem({ sku, name, desc, priceUsd, img });
    toast('Licor guardado', 'success');
    if (formWrap) formWrap.style.display = 'none';
    render();
  });

  render();
}

function initCompradores() {
  const app = qs('[data-buyers-app]');
  if (!app) return;
  if (!requireAdminSession(getAdminSession)) return;

  const TZ_VE = 'America/Caracas';
  const fmtVe = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-VE', { timeZone: TZ_VE, dateStyle: 'short', timeStyle: 'short' }).format(d);
  };
  const norm = (s) => String(s || '').trim().toLowerCase();

  const rawOrders = getOrders();
  const statusFilter = (new URLSearchParams(location.search).get('status') || 'all').trim().toLowerCase();
  const orders = statusFilter === 'all' ? rawOrders : rawOrders.filter((o) => String(o?.status || '').toLowerCase() === statusFilter);
  const map = new Map();
  for (const o of orders) {
    const email = norm(o?.buyer?.email || o?.userEmail);
    if (!email) continue;
    const prev = map.get(email) || { email, nombre: '', telefono: '', compras: 0, totalUsd: 0, totalVes: 0, ultimaAt: null, ultimoQr: '' };
    const createdAt = o?.createdAt || null;
    const hasNewer = createdAt && (!prev.ultimaAt || new Date(createdAt) > new Date(prev.ultimaAt));
    map.set(email, {
      ...prev,
      nombre: prev.nombre || o?.buyer?.nombre || '',
      telefono: prev.telefono || o?.buyer?.telefono || '',
      compras: prev.compras + 1,
      totalUsd: prev.totalUsd + Number(o?.totals?.totalUsd || 0),
      totalVes: prev.totalVes + Number(o?.totals?.totalVes || 0),
      ultimaAt: hasNewer ? createdAt : prev.ultimaAt,
      ultimoQr: hasNewer ? String(o?.qrToken || '') : prev.ultimoQr
    });
  }
  const params = new URLSearchParams(location.search);
  const sortKey = (params.get('sort') || 'ultimaAt').trim();
  const sortDir = (params.get('dir') || (sortKey === 'email' || sortKey === 'nombre' ? 'asc' : 'desc')).trim().toLowerCase();

  const buyers = Array.from(map.values()).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'email') return a.email.localeCompare(b.email) * dir;
    if (sortKey === 'nombre') return String(a.nombre || '').localeCompare(String(b.nombre || '')) * dir;
    if (sortKey === 'compras') return ((a.compras || 0) - (b.compras || 0)) * dir;
    if (sortKey === 'totalUsd') return ((a.totalUsd || 0) - (b.totalUsd || 0)) * dir;
    const at = (x) => (x.ultimaAt ? new Date(x.ultimaAt).getTime() : 0);
    return (at(a) - at(b)) * dir;
  });

  const q = (params.get('q') || '').trim().toLowerCase();
  const pageSize = Math.max(1, Math.min(50, Number(params.get('pageSize') || 10) || 10));
  const page = Math.max(1, Number(params.get('page') || 1) || 1);
  const filtered = q
    ? buyers.filter((b) => `${b.email} ${b.nombre} ${b.telefono}`.toLowerCase().includes(q))
    : buyers;

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
      <h3 class="card__title">Compradores (${filtered.length}${q ? ` / filtro: ${q}` : ''})</h3>
      <div class="help">Página ${safePage}/${totalPages} · Filas: ${pageSize}</div>
      <div style="display:grid;gap:.5rem;margin-top:.6rem">
        ${paged.map((b) => {
          const nombre = b.nombre || '—';
          const tel = b.telefono || '—';
          const fecha = b.ultimaAt ? fmtVe(b.ultimaAt) : '—';
          const qr = b.ultimoQr ? `LICOR:${b.ultimoQr}` : '—';
          const qrBtn = b.ultimoQr ? ` <button class="btn btn--secondary" type="button" data-copy-qr="${qr}">Copiar QR</button>` : '';
          return `<div class="help"><strong>${b.email}</strong> — ${nombre} — ${tel} — ${b.compras} compras — $${b.totalUsd.toFixed(2)} / Bs ${b.totalVes.toFixed(2)} — Última: ${fecha} — QR: ${qr}${qrBtn} <button class="btn btn--secondary" type="button" data-buyer-detail="${b.email}">Detalle</button><div data-buyer-detail-panel="${b.email}" style="display:none;margin-top:.5rem"></div></div>`;
        }).join('')}
      </div>
    </div>
  `;

  const card = app.querySelector('.card');
  card?.insertAdjacentHTML('afterbegin', `
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:.75rem">
      <div style="min-width:220px;flex:1">
        <div class="label">Buscar</div>
        <input class="input" type="search" value="${q}" placeholder="Nombre, correo o teléfono" data-buyers-q />
      </div>
      <div style="min-width:140px">
        <div class="label">Filas</div>
        <select class="input" data-buyers-page-size>
          <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
          <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
        </select>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn--secondary" type="button" data-buyers-prev ${safePage <= 1 ? 'disabled' : ''}>Anterior</button>
        <button class="btn btn--secondary" type="button" data-buyers-next ${safePage >= totalPages ? 'disabled' : ''}>Siguiente</button>
      </div>
    </div>
  `);

  const updateParams = (next) => {
    const p = new URLSearchParams(location.search);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || String(v) === '') p.delete(k);
      else p.set(k, String(v));
    });
    location.search = p.toString();
  };

  const row = card?.firstElementChild;
  if (row && !app.querySelector('[data-buyers-status]')) {
    const wrap = document.createElement('div');
    wrap.style.minWidth = '160px';
    wrap.innerHTML = '<div class="label">Status</div>';
    const sel = document.createElement('select');
    sel.className = 'input';
    sel.setAttribute('data-buyers-status', '');
    sel.innerHTML = '<option value="all">Todas</option><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option><option value="used">Usadas</option>';
    sel.value = statusFilter;
    sel.addEventListener('change', () => updateParams({ status: sel.value, page: 1 }));
    wrap.appendChild(sel);
    row.insertBefore(wrap, row.children[1] || null);
  }

  if (row && !app.querySelector('[data-buyers-sort]')) {
    const wrap = document.createElement('div');
    wrap.style.minWidth = '220px';
    wrap.innerHTML = '<div class="label">Ordenar</div>';

    const sortSel = document.createElement('select');
    sortSel.className = 'input';
    sortSel.setAttribute('data-buyers-sort', '');
    sortSel.innerHTML = '<option value="ultimaAt">Última compra</option><option value="totalUsd">Total USD</option><option value="compras"># Compras</option><option value="email">Correo</option><option value="nombre">Nombre</option>';
    sortSel.value = sortKey;

    const dirSel = document.createElement('select');
    dirSel.className = 'input';
    dirSel.setAttribute('data-buyers-dir', '');
    dirSel.innerHTML = '<option value="desc">Desc</option><option value="asc">Asc</option>';
    dirSel.value = sortDir;

    const box = document.createElement('div');
    box.style.display = 'grid';
    box.style.gap = '.35rem';
    box.appendChild(sortSel);
    box.appendChild(dirSel);
    wrap.appendChild(box);
    row.insertBefore(wrap, row.children[2] || null);

    sortSel.addEventListener('change', () => updateParams({ sort: sortSel.value, page: 1 }));
    dirSel.addEventListener('change', () => updateParams({ dir: dirSel.value, page: 1 }));
  }

  const qInput = app.querySelector('[data-buyers-q]');
  qInput?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    updateParams({ q: qInput.value.trim(), page: 1 });
  });

  const sizeSelect = app.querySelector('[data-buyers-page-size]');
  sizeSelect?.addEventListener('change', () => {
    updateParams({ pageSize: sizeSelect.value, page: 1 });
  });

  app.querySelector('[data-buyers-prev]')?.addEventListener('click', () => {
    updateParams({ page: Math.max(1, safePage - 1) });
  });

  app.querySelector('[data-buyers-next]')?.addEventListener('click', () => {
    updateParams({ page: Math.min(totalPages, safePage + 1) });
  });

  app.addEventListener('click', async (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-copy-qr]') : null;
    if (!btn) return;
    const value = btn.getAttribute('data-copy-qr') || '';
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      toast('QR copiado', 'success');
    } catch (_) {
      toast('No se pudo copiar el QR', 'warning');
    }
  });

  app.addEventListener('click', (e) => {
    const b = e.target && e.target.closest ? e.target.closest('[data-buyer-detail]') : null;
    if (!b) return;
    const email = (b.getAttribute('data-buyer-detail') || '').trim().toLowerCase();
    const panel = email ? app.querySelector(`[data-buyer-detail-panel="${email}"]`) : null;
    if (!panel) return;
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'block' : 'none';
    b.textContent = open ? 'Ocultar' : 'Detalle';
    if (!open || panel.getAttribute('data-loaded') === '1') return;
    const all = getOrders();
    const base = statusFilter === 'all' ? all : all.filter((o) => String(o?.status || '').toLowerCase() === statusFilter);
    const list = base.filter((o) => String(o?.buyer?.email || o?.userEmail || '').trim().toLowerCase() === email).sort((a, c) => new Date(c.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    panel.innerHTML = '';
    if (!list.length) { panel.innerHTML = '<div class="help">Sin órdenes para este comprador.</div>'; panel.setAttribute('data-loaded', '1'); return; }
    list.forEach((o) => {
      const row = document.createElement('div');
      row.className = 'card card--soft';
      row.style.marginTop = '.5rem';
      const qr = o?.qrToken ? `LICOR:${o.qrToken}` : '';
      row.innerHTML = `<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap"><div><div style="font-weight:900">${o.id} <span class="badge badge--${o.status}">${o.status}</span></div><div class="help">${fmtVe(o.createdAt)} · $${Number(o?.totals?.totalUsd || 0).toFixed(2)}</div><div class="help">QR: <strong>${qr || '—'}</strong></div></div>${qr ? `<button class="btn btn--secondary" type="button" data-copy-qr="${qr}">Copiar QR</button>` : ''}</div>`;
      panel.appendChild(row);
    });
    panel.setAttribute('data-loaded', '1');
  });
}

function initVerificaciones() {
  const root = qs('[data-admin-verificaciones]');
  if (!root) return;
  if (!requireAdminSession(getAdminSession)) return;

  const list = qs('[data-verif-list]', root);
  const detail = qs('[data-verif-detail]', root);

  function render() {
    const orders = getOrders();
    const pending = orders.filter((o) => o.status === 'pending');

    if (!pending.length) {
      list.innerHTML = `<div class="card card--soft"><h3 class="card__title">Sin pendientes</h3><p class="card__text">No hay órdenes por verificar.</p></div>`;
      detail.innerHTML = `<div class="card card--soft"><p class="card__text">Selecciona una orden para ver detalles.</p></div>`;
      return;
    }

    list.innerHTML = pending.map((o) => `
      <button type="button" class="card card--soft" data-open="${o.id}" style="text-align:left;cursor:pointer;width:100%">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div>
            <div style="font-weight:900">${o.id}</div>
            <div class="help">${o.userEmail}</div>
          </div>
          <span class="badge badge--pending">Pendiente</span>
        </div>
      </button>
    `).join('');

    qsa('[data-open]', list).forEach((b) => {
      b.addEventListener('click', () => openDetail(b.getAttribute('data-open')));
    });

    openDetail(pending[0].id);
  }

  function openDetail(id) {
    const o = getOrders().find((x) => x.id === id);
    if (!o) return;

    detail.innerHTML = `
      <div class="card card--soft" style="display:grid;gap:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div>
            <h3 class="card__title" style="margin:0">Orden ${o.id}</h3>
            <p class="help" style="margin:.25rem 0 0">${o.userEmail}</p>
          </div>
          <span class="badge badge--pending">Pendiente</span>
        </div>
        <div>
          <div class="label" style="margin-bottom:.35rem">Items</div>
          <div class="card card--soft" style="display:grid;gap:.4rem">
            ${o.items.map((it) => `<div style="display:flex;justify-content:space-between;gap:1rem"><span class="help">${it.qty}× ${it.name}</span><strong>$${(it.priceUsd * it.qty).toFixed(2)}</strong></div>`).join('')}
          </div>
        </div>
        <div class="grid grid--2">
          <div class="card card--soft"><div class="label">Total USD</div><div style="font-weight:900;font-size:1.2rem">$${o.totals.totalUsd.toFixed(2)}</div></div>
          <div class="card card--soft"><div class="label">Total Bs</div><div style="font-weight:900;font-size:1.2rem">Bs ${o.totals.totalVes.toFixed(2)}</div></div>
        </div>
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

    qs('[data-approve]', detail)?.addEventListener('click', () => {
      updateOrderStatus(id, 'approved');
      toast('Orden aprobada', 'success');
      render();
    });

    qs('[data-reject]', detail)?.addEventListener('click', () => {
      const reason = qs('input[name="reason"]', detail).value.trim();
      if (!reason) {
        toast('Ingresa un motivo de rechazo', 'warning');
        return;
      }
      updateOrderStatus(id, 'rejected', reason);
      toast('Orden rechazada', 'info');
      render();
    });
  }

  render();
}

initHeader();
initGuards();
initLogin();
initDashboard();
initTasa();
initLicores();
initCroquisUpload();
initVerificaciones();
initCompradores();
