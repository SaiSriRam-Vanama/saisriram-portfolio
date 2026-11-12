/**
 * Builds the project cards, skill rows and tech ticker from PORTFOLIO (js/data.js).
 * Must load before js/reveal.js so the generated cards get the scroll-reveal.
 */
import { PORTFOLIO } from './data.js';

(function () {
  'use strict';

  const BASE = import.meta.env.BASE_URL;
  const IMAGE_DIR = `${BASE}assets/images/projects/`;
  const NEW_TAB = ' target="_blank" rel="noopener noreferrer"';

  function tagList(tags, max) {
    const visible = tags.slice(0, max).map((t) => `<span>${t}</span>`).join('');
    const extra = tags.length > max ? `<span>+${tags.length - max}</span>` : '';
    return visible + extra;
  }

  function liveOverlay(p) {
    if (!p.live) return '';
    return `<span class="pl a"><span class="dot"></span>Live</span>` +
      `<a class="pl b" href="${p.live}"${NEW_TAB} aria-label="Open live demo of ${p.name} (opens in a new tab)">Live demo <span>↗</span></a>`;
  }

  function screenshot(p, i) {
    if (p.image) {
      return `<img src="${IMAGE_DIR}${p.image}" alt="${p.alt || 'Screenshot of ' + p.name}" width="1200" height="750" loading="${p.featured ? 'eager' : 'lazy'}">`;
    }
    const bars = PORTFOLIO.mockBars[i].map((w) => `<i style="--w:${w}%"></i>`).join('');
    return `<div class="mk">${bars}</div>`;
  }

  function projectCard(p, i) {
    const maxTags = p.featured ? 4 : 3;
    return `<article class="cd pc rv${p.featured ? ' fe' : ''}">` +
      `<div class="th">${liveOverlay(p)}${screenshot(p, i)}</div>` +
      `<div class="bd">` +
        `<div class="meta"><span class="mono">0${i + 1}${p.featured ? ' · Featured' : ''}</span><span class="mono">${p.category}</span></div>` +
        `<h3>${p.name}</h3>` +
        (p.subtitle ? `<p class="sb">${p.subtitle}</p>` : '') +
        `<p class="ds">${p.description}</p>` +
        `<div class="tgs">${tagList(p.tags, maxTags)}</div>` +
        `<div class="ft">` +
          // Three distinct actions per card: Case study (internal page), View project (GitHub), Live demo (pill on the screenshot).
          (p.source ? `<a class="bg sm" href="${p.source}"${NEW_TAB} aria-label="View ${p.name} on GitHub (opens in a new tab)">View Project <span aria-hidden="true">↗</span></a>` : '') +
          (p.slug && p.caseStudy !== false ? `<a class="bg sm" href="${BASE}projects/${p.slug}" aria-label="Read the ${p.name} case study">Case Study <span aria-hidden="true">↗</span></a>` : '') +
        `</div>` +
      `</div>` +
    `</article>`;
  }

  function skillRow(group) {
    const chips = group.items.map((x) => `<span class="ch">${x}</span>`).join('');
    return `<div class="sk"><span class="mono">${group.group}</span><div>${chips}</div></div>`;
  }

  function fill(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  fill('pg', PORTFOLIO.projects.map(projectCard).join(''));
  fill('sk', PORTFOLIO.skills.map(skillRow).join(''));

  const tickerRow = PORTFOLIO.ticker.map((x) => `${x} <span>·</span>`).join(' ');
  const tickerSequence = Array.from({ length: 3 }, () => tickerRow).join(' ');
  fill('tk', `<span class="tk-group">${tickerSequence}</span><span class="tk-group">${tickerSequence}</span>`);
})();
