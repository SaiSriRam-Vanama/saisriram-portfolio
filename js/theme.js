/** Light / dark toggle. The initial theme is set by js/theme-init.js. */
(function () {
  'use strict';

  const root = document.documentElement;
  const toggle = document.getElementById('tg');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });
})();
