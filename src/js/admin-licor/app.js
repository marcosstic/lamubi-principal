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
