(() => {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#site-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const closeButton = document.querySelector('.drawer-close');
  const backdrop = document.querySelector('.drawer-backdrop');
  const introScreen = document.querySelector('[data-intro]');
  const introWord = document.querySelector('[data-intro-word]');
  const introLottie = document.querySelector('[data-intro-lottie]');
  const scrollTrack = document.querySelector('[data-custom-scrollbar]');
  const scrollThumb = document.querySelector('[data-scroll-thumb]');
  let uiContent = null;

  const updateScrollbar = () => {
    if (!scrollTrack || !scrollThumb) return;
    const viewportHeight = window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const trackHeight = scrollTrack.clientHeight;
    const scrollable = pageHeight - viewportHeight;
    if (scrollable <= 0 || trackHeight <= 0) {
      scrollTrack.hidden = true;
      return;
    }
    scrollTrack.hidden = false;
    const thumbHeight = Math.max(38, (viewportHeight / pageHeight) * trackHeight);
    const maxTop = trackHeight - thumbHeight;
    scrollThumb.style.height = `${thumbHeight}px`;
    scrollThumb.style.transform = `translateY(${(window.scrollY / scrollable) * maxTop}px)`;
  };

  let scrollbarFrame = 0;
  const requestScrollbarUpdate = () => {
    if (!scrollbarFrame) scrollbarFrame = requestAnimationFrame(() => {
      updateScrollbar();
      scrollbarFrame = 0;
    });
  };
  window.addEventListener('scroll', requestScrollbarUpdate, { passive: true });
  window.addEventListener('resize', requestScrollbarUpdate, { passive: true });
  window.addEventListener('load', requestScrollbarUpdate, { once: true });
  requestScrollbarUpdate();

  if (scrollTrack && scrollThumb) {
    let dragging = false;
    let dragOffset = 0;
    scrollThumb.addEventListener('pointerdown', event => {
      dragging = true;
      dragOffset = event.clientY - scrollThumb.getBoundingClientRect().top;
      scrollThumb.setPointerCapture(event.pointerId);
      scrollThumb.classList.add('is-dragging');
    });
    scrollThumb.addEventListener('pointermove', event => {
      if (!dragging) return;
      const trackRect = scrollTrack.getBoundingClientRect();
      const thumbHeight = scrollThumb.offsetHeight;
      const maxTop = trackRect.height - thumbHeight;
      const top = Math.max(0, Math.min(maxTop, event.clientY - trackRect.top - dragOffset));
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, (top / maxTop) * scrollable);
    });
    const stopDragging = () => {
      dragging = false;
      scrollThumb.classList.remove('is-dragging');
    };
    scrollThumb.addEventListener('pointerup', stopDragging);
    scrollThumb.addEventListener('pointercancel', stopDragging);
    scrollTrack.addEventListener('pointerdown', event => {
      if (event.target === scrollThumb) return;
      const rect = scrollTrack.getBoundingClientRect();
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const position = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      window.scrollTo({ top: (position / rect.height) * scrollable, behavior: 'smooth' });
    });
  }

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

  const dismissIntro = () => {
    if (!introScreen) return;
    introScreen.classList.add('is-done');
    document.body.classList.remove('intro-active');
    window.setTimeout(() => introScreen.remove(), 700);
  };

  const runIntro = () => {
    if (!introScreen || !introWord) return;
    document.body.classList.add('intro-active');
    if (introLottie && window.lottie) {
      introWord.hidden = true;
      const animation = window.lottie.loadAnimation({
        container: introLottie,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: 'hello-animation.json'
      });
      animation.setSpeed(1.6);
      animation.addEventListener('DOMLoaded', () => {
        introLottie.querySelectorAll('path').forEach(path => {
          path.style.stroke = '#d7bd82';
          path.style.fill = 'none';
        });
      });
      animation.addEventListener('complete', dismissIntro, { once: true });
      window.setTimeout(dismissIntro, uiContent.intro.duration + 500);
      return;
    }
    introWord.hidden = false;
    const words = uiContent.intro.words;
    let index = 0;
    introWord.textContent = words[index];
    const interval = window.setInterval(() => {
      index += 1;
      if (index >= words.length) return;
      introWord.classList.remove('intro-word-change');
      window.requestAnimationFrame(() => {
        introWord.textContent = words[index];
        introWord.classList.add('intro-word-change');
      });
    }, 390);
    window.setTimeout(() => {
      window.clearInterval(interval);
      dismissIntro();
    }, uiContent.intro.duration);
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

  loadContent().then(() => {
    runIntro();
    return loadGithubWork();
  }).catch(() => {
    dismissIntro();
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

  const motionSelectors = [
    '.wordmark', '.nav nav', '.hero-top > *', '.hero-center > *', '.hero-bottom > *',
    '.section-index', '.about-grid > *', '.github-profile > *', '.about-copy > *',
    '.expertise-head > *', '.skill', '.skill > *', '.work-title', '.work-meta > *',
    '.project-caption > *', '.contact-inner > *', '.contact-links .email', '.contact-foot > *',
    'footer > *'
  ];
  document.querySelectorAll(motionSelectors.join(',')).forEach((element, index) => {
    if (!element.classList.contains('reveal')) element.classList.add('motion-item');
    element.style.setProperty('--motion-delay', `${Math.min(index % 7, 6) * 70}ms`);
  });

  const revealItems = document.querySelectorAll('.reveal, .motion-item');
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
