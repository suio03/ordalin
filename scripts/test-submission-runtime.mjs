// Exercises the real routes with workerd Request/FormData, D1 transactions and R2.
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = require(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler/package.json'))] }));
const { build } = require(require.resolve('esbuild', { paths: [dirname(require.resolve('vite/package.json'))] }));
const root = resolve(import.meta.dirname, '..');
const bundle = await build({
  stdin: { contents: `
    import { POST as screenshot } from './src/app/api/submissions/drafts/[draftId]/screenshot/route';
    import { POST as publish } from './src/app/api/submissions/publish/route';
    export default { async fetch(request, env, ctx) {
      globalThis.testRuntime = { env: { ...env, BROWSER: { async quickAction() {
        const file = await env.CATALOG_ASSETS.get('fixture.webp');
        return new Response(file.body, { headers: { 'content-type': 'image/webp' } });
      } } }, ctx };
      const url = new URL(request.url);
      return url.pathname === '/publish' ? publish(request) : screenshot(request, { params: Promise.resolve({ draftId: url.pathname.slice(1) }) });
    } };
  `, resolveDir: root, sourcefile: 'submission-runtime.ts', loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
  define: { 'process.env.NODE_ENV': '"test"' },
  plugins: [{ name: 'runtime-bindings', setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/cloudflare$/ }, () => ({ path: 'runtime', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export async function getCloudflareRuntime() { return globalThis.testRuntime; } export async function getCloudflareEnv() { return globalThis.testRuntime.env; }', loader: 'js' }));
  } }],
});
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: "submissions-test", modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-08-23', d1Databases: ['DB'], r2Buckets: ['CATALOG_ASSETS'] }] }));
async function dispatch(url, options) {
  const request = new Request(url, options);
  return mf.dispatchFetch(url, { method: request.method, headers: Object.fromEntries(request.headers), body: await request.arrayBuffer() });
}
try {
  const db = await mf.getD1Database('DB');
  for (const file of (await readdir(resolve(root, 'migrations'))).filter(name => name.endsWith('.sql')).sort()) {
    const sql = await readFile(resolve(root, 'migrations', file), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint').filter(value => value.trim())) await db.exec(statement.split('\n').filter(line => !line.trimStart().startsWith('--')).join(' '));
  }
  await db.prepare("INSERT INTO categories (id, slug, name, description, sort_order, is_active) VALUES ('test-category', 'runtime-group', 'Productivity', '', 1, 1)").run();
  await db.prepare("INSERT INTO tags (id, slug, name, kind, category_group_id, description, is_active) VALUES ('test-tag', 'runtime-meeting', 'Meeting notes', 'category', 'test-category', '', 1)").run();
  const bytes = await sharp({ create: { width: 1440, height: 900, channels: 3, background: '#123456' } }).webp().toBuffer();
  const bucket = await mf.getR2Bucket('CATALOG_ASSETS');
  await bucket.put('fixture.webp', bytes);
  const hash = createHash('sha256').update('ordalin-local-submission:198.51.100.10').digest('hex');
  const headers = { 'cf-connecting-ip': '198.51.100.10' };
  const now = Math.floor(Date.now() / 1000);
  async function draft(id) {
    const website = `https://${id}.example/`;
    const candidate = { schemaVersion: 1, status: 'pending_review', websiteUrl: website, canonicalDomain: `${id}.example`, fetchedAt: new Date().toISOString(), identity: { name: null, tagline: null }, assets: [], pricingSignals: [], platforms: [], officialLinks: [], evidencePages: [], warnings: [] };
    const analysis = { schemaVersion: 1, name: 'Runtime tool', tagline: 'A tool for organizing meeting notes.', description: 'This tool organizes meeting notes and keeps them accessible to the entire team in one workspace.', pricingModel: 'unknown', evidence: { identity: [], description: [], pricing: [], classification: [] } };
    await db.prepare("INSERT INTO submission_drafts (id, website_url, canonical_domain, candidate_json, actor_hash, status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)").bind(id, website, candidate.canonicalDomain, JSON.stringify({ schemaVersion: 2, candidate, analysis }), hash, now + 600, now, now).run();
  }
  function form(id, choice, image = bytes) {
    const data = new FormData();
    const fields = { draftId: id, name: 'Runtime tool', tagline: 'A tool for organizing meeting notes.', description: 'This tool organizes meeting notes and keeps them accessible to the entire team in one workspace.', contactEmail: 'test@example.com', pricingModel: 'unknown', primaryCategorySlug: 'runtime-group', categorySlugs: '["runtime-group"]', tagSlugs: '["runtime-meeting"]', turnstileToken: 'development-bypass', features: 'My submitted feature.', screenshotChoice: choice };
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    if (choice !== 'none') data.set('screenshotFile', new File([image], 'preview.webp', { type: 'image/webp' }));
    return data;
  }
  let oversized = await dispatch('http://localhost/publish', { method: 'POST', headers: { ...headers, 'content-type': 'multipart/form-data; boundary=test' }, body: new Uint8Array(6_500_001) });
  assert.equal(oversized.status, 413, 'body size is enforced even without content-length');
  await draft('runtime-uploaded');
  let response = await dispatch('http://localhost/runtime-uploaded', { method: 'POST', headers: { 'cf-connecting-ip': '198.51.100.11' } });
  assert.equal(response.status, 410, 'another actor must not access the draft');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers, body: form('runtime-uploaded', 'captured') });
  assert.equal(response.status, 400, 'an upload must not claim captured provenance');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers, body: form('runtime-uploaded', 'uploaded') });
  const publication = await response.json();
  assert.equal(response.status, 201, JSON.stringify(publication));
  const tool = await db.prepare('SELECT * FROM tools WHERE slug = ?').bind(publication.slug).first();
  assert.ok(tool.screenshot_asset_key);
  assert.equal(tool.last_checked_at, null, 'manual completion must not imply a website check');
  assert.deepEqual(Buffer.from(await (await bucket.get(tool.screenshot_asset_key)).arrayBuffer()), bytes);
  const source = await db.prepare('SELECT raw_json FROM tool_sources WHERE tool_id = ?').bind(tool.id).first();
  assert.deepEqual(JSON.parse(source.raw_json).confirmed.fields.features, { text: 'My submitted feature.', origin: 'submitter', sources: [], checkedAt: null });
  await draft('runtime-captured');
  response = await dispatch('http://localhost/runtime-captured', { method: 'POST', headers });
  assert.equal(response.status, 200, await response.clone().text());
  const captured = await response.arrayBuffer();
  response = await dispatch('http://localhost/publish', { method: 'POST', headers, body: form('runtime-captured', 'captured', captured) });
  assert.equal(response.status, 201, await response.clone().text());
  response = await dispatch('http://localhost/runtime-captured', { method: 'POST', headers });
  assert.equal(response.status, 410, 'published drafts cannot capture again');
  await draft('runtime-limited');
  for (let i = 0; i < 3; i++) {
    response = await dispatch('http://localhost/runtime-limited', { method: 'POST', headers });
    assert.equal(response.status, 200);
    await response.arrayBuffer();
  }
  response = await dispatch('http://localhost/runtime-limited', { method: 'POST', headers });
  assert.equal(response.status, 429);
  console.log('workerd: private capture, multipart uploads, provenance, D1 publication, exact R2 image and capture limit passed');
} finally { await mf.dispose(); }
