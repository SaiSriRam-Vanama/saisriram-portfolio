/**
 * Case-study page: /projects/<slug>
 *
 * The README is the primary content. It is rendered from the build-time snapshot in
 * content/readmes/<slug>.json (see scripts/fetch-readmes.mjs). The header, links and
 * "Stack" chips come from js/data.js; chips are limited to technologies that the README
 * itself mentions. If the README could not be retrieved, the page says so plainly and
 * links to the repository. It never fills the gap with invented text.
 */
import { PORTFOLIO } from './data.js';
import { mountReadme } from './readme.js';
import { renderCyberHygieneCaseStudy, CYBER_HYGIENE_DESCRIPTION } from './cyber-hygiene-case-study.js';

const BASE = import.meta.env.BASE_URL;
const snapshots = import.meta.glob('/content/readmes/*.json');

export const homeUrl = (hash = '') => `${BASE}${hash}`;
export const projectUrl = (slug) => `${BASE}projects/${slug}`;
export const findProject = (slug) => PORTFOLIO.projects.find((p) => p.slug === slug);

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NEW_TAB = ' target="_blank" rel="noopener noreferrer"';
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

async function loadSnapshot(slug) {
  const load = snapshots[`/content/readmes/${slug}.json`];
  if (!load) return null;
  try {
    return (await load()).default;
  } catch (error) {
    console.warn(`README snapshot for "${slug}" could not be loaded`, error);
    return null;
  }
}

/* ---------- pieces ---------- */

function actions(project, className = '') {
  const live = project.live
    ? `<a class="bt" href="${esc(project.live)}"${NEW_TAB} aria-label="Open live demo of ${esc(project.name)} (opens in a new tab)">Live demo <i>→</i></a>`
    : '';
  const repo = project.source
    ? `<a class="bg" href="${esc(project.source)}"${NEW_TAB} aria-label="View ${esc(project.name)} on GitHub (opens in a new tab)">View project ↗</a>`
    : '';
  return `<div class="cta ${className}">${live}${repo}</div>`;
}

function metaBlock(project, snap) {
  const repo = snap?.repo || (project.source ? { url: project.source, owner: '', name: project.source.split('/').slice(-2).join('/') } : null);
  const repoName = repo ? (repo.owner ? `${repo.owner}/${repo.name}` : repo.name) : '';
  const cells = [
    ['Category', esc(project.category)],
    ['Status', project.live ? 'Live demo available' : 'Source code only'],
    repo ? ['Repository', `<a href="${esc(repo.url)}"${NEW_TAB}>${esc(repoName)} ↗</a>`] : null,
    snap?.status === 'ok'
      ? ['README', `<a href="${esc(snap.readme.htmlUrl)}"${NEW_TAB}>${esc(snap.readme.path)} ↗</a><span class="cs-note">synced ${esc(formatDate(snap.readme.fetchedAt))}</span>`]
      : null
  ].filter(Boolean);

  const stack = snap?.status === 'ok' ? snap.verifiedTags : [];
  return `
    <dl class="cs-meta">${cells.map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    ${stack.length ? `<div class="cs-stack"><span class="mono">Stack documented in the README</span><ul class="tgs">${stack.map((t) => `<li><span>${esc(t)}</span></li>`).join('')}</ul></div>` : ''}`;
}

function tocBlock(snap) {
  if (snap?.status !== 'ok' || !snap.headings?.length) return '';
  const top = Math.min(...snap.headings.map((h) => h.level));
  const items = snap.headings.filter((h) => h.level === top);
  if (items.length < 3) return '';
  return `
    <details class="cs-toc">
      <summary class="mono">On this page</summary>
      <nav aria-label="On this page"><ol>${items.map((h) => `<li><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}</ol></nav>
    </details>`;
}

function readmeBlock(project, snap) {
  if (snap?.status === 'ok') {
    const note = snap.stale
      ? `<p class="cs-notice" role="status">Showing the last README that was retrieved (${esc(formatDate(snap.readme.fetchedAt))}). GitHub could not be reached during the latest build.</p>`
      : '';
    return `${note}<article class="readme" id="readme" aria-label="${esc(project.name)} README"></article>`;
  }
  const reason = snap?.status === 'missing'
    ? 'No README file was found in this repository.'
    : 'The README could not be retrieved from GitHub when this site was built.';
  const link = snap?.repo?.url || project.source;
  return `
    <div class="cs-fallback" role="status">
      <h2>README unavailable</h2>
      <p>${reason} The full documentation for this project lives in its GitHub repository.</p>
      ${link ? `<p><a class="bt sm" href="${esc(link)}"${NEW_TAB}>Open the repository on GitHub <i>→</i></a></p>` : ''}
    </div>`;
}

function relatedBlock(project) {
  const list = PORTFOLIO.projects.filter((p) => p.slug);
  const start = list.findIndex((p) => p.slug === project.slug);
  const others = [1, 2, 3].map((i) => list[(start + i) % list.length]).filter((p) => p && p.slug !== project.slug);
  return `
    <section class="cs-related" aria-labelledby="cs-related-title">
      <h2 id="cs-related-title">More projects</h2>
      <ul class="rel-grid">${others.map((p) => `
        <li><a class="cd rel" href="${projectUrl(p.slug)}">
          <span class="mono">${esc(p.category)}</span>
          <span class="rel-title">${esc(p.name)}</span>
          <span class="rel-desc">${esc(p.description)}</span>
          <span class="cs">Case study <span>→</span></span>
        </a></li>`).join('')}</ul>
    </section>`;
}

/* ---------- page ---------- */

let tocObserver;

function watchToc(host) {
  tocObserver?.disconnect();
  const links = new Map([...host.querySelectorAll('.cs-toc a')].map((a) => [a.getAttribute('href').slice(1), a]));
  if (!links.size) return;
  tocObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(entry.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-90px 0px -70% 0px' });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) tocObserver.observe(el); });
}

function syncTocOpen(host) {
  const toc = host.querySelector('.cs-toc');
  if (!toc) return;
  const query = matchMedia('(min-width: 1025px)');
  const apply = () => { toc.open = query.matches; };
  apply();
  query.addEventListener('change', apply);
}

/** @returns {Promise<{found:boolean, name?:string, title:string, description:string}>} */
export async function renderCaseStudy(host, slug) {
  const project = findProject(slug);
  if (!project) {
    renderNotFound(host);
    return { found: false, title: 'Project not found', description: 'This project page does not exist.' };
  }

  if (slug === 'cyber-hygiene-assistant') {
    tocObserver?.disconnect();
    host.innerHTML = renderCyberHygieneCaseStudy(project, BASE);
    return {
      found: true,
      name: project.name,
      title: `${project.name} — Case Study | Sai Sri Ram Vanama`,
      description: CYBER_HYGIENE_DESCRIPTION
    };
  }

  const snap = await loadSnapshot(slug);
  const readmeOk = snap?.status === 'ok';

  host.innerHTML = `
    <div class="w">
      <p class="cs-back"><a href="${homeUrl('#work')}">← Back to projects</a></p>
      <div class="cs-head">
        <span class="mono">Case study · ${esc(project.category)}</span>
        <h1 id="cs-title" tabindex="-1">${esc(project.name)}</h1>
        ${project.subtitle ? `<p class="sb">${esc(project.subtitle)}</p>` : ''}
        <p class="cs-lead">${esc(project.description)}</p>
        ${actions(project, 'cs-actions')}
      </div>
      ${project.image ? `<figure class="cs-shot"><img src="${BASE}assets/images/projects/${esc(project.image)}" alt="${esc(project.alt || `Screenshot of ${project.name}`)}" width="1200" height="750"></figure>` : ''}
      ${metaBlock(project, snap)}
      <div class="cs-layout">
        ${tocBlock(snap)}
        <div class="cs-main">${readmeBlock(project, snap)}</div>
      </div>
      <section class="cs-end" aria-label="Project links">
        <h2>Explore ${esc(project.name)}</h2>
        ${actions(project)}
      </section>
      ${relatedBlock(project)}
    </div>`;

  if (readmeOk) {
    mountReadme(host.querySelector('#readme'), snap.html);
    syncTocOpen(host);
    watchToc(host);
  }

  return {
    found: true,
    name: project.name,
    title: `${project.name} — Case Study | Sai Sri Ram Vanama`,
    // Prefer wording that comes from the README; fall back to the project's own summary.
    description: (readmeOk && snap.description) || project.description
  };
}

export function renderNotFound(host) {
  tocObserver?.disconnect();
  host.innerHTML = `
    <div class="w cs-notfound">
      <span class="mono">404</span>
      <h1 id="cs-title" tabindex="-1">Page not found</h1>
      <p class="cs-lead">There is no page at this address. It may have moved, or the link may be mistyped.</p>
      <div class="cta"><a class="bt" href="${homeUrl('#work')}">View all projects <i>→</i></a><a class="bg" href="${homeUrl()}">Go to the homepage</a></div>
    </div>`;
}
