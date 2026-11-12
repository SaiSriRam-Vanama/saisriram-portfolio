/** Mobile menu, active-section highlight in the nav, and the scroll progress bar. */
(function () {
  'use strict';

  /* ---- Mobile menu ---- */
  const menuButton = document.getElementById('mb');
  const menuPanel = document.getElementById('mn');

  function closeMenu() {
    menuPanel.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  if (menuButton && menuPanel) {
    menuButton.addEventListener('click', () => {
      const open = menuPanel.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', open);
    });
    menuPanel.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') closeMenu();
    });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---- Active nav link + progress bar ---- */
  const SECTION_IDS = ['top', 'about', 'work', 'skills', 'journey', 'achievements', 'contact'];
  const SPY_OFFSET = 140; // px below the sticky header where a section counts as "current"
  const PROJECTS_INDEX = SECTION_IDS.indexOf('work');

  const navLinks = [].slice.call(document.querySelectorAll('nav a'));
  const sections = SECTION_IDS.map((id) => document.getElementById(id));
  const progressBar = document.getElementById('pb');

  function onScroll() {
    const view = document.body.dataset.view;
    if (view && view !== 'home') {
      // Case-study and not-found pages: "Projects" is the active section.
      navLinks.forEach((link, i) => link.classList.toggle('on', i === PROJECTS_INDEX));
    } else {
      const y = scrollY + SPY_OFFSET;
      let current = 0;
      sections.forEach((section, i) => {
        if (section.offsetTop <= y) current = i;
      });
      navLinks.forEach((link, i) => link.classList.toggle('on', i === current));
    }

    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = (scrollable > 0 ? (scrollY / scrollable) * 100 : 0) + '%';
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('route:change', onScroll);
  onScroll();
})();
