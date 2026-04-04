const LS = {
  licorSession: 'lamubi_licor_session',
  adminSession: 'lamubi_admin_session',
  cart: 'lamubi_licor_cart',
  orders: 'lamubi_licor_orders',
  rate: 'lamubi_licor_rate',
  catalog: 'lamubi_licor_catalog',
  mesasCurrent: 'lamubi_mesas_current',
  mesasHistory: 'lamubi_mesas_history'
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = '') {
  const s = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return (prefix ? prefix + '_' : '') + s.slice(0, 16);
}

export function getLicorSession() {
  return readJson(LS.licorSession, null);
}

export function setLicorSession(user) {
  writeJson(LS.licorSession, user);
}

export function clearLicorSession() {
  localStorage.removeItem(LS.licorSession);
}

export function getAdminSession() {
  return readJson(LS.adminSession, null);
}

export function setAdminSession(user) {
  writeJson(LS.adminSession, user);
}

export function clearAdminSession() {
  localStorage.removeItem(LS.adminSession);
}

export function getCart() {
  return readJson(LS.cart, { items: [] });
}

export function setCart(cart) {
  writeJson(LS.cart, cart);
}

export function clearCart() {
  localStorage.removeItem(LS.cart);
}

export function addToCart(item) {
  const cart = getCart();
  const idx = cart.items.findIndex((x) => x.sku === item.sku);
  if (idx >= 0) cart.items[idx].qty += item.qty || 1;
  else cart.items.push({ ...item, qty: item.qty || 1 });
  setCart(cart);
  return cart;
}

export function updateCartQty(sku, qty) {
  const cart = getCart();
  cart.items = cart.items
    .map((x) => (x.sku === sku ? { ...x, qty: Math.max(0, qty) } : x))
    .filter((x) => x.qty > 0);
  setCart(cart);
  return cart;
}

export function getOrders() {
  return readJson(LS.orders, []);
}

export function setOrders(orders) {
  writeJson(LS.orders, orders);
}

export function createOrder({ userEmail, buyer, items, totals, paymentMethod }) {
  const orders = getOrders();
  const buyerEmail = (buyer?.email || userEmail || '').trim().toLowerCase();
  const order = {
    id: uid('ord'),
    createdAt: new Date().toISOString(),
    userEmail: buyerEmail || (userEmail || ''),
    buyer: buyer
      ? {
          email: buyerEmail,
          nombre: buyer?.nombre || '',
          telefono: buyer?.telefono || ''
        }
      : null,
    items,
    totals,
    paymentMethod,
    status: 'pending',
    qrToken: uid('licor')
  };
  orders.unshift(order);
  setOrders(orders);
  return order;
}

export function updateOrderStatus(orderId, status, reason) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], status, rejectedReason: reason || null, updatedAt: new Date().toISOString() };
  setOrders(orders);
  return orders[idx];
}

export function setMesasCurrent(dataUrl) {
  writeJson(LS.mesasCurrent, { dataUrl, updatedAt: new Date().toISOString() });
  const history = readJson(LS.mesasHistory, []);
  history.unshift({ dataUrl, updatedAt: new Date().toISOString() });
  writeJson(LS.mesasHistory, history.slice(0, 20));
}

export function getMesasCurrent() {
  return readJson(LS.mesasCurrent, null);
}

export function getMesasHistory() {
  return readJson(LS.mesasHistory, []);
}

// ============================================================
// DEPRECATED: These functions are kept for backward compatibility
// but should NOT be used in new code.
// - Use listActiveProductsPublic() from supabase/products.js instead of getMockCatalog
// - Use getCurrentExchangeRate() from supabase/settings.js instead of getMockRate
// ============================================================

export function getMockCatalog() {
  console.warn('[DEPRECATED] getMockCatalog() is deprecated. Use listActiveProductsPublic() from supabase/products.js');
  return [];
}

export function setCatalog(items) {
  console.warn('[DEPRECATED] setCatalog() is deprecated. Use createProduct() from supabase/products.js');
  return false;
}

export function addCatalogItem(item) {
  console.warn('[DEPRECATED] addCatalogItem() is deprecated. Use createProduct() from supabase/products.js');
  return [];
}

export function getMockRate() {
  console.warn('[DEPRECATED] getMockRate() is deprecated. Use getCurrentExchangeRate() from supabase/settings.js');
  return 600;
}

export function setMockRate(rate) {
  console.warn('[DEPRECATED] setMockRate() is deprecated. Use updateExchangeRate() from supabase/settings.js');
  return false;
}
