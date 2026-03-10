import { LINKS } from './config/links.js';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function initLinks() {
  qsa('[data-link="tickets"]').forEach(a => a.setAttribute('href', LINKS.tickets));
  qsa('[data-link="registro"]').forEach(a => a.setAttribute('href', LINKS.registro));
}

function initMobileNav() {
  const btn = qs('[data-menu-btn]');
  const panel = qs('[data-mobile-nav]');
  if (!btn || !panel) return;

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('is-open', open);
  };

  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });

  panel.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

function initParticles() {
  const root = qs('[data-particles]');
  if (!root) return;

  const count = 50;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = (Math.random() * 6) + 's';
    p.style.animationDuration = (Math.random() * 3 + 3) + 's';
    const alt = Math.random() > 0.5;
    p.style.background = alt ? 'var(--accent)' : 'var(--secondary)';
    p.style.boxShadow = `0 0 ${Math.random() * 15 + 5}px ${alt ? 'var(--accent)' : 'var(--secondary)'}`;
    root.appendChild(p);
  }

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset || 0;
    root.style.transform = `translateY(${scrolled * 0.15}px)`;
  }, { passive: true });
}

function initTiltCards() {
  const cards = qsa('.card--tilt');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 14;
      const rotateY = (centerX - x) / 14;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

initLinks();
initMobileNav();
initParticles();
initTiltCards();
