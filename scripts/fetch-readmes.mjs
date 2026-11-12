/**
 * Syncs each project's GitHub README into the portfolio (build-time, server-side).
 *
 *   npm run readmes                  refresh anything older than the cache TTL
 *   npm run readmes -- --force       refetch everything now
 *   npm run readmes -- --rerender    re-render saved READMEs without any network access
 *   npm run readmes -- --only <slug> one project only
 *   npm run readmes -- --strict      exit 1 if any README could not be retrieved
 *
 * Output (committed, so builds and dev work offline):
 *   content/readmes/<slug>.json      rendered, sanitised HTML + metadata (loaded by the case-study page)
 *   content/readmes/raw/<slug>.md    the README exactly as retrieved (diffable source of truth)
 *
 * Environment (all optional):
 *   GITHUB_TOKEN        raises the API rate limit; used only here, never written to any file
 *   README_TTL_HOURS    cache lifetime, default 6
 *   README_OUT_DIR      output folder, default content/readmes
 *   GITHUB_API_URL / GITHUB_RAW_URL   override endpoints (used by the failure-scenario tests)
 *
 * If a README cannot be retrieved the previous snapshot is kept (flagged stale). With no
 * previous snapshot a "missing"/"unavailable" record is written and the page shows the
 * repository link instead. Nothing is ever invented.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTFOLIO } from '../js/data.js';
import { fetchReadme } from './lib/github.mjs';
import { renderReadme, verifyTags } from './lib/markdown.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.env.README_OUT_DIR || 'content/readmes');
const rawDir = path.join(outDir, 'raw');
const ttlMs = Number(process.env.README_TTL_HOURS || 6) * 3600 * 1000;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : '';
const force = flag('--force');
const rerender = flag('--rerender');
const strict = flag('--strict');

fs.mkdirSync(rawDir, { recursive: true });

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const parseRepo = (url) => {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/i.exec(url || '');
  return m ? { owner: m[1], name: m[2].replace(/\.git$/, '') } : null;
};

function buildSnapshot(project, repo, markdown, meta) {
  const rendered = renderReadme(markdown, {
    owner: repo.owner, repo: repo.name, branch: meta.branch, readmePath: meta.path, projectName: project.name
  });
  const tags = verifyTags(project.tags || [], markdown);
  return {
    schema: 1,
    slug: project.slug,
    status: 'ok',
    repo: { owner: repo.owner, name: repo.name, url: `https://github.com/${repo.owner}/${repo.name}` },
    readme: { ...meta, bytes: Buffer.byteLength(markdown, 'utf8') },
    title: rendered.title,
    description: rendered.description,
    droppedTitle: rendered.droppedTitle,
    headings: rendered.headings,
    hasDiagrams: rendered.stats.diagrams > 0,
    stats: rendered.stats,
    verifiedTags: tags.verified,
    unverifiedTags: tags.unverified,
    stale: false,
    html: rendered.html
  };
}

const rows = [];
let failures = 0;

for (const project of PORTFOLIO.projects) {
  if (!project.slug || (only && project.slug !== only)) continue;
  const repo = parseRepo(project.source);
  const snapFile = path.join(outDir, `${project.slug}.json`);
  const rawFile = path.join(rawDir, `${project.slug}.md`);
  const existing = readJson(snapFile);
  const row = { slug: project.slug, repo: repo ? `${repo.owner}/${repo.name}` : '(none)', result: '' };
  rows.push(row);

  if (!repo) {
    writeJson(snapFile, { schema: 1, slug: project.slug, status: 'missing', reason: 'No GitHub repository is configured for this project.', repo: null });
    row.result = 'no repository configured';
    failures++;
    continue;
  }

  /* --rerender: no network, use the saved raw README */
  if (rerender) {
    if (existing?.status === 'ok' && fs.existsSync(rawFile)) {
      writeJson(snapFile, buildSnapshot(project, repo, fs.readFileSync(rawFile, 'utf8'), existing.readme));
      row.result = 're-rendered from saved README';
    } else {
      row.result = 'skipped (nothing saved yet)';
    }
    continue;
  }

  /* cache: skip the network if the snapshot is still fresh */
  const age = existing?.readme?.fetchedAt ? Date.now() - Date.parse(existing.readme.fetchedAt) : Infinity;
  if (!force && existing?.status === 'ok' && !existing.stale && age < ttlMs && fs.existsSync(rawFile)) {
    row.result = `cached (${Math.round(age / 60000)} min old)`;
    continue;
  }

  try {
    const got = await fetchReadme(repo.owner, repo.name, {
      token: process.env.GITHUB_TOKEN || '',
      etag: existing?.status === 'ok' && fs.existsSync(rawFile) ? existing.readme.etag || '' : '',
      branch: existing?.readme?.branch || '',
      apiBase: process.env.GITHUB_API_URL || 'https://api.github.com',
      rawBase: process.env.GITHUB_RAW_URL || 'https://raw.githubusercontent.com'
    });

    let markdown;
    let meta;
    if (got.notModified) {
      markdown = fs.readFileSync(rawFile, 'utf8');
      meta = { ...existing.readme, fetchedAt: new Date().toISOString() };
    } else {
      markdown = got.markdown;
      fs.writeFileSync(rawFile, markdown);
      meta = { path: got.path, htmlUrl: got.htmlUrl, branch: got.branch, sha: got.sha || null, etag: got.etag || null, via: got.via, fetchedAt: new Date().toISOString() };
    }
    writeJson(snapFile, buildSnapshot(project, repo, markdown, meta));
    row.result = got.notModified ? 'unchanged (HTTP 304)' : `fetched via ${got.via}: ${got.path}`;
    if (got.attempts?.length) row.note = got.attempts.join(' -> ');
  } catch (err) {
    failures++;
    const reason = `${err.kind || 'error'}: ${err.message}`;
    if (existing?.status === 'ok') {
      writeJson(snapFile, { ...existing, stale: true, lastError: { reason, at: new Date().toISOString() } });
      row.result = `FAILED, kept previous snapshot (${reason})`;
    } else {
      writeJson(snapFile, {
        schema: 1, slug: project.slug,
        status: err.kind === 'not-found' ? 'missing' : 'unavailable',
        reason, attempts: err.attempts || [],
        repo: { owner: repo.owner, name: repo.name, url: `https://github.com/${repo.owner}/${repo.name}` },
        checkedAt: new Date().toISOString()
      });
      row.result = `FAILED, no previous snapshot (${reason})`;
    }
    if (err.attempts?.length) row.note = err.attempts.join(' -> ');
  }
}

console.log('\nREADME sync');
for (const r of rows) {
  console.log(`  ${r.slug.padEnd(24)} ${r.repo.padEnd(78)} ${r.result}`);
  if (r.note) console.log(`  ${''.padEnd(24)} ${r.note}`);
}
console.log('');
if (strict && failures) process.exit(1);
