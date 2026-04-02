const LS = {
  licorSession: 'lamubi_licor_session',
  adminSession: 'lamubi_admin_session',
  cart: 'lamubi_licor_cart',
  orders: 'lamubi_licor_orders',
  rate: 'lamubi_licor_rate',
  catalog: 'lamubi_licor_catalog',
  croquisCurrent: 'lamubi_croquis_current',
  croquisHistory: 'lamubi_croquis_history'
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

export function createOrder({ userEmail, items, totals, paymentMethod }) {
  const orders = getOrders();
  const order = {
    id: uid('ord'),
    createdAt: new Date().toISOString(),
    userEmail,
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

export function setCroquisCurrent(dataUrl) {
  writeJson(LS.croquisCurrent, { dataUrl, updatedAt: new Date().toISOString() });
  const history = readJson(LS.croquisHistory, []);
  history.unshift({ dataUrl, updatedAt: new Date().toISOString() });
  writeJson(LS.croquisHistory, history.slice(0, 20));
}

export function getCroquisCurrent() {
  return readJson(LS.croquisCurrent, null);
}

export function getCroquisHistory() {
  return readJson(LS.croquisHistory, []);
}

export function getMockCatalog() {
  const stored = readJson(LS.catalog, null);
  if (Array.isArray(stored) && stored.length) return stored;
  return [
    { sku: 'cacique-dorado', name: 'Cacique Dorado', desc: 'Ron venezolano premium.', priceUsd: 20, img: '/mubito.jpg' },
    { sku: 'cacique-500', name: 'Cacique 500', desc: 'Edición especial.', priceUsd: 35, img: '/mubito.jpg' },
    { sku: 'buchanans', name: "Buchanan's", desc: 'Whisky premium.', priceUsd: 60, img: '/mubito.jpg' },
    { sku: 'balde-cervezas', name: 'Balde de cervezas', desc: 'Ideal para compartir.', priceUsd: 7, img: '/mubito.jpg' }
  ];
}

export function setCatalog(items) {
  if (!Array.isArray(items)) return false;
  writeJson(LS.catalog, items);
  return true;
}

export function addCatalogItem(item) {
  const list = readJson(LS.catalog, null);
  const base = Array.isArray(list) ? list : getMockCatalog();
  const next = [item, ...base];
  writeJson(LS.catalog, next);
  return next;
}

export function getMockRate() {
  const raw = localStorage.getItem(LS.rate);
  const n = Number(raw || 600);
  if (!Number.isFinite(n) || n <= 0) return 600;
  return n;
}

export function setMockRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0) return false;
  localStorage.setItem(LS.rate, String(n));
  return true;
}
