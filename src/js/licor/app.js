import { addToCart, clearCart, getCart, setCart, updateCartQty } from '../shared/store.js';
import { bindNavActive, requireUserSession, setCartBadge, toast } from '../shared/ui.js';
import { getAuthUser, getProfile, getSession, signInWithPassword, signOut, signUpWithPassword } from '../supabase/auth.js';
import { getProductImagePublicUrl, listActiveProductsPublic } from '../supabase/products.js';
import { createOrderWithItems, getBuyerOrderWithItems, listBuyerOrders } from '../supabase/orders.js';
import { getCurrentExchangeRate } from '../supabase/settings.js';
import { createPayment, uploadPaymentProof } from '../supabase/payments.js';
import { getActiveMesasMap, getMesasImagePublicUrl } from '../supabase/mesas.js';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function cartCount(cart) {
  return (cart.items || []).reduce((n, x) => n + (x.qty || 0), 0);
}

// Cache the exchange rate in memory (loaded once from Supabase)
let _cachedRate = null;

async function getRate() {
  if (_cachedRate) return _cachedRate;
  const { data, error } = await getCurrentExchangeRate();
  if (error || !data) {
    _cachedRate = 600; // Fallback
    return _cachedRate;
  }
  _cachedRate = data;
  return _cachedRate;
}

function computeTotals(cart, rate) {
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

async function initHeader() {
  bindNavActive();
  const cart = getCart();
  setCartBadge(cartCount(cart));
  const userEl = qs('[data-user-email]');
  const authUser = await getAuthUser();
  if (userEl) userEl.textContent = authUser?.email || '';
  const logout = qs('[data-logout]');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      (async () => {
        await signOut();
        toast('Sesión cerrada', 'info');
        setTimeout(() => location.href = '/licor/login.html', 250);
      })();
    });
  }
}

function initLogin() {
  const form = qs('[data-login-form]');
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

      toast('Bienvenido', 'success');
      const next = new URLSearchParams(location.search).get('next');
      setTimeout(() => location.href = next || '/licor/mi-cuenta.html', 300);
    })();
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
    (async () => {
      const nombre = qs('input[name="nombre"]', form)?.value?.trim() || '';
      const edadRaw = qs('input[name="edad"]', form)?.value || '';
      const edad = Number(edadRaw);
      const sexo = qs('select[name="sexo"]', form)?.value || '';
      const telefono = qs('input[name="telefono"]', form)?.value?.trim() || '';
      const email = qs('input[name="email"]', form).value.trim().toLowerCase();
      const password = qs('input[name="password"]', form).value;
      const password2 = qs('input[name="password2"]', form)?.value || '';
      if (!nombre || !Number.isFinite(edad) || !sexo || !telefono || !email || !password || !password2) {
        toast('Completa todos los campos', 'warning');
        return;
      }
      if (password !== password2) {
        toast('Las contraseñas no coinciden', 'warning');
        qs('input[name="password2"]', form)?.focus();
        return;
      }

      const { data, error } = await signUpWithPassword(email, password, {
        full_name: nombre,
        phone: telefono,
        edad,
        sexo
      });
      if (error) {
        toast(error.message || 'Error creando la cuenta', 'warning');
        return;
      }

      const authUser = data?.user || (await getAuthUser());
      if (!authUser) {
        toast('Cuenta creada. Revisa tu correo para confirmar.', 'success');
        const next = new URLSearchParams(location.search).get('next');
        setTimeout(() => location.href = next || '/licor/login.html', 500);
        return;
      }

      toast('Cuenta creada', 'success');
      const next = new URLSearchParams(location.search).get('next');
      setTimeout(() => location.href = next || '/licor/mi-cuenta.html', 300);
    })();
  });
}

async function hasUserSession() {
  const session = await getSession();
  return !!session;
}

async function renderOrders() {
  const root = qs('[data-orders]');
  if (!root) return;

  if (!(await requireUserSession(hasUserSession))) return;

  const authUser = await getAuthUser();
  if (!authUser?.id) return;
  const { data: orders, error } = await listBuyerOrders(authUser.id);
  if (error) {
    toast(error.message || 'No se pudieron cargar tus órdenes', 'warning');
    return;
  }

  if (!orders.length) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Aún no tienes órdenes</h3><p class="card__text">Entra a la tienda para hacer tu primera precompra.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/tienda.html">Ir a tienda</a></div></div>`;
    return;
  }

  root.innerHTML = orders.map((o) => {
    const badge = `badge--${o.status}`;
    const label = o.status === 'awaiting_verification' ? 'Pendiente' : o.status === 'approved' ? 'Aprobada' : o.status === 'rejected' ? 'Rechazada' : 'Usada';
    const cta = o.status === 'approved'
      ? `<a class="btn btn--primary" href="/licor/mesas.html">Ver mesas</a><a class="btn btn--secondary" href="https://wa.me/584140659985?text=Hola%20LA%20MUBI,%20quiero%20reservar%20mesa.%20Mi%20orden%20de%20licor%20es%20${o.id}" target="_blank" rel="noopener noreferrer">Reservar por WhatsApp</a>`
      : o.status === 'rejected'
        ? `<a class="btn btn--primary" href="/licor/tienda.html">Crear nueva orden</a>`
        : `<a class="btn btn--secondary" href="/licor/confirmacion.html?order=${encodeURIComponent(o.id)}">Ver QR</a>`;

    const rejected = '';

    return `
      <article class="card card--tilt" style="display:grid;gap:.6rem">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div>
            <h3 class="card__title" style="margin:0">Orden ${o.id}</h3>
            <p class="help" style="margin:.15rem 0 0">Total: ${fmtUsd(o.total_usd)}</p>
          </div>
          <span class="badge ${badge}">${label}</span>
        </div>
        ${rejected}
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.6rem">${cta}</div>
      </article>
    `;
  }).join('');
}

async function renderCatalog() {
  const root = qs('[data-catalog]');
  if (!root) return;

  const { data, error } = await listActiveProductsPublic();
  if (error) {
    toast(error.message || 'No se pudo cargar el catálogo', 'warning');
    return;
  }

  const rate = await getRate();
  const catalog = (data || []).filter((p) => p.product_type === 'liquor');
  root.innerHTML = catalog.map((p) => {
    const priceUsd = Number(p.price_usd || 0);
    const ves = priceUsd * rate;
    const imgUrl = getProductImagePublicUrl(p.image_path) || '/mubito.jpg';
    return `
      <article class="card card--tilt" style="display:grid;gap:.6rem">
        <div style="border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.10)">
          <img src="${imgUrl}" alt="${p.name}" style="width:100%;height:180px;object-fit:cover;display:block" />
        </div>
        <h3 class="card__title" style="margin:0">${p.name}</h3>
        <p class="card__text" style="margin:0">${p.description || ''}</p>
        <p class="help" style="margin:0">${fmtUsd(priceUsd)} · ${fmtVes(ves)}</p>
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
      const cart = addToCart({ sku: p.sku, name: p.name, priceUsd: Number(p.price_usd || 0) });
      setCartBadge(cartCount(cart));
      toast('Agregado al carrito', 'success');
      renderCart();
    });
  });
}

async function renderCart() {
  const root = qs('[data-cart]');
  if (!root) return;

  const cart = getCart();
  const rate = await getRate();
  const totals = computeTotals(cart, rate);

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

async function initCheckout() {
  const root = qs('[data-checkout]');
  if (!root) return;

  if (!(await requireUserSession(hasUserSession))) return;

  const cart = getCart();
  if (!cart.items.length) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Carrito vacío</h3><p class="card__text">Debes agregar productos antes de pagar.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/tienda.html">Ir a tienda</a></div></div>`;
    return;
  }

  const rate = await getRate();
  const totals = computeTotals(cart, rate);
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

async function initVerificacion() {
  const form = qs('[data-verificacion-form]');
  if (!form) return;

  if (!(await requireUserSession(hasUserSession))) return;

  const authUser = await getAuthUser();
  if (!authUser) {
    toast('Inicia sesión de nuevo', 'warning');
    setTimeout(() => location.href = '/licor/login.html', 250);
    return;
  }

  const cart = getCart();
  if (!cart.items.length) {
    location.href = '/licor/tienda.html';
    return;
  }

  const rate = await getRate();
  const totals = computeTotals(cart, rate);
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const referencia = qs('input[name="referencia"]', form).value.trim();
    const titular = qs('input[name="titular"]', form).value.trim();
    const comprobanteFile = qs('input[name="comprobante"]', form).files?.[0];

    if (!referencia || !titular || !comprobanteFile) {
      toast('Completa todos los campos y adjunta el comprobante', 'warning');
      return;
    }

    // Step 1: Create order
    const { data: order, error: orderErr } = await createOrderWithItems({
      buyer_id: authUser.id,
      items: cart.items
    });
    if (orderErr) {
      toast(orderErr.message || 'No se pudo crear la orden', 'warning');
      return;
    }

    // Step 2: Create payment record
    const { data: payment, error: paymentErr } = await createPayment({
      orderId: order.id,
      payerId: authUser.id,
      method,
      amountUsd: totals.totalUsd,
      amountBs: totals.totalVes
    });
    if (paymentErr) {
      toast(paymentErr.message || 'No se pudo registrar el pago', 'warning');
      return;
    }

    // Step 3: Upload proof file
    const { data: proof, error: proofErr } = await uploadPaymentProof(payment.id, comprobanteFile);
    if (proofErr) {
      toast(proofErr.message || 'No se pudo subir el comprobante', 'warning');
      return;
    }

    // Success
    clearCart();
    setCartBadge(0);
    toast('Verificación enviada', 'success');
    setTimeout(() => location.href = `/licor/confirmacion.html?order=${encodeURIComponent(order.id)}`, 300);
  });
}

async function initConfirmacion() {
  const root = qs('[data-confirmacion]');
  if (!root) return;

  if (!(await requireUserSession(hasUserSession))) return;

  const authUser = await getAuthUser();
  const email = (authUser?.email || '').trim().toLowerCase();
  if (!email) {
    toast('Inicia sesión de nuevo', 'warning');
    setTimeout(() => location.href = '/licor/login.html', 250);
    return;
  }

  const id = new URLSearchParams(location.search).get('order');
  if (!authUser?.id) return;
  const { data: order, error } = await getBuyerOrderWithItems(authUser.id, id);
  if (error) {
    toast(error.message || 'No se pudo cargar la orden', 'warning');
    return;
  }

  if (!order) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Orden no encontrada</h3><p class="card__text">Vuelve a mi cuenta.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/mi-cuenta.html">Ir a mi cuenta</a></div></div>`;
    return;
  }

  const label = order.status === 'awaiting_verification' ? 'Pendiente' : order.status === 'approved' ? 'Aprobada' : order.status === 'rejected' ? 'Rechazada' : order.status === 'cancelled' ? 'Cancelada' : order.status === 'placed' ? 'Procesando' : 'Borrador';
  root.innerHTML = `
    <div class="card card--soft" style="display:grid;gap:1rem;justify-items:center;text-align:center">
      <h3 class="card__title" style="margin:0">Tu QR de licor</h3>
      <span class="badge badge--${order.status}">${label}</span>
      <div class="card" style="background:#fff;color:#000;max-width:520px;width:100%">
        <div style="font-weight:900">LICOR:${order.id}</div>
        <div style="opacity:.75;font-size:.9rem;margin-top:.4rem">(string simple para demo)</div>
      </div>
      <p class="help" style="margin:0">Este QR no es válido hasta que el admin apruebe el pago.</p>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
        <a class="btn btn--primary" href="/licor/mi-cuenta.html">Volver a mi cuenta</a>
      </div>
    </div>
  `;
}

async function initMesas() {
  const root = qs('[data-mesas]');
  if (!root) return;

  const { data, error } = await getActiveMesasMap();
  if (error || !data) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Mesas no disponible</h3><p class="card__text">Aún no se ha publicado el mapa de mesas.</p></div>`;
    return;
  }

  const imgUrl = data.images?.[0]?.storage_path ? getMesasImagePublicUrl(data.images[0].storage_path) : '';
  const updatedAt = new Date(data.created_at).toLocaleString('es-VE');

  root.innerHTML = `
    <div class="card card--soft" style="display:grid;gap:1rem">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div>
          <h3 class="card__title" style="margin:0">Mesas actualizadas</h3>
          <p class="help" style="margin:.2rem 0 0">Última actualización: ${updatedAt}</p>
        </div>
        <a class="btn btn--secondary" href="https://wa.me/584140659985?text=Hola%20LA%20MUBI,%20quiero%20reservar%20mesa." target="_blank" rel="noopener noreferrer">Reservar por WhatsApp</a>
      </div>
      ${imgUrl ? `
        <div style="border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden;background:#000">
          <img src="${imgUrl}" alt="Mesas" style="width:100%;height:auto;display:block" />
        </div>
      ` : '<div class="help">Sin imagen disponible</div>'}
      <p class="help" style="margin:0">Leyenda: mesas tachadas o marcadas = no disponibles.</p>
    </div>
  `;
}

function initGuards() {
  qsa('[data-require-user]').forEach(() => {
    (async () => {
      await requireUserSession(hasUserSession);
    })();
  });
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
initMesas();
