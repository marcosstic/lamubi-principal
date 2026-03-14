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

function initInstagramEmbeds() {
  const embeds = qsa('.instagram-media');
  if (!embeds.length) return;

  const process = () => {
    try {
      if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
        window.instgrm.Embeds.process();
        return true;
      }
    } catch (_) {}
    return false;
  };

  if (process()) return;

  let tries = 0;
  const t = setInterval(() => {
    tries += 1;
    if (process() || tries >= 20) clearInterval(t);
  }, 300);
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
initInstagramEmbeds();

function initMubitoScene() {
  const hero = qs('#hero');
  const scene = qs('[data-mubito-scene]');
  const replay = qs('[data-mubito-replay]');
  const mubito = qs('[data-mubito]');
  if (!hero || !scene || !replay || !mubito) return;

  const KEY = 'lamubi_mubito_intro_played';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clearStates = () => {
    scene.classList.remove('scene--idle','scene--ufo-enter','scene--beam-on','scene--mubito-descend','scene--ufo-exit','scene--dance');
  };

  const toDance = () => {
    clearStates();
    scene.classList.add('scene--dance');
  };

  const playIntro = () => {
    scene.classList.remove('is-boosting');
    clearStates();
    scene.classList.add('scene--idle');

    // force reflow so CSS animations restart
    void scene.offsetHeight;

    scene.classList.add('scene--ufo-enter');
    setTimeout(() => scene.classList.add('scene--beam-on'), 1200);
    setTimeout(() => scene.classList.add('scene--mubito-descend'), 2000);
    setTimeout(() => scene.classList.add('scene--ufo-exit'), 3000);
    setTimeout(() => {
      scene.classList.remove('scene--ufo-enter','scene--beam-on','scene--mubito-descend','scene--ufo-exit');
      scene.classList.add('scene--dance');
    }, 3600);
  };

  replay.addEventListener('click', () => {
    playIntro();
  });

  mubito.addEventListener('click', () => {
    scene.classList.add('is-boosting');
    setTimeout(() => scene.classList.remove('is-boosting'), 1200);
  });

  if (reduceMotion) {
    toDance();
    return;
  }

  if (sessionStorage.getItem(KEY) === '1') {
    toDance();
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.35) {
        io.disconnect();
        playIntro();
        try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
      }
    }
  }, { threshold: [0, 0.35, 0.6, 1] });

  io.observe(hero);
}

initMubitoScene();
