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
  const hashFor = (ip) => createHash('sha256').update(`ordalin-local-submission:${ip}`).digest('hex');
  const now = Math.floor(Date.now() / 1000);
  // Signed-in submitters: a session cookie per user, plus a device cookie and an IP per request.
  // emailNormalized is what normalizeEmail stores at sign-in (unit-tested separately).
  async function user(id, email, emailNormalized, credits = 0) {
    const token = `token-${id}-${'x'.repeat(24)}`;
    await db.prepare("INSERT INTO users (id, google_sub, email, email_normalized, name, status, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)").bind(id, `sub-${id}`, email, emailNormalized, id, now, now).run();
    await db.prepare('INSERT INTO user_sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(createHash('sha256').update(token).digest('hex'), id, now + 3600, now).run();
    if (credits) await db.prepare("INSERT INTO credit_ledger (id, user_id, delta, kind, reference, note, created_at) VALUES (?, ?, ?, 'purchase', ?, NULL, ?)").bind(`credit-${id}`, id, credits, `capture-${id}`, now).run();
    return token;
  }
  const as = (token, ip, device) => ({ 'cf-connecting-ip': ip, cookie: `ordalin_session=${token}; ordalin_device=${device}` });
  const balance = async (id) => (await db.prepare('SELECT COALESCE(SUM(delta), 0) AS value FROM credit_ledger WHERE user_id = ?').bind(id).first()).value;
  const alice = await user('user-alice', 'al.ice+tools@gmail.com', 'alice@gmail.com', 3);
  const headers = as(alice, '198.51.100.10', 'device-alice-0000000000');
  async function draft(id, ip = '198.51.100.10', domain = id) {
    const website = `https://${domain}.example/`;
    const candidate = { schemaVersion: 1, status: 'pending_review', websiteUrl: website, canonicalDomain: `${domain}.example`, fetchedAt: new Date().toISOString(), identity: { name: null, tagline: null }, assets: [], pricingSignals: [], platforms: [], officialLinks: [], evidencePages: [], warnings: [] };
    const analysis = { schemaVersion: 1, name: 'Runtime tool', tagline: 'A tool for organizing meeting notes.', description: 'This tool organizes meeting notes and keeps them accessible to the entire team in one workspace.', pricingModel: 'unknown', evidence: { identity: [], description: [], pricing: [], classification: [] } };
    await db.prepare("INSERT INTO submission_drafts (id, website_url, canonical_domain, candidate_json, actor_hash, status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)").bind(id, website, candidate.canonicalDomain, JSON.stringify({ schemaVersion: 2, candidate, analysis }), hashFor(ip), now + 600, now, now).run();
  }
  function form(id, choice, image = bytes, funding = 'credit') {
    const data = new FormData();
    const fields = { draftId: id, name: 'Runtime tool', tagline: 'A tool for organizing meeting notes.', description: 'This tool organizes meeting notes and keeps them accessible to the entire team in one workspace.', funding, pricingModel: 'unknown', primaryCategorySlug: 'runtime-group', categorySlugs: '["runtime-group"]', tagSlugs: '["runtime-meeting"]', turnstileToken: 'development-bypass', features: 'My submitted feature.', screenshotChoice: choice };
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
  assert.equal(publication.status, 'published', 'a credit submission goes live straight away');
  assert.equal(publication.url, `/tools/${publication.slug}`);
  assert.equal(await balance('user-alice'), 2, 'a credit submission spends one credit');
  const stored = await db.prepare("SELECT user_id, funding, contact_email FROM submissions WHERE canonical_domain = 'runtime-uploaded.example'").first();
  assert.deepEqual(stored, { user_id: 'user-alice', funding: 'credit', contact_email: 'al.ice+tools@gmail.com' }, 'the submission belongs to the signed-in account');
  const tool = await db.prepare('SELECT * FROM tools WHERE canonical_domain = ?').bind('runtime-uploaded.example').first();
  assert.equal(tool.status, 'published', 'a credit submission is public immediately');
  assert.ok(tool.published_at);
  assert.equal((await db.prepare("SELECT status FROM submissions WHERE canonical_domain = 'runtime-uploaded.example'").first()).status, 'accepted');
  assert.ok(await db.prepare('SELECT 1 FROM tools_fts WHERE tool_id = ?').bind(tool.id).first(), 'a live credit listing is searchable');
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
  assert.equal(response.status, 410, 'submitted drafts cannot capture again');
  await draft('runtime-limited');
  for (let i = 0; i < 3; i++) {
    response = await dispatch('http://localhost/runtime-limited', { method: 'POST', headers });
    assert.equal(response.status, 200);
    await response.arrayBuffer();
  }
  response = await dispatch('http://localhost/runtime-limited', { method: 'POST', headers });
  assert.equal(response.status, 429);
  // Accounts: sign-in, one free submission per person, credits, declined domains.
  await draft('runtime-anonymous', '198.51.100.20');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: { 'cf-connecting-ip': '198.51.100.20' }, body: form('runtime-anonymous', 'none') });
  assert.equal(response.status, 401, 'publishing requires a signed-in account');
  await draft('runtime-free', '198.51.100.21');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(alice, '198.51.100.21', 'device-alice-0000000000'), body: form('runtime-free', 'none', bytes, 'free') });
  assert.equal(response.status, 202, await response.clone().text());
  assert.equal((await db.prepare("SELECT status FROM tools WHERE canonical_domain = 'runtime-free.example'").first()).status, 'pending_review', 'a free submission stays hidden until it is researched');
  assert.equal(await balance('user-alice'), 1, 'the free submission does not touch credits');
  assert.ok(await db.prepare("SELECT 1 FROM free_claims WHERE user_id = 'user-alice'").first(), 'the free submission is recorded');
  await draft('runtime-free-again', '198.51.100.21');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(alice, '198.51.100.21', 'device-alice-0000000000'), body: form('runtime-free-again', 'none', bytes, 'free') });
  assert.equal((await response.json()).code, 'free_used', 'an account gets one free submission');
  const bob = await user('user-bob', 'bob@example.com', 'bob@example.com');
  await draft('runtime-same-device', '203.0.113.30');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(bob, '203.0.113.30', 'device-alice-0000000000'), body: form('runtime-same-device', 'none', bytes, 'free') });
  assert.equal((await response.json()).code, 'free_linked', 'a second account on the same browser gets no free submission');
  const carol = await user('user-carol', 'alice@googlemail.com', 'alice@gmail.com');
  await draft('runtime-same-gmail', '192.0.2.40');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(carol, '192.0.2.40', 'device-carol-0000000000'), body: form('runtime-same-gmail', 'none', bytes, 'free') });
  assert.equal(response.status, 402, 'a dotted or plus Gmail variant gets no free submission');
  await draft('runtime-no-credits', '192.0.2.41');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(carol, '192.0.2.41', 'device-carol-0000000000'), body: form('runtime-no-credits', 'none') });
  assert.equal((await response.json()).code, 'no_credits');
  assert.equal(await db.prepare("SELECT 1 FROM tools WHERE canonical_domain = 'runtime-no-credits.example'").first(), null, 'nothing is stored without a credit');
  assert.equal(await balance('user-carol'), 0);
  await db.prepare("UPDATE tools SET status = 'rejected' WHERE canonical_domain = 'runtime-free.example'").run();
  const dave = await user('user-dave', 'dave@example.org', 'dave@example.org');
  await draft('runtime-declined-free', '192.0.2.50', 'runtime-free');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(dave, '192.0.2.50', 'device-dave-00000000000'), body: form('runtime-declined-free', 'none', bytes, 'free') });
  assert.equal(response.status, 409, 'a declined domain cannot come back as a free submission');
  await draft('runtime-declined-credit', '198.51.100.22', 'runtime-free');
  response = await dispatch('http://localhost/publish', { method: 'POST', headers: as(alice, '198.51.100.22', 'device-alice-0000000000'), body: form('runtime-declined-credit', 'none') });
  assert.equal(response.status, 201, await response.clone().text());
  assert.equal((await db.prepare("SELECT status FROM tools WHERE canonical_domain = 'runtime-free.example'").first()).status, 'published', 'a credit replaces the declined record and goes live');
  assert.equal(await balance('user-alice'), 0);
  console.log('workerd: accounts, free claim guards, credit spend and declined-domain resubmission passed');
  console.log('workerd: private capture, multipart uploads, provenance, live credit / hidden free D1 submission, exact R2 image and capture limit passed');
} finally { await mf.dispose(); }
