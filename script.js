(() => {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#site-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const closeButton = document.querySelector('.drawer-close');
  const backdrop = document.querySelector('.drawer-backdrop');

  if (dot && ring && window.matchMedia('(pointer:fine)').matches) {
    let raf = 0, x = 0, y = 0;
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        dot.style.left = `${x}px`; dot.style.top = `${y}px`;
        ring.style.left = `${x}px`; ring.style.top = `${y}px`;
        raf = 0;
      });
    }, { passive: true });

    document.querySelectorAll('a,button,.skill,.project-art').forEach(el => {
      el.addEventListener('mouseenter', () => { ring.style.width='55px'; ring.style.height='55px'; });
      el.addEventListener('mouseleave', () => { ring.style.width='34px'; ring.style.height='34px'; });
    });
  }

  if (menu && nav) {
    const setMenuState = (open) => {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('drawer-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.setAttribute('aria-hidden', window.innerWidth <= 800 ? String(!open) : 'false');
      if (open) {
        const firstLink = nav.querySelector('a');
        window.setTimeout(() => firstLink?.focus(), 120);
      } else {
        menu.focus({ preventScroll: true });
      }
    };
    const closeMenu = () => setMenuState(false);
    menu.addEventListener('click', () => setMenuState(!nav.classList.contains('open')));
    closeButton?.addEventListener('click', closeMenu);
    backdrop?.addEventListener('click', closeMenu);
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu();
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 800 && nav.classList.contains('open')) closeMenu(); }, { passive: true });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 5, 4) * 70}ms`;
      observer.observe(el);
    });
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  if (window.matchMedia('(pointer:fine)').matches && !reduceMotion) {
    document.querySelectorAll('.project-art').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width-.5;
        const y = (e.clientY-r.top)/r.height-.5;
        card.style.transform = `perspective(900px) rotateX(${y*-4}deg) rotateY(${x*4}deg) scale(1.01)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }
})();
