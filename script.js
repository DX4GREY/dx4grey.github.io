(() => {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#site-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const closeButton = document.querySelector('.drawer-close');
  const backdrop = document.querySelector('.drawer-backdrop');
  let uiContent = null;

  const workList = document.querySelector('[data-github-work]');
  const githubUser = 'DX4GREY';

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const formatDate = date => new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(date));

  const getContent = path => path.split('.').reduce((value, key) => value?.[key], uiContent);

  const loadContent = async () => {
    const response = await fetch('content.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Content file unavailable');
    uiContent = await response.json();
    document.querySelectorAll('[data-content]').forEach(element => {
      const value = getContent(element.dataset.content);
      if (value !== undefined) element.textContent = value;
    });
    document.querySelectorAll('[data-content-attr]').forEach(element => {
      const [attribute, ...path] = element.dataset.contentAttr.split('.');
      const value = getContent(path.join('.'));
      if (value !== undefined) element.setAttribute(attribute, value);
    });
    document.querySelectorAll('.marquee [data-content]').forEach(element => {
      element.textContent += ' ';
    });
  };

  const renderProjects = repos => {
    workList.innerHTML = repos.map((repo, index) => {
      const number = String(index + 1).padStart(2, '0');
      const art = `art-${['one', 'two', 'three'][index % 3]}`;
      const name = repo.name.replace(/[-_]/g, ' ').toUpperCase();
      const language = repo.language ? escapeHtml(repo.language).toUpperCase() : uiContent.work.openSource;
      const description = repo.description || uiContent.work.defaultDescription;
      return `<a class="project reveal" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
        <div class="project-art ${art}"><span>${escapeHtml(repo.name.slice(0, 9).toUpperCase())}</span><small>${number} / ${language} / ★ ${repo.stargazers_count}</small><div class="art-${['circle', 'grid', 'line'][index % 3]}"></div></div>
        <div class="project-caption"><b>${number}</b><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(description)}</p><small class="project-updated">${uiContent.work.updated} ${formatDate(repo.updated_at)}</small></div><span>↗</span></div>
      </a>`;
    }).join('');
    workList.querySelectorAll('.reveal').forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
      if (!reduceMotion) requestAnimationFrame(() => el.classList.add('is-visible'));
      else el.classList.add('is-visible');
    });
    bindProjectTilt();
  };

  const loadGithubWork = async () => {
    if (!workList) return;
    try {
      const response = await fetch(`https://api.github.com/users/${githubUser}/repos?sort=updated&direction=desc&per_page=6`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!response.ok) throw new Error('GitHub API unavailable');
      const repos = (await response.json()).filter(repo => !repo.fork).slice(0, 6);
      if (!repos.length) throw new Error('No public repositories found');
      renderProjects(repos);
    } catch (error) {
      workList.innerHTML = `<p class="work-loading mono">${uiContent.work.error} <a href="https://github.com/${githubUser}?tab=repositories" target="_blank" rel="noreferrer">${uiContent.work.viewAll}</a></p>`;
    }
  };

  loadContent().then(loadGithubWork).catch(() => {
    if (workList) workList.innerHTML = '<p class="work-loading mono">CONTENT FILE UNAVAILABLE.</p>';
  });

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
      menu.setAttribute('aria-label', open ? uiContent?.nav.close : uiContent?.nav.open);
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
    bindProjectTilt();
  }

  function bindProjectTilt() {
    if (!window.matchMedia('(pointer:fine)').matches || reduceMotion) return;
    document.querySelectorAll('.project-art').forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 'true';
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
