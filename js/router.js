/**
 * Client-side router (History API) for two kinds of page:
 *   /                       the portfolio home page (sections #about, #work, ...)
 *   /projects/<slug>        a project case study
 *
 * - Internal links navigate without a full page reload.
 * - Opening or refreshing any of these URLs directly works (the host serves index.html
 *   for unknown paths: see vite.config.js, public/_redirects and vercel.json).
 * - Scroll position is saved in the history entry, so a refresh or Back/Forward returns the
 *   visitor to exactly where they were (for example, the Projects section).
 * - Each page sets its own <title>, meta description, canonical URL and Open Graph tags.
 */
import { renderCaseStudy, renderNotFound } from './case-study.js';

const BASE = import.meta.env.BASE_URL;
const HOME_IDS = new Set(['top', 'about', 'work', 'skills', 'journey', 'achievements', 'contact']);

const homeView = document.getElementById('home-view');
const caseView = document.getElementById('case-view');
const announcer = document.getElementById('route-announcer');

const homeMeta = {
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content ?? ''
};

let current = { view: null, slug: null };
let renderToken = 0;

/* ---------- routes ---------- */

function parse(pathname) {
  const rel = (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '')).replace(/\/+$/, '');
  if (rel === '' || rel === 'index.html') return { view: 'home' };
  const match = /^projects\/([^/]+)$/.exec(rel);
  if (match) return { view: 'case', slug: decodeURIComponent(match[1]) };
  return { view: 'notfound' };
}

const isInternalRoute = (route) => route.view === 'home' || route.view === 'case';
const sameRoute = (a, b) => a.view === b.view && (a.slug ?? null) === (b.slug ?? null);

/* ---------- head metadata ---------- */

function setHead(selector, attrs, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(attrs.tag);
    Object.entries(attrs.set).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.append(el);
  }
  el.setAttribute(attrs.valueAttr, content);
}

function applyMeta({ title, description }) {
  const url = location.origin + location.pathname;
  document.title = title;
  setHead('meta[name="description"]', { tag: 'meta', set: { name: 'description' }, valueAttr: 'content' }, description);
  setHead('meta[property="og:title"]', { tag: 'meta', set: { property: 'og:title' }, valueAttr: 'content' }, title);
  setHead('meta[property="og:description"]', { tag: 'meta', set: { property: 'og:description' }, valueAttr: 'content' }, description);
  setHead('meta[name="twitter:title"]', { tag: 'meta', set: { name: 'twitter:title' }, valueAttr: 'content' }, title);
  setHead('meta[name="twitter:description"]', { tag: 'meta', set: { name: 'twitter:description' }, valueAttr: 'content' }, description);
  setHead('meta[property="og:url"]', { tag: 'meta', set: { property: 'og:url' }, valueAttr: 'content' }, url);
  setHead('link[rel="canonical"]', { tag: 'link', set: { rel: 'canonical' }, valueAttr: 'href' }, url);
}

function announce(text) {
  announcer.textContent = '';
  setTimeout(() => { announcer.textContent = text; }, 50);
}

/* ---------- scrolling ---------- */

const jump = (top) => window.scrollTo({ top, left: 0, behavior: 'instant' });

function scrollToHash(hash) {
  if (!hash || hash === '#') return jump(0);
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  else jump(0);
}

let saveTimer;
function saveScroll() {
  clearTimeout(saveTimer);
  try { history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, ''); } catch { /* history unavailable */ }
}
const saveScrollSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveScroll, 120); };

/* ---------- views ---------- */

async function show(route, { hash = '', restoreY = null, focus = true } = {}) {
  const token = ++renderToken;
  let meta = homeMeta;
  let label = 'Home';

  if (route.view === 'case') {
    const result = await renderCaseStudy(caseView, route.slug);
    meta = result;
    label = result.found ? `Case study: ${result.name}` : 'Page not found';
  } else if (route.view === 'notfound') {
    renderNotFound(caseView);
    meta = { title: 'Page not found | Sai Sri Ram Vanama', description: 'This page does not exist.' };
    label = 'Page not found';
  }
  if (token !== renderToken) return; // a newer navigation superseded this one

  const showHome = route.view === 'home';
  homeView.hidden = !showHome;
  caseView.hidden = showHome;
  if (showHome) caseView.replaceChildren();
  document.body.dataset.view = route.view;
  document.documentElement.removeAttribute('data-initial');
  current = { view: route.view, slug: route.slug ?? null };

  applyMeta(meta);
  announce(label);

  if (restoreY !== null) jump(restoreY);
  else scrollToHash(hash);
  if (!showHome && focus && restoreY === null && !hash) caseView.querySelector('#cs-title')?.focus({ preventScroll: true });

  window.dispatchEvent(new CustomEvent('route:change', { detail: { ...current } }));
}

function navigate(url) {
  const target = new URL(url, location.href);
  const route = parse(target.pathname);
  saveScroll();
  history.pushState({ scrollY: 0 }, '', target.pathname + target.search + target.hash);
  return show(route, { hash: target.hash });
}

/* ---------- link interception ---------- */

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.('a[href]');
  if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

  const raw = link.getAttribute('href');
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;

  // Header/nav anchors (#about, #work, ...) always mean "that section of the home page".
  if (raw.startsWith('#')) {
    const id = raw.slice(1);
    if (current.view !== 'home' && HOME_IDS.has(id)) {
      event.preventDefault();
      navigate(`${BASE}${raw}`);
    }
    return; // README anchors and in-page anchors use the browser's native behaviour
  }

  const route = parse(url.pathname);
  if (!isInternalRoute(route)) return; // files, external routes: let the browser handle them
  if (sameRoute(route, current)) {
    if (!url.hash) { event.preventDefault(); jump(0); }
    return; // same page + hash: native anchor scrolling
  }
  event.preventDefault();
  navigate(url.href);
});

window.addEventListener('popstate', () => {
  const route = parse(location.pathname);
  const savedY = history.state?.scrollY ?? null;
  if (sameRoute(route, current)) {
    if (savedY !== null) jump(savedY); else scrollToHash(location.hash);
    return;
  }
  show(route, { hash: location.hash, restoreY: savedY });
});

window.addEventListener('scroll', saveScrollSoon, { passive: true });
window.addEventListener('pagehide', saveScroll);

/* ---------- first load ---------- */

history.scrollRestoration = 'manual';

(async function init() {
  const navType = performance.getEntriesByType('navigation')[0]?.type;
  const savedY = history.state?.scrollY ?? null;
  const restoreY = (navType === 'reload' || navType === 'back_forward') && savedY !== null ? savedY : null;

  await show(parse(location.pathname), { hash: location.hash, restoreY, focus: false });

  // Fonts and images can shift the layout after first paint; re-apply once, unless the visitor already scrolled.
  if (restoreY !== null || location.hash) {
    let moved = false;
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((type) => window.addEventListener(type, () => { moved = true; }, { once: true, passive: true }));
    window.addEventListener('load', () => {
      if (moved) return;
      if (restoreY !== null) jump(restoreY); else scrollToHash(location.hash);
    }, { once: true });
  }
})();
