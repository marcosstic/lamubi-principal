import { addToCart, clearCart, createOrder, getCart, getLicorSession, getMockCatalog, getMockRate, getOrders, setCart, setLicorSession, updateCartQty } from '../shared/store.js';
import { bindNavActive, requireUserSession, setCartBadge, toast } from '../shared/ui.js';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function cartCount(cart) {
  return (cart.items || []).reduce((n, x) => n + (x.qty || 0), 0);
}

function computeTotals(cart) {
  const rate = getMockRate();
  const subtotalUsd = (cart.items || []).reduce((s, x) => s + x.priceUsd * x.qty, 0);
  const subtotalVes = subtotalUsd * rate;
  return {
    rate,
    subtotalUsd,
    subtotalVes,
    totalUsd: subtotalUsd,
    totalVes: subtotalVes
  };
}

function fmtUsd(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function fmtVes(n) {
  return `Bs ${Number(n || 0).toFixed(2)}`;
}

function initHeader() {
  bindNavActive();
  const cart = getCart();
  setCartBadge(cartCount(cart));
  const user = getLicorSession();
  const userEl = qs('[data-user-email]');
  if (userEl) userEl.textContent = user?.email || '';
  const logout = qs('[data-logout]');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('lamubi_licor_session');
      toast('Sesión cerrada', 'info');
      setTimeout(() => location.href = '/licor/login.html', 250);
    });
  }
}

function initLogin() {
  const form = qs('[data-login-form]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = qs('input[name="email"]', form).value.trim().toLowerCase();
    const password = qs('input[name="password"]', form).value;
    if (!email || !password) {
      toast('Completa email y contraseña', 'warning');
      return;
    }
    setLicorSession({ email });
    toast('Bienvenido', 'success');
    const next = new URLSearchParams(location.search).get('next');
    setTimeout(() => location.href = next || '/licor/mi-cuenta.html', 300);
  });

  qs('[data-reset-pass]')?.addEventListener('click', (e) => {
    e.preventDefault();
    toast('Mock: te enviamos un link de reset a tu correo (demo).', 'info');
  });
}

function initRegistro() {
  const form = qs('[data-register-form]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = qs('input[name="nombre"]', form)?.value?.trim() || '';
    const edadRaw = qs('input[name="edad"]', form)?.value || '';
    const edad = Number(edadRaw);
    const sexo = qs('select[name="sexo"]', form)?.value || '';
    const telefono = qs('input[name="telefono"]', form)?.value?.trim() || '';
    const email = qs('input[name="email"]', form).value.trim().toLowerCase();
    const password = qs('input[name="password"]', form).value;
    if (!nombre || !Number.isFinite(edad) || !sexo || !telefono || !email || !password) {
      toast('Completa email y contraseña', 'warning');
      return;
    }
    setLicorSession({ email, nombre, edad, sexo, telefono });
    toast('Cuenta creada', 'success');
    const next = new URLSearchParams(location.search).get('next');
    setTimeout(() => location.href = next || '/licor/mi-cuenta.html', 300);
  });
}

function renderOrders() {
  const root = qs('[data-orders]');
  if (!root) return;

  if (!requireUserSession(getLicorSession)) return;

  const user = getLicorSession();
  const orders = getOrders().filter((o) => o.userEmail === user.email);

  if (!orders.length) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Aún no tienes órdenes</h3><p class="card__text">Entra a la tienda para hacer tu primera precompra.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/tienda.html">Ir a tienda</a></div></div>`;
    return;
  }

  root.innerHTML = orders.map((o) => {
    const badge = `badge--${o.status}`;
    const label = o.status === 'pending' ? 'Pendiente' : o.status === 'approved' ? 'Aprobada' : o.status === 'rejected' ? 'Rechazada' : 'Usada';
    const cta = o.status === 'approved'
      ? `<a class="btn btn--primary" href="/licor/croquis.html">Ver croquis</a><a class="btn btn--secondary" href="https://wa.me/584140659985?text=Hola%20LA%20MUBI,%20quiero%20reservar%20mesa.%20Mi%20orden%20de%20licor%20es%20${o.id}" target="_blank" rel="noopener noreferrer">Reservar por WhatsApp</a>`
      : o.status === 'rejected'
        ? `<a class="btn btn--primary" href="/licor/tienda.html">Crear nueva orden</a>`
        : `<a class="btn btn--secondary" href="/licor/confirmacion.html?order=${encodeURIComponent(o.id)}">Ver QR</a>`;

    const rejected = o.status === 'rejected' && o.rejectedReason ? `<p class="help" style="margin-top:.75rem">Motivo: ${o.rejectedReason}</p>` : '';

    return `
      <article class="card card--tilt" style="display:grid;gap:.6rem">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div>
            <h3 class="card__title" style="margin:0">Orden ${o.id}</h3>
            <p class="help" style="margin:.15rem 0 0">Total: ${fmtUsd(o.totals.totalUsd)} · ${fmtVes(o.totals.totalVes)}</p>
          </div>
          <span class="badge ${badge}">${label}</span>
        </div>
        ${rejected}
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.6rem">${cta}</div>
      </article>
    `;
  }).join('');
}

function renderCatalog() {
  const root = qs('[data-catalog]');
  if (!root) return;

  const catalog = getMockCatalog();
  root.innerHTML = catalog.map((p) => {
    const ves = p.priceUsd * getMockRate();
    return `
      <article class="card card--tilt" style="display:grid;gap:.6rem">
        <div style="border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.10)">
          <img src="${p.img}" alt="${p.name}" style="width:100%;height:180px;object-fit:cover;display:block" />
        </div>
        <h3 class="card__title" style="margin:0">${p.name}</h3>
        <p class="card__text" style="margin:0">${p.desc}</p>
        <p class="help" style="margin:0">${fmtUsd(p.priceUsd)} · ${fmtVes(ves)}</p>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.4rem">
          <button class="btn btn--primary" type="button" data-add-sku="${p.sku}">Agregar</button>
        </div>
      </article>
    `;
  }).join('');

  qsa('[data-add-sku]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sku = btn.getAttribute('data-add-sku');
      const p = catalog.find((x) => x.sku === sku);
      if (!p) return;
      const cart = addToCart({ sku: p.sku, name: p.name, priceUsd: p.priceUsd });
      setCartBadge(cartCount(cart));
      toast('Agregado al carrito', 'success');
      renderCart();
    });
  });
}

function renderCart() {
  const root = qs('[data-cart]');
  if (!root) return;

  const cart = getCart();
  const totals = computeTotals(cart);

  if (!cart.items.length) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Carrito vacío</h3><p class="card__text">Agrega productos para ver el total.</p></div>`;
    setCartBadge(0);
    return;
  }

  root.innerHTML = `
    <div class="card card--soft" style="display:grid;gap:.75rem">
      <h3 class="card__title" style="margin:0">Tu carrito</h3>
      <div style="display:grid;gap:.6rem">
        ${cart.items.map((x) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap">
            <div>
              <div style="font-weight:900">${x.name}</div>
              <div class="help">${fmtUsd(x.priceUsd)} c/u</div>
            </div>
            <div style="display:flex;align-items:center;gap:.5rem">
              <button class="btn btn--secondary" type="button" data-qty="${x.sku}" data-delta="-1">-</button>
              <span style="min-width:2ch;text-align:center;font-weight:900">${x.qty}</span>
              <button class="btn btn--secondary" type="button" data-qty="${x.sku}" data-delta="1">+</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.10);padding-top:.75rem;display:grid;gap:.35rem">
        <div style="display:flex;justify-content:space-between"><span class="help">Subtotal USD</span><strong>${fmtUsd(totals.totalUsd)}</strong></div>
        <div style="display:flex;justify-content:space-between"><span class="help">Total Bs (tasa ${totals.rate})</span><strong>${fmtVes(totals.totalVes)}</strong></div>
      </div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.25rem">
        <a class="btn btn--primary" href="/licor/checkout.html">Continuar</a>
        <button class="btn btn--secondary" type="button" data-clear-cart>Vaciar</button>
      </div>
    </div>
  `;

  qsa('[data-qty]').forEach((b) => {
    b.addEventListener('click', () => {
      const sku = b.getAttribute('data-qty');
      const delta = Number(b.getAttribute('data-delta'));
      const cart = getCart();
      const it = cart.items.find((x) => x.sku === sku);
      if (!it) return;
      const nextQty = (it.qty || 0) + delta;
      const next = updateCartQty(sku, nextQty);
      setCartBadge(cartCount(next));
      renderCart();
    });
  });

  const clear = qs('[data-clear-cart]');
  if (clear) {
    clear.addEventListener('click', () => {
      clearCart();
      setCartBadge(0);
      toast('Carrito vacío', 'info');
      renderCart();
    });
  }
}

function initCheckout() {
  const root = qs('[data-checkout]');
  if (!root) return;

  if (!requireUserSession(getLicorSession)) return;

  const cart = getCart();
  if (!cart.items.length) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Carrito vacío</h3><p class="card__text">Debes agregar productos antes de pagar.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/tienda.html">Ir a tienda</a></div></div>`;
    return;
  }

  const totals = computeTotals(cart);
  root.innerHTML = `
    <div class="card card--soft" style="display:grid;gap:1rem">
      <h3 class="card__title" style="margin:0">Resumen</h3>
      <div style="display:grid;gap:.5rem">
        ${cart.items.map((x) => `<div style="display:flex;justify-content:space-between;gap:1rem"><span class="help">${x.qty}× ${x.name}</span><strong>${fmtUsd(x.priceUsd * x.qty)}</strong></div>`).join('')}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.10);padding-top:1rem;display:grid;gap:.35rem">
        <div style="display:flex;justify-content:space-between"><span class="help">Total USD</span><strong>${fmtUsd(totals.totalUsd)}</strong></div>
        <div style="display:flex;justify-content:space-between"><span class="help">Total Bs</span><strong>${fmtVes(totals.totalVes)}</strong></div>
        <div class="help">Tasa aplicada: ${totals.rate} Bs / USD</div>
      </div>
      <div class="grid grid--2">
        <label class="card card--soft" style="cursor:pointer;display:flex;gap:.75rem;align-items:flex-start">
          <input type="radio" name="pay" value="pago-movil" checked />
          <div>
            <div style="font-weight:900">PAGO MÓVIL</div>
            <div class="help">Transferencia directa desde tu teléfono móvil</div>
            <div class="help" style="margin-top:.35rem">Teléfono: 04140659985<br/>Banco: Banesco<br/>Cédula: 23554868</div>
          </div>
        </label>
        <label class="card card--soft" style="cursor:pointer;display:flex;gap:.75rem;align-items:flex-start">
          <input type="radio" name="pay" value="zelle" />
          <div>
            <div style="font-weight:900">ZELLE</div>
            <div class="help">Transferencia instantánea desde EE.UU.</div>
            <div class="help" style="margin-top:.35rem">Email: troconizjessica@gmail.com<br/>Nombre: Jessica Troconiz</div>
          </div>
        </label>
      </div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap">
        <a class="btn btn--secondary" href="/licor/tienda.html">Volver</a>
        <button class="btn btn--primary" type="button" data-continue>Continuar a verificación</button>
      </div>
    </div>
  `;

  qs('[data-continue]')?.addEventListener('click', () => {
    const method = qs('input[name="pay"]:checked')?.value || 'pago-movil';
    localStorage.setItem('lamubi_licor_payment_method', method);
    location.href = '/licor/verificacion.html';
  });
}

function initVerificacion() {
  const form = qs('[data-verificacion-form]');
  if (!form) return;

  if (!requireUserSession(getLicorSession)) return;

  const cart = getCart();
  if (!cart.items.length) {
    location.href = '/licor/tienda.html';
    return;
  }

  const totals = computeTotals(cart);
  const method = localStorage.getItem('lamubi_licor_payment_method') || 'pago-movil';

  const summary = qs('[data-summary]');
  if (summary) {
    summary.innerHTML = `
      <div class="card card--soft">
        <h3 class="card__title" style="margin:0">Resumen</h3>
        <p class="help" style="margin:.5rem 0 0">Método: ${method === 'zelle' ? 'Zelle' : 'Pago móvil'}</p>
        <p class="help" style="margin:.15rem 0 0">Total: ${fmtUsd(totals.totalUsd)} · ${fmtVes(totals.totalVes)}</p>
        <p class="help" style="margin:.15rem 0 0">Tasa aplicada: ${totals.rate} Bs / USD</p>
      </div>
    `;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = getLicorSession();
    const order = createOrder({
      userEmail: user.email,
      buyer: {
        email: user.email,
        nombre: user.nombre || '',
        telefono: user.telefono || ''
      },
      items: cart.items,
      totals,
      paymentMethod: method
    });
    clearCart();
    setCartBadge(0);
    toast('Verificación enviada', 'success');
    setTimeout(() => location.href = `/licor/confirmacion.html?order=${encodeURIComponent(order.id)}`, 300);
  });
}

function initConfirmacion() {
  const root = qs('[data-confirmacion]');
  if (!root) return;

  if (!requireUserSession(getLicorSession)) return;

  const id = new URLSearchParams(location.search).get('order');
  const user = getLicorSession();
  const order = getOrders().find((o) => o.id === id && o.userEmail === user.email);

  if (!order) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Orden no encontrada</h3><p class="card__text">Vuelve a mi cuenta.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/mi-cuenta.html">Ir a mi cuenta</a></div></div>`;
    return;
  }

  const label = order.status === 'pending' ? 'Pendiente' : order.status === 'approved' ? 'Aprobada' : order.status === 'rejected' ? 'Rechazada' : 'Usada';
  root.innerHTML = `
    <div class="card card--soft" style="display:grid;gap:1rem;justify-items:center;text-align:center">
      <h3 class="card__title" style="margin:0">Tu QR de licor</h3>
      <span class="badge badge--${order.status}">${label}</span>
      <div class="card" style="background:#fff;color:#000;max-width:520px;width:100%">
        <div style="font-weight:900">LICOR:${order.qrToken}</div>
        <div style="opacity:.75;font-size:.9rem;margin-top:.4rem">(string simple para demo)</div>
      </div>
      <p class="help" style="margin:0">Este QR no es válido hasta que el admin apruebe el pago.</p>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
        <a class="btn btn--primary" href="/licor/mi-cuenta.html">Volver a mi cuenta</a>
      </div>
    </div>
  `;
}

function initCroquis() {
  const root = qs('[data-croquis]');
  if (!root) return;
  const current = JSON.parse(localStorage.getItem('lamubi_croquis_current') || 'null');

  if (!current?.dataUrl) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Croquis no disponible</h3><p class="card__text">Aún no se ha publicado un croquis.</p></div>`;
    return;
  }

  root.innerHTML = `
    <div class="card card--soft" style="display:grid;gap:1rem">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div>
          <h3 class="card__title" style="margin:0">Croquis actualizado</h3>
          <p class="help" style="margin:.2rem 0 0">Última actualización: ${new Date(current.updatedAt).toLocaleString()}</p>
        </div>
        <a class="btn btn--secondary" href="https://wa.me/584140659985?text=Hola%20LA%20MUBI,%20quiero%20reservar%20mesa." target="_blank" rel="noopener noreferrer">Reservar por WhatsApp</a>
      </div>
      <div style="border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden;background:#000">
        <img src="${current.dataUrl}" alt="Croquis" style="width:100%;height:auto;display:block" />
      </div>
      <p class="help" style="margin:0">Leyenda: mesas tachadas o marcadas = no disponibles.</p>
    </div>
  `;
}

function initGuards() {
  qsa('[data-require-user]').forEach(() => requireUserSession(getLicorSession));
}

initHeader();
initGuards();
initLogin();
initRegistro();
renderOrders();
renderCatalog();
renderCart();
initCheckout();
initVerificacion();
initConfirmacion();
initCroquis();
