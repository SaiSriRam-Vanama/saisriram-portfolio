/**
 * README Markdown -> safe, GitHub-flavoured HTML (build time).
 *
 * Supports headings, paragraphs, ordered/unordered/task lists, bold/italic/strikethrough,
 * tables, fenced code with syntax highlighting, inline code, links, images, blockquotes,
 * horizontal rules, raw HTML (sanitised) and ```mermaid diagrams.
 *
 * Relative links and images are resolved against the GitHub repository, so a README that
 * says `![x](docs/a.png)` or `[env](ENVIRONMENT.md)` keeps working inside the portfolio.
 */
import { Marked } from 'marked';
import hljs from 'highlight.js';
import sanitizeHtml from 'sanitize-html';

export const ID_PREFIX = 'readme-';

/* ---------- small helpers ---------- */

const decodeEntities = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const escapeHtml = (s) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (html) => decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** GitHub's heading-id algorithm (github-slugger): lower-case, drop punctuation, spaces -> hyphens. */
export function githubSlug(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
}

const normalizeName = (s) => s.toLowerCase().replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/[^\p{L}\p{N}]/gu, '');

const isAbsolute = (u) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(u);

/* ---------- main ---------- */

/**
 * @param {string} markdown
 * @param {{owner:string, repo:string, branch?:string, readmePath?:string, projectName?:string}} ctx
 */
export function renderReadme(markdown, { owner, repo, branch = 'HEAD', readmePath = 'README.md', projectName = '' }) {
  const source = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const dir = readmePath.includes('/') ? readmePath.slice(0, readmePath.lastIndexOf('/') + 1) : '';
  const blobBase = `https://github.com/${owner}/${repo}/blob/${branch}/${dir}`;
  const blobRoot = `https://github.com/${owner}/${repo}/blob/${branch}/`;
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dir}`;
  const rawRoot = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;

  const resolve = (url, base, root) => {
    if (isAbsolute(url)) return url;
    if (url.startsWith('/')) return root + url.replace(/^\/+/, '');
    try { return new URL(url, base).href; } catch { return url; }
  };

  const headings = [];
  const seen = new Map();
  const stats = { codeBlocks: 0, diagrams: 0 };
  let droppedTitle = false;

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const text = stripTags(html);
        // The portfolio page already shows the project name as its <h1>. Drop a README title
        // only when it is exactly that name; otherwise keep it (demoted to <h2> later).
        if (depth === 1 && !droppedTitle && projectName && normalizeName(text) === normalizeName(projectName)) {
          droppedTitle = true;
          return '';
        }
        let slug = githubSlug(text);
        const count = seen.get(slug) ?? 0;
        seen.set(slug, count + 1);
        if (count > 0) slug = `${slug}-${count}`;
        const id = ID_PREFIX + slug;
        headings.push({ id, text, level: depth });
        return `<h${depth} id="${id}">${html}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = (lang || '').trim().split(/\s+/)[0].toLowerCase();
        if (language === 'mermaid') {
          stats.diagrams++;
          // The source stays visible as a readable fallback until/unless the diagram renders.
          return `<figure class="diagram" data-mermaid><pre class="diagram-src">${escapeHtml(text)}</pre></figure>\n`;
        }
        stats.codeBlocks++;
        const known = language && hljs.getLanguage(language);
        const body = known ? hljs.highlight(text, { language, ignoreIllegals: true }).value : escapeHtml(text);
        const cls = ['hljs', language && `language-${language}`].filter(Boolean).join(' ');
        return `<pre><code class="${cls}">${body}\n</code></pre>\n`;
      }
    }
  });

  const rawHtml = marked.parse(source);

  /* ---------- sanitise + rewrite URLs ---------- */
  // The page already has an <h1>, so the README's top heading level becomes <h2>
  // (the offset is relative, so removing a duplicate title does not leave a gap at <h2>).
  const topLevel = headings.length ? Math.min(...headings.map((h) => h.level)) : 2;
  const offset = 2 - topLevel;
  const shift = (tagName, attribs) => ({
    tagName: `h${Math.min(Math.max(Number(tagName[1]) + offset, 2), 6)}`,
    attribs
  });

  const clean = sanitizeHtml(rawHtml, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'em', 'strong', 'del', 's', 'b', 'i', 'u', 'sub', 'sup', 'kbd', 'mark', 'small', 'abbr', 'table', 'thead', 'tbody', 'tfoot',
      'tr', 'th', 'td', 'caption', 'details', 'summary', 'figure', 'figcaption', 'div', 'span', 'dl', 'dt', 'dd', 'input'],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'aria-label', 'class'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
      th: ['colspan', 'rowspan', 'align'], td: ['colspan', 'rowspan', 'align'],
      p: ['align'], div: ['align', 'class'], span: ['class'], code: ['class'], pre: ['class'],
      figure: ['class', 'data-mermaid'], li: ['class'], ol: ['start'], details: ['open'],
      input: ['type', 'checked', 'disabled']
    },
    allowedClasses: {
      a: ['anchor'], div: ['table-wrap'], figure: ['diagram'], pre: ['diagram-src'],
      code: ['hljs', 'language-*'], span: ['hljs-*']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === 'input' && frame.attribs.type !== 'checkbox',
    transformTags: {
      h1: shift, h2: shift, h3: shift, h4: shift, h5: shift, h6: shift,
      a: (tagName, attribs) => {
        const href = (attribs.href || '').trim();
        if (!href) return { tagName, attribs: {} };
        if (href.startsWith('#')) {
          // README headings are namespaced (readme-*) so they cannot clash with the portfolio's own ids.
          const frag = href.slice(1);
          const decoded = decodeURIComponent(frag);
          const unprefixed = decoded.startsWith(ID_PREFIX) ? decoded.slice(ID_PREFIX.length) : decoded;
          const normalized = normalizeName(unprefixed);
          const exact = headings.find((heading) => normalizeName(heading.text) === normalized);
          const matches = exact ? [exact] : headings.filter((heading) => normalizeName(heading.text).startsWith(normalized));
          const target = matches.length === 1 ? matches[0].id : (decoded.startsWith(ID_PREFIX) ? decoded : ID_PREFIX + githubSlug(decoded));
          return { tagName, attribs: { ...(attribs.class ? { class: attribs.class } : {}), ...(attribs['aria-label'] ? { 'aria-label': attribs['aria-label'] } : {}), href: `#${target}` } };
        }
        const resolved = resolve(href, blobBase, blobRoot);
        const external = /^https?:/i.test(resolved);
        return { tagName, attribs: { href: resolved, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: resolve(attribs.src || '', rawBase, rawRoot), loading: 'lazy', decoding: 'async' }
      }),
      input: (tagName, attribs) => ({ tagName, attribs: { ...attribs, disabled: 'disabled' } })
    }
  });

  const html = clean.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

  /* ---------- metadata derived from the README itself ---------- */
  const plain = (md) => md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let description = null;
  for (const token of marked.lexer(source)) {
    if (token.type !== 'paragraph' && token.type !== 'blockquote') continue;
    const text = plain(token.raw);
    if (text.length >= 60 && /[a-z]/i.test(text) && !/\s\|\s/.test(text)) { description = text.replace(/:$/, '.'); break; }
  }
  if (description && description.length > 160) {
    description = description.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  }

  const title = headings.find((h) => h.level === 1)?.text ?? null;
  const words = plain(source).split(/\s+/).filter(Boolean).length;
  const count = (re) => (clean.match(re) || []).length;
  const linkCount = (clean.match(/<a /g) || []).length - headings.length;

  return {
    html,
    headings,
    title,
    description,
    droppedTitle,
    stats: {
      ...stats,
      tables: count(/<table/g),
      taskItems: count(/type="checkbox"/g),
      images: count(/<img /g),
      words,
      links: linkCount,
      headings: headings.length
    }
  };
}

/** Which of the project's tags are actually mentioned in its README? (case/punctuation-insensitive) */
export function verifyTags(tags, markdown) {
  const haystack = normalizeName(markdown);
  const verified = [];
  const unverified = [];
  for (const tag of tags) (haystack.includes(normalizeName(tag)) ? verified : unverified).push(tag);
  return { verified, unverified };
}
