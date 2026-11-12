/**
 * Retrieves a repository's README from GitHub (public repos, no auth required).
 *
 * Strategy
 *   1. GitHub REST API  GET /repos/{owner}/{repo}/readme
 *      - returns the real file name, branch and blob SHA
 *      - supports ETag / If-None-Match (a 304 does not count against the rate limit)
 *      - an optional GITHUB_TOKEN raises the rate limit; it is only read here, at build
 *        time, and is never written into any output file
 *   2. raw.githubusercontent.com fallback (not subject to API rate limits) when the API is
 *      rate-limited, unreachable or erroring. It probes the common README file names,
 *      because raw URLs are case-sensitive (e.g. "readme.md" vs "README.md").
 *
 * Every failure is reported as a FetchError with a `kind`, so callers can show an
 * honest message instead of inventing content.
 */
import { setTimeout as sleep } from 'node:timers/promises';

const USER_AGENT = 'portfolio-readme-sync';
const README_NAMES = ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README.markdown', 'readme.markdown'];

export class FetchError extends Error {
  /** @param {'network'|'server'|'rate-limit'|'forbidden'|'not-found'|'http'} kind */
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = 'FetchError';
    this.kind = kind;
    Object.assign(this, extra);
  }
}

async function http(url, { headers = {}, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers }, signal: controller.signal, redirect: 'follow' });
  } catch (err) {
    const reason = err.name === 'AbortError' ? `timed out after ${timeoutMs} ms` : (err.cause?.code || err.message);
    throw new FetchError('network', reason);
  } finally {
    clearTimeout(timer);
  }
}

/** Retries transient failures (network / 5xx) with exponential backoff. */
async function withRetry(fn, { retries = 2, baseMs = 500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const transient = err.kind === 'network' || err.kind === 'server';
      if (!transient || attempt >= retries) throw err;
      await sleep(baseMs * 2 ** attempt);
    }
  }
}

async function viaApi(owner, repo, { token, apiBase, etag }) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (etag) headers['If-None-Match'] = etag;

  const res = await http(`${apiBase}/repos/${owner}/${repo}/readme`, { headers });

  if (res.status === 304) return { notModified: true, etag, via: 'api' };
  if (res.status === 404) throw new FetchError('not-found', 'GitHub reports no README (or no such public repository)');
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');
    if (remaining === '0' || res.status === 429 || res.headers.get('retry-after')) {
      const when = reset ? ` (resets ${new Date(Number(reset) * 1000).toISOString()})` : '';
      throw new FetchError('rate-limit', `GitHub API rate limit reached${when}`);
    }
    throw new FetchError('forbidden', 'GitHub API answered 403');
  }
  if (res.status >= 500) throw new FetchError('server', `GitHub API answered ${res.status}`);
  if (!res.ok) throw new FetchError('http', `GitHub API answered ${res.status}`);

  const json = await res.json();
  const markdown = Buffer.from(json.content || '', json.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
  const branch = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([^/]+)\//.exec(json.download_url || '')?.[1] || 'HEAD';
  return { markdown, path: json.path || json.name, htmlUrl: json.html_url, branch, sha: json.sha, etag: res.headers.get('etag'), via: 'api' };
}

async function viaRaw(owner, repo, { rawBase, branch }) {
  const refs = [...new Set([branch, 'HEAD', 'main', 'master'].filter(Boolean))];

  for (const ref of refs) {
    for (const name of README_NAMES) {
      // Network failures and 5xx abort the whole probe (after retries): probing 20+ more
      // file names against an unreachable or failing server would only stall the build.
      const res = await withRetry(async () => {
        const r = await http(`${rawBase}/${owner}/${repo}/${ref}/${name}`);
        if (r.status >= 500) throw new FetchError('server', `raw.githubusercontent.com answered ${r.status}`);
        return r;
      });
      if (res.status === 200) {
        return {
          markdown: await res.text(),
          path: name,
          htmlUrl: `https://github.com/${owner}/${repo}/blob/${ref}/${name}`,
          branch: ref,
          via: 'raw'
        };
      }
      // 404 for this name: try the next common spelling
    }
  }
  throw new FetchError('not-found', 'no README file found on the default branch');
}

/**
 * @returns {Promise<{markdown?:string, notModified?:boolean, path:string, htmlUrl:string, branch:string, sha?:string, etag?:string, via:'api'|'raw', attempts:string[]}>}
 */
export async function fetchReadme(owner, repo, {
  token = '',
  etag = '',
  branch = '',
  apiBase = 'https://api.github.com',
  rawBase = 'https://raw.githubusercontent.com'
} = {}) {
  const attempts = [];

  try {
    const result = await withRetry(() => viaApi(owner, repo, { token, apiBase, etag }));
    return { ...result, attempts };
  } catch (err) {
    attempts.push(`api: ${err.kind}: ${err.message}`);
    // A clean 404 from the API is authoritative: there is no README to fall back to.
    if (err.kind === 'not-found') throw new FetchError('not-found', err.message, { attempts });
  }

  try {
    const result = await viaRaw(owner, repo, { rawBase, branch });
    return { ...result, attempts };
  } catch (err) {
    attempts.push(`raw: ${err.kind}: ${err.message}`);
    throw new FetchError(err.kind, err.message, { attempts });
  }
}
