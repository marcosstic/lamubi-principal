import { addToCart, clearCart, getCart, setCart, updateCartQty } from '../shared/store.js';
import { bindNavActive, requireUserSession, setCartBadge, toast } from '../shared/ui.js';
import { getAuthUser, getProfile, getSession, signInWithPassword, signOut, signUpWithPassword } from '../supabase/auth.js';
import { getProductImagePublicUrl, listActiveProductsPublic } from '../supabase/products.js';
import { createOrderWithItems, getBuyerOrderWithItems, listBuyerOrders } from '../supabase/orders.js';
import { getCurrentExchangeRate } from '../supabase/settings.js';
import { createPayment, uploadPaymentProof } from '../supabase/payments.js';
import { getActiveMesasMap, getMesasImagePublicUrl } from '../supabase/mesas.js';
import { generateQRForOrder } from '../use-cases/qr.js';

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
    const label = o.status === 'awaiting_verification' ? 'Pendiente' : o.status === 'approved' ? 'Aprobada' : o.status === 'rejected' ? 'Rechazada' : o.status === 'used' ? 'Usada' : o.status;
    
    let cta = '';
    if (o.status === 'approved') {
      cta = `
        <a class="btn btn--primary" href="/licor/mi-qr.html?order=${encodeURIComponent(o.id)}">Ver QR</a>
        <a class="btn btn--secondary" href="/licor/mesas.html">Ver mesas</a>
        <a class="btn btn--secondary" href="https://wa.me/584140659985?text=Hola%20LA%20MUBI,%20quiero%20reservar%20mesa.%20Mi%20orden%20de%20licor%20es%20${o.id}" target="_blank" rel="noopener noreferrer">Reservar por WhatsApp</a>
      `;
    } else if (o.status === 'rejected') {
      cta = `<a class="btn btn--primary" href="/licor/tienda.html">Crear nueva orden</a>`;
    } else if (o.status === 'awaiting_verification') {
      cta = `<a class="btn btn--secondary" href="/licor/confirmacion.html?order=${encodeURIComponent(o.id)}">Ver estado</a>`;
    } else if (o.status === 'used') {
      cta = `<span class="help">Orden completada</span>`;
    }

    return `
      <article class="card card--tilt" style="display:grid;gap:.6rem">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
          <div>
            <h3 class="card__title" style="margin:0">Orden ${o.id.slice(0, 8)}...</h3>
            <p class="help" style="margin:.15rem 0 0">Total: ${fmtUsd(o.total_usd)}</p>
          </div>
          <span class="badge ${badge}">${label}</span>
        </div>
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
  if (!authUser?.id) return;

  const orderId = new URLSearchParams(location.search).get('order');
  if (!orderId) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Orden no especificada</h3><p class="card__text">Vuelve a mi cuenta.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/mi-cuenta.html">Ir a mi cuenta</a></div></div>`;
    return;
  }

  const { data: order, error } = await getBuyerOrderWithItems(authUser.id, orderId);
  if (error || !order) {
    root.innerHTML = `<div class="card card--soft"><h3 class="card__title">Orden no encontrada</h3><p class="card__text">Vuelve a mi cuenta.</p><div style="margin-top:1rem"><a class="btn btn--primary" href="/licor/mi-cuenta.html">Ir a mi cuenta</a></div></div>`;
    return;
  }

  // Get buyer profile for name, phone, sexo, edad
  const { data: profile } = await getProfile(authUser.id);
  
  // Try multiple sources for buyer data
  const buyerName = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '—';
  const buyerPhone = profile?.phone || authUser.user_metadata?.phone || '—';
  const buyerSexo = profile?.sexo || authUser.user_metadata?.sexo || '—';
  const buyerEdad = profile?.edad || authUser.user_metadata?.edad || '—';
  
  // Format purchase date (Venezuela timezone)
  const purchaseDate = order.created_at ? new Date(order.created_at).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short'
  }) : '—';

  const label = order.status === 'awaiting_verification' ? 'Pendiente' : order.status === 'approved' ? 'Aprobada' : order.status === 'rejected' ? 'Rechazada' : order.status === 'used' ? 'Usada' : order.status;
  const isApproved = order.status === 'approved';

  // Get exchange rate for Bs calculation
  const { data: rateData } = await getCurrentExchangeRate();
  const exchangeRate = rateData || 600;
  const totalBs = (Number(order.total_usd || 0) * exchangeRate).toFixed(2);

  const statusColor = order.status === 'approved' ? '#11bb75' : order.status === 'rejected' ? '#f44336' : '#ff9800';
  const statusLabel = order.status === 'awaiting_verification' ? 'pendiente' : order.status === 'approved' ? 'aprobada' : order.status === 'rejected' ? 'rechazada' : order.status === 'used' ? 'usada' : order.status;

  root.innerHTML = `
    <div style="max-width:700px;margin:0 auto">
      <!-- Two columns layout -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <!-- LEFT COLUMN: TICKET -->
        <div id="ticket-download" style="background:#fff;border-radius:20px;padding:1.5rem;border:2px solid #bb1175;overflow:hidden">
          <!-- Logo centrado -->
          <div style="text-align:center;margin-bottom:1rem">
            <img src="/LaMubiMCBOLogo1.png" alt="LA MUBI" style="width:80px;height:auto;margin:0 auto;display:block" />
          </div>

          <!-- Datos del Comprador -->
          <div style="margin-bottom:1rem">
            <h3 style="margin:0 0 .75rem;font-size:1rem;font-weight:700;color:#bb1175;text-align:center">
              👤 Datos del Comprador
            </h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666;letter-spacing:.05em">Nombre</div>
                <div style="font-weight:600;color:#000;font-size:.8rem">${buyerName}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666;letter-spacing:.05em">Teléfono</div>
                <div style="font-weight:600;color:#000;font-size:.8rem">${buyerPhone}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666;letter-spacing:.05em">Edad</div>
                <div style="font-weight:600;color:#000;font-size:.8rem">${buyerEdad}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666;letter-spacing:.05em">Sexo</div>
                <div style="font-weight:600;color:#000;font-size:.8rem;text-transform:capitalize">${buyerSexo}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666;letter-spacing:.05em">Email</div>
                <div style="font-weight:600;color:#000;font-size:.8rem;word-break:break-all">${authUser.email || '—'}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666;letter-spacing:.05em">Orden</div>
                <div style="font-weight:600;color:#000;font-size:.8rem">${order.id.slice(0, 8)}</div>
              </div>
            </div>
          </div>

          <!-- Detalles del Ticket -->
          <div style="margin-bottom:1rem">
            <h3 style="margin:0 0 .75rem;font-size:1rem;font-weight:700;color:#bb1175;text-align:center">
              🎫 Detalles del Ticket
            </h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666">Estado</div>
                <div style="font-weight:600;color:${statusColor};font-size:.85rem;text-transform:capitalize">${statusLabel}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666">Total USD</div>
                <div style="font-weight:600;color:#000;font-size:.85rem">$${Number(order.total_usd || 0).toFixed(2)}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666">Total Bs</div>
                <div style="font-weight:600;color:#000;font-size:.85rem">Bs ${totalBs}</div>
              </div>
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center;grid-column:1/-1">
                <div style="font-size:.65rem;text-transform:uppercase;color:#666">Fecha de Compra</div>
                <div style="font-weight:600;color:#000;font-size:.85rem">${purchaseDate}</div>
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div style="text-align:center;padding-top:1rem;border-top:2px solid #bb1175">
            <div style="font-size:1.5rem;font-weight:900;color:#bb1175;letter-spacing:.2em;margin-bottom:.5rem">LICOR</div>
            <div style="font-size:.85rem;font-weight:700;color:#000;margin-bottom:.75rem">TICKET: ${order.id.slice(0, 8)}</div>
            <div id="confirm-qr-code" style="display:inline-block;padding:.5rem;background:#fff"></div>
            <div style="font-size:.85rem;font-weight:600;color:#000;margin-top:.5rem">Código: ${order.id.slice(0, 8)}</div>
          </div>
        </div>

        <!-- RIGHT COLUMN: PRODUCTS -->
        <div style="background:#fff;border-radius:20px;padding:1.5rem;border:2px solid #bb1175;overflow:hidden">
          <h3 style="margin:0 0 1rem;font-size:1rem;font-weight:700;color:#bb1175;text-align:center">
            🛒 Productos Comprados
          </h3>
          <div style="display:grid;gap:.4rem">
            ${(order.order_items || []).map((item) => `
              <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:600;color:#000;font-size:.85rem">${item.product?.name || 'Producto'}</span>
                <span style="background:#bb1175;color:#fff;padding:.15rem .5rem;border-radius:999px;font-size:.75rem;font-weight:700">x${item.qty}</span>
              </div>
            `).join('') || '<div style="text-align:center;color:#666">Sin productos</div>'}
          </div>
          <div style="margin-top:1rem;text-align:center">
            <span style="background:#bb1175;color:#fff;padding:.5rem 1rem;border-radius:999px;font-size:.85rem;font-weight:700">${(order.order_items || []).length} producto${(order.order_items || []).length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;margin-top:1.5rem">
        <a class="btn btn--primary" href="/licor/mi-cuenta.html">Volver a mi cuenta</a>
        <button class="btn btn--secondary" type="button" id="download-qr-btn">📥 Descargar Ticket</button>
        ${isApproved ? `<a class="btn btn--secondary" href="/licor/mesas.html">Ver mesas</a>` : ''}
      </div>
    </div>
  `;

  // Generate QR code using qrcodejs library
  const qrCodeEl = document.getElementById('confirm-qr-code');
  let qrDataUrl = null;
  let qrImage = null;
  
  if (qrCodeEl && window.QRCode) {
    // Create a temporary container for QR generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    new window.QRCode(tempDiv, {
      text: order.id,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H
    });

    // Wait for QR to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get QR canvas and convert to data URL
    const qrCanvas = tempDiv.querySelector('canvas');
    if (qrCanvas) {
      qrDataUrl = qrCanvas.toDataURL('image/png');
      // Create image object for later use
      qrImage = new Image();
      qrImage.src = qrDataUrl;
      await new Promise((resolve) => { qrImage.onload = resolve; });
    }
    
    // Clean up temp div
    document.body.removeChild(tempDiv);
    
    // Insert QR as img in the ticket
    if (qrDataUrl) {
      qrCodeEl.innerHTML = `<img id="qr-ticket-img" src="${qrDataUrl}" style="width:200px;height:200px;display:block" />`;
    } else {
      qrCodeEl.innerHTML = '<p style="color:red">Error al generar QR</p>';
    }

    // Download entire ticket by composing canvas manually
    document.getElementById('download-qr-btn')?.addEventListener('click', async () => {
      try {
        const numProducts = (order.order_items || []).length;
        
        // Calculate heights for both columns
        const ticketColumnWidth = 280;
        const productsColumnWidth = 200;
        const gap = 10;
        const width = ticketColumnWidth + gap + productsColumnWidth;
        
        // Calculate ticket column height
        const ticketBaseHeight = 15 + 60 + 15 + 30 + 120 + 15 + 30 + 80 + 20 + 35 + 20 + 180 + 20;
        const ticketHeight = Math.max(ticketBaseHeight, 550);
        
        // Calculate products column height (24px per product + header)
        const productsHeight = Math.max(30 + numProducts * 28 + 15, ticketHeight);
        const estimatedHeight = Math.max(ticketHeight, productsHeight);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width * 2;
        canvas.height = estimatedHeight * 2;
        ctx.scale(2, 2);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, estimatedHeight);
        
        // Helper function to draw text
        function drawText(text, x, y, size, weight, color, align = 'center') {
          ctx.fillStyle = color || '#000000';
          ctx.font = `${weight} ${size}px Montserrat, sans-serif`;
          ctx.textAlign = align;
          ctx.fillText(text, x, y);
        }
        
        // Helper to draw rounded rect
        function drawRoundRect(x, y, w, h, r) {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, r);
        }
        
        // ===== LEFT COLUMN: TICKET =====
        const ticketX = 5;
        const ticketW = ticketColumnWidth;
        
        // Ticket border
        ctx.strokeStyle = '#bb1175';
        ctx.lineWidth = 2;
        drawRoundRect(ticketX, 5, ticketW, estimatedHeight - 10, 15);
        ctx.stroke();
        
        // Logo
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = '/LaMubiMCBOLogo1.png';
        });
        const logoWidth = 70;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        ctx.drawImage(logoImg, ticketX + (ticketW - logoWidth) / 2, 15, logoWidth, logoHeight);
        
        let yPos = 15 + logoHeight + 10;
        
        // Datos del Comprador
        drawText('👤 Datos del Comprador', ticketX + ticketW / 2, yPos + 15, 11, '700', '#bb1175');
        yPos += 28;
        
        const boxW = (ticketW - 30) / 2;
        const boxH = 32;
        const buyerInfo = [
          { label: 'NOMBRE', value: buyerName },
          { label: 'TELÉFONO', value: buyerPhone },
          { label: 'EDAD', value: String(buyerEdad) },
          { label: 'SEXO', value: buyerSexo },
          { label: 'EMAIL', value: authUser.email || '—' },
          { label: 'ORDEN', value: order.id.slice(0, 8) }
        ];
        
        buyerInfo.forEach((info, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = ticketX + 10 + col * (boxW + 5);
          const y = yPos + row * (boxH + 4);
          
          ctx.fillStyle = '#f8f8f8';
          drawRoundRect(x, y, boxW, boxH, 5);
          ctx.fill();
          
          drawText(info.label, x + boxW / 2, y + 11, 6, '400', '#666666');
          drawText(info.value, x + boxW / 2, y + 24, 8, '600', '#000000');
        });
        
        yPos += Math.ceil(buyerInfo.length / 2) * (boxH + 4) + 12;
        
        // Detalles del Ticket
        drawText('🎫 Detalles del Ticket', ticketX + ticketW / 2, yPos + 14, 11, '700', '#bb1175');
        yPos += 26;
        
        const details = [
          { label: 'ESTADO', value: statusLabel, color: statusColor },
          { label: 'TOTAL USD', value: `$${Number(order.total_usd || 0).toFixed(2)}` },
          { label: 'TOTAL BS', value: `Bs ${totalBs}` },
          { label: 'FECHA', value: purchaseDate }
        ];
        
        details.forEach((detail, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = ticketX + 10 + col * (boxW + 5);
          const y = yPos + row * (boxH + 4);
          
          ctx.fillStyle = '#f8f8f8';
          drawRoundRect(x, y, boxW, boxH, 5);
          ctx.fill();
          
          drawText(detail.label, x + boxW / 2, y + 11, 6, '400', '#666666');
          drawText(detail.value, x + boxW / 2, y + 24, 8, '600', detail.color || '#000000');
        });
        
        yPos += Math.ceil(details.length / 2) * (boxH + 4) + 15;
        
        // Separator
        ctx.strokeStyle = '#bb1175';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ticketX + 15, yPos);
        ctx.lineTo(ticketX + ticketW - 15, yPos);
        ctx.stroke();
        yPos += 18;
        
        // LICOR
        drawText('LICOR', ticketX + ticketW / 2, yPos + 18, 16, '900', '#bb1175');
        yPos += 30;
        
        drawText(`TICKET: ${order.id.slice(0, 8)}`, ticketX + ticketW / 2, yPos + 10, 9, '700', '#000000');
        yPos += 18;
        
        // QR code
        if (qrImage) {
          const qrSize = 150;
          const qrX = ticketX + (ticketW - qrSize) / 2;
          ctx.drawImage(qrImage, qrX, yPos, qrSize, qrSize);
          yPos += qrSize + 10;
        }
        
        drawText(`Código: ${order.id.slice(0, 8)}`, ticketX + ticketW / 2, yPos + 10, 9, '600', '#000000');
        
        // ===== RIGHT COLUMN: PRODUCTS =====
        const prodX = ticketX + ticketW + gap;
        const prodW = productsColumnWidth;
        
        // Products border
        ctx.strokeStyle = '#bb1175';
        ctx.lineWidth = 2;
        drawRoundRect(prodX, 5, prodW, estimatedHeight - 10, 15);
        ctx.stroke();
        
        // Products header
        drawText('🛒 Productos', prodX + prodW / 2, 25, 12, '700', '#bb1175');
        
        // Draw all products
        (order.order_items || []).forEach((item, i) => {
          const y = 40 + i * 26;
          
          ctx.fillStyle = '#f8f8f8';
          drawRoundRect(prodX + 8, y, prodW - 16, 22, 5);
          ctx.fill();
          
          // Product name (left aligned, truncated if needed)
          const maxNameLen = 18;
          let name = item.product?.name || 'Producto';
          if (name.length > maxNameLen) name = name.substring(0, maxNameLen - 2) + '..';
          drawText(name, prodX + 16, y + 15, 8, '600', '#000000', 'left');
          
          // Quantity badge
          ctx.fillStyle = '#bb1175';
          drawRoundRect(prodX + prodW - 42, y + 3, 28, 16, 8);
          ctx.fill();
          drawText(`x${item.qty}`, prodX + prodW - 28, y + 15, 8, '700', '#ffffff');
        });
        
        // Total products count at bottom
        const totalY = 40 + numProducts * 26 + 10;
        ctx.fillStyle = '#bb1175';
        drawRoundRect(prodX + 8, totalY, prodW - 16, 24, 8);
        ctx.fill();
        drawText(`${numProducts} producto${numProducts > 1 ? 's' : ''}`, prodX + prodW / 2, totalY + 16, 9, '700', '#ffffff');
        
        // Download
        const link = document.createElement('a');
        link.download = `lamubi-ticket-${order.id.slice(0, 8)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast('Ticket descargado exitosamente', 'success');
      } catch (err) {
        console.error('Download error:', err);
        toast('No se pudo descargar el ticket', 'warning');
      }
    });
  } else {
    if (qrCodeEl) {
      qrCodeEl.innerHTML = '<p style="color:red">Librería QR no cargada</p>';
    }
  }
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

async function initMiQR() {
  const container = qs('[data-qr-container]');
  const loading = qs('[data-qr-loading]');
  const content = qs('[data-qr-content]');
  const error = qs('[data-qr-error]');
  const errorMessage = qs('[data-error-message]');
  
  if (!container) return;
  
  // Get order ID from URL
  const orderId = new URLSearchParams(location.search).get('order');
  if (!orderId) {
    if (error) {
      error.style.display = 'block';
      if (errorMessage) errorMessage.textContent = 'No se especificó una orden.';
    }
    if (loading) loading.style.display = 'none';
    return;
  }

  const { data, error: qrError } = await generateQRForOrder(orderId);
  
  if (qrError || !data) {
    if (loading) loading.style.display = 'none';
    if (error) {
      error.style.display = 'block';
      if (errorMessage) errorMessage.textContent = qrError?.message || 'No se pudo generar el QR.';
    }
    return;
  }

  const statusColor = data.order?.status === 'approved' ? '#11bb75' : data.order?.status === 'rejected' ? '#f44336' : '#ff9800';
  const statusLabel = data.order?.status === 'approved' ? 'Aprobada' : data.order?.status === 'rejected' ? 'Rechazada' : 'Pendiente';
  const buyerName = data.buyer?.full_name || '—';
  const buyerPhone = data.buyer?.phone || '—';
  const buyerEmail = data.buyer?.email || '—';
  const buyerEdad = data.buyer?.edad || '—';
  const buyerSexo = data.buyer?.sexo || '—';
  
  // Get payment info
  const payments = data.order?.payments || data.payments || [];
  const payment = payments[0] || {};
  const paymentMethod = payment.method === 'zelle' ? 'Zelle' : (payment.method || 'Pago Móvil');
  const totalBs = payment.amount_bs ? `Bs ${Number(payment.amount_bs).toFixed(2)}` : '—';
  
  // Format purchase date
  const purchaseDate = data.order?.created_at ? new Date(data.order.created_at).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'short'
  }) : '—';

  // Render two-column layout
  if (content) {
    content.innerHTML = `
      <div style="max-width:700px;margin:0 auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <!-- LEFT COLUMN: TICKET -->
          <div style="background:#fff;border-radius:20px;padding:1.5rem;border:2px solid #bb1175;overflow:hidden">
            <div style="text-align:center;margin-bottom:1rem">
              <img src="/LaMubiMCBOLogo1.png" alt="LA MUBI" style="width:80px;height:auto;margin:0 auto;display:block" />
            </div>

            <div style="margin-bottom:1rem">
              <h3 style="margin:0 0 .75rem;font-size:1rem;font-weight:700;color:#bb1175;text-align:center">👤 Datos del Comprador</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Nombre</div>
                  <div style="font-weight:600;color:#000;font-size:.8rem">${buyerName}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Teléfono</div>
                  <div style="font-weight:600;color:#000;font-size:.8rem">${buyerPhone}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Edad</div>
                  <div style="font-weight:600;color:#000;font-size:.8rem">${buyerEdad}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Sexo</div>
                  <div style="font-weight:600;color:#000;font-size:.8rem;text-transform:capitalize">${buyerSexo}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center;grid-column:1/-1">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Email</div>
                  <div style="font-weight:600;color:#000;font-size:.8rem">${buyerEmail}</div>
                </div>
              </div>
            </div>

            <div style="margin-bottom:1rem">
              <h3 style="margin:0 0 .75rem;font-size:1rem;font-weight:700;color:#bb1175;text-align:center">🎫 Detalles del Ticket</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Estado</div>
                  <div style="font-weight:600;color:${statusColor};font-size:.85rem">${statusLabel}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Total USD</div>
                  <div style="font-weight:600;color:#000;font-size:.85rem">$${Number(data.order?.total_usd || 0).toFixed(2)}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Total Bs</div>
                  <div style="font-weight:600;color:#000;font-size:.85rem">${totalBs}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Método Pago</div>
                  <div style="font-weight:600;color:#000;font-size:.85rem">${paymentMethod}</div>
                </div>
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;text-align:center;grid-column:1/-1">
                  <div style="font-size:.65rem;text-transform:uppercase;color:#666">Fecha Compra</div>
                  <div style="font-weight:600;color:#000;font-size:.85rem">${purchaseDate}</div>
                </div>
              </div>
            </div>

            <div style="text-align:center;padding-top:1rem;border-top:2px solid #bb1175">
              <div style="font-size:1.5rem;font-weight:900;color:#bb1175;letter-spacing:.2em;margin-bottom:.5rem">LICOR</div>
              <div style="font-size:.85rem;font-weight:700;color:#000;margin-bottom:.75rem">TICKET: ${data.order?.id?.slice(0, 8)}</div>
              <div id="qr-code" style="display:inline-block;padding:.5rem;background:#fff"></div>
              <div style="font-size:.85rem;font-weight:600;color:#000;margin-top:.5rem">Código: ${data.order?.id?.slice(0, 8)}</div>
            </div>
          </div>

          <!-- RIGHT COLUMN: PRODUCTS -->
          <div style="background:#fff;border-radius:20px;padding:1.5rem;border:2px solid #bb1175;overflow:hidden">
            <h3 style="margin:0 0 1rem;font-size:1rem;font-weight:700;color:#bb1175;text-align:center">🛒 Productos Comprados</h3>
            <div style="display:grid;gap:.4rem">
              ${(data.order?.items || []).map((item) => `
                <div style="background:#f8f8f8;border-radius:8px;padding:.5rem;display:flex;justify-content:space-between;align-items:center">
                  <span style="font-weight:600;color:#000;font-size:.85rem">${item.product?.name || 'Producto'}</span>
                  <span style="background:#bb1175;color:#fff;padding:.15rem .5rem;border-radius:999px;font-size:.75rem;font-weight:700">x${item.qty}</span>
                </div>
              `).join('') || '<div style="text-align:center;color:#666">Sin productos</div>'}
            </div>
            <div style="margin-top:1rem;text-align:center">
              <span style="background:#bb1175;color:#fff;padding:.5rem 1rem;border-radius:999px;font-size:.85rem;font-weight:700">${(data.order?.items || []).length} producto${(data.order?.items || []).length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;margin-top:1.5rem">
          <a class="btn btn--primary" href="/licor/mi-cuenta.html">Volver a mi cuenta</a>
          <button class="btn btn--secondary" type="button" id="download-qr-btn-miqr">📥 Descargar Ticket</button>
          ${data.order?.status === 'approved' ? `<a class="btn btn--secondary" href="/licor/mesas.html">Ver mesas</a>` : ''}
        </div>
      </div>
    `;

    // Generate QR code
    const qrCodeEl = document.getElementById('qr-code');
    let qrDataUrl = null;
    let qrImage = null;
    
    if (qrCodeEl && window.QRCode) {
      // Create a temporary container for QR generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      new window.QRCode(tempDiv, {
        text: data.order?.id || '',
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });

      // Wait for QR to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get QR canvas and convert to data URL
      const qrCanvas = tempDiv.querySelector('canvas');
      if (qrCanvas) {
        qrDataUrl = qrCanvas.toDataURL('image/png');
        qrImage = new Image();
        qrImage.src = qrDataUrl;
        await new Promise((resolve) => { qrImage.onload = resolve; });
      }
      
      // Clean up temp div
      document.body.removeChild(tempDiv);
      
      // Insert QR as img in the ticket
      if (qrDataUrl) {
        qrCodeEl.innerHTML = `<img src="${qrDataUrl}" style="width:180px;height:180px;display:block" />`;
      }

      // Download entire ticket by composing canvas manually
      document.getElementById('download-qr-btn-miqr')?.addEventListener('click', async () => {
        try {
          const numProducts = (data.order?.items || []).length;
          
          // Calculate heights for both columns
          const ticketColumnWidth = 280;
          const productsColumnWidth = 200;
          const gap = 10;
          const width = ticketColumnWidth + gap + productsColumnWidth;
          
          // Calculate ticket column height
          const ticketBaseHeight = 15 + 60 + 15 + 30 + 120 + 15 + 30 + 80 + 20 + 35 + 20 + 180 + 20;
          const ticketHeight = Math.max(ticketBaseHeight, 550);
          
          // Calculate products column height
          const productsHeight = Math.max(30 + numProducts * 28 + 15, ticketHeight);
          const estimatedHeight = Math.max(ticketHeight, productsHeight);
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = width * 2;
          canvas.height = estimatedHeight * 2;
          ctx.scale(2, 2);
          
          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, estimatedHeight);
          
          // Helper function to draw text
          function drawText(text, x, y, size, weight, color, align = 'center') {
            ctx.fillStyle = color || '#000000';
            ctx.font = `${weight} ${size}px Montserrat, sans-serif`;
            ctx.textAlign = align;
            ctx.fillText(text, x, y);
          }
          
          // Helper to draw rounded rect
          function drawRoundRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
          }
          
          // ===== LEFT COLUMN: TICKET =====
          const ticketX = 5;
          const ticketW = ticketColumnWidth;
          
          // Ticket border
          ctx.strokeStyle = '#bb1175';
          ctx.lineWidth = 2;
          drawRoundRect(ticketX, 5, ticketW, estimatedHeight - 10, 15);
          ctx.stroke();
          
          // Logo
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
            logoImg.src = '/LaMubiMCBOLogo1.png';
          });
          const logoWidth = 70;
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          ctx.drawImage(logoImg, ticketX + (ticketW - logoWidth) / 2, 15, logoWidth, logoHeight);
          
          let yPos = 15 + logoHeight + 10;
          
          // Datos del Comprador
          drawText('👤 Datos del Comprador', ticketX + ticketW / 2, yPos + 15, 11, '700', '#bb1175');
          yPos += 28;
          
          const boxW = (ticketW - 30) / 2;
          const boxH = 32;
          const buyerInfo = [
            { label: 'NOMBRE', value: buyerName },
            { label: 'TELÉFONO', value: buyerPhone },
            { label: 'EDAD', value: String(buyerEdad) },
            { label: 'SEXO', value: String(buyerSexo) },
            { label: 'EMAIL', value: buyerEmail }
          ];
          
          buyerInfo.forEach((info, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = ticketX + 10 + col * (boxW + 5);
            const y = yPos + row * (boxH + 4);
            
            ctx.fillStyle = '#f8f8f8';
            drawRoundRect(x, y, boxW, boxH, 5);
            ctx.fill();
            
            drawText(info.label, x + boxW / 2, y + 11, 6, '400', '#666666');
            drawText(info.value, x + boxW / 2, y + 24, 8, '600', '#000000');
          });
          
          yPos += Math.ceil(buyerInfo.length / 2) * (boxH + 4) + 12;
          
          // Detalles del Ticket
          drawText('🎫 Detalles del Ticket', ticketX + ticketW / 2, yPos + 14, 11, '700', '#bb1175');
          yPos += 26;
          
          const details = [
            { label: 'ESTADO', value: statusLabel, color: statusColor },
            { label: 'TOTAL USD', value: `$${Number(data.order?.total_usd || 0).toFixed(2)}` },
            { label: 'TOTAL BS', value: totalBs },
            { label: 'MÉTODO PAGO', value: paymentMethod },
            { label: 'FECHA COMPRA', value: purchaseDate }
          ];
          
          details.forEach((detail, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = ticketX + 10 + col * (boxW + 5);
            const y = yPos + row * (boxH + 4);
            
            ctx.fillStyle = '#f8f8f8';
            drawRoundRect(x, y, boxW, boxH, 5);
            ctx.fill();
            
            drawText(detail.label, x + boxW / 2, y + 11, 6, '400', '#666666');
            drawText(detail.value, x + boxW / 2, y + 24, 8, '600', detail.color || '#000000');
          });
          
          yPos += Math.ceil(details.length / 2) * (boxH + 4) + 15;
          
          // Separator
          ctx.strokeStyle = '#bb1175';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ticketX + 15, yPos);
          ctx.lineTo(ticketX + ticketW - 15, yPos);
          ctx.stroke();
          yPos += 18;
          
          // LICOR
          drawText('LICOR', ticketX + ticketW / 2, yPos + 18, 16, '900', '#bb1175');
          yPos += 30;
          
          drawText(`TICKET: ${data.order?.id?.slice(0, 8)}`, ticketX + ticketW / 2, yPos + 10, 9, '700', '#000000');
          yPos += 18;
          
          // QR code
          if (qrImage) {
            const qrSize = 150;
            const qrX = ticketX + (ticketW - qrSize) / 2;
            ctx.drawImage(qrImage, qrX, yPos, qrSize, qrSize);
            yPos += qrSize + 10;
          }
          
          drawText(`Código: ${data.order?.id?.slice(0, 8)}`, ticketX + ticketW / 2, yPos + 10, 9, '600', '#000000');
          
          // ===== RIGHT COLUMN: PRODUCTS =====
          const prodX = ticketX + ticketW + gap;
          const prodW = productsColumnWidth;
          
          // Products border
          ctx.strokeStyle = '#bb1175';
          ctx.lineWidth = 2;
          drawRoundRect(prodX, 5, prodW, estimatedHeight - 10, 15);
          ctx.stroke();
          
          // Products header
          drawText('🛒 Productos', prodX + prodW / 2, 25, 12, '700', '#bb1175');
          
          // Draw all products
          (data.order?.items || []).forEach((item, i) => {
            const y = 40 + i * 26;
            
            ctx.fillStyle = '#f8f8f8';
            drawRoundRect(prodX + 8, y, prodW - 16, 22, 5);
            ctx.fill();
            
            const maxNameLen = 18;
            let name = item.product?.name || 'Producto';
            if (name.length > maxNameLen) name = name.substring(0, maxNameLen - 2) + '..';
            drawText(name, prodX + 16, y + 15, 8, '600', '#000000', 'left');
            
            ctx.fillStyle = '#bb1175';
            drawRoundRect(prodX + prodW - 42, y + 3, 28, 16, 8);
            ctx.fill();
            drawText(`x${item.qty}`, prodX + prodW - 28, y + 15, 8, '700', '#ffffff');
          });
          
          // Total products count at bottom
          const totalY = 40 + numProducts * 26 + 10;
          ctx.fillStyle = '#bb1175';
          drawRoundRect(prodX + 8, totalY, prodW - 16, 24, 8);
          ctx.fill();
          drawText(`${numProducts} producto${numProducts > 1 ? 's' : ''}`, prodX + prodW / 2, totalY + 16, 9, '700', '#ffffff');
          
          // Download
          const link = document.createElement('a');
          link.download = `lamubi-ticket-${data.order?.id?.slice(0, 8)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast('Ticket descargado exitosamente', 'success');
        } catch (err) {
          console.error('Download error:', err);
          toast('No se pudo descargar el ticket', 'warning');
        }
      });
    }
  }

  // Show content
  if (loading) loading.style.display = 'none';
  if (content) content.style.display = 'block';
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
initMiQR();
