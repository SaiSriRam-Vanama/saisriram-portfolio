/**
 * README component.
 *
 * The README is converted to safe HTML at build time (scripts/lib/markdown.mjs). This module
 * mounts that HTML and adds the browser-side behaviour:
 *   - keyboard access to horizontally scrollable tables and code blocks
 *   - ```mermaid diagrams rendered to SVG (Mermaid is loaded lazily, only for pages that have
 *     a diagram, and re-rendered when the visitor switches light/dark theme)
 *   - broken images degrade to their alt text instead of a broken-image icon
 */

let mermaidPromise;
const loadMermaid = () => (mermaidPromise ??= import('mermaid').then((m) => m.default));
let diagramCount = 0;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function configureMermaid(mermaid) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
      fontSize: '14px',
      background: cssVar('--bg'),
      textColor: cssVar('--ink'),
      primaryColor: cssVar('--sf'),
      primaryTextColor: cssVar('--ink'),
      primaryBorderColor: cssVar('--ac'),
      secondaryColor: cssVar('--so'),
      tertiaryColor: cssVar('--alt'),
      lineColor: cssVar('--mu'),
      nodeBorder: cssVar('--ac'),
      clusterBkg: cssVar('--alt'),
      clusterBorder: cssVar('--ln'),
      edgeLabelBackground: cssVar('--bg')
    }
  });
}

async function renderDiagrams(root) {
  const figures = [...root.querySelectorAll('figure.diagram[data-mermaid]')];
  if (!figures.length) return;

  let mermaid;
  try {
    mermaid = await loadMermaid();
  } catch (error) {
    // Offline or chunk failed to load: the readable diagram source stays on the page.
    console.warn('Mermaid could not be loaded:', error);
    figures.forEach((figure) => figure.classList.add('diagram--failed'));
    mermaidPromise = undefined; // allow a retry on the next page
    return;
  }
  configureMermaid(mermaid);

  for (const figure of figures) {
    // Keep the original source so the diagram can be re-rendered after a theme change.
    const source = figure.dataset.source ?? figure.querySelector('.diagram-src')?.textContent ?? '';
    figure.dataset.source = source;
    try {
      const { svg } = await mermaid.render(`readme-diagram-${diagramCount++}`, source);
      figure.innerHTML = svg;
      figure.classList.remove('diagram--failed');
      figure.setAttribute('role', 'img');
      figure.setAttribute('aria-label', 'Diagram from the project README');
    } catch (error) {
      // Leave the readable source in place; never show a broken or empty diagram.
      console.warn('Mermaid diagram could not be rendered:', error);
      figure.classList.add('diagram--failed');
      if (!figure.querySelector('.diagram-src')) {
        figure.innerHTML = '';
        const pre = document.createElement('pre');
        pre.className = 'diagram-src';
        pre.textContent = source;
        figure.append(pre);
      }
    }
  }
}

/* Re-render diagrams when the theme changes (one observer for the whole page). */
let themeObserver;
function watchTheme() {
  if (themeObserver) return;
  themeObserver = new MutationObserver(() => {
    const root = document.querySelector('.readme');
    if (root) renderDiagrams(root);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/**
 * @param {HTMLElement} container element that will hold the README
 * @param {string} html sanitised HTML produced at build time
 * @returns {void} does not wait for diagrams
 */
export function mountReadme(container, html) {
  container.innerHTML = html;

  container.querySelectorAll('.table-wrap, pre').forEach((el) => { el.tabIndex = 0; });

  container.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      const note = document.createElement('span');
      note.className = 'img-failed';
      note.textContent = img.alt ? `[${img.alt}]` : '[image unavailable]';
      img.replaceWith(note);
    }, { once: true });
  });

  watchTheme();
  // Diagrams render in the background: the README is readable immediately, and each diagram
  // shows its source text until the (lazily loaded) Mermaid renderer replaces it.
  renderDiagrams(container);
}
