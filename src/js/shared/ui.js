function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function bindNavActive() {
  const path = location.pathname;
  qsa('[data-nav-link]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href && path.endsWith(href)) a.setAttribute('aria-current', 'page');
  });
}

export function setCartBadge(count) {
  const el = qs('[data-cart-count]');
  if (!el) return;
  el.textContent = String(count || 0);
  el.style.display = (count || 0) > 0 ? 'inline-flex' : 'none';
}

export function toast(message, variant = 'info') {
  const root = qs('[data-toast-root]');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `card card--soft toast toast--${variant}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.classList.add('is-show'), 10);
  setTimeout(() => {
    el.classList.remove('is-show');
    setTimeout(() => el.remove(), 250);
  }, 2500);
}

export function requireUserSession(getSessionFn) {
  if (getSessionFn()) return true;
  const next = encodeURIComponent(location.pathname);
  location.href = `/licor/login.html?next=${next}`;
  return false;
}

export function requireAdminSession(getSessionFn) {
  if (getSessionFn()) return true;
  const next = encodeURIComponent(location.pathname);
  location.href = `/admin-licor/login.html?next=${next}`;
  return false;
}
